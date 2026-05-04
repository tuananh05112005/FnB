import api from '../api';

/**
 * Authentication service handling login, register, and Google login.
 */
export const login = async (email, password) => {
  const response = await api.post('/login', { email, password });
  const { token, role } = response.data;
  localStorage.setItem('token', token);
  localStorage.setItem('role', role);
  return response.data;
};

export const register = async (userData) => {
  const response = await api.post('/register', userData);
  return response.data;
};

export const googleLogin = async (idToken) => {
  const response = await api.post('/login/google', { idToken });
  const { token, role } = response.data;
  localStorage.setItem('token', token);
  localStorage.setItem('role', role);
  return response.data;
};

export const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('role');
};
