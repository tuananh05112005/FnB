// ==============================================================
// TÊN FILE: statsController.js
// MÔ TẢ: Controller thống kê (Statistics) dữ liệu kinh doanh của quán.
//        Thực hiện tổng hợp doanh thu thực tế (đơn đã giao thành công 'received'),
//        chỉ số tổng quan (số khách hàng, số cốc nước đã bán, số đơn hủy),
//        và tìm ra top 5 sản phẩm bán chạy nhất trong hệ thống.
// ==============================================================

const { getDB, getQuery } = require("../config/db");

/**
 * revenue: API tính tổng doanh thu của quán từ các đơn hàng đã hoàn tất giao thành công (GET /api/admin/revenue).
 */
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

/**
 * overview: API tổng hợp các chỉ số KPI cơ bản hiển thị lên Dashboard của Admin (GET /api/admin/statistics).
 * - totalUsers: Tổng số người dùng đăng ký có vai trò là khách hàng
 * - totalProductsSold: Tổng số lượng ly nước/bánh ngọt đã bán (status = 'received')
 * - totalRevenue: Tổng doanh thu bán hàng thực tế
 * - totalCancelledOrders: Tổng số lượng đơn hàng đã bị hủy bỏ
 */
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

/**
 * topProducts: API lấy danh sách 5 món ăn/đồ uống bán chạy nhất (được đặt hàng nhiều nhất) (GET /api/admin/top-products).
 */
exports.topProducts = async (_req, res) => {
  try {
    const query = getQuery();

    const result = await query(`
      SELECT
        products.id,
        products.name,
        COUNT(*) as total
      FROM cart
      JOIN products ON cart.product_id = products.id
      WHERE cart.status = 'received'
      GROUP BY products.id
      ORDER BY total DESC
      LIMIT 5
    `);

    res.json(result);

  } catch (error) {
    console.error("Lỗi top sản phẩm:", error);
    res.status(500).json({
      message: "Lỗi server"
    });
  }
};
