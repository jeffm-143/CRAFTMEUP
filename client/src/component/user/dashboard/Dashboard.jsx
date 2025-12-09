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
} from "@heroicons/react/24/outline";
import { useNavigate } from 'react-router-dom';
import { getAnnouncements, getUserServices, getUserMonthlyStats, getNotifications } from '../../../services/api';
import io from 'socket.io-client';

export default function Dashboard() {
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [userData, setUserData] = useState(null);
  const [announcements, setAnnouncements] = useState([]);
  const [services, setServices] = useState([]);
  const [monthlyStats, setMonthlyStats] = useState({ earnings: 0, spent: 0, netEarnings: 0 });
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
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

    // ✅ Listen for new announcements
    socket.on('announcement-created', (newAnnouncement) => {
      console.log('📢 New announcement:', newAnnouncement);

      if (canSeeAnnouncement(newAnnouncement)) {
        setAnnouncements(prev => [newAnnouncement, ...prev]);
      }
    });

    // ✅ Listen for announcement updates
    socket.on('announcement-updated', (updatedAnnouncement) => {
      console.log('📝 Announcement updated:', updatedAnnouncement);

      setAnnouncements(prev =>
        prev.map(ann =>
          ann.id === updatedAnnouncement.id ? updatedAnnouncement : ann
        )
      );
    });

    // ✅ Listen for announcement deletion
    socket.on('announcement-deleted', (announcementId) => {
      console.log('🗑️ Announcement deleted:', announcementId);

      setAnnouncements(prev =>
        prev.filter(ann => ann.id !== announcementId)
      );
    });

    // ✅ Listen for new services
    socket.on('service-created', (newService) => {
      console.log('✨ New service created:', newService);

      if (newService.user_id === userData.id) {
        setServices(prev => [newService, ...prev]);
      }
    });

    // ✅ Listen for service updates
    socket.on('service-updated', (updatedService) => {
      console.log('🔄 Service updated:', updatedService);

      setServices(prev =>
        prev.map(service =>
          service.id === updatedService.id ? updatedService : service
        )
      );
    });

    // ✅ Listen for service deletion
    socket.on('service-deleted', (deletedServiceData) => {
      console.log('🗑️ Service deleted:', deletedServiceData);

      const serviceId = deletedServiceData.serviceId || deletedServiceData.id;
      setServices(prev =>
        prev.filter(service => service.id !== serviceId)
      );
    });

    // ✅ Listen for booking status changes
    socket.on('booking-updated', (bookingData) => {
      console.log('📢 Booking status updated:', bookingData);
      if (userData?.id) {
        fetchUserServices(userData.id);
        fetchMonthlyStats(userData.id);
      }
    });

    // ✅ Listen for booking created
    socket.on('booking-created', (bookingData) => {
      console.log('✨ New booking created:', bookingData);
      if (userData?.id) {
        fetchMonthlyStats(userData.id);
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

  // Fetch announcements, services, and monthly stats when userData changes
  useEffect(() => {
    if (userData?.id) {
      fetchAnnouncements();
      fetchMonthlyStats(userData.id);
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
      
      // ✅ Ensure data is always an array
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
      
      // ✅ Handle different response formats from server
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

  // ✅ Fetch monthly stats from backend
  const fetchMonthlyStats = async (userId) => {
    try {
      console.log('📊 Fetching monthly stats for user:', userId);
      const response = await getUserMonthlyStats(userId);
      const data = response.data || response;
      
      setMonthlyStats({
        earnings: parseFloat(data.earnings || 0),
        spent: parseFloat(data.spent || 0),
        netEarnings: parseFloat(data.net_earnings || 0) // ✅ Use net_earnings
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

  // ✅ Simple getters for stats
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
        { name: "Feedbacks & Ratings", icon: <ChatBubbleOvalLeftIcon className="h-5 w-5" />, path: "/view-past-feedback" },
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
        { name: "Feedbacks & Ratings", icon: <ChatBubbleOvalLeftIcon className="h-5 w-5" />, path: "/view-past-feedback" },
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
      { name: "Feedbacks & Ratings", icon: <ChatBubbleOvalLeftIcon className="h-5 w-5" />, path: "/view-past-feedback" },
      { name: "Log Out", icon: <ArrowRightOnRectangleIcon className="h-5 w-5" />, path: "/" },
    ];
  })();

  const renderAnnouncements = () => {
    // ✅ Safely filter announcements
    const visibleAnnouncements = Array.isArray(announcements)
      ? announcements.filter(announcement => canSeeAnnouncement(announcement))
      : [];

    return (
      <>
        <div className="p-4 mx-4">
          <h2 className="font-semibold mb-4">Announcements</h2>
          <div className="space-y-4 max-h-40 overflow-y-auto pr-2">
            {visibleAnnouncements.length === 0 ? (
              <div className="text-center py-4 text-gray-500">
                <p className="text-sm">No announcements at the moment</p>
              </div>
            ) : (
              visibleAnnouncements.map((announcement) => (
                <div
                  key={announcement.id}
                  className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 animate-fadeIn"
                >
                  <h3 className="font-medium text-sm sm:text-base">{announcement.title}</h3>
                  <p className="text-xs sm:text-sm text-gray-600 mt-2">{announcement.content}</p>
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mt-3 text-xs text-gray-500 gap-2">
                    <span>Target: {announcement.target_audience}</span>
                    <span>{new Date(announcement.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </>
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
          <span className="font-semibold text-lg">My Services</span>
          <button
            onClick={() => navigate('/my-services')}
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
              <p className="text-gray-500 text-sm">No services found</p>
              <button
                onClick={() => navigate("/my-services")}
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
              // Learner: Show total spent this month
              <>
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-3 sm:p-4">
                  <div className="text-xl sm:text-2xl font-bold">
                    SC {getSpent()}
                  </div>
                  <div className="text-xs sm:text-sm text-white/80">Spent This Month</div>
                </div>
              </>
            ) : role === 'tutor' ? (
              // Tutor: Show active services and net earnings this month
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
              // Both role: Show active services and net earnings this month
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

          {/* ✅ Optional: Show breakdown for users with both/tutor roles and spending > 0 */}
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

        {/* My Services */}
        {renderServices()}

        {/* Bottom padding for mobile */}
        <div className="h-4 sm:h-6"></div>
      </div>

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