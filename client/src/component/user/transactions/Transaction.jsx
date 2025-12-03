import React, { useState, useEffect } from "react";

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
} from "@heroicons/react/24/outline";
import { useNavigate } from 'react-router-dom';
import { FiAlertTriangle } from "react-icons/fi";
import { createNotification } from '../../../services/api';
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
                  ? 'bg-gray-300' 
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
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingBookings, setPendingBookings] = useState([]);
  const [ongoingBookings, setOngoingBookings] = useState([]);
  const [completedBookings, setCompletedBookings] = useState([]);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [userWallet, setUserWallet] = useState(0);
  const [userData, setUserData] = useState(null);

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

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem('user'));
    setUserData(storedUser);
  }, []);

  useEffect(() => {
    fetchUserBookings();
    fetchWalletBalance();
  }, []);

  const createTutorRequestNotification = async (tutorId, learnerName) => {
    await createNotification({
      userId: tutorId,
      type: 'tutor_request',
      title: 'New Tutor Request',
      content: `You got a Tutor request from ${learnerName}`
    });
  };

  const createRequestAcceptedNotification = async (learnerId, tutorName) => {
    await createNotification({
      userId: learnerId,
      type: 'request_accepted',
      title: 'Tutor Request Accepted',
      content: `Your tutor request has been accepted by ${tutorName}`,
    });
  };

  const createPaymentConfirmedNotification = async (tutorId, learnerName) => {
    await createNotification({
      userId: tutorId,
      type: 'payment_confirmed',
      title: 'Payment Confirmed',
      content: `Payment has been confirmed by ${learnerName}`,
    });
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

      const ongoing = [];
      const pending = [];
      const completed = [];

      bookings.forEach(booking => {
        const status = (booking.status || '').toLowerCase();

        if (status === 'pending' && booking.is_provider) {
          createTutorRequestNotification(booking.provider_id, booking.requester_name);
        }

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
    } catch (error) {
      console.error('Error fetching wallet balance:', error);
    }
  };

  const handleMarkReady = async (bookingId) => {
    try {
      await updateTransactionStatus(bookingId, 'ready');
      await fetchUserBookings();
      alert('Service marked as ready for completion');
    } catch (error) {
      console.error('Error marking service as ready:', error);
      alert('Failed to update service status');
    }
  };

  const handleConfirmCompletion = (booking) => {
    setSelectedBooking(booking);
    setShowConfirmModal(true);
  };

  const handlePaymentConfirm = async () => {
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      
      await createPaymentConfirmedNotification(
        selectedBooking.provider_id, 
        userData.full_name
      );
      
      if (selectedBooking.is_provider) {
        alert('Error: Providers cannot confirm payment');
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

      await transferFunds(paymentData);
      
      await fetchWalletBalance();
      await fetchUserBookings();
      
      setShowConfirmModal(false);
      
      navigate('/feedback', { 
        state: { 
          booking: selectedBooking 
        }
      });
    } catch (error) {
      console.error('Payment error details:', error);
      const errorMessage = error.response?.data?.message || 'Failed to process payment. Please try again.';
      alert(errorMessage);
    }
  };

  const handleAcceptBooking = async (bookingId) => {
    try {
      await updateTransactionStatus(bookingId, 'ongoing');
      const booking = pendingBookings.find(b => b.id === bookingId);
      await createRequestAcceptedNotification(booking.user_id, booking.provider_name);
      await fetchUserBookings();
      alert('Booking accepted successfully');
    } catch (error) {
      console.error('Error accepting booking:', error);
      alert('Failed to accept booking');
    }
  };

  const handleRejectBooking = async (bookingId) => {
    try {
      await updateTransactionStatus(bookingId, 'rejected');
      await fetchUserBookings();
      alert('Booking rejected');
    } catch (error) {
      console.error('Error rejecting booking:', error);
      alert('Failed to reject booking');
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

  const renderBooking = (booking) => (
    <div key={booking.id} className="border border-gray-100 rounded-2xl p-3 sm:p-4 shadow-sm bg-white hover:shadow-md transition-all flex flex-col">
      {/* Top section */}
      <div className="flex flex-col sm:flex-row justify-between items-start gap-2 mb-2">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-xs sm:text-base text-gray-900 truncate">{booking.service_title}</h3>
          <p className="text-xs text-gray-600 mt-1">
            {booking.is_provider ? `Requested by: ${booking.requester_name}` : `Provider: ${booking.provider_name}`}
          </p>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="font-semibold text-xs sm:text-base">SC {Number(booking.price).toFixed(2)}</p>
        </div>
      </div>

      {/* Description */}
      {booking.description && (
        <p className="text-gray-500 text-xs line-clamp-2 mb-2">{booking.description}</p>
      )}

      {/* Status and date */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-3 pb-3 border-t border-gray-100">
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

      {/* Action Buttons Section */}
      <div className="flex flex-col sm:flex-row gap-1.5 sm:gap-2">
        {booking.is_provider && booking.status === 'ongoing' && (
          <button
            onClick={() => handleMarkReady(booking.id)}
            className="flex-1 px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-xs sm:text-sm font-medium transition-colors"
          >
            Mark Ready
          </button>
        )}

        {booking.is_provider && booking.status === 'ready' && (
          <div className="flex-1 px-3 py-2 text-gray-500 text-xs text-center bg-gray-50 rounded-lg">
            Waiting for completion
          </div>
        )}

        {!booking.is_provider && booking.status === 'ready' && (
          <button
            onClick={() => handleConfirmCompletion(booking)}
            className="flex-1 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-xs sm:text-sm font-medium transition-colors"
          >
            Confirm Completion
          </button>
        )}

        {booking.is_provider && booking.status === 'pending' && (
          <div className="flex gap-1.5 sm:gap-2 w-full">
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
        )}
      </div>
    </div>
  );

  const renderBookings = () => (
    <div className="flex-1 overflow-y-auto">
      <div className="w-full px-2 sm:px-3 lg:px-4 py-2 sm:py-3">
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
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 sm:gap-3 lg:gap-4">
              {completedBookings.map(renderBooking)}
            </div>
          ) : (
            <div className="text-center py-8 bg-gray-50 rounded-xl">
              <p className="text-gray-500 text-sm">No past transactions</p>
            </div>
          )}
        </div>

        {/* Bottom spacing */}
        <div className="h-2 sm:h-3"></div>
      </div>
    </div>
  );

  return (
    <div className="bg-gradient-to-b from-blue-50 to-white min-h-screen flex flex-col lg:flex-row w-full">
      {/* Sidebar - Desktop (always visible) */}
      <div className="hidden lg:flex fixed inset-y-0 left-0 bg-gradient-to-b from-gray-50 to-white w-64 flex-col shadow-xl border-r z-30">
        {/* Header - Fixed at top */}
        <div className="p-4 bg-gradient-to-r from-blue-600 to-indigo-600">
          <h2 className="font-semibold text-white text-lg">Menu</h2>
        </div>

        {/* Navigation - Scrollable */}
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
        {/* Header - Fixed at top */}
        <div className="p-4 bg-gradient-to-r from-blue-600 to-indigo-600 flex justify-between items-center">
          <h2 className="font-semibold text-white">Menu</h2>
          <button 
            onClick={() => setIsSidebarOpen(false)}
            className="text-white hover:bg-white/10 p-1 rounded-lg transition-colors"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Navigation - Scrollable */}
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

      {/* Overlay */}
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
              <span className="absolute -top-1 -right-1 bg-red-500 w-2 h-2 rounded-full"></span>
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
    </div>
  );
}