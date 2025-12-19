import React, { useState, useEffect, useRef } from "react";
import io from 'socket.io-client';
import Toast from '../../common/Toast';

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
  ArrowUpRightIcon,
  ArrowDownLeftIcon,
} from "@heroicons/react/24/outline";
import { useNavigate, useLocation } from 'react-router-dom';
import { FiAlertTriangle } from "react-icons/fi";
import { createNotification, getNotifications } from '../../../services/api';
import { getUserBookings, updateTransactionStatus, getWalletBalance, transferFunds } from '../../../services/api';

function ConfirmPayment({ booking, userWallet, onConfirm, onClose }) {
  const remainingBalance = userWallet - booking.price;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm">
        <div className="p-4 sm:p-5 border-b flex justify-between items-center sticky top-0">
          <h2 className="text-base sm:text-lg font-semibold text-gray-900">Confirm Payment</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full transition-colors">
            <XMarkIcon className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <div className="p-4 sm:p-5 space-y-4 max-h-[70vh] overflow-y-auto">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Price:</span>
            <span className="font-medium">SC {Number(booking.price).toFixed(2)}</span>
          </div>

          <hr />

          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Your Balance:</span>
            <span className="font-medium">SC {Number(userWallet).toFixed(2)}</span>
          </div>

          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Remaining:</span>
            <span className={`font-medium ${remainingBalance < 0 ? 'text-red-600' : 'text-green-600'}`}>
              SC {remainingBalance.toFixed(2)}
            </span>
          </div>

          <hr />

          <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 flex gap-2">
            <FiAlertTriangle className="text-blue-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs sm:text-sm text-blue-700">
              Note: This action is final and cannot be reversed.
            </p>
          </div>

          <div className="space-y-2 pt-2">
            <button 
              onClick={onConfirm}
              disabled={remainingBalance < 0}
              className={`w-full ${
                remainingBalance < 0 
                  ? 'bg-gray-300 cursor-not-allowed' 
                  : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700'
              } text-white py-2.5 rounded-xl text-sm font-medium transition-all`}
            >
              {remainingBalance < 0 ? 'Insufficient Balance' : 'Confirm Payment'}
            </button>
            <button 
              className="w-full py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 rounded-xl transition-all border"
              onClick={onClose}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Transaction() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingBookings, setPendingBookings] = useState([]);
  const [ongoingBookings, setOngoingBookings] = useState([]);
  const [completedBookings, setCompletedBookings] = useState([]);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [userWallet, setUserWallet] = useState(0);
  const [userData, setUserData] = useState(null);
  const [showPastTransactionsModal, setShowPastTransactionsModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [successMessage, setSuccessMessage] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);
  const socketRef = useRef(null);
  const [toast, setToast] = useState(null);
  const hasShownToast = useRef(false);

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

  // ✅ Determine if transaction is earning or spent
  const getTransactionType = (booking) => {
    if (booking.is_provider) {
      return 'earning';
    } else {
      return 'spent';
    }
  };

  // ✅ Get styling based on transaction type
  const getTransactionStyle = (booking) => {
    const type = getTransactionType(booking);
    if (type === 'earning') {
      return {
        bgColor: 'bg-green-50',
        borderColor: 'border-green-200',
        amountColor: 'text-green-600',
        icon: <ArrowDownLeftIcon className="h-5 w-5 text-green-600" />,
        prefix: '+',
        label: '↓ Income'
      };
    } else {
      return {
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200',
        amountColor: 'text-red-600',
        icon: <ArrowUpRightIcon className="h-5 w-5 text-red-600" />,
        prefix: '-',
        label: '↑ Expense'
      };
    }
  };

  const refreshTransactions = async () => {
  try {
    setIsLoading(true);
    await Promise.all([
      fetchUserBookings(),
      fetchWalletBalance()
    ]);
    setIsLoading(false);
  } catch (error) {
    console.error('Error refreshing:', error);
    setIsLoading(false);
  }
};

  // ✅ Initialize user data
  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem('user'));
    setUserData(storedUser);
    
    // Fetch unread notifications count
    if (storedUser?.id) {
      try {
        getNotifications(storedUser.id).then(notificationsResponse => {
          const unread = notificationsResponse.filter(n => !n.read).length;
          setUnreadCount(unread);
        }).catch(notifError => {
          console.error('Error fetching notifications:', notifError);
        });
      } catch (notifError) {
        console.error('Error fetching notifications:', notifError);
      }
    }
  }, []);

  // ✅ Fetch data when component mounts or when returning from navigation
  useEffect(() => {
    if (userData?.id) {
      setIsLoading(true);
      Promise.all([
        fetchUserBookings(),
        fetchWalletBalance()
      ]).then(() => {
        setIsLoading(false);
      });
    }
  }, [userData?.id]);

  // ✅ Show success message if coming from booking
