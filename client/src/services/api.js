import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

export const login = (email, password) => {
  return api.post('/auth/login', { email, password });
};

export const register = (formData) => {
  return api.post('/auth/register', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

// Add interceptor to handle tokens
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Profile update endpoints
export const updateProfile = async (userId, userData) => {
  try {
    console.log('Sending update request:', { userId, userData });
    const response = await api.put(`/auth/update-profile/${userId}`, userData, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    console.log('Update response:', response.data);
    return response;
  } catch (error) {
    console.error('Profile update error:', error.response?.data || error);
    throw error;
  }
};

export const updateProfilePhoto = async (userId, formData) => {
  try {
    const response = await api.put(`/auth/update-profile-photo/${userId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response;
  } catch (error) {
    console.error('Photo upload error:', error);
    throw error;
  }
};

export const createAnnouncement = async (announcementData) => {
  try {
    const response = await api.post('/announcements/create', announcementData);
    return response;
  } catch (error) {
    console.error('Create announcement error:', error);
    throw error;
  }
};
export const getAnnouncements = async () => {
  try {
    console.log('📡 Fetching announcements from:', `${API_URL}/announcements`);
    const response = await api.get('/announcements'); // ✅ Fixed: use 'api' not 'axiosInstance'
    console.log('✅ Announcements response:', response.data);
    
    // ✅ Always return an array
    if (Array.isArray(response.data)) {
      return response.data;
    } else if (response.data && Array.isArray(response.data.data)) {
      return response.data.data;
    }
    return [];
  } catch (error) {
    console.error('❌ Error fetching announcements:', error);
    return []; // ✅ Return empty array on error
  }
};

export const deleteAnnouncement = async (id) => {
  try {
    const response = await api.delete(`/announcements/${id}`);
    return response;
  } catch (error) {
    console.error('Delete announcement error:', error);
    throw error;
  }
};

export const updateAnnouncement = async (id, announcementData) => {
  try {
    const response = await api.put(`/announcements/${id}`, announcementData);
    return response;
  } catch (error) {
    console.error('Update announcement error:', error);
    throw error;
  }
};

export const restoreAnnouncement = async (id) => {
  try {
    const response = await api.post(`/announcements/${id}/restore`);
    return response;
  } catch (error) {
    console.error('Restore announcement error:', error);
    throw error;
  }
};

export const createService = async (serviceData) => {
  try {
    const response = await api.post('/services/create', serviceData);
    return response;
  } catch (error) {
    console.error('Create service error:', error);
    throw error;
  }
};

export const getUserServices = async (userId) => {
  try {
    const response = await api.get(`/services/user/${userId}`);
    return response.data;
  } catch (error) {
    console.error('Get user services error:', error);
    throw error;
  }
};

export const updateService = async (serviceId, serviceData) => {
  try {
    const response = await api.put(`/services/${serviceId}`, serviceData);
    return response;
  } catch (error) {
    console.error('Update service error:', error);
    throw error;
  }
};

export const deleteService = async (serviceId) => {
  try {
    const response = await api.delete(`/services/${serviceId}`);
    return response;
  } catch (error) {
    console.error('Delete service error:', error);
    throw error;
  }
};

export const getAllServices = async (filters = {}) => {
  try {
    const response = await api.get('/services/all', { params: filters });
    return response;
  } catch (error) {
    console.error('Get all services error:', error);
    throw error;
  }
};

export const createBooking = async (bookingData) => {
  try {
    const response = await api.post('/services/book', bookingData);
    return response;
  } catch (error) {
    console.error('Create booking error:', error);
    throw error;
  }
};

export const getUserBookings = async (userId) => {
  try {
    console.log('📡 Fetching bookings/transactions for user:', userId);
    const response = await api.get(`/transactions/user/${userId}`);
    console.log('✅ Bookings response:', response.data);
    return response;
  } catch (error) {
    console.error('Error fetching bookings:', error);
    throw error;
  }
};

export const createTransaction = async (transactionData) => {
  try {
    const formData = new FormData();
    Object.keys(transactionData).forEach(key => {
      formData.append(key, transactionData[key]);
    });

    const response = await api.post('/transactions/create', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response;
  } catch (error) {
    console.error('Create transaction error:', error);
    throw error;
  }
};

export const getUserTransactions = async (userId) => {
  try {
    const response = await api.get(`/transactions/user/${userId}`);
    return response;
  } catch (error) {
    console.error('Get user transactions error:', error);
    throw error;
  }
};

export const updateTransactionStatus = async (bookingId, status) => {
  try {
    const response = await api.put(`/services/bookings/${bookingId}/status`, { status });
    return response.data;
  } catch (error) {
    console.error('Error updating transaction status:', error);
    throw error;
  }
};

export const getUserFeedback = async (userId) => {
  try {
    const response = await api.get(`/feedback/user/${userId}`);
    return response.data; 
  } catch (error) {
    console.error('Error in getUserFeedback:', error);
    throw error;
  }
};

export const submitFeedback = async (feedbackData) => {
  try {
    const response = await api.post('/feedback/submit', feedbackData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getWalletBalance = async (userId) => {
  try {
    const response = await api.get(`/transactions/wallet/${userId}/balance`);
    console.log('Raw wallet balance response:', response);
    if (!response.data || typeof response.data.balance === 'undefined') {
      throw new Error('Invalid balance data received');
    }
    return response;
  } catch (error) {
    console.error('Get wallet balance error:', error);
    throw error;
  }
};

export const transferFunds = async (transferData) => {
  try {
    const response = await api.post('/services/wallet/transfer', transferData);
    return response;
  } catch (error) {
    console.error('Transfer funds error:', error);
    throw error;
  }
};

// Add new endpoint to get user data
export const getUserData = async (userId) => {
  try {
    const response = await api.get(`/auth/user/${userId}`);
    return response;
  } catch (error) {
    console.error('Get user data error:', error);
    throw error;
  }
};

export const createWalletRequest = async (formData) => {
  try {
    const response = await api.post('/transactions/wallet/request', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    console.log('Create wallet request response:', response);
    return response;
  } catch (error) {
    console.error('Create wallet request error:', error);
    throw error;
  }
};

export const getWalletRequests = async () => {
  try {
    const response = await api.get('/transactions/wallet/requests');
    return response;
  } catch (error) {
    console.error('Get wallet requests error:', error);
    throw error;
  }
};

export const updateWalletRequest = async (requestId, data) => {
  try {
    const response = await api.put(`/transactions/wallet/requests/${requestId}/status`, data);
    return response;
  } catch (error) {
    console.error('Update wallet request error:', error);
    throw error;
  }
};

export const getUserWalletHistory = async (userId) => {
  try {
    const response = await api.get(`/transactions/wallet/history/${userId}`);
    console.log('Wallet history response:', response);
    return response;
  } catch (error) {
    console.error('Get wallet history error:', error);
    throw error;
  }
};

export const submitReport = async (reportData) => {
  try {
    const response = await api.post('/reports/submit', reportData);
    return response.data;
  } catch (error) {
    console.error('Submit report error:', error);
    throw error;
  }
};

export const getAllReports = async () => {
  try {
    console.log('📝 Fetching all reports');
    
    const response = await api.get('/reports/all');
    
    console.log('✅ Reports fetched:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Error fetching reports:', error.response?.data || error);
    throw error;
  }
};

export const updateReportStatus = async (reportId, statusData) => {
  try {
    console.log('📝 Updating report status:', { reportId, statusData });
    
    const response = await api.put(`/reports/${reportId}/status`, statusData);
    
    console.log('✅ Update response:', response.data);
    
    if (response.data.success || response.status === 200) {
      return response.data;
    } else {
      throw new Error(response.data.message || 'Failed to update report');
    }
  } catch (error) {
    console.error('❌ Error updating report status:', error.response?.data || error);
    throw error;
  }
};

export const getUserReportHistory = async (userId) => {
  try {
    const response = await api.get(`/reports/history/${userId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching user report history:', error);
    throw error;
  }
};

export const notifyUser = async (userId, notificationData) => {
  try {
    console.log('📧 Sending notification to user:', userId, notificationData);
    
    const response = await api.post(`/notifications/send`, {
      user_id: userId,
      ...notificationData
    });
    
    console.log('✅ Notification sent');
    return response.data;
  } catch (error) {
    console.error('⚠️ Error sending notification (non-critical):', error);
    return { success: false };
  }
};

export const getNotifications = async (userId) => {
  try {
    const response = await api.get(`/notifications/user/${userId}`);
    return response.data;
  } catch (error) {
    console.error('Get notifications error:', error);
    throw error;
  }
};

export const createNotification = async (notification) => {
  try {
    const response = await api.post('/notifications/create', notification);
    return response.data;
  } catch (error) {
    console.error('Create notification error:', error);
    throw error;
  }
};

export const markNotificationAsRead = async (notificationId) => {
  try {
    const response = await api.put(`/notifications/${notificationId}/read`);
    return response.data;
  } catch (error) {
    console.error('Mark as read error:', error);
    throw error;
  }
};

export const markAllNotificationsAsRead = async (userId) => {
  try {
    const response = await api.put(`/notifications/user/${userId}/read-all`);
    return response.data;
  } catch (error) {
    console.error('Mark all as read error:', error);
    throw error;
  }
};

export const getConversations = async (userId) => {
  try {
    const response = await api.get(`/messages/conversations/${userId}`);
    return response.data;
  } catch (error) {
    console.error('Get conversations error:', error);
    throw error;
  }
};

export const getMessages = async (userId, otherUserId) => {
  try {
    console.log('API: Fetching messages for:', userId, otherUserId);
    const response = await api.get(`/messages/messages/${userId}/${otherUserId}`);
    console.log('API: Got messages:', response.data);
    return response.data;
  } catch (error) {
    console.error('API: Get messages error:', error);
    throw error;
  }
};

export const sendMessage = async (messageData) => {
  try {
    console.log('API: Sending message:', messageData);
    const response = await api.post('/messages/send', messageData);
    console.log('API: Response:', response.data);
    return response.data;
  } catch (error) {
    console.error('API: Error response:', error.response?.data);
    console.error('API: Error status:', error.response?.status);
    throw error;
  }
};

export const markMessageAsRead = async (messageId) => {
  try {
    const response = await api.put(`/messages/mark-read/${messageId}`);
    return response.data;
  } catch (error) {
    console.error('Mark as read error:', error);
    throw error;
  }
};

export const getUserById = async (userId) => {
   const response = await api.get(`/auth/user/${userId}`);
   return response.data;
};

export const requestPasswordReset = async (email) => {
  try {
    const response = await api.post('/auth/forgot-password', { email });
    return response;
  } catch (error) {
    throw error;
  }
};

export const verifyResetCode = async (email, code) => {
  try {
    const response = await api.post('/auth/verify-reset-code', { email, code });
    return response;
  } catch (error) {
    throw error;
  }
};

export const resetPassword = async (email, code, newPassword) => {
  try {
    const response = await api.post('/auth/reset-password', { email, code, newPassword });
    return response;
  } catch (error) {
    throw error;
  }
};

export const getAllUsers = async () => {
  try {
    const response = await api.get("/admin/all-users");
    return response.data;
  } catch (error) {
    console.error("Get all users error:", error);
    throw error;
  }
};

export const getUserConversations = async (userId) => {
  try {
    const response = await api.get(`/admin/user-conversations/${userId}`);
    return response.data;
  } catch (error) {
    console.error("Get user conversations error:", error);
    throw error;
  }
};

export const getConversationMessages = async (userId, otherUserId) => {
  try {
    const response = await api.get(`/admin/conversation-messages/${userId}/${otherUserId}`);
    return response.data;
  } catch (error) {
    console.error("Get conversation messages error:", error);
    throw error;
  }
};

export const bookmarkService = async (serviceId) => {
  try {
    const user = JSON.parse(localStorage.getItem('user'));
    const response = await api.post(`/services/${serviceId}/bookmark`, {
      userId: user?.id
    });
    return response.data;
  } catch (error) {
    console.error('Bookmark service error:', error);
    throw error;
  }
};

export const unbookmarkService = async (serviceId) => {
  try {
    const user = JSON.parse(localStorage.getItem('user'));
    const response = await api.delete(`/services/${serviceId}/bookmark`, {
      data: {
        userId: user?.id
      }
    });
    return response.data;
  } catch (error) {
    console.error('Unbookmark service error:', error);
    throw error;
  }
};

export const getSavedServices = async (userId) => {
  try {
    const response = await api.get(`/services/saved/${userId}`);
    return response.data.data || [];
  } catch (error) {
    console.error('Get saved services error:', error);
    throw error;
  }
};

export const isServiceBookmarked = async (serviceId) => {
  try {
    const user = JSON.parse(localStorage.getItem('user'));
    const response = await api.get(`/services/${serviceId}/is-bookmarked`, {
      data: {
        userId: user?.id
      }
    });
    return response.data.isBookmarked;
  } catch (error) {
    console.error('Check bookmark error:', error);
    return false;
  }
};

// ✅ Get monthly earnings and spent
export const getUserMonthlyStats = async (userId) => {
  try {
    const response = await api.get(`/transactions/monthly/${userId}`);
    return response.data;
  } catch (error) {
    console.error('Get monthly stats error:', error);
    throw error;
  }
};

// ✅ Get total earnings (all time)
export const getUserEarnings = async (userId) => {
  try {
    const response = await api.get(`/transactions/earnings/${userId}`);
    return response.data;
  } catch (error) {
    console.error('Get earnings error:', error);
    throw error;
  }
};

// ✅ Get total spent (all time)
export const getUserSpent = async (userId) => {
  try {
    const response = await api.get(`/transactions/spent/${userId}`);
    return response.data;
  } catch (error) {
    console.error('Get spent error:', error);
    throw error;
  }
};

export default api;