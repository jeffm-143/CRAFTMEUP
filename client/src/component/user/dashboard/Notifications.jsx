import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeftIcon,
  CreditCardIcon,
  CheckCircleIcon,
  UserIcon,
  BellIcon,
  XMarkIcon,
  ShieldExclamationIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import { getNotifications, markNotificationAsRead, markAllNotificationsAsRead } from '../../../services/api';
import io from 'socket.io-client';

// ✅ Dismissible Notification Modal - For Important Notifications
function DismissibleNotificationModal({ notification, onDismiss }) {
  const getModalStyle = () => {
    switch(notification.type) {
      case 'account_suspended':
        return {
          headerBg: 'bg-gradient-to-r from-red-600 to-red-700',
          icon: <ShieldExclamationIcon className="h-8 w-8 flex-shrink-0" />
        };
      case 'account_warning':
        return {
          headerBg: 'bg-gradient-to-r from-orange-600 to-orange-700',
          icon: <ExclamationTriangleIcon className="h-8 w-8 flex-shrink-0" />
        };
      case 'report_resolved':
        return {
          headerBg: 'bg-gradient-to-r from-green-600 to-green-700',
          icon: <CheckCircleIcon className="h-8 w-8 flex-shrink-0" />
        };
      default:
        return {
          headerBg: 'bg-gradient-to-r from-blue-600 to-blue-700',
          icon: <BellIcon className="h-8 w-8 flex-shrink-0" />
        };
    }
  };

  const style = getModalStyle();

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-slideUp">
        {/* Header */}
        <div className={`p-6 text-white ${style.headerBg}`}>
          <div className="flex items-start gap-3">
            {style.icon}
            <div className="flex-1">
              <h3 className="text-xl font-bold mb-1">{notification.title}</h3>
              <p className="text-sm opacity-90">Important notification</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-gray-700 leading-relaxed whitespace-pre-line">
            {notification.content}
          </p>
        </div>

        {/* Footer */}
        <div className="p-6 bg-gray-50 border-t border-gray-200">
          <button
            onClick={onDismiss}
            className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 font-semibold shadow-md transition-all"
          >
            I Understand
          </button>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { 
            opacity: 0; 
            transform: translateY(20px); 
          }
          to { 
            opacity: 1; 
            transform: translateY(0); 
          }
        }
        .animate-fadeIn { animation: fadeIn 0.3s ease-in-out; }
        .animate-slideUp { animation: slideUp 0.3s ease-in-out; }
      `}</style>
    </div>
  );
}

export default function Notifications() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [dismissibleNotification, setDismissibleNotification] = useState(null);
  const socketRef = useRef(null);

  useEffect(() => {
    fetchNotifications();

    // Setup socket for realtime notification refresh
    const user = JSON.parse(localStorage.getItem('user'));
    if (user?.id) {
      const socket = io('http://localhost:5000', {
        transports: ['websocket', 'polling']
      });
      socketRef.current = socket;

      socket.on('connect', () => {
        console.log('🔌 Notifications: connected to socket');
        socket.emit('user-online', user.id);
      });

      // When server emits a new notification, refresh the list
      socket.on('new-notification', (payload) => {
        console.log('🔔 Notifications: new-notification received', payload);
        fetchNotifications();
      });

      // Also listen for notification-created events if emitted differently
      socket.on('notification-created', (payload) => {
        console.log('🔔 Notifications: notification-created received', payload);
        fetchNotifications();
      });

      // Listen for notification updates from other tabs/clients
      socket.on('notification-updated', (payload) => {
        console.log('🔁 Notifications: notification-updated received', payload);
        fetchNotifications();
      });

      return () => {
        if (socketRef.current) {
          socketRef.current.emit('user-offline', user.id);
          socketRef.current.disconnect();
        }
      };
    }
  }, []);

  const fetchNotifications = async () => {
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      const response = await getNotifications(user.id);
      
      setNotifications(response);
      
      // Calculate unread count
      const unreadNotifications = response.filter(n => !n.read);
      setUnreadCount(unreadNotifications.length);
      
      // ✅ Check for dismissible unread notifications
      const dismissibleUnread = response.find(n => n.dismissible && !n.read);
      if (dismissibleUnread) {
        setDismissibleNotification(dismissibleUnread);
      }
      
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      await markNotificationAsRead(notificationId);
      
      // Update the notifications state
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      );
      
      // Decrement unread count
      setUnreadCount(prev => Math.max(0, prev - 1));

      // Inform other open clients/tabs that a notification was updated
      try {
        const user = JSON.parse(localStorage.getItem('user'));
        if (socketRef.current && user?.id) {
          socketRef.current.emit('notification-updated', {
            userId: user.id,
            notificationId,
            action: 'marked_read'
          });
        }
      } catch (emitErr) {
        console.warn('Failed to emit notification-updated:', emitErr);
      }
      
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      if (!user || !user.id) {
        console.error('User not found');
        return;
      }

      await markAllNotificationsAsRead(user.id);
      
      // Update all notifications to read
      setNotifications(prev => 
        prev.map(n => ({ ...n, read: true }))
      );
      
      // Reset unread count to 0
      setUnreadCount(0);

      // Inform other clients that user marked all as read
      try {
        if (socketRef.current) {
          socketRef.current.emit('notification-updated', {
            userId: user.id,
            action: 'marked_all_read'
          });
        }
      } catch (emitErr) {
        console.warn('Failed to emit notification-updated (mark all):', emitErr);
      }
      
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  // ✅ Handle dismissing the modal notification
  const handleDismissNotification = async () => {
    if (dismissibleNotification) {
      await handleMarkAsRead(dismissibleNotification.id);
      setDismissibleNotification(null);
    }
  };

  const getNotificationTypeStyle = (type) => {
    switch (type) {
      case 'tutor_request':
        return 'bg-purple-100';
      case 'request_accepted':
        return 'bg-green-100';
      case 'payment_confirmed':
        return 'bg-blue-100';
      case 'account_suspended':
        return 'bg-red-100';
      case 'account_warning':
        return 'bg-orange-100';
      case 'report_resolved':
        return 'bg-green-100';
      case 'feedback_received':
        return 'bg-yellow-100';
      case 'booking_rejected':
        return 'bg-red-100';
      default:
        return 'bg-gray-100';
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'tutor_request':
        return <UserIcon className="h-5 w-5 text-purple-600" />;
      case 'request_accepted':
        return <CheckCircleIcon className="h-5 w-5 text-green-600" />;
      case 'payment_confirmed':
        return <CreditCardIcon className="h-5 w-5 text-blue-600" />;
      case 'account_suspended':
        return <ShieldExclamationIcon className="h-5 w-5 text-red-600" />;
      case 'account_warning':
        return <ExclamationTriangleIcon className="h-5 w-5 text-orange-600" />;
      case 'report_resolved':
        return <CheckCircleIcon className="h-5 w-5 text-green-600" />;
      case 'feedback_received':
        return <span className="text-lg">⭐</span>;
      case 'booking_rejected':
        return <ExclamationTriangleIcon className="h-5 w-5 text-red-600" />;
      default:
        return <BellIcon className="h-5 w-5 text-gray-600" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex flex-col w-full">
      {/* Header */}
      <div className="p-4 sm:p-6 bg-gradient-to-r from-blue-600 to-indigo-600 text-white sticky top-0 z-20 shadow-lg">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate(-1)}
            className="flex-shrink-0 hover:bg-white/10 p-2 rounded-lg transition-colors"
          >
            <ArrowLeftIcon className="h-6 w-6" />
          </button>
          <div className="flex-1">
            <h1 className="text-lg sm:text-xl font-semibold">Notifications</h1>
            {unreadCount > 0 && (
              <p className="text-xs sm:text-sm text-blue-100 mt-1">
                {unreadCount} unread notification{unreadCount > 1 ? 's' : ''}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="w-full px-2 sm:px-3 lg:px-4 py-2 sm:py-3">
          {/* Mark All as Read Button */}
          {unreadCount > 0 && (
            <div className="mb-4 sm:mb-6 flex justify-end px-2">
              <button 
                onClick={handleMarkAllAsRead}
                className="text-sm sm:text-base text-blue-600 font-medium px-4 py-2 hover:bg-blue-50 rounded-lg transition-colors"
              >
                Mark all as read
              </button>
            </div>
          )}

          {/* Notifications List - Single Column */}
          <div className="space-y-3 sm:space-y-4">
            {notifications.length === 0 ? (
              <div className="text-center py-12 sm:py-16">
                <BellIcon className="h-12 sm:h-16 w-12 sm:w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-sm sm:text-base">No notifications yet</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div 
                  key={notification.id} 
                  className={`bg-white rounded-2xl shadow-sm border border-gray-100 transform transition hover:scale-[1.01] hover:shadow-md p-4 sm:p-5 ${
                    !notification.read ? 'bg-blue-50 border-blue-200' : ''
                  }`}
                >
                  <div className="flex items-start gap-3 sm:gap-4">
                    {/* Icon */}
                    <div className={`p-2 sm:p-3 rounded-full flex-shrink-0 ${getNotificationTypeStyle(notification.type)}`}>
                      {getIcon(notification.type)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 text-sm sm:text-base break-words">
                        {notification.title}
                      </h3>
                      <p className="text-xs sm:text-sm text-gray-600 mt-1 whitespace-pre-line">
                        {notification.content}
                      </p>
                      
                      {/* Footer */}
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-gray-100 gap-2">
                        {!notification.read && (
                          <button 
                            onClick={() => handleMarkAsRead(notification.id)}
                            className="text-blue-600 text-xs sm:text-sm font-medium hover:underline transition-colors"
                          >
                            Mark as read
                          </button>
                        )}
                        <span className="text-xs text-gray-400">
                          {new Date(notification.created_at).toLocaleTimeString([], { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Bottom spacing */}
          <div className="h-2 sm:h-3"></div>
        </div>
      </div>

      {/* ✅ Dismissible Notification Modal */}
      {dismissibleNotification && (
        <DismissibleNotificationModal
          notification={dismissibleNotification}
          onDismiss={handleDismissNotification}
        />
      )}
    </div>
  );
}