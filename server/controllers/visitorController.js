// ==============================================================
// TÊN FILE: visitorController.js
// MÔ TẢ: Bộ điều khiển ghi nhận và quản lý nhật ký truy cập (Visitor Logs).
//        - Nhận diện chi tiết thiết bị (Model, HĐH, Trình duyệt).
//        - Phân giải chuẩn xác IP thực (Client IP, Public IP, Loopback).
// ==============================================================

const { getQuery } = require("../config/db");

// Hàm phân tích chi tiết Thiết bị, Hãng máy, Hệ điều hành & Trình duyệt
function parseUserAgent(ua, clientDevice) {
  if (clientDevice && clientDevice.trim()) {
    return clientDevice.trim();
  }
  if (!ua) return "Thiết bị không xác định";

  let os = "HĐH khác";
  let browser = "Trình duyệt khác";
  let deviceName = "";

  // 1. Phân tích chi tiết Model thiết bị
  if (/iPhone/i.test(ua)) {
    deviceName = "Apple iPhone";
  } else if (/iPad/i.test(ua)) {
    deviceName = "Apple iPad";
  } else if (/Macintosh|Mac OS X/i.test(ua)) {
    deviceName = "Apple MacBook / Mac";
  } else {
    // Android device detection (Samsung, Xiaomi, Oppo, Vivo, Realme, v.v.)
    const androidMatch = ua.match(/Android[^;]+;s*([^;)]+)s*[;)]/i);
    if (androidMatch && androidMatch[1]) {
      const model = androidMatch[1].trim();
      if (!/Build|Version|K/i.test(model)) {
        deviceName = model;
      }
    }
    if (!deviceName) {
      if (/Samsung|SM-[A-Z0-9]+/i.test(ua)) deviceName = "Samsung Galaxy";
      else if (/Xiaomi|Redmi|POCO/i.test(ua)) deviceName = "Xiaomi / Redmi";
      else if (/OPPO|CPH[0-9]+/i.test(ua)) deviceName = "OPPO Phone";
      else if (/Vivo|V[0-9]+/i.test(ua)) deviceName = "Vivo Phone";
      else if (/MSI/i.test(ua)) deviceName = "MSI Laptop / PC";
      else if (/ASUS/i.test(ua)) deviceName = "ASUS PC / Laptop";
      else if (/DELL/i.test(ua)) deviceName = "Dell PC / Laptop";
      else if (/HP/i.test(ua)) deviceName = "HP PC / Laptop";
      else if (/Lenovo/i.test(ua)) deviceName = "Lenovo PC / Laptop";
    }
  }

  // 2. Phân tích Hệ điều hành (OS)
  if (/Windows NT 10.0/i.test(ua)) os = "Windows 10/11";
  else if (/Windows NT 6.3/i.test(ua)) os = "Windows 8.1";
  else if (/Windows NT 6.2/i.test(ua)) os = "Windows 8";
  else if (/Windows NT 6.1/i.test(ua)) os = "Windows 7";
  else if (/Macintosh|Mac OS X/i.test(ua)) {
    const macVer = ua.match(/Mac OS X ([0-9_]+)/i);
    os = macVer ? ("macOS " + macVer[1].replace(/_/g, ".")) : "macOS";
  } else if (/iPhone|iPad|iPod/i.test(ua)) {
    const iosVer = ua.match(/OS ([0-9_]+)/i);
    os = iosVer ? ("iOS " + iosVer[1].replace(/_/g, ".")) : "iOS";
  } else if (/Android/i.test(ua)) {
    const andVer = ua.match(/Androids+([0-9.]+)/i);
    os = andVer ? ("Android " + andVer[1]) : "Android";
  } else if (/Linux/i.test(ua)) os = "Linux";

  // 3. Phân tích Trình duyệt (Browser)
  if (/Edg/i.test(ua)) browser = "Edge";
  else if (/Chrome/i.test(ua) && !/Edg|OPR|Opera/i.test(ua)) browser = "Chrome";
  else if (/Safari/i.test(ua) && !/Chrome|Edg|OPR/i.test(ua)) browser = "Safari";
  else if (/Firefox/i.test(ua)) browser = "Firefox";
  else if (/OPR/|Opera/i.test(ua)) browser = "Opera";
  else if (/CocCoc/i.test(ua)) browser = "Cốc Cốc";

  if (deviceName) {
    return deviceName + " · " + os + " (" + browser + ")";
  }
  return os + " · " + browser;
}

