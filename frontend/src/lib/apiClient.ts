import axios from 'axios';
import { toast } from 'sonner';

export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

import { getAuth } from 'firebase/auth';

// --- Interceptors ---
apiClient.interceptors.request.use(
  async (config) => {
    const auth = getAuth();
    const user = auth.currentUser;
    if (user) {
      const token = await user.getIdToken();
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error('API Request Error:', error);
    toast.error('Network error or request failed to send.');
    return Promise.reject(error);
  }
);

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    console.error('API Response Error:', error.response || error.message || error);
    if (error.response?.data) {
      console.error('API Response Error Detail:', JSON.stringify(error.response.data, null, 2));
    }

    if (error.response) {
      const status = error.response.status;
      const message = error.response.data?.detail || 'An unexpected error occurred.';

      if (status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;
        localStorage.removeItem('firebaseIdToken');
        toast.error('Session expired. Please log in again.');
        window.location.href = '/login';
      } else if (status === 403) {
        toast.error('Permission denied.');
      } else {
        toast.error(`Error: ${message}`);
      }
    } else if (error.request) {
      toast.error('No response from server. Check your connection.');
    } else {
      toast.error('An unknown error occurred.');
    }

    return Promise.reject(error);
  }
);