useEffect(() => {
  if (location.state?.refresh && !hasShownToast.current) {
    setToast({
      message: 'Service booked successfully!',
      type: 'success',
      isLoading: false,
      showProgress: true,
      duration: 2500,
    });
    
    hasShownToast.current = true;
    
    // ✅ Clear the state
    window.history.replaceState({}, document.title);
  }
}, [location.state]);


  // ✅ Listen for page visibility changes
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && userData?.id) {
        console.log('📄 Page became visible, refreshing transactions...');
        fetchUserBookings();
        fetchWalletBalance();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [userData?.id]);

  // Socket.IO connection
  useEffect(() => {
    if (!userData?.id) return;

    const newSocket = io('http://localhost:5000', {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5
    });

    socketRef.current = newSocket;

    newSocket.on('connect', () => {
      console.log('🔌 Connected to server');
      newSocket.emit('user-online', userData.id);
    });

newSocket.on('booking-created', (data) => {
  console.log('📢 New booking created via socket:', data);
  console.log('📢 Current user ID:', userData?.id);
  console.log('📢 Tutor/Provider ID:', data.providerId);
  console.log('📢 LEARNER NAME FROM SOCKET:', data.learnerName);

  // Server now creates and emits the stored notification. Do NOT create
  // a duplicate notification from the client — only refresh transactions.
  if (userData?.id === data.userId || userData?.id === data.providerId) {
    console.log('🔄 I am involved in this booking - refreshing transactions');
    refreshTransactions();
  }
  // Also refresh notifications badge in case a notification row was added
  try {
    if (userData?.id) {
      getNotifications(userData.id).then(notifs => {
        const unread = (notifs || []).filter(n => !n.read).length;
        setUnreadCount(unread);
      }).catch(err => console.error('Error fetching notifications after booking-created:', err));
    }
  } catch (err) {
    console.error('Error refreshing notifications after booking-created:', err);
  }
});

    newSocket.on('booking-updated', (data) => {
      console.log('📢 Booking updated:', data);
      fetchUserBookings();
      fetchWalletBalance();
      // Some booking updates create notifications; refresh badge
      if (userData?.id) {
        getNotifications(userData.id).then(notifs => {
          const unread = (notifs || []).filter(n => !n.read).length;
          setUnreadCount(unread);
        }).catch(err => console.error('Error fetching notifications after booking-updated:', err));
      }
    });

newSocket.on('booking-status-changed', (data) => {
  console.log('📢 Transaction status changed:', data);
  
  // ✅ If you're the learner and booking was rejected, refresh immediately
  if (userData?.id === data.learnerId && data.status === 'rejected') {
    console.log('🔄 Your booking was rejected - refreshing transactions');
    fetchUserBookings();
  }
  
  // ✅ Always refresh for any status change
  fetchUserBookings();
  // Refresh notification badge too
  if (userData?.id) {
    getNotifications(userData.id).then(notifs => {
      const unread = (notifs || []).filter(n => !n.read).length;
      setUnreadCount(unread);
    }).catch(err => console.error('Error fetching notifications after booking-status-changed:', err));
  }
});

    newSocket.on('payment-confirmed', (data) => {
      console.log('📢 Payment confirmed:', data);
      fetchUserBookings();
      fetchWalletBalance();
      // Payment may generate notifications; refresh badge
      if (userData?.id) {
        getNotifications(userData.id).then(notifs => {
          const unread = (notifs || []).filter(n => !n.read).length;
          setUnreadCount(unread);
        }).catch(err => console.error('Error fetching notifications after payment-confirmed:', err));
      }
    });

    newSocket.on('wallet-updated', (data) => {
      console.log('📢 Wallet updated:', data);
      fetchWalletBalance();
    });

    // Listen for new notifications and refresh unread count
    newSocket.on('new-notification', (notification) => {
      try {
        console.log('🔔 Received new-notification via socket:', notification);
        if (userData?.id) {
          getNotifications(userData.id)
            .then(notifs => {
              const unread = (notifs || []).filter(n => !n.read).length;
              setUnreadCount(unread);
            })
            .catch(err => console.error('Error fetching notifications after socket event:', err));
        }
      } catch (err) {
        console.error('Error handling new-notification socket event:', err);
      }
    });

    // Also refresh when notifications are updated (marked read) elsewhere
    newSocket.on('notification-updated', (payload) => {
      try {
        console.log('🔁 Transaction received notification-updated:', payload);
        if (userData?.id) {
          getNotifications(userData.id)
            .then(notifs => {
              const unread = (notifs || []).filter(n => !n.read).length;
              setUnreadCount(unread);
            })
            .catch(err => console.error('Error fetching notifications after notification-updated:', err));
        }
      } catch (err) {
        console.error('Error handling notification-updated in Transaction.jsx:', err);
      }
    });

    newSocket.on('disconnect', () => {
      console.log('❌ Disconnected from server');
    });

    return () => {
      if (newSocket) {
        newSocket.emit('user-offline', userData.id);
        newSocket.disconnect();
      }
    };
  }, [userData?.id]);

