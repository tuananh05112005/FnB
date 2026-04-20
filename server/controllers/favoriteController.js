// controllers/favoriteController.js
const { getQuery } = require("../config/db");

exports.add = async (req, res) => {
  const { user_id, product_id } = req.body;
  if (!user_id || !product_id) return res.status(400).send("Thiếu thông tin");
  try {
    const query = getQuery();
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
