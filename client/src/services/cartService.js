// ==============================================================
// TÊN FILE: cartService.js
// MÔ TẢ: Cung cấp các dịch vụ liên quan đến Giỏ hàng và Đơn hàng.
//        Bao gồm lấy giỏ hàng của người dùng, thêm món vào giỏ, cập nhật số lượng,
//        xóa món khỏi giỏ, hủy đơn hàng (kèm lý do và vai trò) và đánh dấu đã nhận hàng.
// ==============================================================

import api from '../api';

/**
 * Lấy danh sách các sản phẩm/đơn hàng trong giỏ của người dùng.
 */
export const getCart = async (userId) => {
  const response = await api.get(`/api/cart/${userId}`);
  return response.data;
};

/**
 * Thêm sản phẩm vào giỏ hàng với số lượng và kích cỡ tùy chọn.
 */
export const addToCart = async (userId, productId, quantity = 1, size = 'M', orderCode = null) => {
  const response = await api.post('/api/cart/add', {
    user_id: userId,
    product_id: productId,
    quantity,
    size,
    order_code: orderCode,
  });
  return response.data;
};

/**
 * Cập nhật thông tin (ví dụ: số lượng) của một mục sản phẩm trong giỏ.
 */
export const updateCartItem = async (itemId, updates) => {
  const response = await api.put(`/api/cart/update/${itemId}`, updates);
  return response.data;
};

/**
 * Xóa hoàn toàn một mục sản phẩm khỏi giỏ hàng.
 */
export const removeCartItem = async (itemId) => {
  const response = await api.delete(`/api/cart/${itemId}`);
  return response.data;
};

/**
 * Hủy một đơn hàng đang xử lý/chờ thanh toán kèm theo lý do hủy đơn và vai trò của người thực hiện.
 */
export const cancelCartItem = async (itemId, reason, role) => {
  const response = await api.put(`/api/cart/cancel/${itemId}`, { 
    cancellation_reason: reason,
    role: role
  });
  return response.data;
};

/**
 * Đánh dấu đơn hàng là đã nhận hàng thành công từ phía khách hàng.
 */
export const markCartItemReceived = async (itemId) => {
  const response = await api.put(`/api/cart/received/${itemId}`);
  return response.data;
};
