// controllers/passwordController.js
const bcrypt = require("bcryptjs");
const transporter = require("../config/mailer");
const { getQuery } = require("../config/db");

exports.sendOTP = async (req, res) => {
  const { email } = req.body;
  try {
    const query = getQuery();
    const [user] = await query("SELECT * FROM users WHERE email = ?", [email]);
    if (!user) return res.status(404).json({ message: "Email không tồn tại" });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    await query("DELETE FROM password_resets WHERE email = ?", [email]);
    await query("INSERT INTO password_resets (email, otp_code, expires_at) VALUES (?, ?, ?)", [
      email,
      otp,
      expiresAt,
    ]);

    const mailOptions = {
      from: process.env.GMAIL_USER || "huynhnguyentuananh11@gmail.com",
      to: email,
      subject: "Mã OTP khôi phục mật khẩu",
      text: `Mã OTP của bạn là: ${otp}. Có hiệu lực trong 5 phút.`,
    };

    transporter.sendMail(mailOptions, (error) => {
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
};

exports.resetPassword = async (req, res) => {
  const { email, otp_code, new_password } = req.body;
  try {
    const query = getQuery();
    const [otp] = await query(
      "SELECT * FROM password_resets WHERE email = ? AND otp_code = ? AND expires_at > NOW() ORDER BY id DESC LIMIT 1",
      [email, otp_code]
    );
    if (!otp) return res.status(400).json({ message: "OTP không hợp lệ hoặc hết hạn" });

    const hashedPassword = bcrypt.hashSync(new_password, 8);
    await query("UPDATE users SET password = ? WHERE email = ?", [hashedPassword, email]);
    res.json({ message: "Đặt lại mật khẩu thành công" });
  } catch (error) {
    console.error("Lỗi server:", error);
    res.status(500).json({ message: "Lỗi server" });
  }
};
