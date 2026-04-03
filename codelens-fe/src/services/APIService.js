import axios from 'axios';
import DebugService from './DebugService';
import { ENV } from '../config/env';

const API_BASE_URL = ENV.API_BASE_URL;

export const AxiosService = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for adding auth tokens
AxiosService.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token') || localStorage.getItem('id_token') || localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for handling common errors
AxiosService.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('access_token');
      window.location.href = ENV.LOGIN_PAGE;
    }
    return Promise.reject(error);
  }
);

export const setAuthToken = (token) => {
  if (token) {
    AxiosService.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    localStorage.setItem('access_token', token);
  } else {
    delete AxiosService.defaults.headers.common['Authorization'];
    localStorage.removeItem('access_token');
  }
};

const APIService = {
  // Generic function for making HTTP GET requests
  get: async (endpoint, config = {}) => {
    try {
      const response = await AxiosService.get(`/${endpoint}`, config);

      if (response.data?.error && response.data.error.code === 401) {
        window.location.href = ENV.LOGIN_PAGE;
        return;
      }

      return response.data;
    } catch (error) {
      DebugService.error(`Error making GET request to ${endpoint}:`, error);
      throw error;
    }
  },

  // Generic function for making HTTP POST requests
  post: async (endpoint, data, config = {}) => {
    try {
      const response = await AxiosService.post(`/${endpoint}`, data, config);

      if (response.data?.error && response.data.error.code === 401) {
        window.location.href = ENV.LOGIN_PAGE;
        return;
      }

      if (response.status !== 200 && response.status !== 201) {
        throw new Error(`Request failed with status ${response.status}`);
      }

      return response.data;
    } catch (error) {
      DebugService.error(`Error making POST request to ${endpoint}:`, error);
      throw error;
    }
  },

  // Generic function for making HTTP PUT requests
  put: async (endpoint, data, config = {}) => {
    try {
      const response = await AxiosService.put(`/${endpoint}`, data, config);

      if (response.data?.error && response.data.error.code === 401) {
        window.location.href = ENV.LOGIN_PAGE;
        return;
      }

      return response.data;
    } catch (error) {
      DebugService.error(`Error making PUT request to ${endpoint}:`, error);
      throw error;
    }
  },

  // Generic function for making HTTP DELETE requests
  delete: async (endpoint, config = {}) => {
    try {
      const response = await AxiosService.delete(`/${endpoint}`, config);

      if (response.data?.error && response.data.error.code === 401) {
        window.location.href = ENV.LOGIN_PAGE;
        return;
      }
      
      return response.data;
    } catch (error) {
      DebugService.error(`Error making DELETE request to ${endpoint}:`, error);
      throw error;
    }
  },

  // Generic function for making HTTP PATCH requests
  patch: async (endpoint, data, config = {}) => {
    try {
      const response = await AxiosService.patch(`/${endpoint}`, data, config);

      if (response.data?.error && response.data.error.code === 401) {
        window.location.href = ENV.LOGIN_PAGE;
        return;
      }

      return response.data;
    } catch (error) {
      DebugService.error(`Error making PATCH request to ${endpoint}:`, error);
      throw error;
    }
  },
};

export default APIService;
