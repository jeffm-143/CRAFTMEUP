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
  Bars3Icon,
  XMarkIcon,
  BookmarkIcon,
  AdjustmentsHorizontalIcon,
  EllipsisVerticalIcon,
  StarIcon,
} from "@heroicons/react/24/outline";
import { useNavigate } from "react-router-dom";
import { getAllServices, createBooking, bookmarkService, unbookmarkService, getSavedServices, getNotifications } from "../../../services/api";
import io from "socket.io-client";

// Star Rating Display Component
const StarRating = ({ rating, totalRatings }) => {
  const stars = [];
  const ratingNum = parseFloat(rating) || 0;

  for (let i = 1; i <= 5; i++) {
    if (i <= Math.floor(ratingNum)) {
      stars.push(
        <span key={i} className="text-yellow-400 text-sm">
          ★
        </span>
      );
    } else if (i - ratingNum < 1) {
      stars.push(
        <span key={i} className="text-yellow-400 text-sm">
          ★
        </span>
      );
    } else {
      stars.push(
        <span key={i} className="text-gray-300 text-sm">
          ★
        </span>
      );
    }
  }

  return (
    <div className="flex items-center gap-1">
      <div className="flex gap-0.5">
        {stars}
      </div>
      {totalRatings > 0 ? (
        <span className="text-xs text-gray-600">
          {ratingNum.toFixed(1)} ({totalRatings})
        </span>
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
      if (Array.isArray(parsed)) return parsed;
      return [];
    } catch (e) {
      console.warn('Could not parse availability:', availability);
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

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
      {/* YELLOW ALERT HERE */}
    {verificationStatus !== "approved" && (
      <div className="w-full max-w-2xl mb-4 p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded-lg">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-yellow-700 font-medium">Account Verification Required</p>
            <p className="text-sm text-yellow-600 mt-1">
              Your account is currently <span className="font-semibold">{verificationStatus}</span>.  
              You cannot book services until an administrator verifies your account.
            </p>
          </div>
        </div>
      </div>
    )}
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
                        {renderStars(Math.round(service.average_rating))}
                      </div>
                      <span className="text-lg font-bold text-blue-600">
                        {service.average_rating.toFixed(1)}/5
                      </span>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 uppercase font-semibold mb-1">Total Feedbacks</p>
                    <p className="text-2xl font-bold text-gray-900">{feedbacks.length}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 uppercase font-semibold mb-1">Provider</p>
                    <p className="text-lg font-semibold text-gray-900">{service.provider}</p>
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
                <span className="font-medium truncate">{service.provider || 'Unknown Provider'}</span>
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


// FilterPanel component
const FilterPanel = ({ filters, handleFilterChange, categories }) => (
  <div className="bg-white rounded-2xl p-3 sm:p-4 shadow-sm border border-gray-100 mb-4 mx-4">
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-xs sm:text-sm font-medium text-gray-700 mb-1 block">
            Min Price
          </label>
          <input
            type="number"
            name="minPrice"
            value={filters.minPrice}
            onChange={handleFilterChange}
            className="w-full rounded-lg border border-gray-200 text-sm p-2"
            placeholder="Min SC"
          />
        </div>
        <div>
          <label className="text-xs sm:text-sm font-medium text-gray-700 mb-1 block">
            Max Price
          </label>
          <input
            type="number"
            name="maxPrice"
            value={filters.maxPrice}
            onChange={handleFilterChange}
            className="w-full rounded-lg border border-gray-200 text-sm p-2"
            placeholder="Max SC"
          />
        </div>
      </div>

      <div>
        <label className="text-xs sm:text-sm font-medium text-gray-700 mb-1 block">
          Minimum Rating
        </label>
        <select
          name="minRating"
          value={filters.minRating}
          onChange={handleFilterChange}
          className="w-full rounded-lg border border-gray-200 text-sm p-2"
        >
          <option value="">Any Rating</option>
          <option value="4">4+ Stars</option>
          <option value="4.5">4.5+ Stars</option>
          <option value="5">5 Stars</option>
        </select>
      </div>
    </div>
  </div>
);



const FindServices = () => {
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [services, setServices] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [userData, setUserData] = useState(null);
  const [bookmarkedServices, setBookmarkedServices] = useState(new Set());
  const [loadingBookmarks, setLoadingBookmarks] = useState(new Set());
  const [filters, setFilters] = useState({
    category: "",
    minPrice: "",
    maxPrice: "",
    minRating: "",
  });
  const [showFilters, setShowFilters] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const [selectedFeedbackService, setSelectedFeedbackService] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [verificationStatus, setVerificationStatus] = useState(null);
  const socketRef = useRef(null);
  const [showVerificationAlert, setShowVerificationAlert] = useState(false);

  const categories = [
    "All",
    "Origami",
    "Crocheting",
    "Embroidery",
    "Scrapbooking",
    "Resin Art",
  ];

  const role = userData?.role?.toLowerCase() || '';

  const navItems = (() => {
    if (role === 'learner') {
      return [
        { name: "Home", icon: <HomeIcon className="h-5 w-5" />, path: "/dashboard" },
        { name: "Profile", icon: <UserIcon className="h-5 w-5" />, path: "/profile" },
        { name: "Messages", icon: <ChatBubbleLeftIcon className="h-5 w-5" />, path: "/messages" },
        { name: "Find Services", icon: <MagnifyingGlassIcon className="h-5 w-5" />, path: "/find-services" },
        { name: "Saved", icon: <BookmarkIcon className="h-5 w-5" />, path: "/saved" },
        { name: "Wallet", icon: <WalletIcon className="h-5 w-5" />, path: "/wallet" },
        { name: "Transactions", icon: <ReceiptRefundIcon className="h-5 w-5" />, path: "/transactions" },
        { name: "Past Feedbacks", icon: <ChatBubbleOvalLeftIcon className="h-5 w-5" />, path: "/view-past-feedback" },
        { name: "Log Out", icon: <ArrowRightOnRectangleIcon className="h-5 w-5" />, path: "/" },
      ];
    }

    if (role === 'tutor') {
      return [
        { name: "Home", icon: <HomeIcon className="h-5 w-5" />, path: "/dashboard" },
        { name: "Profile", icon: <UserIcon className="h-5 w-5" />, path: "/profile" },
        { name: "Messages", icon: <ChatBubbleLeftIcon className="h-5 w-5" />, path: "/messages" },
        { name: "My Services", icon: <ClipboardDocumentListIcon className="h-5 w-5" />, path: "/my-services" },
        { name: "Wallet", icon: <WalletIcon className="h-5 w-5" />, path: "/wallet" },
        { name: "Transactions", icon: <ReceiptRefundIcon className="h-5 w-5" />, path: "/transactions" },
        { name: "Past Feedbacks", icon: <ChatBubbleOvalLeftIcon className="h-5 w-5" />, path: "/view-past-feedback" },
        { name: "Log Out", icon: <ArrowRightOnRectangleIcon className="h-5 w-5" />, path: "/" },
      ];
    }

    return [
      { name: "Home", icon: <HomeIcon className="h-5 w-5" />, path: "/dashboard" },
      { name: "Profile", icon: <UserIcon className="h-5 w-5" />, path: "/profile" },
      { name: "Messages", icon: <ChatBubbleLeftIcon className="h-5 w-5" />, path: "/messages" },
      { name: "My Services", icon: <ClipboardDocumentListIcon className="h-5 w-5" />, path: "/my-services" },
      { name: "Find Services", icon: <MagnifyingGlassIcon className="h-5 w-5" />, path: "/find-services" },
      { name: "Saved", icon: <BookmarkIcon className="h-5 w-5" />, path: "/saved" },
      { name: "Wallet", icon: <WalletIcon className="h-5 w-5" />, path: "/wallet" },
      { name: "Transactions", icon: <ReceiptRefundIcon className="h-5 w-5" />, path: "/transactions" },
      { name: "Past Feedbacks", icon: <ChatBubbleOvalLeftIcon className="h-5 w-5" />, path: "/view-past-feedback" },
      { name: "Log Out", icon: <ArrowRightOnRectangleIcon className="h-5 w-5" />, path: "/" },
    ];
  })();

  // Load bookmarked services on component mount and when userData changes
  useEffect(() => {
    if (userData?.id) {
      loadBookmarkedServices();
    }
  }, [userData]);

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

  const toggleBookmark = async (serviceId, e) => {
    e.stopPropagation();
    
    try {
      setLoadingBookmarks(prev => new Set(prev).add(serviceId));
      
      if (bookmarkedServices.has(serviceId)) {
        // Remove bookmark
        await unbookmarkService(serviceId);
        setBookmarkedServices(prev => {
          const updated = new Set(prev);
          updated.delete(serviceId);
          return updated;
        });
        console.log('✅ Bookmark removed:', serviceId);
      } else {
        // Add bookmark
        await bookmarkService(serviceId);
        setBookmarkedServices(prev => new Set(prev).add(serviceId));
        console.log('✅ Bookmark added:', serviceId);
      }
    } catch (error) {
      console.error('Error toggling bookmark:', error);
      if (error.response?.data?.isAlreadyBookmarked) {
        // If already bookmarked, update UI
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

  const handleMessage = (service) => {
    try {
      const currentUser = JSON.parse(localStorage.getItem('user'));
      
      console.log('Service object:', service);
      console.log('Current user:', currentUser);
      
      if (!service.user_id) {
        alert('Service provider information not available');
        return;
      }

      if (currentUser?.role?.toLowerCase() === service.user_role?.toLowerCase()) {
        alert('You can only message users with different roles');
        return;
      }

      navigate(`/messages/chat/${service.user_id}`);
    } catch (error) {
      console.error('Error initiating message:', error);
      alert('Failed to open chat. Please try again.');
    }
  };

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem('user'));
    setUserData(storedUser);
    setVerificationStatus(storedUser?.verification_status?.toLowerCase());

    if (storedUser?.role?.toLowerCase() === 'tutor') {
      navigate('/dashboard');
      return;
    }
  }, [navigate]);

  // Initialize Socket.IO Connection
  useEffect(() => {
    const socket = io('http://localhost:5000', {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('✅ Find Services: Connected to WebSocket');
      const user = JSON.parse(localStorage.getItem('user'));
      if (user?.id) {
        socket.emit('user-online', user.id);
      }
    });

    socket.on('service-updated', (updatedService) => {
      console.log('🔄 Service updated:', updatedService);
      
      setServices(prevServices =>
        prevServices.map(service =>
          service.id === updatedService.id ? { ...service, ...updatedService } : service
        )
      );
    });

    socket.on('service-created', (newService) => {
      console.log('✨ New service created:', newService);
      
      const user = JSON.parse(localStorage.getItem('user'));
      if (newService.user_id !== user.id) {
        setServices(prevServices => [newService, ...prevServices]);
      }
    });

    socket.on('service-deleted', (deletedServiceId) => {
      console.log('🗑️ Service deleted:', deletedServiceId);
      
      setServices(prevServices =>
        prevServices.filter(service => service.id !== deletedServiceId)
      );
    });
    
    // LISTEN FOR BOOKMARK ADDED
    socket.on('bookmark-service-added', (data) => {
      console.log('📌 Find Services: Bookmark added detected:', data);
      if (userData?.id === data.userId) {
        // Add to bookmarked services
        setBookmarkedServices(prev => new Set(prev).add(data.serviceId));
        console.log('✅ Service added to bookmarks');
      }
    });

    // LISTEN FOR BOOKMARK REMOVED
    socket.on('bookmark-service-removed', (data) => {
      console.log('🗑️ Find Services: Bookmark removed detected:', data);
      if (userData?.id === data.userId) {
        // Remove from bookmarked services
        setBookmarkedServices(prev => {
          const updated = new Set(prev);
          updated.delete(data.serviceId);
          return updated;
        });
        console.log('✅ Service removed from bookmarks');
      }
    });

    socket.on('disconnect', () => {
      console.log('❌ Find Services: Disconnected from WebSocket');
    });

    socket.on('error', (error) => {
      console.error('WebSocket error:', error);
    });

    return () => {
      const user = JSON.parse(localStorage.getItem('user'));
      if (user?.id) {
        socket.emit('user-offline', user.id);
      }
      socket.disconnect();
    };
  }, [userData]);

  // Initial fetch and filters
  useEffect(() => {
    fetchServices();
  }, [filters]);

  const fetchServices = async () => {
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      const response = await getAllServices(filters);

      const servicesWithProvider = response.data.map(service => ({
        ...service,
        provider: service.user_full_name,
        average_rating: parseFloat(service.average_rating) || 0,
        total_ratings: parseInt(service.total_ratings) || 0
      }));

      const otherServices = servicesWithProvider.filter(service => service.user_id !== user.id);

      setServices(prevServices => {
        const prevJson = JSON.stringify(prevServices);
        const newJson = JSON.stringify(otherServices);
        
        if (prevJson !== newJson) {
          console.log('📡 Services fetched and updated');
          return otherServices;
        }
        return prevServices;
      });
    } catch (error) {
      console.error('Error fetching services:', error);
    }
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const filteredServices = services.filter((service) => {
    const matchesSearch =
      service.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.description.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory =
      !filters.category ||
      filters.category === "All" ||
      service.category === filters.category;

    const matchesPrice =
      (!filters.minPrice || service.price >= parseFloat(filters.minPrice)) &&
      (!filters.maxPrice || service.price <= parseFloat(filters.maxPrice));

    const matchesRating =
      !filters.minRating || service.average_rating >= parseFloat(filters.minRating);

    return matchesSearch && matchesCategory && matchesPrice && matchesRating;
  });

  const handleBookNow = (service) => {
    setSelectedService(service);
  };

const handleConfirmBooking = async (service) => {
  try {
    const user = JSON.parse(localStorage.getItem('user'));
    const verificationStatus = user?.verification_status?.toLowerCase();


if (verificationStatus !== 'approved') {
  setSelectedService(null);
  setShowVerificationAlert(true);
  return;
}

    // ✅ ADD THESE DEBUG LOGS
    console.log('🔍 Full user object:', user);
    console.log('🔍 user.fullName:', user?.fullName);
    console.log('🔍 user.full_name:', user?.full_name);
    console.log('🔍 user.name:', user?.name);
    
    // ✅ This is what fixed it - using fullName (camelCase)
    const learnerName = user?.full_name;
    console.log('🔍 Final learnerName BEFORE emit:', learnerName);

    
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
    setSelectedService(null);

    const errorMessage = error.response?.data?.message || 'Failed to book service. Please try again.';
    alert(errorMessage);
  }
};

  return (
    <div className="bg-gradient-to-b from-blue-50 to-white min-h-screen flex flex-col lg:flex-row w-full">
      {/* Sidebar - Desktop (always visible) */}
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

      {/* Sidebar - Mobile (toggle-based) */}
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
        {/* Header */}
        <div className="p-4 sm:p-6 bg-gradient-to-r from-blue-600 to-indigo-600 text-white sticky top-0 z-20 shadow-lg">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <button 
                onClick={() => setIsSidebarOpen(true)}
                className="lg:hidden flex-shrink-0 hover:bg-white/10 p-2 rounded-lg transition-colors"
              >
                <Bars3Icon className="h-6 w-6" />
              </button>
              <h1 className="text-lg sm:text-xl font-semibold truncate">Browse Services</h1>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button 
                onClick={() => navigate("/notification")} 
                className="hover:bg-white/10 p-2 rounded-lg transition-colors relative"
              >
                <BellIcon className="h-6 w-6" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>
              <button 
                onClick={() => setShowFilters((prev) => !prev)} 
                className="hover:bg-white/10 p-2 rounded-lg transition-colors"
              >
                <AdjustmentsHorizontalIcon className="h-6 w-6" />
              </button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="flex items-center bg-white/10 backdrop-blur-sm rounded-xl px-3 sm:px-4 py-2">
            <MagnifyingGlassIcon className="h-5 w-5 text-white/80 flex-shrink-0" />
            <input 
              type="text" 
              value={searchTerm} 
              onChange={handleSearch} 
              placeholder="Search services..." 
              className="bg-transparent outline-none ml-2 text-sm w-full text-white placeholder-white/70"
            />
          </div>
        </div>

        {/* Filters */}
        {showFilters && <FilterPanel filters={filters} handleFilterChange={handleFilterChange} categories={categories} />}

        {/* Service Cards */}
        <div className="flex-1 overflow-y-auto">
          <div className="w-full px-2 sm:px-3 lg:px-4 py-2 sm:py-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-2 sm:gap-3 lg:gap-4 auto-rows-max">
              {filteredServices.length === 0 ? (
                <div className="col-span-full text-center py-12 text-gray-500">
                  <p className="text-sm sm:text-base">No services found</p>
                </div>
              ) : (
                filteredServices.map((service) => {
                  const availabilityArray = parseAvailability(service.availability);
                  
                  return (
                    <div 
                      key={service.id} 
                      className="bg-white rounded-2xl p-3 sm:p-4 shadow-sm border border-gray-100 hover:shadow-md transition-all flex flex-col h-fit"
                    >
                      {/* Title and Bookmark */}
                      <div className="flex justify-between items-start gap-2 mb-2">
                        <h2 className="font-semibold text-sm sm:text-base text-gray-900 line-clamp-2 h-10">
                          {service.title}
                        </h2>
                        <div className="flex gap-1 flex-shrink-0">
                          {/* Bookmark Button */}
                          <button 
                            onClick={(e) => toggleBookmark(service.id, e)}
                            disabled={loadingBookmarks.has(service.id)}
                            className={`hover:bg-gray-100 p-2 rounded-lg transition-all ${
                              bookmarkedServices.has(service.id) 
                                ? 'text-blue-600' 
                                : 'text-gray-400'
                            } ${loadingBookmarks.has(service.id) ? 'opacity-50 cursor-not-allowed' : ''}`}
                            title={bookmarkedServices.has(service.id) ? 'Remove bookmark' : 'Bookmark this service'}
                          >
                            <BookmarkIcon className={`h-5 w-5 ${bookmarkedServices.has(service.id) ? 'fill-current' : ''}`} />
                          </button>
                          
                          {/* Menu Button */}
                          <div className="relative group">
                            <button className="hover:bg-gray-100 p-1 rounded-lg transition-colors">
                              <EllipsisVerticalIcon className="h-5 w-5 text-gray-500" />
                            </button>
                            
                            {/* Dropdown Menu */}
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

                      {/* Description - Scrollable with Fixed Height */}
                      <div className="h-16 border-t border-b border-gray-100 py-2 overflow-y-auto pr-2">
                        <p className="text-gray-600 text-xs sm:text-sm">
                          {service.description}
                        </p>
                      </div>

                      {/* Provider Name - Fixed Height */}
                      <div className="h-6 py-1 border-b border-gray-100 flex items-center">
                        <p className="text-xs text-gray-500 truncate">by {service.provider}</p>
                      </div>

                      {/* Rating Section - Fixed Height with View Feedbacks Button */}
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

                      {/* Availability Section - Scrollable with Fixed Height */}
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

                      {/* Price Section - Fixed Height */}
                      <div className="h-10 flex items-center justify-between mt-2 pt-2 border-t border-gray-100">
                        <span className="font-semibold text-xs sm:text-sm text-blue-600">SC {service.price}</span>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-2 mt-3">
                        <button
                          className="flex-1 px-2 py-1.5 sm:px-3 sm:py-2 text-xs sm:text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors font-medium"
                          onClick={() => handleBookNow(service)}
                        >
                          Book Now
                        </button>
                        <button 
                          onClick={() => handleMessage(service)}
                          className="flex-1 px-2 py-1.5 sm:px-3 sm:py-2 text-xs sm:text-sm rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 transition-colors font-medium"
                        >
                          Message
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Bottom spacing */}
            <div className="h-2 sm:h-3"></div>
          </div>
        </div>
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
      {/* Verification Alert Modal - ADD THIS HERE */}
    {showVerificationAlert && (
      <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-2xl p-6 w-full max-w-md">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100 mb-4">
              <svg className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Verification Required</h3>
            <p className="text-sm text-gray-600 mb-4">
              {verificationStatus === 'pending' 
                ? 'Your account verification is pending review.'
                : verificationStatus === 'rejected'
                ? 'Your account verification was not approved. Please contact support.'
                : 'Your account needs to be verified.'}
            </p>
            <p className="text-sm text-gray-600 mb-6">
              You'll be able to book services once approved by an administrator (typically 24-48 hours).
            </p>
            <button
              onClick={() => setShowVerificationAlert(false)}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Got it
            </button>
          </div>
        </div>
      </div>
    )}
    </div>
  );
}

export default FindServices;