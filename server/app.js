// ==============================================================
// TÊN FILE: app.js
// MÔ TẢ: Khởi tạo và cấu hình ứng dụng Express (Express Application Setup).
//        - Cấu hình CORS để cho phép Client truy cập chéo tài nguyên.
//        - Đăng ký Parser phân tích JSON Body và lưu `rawBody` để phục vụ xác thực chữ ký SePay.
//        - Nạp các định tuyến API từ thư mục `routes/index.js`.
// ==============================================================

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
require('./config/firebase');
const registerRoutes = require('./routes');

const app = express();

// Cấu hình Middleware CORS để Client React kết nối từ cổng khác được chấp thuận
app.use(
  cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
  })
);

// Middleware phân tích cú pháp JSON, đồng thời ghi lại buffer thô (rawBody) phục vụ đối soát chữ ký SePay HMAC
app.use(express.json({
  verify: (req, _res, buf) => {
    req.rawBody = buf.toString("utf8");
  },
}));
app.use(bodyParser.json());

// Đăng ký toàn bộ các định tuyến API vào ứng dụng Express
registerRoutes(app);

// Export đối tượng app để khởi chạy cùng HTTP Server tại server.js
module.exports = app;
