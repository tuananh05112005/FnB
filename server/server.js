const express = require("express");
const mysql = require("mysql2");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cors = require("cors");
const bodyParser = require("body-parser");
const util = require("util");
const admin = require("firebase-admin");
const serviceAccount = require("./firebase-service-account.json");
const nodemailer = require("nodemailer");

// Khởi tạo ứng dụng Express
const app = express();
const port = 5000;

/* ==================== CẤU HÌNH MIDDLEWARE ==================== */
app.use(
  cors({
    origin: "*", // Cho phép tất cả các domain truy cập
    methods: ["GET", "POST", "PUT", "DELETE"], // Các phương thức HTTP được phép
    credentials: true // Cho phép gửi cookie và header xác thực
  })
);
app.use(express.json()); // Phân tích dữ liệu JSON từ request
app.use(bodyParser.json()); // Middleware phân tích body request

/* ==================== KẾT NỐI DATABASE ==================== */
const db = mysql.createConnection({
  host: "localhost", // Địa chỉ MySQL server
  user: "root", // Tài khoản MySQL
  password: "05112005", // Mật khẩu MySQL
  database: "pr" // Tên database
});

// Chuyển đổi callback-based query thành promise-based
const query = util.promisify(db.query).bind(db);

// Kiểm tra kết nối database
db.connect((err) => {
  if (err) {
    console.error("Lỗi kết nối MySQL:", err);
  } else {
    console.log("Kết nối MySQL thành công!");
  }
});

/* ==================== CẤU HÌNH FIREBASE ==================== */
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

/* ==================== CẤU HÌNH NODEMAILER ==================== */
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "huynhnguyentuananh11@gmail.com",
    pass: "pvad vsui gadb ovgw"
  },
  tls: {
    rejectUnauthorized: false // Bỏ qua lỗi self-signed certificate
  }
});



/* ==================== API QUẢN LÝ NGƯỜI DÙNG ==================== */  

// Lấy danh sách tất cả người dùng
app.get("/api/users/all", async (req, res) => {
  try {
    const users = await query("SELECT id, name, email, role, is_active FROM users WHERE role != 'admin'");
    res.json(users);
  } catch (err) {
    console.error("Lỗi khi lấy danh sách người dùng:", err);
    res.status(500).json({ message: "Lỗi server" });
  }
});

// Cập nhật vai trò người dùng
app.put("/api/users/:id/role", async (req, res) => {
  const { role } = req.body;
  const { id } = req.params;

  // Validate role
  if (!["user", "staff", "admin"].includes(role)) {
    return res.status(400).json({ message: "Vai trò không hợp lệ" });
  }

  try {
    await query("UPDATE users SET role = ? WHERE id = ?", [role, id]);
    res.json({ message: "Cập nhật vai trò thành công" });
  } catch (err) {
    console.error("Lỗi khi cập nhật role:", err);
    res.status(500).json({ message: "Lỗi server" });
  }
});

// Xóa người dùng
app.delete("/api/users/:id", async (req, res) => {
  const { id } = req.params;
   try {
    // Kiểm tra nếu người dùng là admin thì không cho xoá
    const [user] = await query("SELECT * FROM users WHERE id = ?", [id]);
    if (!user) {
      return res.status(404).json({ message: "Người dùng không tồn tại" });
    }

    if (user.role === "admin") {
      return res.status(403).json({ message: "Không thể xóa người dùng admin" });
    }

    // Xoá người dùng
    await query("DELETE FROM users WHERE id = ?", [id]);
    res.json({ message: "Xoá người dùng thành công" });
  } catch (err) {
    console.error("Lỗi khi xóa người dùng:", err);
    res.status(500).json({ message: "Lỗi server" });
  }
});

