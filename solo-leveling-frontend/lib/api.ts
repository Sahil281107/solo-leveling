// lib/api.ts
import axios from 'axios';
import Cookies from 'js-cookie';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 second timeout
});

// Track if we're currently refreshing to avoid multiple refresh attempts
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: any) => void;
  reject: (error?: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve(token);
    }
  });
  
  failedQueue = [];
};

// Add auth token to requests
api.interceptors.request.use(
  (config) => {
    const token = Cookies.get('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle auth errors with improved retry logic
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Check if it's an authentication error
    if (error.response?.status === 401 || error.response?.status === 403) {
      const errorCode = error.response?.data?.code;
      
      // Handle specific error codes
      switch (errorCode) {
        case 'TOKEN_EXPIRED':
        case 'SESSION_EXPIRED':
        case 'INVALID_TOKEN':
          // If we're already refreshing, add this request to the queue
          if (isRefreshing) {
            return new Promise((resolve, reject) => {
              failedQueue.push({ resolve, reject });
            }).then(token => {
              originalRequest.headers.Authorization = `Bearer ${token}`;
              return api(originalRequest);
            }).catch(err => {
              return Promise.reject(err);
            });
          }

          // Mark that we're refreshing
          originalRequest._retry = true;
          isRefreshing = true;

          try {
            // Try to refresh the session by making a test API call
            // If the token is still valid (maybe it was a temporary session issue)
            const testResponse = await axios.get(`${API_URL}/auth/health`, {
              headers: {
                Authorization: `Bearer ${Cookies.get('token')}`
              }
            });

            if (testResponse.status === 200) {
              // Token is still valid, retry the original request
              isRefreshing = false;
              processQueue(null, Cookies.get('token'));
              return api(originalRequest);
            }
          } catch (refreshError) {
            // Token is definitely invalid, redirect to login
            isRefreshing = false;
            processQueue(refreshError, null);
            
            // Clear all auth cookies
            Cookies.remove('token');
            Cookies.remove('user');
            Cookies.remove('profile');
            
            // Only redirect if not already on login page
            if (!window.location.pathname.includes('/login')) {
              // Add a small delay to prevent immediate redirect loops
              setTimeout(() => {
                window.location.href = '/login?expired=true';
              }, 100);
            }
            
            return Promise.reject(error);
          }
          break;

        case 'ACCOUNT_INACTIVE':
          // Handle inactive account
          Cookies.remove('token');
          Cookies.remove('user');
          Cookies.remove('profile');
          
          if (!window.location.pathname.includes('/login')) {
            window.location.href = '/login?inactive=true';
          }
          break;

        default:
          // For other 401/403 errors, redirect to login
          if (!originalRequest._retry) {
            Cookies.remove('token');
            Cookies.remove('user');
            Cookies.remove('profile');
            
            if (!window.location.pathname.includes('/login')) {
              window.location.href = '/login';
            }
          }
          break;
      }
    }

    // Handle network errors
    if (!error.response) {
      console.error('Network error:', error.message);
      // You could show a toast notification here about network issues
    }

    return Promise.reject(error);
  }
);

export default api;