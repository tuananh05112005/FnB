// ==============================================================
// TÊN FILE: authService.js
// MÔ TẢ: Cung cấp các dịch vụ liên quan đến xác thực người dùng (Authentication).
//        Bao gồm đăng nhập bằng email/mật khẩu, đăng ký tài khoản mới,
//        đăng nhập bằng tài khoản Google (ID Token), và đăng xuất (xóa token khỏi LocalStorage).
// ==============================================================

import api from '../api';

/**
 * Đăng nhập bằng tài khoản email và mật khẩu.
 * Lưu JWT token và quyền hạn (role) vào LocalStorage sau khi đăng nhập thành công.
 */
export const login = async (email, password) => {
  const response = await api.post('/login', { email, password });
  const { token, role } = response.data;
  localStorage.setItem('token', token);
  localStorage.setItem('role', role);
  return response.data;
};

/**
 * Đăng ký tài khoản người dùng mới.
 */
export const register = async (userData) => {
  const response = await api.post('/register', userData);
  return response.data;
};

/**
 * Đăng nhập bằng tài khoản Google thông qua ID Token từ Google Sign-In.
 */
export const googleLogin = async (idToken) => {
  const response = await api.post('/login/google', { idToken });
  const { token, role } = response.data;
  localStorage.setItem('token', token);
  localStorage.setItem('role', role);
  return response.data;
};

/**
 * Đăng xuất tài khoản, xóa các token và vai trò khỏi LocalStorage.
 */
export const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('role');
};
