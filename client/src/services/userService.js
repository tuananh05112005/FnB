import api from "../api";

export const listUsers = async () => {
  const response = await api.get("/api/users/all");
  return response.data;
};

export const updateUser = async (id, payload) => {
  const response = await api.put(`/api/users/${id}`, payload);
  return response.data;
};

export const deleteUser = async (id) => {
  const response = await api.delete(`/api/users/${id}`);
  return response.data;
};

export const updateUserRole = async (id, role) => {
  const response = await api.put(`/api/users/${id}/role`, { role });
  return response.data;
};

export const updateUserStatus = async (id, isActive) => {
  const response = await api.put(`/api/users/${id}/status`, {
    is_active: isActive,
  });
  return response.data;
};