// NOTE: server is responsible for creating/storing tutor request notifications
// and emitting `new-notification`. Client should not create the same
// notification to avoid duplicates.

  const createRequestAcceptedNotification = async (learnerId, tutorName) => {
    try {
      await createNotification({
        userId: learnerId,
        type: 'request_accepted',
        title: 'Tutor Request Accepted',
        content: `Your tutor request has been accepted by ${tutorName}`,
      });
    } catch (error) {
      console.error('Error creating notification:', error);
    }
  };

const fetchUserBookings = async () => {
  try {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user?.id) {
      console.warn('fetchUserBookings: no user in localStorage');
      return;
    }

    const response = await getUserBookings(user.id);
    const data = response?.data ?? response;
    const bookings = Array.isArray(data) ? data : (Array.isArray(data?.data) ? data.data : []);

    console.log('Bookings fetched:', bookings);

    const ongoing = [];
    const pending = [];
    const completed = [];

    bookings.forEach(booking => {
      const status = (booking.status || '').toLowerCase();


      switch (status) {
        case 'ongoing':
        case 'ready':
          ongoing.push(booking);
          break;
        case 'pending':
          pending.push(booking);
          break;
        case 'completed':
          completed.push(booking);
          break;
        default:
          console.debug('Unknown booking status:', booking);
      }
    });

    setOngoingBookings(ongoing);
    setPendingBookings(pending);
    setCompletedBookings(completed);
  } catch (error) {
    console.error('Error fetching bookings:', error);
  }
};

  const fetchWalletBalance = async () => {
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      const response = await getWalletBalance(user.id);
      setUserWallet(response.data.balance);
      console.log('Wallet balance fetched:', response.data.balance);
    } catch (error) {
      console.error('Error fetching wallet balance:', error);
    }
  };

  const handleMarkReady = async (bookingId) => {
    try {
      await updateTransactionStatus(bookingId, 'ready');
      
      if (socketRef.current) {
        socketRef.current.emit('booking-status-changed', {
          bookingId,
          status: 'ready',
          userId: userData.id
        });
      }
      
    await fetchUserBookings();
    // ✅ TOAST NOTIFICATION
    setToast({
      message: 'Service marked as ready for completion',
      type: 'success',
      isLoading: false,
      showProgress: true,
      duration: 2500,
    });
  } catch (error) {
    console.error('Error marking service as ready:', error);
    // ✅ TOAST NOTIFICATION
    setToast({
      message: '❌ Failed to update service status. Please try again.',
      type: 'error',
      isLoading: false,
      showProgress: false,
      duration: 3000,
    });
  }
};

  const handleConfirmCompletion = (booking) => {
    setSelectedBooking(booking);
    setShowConfirmModal(true);
  };

