import axios from 'axios';

const api = axios.create({ baseURL: 'http://localhost:3001/api' });

api.interceptors.request.use((cfg) => {
  const token = (typeof window !== 'undefined') ? localStorage.getItem('token') : null;
  console.log('[API] Token from localStorage:', token ? 'present' : 'missing');
  if (token) {
    cfg.headers['Authorization'] = `Bearer ${token}`;
    console.log('[API] Set Authorization header');
  }
  // send userId header for convenience
  if (token && token.startsWith('MOCK:')) {
    const parts = token.split(':');
    if (parts.length >= 2) cfg.headers['x-user-id'] = parts[1];
  }
  return cfg;
});

export default api;
