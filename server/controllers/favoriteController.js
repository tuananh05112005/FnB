// ==============================================================
// TÊN FILE: favoriteController.js
// MÔ TẢ: Bộ điều khiển xử lý danh sách sản phẩm yêu thích (Favorite Products).
//        - Thêm sản phẩm yêu thích của người dùng (sử dụng INSERT IGNORE để tránh trùng lặp).
//        - Lấy danh sách sản phẩm yêu thích của một người dùng.
//        - Xóa sản phẩm khỏi danh sách yêu thích của người dùng.
// ==============================================================

const { getQuery } = require("../config/db");

// Thêm sản phẩm vào danh sách yêu thích của người dùng
exports.add = async (req, res) => {
  const { user_id, product_id } = req.body;
  if (!user_id || !product_id) return res.status(400).send("Thiếu thông tin");
  try {
    const query = getQuery();
    // INSERT IGNORE giúp bỏ qua việc chèn dòng mới nếu cặp (user_id, product_id) đã tồn tại (khóa duy nhất)
    await query("INSERT IGNORE INTO favorites (user_id, product_id) VALUES (?, ?)", [
      user_id,
      product_id,
    ]);
    res.send("Đã thêm vào yêu thích");
  } catch (err) {
    console.error(err);
    res.status(500).send("Lỗi server");
  }
};

// Lấy danh sách toàn bộ các sản phẩm yêu thích của người dùng
exports.list = async (req, res) => {
  const { user_id } = req.params;
  try {
    const query = getQuery();
    const results = await query(
      `SELECT p.* FROM favorites f
       JOIN products p ON f.product_id = p.id
       WHERE f.user_id = ?`,
      [user_id]
    );
    res.json(results);
  } catch (err) {
    console.error(err);
    res.status(500).send("Lỗi server");
  }
};

// Xóa sản phẩm ra khỏi danh sách yêu thích của người dùng
exports.remove = async (req, res) => {
  const { user_id, product_id } = req.body;
  if (!user_id || !product_id) return res.status(400).send("Thiếu thông tin");
  try {
    const query = getQuery();
    await query("DELETE FROM favorites WHERE user_id = ? AND product_id = ?", [
      user_id,
      product_id,
    ]);
    res.send("Đã xóa khỏi yêu thích");
  } catch (err) {
    console.error(err);
    res.status(500).send("Lỗi server");
  }
};