const handlePaymentConfirm = async () => {
  try {
    const user = JSON.parse(localStorage.getItem('user'));
    
    if (selectedBooking.is_provider) {
      // ✅ TOAST NOTIFICATION
      setToast({
        message: '❌ Error: Only learners can confirm payment for services',
        type: 'error',
        isLoading: false,
        showProgress: false,
        duration: 3000,
      });
      return;
    }

    const fromUserId = user.id;
    const toUserId = selectedBooking.provider_id || selectedBooking.user_id;

    const paymentData = {
      fromUserId: parseInt(fromUserId),
      toUserId: parseInt(toUserId),
      amount: parseFloat(selectedBooking.price),
      bookingId: parseInt(selectedBooking.id)
    };

    console.log('💰 Processing payment:', paymentData);

    // ✅ SHOW LOADING TOAST
    setToast({
      message: '💳 Processing your payment...',
      type: 'info',
      isLoading: true,
      showProgress: false,
      duration: 0,
    });
    
    // ✅ TRANSFER FUNDS FIRST
    await transferFunds(paymentData);
    
    // ✅ SEND NOTIFICATION TO TUTOR (PAYMENT RECEIVED)
    try {
      console.log('📧 Sending notification to tutor:', toUserId);
      console.log('📧 Learner name:', user.full_name);
      
      await createNotification({
        userId: toUserId,
        type: 'payment_confirmed',
        title: '💰 Payment Received',
        content: `Payment of SC ${selectedBooking.price} has been confirmed by ${user.full_name} for "${selectedBooking.service_title}"`
      });
      console.log('Tutor notification sent successfully');
    } catch (tutorNotifError) {
      console.warn('⚠️ Failed to send tutor notification (non-critical):', tutorNotifError);
    }

    // ✅ SEND NOTIFICATION TO LEARNER (PAYMENT SENT)
    try {
      console.log('📧 Sending notification to learner:', fromUserId);
      console.log('📧 Tutor name:', selectedBooking.provider_name);
      
      await createNotification({
        userId: fromUserId,
        type: 'payment_confirmed',
        title: 'Payment Confirmed',
        content: `Your payment of SC ${selectedBooking.price} has been sent to ${selectedBooking.provider_name} for "${selectedBooking.service_title}"`
      });
      console.log('Learner notification sent successfully');
    } catch (learnerNotifError) {
      console.warn('⚠️ Failed to send learner notification (non-critical):', learnerNotifError);
    }
    
    if (socketRef.current) {
      socketRef.current.emit('payment-completed', {
        bookingId: selectedBooking.id,
        fromUserId,
        toUserId,
        amount: selectedBooking.price
      });
    }
    
    await fetchWalletBalance();
    await fetchUserBookings();
    
    setShowConfirmModal(false);
    setSelectedBooking(null);

    // ✅ SUCCESS TOAST
    setToast({
      message: 'Payment confirmed successfully!',
      type: 'success',
      isLoading: false,
      showProgress: true,
      duration: 2500,
    });
    
    setTimeout(() => {
      navigate('/feedback', { 
        state: { 
          booking: selectedBooking 
        }
      });
    }, 1500);

  } catch (error) {
    console.error('❌ Payment error details:', error);
    console.error('❌ Error response:', error.response?.data);
    
    const errorMessage = error.response?.data?.message || 'Failed to process payment. Please try again.';
      setToast({
      message: '❌ Payment Failed\n' + errorMessage,
      type: 'error',
      isLoading: false,
      showProgress: false,
      duration: 3500,
    });
  }
};

  const handleAcceptBooking = async (bookingId) => {
    try {
      await updateTransactionStatus(bookingId, 'ongoing');
      const booking = pendingBookings.find(b => b.id === bookingId);
      await createRequestAcceptedNotification(booking.user_id, booking.provider_name);
      
      if (socketRef.current) {
        socketRef.current.emit('booking-status-changed', {
          bookingId,
          status: 'ongoing',
          userId: userData.id
        });
      }
      
    await fetchUserBookings();
    // ✅ TOAST NOTIFICATION
    setToast({
      message: 'Booking accepted successfully!',
      type: 'success',
      isLoading: false,
      showProgress: true,
      duration: 2500,
    });
  } catch (error) {
    console.error('Error accepting booking:', error);
    // ✅ TOAST NOTIFICATION
    setToast({
      message: '❌ Unable to accept booking. Please try again.',
      type: 'error',
      isLoading: false,
      showProgress: false,
      duration: 3000,
    });
  }
};

