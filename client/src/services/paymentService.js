// ==============================================================
// TÊN FILE: paymentService.js
// MÔ TẢ: Cung cấp các hàm dịch vụ gọi API xử lý Thanh toán (Payment).
//        Bao gồm khởi tạo thanh toán, hoàn tất thanh toán chuyển khoản banking,
//        truy vấn lịch sử thanh toán của user, và các tính năng quản trị của Admin
//        (liệt kê, duyệt thanh toán chờ xử lý, xóa lịch sử thanh toán).
// ==============================================================

import api from "../api";

/**
 * Khởi tạo giao dịch thanh toán đơn hàng mới.
 */
export const createPayment = async (payload) => {
  const response = await api.post("/api/payments", payload);
  return response.data;
};

/**
 * Xác nhận hoàn tất thủ công giao dịch chuyển khoản banking (nếu cần).
 */
export const finalizeBankingPayment = async (pendingPaymentId) => {
  const response = await api.post("/api/payments/banking-finalize", {
    pending_payment_id: pendingPaymentId,
  });
  return response.data;
};

/**
 * Lấy danh sách lịch sử giao dịch mua sắm của một khách hàng.
 */
export const getPaymentHistory = async (userId) => {
  const response = await api.get(`/api/payments/history/${userId}`);
  return response.data;
};

/**
 * Xóa một bản ghi giao dịch thanh toán khỏi lịch sử của người dùng.
 */
export const deletePayment = async (paymentId) => {
  const response = await api.delete(`/api/payments/${paymentId}`);
  return response.data;
};

/**
 * Lấy toàn bộ danh sách lịch sử giao dịch trong hệ thống (dành cho Admin).
 */
export const listAdminPayments = async () => {
  const response = await api.get("/api/admin/payments");
  return response.data;
};

/**
 * Danh sách các giao dịch đang chờ Admin/Nhân viên đối soát hoặc xác nhận (dành cho Admin).
 */
export const listPendingAdminPayments = async () => {
  const response = await api.get("/api/admin/payments/pending");
  return response.data;
};

/**
 * Xác nhận một giao dịch đang chờ xử lý thành trạng thái thành công (dành cho Admin).
 */
export const confirmPendingAdminPayment = async (id) => {
  const response = await api.put(`/api/admin/payments/pending/${id}/confirm`);
  return response.data;
};

/**
 * Xóa bản ghi lịch sử giao dịch của hệ thống (dành cho Admin).
 */
export const deleteAdminPayment = async (id) => {
  const response = await api.delete(`/api/admin/payments/${id}`);
  return response.data;
};
