import axios from 'axios';
import secureStorage from '../services/secureStorage';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  timeout: 10000,
});

// Interceptor to inject Authorization Bearer token into requests
apiClient.interceptors.request.use(
  async (config) => {
    try {
      const token = await secureStorage.getItem('@auth_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      if (__DEV__) {
        console.warn('Erro ao obter token do storage:', error?.message);
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor for centralized API error handling
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response && error.response.status === 401) {
      // Token expired or invalid, clear token
      await secureStorage.removeItem('@auth_token');
      await secureStorage.removeItem('@auth_user');
    }
    return Promise.reject(error);
  }
);

export default apiClient;
