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
  EllipsisVerticalIcon,
} from "@heroicons/react/24/outline";
import { useNavigate } from 'react-router-dom';
import { getSavedServices, unbookmarkService, getNotifications } from "../../../services/api";
import io from "socket.io-client";

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
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
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
                    <p className="text-lg font-semibold text-gray-900">{service.provider_name}</p>
                  </div>
                </div>
              </div>

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

export default function Saved() {
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [userData, setUserData] = useState(null);
  const [savedServices, setSavedServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedFeedbackService, setSelectedFeedbackService] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const socketRef = useRef(null);

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

  // Initialize Socket.IO connection
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
      console.log('✅ Saved.jsx: Connected to WebSocket');
      const user = JSON.parse(localStorage.getItem('user'));
      if (user?.id) {
        socket.emit('user-online', user.id);
      }
    });

    // LISTEN FOR BOOKMARK ADDED - Real-time update
    socket.on('bookmark-service-added', (data) => {
      console.log('📌 Saved.jsx: New bookmark detected:', data);
      if (userData?.id === data.userId) {
        // Add new service to the top of the list
        setSavedServices(prevServices => [data.service, ...prevServices]);
        console.log('✅ Service added to saved list');
      }
    });

    // LISTEN FOR BOOKMARK REMOVED - Real-time update
    socket.on('bookmark-service-removed', (data) => {
      console.log('🗑️ Saved.jsx: Bookmark removed:', data);
      if (userData?.id === data.userId) {
        // Remove service from list
        setSavedServices(prevServices =>
          prevServices.filter(s => s.id !== data.serviceId)
        );
        console.log('✅ Service removed from saved list');
      }
    });

    socket.on('disconnect', () => {
      console.log('❌ Saved.jsx: Disconnected from WebSocket');
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

  // Load user and fetch saved services
  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem('user'));
    setUserData(storedUser);
    if (storedUser?.role?.toLowerCase() === 'tutor') {
      navigate('/dashboard');
      return;
    }
    if (storedUser?.id) {
      fetchSavedServices(storedUser.id);
    }
  }, [navigate]);

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

  const fetchSavedServices = async (userId) => {
    try {
      setLoading(true);
      setError(null);
      const services = await getSavedServices(userId);
      setSavedServices(services || []);
      console.log('📡 Saved services loaded:', services);
    } catch (err) {
      console.error('Error fetching saved services:', err);
      setError('Failed to load saved services');
      setSavedServices([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveSaved = async (serviceId) => {
    try {
      await unbookmarkService(serviceId);
      // Optimistic update
      setSavedServices(prev => prev.filter(s => s.id !== serviceId));
    } catch (error) {
      console.error('Error removing bookmark:', error);
      alert('Failed to remove bookmark');
    }
  };

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
        {/* Header */}
        <div className="p-4 sm:p-6 bg-gradient-to-r from-blue-600 to-indigo-600 text-white sticky top-0 z-20 shadow-lg">
          <div className="flex items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <button 
                onClick={() => setIsSidebarOpen(true)}
                className="lg:hidden flex-shrink-0 hover:bg-white/10 p-2 rounded-lg transition-colors"
              >
                <Bars3Icon className="h-6 w-6" />
              </button>
              <h1 className="text-lg sm:text-xl font-semibold truncate">Saved Services</h1>
            </div>
            <button 
              onClick={() => navigate('/notification')} 
              className="flex-shrink-0 hover:bg-white/10 p-2 rounded-lg transition-colors relative"
            >
              <BellIcon className="h-6 w-6" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Saved Services List */}
        <div className="flex-1 overflow-y-auto">
          <div className="w-full px-2 sm:px-3 lg:px-4 py-2 sm:py-3">
            {loading ? (
              <div className="col-span-full text-center py-12 sm:py-16">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-500 text-sm sm:text-base">Loading saved services...</p>
              </div>
            ) : error ? (
              <div className="col-span-full text-center py-12 sm:py-16">
                <p className="text-red-500 text-sm sm:text-base mb-4">{error}</p>
                <button
                  onClick={() => userData?.id && fetchSavedServices(userData.id)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Retry
                </button>
              </div>
            ) : savedServices.length === 0 ? (
              <div className="col-span-full text-center py-12 sm:py-16">
                <BookmarkIcon className="h-12 sm:h-16 w-12 sm:w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-sm sm:text-base">No saved services yet</p>
                <button
                  onClick={() => navigate('/find-services')}
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Browse Services
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-2 sm:gap-3 lg:gap-4 auto-rows-max">
                {savedServices.map((service) => {
                  const availabilityArray = parseAvailability(service.availability);
                  
                  return (
                    <div
                      key={service.id}
                      className="bg-white rounded-2xl p-3 sm:p-4 shadow-sm border border-gray-100 hover:shadow-md transition-all flex flex-col h-fit"
                    >
                      {/* Title and Remove Button */}
                      <div className="flex justify-between items-start gap-2 mb-2">
                        <h2 className="font-semibold text-sm sm:text-base text-gray-900 line-clamp-2 h-10">
                          {service.title}
                        </h2>
                        <div className="flex gap-1 flex-shrink-0">
                          {/* Remove Bookmark Button */}
                          <button 
                            onClick={() => handleRemoveSaved(service.id)}
                            className="hover:bg-red-50 p-2 rounded-lg transition-all text-red-500 hover:text-red-700"
                            title="Remove bookmark"
                          >
                            <BookmarkIcon className="h-5 w-5 fill-current" />
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

                      {/* Description */}
                      <div className="h-16 border-t border-b border-gray-100 py-2 overflow-y-auto pr-2">
                        <p className="text-gray-600 text-xs sm:text-sm">
                          {service.description}
                        </p>
                      </div>

                      {/* Provider Name */}
                      <div className="h-6 py-1 border-b border-gray-100 flex items-center">
                        <p className="text-xs text-gray-500 truncate">by {service.provider_name}</p>
                      </div>

                      {/* Rating Section */}
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

                      {/* Availability Section */}
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

                      {/* Price Section */}
                      <div className="h-10 flex items-center justify-between mt-2 pt-2 border-t border-gray-100">
                        <span className="font-semibold text-xs sm:text-sm text-blue-600">SC {service.price}</span>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-2 mt-3">
                        <button
                          className="flex-1 px-2 py-1.5 sm:px-3 sm:py-2 text-xs sm:text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors font-medium"
                          onClick={() => navigate(`/provider-profile/${service.user_id}`)}
                        >
                          View Profile
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

            {/* Bottom spacing */}
            <div className="h-2 sm:h-3"></div>
          </div>
        </div>
      </div>

      {/* Feedback Modal */}
      {selectedFeedbackService && (
        <FeedbackModal 
          service={selectedFeedbackService} 
          onClose={() => setSelectedFeedbackService(null)} 
        />
      )}
    </div>
  );
}