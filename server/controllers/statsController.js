// controllers/statsController.js
const { getDB, getQuery } = require("../config/db");

exports.revenue = (_req, res) => {
  const db = getDB();
  const q = `
    SELECT SUM(products.price * cart.quantity) AS total_revenue
    FROM cart
    JOIN products ON cart.product_id = products.id
    WHERE cart.status = 'received'
  `;
  db.query(q, (err, results) => {
    if (err) return res.status(500).send("Lỗi server");
    res.json(results[0]);
  });
};

exports.overview = async (_req, res) => {
  try {
    const query = getQuery();

    const totalUsers = (await query("SELECT COUNT(*) as total FROM users WHERE role = 'user'"))[0].total;
    const totalProductsSold = (await query("SELECT SUM(quantity) as total FROM cart WHERE status = 'received'"))[0].total || 0;
    const totalRevenue = (await query(
      "SELECT SUM(products.price * cart.quantity) as total FROM cart JOIN products ON cart.product_id = products.id WHERE cart.status = 'received'"
    ))[0].total || 0;
    const totalCancelledOrders = (await query("SELECT COUNT(*) as total FROM cart WHERE status = 'cancelled'"))[0].total || 0;

    res.json({ totalUsers, totalProductsSold, totalRevenue, totalCancelledOrders });
  } catch (error) {
    console.error("Lỗi khi lấy thống kê:", error);
    res.status(500).json({ message: "Lỗi server" });
  }
};
