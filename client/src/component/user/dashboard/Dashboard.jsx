import React, { useState, useEffect, useRef } from "react";
import {
  HomeIcon,
  UserIcon,
  ChatBubbleLeftIcon,
  ClipboardDocumentListIcon,
  MagnifyingGlassIcon,
  WalletIcon,
  ReceiptRefundIcon,
  ChatBubbleOvalLeftIcon,
  ArrowRightOnRectangleIcon,
  BellIcon,
  StarIcon,
  PlusIcon,
  VideoCameraIcon,
  Bars3Icon,
  XMarkIcon,
  BookmarkIcon,
  EllipsisVerticalIcon,
} from "@heroicons/react/24/outline";
import { useNavigate } from 'react-router-dom';
import { 
  getAnnouncements, 
  getUserServices, 
  getUserMonthlyStats, 
  getNotifications,
  createBooking,
  bookmarkService,
  unbookmarkService,
  getSavedServices
} from '../../../services/api';
import io from 'socket.io-client';

// Star Rating Display Component
const StarRating = ({ rating, totalRatings }) => {
  const stars = [];
  const ratingNum = parseFloat(rating) || 0;

  for (let i = 1; i <= 5; i++) {
    stars.push(
      <span key={i} className={i <= Math.floor(ratingNum) ? "text-yellow-400 text-sm" : "text-gray-300 text-sm"}>
        ★
      </span>
    );
  }

  return (
    <div className="flex items-center gap-1">
      <div className="flex gap-0.5">{stars}</div>
      {totalRatings > 0 ? (
        <span className="text-xs text-gray-600">{ratingNum.toFixed(1)} ({totalRatings})</span>
      ) : (
        <span className="text-xs text-gray-400">No ratings</span>
      )}
    </div>
  );
};

// Parse availability from JSON
const parseAvailability = (availability) => {
  if (!availability) return [];
  if (Array.isArray(availability)) return availability;
  if (typeof availability === 'string') {
    try {
      const parsed = JSON.parse(availability);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return [];
    }
  }
  return [];
};

