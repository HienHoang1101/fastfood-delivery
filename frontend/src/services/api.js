import axios from 'axios';
import { toast } from 'react-toastify';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080/api';

const api = axios.create({
  baseURL: API_URL,
  timeout: 30000, // ✅ Increased timeout to 30s for order processing
  headers: {
    'Content-Type': 'application/json',
  },
});

// ✅ Request interceptor - Add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Log request in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url}`, {
        data: config.data,
        params: config.params
      });
    }
    
    return config;
  },
  (error) => {
    console.error('[API Request Error]', error);
    return Promise.reject(error);
  }
);

// ✅ Response interceptor - Handle errors globally
api.interceptors.response.use(
  (response) => {
    // Log response in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`[API Response] ${response.config.method?.toUpperCase()} ${response.config.url}`, {
        status: response.status,
        data: response.data
      });
    }
    return response;
  },
  (error) => {
    console.error('[API Response Error]', error);

    // Handle network errors
    if (!error.response) {
      if (error.code === 'ECONNABORTED') {
        toast.error('Request timeout. Please try again.');
      } else if (error.message === 'Network Error') {
        toast.error('Network error. Please check your connection.');
      } else {
        toast.error('Unable to connect to server. Please try again later.');
      }
      return Promise.reject(error);
    }

    const { status, data } = error.response;

    // Handle different status codes
    switch (status) {
      case 400:
        // Bad Request - show specific error message
        if (data.errors && Array.isArray(data.errors)) {
          // Validation errors from express-validator
          const errorMessages = data.errors.map(err => err.msg).join(', ');
          console.error('Validation errors:', errorMessages);
        } else if (data.error) {
          console.error('Bad request:', data.error);
        }
        break;

      case 401:
        // Unauthorized - token expired or invalid
        console.error('Authentication failed');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('cart');
        
        // Only redirect if not already on login page
        if (window.location.pathname !== '/login' && 
            window.location.pathname !== '/register') {
          toast.error('Session expired. Please login again.');
          setTimeout(() => {
            window.location.href = '/login';
          }, 1000);
        }
        break;

      case 403:
        // Forbidden - insufficient permissions
        toast.error('You do not have permission to perform this action.');
        break;

      case 404:
        // Not Found
        if (data.error) {
          console.error('Not found:', data.error);
        }
        break;

      case 409:
        // Conflict - duplicate resource
        if (data.error) {
          console.error('Conflict:', data.error);
        }
        break;

      case 500:
      case 502:
      case 503:
        // Server errors
        toast.error('Server error. Please try again later.');
        console.error('Server error:', data);
        break;

      default:
        console.error('Unknown error:', status, data);
    }

    return Promise.reject(error);
  }
);

export default api;