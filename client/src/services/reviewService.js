import api from '../api';

/**
 * Review service handling product reviews.
 */
export const listReviews = async (productId) => {
  const response = await api.get(`/reviews/${productId}`);
  return response.data;
};

export const createReview = async ({ product_id, rating, comment, user_id }) => {
  const response = await api.post('/reviews', {
    product_id,
    rating,
    comment,
    user_id,
  });
  return response.data;
};

export const deleteReview = async (reviewId) => {
  const response = await api.delete(`/reviews/${reviewId}`);
  return response.data;
};

export const updateReview = async (reviewId, data) => {
  const response = await api.put(`/reviews/${reviewId}`, data);
  return response.data;
};
