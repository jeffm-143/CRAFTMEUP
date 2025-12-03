import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const getAdminDashboardData = async (token) => {
  // For now, return mock data directly
  return {
    data: JSON.parse(localStorage.getItem('adminDashboardData')) || {
      stats: [],
      reports: [],
      dashboard: {}
    }
  };
};

export const getAdminStats = async (token) => {
  // Return mock stats
  return {
    data: JSON.parse(localStorage.getItem('adminDashboardData'))?.stats || []
  };
};

export const getAdminReports = async (token) => {
  // Return mock reports
  return {
    data: JSON.parse(localStorage.getItem('adminDashboardData'))?.reports || []
  };
};

export default api;
