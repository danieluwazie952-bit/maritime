import axios from 'axios';

const api = axios.create({ baseURL: '/api', timeout: 30000 });

// Attach JWT to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('maritime_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Unwrap data or surface error message
api.interceptors.response.use(
  (res) => res.data,
  (err) => Promise.reject(new Error(err.response?.data?.message || err.message || 'Something went wrong'))
);

export const authAPI = {
  register:   (data)  => api.post('/auth/register', data),
  login:      (data)  => api.post('/auth/login', data),
  adminLogin: (data)  => api.post('/auth/admin-login', data),
  superLogin: (data)  => api.post('/auth/super-login', data),
  verify:     (token) => api.get(`/auth/verify/${token}`),
  me:         ()      => api.get('/auth/me'),
};

export const studentAPI = {
  profile:           ()    => api.get('/student/profile'),
  documents:         ()    => api.get('/student/documents'),
  upload:            (fd)  => api.post('/student/upload',            fd, { headers: { 'Content-Type': 'multipart/form-data' } }),
  uploadOnboarding:  (fd)  => api.post('/student/upload-onboarding', fd, { headers: { 'Content-Type': 'multipart/form-data' } }),
  extractPdf:        (fd)  => api.post('/student/extract-pdf',       fd, { headers: { 'Content-Type': 'multipart/form-data' } }),
};

export const paymentAPI = {
  list:     ()     => api.get('/payments'),
  initiate: (type) => api.post('/payments/initiate', { type }),
  verify:   (data) => api.post('/payments/verify',   data),
};

export const adminAPI = {
  stats:          ()          => api.get('/admin/stats'),
  students:       ()          => api.get('/admin/students'),
  student:        (id)        => api.get(`/admin/students/${id}`),
  updateMatric:   (id, data)  => api.put(`/admin/students/${id}/matric`, data),
  getSettings:    ()          => api.get('/admin/settings'),
  updateSettings: (data)      => api.put('/admin/settings', data),
};

export default api;