// Hàm chuẩn hóa địa chỉ IP
function normalizeIP(ip, clientIP) {
  if (clientIP && clientIP.trim() && !clientIP.includes("::1") && !clientIP.includes("127.0.0.1")) {
    return clientIP.trim();
  }
  if (!ip) return "127.0.0.1 (Localhost)";
  let cleaned = ip;
  if (cleaned.includes(",")) {
    cleaned = cleaned.split(",")[0].trim();
  }
  if (cleaned === "::1" || cleaned === "::ffff:127.0.0.1" || cleaned === "127.0.0.1") {
    return "127.0.0.1 (Localhost)";
  }
  if (cleaned.startsWith("::ffff:")) {
    cleaned = cleaned.replace("::ffff:", "");
  }
  return cleaned;
}

// 1. Ghi nhận lượt truy cập từ Client
exports.trackVisit = async (req, res) => {
  const { page_url, user_id, client_ip, client_device, hardware_info } = req.body;

  let rawIp = req.headers["cf-connecting-ip"] ||
              req.headers["x-real-ip"] ||
              req.headers["x-forwarded-for"] ||
              req.socket.remoteAddress;

  const ip = normalizeIP(rawIp, client_ip);
  const userAgent = req.headers["user-agent"] || "";
  let deviceInfo = parseUserAgent(userAgent, client_device);

  // Nếu trình duyệt gửi thông tin card đồ họa / phần cứng
  if (hardware_info && typeof hardware_info === "string") {
    let hwName = "";
    if (/NVIDIA/i.test(hardware_info)) {
      const gpu = hardware_info.match(/(?:GeForce|RTX|GTX)s*[A-Za-z0-9s]+/i);
      hwName = gpu ? gpu[0].trim() : "NVIDIA PC/Laptop";
    } else if (/AMD|Radeon/i.test(hardware_info)) {
      const gpu = hardware_info.match(/Radeons*[A-Za-z0-9s]+/i);
      hwName = gpu ? gpu[0].trim() : "AMD Radeon PC/Laptop";
    } else if (/Intel/i.test(hardware_info)) {
      const gpu = hardware_info.match(/Intel[^(]+/i);
      hwName = gpu ? gpu[0].trim() : "Intel PC/Laptop";
    } else if (/Apple/i.test(hardware_info)) {
      hwName = "Apple M-Series";
    }

    if (hwName) {
      deviceInfo = hwName + " · " + deviceInfo;
    }
  }


  try {
    const query = getQuery();

    await query(
      `
      INSERT INTO visitor_logs (user_id, ip_address, user_agent, device_info, page_url, visited_at)
      VALUES (?, ?, ?, ?, ?, NOW())
      `,
      [user_id || null, ip, userAgent, deviceInfo, page_url || "/"]
    );

    let userName = "Khách vãng lai";
    if (user_id) {
      const users = await query("SELECT name FROM users WHERE id = ?", [user_id]);
      if (users && users.length > 0) {
        userName = users[0].name;
      }
    }

    const logData = {
      user_name: userName,
      ip_address: ip,
      device_info: deviceInfo,
      page_url: page_url || "/",
      visited_at: new Date()
    };

    const io = req.app.get("io") || global.io;
    if (io) {
      io.emit("newVisitor", logData);
    }

    res.json({ success: true, message: "Ghi nhận truy cập thành công" });
  } catch (err) {
    console.error("Lỗi khi ghi nhận trackVisit:", err);
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
};

// 2. Lấy 100 lượt truy cập mới nhất (Chỉ Admin)
exports.getVisitorLogs = async (req, res) => {
  try {
    const query = getQuery();

    const logs = await query(
      `
      SELECT 
        v.id,
        v.ip_address,
        v.device_info,
        v.page_url,
        v.visited_at,
        v.user_id,
        u.name AS user_name,
        u.email AS user_email
      FROM visitor_logs v
      LEFT JOIN users u ON v.user_id = u.id
      ORDER BY v.visited_at DESC
      LIMIT 100
      `
    );

    res.json({ success: true, data: logs });
  } catch (err) {
    console.error("Lỗi khi lấy getVisitorLogs:", err);
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
};
