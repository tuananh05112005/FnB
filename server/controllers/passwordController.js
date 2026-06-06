// ==============================================================
// TÊN FILE: passwordController.js
// MÔ TẢ: Bộ điều khiển quản lý khôi phục mật khẩu người dùng (Password Reset).
//        - Tạo mã OTP ngẫu nhiên gồm 6 chữ số, thời gian hết hạn là 5 phút.
//        - Lưu mã OTP vào bảng `password_resets` và gửi email OTP đến người dùng bằng Nodemailer.
//        - Xác thực mã OTP và tiến hành cập nhật mật khẩu đã được mã hóa mới vào bảng `users`.
// ==============================================================

const bcrypt = require("bcryptjs");
const transporter = require("../config/mailer");
const { getQuery } = require("../config/db");

// Sinh mã OTP và gửi qua email khôi phục mật khẩu
exports.sendOTP = async (req, res) => {
  const { email } = req.body;
  try {
    const query = getQuery();
    // Kiểm tra xem email người dùng có đăng ký trên hệ thống chưa
    const [user] = await query("SELECT * FROM users WHERE email = ?", [email]);
    if (!user) return res.status(404).json({ message: "Email không tồn tại" });

    // Tạo mã OTP ngẫu nhiên từ 100000 đến 999999
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // Hết hạn sau 5 phút

    // Dọn dẹp các mã OTP cũ trước đó của email này để tránh dư thừa dữ liệu
    await query("DELETE FROM password_resets WHERE email = ?", [email]);
    // Chèn bản ghi OTP mới vào DB
    await query("INSERT INTO password_resets (email, otp_code, expires_at) VALUES (?, ?, ?)", [
      email,
      otp,
      expiresAt,
    ]);

    // Cấu hình nội dung thư gửi OTP
    const mailOptions = {
      from: process.env.GMAIL_USER || "huynhnguyentuananh11@gmail.com",
      to: email,
      subject: "Mã OTP khôi phục mật khẩu",
      text: `Mã OTP của bạn là: ${otp}. Có hiệu lực trong 5 phút.`,
    };

    // Tiến hành gửi email qua dịch vụ SMTP đã cấu hình
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

// Xác thực mã OTP và thiết lập mật khẩu mới
exports.resetPassword = async (req, res) => {
  const { email, otp_code, new_password } = req.body;
  try {
    const query = getQuery();
    // Tìm bản ghi OTP khớp email, mã OTP và chưa quá thời gian hết hạn (expires_at > NOW())
    const [otp] = await query(
      "SELECT * FROM password_resets WHERE email = ? AND otp_code = ? AND expires_at > NOW() ORDER BY id DESC LIMIT 1",
      [email, otp_code]
    );
    if (!otp) return res.status(400).json({ message: "OTP không hợp lệ hoặc hết hạn" });

    // Mã hóa mật khẩu mới bằng bcrypt
    const hashedPassword = bcrypt.hashSync(new_password, 8);
    // Cập nhật lại mật khẩu mới cho người dùng
    await query("UPDATE users SET password = ? WHERE email = ?", [hashedPassword, email]);
    res.json({ message: "Đặt lại mật khẩu thành công" });
  } catch (error) {
    console.error("Lỗi server:", error);
    res.status(500).json({ message: "Lỗi server" });
  }
};