// Cập nhật thông tin người dùng
app.put("/api/users/:id", async (req, res) => {
  const { id } = req.params;
  const { name, email, password } = req.body;

  try {
    // Nếu có mật khẩu => cập nhật luôn cả mật khẩu
    if (password) {
      const hashedPassword = bcrypt.hashSync(password, 8);
      await query(
        "UPDATE users SET name = ?, email = ?, password = ? WHERE id = ?",
        [name, email, hashedPassword, id]
      );
    } else {
      await query(
        "UPDATE users SET name = ?, email = ? WHERE id = ?",
        [name, email, id]
      );
    }

    res.json({ message: "Cập nhật người dùng thành công" });
  } catch (err) {
    console.error("Lỗi khi cập nhật người dùng:", err);
    res.status(500).json({ message: "Lỗi server" });
  }
});
  
// Cập nhật trạng thái hoạt động của người dùng
app.put("/api/users/:id/status", (req, res) => {
  const { id } = req.params;
  const { is_active } = req.body;

  const sql = "UPDATE users SET is_active = ? WHERE id = ?";
  db.query(sql, [is_active, id], (err, result) => {
    if (err) return res.status(500).send("Lỗi server");
    res.send("Cập nhật trạng thái thành công");
  });
});

// Tạo tài khoản nhân viên (Admin only)
app.post("/api/admin/create-staff", async (req, res) => {
  const { name, email, password } = req.body;

  try {
    // Mã hóa mật khẩu
    const hashedPassword = bcrypt.hashSync(password, 8);
    
    // Kiểm tra email đã tồn tại
    const [exist] = await query("SELECT * FROM users WHERE email = ?", [email]);
    if (exist) return res.status(400).json({ message: "Email đã tồn tại" });

    // Tạo tài khoản với role staff
    await query(
      "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, 'staff')",
      [name, email, hashedPassword]
    );

    res.status(201).json({ message: "Tạo tài khoản nhân viên thành công" });
  } catch (err) {
    console.error("Lỗi khi tạo tài khoản staff:", err);
    res.status(500).json({ message: "Lỗi server" });
  }
});

// Lấy danh sách nhân viên
app.get("/api/staffs", async (req, res) => {
  try {
    const staffs = await query(
      "SELECT id, name, email FROM users WHERE role = 'staff'"
    );
    res.json(staffs);
  } catch (err) {
    console.error("Lỗi khi lấy danh sách nhân viên:", err);
    res.status(500).json({ message: "Lỗi server" });
  }
});

/* ==================== API XÁC THỰC ==================== */

// Đăng nhập bằng Google
app.post("/login/google", async (req, res) => {
  const { idToken } = req.body;

  try {
    // Xác thực token với Firebase
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const { email, name } = decodedToken;

    // Kiểm tra user trong database
    const users = await query("SELECT * FROM users WHERE email = ?", [email]);

    let userId;
    if (users.length > 0) {
      // User đã tồn tại
      userId = users[0].id;
    } else {
      // Tạo user mới nếu chưa tồn tại
      const result = await query(
        "INSERT INTO users (name, email, password) VALUES (?, ?, '')",
        [name || email.split("@")[0], email]
      );
      userId = result.insertId;
    }

    // Tạo JWT token
    const token = jwt.sign({ id: userId, role: "user" }, "your_secret_key", {
      expiresIn: 86400 // 24 giờ
    });

    res.status(200).json({
      token,
      user_id: userId,
      role: "user"
    });
  } catch (error) {
    console.error("Lỗi xác thực Google:", error);
    res.status(401).json({ message: "Xác thực Google thất bại" });
  }
});

// Đăng ký tài khoản
app.post("/register", (req, res) => {
  const { name, email, password } = req.body;
  
  // Mã hóa mật khẩu
  const hashedPassword = bcrypt.hashSync(password, 8);

  const sql = "INSERT INTO users (name, email, password) VALUES (?, ?, ?)";
  db.query(sql, [name, email, hashedPassword], (err, result) => {
    if (err) return res.status(500).send("Lỗi server");
    res.status(200).send({ message: "Đăng ký thành công" });
  });
});

