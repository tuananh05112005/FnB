// ==============================================================
// TÊN FILE: mailer.js (Config)
// MÔ TẢ: Khởi tạo cấu hình Nodemailer gửi thư điện tử.
//        - Hỗ trợ gửi qua SMTP (local) và HTTP REST fallback cho Cloud.
// ==============================================================

const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER || "huynhnguyentuananh11@gmail.com",
    pass: process.env.GMAIL_APP_PASS || "pvad vsui gadb ovgw",
  },
  tls: {
    rejectUnauthorized: false,
  },
  connectionTimeout: 8000,
  greetingTimeout: 8000,
  socketTimeout: 10000,
});

module.exports = transporter;