// ==============================================================
// TÊN FILE: authController.js
// MÔ TẢ: Bộ điều khiển xử lý xác thực tài khoản người dùng (Authentication).
//        - Đăng ký tài khoản mới qua Email & Mật khẩu.
//        - Đăng nhập hệ thống qua Email & Mật khẩu, sinh JWT Token.
//        - Đăng nhập bằng Google thông qua Firebase Auth ID Token.
// ==============================================================

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const admin = require("../config/firebase");
const { jwtSecret, jwtExpiresIn } = require("../config/jwt");
const { getDB, getQuery } = require("../config/db");

// Đăng nhập bằng Firebase ID Token từ Google, tự động đăng ký nếu email chưa tồn tại
exports.googleLogin = async (req, res) => {
  const { idToken } = req.body;
  try {
    // Xác thực Firebase ID Token nhận từ phía Client
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const { email, name } = decodedToken;

    const query = getQuery();
    // Kiểm tra xem email đã tồn tại trong bảng users hay chưa
    const users = await query("SELECT * FROM users WHERE email = ?", [email]);

    let userId;
    let role = "user";
    if (users.length > 0) {
      userId = users[0].id;
      role = users[0].role || "user";
    } else {
      // Nếu là email mới, tiến hành đăng ký tài khoản tự động (mật khẩu trống vì đăng nhập Google)
      const result = await query(
        "INSERT INTO users (name, email, password) VALUES (?, ?, '')",
        [name || email.split("@")[0], email]
      );
      userId = result.insertId;
    }

    // Ký và cấp mã thông báo JWT Token
    const token = jwt.sign({ id: userId, role, name: name || email.split("@")[0] }, jwtSecret, { expiresIn: +jwtExpiresIn });
    res.status(200).json({ token, user_id: userId, role, name: name || email.split("@")[0] });
  } catch (error) {
    console.error("Lỗi xác thực Google:", error);
    res.status(401).json({ message: "Xác thực Google thất bại" });
  }
};

// Đăng ký tài khoản mới bằng Email/Mật khẩu truyền thống
exports.register = (req, res) => {
  const db = getDB();
  const { name, email, password } = req.body;
  // Mã hóa mật khẩu bằng bcrypt trước khi lưu vào database
  const hashedPassword = bcrypt.hashSync(password, 8);

  const sql = "INSERT INTO users (name, email, password) VALUES (?, ?, ?)";
  db.query(sql, [name, email, hashedPassword], (err) => {
    if (err) return res.status(500).send("Lỗi server");
    res.status(200).send({ message: "Đăng ký thành công" });
  });
};

// Đăng nhập bằng Email/Mật khẩu truyền thống, kiểm tra tính hợp lệ và trả về Token
exports.login = (req, res) => {
  const db = getDB();
  const { email, password } = req.body;

  const sql = "SELECT * FROM users WHERE email = ?";
  db.query(sql, [email], (err, result) => {
    if (err) return res.status(500).send("Lỗi server");
    if (result.length === 0) return res.status(404).send("Người dùng không tồn tại");

    const user = result[0];

    // Ngăn chặn tài khoản bị khóa đăng nhập
    if (!user.is_active) {
      return res.status(403).send("Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên.");
    }

    // Giải mã và so khớp mật khẩu
    const passwordIsValid = bcrypt.compareSync(password, user.password);
    if (!passwordIsValid) return res.status(401).send("Mật khẩu không đúng");

    // Ký token chứa thông tin ID người dùng và Vai trò tài khoản
    const token = jwt.sign({ id: user.id, role: user.role, name: user.name }, jwtSecret, {
      expiresIn: +jwtExpiresIn,
    });

    res.status(200).send({ auth: true, token, role: user.role, user_id: user.id, name: user.name });
  });
};
