// controllers/productController.js
const { getDB, getQuery } = require("../config/db");

exports.list = (req, res) => {
  const db = getDB();
  const { category } = req.query;

  let q = "SELECT * FROM products";
  const values = [];
  if (category) {
    q += " WHERE LOWER(category) LIKE LOWER(?)";
    values.push(`%${category}%`); // 👈 thêm %
  }

  console.log("SQL query:", q, values); // 👈 log ra để check
  db.query(q, values, (err, results) => {
    if (err) {
      console.error("Lỗi truy vấn sản phẩm:", err);
      return res.status(500).send("Lỗi server");
    }
    console.log("Kết quả:", results); // 👈 log kết quả từ DB
    res.json(results);
  });
};


exports.detail = (req, res) => {
  const db = getDB();
  const productId = req.params.id;
  db.query("SELECT * FROM products WHERE id = ?", [productId], (err, results) => {
    if (err) return res.status(500).send("Lỗi server");
    if (!results.length) return res.status(404).send("Không tìm thấy sản phẩm");
    res.json(results[0]);
  });
};

exports.create = (req, res) => {
  const db = getDB();
  const { image, code, name, price, description, size, category } = req.body;
  const q = `
    INSERT INTO products (image, code, name, price, description, size, category)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;
  db.query(q, [image, code, name, price, description, size, category], (err, results) => {
    if (err) {
      console.error("Lỗi khi thêm sản phẩm:", err);
      return res.status(500).send("Lỗi server");
    }
    res.status(201).json({ id: results.insertId, ...req.body });
  });
};

exports.update = async (req, res) => {
  const query = getQuery();
  const productId = req.params.id;
  const updatedProduct = req.body;

  try {
    const [oldProduct] = await query("SELECT * FROM products WHERE id = ?", [productId]);
    if (!oldProduct) return res.status(404).json({ message: "Không tìm thấy sản phẩm" });

    const duplicate = await query(
      "SELECT * FROM products WHERE (code = ? OR name = ?) AND id != ?",
      [updatedProduct.code, updatedProduct.name, productId]
    );
    if (duplicate.length > 0) {
      return res.status(400).json({ message: "Mã hoặc tên sản phẩm đã tồn tại" });
    }

    await query("UPDATE products SET ? WHERE id = ?", [updatedProduct, productId]);

    const changes = {};
    ["name", "price", "description", "size", "code", "image"].forEach((f) => {
      if (oldProduct[f] !== updatedProduct[f]) {
        changes[f] = { from: oldProduct[f], to: updatedProduct[f] };
      }
    });

    await query(
      "INSERT INTO product_edit_logs (product_id, edited_by, changed_fields) VALUES (?, ?, ?)",
      [productId, (req.user && req.user.id) || "staff", JSON.stringify(changes)]
    );

    res.status(200).json({ message: "Cập nhật thành công", changes });
  } catch (error) {
    console.error("Lỗi cập nhật sản phẩm:", error);
    res.status(500).json({ message: "Lỗi server" });
  }
};

exports.history = async (req, res) => {
  try {
    const query = getQuery();
    const logs = await query(
      "SELECT * FROM product_edit_logs WHERE product_id = ? ORDER BY edit_time DESC",
      [req.params.id]
    );
    res.json(logs);
  } catch (error) {
    console.error("Lỗi khi lấy lịch sử:", error);
    res.status(500).json({ message: "Lỗi server" });
  }
};

exports.remove = (req, res) => {
  const db = getDB();
  const productId = req.params.id;

  db.query("DELETE FROM payments WHERE product_id = ?", [productId], (err) => {
    if (err) {
      console.error("Lỗi khi xóa payments:", err);
      return res.status(500).json({ message: "Lỗi khi xóa payments" });
    }
    db.query("DELETE FROM products WHERE id = ?", [productId], (err2) => {
      if (err2) {
        console.error("Lỗi khi xóa sản phẩm:", err2);
        return res.status(500).json({ message: "Lỗi khi xóa sản phẩm" });
      }
      res.status(200).json({ message: "Xóa sản phẩm thành công" });
    });
  });
};

exports.categories = (req, res) => {
  const db = getDB();
  const q = `
    SELECT DISTINCT category FROM products 
    WHERE category IS NOT NULL AND category != ''
  `;
  db.query(q, (err, results) => {
    if (err) return res.status(500).send("Lỗi server");
    res.json(results.map((r) => r.category));
  });
};
