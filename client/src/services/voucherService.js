// ==============================================================
// TÊN FILE: voucherService.js
// MÔ TẢ: Cung cấp các dịch vụ quản lý Voucher khuyến mãi.
//        Bao gồm hiển thị danh sách voucher có sẵn, tạo mã voucher mới và
//        gửi voucher tới danh sách người nhận cụ thể (assignVoucher).
// ==============================================================

import api from "../api";

/**
 * Lấy danh sách toàn bộ mã giảm giá (voucher) trong hệ thống.
 */
export const listVouchers = async () => {
  const response = await api.get("/api/vouchers");
  return response.data;
};

/**
 * Tạo mới một mã giảm giá (voucher) mới vào hệ thống (dành cho Admin).
 */
export const createVoucher = async (payload) => {
  const response = await api.post("/api/vouchers", payload);
  return response.data;
};

/**
 * Phân phối/Gửi voucher tới một hoặc nhiều người dùng (dành cho Admin).
 */
export const assignVoucher = async (voucherId, userIds = []) => {
  const response = await api.post("/api/vouchers/assign", {
    voucher_id: voucherId,
    user_ids: userIds,
  });
  return response.data;
};
