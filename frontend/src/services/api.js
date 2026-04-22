import axios from 'axios';

const API = axios.create({ baseURL: '/api' });

API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const productAPI = {
  getAll: () => API.get('/products'),
  getById: (id) => API.get(`/products/${id}`),
  create: (data) => API.post('/products', data),
  update: (id, data) => API.put(`/products/${id}`, data),
  delete: (id) => API.delete(`/products/${id}`),
};

export const userAPI = {
  register: (data) => API.post('/users/register', data),
  login: (data) => API.post('/users/login', data),
  getAll: () => API.get('/users'),
  getById: (id) => API.get(`/users/${id}`),
  delete: (id) => API.delete(`/users/${id}`),
};

export const cartAPI = {
  getCart: (userId) => API.get(`/cart/${userId}`),
  addItem: (userId, data) => API.post(`/cart/${userId}/items`, data),
  updateQty: (userId, productId, quantity) => API.put(`/cart/${userId}/items/${productId}`, { quantity }),
  removeItem: (userId, productId) => API.delete(`/cart/${userId}/items/${productId}`),
  clearCart: (userId) => API.delete(`/cart/${userId}/clear`),
};

export const orderAPI = {
  create: (data) => API.post('/orders', data),
  getByUser: (userId) => API.get(`/orders/user/${userId}`),
  getById: (id) => API.get(`/orders/${id}`),
};

export const inventoryAPI = {
  getAll: () => API.get('/inventory'),
  getByProduct: (productId) => API.get(`/inventory/product/${productId}`),
  create: (data) => API.post('/inventory', data),
  update: (id, data) => API.put(`/inventory/${id}`, data),
  delete: (id) => API.delete(`/inventory/${id}`),
};

export const commentAPI = {
  getByProduct: (productId) => API.get(`/comments/product/${productId}`),
  create: (data) => API.post('/comments', data),
  update: (id, data) => API.put(`/comments/${id}`, data),
  delete: (id) => API.delete(`/comments/${id}`),
  markHelpful: (id) => API.post(`/comments/${id}/helpful`),
};
