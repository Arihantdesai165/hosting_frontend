import axios from 'axios';
import { store } from '../store/store';
import { startLoading, stopLoading } from '../store/uiSlice';
import { forceLogout } from '../utils/auth.utils';

const API = axios.create({
  baseURL: '/api',
  withCredentials: true, // Crucial for sending the httpOnly refresh token cookie
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add Authorization token
API.interceptors.request.use(
  (config) => {
    if (store && typeof store.dispatch === 'function') {
      store.dispatch(startLoading());
    }
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    if (store && typeof store.dispatch === 'function') {
      store.dispatch(stopLoading());
    }
    return Promise.reject(error);
  }
);

// Response interceptor to handle token expiry / unauthenticated requests
API.interceptors.response.use(
  (response) => {
    if (store && typeof store.dispatch === 'function') {
      store.dispatch(stopLoading());
    }
    return response;
  },
  async (error) => {
    if (store && typeof store.dispatch === 'function') {
      store.dispatch(stopLoading());
    }
    const originalRequest = error.config;

    // If it's a 401 and we haven't already retried this exact request
    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      // If the login/register/status request itself failed, don't trigger forceLogout or refresh-token loop
      if (originalRequest.url?.includes('/auth/login') || originalRequest.url?.includes('/auth/register') || originalRequest.url?.includes('/auth/status')) {
        return Promise.reject(error);
      }

      // If the refresh token endpoint itself returned 401
      if (originalRequest.url?.includes('/auth/refresh-token')) {
        forceLogout(true);
        return Promise.reject(error);
      }

      originalRequest._retry = true;

      try {
        // Attempt to seamlessly refresh the session using the httpOnly cookie
        const refreshResponse = await axios.post('/api/auth/refresh-token', {}, { withCredentials: true });
        
        const { token, user } = refreshResponse.data.data;
        
        // Update local storage with the new fresh access token
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));

        // Update the failed request's header and retry it
        originalRequest.headers.Authorization = `Bearer ${token}`;
        return API(originalRequest);
      } catch (refreshError) {
        // Refresh token failed or expired -> Force logout
        forceLogout(true);
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

export default API;
