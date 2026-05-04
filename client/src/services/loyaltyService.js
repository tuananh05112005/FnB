import api from "../api";

export const getWallet = async (userId) => {
  const response = await api.get(`/api/loyalty/${userId}`);
  return response.data;
};

export const markNotificationsRead = async (userId) => {
  const response = await api.put(`/api/notifications/read/${userId}`);
  return response.data;
};