// Đăng nhập bằng email/password
app.post("/login", (req, res) => {
  const { email, password } = req.body;

  const sql = "SELECT * FROM users WHERE email = ?";
  db.query(sql, [email], (err, result) => {
    if (err) return res.status(500).send("Lỗi server");
    if (result.length === 0) return res.status(404).send("Người dùng không tồn tại");

    const user = result[0];
    
    // ✅ Kiểm tra tài khoản đã bị khóa chưa
    if (!user.is_active) {
      return res.status(403).send("Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên.");
    }

    // Kiểm tra mật khẩu
    const passwordIsValid = bcrypt.compareSync(password, user.password);
    if (!passwordIsValid) return res.status(401).send("Mật khẩu không đúng");

    // Tạo JWT token
    const token = jwt.sign(
      { id: user.id, role: user.role },
      "your_secret_key",
      { expiresIn: 86400 } // 24 giờ
    );

    res.status(200).send({
      auth: true,
      token,
      role: user.role,
      user_id: user.id
    });
  });
});

/* ==================== API QUẢN LÝ SẢN PHẨM ==================== */

app.get("/api/products", (req, res) => {
  const { category } = req.query;
  let query = "SELECT * FROM products";
  let values = [];

 if (category) {
  query += " WHERE LOWER(category) LIKE LOWER(?)";
  values.push(category);
}
console.log("Query:", query);
console.log("Values:", values);

  db.query(query, values, (err, results) => {
    if (err) {
      console.error("Lỗi truy vấn sản phẩm:", err);
      return res.status(500).send("Lỗi server");
    }
    res.json(results);
  });
});


// Lấy chi tiết sản phẩm
app.get("/api/products/:id", (req, res) => {
  const productId = req.params.id;
  const query = "SELECT * FROM products WHERE id = ?";
  db.query(query, [productId], (err, results) => {
    if (err) {
      console.error("Lỗi truy vấn sản phẩm:", err);
      return res.status(500).send("Lỗi server");
    }
    if (results.length === 0) {
      return res.status(404).send("Không tìm thấy sản phẩm");
    }
    res.json(results[0]);
  });
});

