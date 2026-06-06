// ==============================================================
// TÊN FILE: mailer.js (Config)
// MÔ TẢ: Khởi tạo cấu hình Nodemailer gửi thư điện tử (Nodemailer SMTP Transporter).
//        - Sử dụng dịch vụ Gmail SMTP.
//        - Dùng GMAIL_USER và mật khẩu ứng dụng Gmail (GMAIL_APP_PASS) để xác thực gửi OTP.
// ==============================================================

const nodemailer = require("nodemailer");

// Khởi tạo Transporter cấu hình dịch vụ gửi Email
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER || "huynhnguyentuananh11@gmail.com",
    pass: process.env.GMAIL_APP_PASS || "pvad vsui gadb ovgw",
  },
  tls: {
    rejectUnauthorized: false, // Bỏ qua lỗi SSL tự ký nếu có
  },
});

module.exports = transporter;