const handleRejectBooking = async (bookingId) => {
  try {
    await updateTransactionStatus(bookingId, 'rejected');
    
    // ✅ Find the booking details to get learner info
    const booking = pendingBookings.find(b => b.id === bookingId);
    
    // ✅ Send rejection notification to learner
    if (booking) {
      try {
        await createNotification({
          userId: booking.user_id, // learner's ID
          type: 'booking_rejected',
          title: '❌ Booking Rejected',
          content: `Your booking request for "${booking.service_title}" has been rejected by ${userData.full_name || 'the tutor'}`
        });
        console.log('✅ Rejection notification sent to learner');
      } catch (notifError) {
        console.warn('⚠️ Failed to send rejection notification:', notifError);
      }
    }
    
    if (socketRef.current) {
      socketRef.current.emit('booking-status-changed', {
        bookingId,
        status: 'rejected',
        userId: userData.id,
        learnerId: booking?.user_id, // ✅ Add this for real-time refresh
      });
    }
    
    // ✅ Refresh immediately without page reload
    await fetchUserBookings();
    
    setToast({
      message: 'Booking rejected successfully!',
      type: 'success',
      isLoading: false,
      showProgress: true,
      duration: 2500,
    });
  } catch (error) {
    console.error('Error rejecting booking:', error);
    setToast({
      message: '❌ Unable to reject booking. Please try again.',
      type: 'error',
      isLoading: false,
      showProgress: false,
      duration: 3000,
    });
  }
};

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-700',
      ongoing: 'bg-blue-100 text-blue-700',
      ready: 'bg-purple-100 text-purple-700',
      completed: 'bg-green-100 text-green-700',
      rejected: 'bg-red-100 text-red-700'
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

// ULTIMATE FIX - Simplest approach with NO conditional wrapper issues
// Replace the entire renderBooking function