// Thêm sản phẩm mới
app.post("/api/products", (req, res) => {
  const { image, code, name, price, description, size, category } = req.body;
  const query = `
    INSERT INTO products (image, code, name, price, description, size, category)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;

  db.query(
    query,
    [image, code, name, price, description, size, category],
    (err, results) => {
      if (err) {
        console.error("Lỗi khi thêm sản phẩm:", err);
        res.status(500).send("Lỗi server");
      } else {
        res.status(201).json({ id: results.insertId, ...req.body });
      }
    }
  );
});

app.get("/api/product-categories", (req, res) => {
  const query = `
    SELECT DISTINCT category FROM products 
    WHERE category IS NOT NULL AND category != ''
  `;
  db.query(query, (err, results) => {
    if (err) {
      console.error("Lỗi truy vấn danh mục:", err);
      return res.status(500).send("Lỗi server");
    }
    const categories = results.map(row => row.category);
    res.json(categories);
  });
});


// Cập nhật sản phẩm
app.put("/api/products/:id", async (req, res) => {
  const productId = req.params.id;
  const updatedProduct = req.body;

  try {
    // Lấy thông tin sản phẩm cũ
    const [oldProduct] = await query("SELECT * FROM products WHERE id = ?", [
      productId,
    ]);
    if (!oldProduct) {
      return res.status(404).json({ message: "Không tìm thấy sản phẩm" });
    }

    // Kiểm tra trùng mã/tên sản phẩm
    const duplicate = await query(
      "SELECT * FROM products WHERE (code = ? OR name = ?) AND id != ?",
      [updatedProduct.code, updatedProduct.name, productId]
    );
    if (duplicate.length > 0) {
      return res.status(400).json({ message: "Mã hoặc tên sản phẩm đã tồn tại" });
    }

    // Cập nhật sản phẩm
    await query("UPDATE products SET ? WHERE id = ?", [
      updatedProduct,
      productId,
    ]);

    // Ghi nhận thay đổi
    const changes = {};
    ["name", "price", "description", "size", "code", "image"].forEach(
      (field) => {
        if (oldProduct[field] !== updatedProduct[field]) {
          changes[field] = {
            from: oldProduct[field],
            to: updatedProduct[field],
          };
        }
      }
    );

    // Ghi log chỉnh sửa
    await query(
      "INSERT INTO product_edit_logs (product_id, edited_by, changed_fields) VALUES (?, ?, ?)",
      [productId, req.user?.id || "staff", JSON.stringify(changes)]
    );

    res.status(200).json({ message: "Cập nhật thành công", changes });
  } catch (error) {
    console.error("Lỗi cập nhật sản phẩm:", error);
    res.status(500).json({ message: "Lỗi server" });
  }
});

// Lấy lịch sử chỉnh sửa sản phẩm
app.get("/api/product/:id/history", async (req, res) => {
  try {
    const logs = await query(
      "SELECT * FROM product_edit_logs WHERE product_id = ? ORDER BY edit_time DESC",
      [req.params.id]
    );
    res.json(logs);
  } catch (error) {
    console.error("Lỗi khi lấy lịch sử:", error);
    res.status(500).json({ message: "Lỗi server" });
  }
});

// Xóa sản phẩm
app.delete("/api/products/:id", (req, res) => {
  const productId = req.params.id;

  // Xóa các bản ghi liên quan trong payments trước
  db.query(
    "DELETE FROM payments WHERE product_id = ?",
    [productId],
    (err, result) => {
      if (err) {
        console.error("Lỗi khi xóa payments:", err);
        return res.status(500).json({ message: "Lỗi khi xóa payments" });
      }

      // Xóa sản phẩm
      db.query(
        "DELETE FROM products WHERE id = ?",
        [productId],
        (err, result) => {
          if (err) {
            console.error("Lỗi khi xóa sản phẩm:", err);
            return res.status(500).json({ message: "Lỗi khi xóa sản phẩm" });
          }

          res.status(200).json({ message: "Xóa sản phẩm thành công" });
        }
      );
    }
  );
});

/* ==================== API QUẢN LÝ GIỎ HÀNG ==================== */

// Thêm sản phẩm vào giỏ hàng
app.post("/api/cart/add", (req, res) => {
  const { user_id, product_id, quantity, size } = req.body;

  const query =
    "INSERT INTO cart (user_id, product_id, quantity, size) VALUES (?, ?, ?, ?)";
  db.query(query, [user_id, product_id, quantity, size], (err, results) => {
    if (err) {
      console.error("Lỗi khi thêm vào giỏ hàng:", err);
      res.status(500).send("Lỗi server");
    } else {
      res.status(201).json({ id: results.insertId, ...req.body });
    }
  });
});

// Lấy giỏ hàng của người dùng
app.get("/api/cart/:user_id", (req, res) => {
  const { user_id } = req.params;
  const query = `
    SELECT cart.id, cart.quantity, cart.size, cart.status, cart.order_date, 
           products.id AS product_id, products.code, products.name, products.price, products.image
    FROM cart
    JOIN products ON cart.product_id = products.id
    WHERE cart.user_id = ?
  `;
  db.query(query, [user_id], (err, results) => {
    if (err) {
      console.error("Lỗi khi lấy giỏ hàng:", err);
      res.status(500).send("Lỗi server");
    } else {
      res.json(results);
    }
  });
});

// Cập nhật số lượng sản phẩm trong giỏ hàng
app.put("/api/cart/update/:id", (req, res) => {
  const { id } = req.params;
  const { quantity } = req.body;

  if (!id || !quantity || isNaN(quantity)) {
    return res.status(400).json({ error: "Dữ liệu không hợp lệ" });
  }

  const query = "UPDATE cart SET quantity = ? WHERE id = ?";
  db.query(query, [quantity, id], (err, results) => {
    if (err) {
      console.error("Lỗi khi cập nhật số lượng:", err);
      res.status(500).send("Lỗi server");
    } else {
      res.status(200).json({ message: "Cập nhật số lượng thành công" });
    }
  });
});

/* ==================== API QUẢN LÝ ĐƠN HÀNG ==================== */

// Lấy tất cả đơn hàng (Admin)
app.get("/api/admin/orders", (req, res) => {
  const query = `
    SELECT cart.id, cart.user_id, cart.quantity, cart.size, cart.status, cart.order_date, 
           products.id AS product_id, products.code, products.name, products.price, products.image
    FROM cart
    JOIN products ON cart.product_id = products.id
  `;
  db.query(query, (err, results) => {
    if (err) {
      console.error("Lỗi khi lấy đơn hàng:", err);
      res.status(500).send("Lỗi server");
    } else {
      res.json(results);
    }
  });
});

// Cập nhật trạng thái đơn hàng (Admin)
app.put("/api/admin/orders/:id/status", (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const query = "UPDATE cart SET status = ? WHERE id = ?";
  db.query(query, [status, id], (err, results) => {
    if (err) {
      console.error("Lỗi khi cập nhật trạng thái:", err);
      res.status(500).send("Lỗi server");
    } else {
      res.status(200).json({ message: "Cập nhật trạng thái thành công" });
    }
  });
});

// Cập nhật trạng thái thanh toán
app.put("/api/cart/update-status/:id", (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const query = "UPDATE cart SET status = ? WHERE id = ?";
  db.query(query, [status, id], (err, results) => {
    if (err) {
      console.error("Lỗi khi cập nhật trạng thái:", err);
      res.status(500).send("Lỗi server");
    } else {
      res.status(200).json({ message: "Cập nhật trạng thái thành công" });
    }
  });
});

// Thanh toán từng sản phẩm
app.put("/api/cart/checkout-item/:id", (req, res) => {
  const { id } = req.params;

  const query = "UPDATE cart SET status = 'completed' WHERE id = ?";
  db.query(query, [id], (err, results) => {
    if (err) {
      console.error("Lỗi khi thanh toán:", err);
      res.status(500).send("Lỗi server");
    } else {
      res.status(200).json({ message: "Thanh toán thành công" });
    }
  });
});

// Xác nhận đã nhận hàng
app.put("/api/cart/received/:id", (req, res) => {
  const { id } = req.params;

  const query = "UPDATE cart SET status = 'received' WHERE id = ?";
  db.query(query, [id], (err, results) => {
    if (err) {
      console.error("Lỗi khi cập nhật trạng thái:", err);
      res.status(500).json({ message: "Lỗi server" });
    } else {
      if (results.affectedRows === 0) {
        return res.status(404).json({ message: "Đơn hàng không tồn tại" });
      }
      res.status(200).json({ message: "Cập nhật trạng thái thành công" });
    }
  });
});

// Hủy đơn hàng
app.put("/api/cart/cancel/:id", (req, res) => {
  const { id } = req.params;
  const { cancellation_reason } = req.body;

  const query =
    "UPDATE cart SET status = 'cancelled', cancellation_reason = ? WHERE id = ?";
  db.query(query, [cancellation_reason, id], (err, results) => {
    if (err) {
      console.error("Lỗi khi hủy đơn:", err);
      res.status(500).send("Lỗi server");
    } else {
      res.status(200).json({ message: "Hủy đơn hàng thành công" });
    }
  });
});

/* ==================== API THANH TOÁN ==================== */

// Tạo thanh toán
app.post("/api/payments", (req, res) => {
  const { user_id, product_id, name, address, phone, payment_method, amount } =
    req.body;

  const insertQuery = `
    INSERT INTO payments (user_id, product_id, name, address, phone, payment_method, amount)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;

  db.query(
    insertQuery,
    [user_id, product_id, name, address, phone, payment_method, amount],
    (err, results) => {
      if (err) {
        console.error("Lỗi khi tạo thanh toán:", err);
        return res.status(500).send("Lỗi server");
      }

      // Cập nhật trạng thái giỏ hàng
      const updateCartQuery = `
        UPDATE cart
        SET status = 'completed'
        WHERE user_id = ? AND product_id = ?
      `;

      db.query(updateCartQuery, [user_id, product_id], (err2) => {
        if (err2) {
          console.error("Lỗi khi cập nhật giỏ hàng:", err2);
          return res.status(500).send("Lỗi server");
        }

        // Tạo QR code nếu là chuyển khoản
        if (payment_method === "banking") {
          const qrUrl = `https://img.vietqr.io/image/NAB-410129237100001-compact.png?amount=${amount}&addInfo=Thanh%20toan%20don%20hang%20%23${results.insertId}&accountName=HUYNH%20NGUYEN%20TUAN%20ANH`;
          
          return res.status(201).json({
            message: "Tạo thanh toán thành công",
            orderId: results.insertId,
            qrUrl
          });
        }

        res.status(201).json({
          message: "Tạo thanh toán thành công",
          orderId: results.insertId
        });
      });
    }
  );
});

