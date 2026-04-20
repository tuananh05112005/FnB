const { getQuery } = require("../config/db");

exports.create = async (req, res) => {
  const { user_id, product_id, rating, comment } = req.body;

  if (!user_id || !product_id || !rating) {
    return res.status(400).json({ message: "Thieu thong tin bat buoc" });
  }

  try {
    const query = getQuery();
    await query(
      "INSERT INTO reviews (user_id, product_id, rating, comment, created_at) VALUES (?, ?, ?, ?, NOW())",
      [user_id, product_id, rating, comment || null]
    );

    res.json({ message: "Da them danh gia thanh cong" });
  } catch (err) {
    console.error("Loi khi them review:", err);
    res.status(500).json({ message: "Loi server" });
  }
};

exports.listByProduct = async (req, res) => {
  const { product_id } = req.params;

  try {
    const query = getQuery();
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
    console.error("Loi khi lay reviews:", err);
    res.status(500).json({ message: "Loi server" });
  }
};

exports.average = async (req, res) => {
  const { product_id } = req.params;

  try {
    const query = getQuery();
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
    console.error("Loi khi tinh rating:", err);
    res.status(500).json({ message: "Loi server" });
  }
};

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
    console.error("Loi khi tinh trung binh rating:", err);
    res.status(500).json({ error: "Loi khi tinh trung binh rating" });
  }
};
