import axios from 'axios';

let rawBaseUrl = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').trim();
rawBaseUrl = rawBaseUrl.replace(/\/+$/, '');
const API_BASE_URL = rawBaseUrl.endsWith('/api') ? rawBaseUrl : `${rawBaseUrl}/api`;

const axiosClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

// Request interceptor: Automatically attach Bearer token
axiosClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('memora_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: Standardize error objects & handle expired sessions
axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;
    const errorMessage =
      error.response?.data?.message ||
      (error.code === 'ECONNABORTED' ? 'Request timed out. Please try again.' : null) ||
      error.message ||
      'A network error occurred. Please check your connection.';

    // If session expired or unauthorized on protected routes (not during login/register)
    if (status === 401 && originalRequest && !originalRequest.url?.includes('/auth/login') && !originalRequest.url?.includes('/auth/register')) {
      localStorage.removeItem('memora_token');
      localStorage.removeItem('memora_user');
      // Dispatch custom event so AuthContext can sync state immediately
      window.dispatchEvent(new Event('memora_auth_expired'));
    }

    const standardizedError = {
      message: errorMessage,
      status: status || 0,
      data: error.response?.data || null,
    };

    return Promise.reject(standardizedError);
  }
);

export default axiosClient;