// Lấy tất cả thanh toán (Admin)
app.get("/api/admin/payments", (req, res) => {
  const query = `
    SELECT payments.*, users.email 
    FROM payments 
    JOIN users ON payments.user_id = users.id 
    ORDER BY payments.id DESC
  `;

  db.query(query, (err, results) => {
    if (err) {
      console.error("Lỗi khi lấy thanh toán:", err);
      return res.status(500).send("Lỗi server");
    }
    res.json(results);
  });
});

// Lấy lịch sử thanh toán của người dùng
app.get("/api/payments/history/:user_id", async (req, res) => {
  const { user_id } = req.params;
  try {
    const payments = await query(`
SELECT 
  p.id AS payment_id,
  pr.name AS product_name,
  pr.image,
  pr.price,
  p.amount,
  p.payment_method,
  p.order_date,
  pr.size
FROM payments p
JOIN products pr ON p.product_id = pr.id
WHERE p.user_id = ?
ORDER BY p.order_date DESC;



    `, [user_id]);

    res.json(payments);
  } catch (err) {
    console.error("Lỗi khi lấy lịch sử thanh toán:", err);
    res.status(500).json({ message: "Lỗi server" });
  }
});



// Xóa thanh toán (Admin)
app.delete("/api/admin/payments/:id", (req, res) => {
  const id = req.params.id;
  db.query("DELETE FROM payments WHERE id = ?", [id], (err, result) => {
    if (err) {
      console.error("Lỗi khi xóa thanh toán:", err);
      return res.status(500).send("Lỗi server");
    }
    res.status(200).json({ message: "Xóa thanh toán thành công" });
  });
});