const renderBooking = (booking) => {
  const style = getTransactionStyle(booking);
  
  return (
    <div key={booking.id} className={`border-2 ${style.borderColor} ${style.bgColor} rounded-2xl p-3 sm:p-4 shadow-sm hover:shadow-md transition-all flex flex-col`}>
      {/* Top section with icon and info */}
      <div className="flex items-start gap-3 mb-3">
        <div className="flex-shrink-0 mt-1">
          {style.icon}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-xs sm:text-base text-gray-900 truncate">{booking.service_title}</h3>
          <p className="text-xs text-gray-600 mt-1">
            {booking.is_provider ? `Requested by: ${booking.requester_name}` : `Provider: ${booking.provider_name}`}
          </p>
        </div>
        <div className="text-right flex-shrink-0">
          <p className={`font-semibold text-xs sm:text-base ${style.amountColor}`}>
            {style.prefix}SC {Number(booking.price).toFixed(2)}
          </p>
        </div>
      </div>

      {/* Description */}
      {booking.description && (
        <p className="text-gray-500 text-xs line-clamp-2 mb-2 pl-8">{booking.description}</p>
      )}

      {/* Transaction type label */}
      <div className="mb-3 pl-8">
        <span className={`inline-block text-xs font-semibold px-2 py-1 rounded ${
          booking.is_provider
            ? 'bg-green-200 text-green-800'
            : 'bg-red-200 text-red-800'
        }`}>
          {style.label}
        </span>
      </div>

      {/* Status and date */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-3 pb-3 border-t border-gray-200 pt-3">
        <div className="flex items-center space-x-2">
          <span className={`inline-flex items-center text-xs px-2.5 py-1 rounded-full ${getStatusColor(booking.status)}`}>
            <span className={`w-2 h-2 mr-1.5 rounded-full ${
              booking.status === 'pending' ? 'bg-yellow-500' :
              booking.status === 'ongoing' ? 'bg-blue-500' :
              booking.status === 'ready' ? 'bg-purple-500' :
              booking.status === 'completed' ? 'bg-green-500' :
              'bg-red-500'
            }`}></span>
            {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
          </span>
        </div>
        <p className="text-gray-400 text-xs">
          {new Date(booking.created_at).toLocaleDateString('en-US', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
          })}
        </p>
      </div>

      {/* Action Buttons - Using render functions to avoid conditional wrapper issues */}
      {(() => {
        // Tutor with pending status - Accept/Reject
        if (booking.is_provider && booking.status === 'pending') {
          return (
            <div className="flex flex-col sm:flex-row gap-1.5 sm:gap-2">
              <button
                onClick={() => handleAcceptBooking(booking.id)}
                className="flex-1 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-xs sm:text-sm font-medium transition-colors"
              >
                Accept
              </button>
              <button
                onClick={() => handleRejectBooking(booking.id)}
                className="flex-1 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-xs sm:text-sm font-medium transition-colors"
              >
                Reject
              </button>
            </div>
          );
        }
        
        // Tutor with ongoing status - Mark Ready
        if (booking.is_provider && booking.status === 'ongoing') {
          return (
            <div className="flex flex-col sm:flex-row gap-1.5 sm:gap-2">
              <button
                onClick={() => handleMarkReady(booking.id)}
                className="flex-1 px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-xs sm:text-sm font-medium transition-colors"
              >
                Mark Ready
              </button>
            </div>
          );
        }
        
        // Tutor with ready status - Waiting message
        if (booking.is_provider && booking.status === 'ready') {
          return (
            <div className="flex flex-col sm:flex-row gap-1.5 sm:gap-2">
              <div className="flex-1 px-3 py-2 text-gray-500 text-xs text-center bg-gray-100 rounded-lg font-medium">
                Waiting for learner to confirm completion
              </div>
            </div>
          );
        }
        
        // Learner with ready status - Confirm Completion
        if (!booking.is_provider && booking.status === 'ready') {
          return (
            <div className="flex flex-col sm:flex-row gap-1.5 sm:gap-2">
              <button
                onClick={() => handleConfirmCompletion(booking)}
                className="flex-1 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-xs sm:text-sm font-medium transition-colors"
              >
                Confirm Completion
              </button>
            </div>
          );
        }
        
        // All other cases (completed, rejected, learner ongoing, etc.) - return null (nothing)
        return null;
      })()}
    </div>
  );
};

  const renderBookings = () => (
    <div className="flex-1 overflow-y-auto">
      {isLoading ? (
        // ✅ Show loading state
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-500 text-sm">Loading transactions...</p>
          </div>
        </div>
      ) : (
        <div className="w-full px-2 sm:px-3 lg:px-4 py-2 sm:py-3">
          {/* ✅ Success message */}
          {successMessage && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-800 text-sm">
              {successMessage}
            </div>
          )}

          <div className="mb-6">
            <h2 className="text-gray-700 text-sm sm:text-base font-semibold mb-3 px-2">Current Transactions</h2>
            {ongoingBookings.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 sm:gap-3 lg:gap-4">
                {ongoingBookings.map(renderBooking)}
              </div>
            ) : (
              <div className="text-center py-8 bg-gray-50 rounded-xl">
                <p className="text-gray-500 text-sm">No ongoing transactions</p>
              </div>
            )}
          </div>

          <div className="mb-6">
            <h2 className="text-gray-700 text-sm sm:text-base font-semibold mb-3 px-2">Pending Transactions</h2>
            {pendingBookings.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 sm:gap-3 lg:gap-4">
                {pendingBookings.map(renderBooking)}
              </div>
            ) : (
              <div className="text-center py-8 bg-gray-50 rounded-xl">
                <p className="text-gray-500 text-sm">No pending transactions</p>
              </div>
            )}
          </div>

          <div>
            <h2 className="text-gray-700 text-sm sm:text-base font-semibold mb-3 px-2">Past Transactions</h2>
            {completedBookings.length > 0 ? (
              <>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 sm:gap-3 lg:gap-4">
                  {completedBookings.slice(0, 2).map(renderBooking)}
                </div>
                
                {completedBookings.length > 2 && (
                  <div className="mt-4 text-center">
                    <button
                      onClick={() => setShowPastTransactionsModal(true)}
                      className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 text-sm font-medium transition-all shadow-sm hover:shadow-md"
                    >
                      View All Past Transactions ({completedBookings.length})
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-8 bg-gray-50 rounded-xl">
                <p className="text-gray-500 text-sm">No past transactions</p>
              </div>
            )}
          </div>

          <div className="h-2 sm:h-3"></div>
        </div>
      )}
    </div>
  );

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
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <button 
                onClick={() => setIsSidebarOpen(true)}
                className="lg:hidden flex-shrink-0 hover:bg-white/10 p-2 rounded-lg transition-colors"
              >
                <Bars3Icon className="h-6 w-6" />
              </button>
              <h1 className="text-lg sm:text-xl font-semibold truncate">Transactions</h1>
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

        {renderBookings()}
      </div>

      {/* Payment Confirmation Modal */}
      {showConfirmModal && selectedBooking && (
        <ConfirmPayment
          booking={selectedBooking}
          userWallet={userWallet}
          onConfirm={handlePaymentConfirm}
          onClose={() => {
            setShowConfirmModal(false);
            setSelectedBooking(null);
          }}
          
        />
      )}

      {/* Past Transactions Modal */}
      {showPastTransactionsModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-6xl max-h-[90vh] flex flex-col">
            <div className="p-4 sm:p-5 border-b flex justify-between items-center">
              <h2 className="text-base sm:text-lg font-semibold text-gray-900">All Past Transactions</h2>
              <button 
                onClick={() => setShowPastTransactionsModal(false)} 
                className="p-1 hover:bg-gray-100 rounded-full transition-colors"
              >
                <XMarkIcon className="h-5 w-5 text-gray-500" />
              </button>
            </div>
            
            <div className="p-4 sm:p-5 overflow-y-auto flex-1">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
                {completedBookings.map(renderBooking)}
              </div>
            </div>
          </div>
        </div>
      )}
          {toast && (
      <Toast
        message={toast.message}
        type={toast.type}
        onClose={() => setToast(null)}
        isLoading={toast.isLoading}
        showProgress={toast.showProgress}
        duration={toast.duration}
      />
    )}
    </div>
  );
}