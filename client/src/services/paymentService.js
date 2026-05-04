import api from "../api";

export const createPayment = async (payload) => {
  const response = await api.post("/api/payments", payload);
  return response.data;
};

export const finalizeBankingPayment = async (pendingPaymentId) => {
  const response = await api.post("/api/payments/banking-finalize", {
    pending_payment_id: pendingPaymentId,
  });
  return response.data;
};

export const getPaymentHistory = async (userId) => {
  const response = await api.get(`/api/payments/history/${userId}`);
  return response.data;
};

export const deletePayment = async (paymentId) => {
  const response = await api.delete(`/api/payments/${paymentId}`);
  return response.data;
};

export const listAdminPayments = async () => {
  const response = await api.get("/api/admin/payments");
  return response.data;
};

export const listPendingAdminPayments = async () => {
  const response = await api.get("/api/admin/payments/pending");
  return response.data;
};

export const confirmPendingAdminPayment = async (id) => {
  const response = await api.put(`/api/admin/payments/pending/${id}/confirm`);
  return response.data;
};

export const deleteAdminPayment = async (id) => {
  const response = await api.delete(`/api/admin/payments/${id}`);
  return response.data;
};
