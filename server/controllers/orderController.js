// controllers/orderController.js
const { getDB } = require("../config/db");

exports.adminListOrders = (_req, res) => {
  const db = getDB();
  const q = `
    SELECT cart.id, cart.user_id, cart.quantity, cart.size, cart.status, cart.order_date, 
           products.id AS product_id, products.code, products.name, products.price, products.image
    FROM cart
    JOIN products ON cart.product_id = products.id
  `;
  db.query(q, (err, results) => {
    if (err) return res.status(500).send("Lỗi server");
    res.json(results);
  });
};

exports.adminUpdateStatus = (req, res) => {
  const db = getDB();
  const { id } = req.params;
  const { status } = req.body;
  db.query("UPDATE cart SET status = ? WHERE id = ?", [status, id], (err) => {
    if (err) return res.status(500).send("Lỗi server");
    res.status(200).json({ message: "Cập nhật trạng thái thành công" });
  });
};
