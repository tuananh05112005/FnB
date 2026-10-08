// ==============================================================
// TÊN FILE: mailer.js (Config)
// MÔ TẢ: Khởi tạo cấu hình Nodemailer gửi thư điện tử (Nodemailer SMTP Transporter).
//        - Sử dụng cấu hình host smtp.gmail.com chuẩn port 587 (STARTTLS).
//        - Tương thích 100% với môi trường Cloud (Render/AWS/Google Cloud).
// ==============================================================

const nodemailer = require("nodemailer");

// Khởi tạo Transporter cấu hình dịch vụ gửi Email
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false, // Port 587 dùng STARTTLS (secure = false)
  auth: {
    user: process.env.GMAIL_USER || "huynhnguyentuananh11@gmail.com",
    pass: process.env.GMAIL_APP_PASS || "pvad vsui gadb ovgw",
  },
  tls: {
    rejectUnauthorized: false,
  },
  connectionTimeout: 10000, // 10s
  greetingTimeout: 10000,
  socketTimeout: 15000,
});

module.exports = transporter;