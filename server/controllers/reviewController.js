// ==============================================================
// TÊN FILE: reviewController.js
// MÔ TẢ: Bộ điều khiển quản lý đánh giá món ăn từ khách hàng (Product Reviews).
//        - Tạo đánh giá mới (bao gồm số sao rating và bình luận comment).
//        - Lấy danh sách đánh giá của sản phẩm kèm tên người dùng.
//        - Tính toán điểm số rating trung bình của một món ăn.
// ==============================================================

const { getQuery } = require("../config/db");

// Tạo đánh giá mới cho món ăn
exports.create = async (req, res) => {
  const { user_id, product_id, rating, comment } = req.body;

  if (!user_id || !product_id || !rating) {
    return res.status(400).json({ message: "Thiếu thông tin bắt buộc" });
  }

  try {
    const query = getQuery();
    // Chèn bản ghi mới vào bảng reviews
    await query(
      "INSERT INTO reviews (user_id, product_id, rating, comment, created_at) VALUES (?, ?, ?, ?, NOW())",
      [user_id, product_id, rating, comment || null]
    );

    res.json({ message: "Đã thêm đánh giá thành công" });
  } catch (err) {
    console.error("Lỗi khi thêm review:", err);
    res.status(500).json({ message: "Lỗi server" });
  }
};

// Lấy danh sách toàn bộ đánh giá của một món ăn cụ thể
exports.listByProduct = async (req, res) => {
  const { product_id } = req.params;

  try {
    const query = getQuery();
    // Kết nối bảng reviews và bảng users để lấy tên hiển thị của người đánh giá
    const reviews = await query(
      `SELECT r.*, u.name AS user_name
       FROM reviews r
       JOIN users u ON r.user_id = u.id
       WHERE r.product_id = ?
       ORDER BY r.created_at DESC`,
      [product_id]
    );

    res.json(reviews);
  } catch (err) {
    console.error("Lỗi khi lấy reviews:", err);
    res.status(500).json({ message: "Lỗi server" });
  }
};

// Tính toán điểm số đánh giá trung bình và tổng số lượt đánh giá của món ăn
exports.average = async (req, res) => {
  const { product_id } = req.params;

  try {
    const query = getQuery();
    // AVG() tính trung bình cộng số sao, COALESCE() thay thế giá trị NULL thành 0 nếu chưa có đánh giá
    const rows = await query(
      `SELECT
         COALESCE(AVG(rating), 0) AS avg_rating,
         COUNT(*) AS total_reviews
       FROM reviews
       WHERE product_id = ?`,
      [product_id]
    );

    res.json(rows[0]);
  } catch (err) {
    console.error("Lỗi khi tính rating:", err);
    res.status(500).json({ message: "Lỗi server" });
  }
};

// API tính toán trung bình đánh giá cũ (giữ lại để tương thích với các component frontend cũ)
exports.averageLegacy = async (req, res) => {
  const { product_id } = req.params;

  try {
    const query = getQuery();
    const rows = await query(
      `SELECT
         IFNULL(AVG(rating), 0) AS avgRating,
         COUNT(*) AS totalReviews
       FROM reviews
       WHERE product_id = ?`,
      [product_id]
    );

    res.json(rows[0]);
  } catch (err) {
    console.error("Lỗi khi tính trung bình rating:", err);
    res.status(500).json({ error: "Lỗi khi tính trung bình rating" });
  }
};
