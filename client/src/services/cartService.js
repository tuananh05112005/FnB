import api from '../api';

/**
 * Cart service handling cart operations.
 */
export const getCart = async (userId) => {
  const response = await api.get(`/api/cart/${userId}`);
  return response.data;
};

export const addToCart = async (userId, productId, quantity = 1, size = 'M') => {
  const response = await api.post('/api/cart/add', {
    user_id: userId,
    product_id: productId,
    quantity,
    size,
  });
  return response.data;
};

export const updateCartItem = async (itemId, updates) => {
  const response = await api.put(`/api/cart/update/${itemId}`, updates);
  return response.data;
};

export const removeCartItem = async (itemId) => {
  const response = await api.delete(`/api/cart/${itemId}`);
  return response.data;
};

export const cancelCartItem = async (itemId) => {
  const response = await api.put(`/api/cart/cancel/${itemId}`);
  return response.data;
};

export const markCartItemReceived = async (itemId) => {
  const response = await api.put(`/api/cart/received/${itemId}`);
  return response.data;
};
