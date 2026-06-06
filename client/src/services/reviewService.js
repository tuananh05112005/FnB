// ==============================================================
// TÊN FILE: reviewService.js
// MÔ TẢ: Cung cấp các hàm dịch vụ gọi API liên quan đến Đánh giá sản phẩm (Review).
//        Bao gồm hiển thị danh sách đánh giá của sản phẩm, gửi đánh giá mới,
//        xóa đánh giá và cập nhật nội dung đánh giá của khách hàng.
// ==============================================================

import api from '../api';

/**
 * Lấy toàn bộ danh sách đánh giá và bình luận của một sản phẩm.
 */
export const listReviews = async (productId) => {
  const response = await api.get(`/api/reviews/${productId}`);
  return response.data;
};

/**
 * Gửi một đánh giá (rating) và bình luận mới cho sản phẩm.
 */
export const createReview = async ({ product_id, rating, comment, user_id }) => {
  const response = await api.post('/api/reviews', {
    product_id,
    rating,
    comment,
    user_id,
  });
  return response.data;
};

/**
 * Xóa một đánh giá cụ thể (dành cho người viết hoặc Admin).
 */
export const deleteReview = async (reviewId) => {
  const response = await api.delete(`/api/reviews/${reviewId}`);
  return response.data;
};

/**
 * Sửa đổi nội dung bình luận hoặc số sao đánh giá của một bản ghi đánh giá cũ.
 */
export const updateReview = async (reviewId, data) => {
  const response = await api.put(`/api/reviews/${reviewId}`, data);
  return response.data;
};
