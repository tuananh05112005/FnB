// ==============================================================
// TÊN FILE: server.js
// MÔ TẢ: Điểm khởi chạy chính (Entry Point) của Server.
//        - Nạp các biến môi trường từ file `.env`.
//        - Kết nối Database MySQL.
//        - Khởi tạo HTTP Server và tích hợp Socket.io để xử lý giao tiếp thời gian thực (Real-time).
//        - Quản lý các phòng (Rooms) của socket kết nối dựa theo vai trò (`user:<id>` hoặc `managers`).
// ==============================================================

require("dotenv").config();

const http = require("http");
const { Server } = require("socket.io");

const app = require("./app");
const { initDB } = require("./config/db");

const port = process.env.PORT || 5000;

// Khởi tạo kết nối tới cơ sở dữ liệu MySQL
initDB();

// Tạo HTTP server bao bọc ứng dụng Express
const server = http.createServer(app);

// Gắn Socket.IO vào HTTP server, cấu hình CORS nhận mọi nguồn gốc (origin)
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

// Gán biến io vào đối tượng toàn cục (global) để các controller có thể sử dụng phát thông báo
global.io = io;

// Lắng nghe sự kiện kết nối thời gian thực từ phía Client
io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);

  // Sự kiện xác thực tài khoản Socket: phân loại client vào các phòng (Rooms) nhận tin nhắn tương ứng
  socket.on("authenticate", ({ userId, role }) => {
    console.log(`Socket ${socket.id} authenticated. User: ${userId}, Role: ${role}`);
    if (userId) {
      // Đưa khách hàng vào phòng cá nhân để gửi thông báo riêng tư (ví dụ: gán voucher, trạng thái đơn)
      socket.join(`user:${userId}`);
    }
    if (role === "admin" || role === "staff") {
      // Đưa quản lý/nhân viên vào phòng chung để nhận tin đặt đơn hàng mới, hủy đơn hàng
      socket.join("managers");
    }
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
});

// Chạy server lắng nghe cổng cấu hình (mặc định: 5000)
server.listen(port, () => {
  console.log(`Server dang chay tai http://localhost:${port}`);
});