// ==============================================================
// TÊN FILE: visitorController.js
// MÔ TẢ: Bộ điều khiển ghi nhận và quản lý nhật ký truy cập (Visitor Logs).
//        - Ghi nhận lượt truy cập (IP, Thiết bị, Trình duyệt, Trang đang xem).
//        - Phát socket thông báo thời gian thực.
//        - Lấy lịch sử 100 lượt truy cập mới nhất dành cho Admin.
// ==============================================================

const { getQuery } = require("../config/db");

// Hàm phụ để phân tích chuỗi User-Agent thành tên Hệ điều hành & Trình duyệt thân thiện
function parseUserAgent(ua) {
  if (!ua) return "Thiết bị không xác định";
  let os = "HĐH khác";
  let browser = "Trình duyệt khác";

  // Phân tích Hệ điều hành (OS)
  if (ua.includes("Windows NT 10.0")) os = "Windows 10/11";
  else if (ua.includes("Windows NT 6.1")) os = "Windows 7";
  else if (ua.includes("Windows NT 6.2") || ua.includes("Windows NT 6.3")) os = "Windows 8";
  else if (ua.includes("Macintosh") || ua.includes("Mac OS X")) os = "macOS";
  else if (ua.includes("iPhone") || ua.includes("iPad")) os = "iOS";
  else if (ua.includes("Android")) os = "Android";
  else if (ua.includes("Linux")) os = "Linux";

  // Phân tích Trình duyệt (Browser)
  if (ua.includes("Edg/")) browser = "Edge";
  else if (ua.includes("Chrome/") && ua.includes("Safari/")) browser = "Chrome";
  else if (ua.includes("Safari/") && !ua.includes("Chrome/")) browser = "Safari";
  else if (ua.includes("Firefox/")) browser = "Firefox";
  else if (ua.includes("OPR/") || ua.includes("Opera/")) browser = "Opera";

  // Phân tích Thiết bị cụ thể
  let device = "";
  if (ua.includes("iPhone")) device = " (iPhone)";
  else if (ua.includes("iPad")) device = " (iPad)";
  else if (ua.includes("Mobile")) device = " (Mobile)";

  return `${os} - ${browser}${device}`;
}

// 1. Ghi nhận lượt truy cập từ Client
exports.trackVisit = async (req, res) => {
  const { page_url, user_id } = req.body;

  // Lấy địa chỉ IP (hỗ trợ đọc qua proxy Render/Cloudflare)
  let ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
  if (ip && ip.includes(",")) {
    ip = ip.split(",")[0].trim();
  }

  const userAgent = req.headers["user-agent"] || "";
  const deviceInfo = parseUserAgent(userAgent);

  try {
    const query = getQuery();

    // Chèn nhật ký truy cập vào bảng visitor_logs
    await query(
      `
      INSERT INTO visitor_logs (user_id, ip_address, user_agent, device_info, page_url, visited_at)
      VALUES (?, ?, ?, ?, ?, NOW())
      `,
      [user_id || null, ip, userAgent, deviceInfo, page_url || "/"]
    );

    // Lấy tên người dùng nếu có user_id
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

    // Phát socket thời gian thực báo cho Admin
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
