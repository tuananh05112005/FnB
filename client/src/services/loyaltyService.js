// ==============================================================
// TÊN FILE: loyaltyService.js
// MÔ TẢ: Cung cấp các dịch vụ liên quan đến hệ thống Khách hàng thân thiết (Loyalty).
//        Bao gồm lấy thông tin ví điểm/voucher của người dùng và đánh dấu đã đọc tất cả thông báo.
// ==============================================================

import api from "../api";

/**
 * Lấy thông tin ví tích điểm, vouchers sở hữu và thông báo của người dùng.
 */
export const getWallet = async (userId) => {
  const response = await api.get(`/api/loyalty/${userId}`);
  return response.data;
};

/**
 * Đánh dấu toàn bộ danh sách thông báo của người dùng thành đã đọc.
 */
export const markNotificationsRead = async (userId) => {
  const response = await api.put(`/api/notifications/read/${userId}`);
  return response.data;
};
