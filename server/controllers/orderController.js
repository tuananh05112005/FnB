// ==============================================================
// TÊN FILE: orderController.js
// MÔ TẢ: Bộ điều khiển quản lý đơn đặt hàng dành cho Admin/Staff (Order Management).
//        - Lấy toàn bộ danh sách đơn đặt hàng từ bảng `cart` ghép thông tin với bảng `products`.
//        - Cập nhật trạng thái đơn hàng (Đang xử lý, Đang chuẩn bị/Đang giao, Đã giao thành công, Đã hủy).
//        - Ghi nhật ký thông báo trạng thái mới vào Database cho khách hàng.
//        - Phát tín hiệu Socket.io thời gian thực báo cho khách hàng khi trạng thái đơn hàng thay đổi.
// ==============================================================

const { getDB } = require("../config/db");

// Lấy danh sách toàn bộ đơn đặt hàng trong hệ thống (phục vụ màn hình Admin)
exports.adminListOrders = (_req, res) => {
  const db = getDB();
  const q = `
    SELECT cart.id, cart.user_id, cart.quantity, cart.size, cart.status, cart.order_date, cart.order_code,
           products.id AS product_id, products.code, products.name, products.price, products.image,
           users.name AS user_name, users.email AS user_email
    FROM cart
    JOIN products ON cart.product_id = products.id
    LEFT JOIN users ON cart.user_id = users.id
  `;
  db.query(q, (err, results) => {
    if (err) return res.status(500).send("Lỗi server");
    res.json(results);
  });
};

// Hàm tiện ích chuyển đổi mã trạng thái đơn hàng sang tiếng Việt dễ đọc
const translateStatus = (status) => {
  switch (status) {
    case "pending": return "Đang xử lý";
    case "completed": return "Đang chuẩn bị / Đang giao";
    case "received": return "Đã giao thành công";
    case "cancelled": return "Đã hủy";
    default: return status;
  }
};

// Cập nhật trạng thái đơn đặt hàng (Admin/Staff duyệt đơn)
exports.adminUpdateStatus = (req, res) => {
  const db = getDB();
  const { id } = req.params;     // ID giỏ hàng hoặc order_code cần cập nhật
  const { status } = req.body;   // Trạng thái mới cần cập nhật

  // Tìm order_code tương ứng để cập nhật đồng bộ cả đơn hàng
  const qFind = isNaN(id)
    ? "SELECT order_code, user_id FROM cart WHERE order_code = ? LIMIT 1"
    : "SELECT order_code, user_id FROM cart WHERE id = ? LIMIT 1";

  db.query(qFind, [id], (selectErr, results) => {
    if (selectErr) return res.status(500).send("Lỗi server");
    if (!results || !results.length) return res.status(404).send("Không tìm thấy đơn hàng");

    const { order_code, user_id } = results[0];

    // Cập nhật tất cả sản phẩm trong cùng một đơn hàng
    db.query("UPDATE cart SET status = ? WHERE order_code = ?", [status, order_code], (err) => {
      if (err) return res.status(500).send("Lỗi server");

      // Lưu thông tin thay đổi trạng thái vào bảng notifications (thông báo khách hàng)
      db.query(
        "INSERT INTO notifications (user_id, message) VALUES (?, ?)",
        [user_id, `Đơn hàng #${order_code} của bạn đã chuyển sang trạng thái: ${translateStatus(status)}.`],
        (notifyErr) => {
          if (notifyErr) console.error("Lỗi lưu thông báo:", notifyErr);
        }
      );

      // Phát sự kiện Socket.io real-time đến Client của User tương ứng để cập nhật UI ngay lập tức
      if (global.io) {
        global.io.to(`user:${user_id}`).emit("orderStatusUpdated", {
          orderId: order_code,
          status: status
        });
      }

      res.status(200).json({ message: "Cập nhật trạng thái thành công" });
    });
  });
};
