// ==============================================================
// TÊN FILE: socket.js
// MÔ TẢ: Cấu hình Socket.IO Client phục vụ giao tiếp thời gian thực (real-time).
//        Kết nối tới server thông qua giao thức WebSocket và cung cấp các hàm
//        đăng ký/hủy lắng nghe sự kiện thay đổi cấu hình danh mục ('categorySettingsUpdated').
// ==============================================================

// src/lib/socket.js - kết nối Socket.IO client
import { io } from 'socket.io-client';

// Khởi tạo đối tượng kết nối Socket.IO tới Backend
const socket = io(
  process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000',
  {
    transports: ['websocket'], // Chỉ sử dụng WebSocket transport để tránh lỗi CORS polling
  }
);
export const onCategorySettingsUpdated = (callback) => {
  socket.on('categorySettingsUpdated', callback);
};

export const offCategorySettingsUpdated = (callback) => {
  socket.off('categorySettingsUpdated', callback);
};

export default socket;
