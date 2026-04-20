// controllers/authController.js
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const admin = require("../config/firebase");
const { jwtSecret, jwtExpiresIn } = require("../config/jwt");
const { getDB, getQuery } = require("../config/db");

exports.googleLogin = async (req, res) => {
  const { idToken } = req.body;
  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const { email, name } = decodedToken;

    const query = getQuery();
    const users = await query("SELECT * FROM users WHERE email = ?", [email]);

    let userId;
    let role = "user";
    if (users.length > 0) {
      userId = users[0].id;
      role = users[0].role || "user";
    } else {
      const result = await query(
        "INSERT INTO users (name, email, password) VALUES (?, ?, '')",
        [name || email.split("@")[0], email]
      );
      userId = result.insertId;
    }

    const token = jwt.sign({ id: userId, role }, jwtSecret, { expiresIn: +jwtExpiresIn });
    res.status(200).json({ token, user_id: userId, role });
  } catch (error) {
    console.error("Lỗi xác thực Google:", error);
    res.status(401).json({ message: "Xác thực Google thất bại" });
  }
};

exports.register = (req, res) => {
  const db = getDB();
  const { name, email, password } = req.body;
  const hashedPassword = bcrypt.hashSync(password, 8);

  const sql = "INSERT INTO users (name, email, password) VALUES (?, ?, ?)";
  db.query(sql, [name, email, hashedPassword], (err) => {
    if (err) return res.status(500).send("Lỗi server");
    res.status(200).send({ message: "Đăng ký thành công" });
  });
};

exports.login = (req, res) => {
  const db = getDB();
  const { email, password } = req.body;

  const sql = "SELECT * FROM users WHERE email = ?";
  db.query(sql, [email], (err, result) => {
    if (err) return res.status(500).send("Lỗi server");
    if (result.length === 0) return res.status(404).send("Người dùng không tồn tại");

    const user = result[0];

    if (!user.is_active) {
      return res.status(403).send("Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên.");
    }

    const passwordIsValid = bcrypt.compareSync(password, user.password);
    if (!passwordIsValid) return res.status(401).send("Mật khẩu không đúng");

    const token = jwt.sign({ id: user.id, role: user.role }, jwtSecret, {
      expiresIn: +jwtExpiresIn,
    });

    res.status(200).send({ auth: true, token, role: user.role, user_id: user.id });
  });
};
