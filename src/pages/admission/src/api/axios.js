import originalAxios from 'axios';
import { forceLogout } from '../utils/auth.utils';

let startLoadingCallback = () => {};
let stopLoadingCallback = () => {};

export const registerLoadingCallbacks = (start, stop) => {
    startLoadingCallback = start;
    stopLoadingCallback = stop;
};

const api = originalAxios.create({
    baseURL: import.meta.env.VITE_API_URL || '/api',
    headers: {
        'Content-Type': 'application/json',
    },
});

api.interceptors.request.use(
    (config) => {
        startLoadingCallback();
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        stopLoadingCallback();
        return Promise.reject(error);
    }
);

api.interceptors.response.use(
    (response) => {
        stopLoadingCallback();
        return response;
    },
    (error) => {
        stopLoadingCallback();
        // If unauthenticated (401), clear token and redirect to login
        if (error.response && error.response.status === 401) {
            const isAuthRoute = error.config?.url?.includes('/auth/login') || error.config?.url?.includes('/auth/register');
            if (!isAuthRoute) {
                forceLogout(true);
            }
        }
        return Promise.reject(error);
    }
);

export default api;
