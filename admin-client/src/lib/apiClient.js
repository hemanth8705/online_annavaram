import axios from 'axios';

// Use the deployed API URL when provided; only fall back to localhost during local development.
const devFallbackUrl = 'http://localhost:5001/api';
const envApiUrl = import.meta.env.VITE_API_URL;
const API_URL = envApiUrl || (import.meta.env.DEV ? devFallbackUrl : '');

if (!API_URL) {
  throw new Error('VITE_API_URL is not configured. Set it to your deployed admin backend URL.');
}

// Create axios instance
const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('adminToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminUser');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default apiClient;
