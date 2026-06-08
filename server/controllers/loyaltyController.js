// ==============================================================
// TÊN FILE: loyaltyController.js
// MÔ TẢ: Controller quản lý hệ thống Khách hàng thân thiết (Loyalty & Notifications).
//        Xử lý các nghiệp vụ liên quan đến điểm tích lũy thành viên (cộng điểm theo đơn),
//        truy vấn ví điểm (wallet) gồm điểm tích lũy, danh sách voucher cá nhân,
//        tải hòm thư thông báo (giới hạn 30 tin nhắn mới nhất), và cập nhật trạng thái đã đọc
//        (tất cả hoặc từng thông báo cụ thể).
// ==============================================================

const { getQuery } = require("../config/db");

/**
 * addPoints: API cộng điểm thưởng tích lũy cho người dùng dựa trên hóa đơn thanh toán (POST /api/loyalty/add-points).
 * Tiêu chí quy đổi: Cộng 1 điểm cho mỗi 10.000 VNĐ chi tiêu.
 */
exports.addPoints = async (req, res) => {
  const { user_id, amount } = req.body;

  try {
    const query = getQuery();
    const pointsEarned = Math.floor(amount / 10000);

    await query("UPDATE users SET points = points + ? WHERE id = ?", [
      pointsEarned,
      user_id,
    ]);

    res.json({ message: "Da cong diem", pointsEarned });
  } catch (err) {
    console.error("Loi cong diem:", err);
    res.status(500).json({ error: "Loi cong diem" });
  }
};

/**
 * wallet: API lấy ví thông tin tổng hợp của khách hàng (GET /api/loyalty/:user_id).
 * Trả về đồng thời:
 * - points: Điểm tích lũy hiện có của user
 * - vouchers: Danh sách voucher mà user sở hữu (khớp từ bảng trung gian user_vouchers)
 * - notifications: Danh sách tối đa 30 thông báo gần nhất của user (sắp xếp giảm dần theo thời gian tạo)
 */
exports.wallet = async (req, res) => {
  const { user_id } = req.params;

  try {
    const query = getQuery();

    const pointsRes = await query("SELECT points FROM users WHERE id = ?", [user_id]);
    const points = pointsRes.length ? pointsRes[0].points : 0;

    const vouchers = await query(
      `SELECT v.*, uv.is_used
       FROM vouchers v
       JOIN user_vouchers uv ON uv.voucher_id = v.id
       WHERE uv.user_id = ?`,
      [user_id]
    );

    const notifications = await query(
      "SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 30",
      [user_id]
    );

    res.json({ points, vouchers, notifications });
  } catch (err) {
    console.error("Loi API /api/loyalty:", err);
    res.status(500).json({ error: "Loi server khi lay vi tich diem" });
  }
};

/**
 * markNotificationsRead: API đánh dấu đã đọc tất cả thông báo của một người dùng (PUT /api/notifications/read/:user_id).
 */
exports.markNotificationsRead = async (req, res) => {
  const { user_id } = req.params;

  try {
    const query = getQuery();
    await query("UPDATE notifications SET is_read = 1 WHERE user_id = ?", [user_id]);

    res.json({
      success: true,
      message: "Da danh dau da doc",
    });
  } catch (err) {
    console.error("Loi update notification:", err);
    res.status(500).json({ error: "Loi server" });
  }
};

/**
 * markSingleNotificationRead: API đánh dấu đã đọc cho một thông báo cụ thể thông qua ID thông báo (PUT /api/notifications/read-single/:id).
 */
exports.markSingleNotificationRead = async (req, res) => {
  const { id } = req.params;

  try {
    const query = getQuery();
    await query("UPDATE notifications SET is_read = 1 WHERE id = ?", [id]);

    res.json({
      success: true,
      message: "Da danh dau da doc thong bao",
    });
  } catch (err) {
    console.error("Loi update single notification:", err);
    res.status(500).json({ error: "Loi server" });
  }
};
