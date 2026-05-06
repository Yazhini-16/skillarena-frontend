import axios from 'axios';
import Cookies from 'js-cookie';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  timeout: 10000,
});

// Attach JWT token
api.interceptors.request.use((config) => {
  const token = Cookies.get('token');

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// Handle auth errors safely
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const currentPath = typeof window !== 'undefined'
      ? window.location.pathname
      : '';

    // Prevent infinite redirect loop
    if (status === 401) {
      Cookies.remove('token');

      // Don't redirect if already on auth pages
      const authPages = ['/login', '/register'];

      if (
        typeof window !== 'undefined' &&
        !authPages.includes(currentPath)
      ) {
        window.location.replace('/login');
      }
    }

    return Promise.reject(error);
  }
);

export default api;