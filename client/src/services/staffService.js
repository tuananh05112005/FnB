import api from '../api';

/**
 * Staff service handling user management.
 */
export const listStaff = async () => {
  const response = await api.get('/users/all');
  return response.data;
};

export const createStaff = async (staffData) => {
  const response = await api.post('/admin/create-staff', staffData);
  return response.data;
};

export const updateStaff = async (id, staffData) => {
  const response = await api.put(`/users/${id}`, staffData);
  return response.data;
};

export const deleteStaff = async (id) => {
  const response = await api.delete(`/users/${id}`);
  return response.data;
};

export const changeUserRole = async (id, role) => {
  const response = await api.put(`/users/${id}/role`, { role });
  return response.data;
};

export const toggleUserStatus = async (id, isActive) => {
  const response = await api.put(`/users/${id}/status`, { is_active: isActive });
  return response.data;
};
