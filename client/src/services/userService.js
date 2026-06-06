// ==============================================================
// TÊN FILE: userService.js
// MÔ TẢ: Cung cấp các dịch vụ liên quan đến tài khoản Khách hàng (User).
//        Bao gồm lấy danh sách người dùng, cập nhật thông tin cá nhân,
//        xóa tài khoản, thay đổi vai trò phân quyền và bật/tắt trạng thái hoạt động.
// ==============================================================

import api from "../api";

/**
 * Lấy danh sách toàn bộ người dùng trong hệ thống (dành cho Admin).
 */
export const listUsers = async () => {
  const response = await api.get("/api/users/all");
  return response.data;
};

/**
 * Cập nhật thông tin chi tiết tài khoản của một người dùng.
 */
export const updateUser = async (id, payload) => {
  const response = await api.put(`/api/users/${id}`, payload);
  return response.data;
};

/**
 * Xóa một tài khoản người dùng khỏi hệ thống (dành cho Admin).
 */
export const deleteUser = async (id) => {
  const response = await api.delete(`/api/users/${id}`);
  return response.data;
};

/**
 * Cập nhật vai trò phân quyền của người dùng (dành cho Admin).
 */
export const updateUserRole = async (id, role) => {
  const response = await api.put(`/api/users/${id}/role`, { role });
  return response.data;
};

/**
 * Cập nhật trạng thái hoạt động (kích hoạt/khóa) của tài khoản (dành cho Admin).
 */
export const updateUserStatus = async (id, isActive) => {
  const response = await api.put(`/api/users/${id}/status`, {
    is_active: isActive,
  });
  return response.data;
};