// Feedback Modal Component
function FeedbackModal({ service, onClose }) {
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchServiceFeedbacks();
  }, [service.id]);

  const fetchServiceFeedbacks = async () => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:5000/api/services/${service.id}/feedbacks`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch feedbacks: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Feedbacks:', data);
      setFeedbacks(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching feedbacks:', err);
      setError(err.message);
      setFeedbacks([]);
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (rating) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <span key={i} className={i <= rating ? "text-yellow-400 text-lg" : "text-gray-300 text-lg"}>
          ★
        </span>
      );
    }
    return stars;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  // Ensure average_rating is a number before using toFixed / Math.round
  const averageRating = parseFloat(service?.average_rating) || 0;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4 sm:p-6 flex justify-between items-center">
          <div>
            <h2 className="text-lg sm:text-2xl font-semibold">{service.title}</h2>
            <p className="text-sm text-blue-100 mt-1">All Feedbacks</p>
          </div>
          <button
            onClick={onClose}
            className="flex-shrink-0 hover:bg-white/10 p-2 rounded-lg transition-colors"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-40">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-500 text-sm">Loading feedbacks...</p>
              </div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-40">
              <div className="text-center">
                <p className="text-red-500 text-sm mb-2">❌ {error}</p>
                <button
                  onClick={fetchServiceFeedbacks}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                >
                  Retry
                </button>
              </div>
            </div>
          ) : feedbacks.length === 0 ? (
            <div className="flex items-center justify-center h-40">
              <div className="text-center">
                <ChatBubbleOvalLeftIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 text-sm">No feedbacks yet for this service</p>
              </div>
            </div>
          ) : (
            <div className="p-4 sm:p-6 space-y-4">
              {/* Service Summary */}
              <div className="bg-blue-50 rounded-xl p-4 mb-6 border border-blue-200">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <p className="text-xs text-gray-600 uppercase font-semibold mb-1">Average Rating</p>
                    <div className="flex items-center gap-2">
                      <div className="flex gap-0.5">
                        {renderStars(Math.round(averageRating))}
                      </div>
                      <span className="text-lg font-bold text-blue-600">
                        {averageRating.toFixed(1)}/5
                      </span>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 uppercase font-semibold mb-1">Total Feedbacks</p>
                    <p className="text-2xl font-bold text-gray-900">{feedbacks.length}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 uppercase font-semibold mb-1">Provider</p>
                    <p className="text-lg font-semibold text-gray-900">{service.user_full_name}</p>
                  </div>
                </div>
              </div>

              {/* Rating Distribution */}
              {feedbacks.length > 0 && (
                <div className="bg-gray-50 rounded-xl p-4 mb-6 border border-gray-200">
                  <h3 className="text-sm font-semibold text-gray-900 mb-4">Rating Distribution</h3>
                  <div className="space-y-2">
                    {[5, 4, 3, 2, 1].map((star) => {
                      const count = feedbacks.filter(f => f.rating === star).length;
                      const percentage = (count / feedbacks.length) * 100;
                      return (
                        <div key={star} className="flex items-center gap-3">
                          <span className="text-sm font-medium text-gray-600 w-8">{star}★</span>
                          <div className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden">
                            <div 
                              className="bg-yellow-400 h-full transition-all"
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                          <span className="text-xs text-gray-500 w-6 text-right">{count}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Feedbacks List */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-gray-900">Customer Feedback</h3>
                {feedbacks.map((feedback) => (
                  <div key={feedback.id} className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-semibold text-gray-900 text-sm sm:text-base">
                          {feedback.learner_name || 'Anonymous'}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {formatDate(feedback.created_at)}
                        </p>
                      </div>
                      <div className="flex gap-0.5">
                        {renderStars(feedback.rating)}
                      </div>
                    </div>

                    {feedback.comment && (
                      <p className="text-gray-700 text-sm mt-3 leading-relaxed">
                        {feedback.comment}
                      </p>
                    )}

                    {/* Rating Badge */}
                    <div className="flex items-center gap-2 mt-3">
                      <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold ${
                        feedback.rating >= 4
                          ? 'bg-green-100 text-green-700'
                          : feedback.rating >= 3
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {feedback.rating >= 4 ? '👍 Positive' : feedback.rating >= 3 ? '👌 Neutral' : '👎 Negative'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t bg-gray-50 p-4">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// Booking Confirmation Modal
function BookingModal({ service, onClose, onConfirm }) {
  if (!service) return null;

  const availabilityArray = parseAvailability(service.availability);

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl p-4 sm:p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-lg sm:text-xl font-semibold mb-4">Confirm Booking</h2>
        <div className="space-y-4 max-h-[70vh] overflow-y-auto">
          <div className="bg-gray-50 p-4 rounded-xl">
            <h3 className="font-semibold text-base sm:text-lg">{service.title}</h3>
            <p className="text-gray-600 text-xs sm:text-sm mt-1">{service.description}</p>
            
            <div className="mt-4 space-y-3 border-t pt-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Price:</span>
                <span className="font-bold text-blue-600">SC {service.price}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Provider:</span>
                <span className="font-medium truncate">{service.user_full_name || 'Unknown Provider'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Rating:</span>
                <StarRating 
                  rating={service.average_rating} 
                  totalRatings={service.total_ratings}
                />
              </div>

              {/* Availability in Modal */}
              {availabilityArray.length > 0 && (
                <div className="border-t pt-3">
                  <p className="text-sm font-medium text-gray-700 mb-2">Available Times:</p>
                  <div className="space-y-1">
                    {availabilityArray.map((slot, index) => (
                      <div key={index} className="flex items-center gap-2 text-xs sm:text-sm">
                        <span className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0"></span>
                        <span className="text-gray-700">
                          {slot.day}: {slot.startTime} - {slot.endTime}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-4 border-t">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-sm border"
            >
              Cancel
            </button>
            <button
              onClick={() => onConfirm(service)}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
            >
              Confirm Booking
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [userData, setUserData] = useState(null);
  const [announcements, setAnnouncements] = useState([]);
  const [services, setServices] = useState([]);
  const [monthlyStats, setMonthlyStats] = useState({ earnings: 0, spent: 0, netEarnings: 0 });
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [ongoingBookings, setOngoingBookings] = useState([]);
  const [recommendedServices, setRecommendedServices] = useState([]);
  const [bookmarkedServices, setBookmarkedServices] = useState(new Set());
  const [loadingRecommendations, setLoadingRecommendations] = useState(true);
  const [loadingBookmarks, setLoadingBookmarks] = useState(new Set());
  const [selectedService, setSelectedService] = useState(null);
  const [selectedFeedbackService, setSelectedFeedbackService] = useState(null);
  const socketRef = useRef(null);

  // Initialize Socket.IO Connection
  useEffect(() => {
    if (!userData?.id) return;

    const socket = io('http://localhost:5000', {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('✅ Dashboard: Connected to WebSocket');
      socket.emit('user-online', userData.id);
    });

    // Listen for announcements
    socket.on('announcement-created', (newAnnouncement) => {
      console.log('📢 New announcement:', newAnnouncement);
      if (canSeeAnnouncement(newAnnouncement)) {
        setAnnouncements(prev => [newAnnouncement, ...prev]);
      }
    });

    socket.on('announcement-updated', (updatedAnnouncement) => {
      console.log('📝 Announcement updated:', updatedAnnouncement);
      setAnnouncements(prev =>
        prev.map(ann =>
          ann.id === updatedAnnouncement.id ? updatedAnnouncement : ann
        )
      );
    });

    socket.on('announcement-deleted', (announcementId) => {
      console.log('🗑️ Announcement deleted:', announcementId);
      setAnnouncements(prev =>
        prev.filter(ann => ann.id !== announcementId)
      );
    });

    // Listen for services
    socket.on('service-created', (newService) => {
      console.log('✨ New class created:', newService);
      if (newService.user_id === userData.id) {
        setServices(prev => [newService, ...prev]);
      } else {
        // Add to recommendations if it's not user's service
        setRecommendedServices(prev => {
          const updated = [newService, ...prev];
          return updated.slice(0, 6); // Keep only top 6
        });
      }
    });

    socket.on('service-updated', (updatedService) => {
      console.log('🔄 Service updated:', updatedService);
      setServices(prev =>
        prev.map(service =>
          service.id === updatedService.id ? updatedService : service
        )
      );
      setRecommendedServices(prev =>
        prev.map(service =>
          service.id === updatedService.id ? updatedService : service
        )
      );
    });

    socket.on('service-deleted', (deletedServiceData) => {
      console.log('🗑️ Service deleted:', deletedServiceData);
      const serviceId = deletedServiceData.serviceId || deletedServiceData.id || deletedServiceData;
      setServices(prev =>
        prev.filter(service => service.id !== serviceId)
      );
      setRecommendedServices(prev =>
        prev.filter(service => service.id !== serviceId)
      );
    });

    // Listen for bookmarks
    socket.on('bookmark-service-added', (data) => {
      console.log('📌 Dashboard: Bookmark added detected:', data);
      if (userData?.id === data.userId) {
        setBookmarkedServices(prev => new Set(prev).add(data.serviceId));
      }
    });

    socket.on('bookmark-service-removed', (data) => {
      console.log('🗑️ Dashboard: Bookmark removed detected:', data);
      if (userData?.id === data.userId) {
        setBookmarkedServices(prev => {
          const updated = new Set(prev);
          updated.delete(data.serviceId);
          return updated;
        });
      }
    });

    socket.on('booking-updated', (bookingData) => {
      console.log('📢 Booking status updated:', bookingData);
      if (userData?.id) {
        fetchUserServices(userData.id);
        fetchMonthlyStats(userData.id);
      }
    });

    socket.on('booking-created', (bookingData) => {
      console.log('✨ New booking created:', bookingData);
      if (userData?.id) {
        fetchMonthlyStats(userData.id);
      }
    });

    // Listen for notifications (created/updated) and refresh unread count
    socket.on('new-notification', (notification) => {
      try {
        console.log('🔔 Dashboard received new-notification:', notification);
        if (userData?.id) {
          getNotifications(userData.id)
            .then(notifs => {
              const unread = (notifs || []).filter(n => !n.read).length;
              setUnreadCount(unread);
            })
            .catch(err => console.error('Error fetching notifications (dashboard):', err));
        }
      } catch (err) {
        console.error('Error handling new-notification on dashboard:', err);
      }
    });
    // When a notification is updated (e.g., marked read) elsewhere, refresh
    socket.on('notification-updated', (payload) => {
      try {
        console.log('🔁 Dashboard received notification-updated:', payload);
        if (userData?.id) {
          getNotifications(userData.id)
            .then(notifs => {
              const unread = (notifs || []).filter(n => !n.read).length;
              setUnreadCount(unread);
            })
            .catch(err => console.error('Error fetching notifications (dashboard) after update:', err));
        }
      } catch (err) {
        console.error('Error handling notification-updated on dashboard:', err);
      }
    });

    socket.on('disconnect', () => {
      console.log('❌ Dashboard: Disconnected from WebSocket');
    });

    socket.on('error', (error) => {
      console.error('WebSocket error:', error);
    });

    return () => {
      if (userData?.id) {
        socket.emit('user-offline', userData.id);
      }
      socket.disconnect();
    };
  }, [userData?.id]);

  // Fetch user data on mount
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const storedUser = JSON.parse(localStorage.getItem('user'));
        if (storedUser) {
          setUserData(storedUser);
          console.log('✅ User data loaded:', storedUser);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  // Fetch unread notifications count
  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem('user'));
    if (storedUser?.id) {
      getNotifications(storedUser.id).then(notificationsResponse => {
        const unread = notificationsResponse.filter(n => !n.read).length;
        setUnreadCount(unread);
      }).catch(err => console.error('Error fetching notifications:', err));
    }
  }, []);

  // Load bookmarked services when userData changes
  useEffect(() => {
    if (userData?.id) {
      loadBookmarkedServices();
    }
  }, [userData]);

  const loadBookmarkedServices = async () => {
    try {
      const saved = await getSavedServices(userData.id);
      const bookmarkedIds = new Set(saved.map(s => s.id));
      setBookmarkedServices(bookmarkedIds);
      console.log('📌 Bookmarked services loaded:', bookmarkedIds);
    } catch (error) {
      console.error('Error loading bookmarked services:', error);
    }
  };

  // Fetch announcements, services, and monthly stats when userData changes
  useEffect(() => {
    if (userData?.id) {
      fetchAnnouncements();
      fetchMonthlyStats(userData.id);
      fetchOngoingSessions(userData.id);
      fetchRecommendations(userData.id);
      const userRole = userData?.role?.toLowerCase() || '';
      if (userRole === 'tutor' || userRole === 'both') {
        fetchUserServices(userData.id);
      }
    }
  }, [userData?.id]);

  const fetchAnnouncements = async () => {
    try {
      console.log('📋 Fetching announcements...');
      const data = await getAnnouncements();
      const validAnnouncements = Array.isArray(data) ? data : [];
      setAnnouncements(validAnnouncements);
      console.log('✅ Announcements loaded:', validAnnouncements);
    } catch (error) {
      console.error('❌ Error fetching announcements:', error);
      setAnnouncements([]);
    }
  };

  const fetchUserServices = async (userId) => {
    try {
      console.log('📋 Fetching services for user:', userId);
      const data = await getUserServices(userId);
      
      let validServices = [];
      if (Array.isArray(data)) {
        validServices = data;
      } else if (data?.data && Array.isArray(data.data)) {
        validServices = data.data;
      } else if (data?.services && Array.isArray(data.services)) {
        validServices = data.services;
      }
      
      setServices(validServices);
      console.log('✅ Services loaded:', validServices);
    } catch (error) {
      console.error('❌ Error fetching services:', error);
      setServices([]);
    }
  };

  const fetchOngoingSessions = async (userId) => {
    try {
      console.log('📚 Fetching ongoing sessions for user:', userId);
      const response = await fetch(`http://localhost:5000/api/services/bookings/${userId}`);
      const bookings = await response.json();
      
      const ongoing = bookings.filter(b => b.status === 'ongoing');
      setOngoingBookings(ongoing);
      console.log('✅ Ongoing sessions loaded:', ongoing);
    } catch (error) {
      console.error('❌ Error fetching ongoing sessions:', error);
      setOngoingBookings([]);
    }
  };

  const fetchRecommendations = async (userId) => {
    try {
      console.log('✨ Fetching recommendations for user:', userId);
      setLoadingRecommendations(true);
      
      const response = await fetch(`http://localhost:5000/api/services/all`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch services: ${response.status}`);
      }
      
      const allServices = await response.json();
      console.log('📊 All services:', allServices);
      
      // Filter out user's own services and get top rated
      const otherServices = allServices
        .filter(s => s.user_id !== userId)
        .sort((a, b) => (b.average_rating || 0) - (a.average_rating || 0))
        .slice(0, 6);
      
      setRecommendedServices(otherServices);
      console.log('✅ Recommendations set:', otherServices);

      // Try to load bookmarked services (optional feature)
      try {
        const savedResponse = await fetch(`http://localhost:5000/api/services/saved/${userId}`);
        
        if (savedResponse.ok) {
          const savedData = await savedResponse.json();
          const saved = savedData.data || savedData || [];
          const bookmarkedIds = new Set(saved.map(s => s.id || s.service_id));
          setBookmarkedServices(bookmarkedIds);
          console.log('📌 Bookmarks loaded:', Array.from(bookmarkedIds));
        } else {
          console.warn('⚠️ Bookmarks endpoint returned', savedResponse.status);
          setBookmarkedServices(new Set());
        }
      } catch (bookmarkError) {
        console.warn('⚠️ Bookmarks unavailable (non-critical):', bookmarkError.message);
        setBookmarkedServices(new Set());
      }
      
    } catch (error) {
      console.error('❌ Error fetching recommendations:', error);
      setRecommendedServices([]);
      setBookmarkedServices(new Set());
    } finally {
      setLoadingRecommendations(false);
    }
  };

  const fetchMonthlyStats = async (userId) => {
    try {
      console.log('📊 Fetching monthly stats for user:', userId);
      const response = await getUserMonthlyStats(userId);
      const data = response.data || response;
      
      setMonthlyStats({
        earnings: parseFloat(data.earnings || 0),
        spent: parseFloat(data.spent || 0),
        netEarnings: parseFloat(data.net_earnings || 0)
      });
      
      console.log('✅ Monthly stats loaded:', {
        earnings: data.earnings,
        spent: data.spent,
        netEarnings: data.net_earnings
      });
    } catch (error) {
      console.error('❌ Error fetching monthly stats:', error);
      setMonthlyStats({ earnings: 0, spent: 0, netEarnings: 0 });
    }
  };

  const getEarnings = () => parseFloat(monthlyStats.earnings || 0).toFixed(2);
  const getSpent = () => parseFloat(monthlyStats.spent || 0).toFixed(2);
  const getNetEarnings = () => parseFloat(monthlyStats.netEarnings || 0).toFixed(2);

  const canSeeAnnouncement = (announcement) => {
    if (!announcement) return false;
    
    const userRole = userData?.role?.toLowerCase() || '';
    const target = announcement.target_audience?.toLowerCase() || '';

    if (target === 'all users') return true;
    if (target === 'tutors only' && userRole === 'tutor') return true;
    if (target === 'learners only' && userRole === 'learner') return true;
    if (target === 'requesters only' && userRole === 'learner') return true;
    if (target === 'both') return true;
    return false;
  };

  const toggleBookmark = async (serviceId, e) => {
    e.stopPropagation();
    
    try {
      setLoadingBookmarks(prev => new Set(prev).add(serviceId));
      
      if (bookmarkedServices.has(serviceId)) {
        await unbookmarkService(serviceId);
        setBookmarkedServices(prev => {
          const updated = new Set(prev);
          updated.delete(serviceId);
          return updated;
        });
        console.log('✅ Bookmark removed:', serviceId);
      } else {
        await bookmarkService(serviceId);
        setBookmarkedServices(prev => new Set(prev).add(serviceId));
        console.log('✅ Bookmark added:', serviceId);
      }
    } catch (error) {
      console.error('Error toggling bookmark:', error);
      if (error.response?.data?.isAlreadyBookmarked) {
        setBookmarkedServices(prev => new Set(prev).add(serviceId));
      } else {
        alert('Failed to update bookmark');
      }
    } finally {
      setLoadingBookmarks(prev => {
        const updated = new Set(prev);
        updated.delete(serviceId);
        return updated;
      });
    }
  };

  const handleBookNow = (service) => {
    setSelectedService(service);
  };

  const handleConfirmBooking = async (service) => {
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      const learnerName = user?.full_name;
      
      const bookingData = {
        userId: user.id,
        serviceId: service.id,
        providerId: service.user_id,
        type: 'booking',
        amount: service.price,
        status: 'pending'
      };

      const response = await createBooking(bookingData);
      
      if (response.data) {
        setSelectedService(null);
        
        if (socketRef.current && socketRef.current.connected) {
          socketRef.current.emit('booking-created', {
            bookingId: response.data.id,
            userId: user.id,
            learnerName: learnerName,
            serviceId: service.id,
            providerId: service.user_id,
            status: 'pending',
            price: service.price,
            timestamp: new Date()
          });
        }
        
        navigate('/transactions', { 
          replace: true,
          state: { 
            refresh: true,
            newBookingId: response.data.id
          }
        });
      }
    } catch (error) {
      console.error('Booking error:', error);
      alert(error.response?.data?.message || 'Failed to book service. Please try again.');
    }
  };

  const role = userData?.role?.toLowerCase() || '';

  const navItems = (() => {
    if (role === 'learner') {
      return [
        { name: "Home", icon: <HomeIcon className="h-5 w-5" />, path: "/dashboard" },
        { name: "Profile", icon: <UserIcon className="h-5 w-5" />, path: "/profile" },
        { name: "Messages", icon: <ChatBubbleLeftIcon className="h-5 w-5" />, path: "/messages" },
        { name: "Find Classes", icon: <MagnifyingGlassIcon className="h-5 w-5" />, path: "/find-classes" },
        { name: "Saved", icon: <BookmarkIcon className="h-5 w-5" />, path: "/saved" },
        { name: "Wallet", icon: <WalletIcon className="h-5 w-5" />, path: "/wallet" },
        { name: "Transactions", icon: <ReceiptRefundIcon className="h-5 w-5" />, path: "/transactions" },
        { name: "Feedbacks & Ratings", icon: <ChatBubbleOvalLeftIcon className="h-5 w-5" />, path: "/view-past-feedback" },
        { name: "Log Out", icon: <ArrowRightOnRectangleIcon className="h-5 w-5" />, path: "/" },
      ];
    }

    if (role === 'tutor') {
      return [
        { name: "Home", icon: <HomeIcon className="h-5 w-5" />, path: "/dashboard" },
        { name: "Profile", icon: <UserIcon className="h-5 w-5" />, path: "/profile" },
        { name: "Messages", icon: <ChatBubbleLeftIcon className="h-5 w-5" />, path: "/messages" },
        { name: "My Classes", icon: <ClipboardDocumentListIcon className="h-5 w-5" />, path: "/my-classes" },
        { name: "Wallet", icon: <WalletIcon className="h-5 w-5" />, path: "/wallet" },
        { name: "Transactions", icon: <ReceiptRefundIcon className="h-5 w-5" />, path: "/transactions" },
        { name: "Feedbacks & Ratings", icon: <ChatBubbleOvalLeftIcon className="h-5 w-5" />, path: "/view-past-feedback" },
        { name: "Log Out", icon: <ArrowRightOnRectangleIcon className="h-5 w-5" />, path: "/" },
      ];
    }

    return [
      { name: "Home", icon: <HomeIcon className="h-5 w-5" />, path: "/dashboard" },
      { name: "Profile", icon: <UserIcon className="h-5 w-5" />, path: "/profile" },
      { name: "Messages", icon: <ChatBubbleLeftIcon className="h-5 w-5" />, path: "/messages" },
      { name: "My Classes", icon: <ClipboardDocumentListIcon className="h-5 w-5" />, path: "/my-classes" },
      { name: "Find Classes", icon: <MagnifyingGlassIcon className="h-5 w-5" />, path: "/find-classes" },
      { name: "Saved", icon: <BookmarkIcon className="h-5 w-5" />, path: "/saved" },
      { name: "Wallet", icon: <WalletIcon className="h-5 w-5" />, path: "/wallet" },
      { name: "Transactions", icon: <ReceiptRefundIcon className="h-5 w-5" />, path: "/transactions" },
      { name: "Feedbacks & Ratings", icon: <ChatBubbleOvalLeftIcon className="h-5 w-5" />, path: "/view-past-feedback" },
      { name: "Log Out", icon: <ArrowRightOnRectangleIcon className="h-5 w-5" />, path: "/" },
    ];
  })();

  const renderAnnouncements = () => {
    const visibleAnnouncements = Array.isArray(announcements)
      ? announcements.filter(announcement => canSeeAnnouncement(announcement))
      : [];

    const getAnnouncementIcon = (targetAudience) => {
      const target = targetAudience?.toLowerCase() || '';
      if (target.includes('all')) return '📢';
      if (target.includes('tutor')) return '👨‍🏫';
      if (target.includes('learner') || target.includes('requester')) return '🎓';
      return '📣';
    };

    const getAnnouncementColor = (targetAudience) => {
      const target = targetAudience?.toLowerCase() || '';
      if (target.includes('all')) return 'from-blue-500 to-indigo-500';
      if (target.includes('tutor')) return 'from-purple-500 to-pink-500';
      if (target.includes('learner') || target.includes('requester')) return 'from-green-500 to-teal-500';
      return 'from-gray-500 to-slate-500';
    };

    return (
      <>
        <div className="p-4 mx-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-lg flex items-center gap-2">
              <span className="text-2xl">📢</span>
              Announcements
            </h2>
            {visibleAnnouncements.length > 0 && (
              <span className="bg-blue-100 text-blue-700 text-xs font-semibold px-2.5 py-1 rounded-full">
                {visibleAnnouncements.length} new
              </span>
            )}
          </div>
          <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
            {visibleAnnouncements.length === 0 ? (
              <div className="text-center py-12 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl border-2 border-dashed border-gray-300">
                <div className="text-5xl mb-3">📭</div>
                <p className="text-gray-500 font-medium">No announcements at the moment</p>
                <p className="text-xs text-gray-400 mt-1">Check back later for updates</p>
              </div>
            ) : (
              visibleAnnouncements.map((announcement, index) => (
                <div
                  key={announcement.id}
                  className="bg-white rounded-2xl shadow-md border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-300 animate-fadeIn"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className={`h-1.5 bg-gradient-to-r ${getAnnouncementColor(announcement.target_audience)}`}></div>
                  
                  <div className="p-4">
                    <div className="flex items-start gap-3 mb-3">
                      <span className="text-2xl flex-shrink-0 mt-0.5">
                        {getAnnouncementIcon(announcement.target_audience)}
                      </span>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-base sm:text-lg text-gray-900 leading-tight">
                          {announcement.title}
                        </h3>
                      </div>
                    </div>

                    <p className="text-sm sm:text-base text-gray-700 leading-relaxed mb-4 pl-11">
                      {announcement.content}
                    </p>

                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pt-3 border-t border-gray-100 pl-11">
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-gradient-to-r ${getAnnouncementColor(announcement.target_audience)} text-white`}>
                          {announcement.target_audience}
                        </span>
                      </div>
                      <span className="text-xs text-gray-500 flex items-center gap-1">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        {new Date(announcement.created_at).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric', 
                          year: 'numeric' 
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </>
    );
  };

  const renderOngoingSessions = () => {
    return (
      <div className="p-4 mx-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-lg flex items-center gap-2">
            <span className="text-2xl">📚</span>
            Ongoing Sessions
          </h2>
          {ongoingBookings.length > 0 && (
            <span className="bg-green-100 text-green-700 text-xs font-semibold px-2.5 py-1 rounded-full">
              {ongoingBookings.length} active
            </span>
          )}
        </div>

        <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
          {ongoingBookings.length === 0 ? (
            <div className="text-center py-8 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl border-2 border-dashed border-gray-300">
              <div className="text-4xl mb-3">📚</div>
              <p className="text-gray-500 font-medium">No ongoing sessions</p>
              <p className="text-xs text-gray-400 mt-1">Your active bookings will appear here</p>
            </div>
          ) : (
            ongoingBookings.map((booking) => (
              <div key={booking.id} className="bg-white rounded-2xl shadow-md border border-gray-200 p-4 hover:shadow-lg transition-all">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <h3 className="font-bold text-base text-gray-900">{booking.service_title}</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {booking.is_provider ? `with ${booking.requester_name}` : `with ${booking.provider_name}`}
                    </p>
                  </div>
                  <span className="bg-green-100 text-green-700 text-xs font-semibold px-3 py-1 rounded-full">
                    Ongoing
                  </span>
                </div>
                
                <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-100">
                  <span className="text-sm text-gray-500">SC {booking.amount}</span>
                  <button
                    onClick={() => navigate('/transactions')}
                    className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                  >
                    View Details →
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  };

  const renderRecommendations = () => {
    const userRole = userData?.role?.toLowerCase() || '';
    if (userRole === 'tutor') return null;

    if (loadingRecommendations) {
      return (
        <div className="p-4 mx-4">
          <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
            <span className="text-2xl">✨</span>
            Recommended for You
          </h2>
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          </div>
        </div>
      );
    }

    return (
      <div className="p-4 mx-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-lg flex items-center gap-2">
            <span className="text-2xl">✨</span>
            Recommended for You
          </h2>
          {recommendedServices.length > 0 && (
            <button
              onClick={() => navigate('/find-classes')}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              View All →
            </button>
          )}
        </div>

        {recommendedServices.length === 0 ? (
          <div className="text-center py-12 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl border-2 border-dashed border-gray-300">
            <div className="text-5xl mb-3">✨</div>
            <p className="text-gray-500 font-medium">No recommendations yet</p>
            <p className="text-xs text-gray-400 mt-1 mb-4">Explore services to get personalized recommendations</p>
            <button
              onClick={() => navigate('/find-classes')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
            >
              Browse Services
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[500px] overflow-y-auto pr-2">
            {recommendedServices.map((service) => {
              const availabilityArray = parseAvailability(service.availability);
              
              return (
                <div 
                  key={service.id} 
                  className="bg-white rounded-2xl p-3 sm:p-4 shadow-sm border border-gray-100 hover:shadow-md transition-all flex flex-col h-fit"
                >
                  <div className="flex justify-between items-start gap-2 mb-2">
                    <h2 className="font-semibold text-sm sm:text-base text-gray-900 line-clamp-2 h-10">
                      {service.title}
                    </h2>
                    <div className="flex gap-1 flex-shrink-0">
                      <button 
                        onClick={(e) => toggleBookmark(service.id, e)}
                        disabled={loadingBookmarks.has(service.id)}
                        className={`hover:bg-gray-100 p-2 rounded-lg transition-all ${
                          bookmarkedServices.has(service.id) ? 'text-blue-600' : 'text-gray-400'
                        } ${loadingBookmarks.has(service.id) ? 'opacity-50 cursor-not-allowed' : ''}`}
                        title={bookmarkedServices.has(service.id) ? 'Remove bookmark' : 'Bookmark this service'}
                      >
                        <BookmarkIcon className={`h-5 w-5 ${bookmarkedServices.has(service.id) ? 'fill-current' : ''}`} />
                      </button>
                      
                      <div className="relative group">
                        <button className="hover:bg-gray-100 p-1 rounded-lg transition-colors">
                          <EllipsisVerticalIcon className="h-5 w-5 text-gray-500" />
                        </button>
                        
                        <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10 min-w-48">
                          <button
                            onClick={() => navigate(`/provider-profile/${service.user_id}`)}
                            className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-blue-50 hover:text-blue-600 font-medium first:rounded-t-lg"
                          >
                            View Profile
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="h-16 border-t border-b border-gray-100 py-2 overflow-y-auto pr-2">
                    <p className="text-gray-600 text-xs sm:text-sm">{service.description}</p>
                  </div>

                  <div className="h-6 py-1 border-b border-gray-100 flex items-center">
                    <p className="text-xs text-gray-500 truncate">by {service.user_full_name}</p>
                  </div>

                  <div className="h-8 py-2 border-b border-gray-100 flex items-center justify-between">
                    <StarRating 
                      rating={service.average_rating}
                      totalRatings={service.total_ratings}
                    />
                    {service.total_ratings > 0 ? (
                      <button
                        onClick={() => setSelectedFeedbackService(service)}
                        className="text-xs text-blue-600 hover:text-blue-800 font-medium ml-2 whitespace-nowrap"
                      >
                        View Feedbacks
                      </button>
                    ) : (
                      <span className="text-xs text-gray-400 ml-2 whitespace-nowrap">
                        No feedbacks yet
                      </span>
                    )}
                  </div>

                  {availabilityArray.length > 0 && (
                    <div className="h-20 py-2 border-b border-gray-100 overflow-hidden flex flex-col">
                      <p className="text-xs font-semibold text-gray-600 mb-1.5 uppercase flex-shrink-0">Available:</p>
                      <div className="flex-1 overflow-y-auto space-y-1 pr-2">
                        {availabilityArray.map((slot, index) => (
                          <div key={index} className="flex items-center gap-2 text-xs flex-shrink-0">
                            <span className="w-1.5 h-1.5 bg-green-500 rounded-full flex-shrink-0"></span>
                            <span className="text-gray-700 truncate">
                              {slot.day} {slot.startTime}-{slot.endTime}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="h-10 flex items-center justify-between mt-2 pt-2 border-t border-gray-100">
                    <span className="font-semibold text-xs sm:text-sm text-blue-600">SC {service.price}</span>
                  </div>

                  <div className="flex gap-2 mt-3">
                    <button
                      className="flex-1 px-2 py-1.5 sm:px-3 sm:py-2 text-xs sm:text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors font-medium"
                      onClick={() => handleBookNow(service)}
                    >
                      Book Now
                    </button>
                    <button 
                      onClick={() => navigate(`/messages/chat/${service.user_id}`)}
                      className="flex-1 px-2 py-1.5 sm:px-3 sm:py-2 text-xs sm:text-sm rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 transition-colors font-medium"
                    >
                      Message
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  const renderServices = () => {
    const userRole = userData?.role?.toLowerCase() || '';
    
    if (userRole !== 'tutor' && userRole !== 'both') {
      return null;
    }

    const validServices = Array.isArray(services) ? services : [];

    return (
      <div className="p-4 mx-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-3">
          <span className="font-semibold text-lg">My Classes</span>
          <button
            onClick={() => navigate('/my-classes')}
            className="flex items-center bg-blue-600 text-white px-4 py-2 rounded-full text-sm hover:bg-blue-700 transition-colors w-full sm:w-auto justify-center"
          >
            <PlusIcon className="h-4 w-4 mr-1" /> Add New
          </button>
        </div>

        <div className="max-h-[300px] overflow-y-auto space-y-4 pr-2">
          {validServices.length > 0 ? (
            validServices.map((service) => (
              <div
                key={service.id}
                className="bg-white rounded-2xl p-4 shadow-lg border border-gray-100 transform transition hover:scale-[1.02] animate-fadeIn"
              >
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-2">
                  <span className="font-semibold text-sm sm:text-base">{service.title}</span>
                  <span
                    className={`text-xs px-3 py-1 rounded-full whitespace-nowrap ${
                      service.status === "active" || service.status === "Active"
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {service.status || "Active"}
                  </span>
                </div>
                <div className="text-sm text-gray-600 mt-2">
                  {service.description}
                </div>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mt-3 pt-3 border-t gap-2">
                  <div className="flex items-center flex-wrap gap-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                    <span className="text-sm text-gray-600">
                      {(() => {
                        try {
                          const availability = typeof service.availability === 'string'
                            ? JSON.parse(service.availability)
                            : service.availability;

                          const formatTime = (time) => {
                            const [hours, minutes] = time.split(':');
                            const h = parseInt(hours);
                            const ampm = h >= 12 ? 'PM' : 'AM';
                            const h12 = h % 12 || 12;
                            return `${h12}:${minutes} ${ampm}`;
                          };

                          if (Array.isArray(availability) && availability.length > 0) {
                            return availability.map((slot, idx) => (
                              <span key={idx} className="inline-block mr-2">
                                {slot.day} {formatTime(slot.startTime)}-{formatTime(slot.endTime)}
                                {idx < availability.length - 1 ? ',' : ''}
                              </span>
                            ));
                          }
                          return 'No availability set';
                        } catch (e) {
                          return service.availability || 'No availability set';
                        }
                      })()}
                    </span>
                  </div>
                  <span className="font-bold text-blue-600">SC {service.price}</span>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 bg-gray-50 rounded-2xl">
              <p className="text-gray-500 text-sm">No classes found</p>
              <button
                onClick={() => navigate("/my-classes")}
                className="mt-2 text-blue-600 hover:text-blue-700 text-sm"
              >
                Create your first service
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-b from-blue-50 to-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-b from-blue-50 to-white min-h-screen flex flex-col lg:flex-row w-full">
      {/* Sidebar - Desktop */}
      <div className="hidden lg:flex fixed inset-y-0 left-0 bg-gradient-to-b from-gray-50 to-white w-64 flex-col shadow-xl border-r z-30">
        <div className="p-4 bg-gradient-to-r from-blue-600 to-indigo-600">
          <h2 className="font-semibold text-white text-lg">Menu</h2>
        </div>

        <nav className="p-3 space-y-1 flex-1 overflow-y-auto">
          {navItems.map((item) => (
            <button
              key={item.name}
              onClick={() => navigate(item.path)}
              className="flex items-center w-full p-3 text-gray-600 hover:text-blue-600 rounded-xl transition-all duration-200 group hover:bg-gradient-to-r from-blue-50 to-indigo-50"
            >
              <div className="bg-white p-2 rounded-lg shadow-sm group-hover:scale-110 transition-transform duration-200">
                {item.icon}
              </div>
              <span className="ml-3 font-medium text-sm">{item.name}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Sidebar - Mobile */}
      <div className={`fixed inset-y-0 left-0 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} bg-gradient-to-b from-gray-50 to-white w-64 transition-transform duration-300 ease-in-out z-40 lg:hidden flex flex-col shadow-xl border-r`}>
        <div className="p-4 bg-gradient-to-r from-blue-600 to-indigo-600 flex justify-between items-center">
          <h2 className="font-semibold text-white">Menu</h2>
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="text-white hover:bg-white/10 p-1 rounded-lg transition-colors"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <nav className="p-3 space-y-1 flex-1 overflow-y-auto">
          {navItems.map((item) => (
            <button
              key={item.name}
              onClick={() => {
                navigate(item.path);
                setIsSidebarOpen(false);
              }}
              className="flex items-center w-full p-3 text-gray-600 hover:text-blue-600 rounded-xl transition-all duration-200 group hover:bg-gradient-to-r from-blue-50 to-indigo-50"
            >
              <div className="bg-white p-2 rounded-lg shadow-sm group-hover:scale-110 transition-transform duration-200">
                {item.icon}
              </div>
              <span className="ml-3 font-medium text-sm">{item.name}</span>
            </button>
          ))}
        </nav>
      </div>

      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        ></div>
      )}

      {/* Main Content */}
      <div className="flex-1 lg:ml-64 overflow-y-auto">
        {/* Welcome Section */}
        <div className="p-4 sm:p-6 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-b-3xl shadow-lg">
          <div className="flex items-center justify-between mb-6 gap-3">
            <div className="flex items-center space-x-3 flex-1 min-w-0">
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="lg:hidden flex-shrink-0 hover:bg-white/10 p-2 rounded-lg transition-colors"
              >
                <Bars3Icon className="h-6 w-6 text-white" />
              </button>
              <div className="min-w-0">
                <div className="text-base sm:text-lg font-semibold truncate">
                  Welcome back, {userData?.full_name || userData?.fullName || 'User'}
                </div>
                <span className="bg-white/20 text-xs px-3 py-1 rounded-full mt-1 inline-block backdrop-blur-sm">
                  {userData?.role || 'User'}
                </span>
              </div>
            </div>
            <button
              onClick={() => navigate('/notification')}
              className="relative flex-shrink-0 hover:bg-white/10 p-2 rounded-lg transition-colors"
            >
              <BellIcon className="h-6 w-6 text-white" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            {role === 'learner' ? (
              <>
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-3 sm:p-4">
                  <div className="text-xl sm:text-2xl font-bold">
                    SC {getSpent()}
                  </div>
                  <div className="text-xs sm:text-sm text-white/80">Spent This Month</div>
                </div>
              </>
            ) : role === 'tutor' ? (
              <>
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-3 sm:p-4">
                  <div className="text-xl sm:text-2xl font-bold">
                    {Array.isArray(services) ? services.filter(s => s.status === "active" || s.status === "Active").length : 0}
                  </div>
                  <div className="text-xs sm:text-sm text-white/80">Active Services</div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-3 sm:p-4">
                  <div className={`text-xl sm:text-2xl font-bold ${
                    parseFloat(getNetEarnings()) < 0 ? 'text-red-300' : 'text-green-300'
                  }`}>
                    SC {getNetEarnings()}
                  </div>
                  <div className="text-xs sm:text-sm text-white/80">
                    {parseFloat(getNetEarnings()) < 0 ? 'Net (After expenses)' : 'Net Earnings This Month'}
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-3 sm:p-4">
                  <div className="text-xl sm:text-2xl font-bold">
                    {Array.isArray(services) ? services.filter(s => s.status === "active" || s.status === "Active").length : 0}
                  </div>
                  <div className="text-xs sm:text-sm text-white/80">Active Services</div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-3 sm:p-4">
                  <div className={`text-xl sm:text-2xl font-bold ${
                    parseFloat(getNetEarnings()) < 0 ? 'text-red-300' : 'text-green-300'
                  }`}>
                    SC {getNetEarnings()}
                  </div>
                  <div className="text-xs sm:text-sm text-white/80">
                    {parseFloat(getNetEarnings()) < 0 ? 'Net (After expenses)' : 'Net Earnings This Month'}
                  </div>
                </div>
              </>
            )}
          </div>

          {(role === 'both' || role === 'tutor') && parseFloat(getSpent()) > 0 && (
            <div className="mt-4 bg-white/10 backdrop-blur-sm rounded-2xl p-3 sm:p-4">
              <div className="space-y-2 text-xs sm:text-sm">
                <div className="flex justify-between">
                  <span className="text-white/80">Gross Earnings:</span>
                  <span className="font-bold text-green-300">+SC {getEarnings()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/80">You Spent:</span>
                  <span className="font-bold text-red-300">-SC {getSpent()}</span>
                </div>
                <div className="border-t border-white/20 pt-2 flex justify-between">
                  <span className="text-white/80 font-semibold">Net Total:</span>
                  <span className={`font-bold ${
                    parseFloat(getNetEarnings()) < 0 ? 'text-red-300' : 'text-green-300'
                  }`}>
                    SC {getNetEarnings()}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Announcements */}
        {renderAnnouncements()}

        {/* Ongoing Sessions */}
        {renderOngoingSessions()}

        {/* Recommendations for Learners */}
        {renderRecommendations()}

        {/* My Classes */}
        {renderServices()}

        <div className="h-4 sm:h-6"></div>
      </div>

      {/* Booking Modal */}
      {selectedService && (
        <BookingModal 
          service={selectedService} 
          onClose={() => setSelectedService(null)} 
          onConfirm={handleConfirmBooking} 
        />
      )}

      {/* Feedback Modal */}
      {selectedFeedbackService && (
        <FeedbackModal 
          service={selectedFeedbackService} 
          onClose={() => setSelectedFeedbackService(null)} 
        />
      )}

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.3s ease-in-out;
        }
      `}</style>
    </div>
  );
}