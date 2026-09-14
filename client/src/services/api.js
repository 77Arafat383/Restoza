import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach token automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('restoza_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (data) => api.post('/auth/register', data),
  demoLogin: (role) => api.post('/auth/demo-login', { role }),
  getMe: () => api.get('/auth/me'),
  getStaff: () => api.get('/auth/staff'),
  updateStaff: (id, data) => api.patch(`/auth/staff/${id}`, data),
};

export const menuAPI = {
  getCategories: () => api.get('/categories'),
  createCategory: (data) => api.post('/categories', data),
  updateCategory: (id, data) => api.put(`/categories/${id}`, data),
  deleteCategory: (id) => api.delete(`/categories/${id}`),

  getItems: (params) => api.get('/menu', { params }),
  getItem: (id) => api.get(`/menu/${id}`),
  createItem: (data) => api.post('/menu', data),
  updateItem: (id, data) => api.put(`/menu/${id}`, data),
  toggleAvailability: (id) => api.patch(`/menu/${id}/toggle`),
  deleteItem: (id) => api.delete(`/menu/${id}`),
};

export const tableAPI = {
  getTables: () => api.get('/tables'),
  createTable: (data) => api.post('/tables', data),
  updateTable: (id, data) => api.put(`/tables/${id}`, data),
  updateStatus: (id, status) => api.patch(`/tables/${id}/status`, { status }),
  deleteTable: (id) => api.delete(`/tables/${id}`),
};

export const orderAPI = {
  getOrders: (params) => api.get('/orders', { params }),
  getOrder: (id) => api.get(`/orders/${id}`),
  createOrder: (data) => api.post('/orders', data),
  updateStatus: (id, status) => api.patch(`/orders/${id}/status`, { status }),
};

export const billAPI = {
  getBills: (params) => api.get('/bills', { params }),
  generateBill: (orderId) => api.post('/bills', { orderId }),
  processPayment: (billId, paymentData) => api.post(`/bills/${billId}/pay`, paymentData),
  getThermalReceipt: (billId) => api.get(`/bills/${billId}/receipt`),
};

export const settingsAPI = {
  getSettings: () => api.get('/settings'),
  updateSettings: (data) => api.put('/settings', data),
};

export const feedbackAPI = {
  getFeedbacks: () => api.get('/feedback'),
  submitFeedback: (data) => api.post('/feedback', data),
};

export const analyticsAPI = {
  getDashboardMetrics: () => api.get('/analytics/dashboard'),
};

export default api;
