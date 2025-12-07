import axios from 'axios';
import io from 'socket.io-client';

const API_URL = 'http://localhost:5000/api';
const SOCKET_URL = 'http://localhost:5000';

const api = axios.create({
  baseURL: API_URL,
});

let socket = null;

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Initialize Socket.IO connection
export const initializeAdminSocket = () => {
  if (!socket) {
    socket = io(SOCKET_URL, {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
      transports: ['websocket', 'polling']
    });

    socket.on('connect', () => {
      console.log('✅ Admin connected to socket');
      const userId = localStorage.getItem('userId');
      socket.emit('admin-join', userId);
    });

    socket.on('admin-connected', (data) => {
      console.log('👨‍💼 Admin room joined:', data);
    });

    socket.on('disconnect', () => {
      console.log('❌ Admin disconnected from socket');
    });

    socket.on('connect_error', (error) => {
      console.error('⚠️ Socket connection error:', error);
    });
  }
  return socket;
};

// Listen for activity status updates
export const onActivityStatusUpdated = (callback) => {
  if (socket) {
    socket.on('activity-status-updated', callback);
  }
};

// Listen for stats updates
export const onStatsUpdated = (callback) => {
  if (socket) {
    socket.on('stats-updated', callback);
  }
};

// Listen for new activities
export const onActivityCreated = (callback) => {
  if (socket) {
    socket.on('activity-created', callback);
  }
};

// Clean up listeners
export const removeActivityStatusUpdatedListener = () => {
  if (socket) {
    socket.off('activity-status-updated');
  }
};

export const removeStatsUpdatedListener = () => {
  if (socket) {
    socket.off('stats-updated');
  }
};

export const removeActivityCreatedListener = () => {
  if (socket) {
    socket.off('activity-created');
  }
};

// Disconnect admin
export const disconnectAdmin = () => {
  if (socket) {
    const userId = localStorage.getItem('userId');
    socket.emit('admin-leave', userId);
    socket.disconnect();
    socket = null;
  }
};

// API calls
export const getAdminDashboardData = async (token) => {
  try {
    const response = await api.get('/admin/dashboard-stats', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error('Error fetching admin dashboard data:', error);
    throw error;
  }
};

export const getAllActivities = async (params) => {
  try {
    const response = await api.get('/admin/activities', { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching activities:', error);
    throw error;
  }
};

export const getActivityDetails = async (activityId, type) => {
  try {
    const response = await api.get(`/admin/activities/${activityId}?type=${encodeURIComponent(type)}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching activity details:', error);
    throw error;
  }
};

export const updateActivityStatus = async (activityId, data) => {
  try {
    const response = await api.put(`/admin/activities/${activityId}/status`, data);
    return response.data;
  } catch (error) {
    console.error('Error updating activity status:', error);
    throw error;
  }
};

export const getDashboardStats = async () => {
  try {
    const response = await api.get('/admin/dashboard-stats');
    return response.data;
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    throw error;
  }
};

export default api;