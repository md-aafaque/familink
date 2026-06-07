import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api',
  withCredentials: true,
  timeout: 10000, // 10 second timeout
});

api.interceptors.request.use((config) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  return config;
});

api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    // Standardize error handling
    const message = error.response?.data?.error?.message || 'An unexpected error occurred';
    console.error('[API Error]:', message);
    return Promise.reject(new Error(message));
  }
);

export default api;
