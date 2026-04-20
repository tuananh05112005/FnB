// config/mailer.js
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
});


module.exports = transporter;
