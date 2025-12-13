import apiClient from './apiClient';

/**
 * Authentication API
 */
export const authAPI = {
  login: async (email, password) => {
    const response = await apiClient.post('/auth/login', { email, password });
    return response.data;
  },
  
  getProfile: async () => {
    const response = await apiClient.get('/auth/profile');
    return response.data;
  },
};

/**
 * Category API
 */
export const categoryAPI = {
  getAll: async () => {
    const response = await apiClient.get('/categories');
    return response.data;
  },
  
  getActive: async () => {
    const response = await apiClient.get('/categories/active');
    return response.data;
  },
  
  create: async (data) => {
    const response = await apiClient.post('/categories', data);
    return response.data;
  },
  
  update: async (id, data) => {
    const response = await apiClient.put(`/categories/${id}`, data);
    return response.data;
  },
  
  toggleStatus: async (id) => {
    const response = await apiClient.patch(`/categories/${id}/toggle-status`);
    return response.data;
  },
  
  delete: async (id) => {
    const response = await apiClient.delete(`/categories/${id}`);
    return response.data;
  },
};

/**
 * Product API
 */
export const productAPI = {
  getAll: async (params = {}) => {
    const response = await apiClient.get('/products', { params });
    return response.data;
  },
  
  getById: async (id) => {
    const response = await apiClient.get(`/products/${id}`);
    return response.data;
  },
  
  create: async (data) => {
    const response = await apiClient.post('/products', data);
    return response.data;
  },
  
  update: async (id, data) => {
    const response = await apiClient.put(`/products/${id}`, data);
    return response.data;
  },
  
  updateStock: async (id, stock) => {
    const response = await apiClient.patch(`/products/${id}/stock`, { stock });
    return response.data;
  },
  
  toggleStatus: async (id) => {
    const response = await apiClient.patch(`/products/${id}/toggle-status`);
    return response.data;
  },
  
  delete: async (id) => {
    const response = await apiClient.delete(`/products/${id}`);
    return response.data;
  },
};

/**
 * Order API
 */
export const orderAPI = {
  getAll: async (params = {}) => {
    const response = await apiClient.get('/orders', { params });
    return response.data;
  },
  
  getById: async (id) => {
    const response = await apiClient.get(`/orders/${id}`);
    return response.data;
  },
  
  updateStatus: async (id, status, notes) => {
    const response = await apiClient.patch(`/orders/${id}/status`, { status, notes });
    return response.data;
  },
  
  getStats: async () => {
    const response = await apiClient.get('/orders/stats');
    return response.data;
  },
};

/**
 * Review API
 */
export const reviewAPI = {
  getAll: async (params = {}) => {
    const response = await apiClient.get('/reviews', { params });
    return response.data;
  },
  
  getById: async (id) => {
    const response = await apiClient.get(`/reviews/${id}`);
    return response.data;
  },
  
  getByProduct: async (productId) => {
    const response = await apiClient.get(`/reviews/product/${productId}`);
    return response.data;
  },
  
  update: async (id, data) => {
    const response = await apiClient.put(`/reviews/${id}`, data);
    return response.data;
  },
  
  delete: async (id) => {
    const response = await apiClient.delete(`/reviews/${id}`);
    return response.data;
  },
  
  getStats: async () => {
    const response = await apiClient.get('/reviews/stats');
    return response.data;
  },
};
