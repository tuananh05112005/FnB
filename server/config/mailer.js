// ==============================================================
// TÊN FILE: mailer.js (Config)
// MÔ TẢ: Khởi tạo cấu hình Nodemailer gửi thư điện tử.
//        - Sử dụng Port 465 (Direct SSL) chuẩn Google SMTP.
//        - Giải pháp gửi email vượt qua tường lửa đám mây Render Free Tier.
// ==============================================================

const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true, // Port 465 bắt buộc secure = true
  auth: {
    user: process.env.GMAIL_USER || "huynhnguyentuananh11@gmail.com",
    pass: process.env.GMAIL_APP_PASS || "pvad vsui gadb ovgw",
  },
  tls: {
    rejectUnauthorized: false,
  },
  connectionTimeout: 10000,
  greetingTimeout: 10000,
  socketTimeout: 15000,
});

module.exports = transporter;