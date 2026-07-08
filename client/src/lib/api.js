// ==============================================================
// TÊN FILE: api.js
// MÔ TẢ: Cấu hình Axios Client dùng chung cho toàn bộ ứng dụng Frontend.
//        Thiết lập baseURL động từ biến môi trường (hoặc fallback về localhost:5000),
//        thời gian timeout 15 giây, và cài đặt request interceptor để
//        tự động đính kèm JWT Token vào header Authorization của mỗi yêu cầu API.
// ==============================================================

import axios from "axios";

import { getToken } from "./session";

// Cấu hình URL gốc của backend, hỗ trợ lấy từ biến môi trường (env)
const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL?.replace(/\/+$/, "") ||
  "http://localhost:5000";

// Tạo instance Axios với cấu hình mặc định (tăng timeout lên 90s để đợi Render cold start)
export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 90000,
});

// Request Interceptor: Tự động chèn token Bearer vào header Authorization trước khi gửi request
api.interceptors.request.use((config) => {
  const token = getToken();

  if (token && !config.headers?.Authorization) {
    config.headers = {
      ...config.headers,
      Authorization: `Bearer ${token}`,
    };
  }

  return config;
});

// apiUrl: Hàm tiện ích chuyển đổi đường dẫn tương đối thành URL đầy đủ của backend API
export const apiUrl = (path) => {
  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  return `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;
};

export { API_BASE_URL };
