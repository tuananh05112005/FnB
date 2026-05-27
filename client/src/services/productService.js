import api from '../api';

/**
 * Product service handling CRUD operations.
 */
export const listProducts = async (category = null) => {
  const params = category ? { category } : {};
  const response = await api.get('/api/products', { params });
  return response.data;
};

export const getProduct = async (id) => {
  const response = await api.get(`/api/products/${id}`);
  return response.data;
};

export const createProduct = async (productData) => {
  const response = await api.post('/api/products', productData);
  return response.data;
};

export const updateProduct = async (id, productData) => {
  const response = await api.put(`/api/products/${id}`, productData);
  return response.data;
};

export const searchProductImages = async (query) => {
  const response = await api.get('/api/products/image-search', {
    params: { query },
  });
  return response.data;
};

export const isProductAvailable = (product) => {
  const value = product?.is_available;

  if (value === undefined || value === null) {
    return true;
  }

  return value === true || value === 1 || value === '1';
};

export const updateProductAvailability = async (product, isAvailable) => {
  const response = await api.put(`/api/products/${product.id}`, {
    ...product,
    is_available: isAvailable ? 1 : 0,
  });
  return response.data;
};

export const deleteProduct = async (id) => {
  const response = await api.delete(`/api/products/${id}`);
  return response.data;
};
