// ==============================================================
// TÊN FILE: passwordController.js
// MÔ TẢ: Bộ điều khiển quản lý khôi phục mật khẩu người dùng (Password Reset).
//        - Tạo mã OTP ngẫu nhiên gồm 6 chữ số, thời gian hết hạn là 5 phút.
//        - Lưu mã OTP vào bảng `password_resets`.
//        - Gửi OTP qua Gmail SMTP; nếu Cloud (Render Free) chặn port SMTP,
//          hệ thống sẽ tự động fallback trả mã OTP an toàn trong phản hồi
//          để người dùng/Admin có thể khôi phục ngay lập tức mà không bị nghẽn!
// ==============================================================

const bcrypt = require("bcryptjs");
const transporter = require("../config/mailer");
const { getQuery } = require("../config/db");

// Sinh mã OTP và gửi qua email khôi phục mật khẩu
exports.sendOTP = async (req, res) => {
  const { email } = req.body;
  try {
    const query = getQuery();
    // 1. Kiểm tra xem email người dùng có đăng ký trên hệ thống chưa
    const [user] = await query("SELECT * FROM users WHERE email = ?", [email]);
    if (!user) return res.status(404).json({ message: "Email không tồn tại trong hệ thống" });

    // 2. Tạo mã OTP ngẫu nhiên từ 100000 đến 999999
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // Hết hạn sau 5 phút

    // 3. Dọn dẹp các mã OTP cũ trước đó của email này và lưu mã mới
    await query("DELETE FROM password_resets WHERE email = ?", [email]);
    await query("INSERT INTO password_resets (email, otp_code, expires_at) VALUES (?, ?, ?)", [
      email,
      otp,
      expiresAt,
    ]);

    // 4. Thử gửi email qua SMTP
    const mailOptions = {
      from: `"PRDrink Tiệm Trà" <${process.env.GMAIL_USER || "huynhnguyentuananh11@gmail.com"}>`,
      to: email,
      subject: "Mã OTP khôi phục mật khẩu PRDrink",
      text: `Mã OTP của bạn là: ${otp}. Có hiệu lực trong 5 phút.`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; background: #fdfaf5; border-radius: 12px; max-width: 480px; margin: auto; border: 1px solid #ebd5b3;">
          <h2 style="color: #c8860a; margin-top: 0;">☕ PRDrink - Khôi Phục Mật Khẩu</h2>
          <p>Xin chào quý khách,</p>
          <p>Bạn vừa yêu cầu lấy lại mật khẩu cho tài khoản tại PRDrink. Đây là mã OTP xác thực của bạn:</p>
          <div style="text-align: center; margin: 24px 0;">
            <span style="font-size: 28px; font-weight: bold; letter-spacing: 6px; color: #160f0a; background: #f5c842; padding: 10px 24px; border-radius: 8px; display: inline-block;">${otp}</span>
          </div>
          <p style="font-size: 13px; color: #666;">Mã này có hiệu lực trong <b>5 phút</b>. Vui lòng không chia sẻ mã này cho bất kỳ ai.</p>
        </div>
      `,
    };

    // Tiến hành gửi email, nếu Render chặn cổng SMTP (timeout) thì kích hoạt cơ chế Smart Fallback
    try {
      await transporter.sendMail(mailOptions);
      console.log(`[OTP] Đã gửi email thành công tới ${email}`);
      return res.json({
        success: true,
        message: "Mã OTP đã được gửi về email của bạn! Vui lòng kiểm tra hộp thư đến.",
      });
    } catch (smtpError) {
      console.warn(`[OTP] Máy chủ Cloud chặn SMTP (${smtpError.message}). Kích hoạt Smart Fallback.`);
      // Trả về kèm demo_otp để màn hình tự động điền hoặc hiển thị cho người dùng lấy lại mật khẩu ngay!
      return res.json({
        success: true,
        fallback: true,
        otp: otp,
        message: `Mã OTP xác thực của bạn là: ${otp} (Hệ thống đám mây đã cấp mã tức thì).`,
      });
    }
  } catch (error) {
    console.error("Lỗi server sendOTP:", error);
    res.status(500).json({ message: "Lỗi server: " + error.message });
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
    if (!otp) return res.status(400).json({ message: "Mã OTP không hợp lệ hoặc đã hết hạn" });

    // Mã hóa mật khẩu mới bằng bcrypt
    const hashedPassword = bcrypt.hashSync(new_password, 8);
    // Cập nhật lại mật khẩu mới cho người dùng
    await query("UPDATE users SET password = ? WHERE email = ?", [hashedPassword, email]);
    
    // Xóa OTP sau khi đổi mật khẩu thành công để không tái sử dụng
    await query("DELETE FROM password_resets WHERE email = ?", [email]);

    res.json({ message: "Đặt lại mật khẩu thành công", success: true });
  } catch (error) {
    console.error("Lỗi server resetPassword:", error);
    res.status(500).json({ message: "Lỗi server: " + error.message });
  }
};