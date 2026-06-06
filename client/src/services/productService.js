// ==============================================================
// TÊN FILE: productService.js
// MÔ TẢ: Cung cấp các hàm dịch vụ liên quan đến quản lý Sản phẩm (Product).
//        Bao gồm các thao tác CRUD sản phẩm (lấy danh sách, xem chi tiết, tạo mới, cập nhật, xóa),
//        tìm kiếm hình ảnh minh họa qua API ngoài, và kiểm tra/cập nhật trạng thái sẵn hàng (Hết món/Còn món).
// ==============================================================

import api from '../api';

/**
 * Lấy danh sách sản phẩm, có hỗ trợ lọc theo danh mục cụ thể.
 */
export const listProducts = async (category = null) => {
  const params = category ? { category } : {};
  const response = await api.get('/api/products', { params });
  return response.data;
};

/**
 * Lấy chi tiết thông tin của một sản phẩm qua ID.
 */
export const getProduct = async (id) => {
  const response = await api.get(`/api/products/${id}`);
  return response.data;
};

/**
 * Tạo mới một sản phẩm vào cơ sở dữ liệu (chỉ dành cho Admin/Nhân viên).
 */
export const createProduct = async (productData) => {
  const response = await api.post('/api/products', productData);
  return response.data;
};

/**
 * Cập nhật thông tin của sản phẩm hiện có (chỉ dành cho Admin/Nhân viên).
 */
export const updateProduct = async (id, productData) => {
  const response = await api.put(`/api/products/${id}`, productData);
  return response.data;
};

/**
 * Tìm kiếm hình ảnh minh họa cho món ăn từ các thư viện ảnh công cộng qua backend.
 */
export const searchProductImages = async (query) => {
  const response = await api.get('/api/products/image-search', {
    params: { query },
  });
  return response.data;
};

/**
 * Hàm tiện ích đồng bộ: Kiểm tra xem sản phẩm có sẵn hàng (đang bán) hay không.
 */
export const isProductAvailable = (product) => {
  const value = product?.is_available;

  if (value === undefined || value === null) {
    return true;
  }

  return value === true || value === 1 || value === '1';
};

/**
 * Cập nhật trạng thái còn hàng/hết hàng của một sản phẩm (chỉ dành cho Admin/Nhân viên).
 */
export const updateProductAvailability = async (product, isAvailable) => {
  const response = await api.put(`/api/products/${product.id}`, {
    ...product,
    is_available: isAvailable ? 1 : 0,
  });
  return response.data;
};

/**
 * Xóa sản phẩm khỏi hệ thống (chỉ dành cho Admin/Nhân viên).
 */
export const deleteProduct = async (id) => {
  const response = await api.delete(`/api/products/${id}`);
  return response.data;
};
