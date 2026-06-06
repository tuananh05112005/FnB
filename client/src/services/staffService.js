// ==============================================================
// TÊN FILE: staffService.js
// MÔ TẢ: Cung cấp các dịch vụ quản lý tài khoản người dùng và nhân viên.
//        Bao gồm lấy danh sách toàn bộ người dùng, đăng ký tài khoản nhân viên mới,
//        cập nhật/xóa tài khoản, thay đổi quyền hạn người dùng (changeUserRole)
//        và kích hoạt/khóa tài khoản người dùng (toggleUserStatus).
// ==============================================================

import api from '../api';

/**
 * Lấy danh sách toàn bộ người dùng và nhân viên trong hệ thống (dành cho Admin).
 */
export const listStaff = async () => {
  const response = await api.get('/api/users/all');
  return response.data;
};

/**
 * Tạo mới một tài khoản nhân viên (dành cho Admin).
 */
export const createStaff = async (staffData) => {
  const response = await api.post('/api/admin/create-staff', staffData);
  return response.data;
};

/**
 * Cập nhật thông tin chi tiết của một tài khoản người dùng/nhân viên.
 */
export const updateStaff = async (id, staffData) => {
  const response = await api.put(`/api/users/${id}`, staffData);
  return response.data;
};

/**
 * Xóa vĩnh viễn một tài khoản khỏi hệ thống (dành cho Admin).
 */
export const deleteStaff = async (id) => {
  const response = await api.delete(`/api/users/${id}`);
  return response.data;
};

/**
 * Thay đổi vai trò phân quyền (role: user, staff, admin) của một người dùng (dành cho Admin).
 */
export const changeUserRole = async (id, role) => {
  const response = await api.put(`/api/users/${id}/role`, { role });
  return response.data;
};

/**
 * Bật/Tắt trạng thái hoạt động (kích hoạt hoặc khóa) của một tài khoản (dành cho Admin).
 */
export const toggleUserStatus = async (id, isActive) => {
  const response = await api.put(`/api/users/${id}/status`, { is_active: isActive });
  return response.data;
};