// Xóa một thanh toán theo ID
app.delete("/api/payments/:payment_id", async (req, res) => {
  const { payment_id } = req.params;
  try {
    const result = await query("DELETE FROM payments WHERE id = ?", [payment_id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Không tìm thấy thanh toán cần xóa" });
    }
    res.json({ message: "Xóa thanh toán thành công" });
  } catch (err) {
    console.error("Lỗi khi xóa thanh toán:", err);
    res.status(500).json({ message: "Lỗi server" });
  }
});

/* ==================== API THỐNG KÊ ==================== */

// Tính tổng doanh thu
app.get("/api/admin/revenue", (req, res) => {
  const query = `
    SELECT SUM(products.price * cart.quantity) AS total_revenue
    FROM cart
    JOIN products ON cart.product_id = products.id
    WHERE cart.status = 'received'
  `;
  db.query(query, (err, results) => {
    if (err) {
      console.error("Lỗi khi tính doanh thu:", err);
      res.status(500).send("Lỗi server");
    } else {
      res.json(results[0]);
    }
  });
});

// Thống kê tổng quan
app.get("/api/admin/statistics", async (req, res) => {
  try {
    // Tổng số người dùng
    const totalUsersResult = await query(
      "SELECT COUNT(*) as total FROM users WHERE role = 'user'"
    );
    const totalUsers = totalUsersResult[0].total;

    // Tổng sản phẩm đã bán
    const totalProductsSoldResult = await query(
      "SELECT SUM(quantity) as total FROM cart WHERE status = 'received'"
    );
    const totalProductsSold = totalProductsSoldResult[0].total || 0;

    // Tổng doanh thu
    const totalRevenueResult = await query(
      "SELECT SUM(products.price * cart.quantity) as total FROM cart JOIN products ON cart.product_id = products.id WHERE cart.status = 'received'"
    );
    const totalRevenue = totalRevenueResult[0].total || 0;

    // Tổng đơn hàng bị hủy
    const totalCancelledOrdersResult = await query(
      "SELECT COUNT(*) as total FROM cart WHERE status = 'cancelled'"
    );
    const totalCancelledOrders = totalCancelledOrdersResult[0].total || 0;

    res.json({
      totalUsers,
      totalProductsSold,
      totalRevenue,
      totalCancelledOrders
    });
  } catch (error) {
    console.error("Lỗi khi lấy thống kê:", error);
    res.status(500).json({ message: "Lỗi server" });
  }
});

/* ==================== API QUÊN MẬT KHẨU ==================== */

// Gửi OTP qua email
app.post("/api/send-otp", async (req, res) => {
  const { email } = req.body;

  try {
    // Kiểm tra email tồn tại
    const [user] = await query("SELECT * FROM users WHERE email = ?", [email]);
    if (!user) return res.status(404).json({ message: "Email không tồn tại" });

    // Tạo OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // Hết hạn sau 5 phút

    // Xóa OTP cũ
    await query("DELETE FROM password_resets WHERE email = ?", [email]);

    // Lưu OTP mới
    await query(
      "INSERT INTO password_resets (email, otp_code, expires_at) VALUES (?, ?, ?)",
      [email, otp, expiresAt]
    );

    // Gửi email
    const mailOptions = {
      from: "huynhnguyentuananh11@gmail.com",
      to: email,
      subject: "Mã OTP khôi phục mật khẩu",
      text: `Mã OTP của bạn là: ${otp}. Có hiệu lực trong 5 phút.`
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error("Lỗi gửi email:", error);
        return res.status(500).json({ message: "Gửi email thất bại" });
      }
      res.json({ message: "Đã gửi OTP qua email" });
    });
  } catch (error) {
    console.error("Lỗi server:", error);
    res.status(500).json({ message: "Lỗi server" });
  }
});

// Đặt lại mật khẩu với OTP
app.post("/api/reset-password", async (req, res) => {
  const { email, otp_code, new_password } = req.body;

  try {
    // Kiểm tra OTP hợp lệ
    const [otp] = await query(
      "SELECT * FROM password_resets WHERE email = ? AND otp_code = ? AND expires_at > NOW() ORDER BY id DESC LIMIT 1",
      [email, otp_code]
    );

    if (!otp) {
      return res.status(400).json({ message: "OTP không hợp lệ hoặc hết hạn" });
    }

    // Cập nhật mật khẩu mới
    const hashedPassword = bcrypt.hashSync(new_password, 8);
    await query("UPDATE users SET password = ? WHERE email = ?", [
      hashedPassword,
      email
    ]);

    res.json({ message: "Đặt lại mật khẩu thành công" });
  } catch (error) {
    console.error("Lỗi server:", error);
    res.status(500).json({ message: "Lỗi server" });
  }
});

/* ==================== KHỞI CHẠY SERVER ==================== */
app.listen(port, () => {
  console.log(`Server đang chạy tại http://localhost:${port}`);
});
