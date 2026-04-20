// controllers/cartController.js
const { getDB } = require("../config/db");

exports.add = (req, res) => {
  const db = getDB();
  const { user_id, product_id, quantity, size } = req.body;
  const q = "INSERT INTO cart (user_id, product_id, quantity, size) VALUES (?, ?, ?, ?)";
  db.query(q, [user_id, product_id, quantity, size], (err, results) => {
    if (err) return res.status(500).send("Lỗi server");
    res.status(201).json({ id: results.insertId, ...req.body });
  });
};

exports.listByUser = (req, res) => {
  const db = getDB();
  const { user_id } = req.params;
  const q = `
    SELECT cart.id, cart.quantity, cart.size, cart.status, cart.order_date, 
           products.id AS product_id, products.code, products.name, products.price, products.image
    FROM cart
    JOIN products ON cart.product_id = products.id
    WHERE cart.user_id = ?
  `;
  db.query(q, [user_id], (err, results) => {
    if (err) return res.status(500).send("Lỗi server");
    res.json(results);
  });
};

exports.updateQty = (req, res) => {
  const db = getDB();
  const { id } = req.params;
  const { quantity } = req.body;
  if (!id || !quantity || isNaN(quantity)) {
    return res.status(400).json({ error: "Dữ liệu không hợp lệ" });
    }
  db.query("UPDATE cart SET quantity = ? WHERE id = ?", [quantity, id], (err) => {
    if (err) return res.status(500).send("Lỗi server");
    res.status(200).json({ message: "Cập nhật số lượng thành công" });
  });
};

exports.updateStatus = (req, res) => {
  const db = getDB();
  const { id } = req.params;
  const { status } = req.body;
  db.query("UPDATE cart SET status = ? WHERE id = ?", [status, id], (err) => {
    if (err) return res.status(500).send("Lỗi server");
    res.status(200).json({ message: "Cập nhật trạng thái thành công" });
  });
};

exports.checkoutItem = (req, res) => {
  const db = getDB();
  const { id } = req.params;
  db.query("UPDATE cart SET status = 'completed' WHERE id = ?", [id], (err) => {
    if (err) return res.status(500).send("Lỗi server");
    res.status(200).json({ message: "Thanh toán thành công" });
  });
};

exports.received = (req, res) => {
  const db = getDB();
  const { id } = req.params;
  db.query("UPDATE cart SET status = 'received' WHERE id = ?", [id], (err, results) => {
    if (err) return res.status(500).json({ message: "Lỗi server" });
    if (!results.affectedRows) return res.status(404).json({ message: "Đơn hàng không tồn tại" });
    res.status(200).json({ message: "Cập nhật trạng thái thành công" });
  });
};

exports.cancel = (req, res) => {
  const db = getDB();
  const { id } = req.params;
  const { cancellation_reason } = req.body;
  db.query(
    "UPDATE cart SET status = 'cancelled', cancellation_reason = ? WHERE id = ?",
    [cancellation_reason, id],
    (err) => {
      if (err) return res.status(500).send("Lỗi server");
      res.status(200).json({ message: "Hủy đơn hàng thành công" });
    }
  );
};
