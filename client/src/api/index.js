// ==============================================================
// TÊN FILE: api/index.js
// MÔ TẢ: File trung chuyển re-export cấu hình Axios Client từ thư mục lib
//        để phục vụ cho các service gọi API ngắn gọn hơn (import api từ '../api').
// ==============================================================

export { api as default, API_BASE_URL, apiUrl } from "../lib/api";
