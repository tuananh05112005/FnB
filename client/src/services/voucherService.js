import api from "../api";

export const listVouchers = async () => {
  const response = await api.get("/api/vouchers");
  return response.data;
};

export const createVoucher = async (payload) => {
  const response = await api.post("/api/vouchers", payload);
  return response.data;
};

export const assignVoucher = async (voucherId, userIds = []) => {
  const response = await api.post("/api/vouchers/assign", {
    voucher_id: voucherId,
    user_ids: userIds,
  });
  return response.data;
};
