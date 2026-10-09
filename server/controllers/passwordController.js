// ==============================================================
// TÊN FILE: passwordController.js
// MÔ TẢ: Bộ điều khiển quản lý khôi phục mật khẩu người dùng (Password Reset).
//        - Tạo mã OTP ngẫu nhiên gồm 6 chữ số, thời hạn 5 phút.
//        - Gửi OTP qua Brevo REST API (HTTPS Port 443 - Không bao giờ bị Cloud chặn).
//        - Xác thực mã OTP và cập nhật mật khẩu mới an toàn bằng bcrypt.
// ==============================================================

const bcrypt = require("bcryptjs");
const { sendOtpEmail } = require("../config/brevoMailer");
const { getQuery } = require("../config/db");

// Sinh mã OTP và gửi qua email khôi phục mật khẩu
exports.sendOTP = async (req, res) => {
  const { email } = req.body;
  try {
    const query = getQuery();
    // 1. Kiểm tra xem email người dùng có đăng ký trên hệ thống chưa
    const [user] = await query("SELECT * FROM users WHERE email = ?", [email]);
    if (!user) return res.status(404).json({ message: "Email này chưa được đăng ký trong hệ thống!" });

    // 2. Tạo mã OTP ngẫu nhiên gồm 6 chữ số từ 100000 đến 999999
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // Hết hạn sau 5 phút

    // 3. Dọn dẹp các mã OTP cũ trước đó của email này và lưu mã mới vào bảng password_resets
    await query("DELETE FROM password_resets WHERE email = ?", [email]);
    await query("INSERT INTO password_resets (email, otp_code, expires_at) VALUES (?, ?, ?)", [
      email,
      otp,
      expiresAt,
    ]);

    // 4. Gửi email qua Brevo REST API (HTTPS Port 443)
    try {
      await sendOtpEmail({ to: email, otp });
      return res.json({
        success: true,
        message: "Mã OTP đã được gửi về email của bạn! Vui lòng kiểm tra hộp thư đến.",
      });
    } catch (mailError) {
      console.error("[OTP] Lỗi gửi email qua Brevo:", mailError);
      return res.status(500).json({
        message: "Lỗi gửi email: " + (mailError.message || "Không thể chuyển phát email"),
      });
    }
  } catch (error) {
    console.error("Lỗi server sendOTP:", error);
    res.status(500).json({ message: "Lỗi hệ thống: " + error.message });
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
    if (!otp) return res.status(400).json({ message: "Mã OTP không hợp lệ hoặc đã hết hạn!" });

    // Mã hóa mật khẩu mới bằng bcrypt
    const hashedPassword = bcrypt.hashSync(new_password, 8);
    // Cập nhật lại mật khẩu mới cho người dùng
    await query("UPDATE users SET password = ? WHERE email = ?", [hashedPassword, email]);
    
    // Xóa OTP sau khi đổi mật khẩu thành công để không tái sử dụng
    await query("DELETE FROM password_resets WHERE email = ?", [email]);

    res.json({ message: "Đặt lại mật khẩu thành công! Đang chuyển hướng...", success: true });
  } catch (error) {
    console.error("Lỗi server resetPassword:", error);
    res.status(500).json({ message: "Lỗi hệ thống: " + error.message });
  }
};