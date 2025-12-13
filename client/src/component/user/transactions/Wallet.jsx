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
  ArrowUpTrayIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import { useNavigate } from 'react-router-dom';
import { getWalletBalance, getUserWalletHistory, createWalletRequest, getNotifications, getUserData } from '../../../services/api';
import io from 'socket.io-client'; // ✅ ADDED

export default function Wallet() {
  const [userData, setUserData] = useState(null);
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [requestType, setRequestType] = useState('top-up');
  const [amount, setAmount] = useState('');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [proofFile, setProofFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [verificationStatus, setVerificationStatus] = useState('pending');
  const [hasReached200, setHasReached200] = useState(false);
  const socketRef = useRef(null); // ✅ ADDED

  // Admin GCash Information (Static)
  const ADMIN_GCASH = {
    number: '09123456789',
    name: 'SkillSwap Admin'
  };

  // Add to all components
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

  // ✅ MODIFIED useEffect - Added socket connection
  useEffect(() => {
    const loadNotifications = async () => {
      const storedUser = JSON.parse(localStorage.getItem('user'));
      setUserData(storedUser);
      
      // Fetch unread notifications count
      if (storedUser?.id) {
        try {
          const notificationsResponse = await getNotifications(storedUser.id);
          const unread = notificationsResponse.filter(n => !n.read).length;
          setUnreadCount(unread);
        } catch (notifError) {
          console.error('Error fetching notifications:', notifError);
        }
      }
    };
    
    loadNotifications();

    // ✅ Setup socket connection for real-time wallet updates
    const user = JSON.parse(localStorage.getItem('user'));
    if (user?.id) {
      const socket = io('http://localhost:5000', {
        transports: ['websocket', 'polling']
      });
      socketRef.current = socket;

      socket.on('connect', () => {
        console.log('🔌 Wallet: Connected to socket');
        socket.emit('user-online', user.id);
      });

      // ✅ Listen for wallet balance updates
      socket.on('wallet-balance-updated', (data) => {
        console.log('💰 Wallet: Balance updated', data);
        fetchWalletData(); // Refresh wallet data
      });

      // ✅ Listen for new notifications
      socket.on('notification-created', async (data) => {
        console.log('🔔 Wallet: New notification received', data);
        // Update notification badge
        try {
          const notificationsResponse = await getNotifications(user.id);
          const unread = notificationsResponse.filter(n => !n.read).length;
          setUnreadCount(unread);
        } catch (error) {
          console.error('Error updating notifications:', error);
        }
      });

      // ✅ Listen for notification updates (when marked as read)
      socket.on('notification-updated', async (data) => {
        console.log('🔁 Wallet: Notification updated', data);
        try {
          const notificationsResponse = await getNotifications(user.id);
          const unread = notificationsResponse.filter(n => !n.read).length;
          setUnreadCount(unread);
        } catch (error) {
          console.error('Error updating notifications:', error);
        }
      });

      return () => {
        if (socketRef.current) {
          socketRef.current.emit('user-offline', user.id);
          socketRef.current.disconnect();
        }
      };
    }
  }, []);

  useEffect(() => {
    fetchWalletData();
  }, []);

  const validateCashOutAmount = (requestAmount) => {
    const amountNum = parseFloat(requestAmount);
    const balanceNum = parseFloat(balance);
    
    if (isNaN(amountNum) || amountNum <= 0) {
      alert('Please enter a valid amount');
      return false;
    }

    if (balanceNum - amountNum < 20) {
      alert('You must maintain a minimum balance of 20 SC. Maximum cash-out amount: ' + (balanceNum - 20) + ' SC');
      return false;
    }

    return true;
  };

  const fetchWalletData = async () => {
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      if (!user || !user.id) {
        console.error('No user data found in localStorage');
        return;
      }

      console.log('Fetching wallet data for user:', user.id);
      
      try {
        // Fetch fresh user data to get verification status
        const userDataResponse = await getUserData(user.id);
        if (userDataResponse?.data) {
          setVerificationStatus(userDataResponse.data.verification_status || 'pending');
          setUserData(userDataResponse.data);
          // Update localStorage with fresh data
          localStorage.setItem('user', JSON.stringify(userDataResponse.data));
        }

        const balanceResponse = await getWalletBalance(user.id);
        console.log('Raw balance response:', balanceResponse);
        
        if (balanceResponse?.data?.balance !== undefined) {
          const newBalance = parseFloat(balanceResponse.data.balance);
          console.log('Setting balance to:', newBalance);
          setBalance(newBalance);
        } else {
          console.error('Invalid balance data:', balanceResponse);
          setBalance(0);
        }

        // Fetch transaction history
        const historyResponse = await getUserWalletHistory(user.id);
        console.log('Transaction history response:', historyResponse);
        
        if (historyResponse?.data) {
          setTransactions(historyResponse.data);
          // Check if user has ever reached 200 SC
          checkIfReached200(historyResponse.data);
        } else {
          console.error('Invalid transaction history data:', historyResponse);
          setTransactions([]);
        }
      } catch (error) {
        console.error('Data fetch error:', error);
        setTransactions([]);
      }
    } catch (error) {
      console.error('Main error:', error);
    }
  };

  // Check if user has ever reached 200 SC threshold
  const checkIfReached200 = (transactionHistory) => {
    // Calculate the highest balance ever reached
    let runningBalance = 50; // Starting balance
    let maxBalance = 50;

    transactionHistory
      .filter(t => t.status === 'approved' || t.status === 'completed')
      .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
      .forEach(t => {
        if (t.type === 'top-up' || t.type === 'credit') {
          runningBalance += parseFloat(t.amount);
        } else if (t.type === 'cash-out' || t.type === 'debit') {
          runningBalance -= parseFloat(t.amount);
        }
        maxBalance = Math.max(maxBalance, runningBalance);
      });

    console.log('Max balance ever reached:', maxBalance);
    setHasReached200(maxBalance >= 200);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.size <= 5 * 1024 * 1024) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProofFile({
          name: file.name,
          data: reader.result // base64 string
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const canTopUp = () => {
    return verificationStatus === 'approved';
  };

  const canCashOut = () => {
    if (verificationStatus !== 'approved') return false;
    if (!hasReached200 && balance < 200) return false;
    return true;
  };

  const getRestrictionMessage = () => {
    if (verificationStatus === 'pending') {
      return 'Your account verification is pending. You cannot perform transactions yet.';
    }
    if (verificationStatus === 'rejected') {
      return 'Your account verification was rejected. Please contact support.';
    }
    if (requestType === 'top-up' && !canTopUp()) {
      return 'Account must be verified to top up.';
    }
    if (requestType === 'cash-out' && !canCashOut()) {
      if (!hasReached200 && balance < 200) {
        return 'You need to reach 200 SC balance first before you can cash out.';
      }
      return 'Account must be verified to cash out.';
    }
    return null;
  };

  const handleSubmitRequest = async () => {
    // Check restrictions
    if (requestType === 'top-up' && !canTopUp()) {
      alert('You cannot top up yet. ' + getRestrictionMessage());
      return;
    }

    if (requestType === 'cash-out' && !canCashOut()) {
      alert('You cannot cash out yet. ' + getRestrictionMessage());
      return;
    }

    if (!amount || !referenceNumber || (requestType === 'top-up' && !proofFile)) {
      alert('Please fill in all required fields');
      return;
    }

    if (requestType === 'cash-out' && !validateCashOutAmount(amount)) {
      return;
    }

    try {
      setIsLoading(true);
      const user = JSON.parse(localStorage.getItem('user'));
      if (!user || !user.id) {
        throw new Error('User data not found');
      }

      // Send as JSON instead of FormData
      const requestData = {
        userId: user.id,
        type: requestType,
        amount: parseFloat(amount),
        referenceNumber: referenceNumber,
        proofImage: proofFile?.data || null // base64 string
      };

      console.log('Submitting request:', { ...requestData, proofImage: '...' });

      const response = await createWalletRequest(requestData);
      console.log('Submit response:', response);

      if (response?.data?.success) {
        alert('Request submitted successfully!');
        setAmount('');
        setReferenceNumber('');
        setProofFile(null);
        await fetchWalletData();
      } else {
        throw new Error(response?.data?.message || 'Invalid response from server');
      }
    } catch (error) {
      console.error('Submit error:', error);
      alert(error.response?.data?.message || 'Failed to submit request. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const restrictionMessage = getRestrictionMessage();

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
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <button 
                onClick={() => setIsSidebarOpen(true)}
                className="lg:hidden flex-shrink-0 hover:bg-white/10 p-2 rounded-lg transition-colors"
              >
                <Bars3Icon className="h-6 w-6" />
              </button>
              <h1 className="text-lg sm:text-xl font-semibold truncate">Wallet</h1>
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

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="w-full px-2 sm:px-3 lg:px-4 py-2 sm:py-3">
            {/* Verification Status Warning */}
            {verificationStatus !== 'approved' && (
              <div className="mb-4 bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-r-lg">
                <div className="flex items-start">
                  <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400 mt-0.5 mr-3 flex-shrink-0" />
                  <div>
                    <h3 className="text-sm font-medium text-yellow-800">Account Verification Required</h3>
                    <p className="text-xs text-yellow-700 mt-1">
                      {verificationStatus === 'pending' 
                        ? 'Your account is pending verification. You cannot perform wallet transactions until your account is approved.'
                        : 'Your account verification was rejected. Please contact support for assistance.'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* 200 SC Threshold Warning */}
            {verificationStatus === 'approved' && !hasReached200 && balance < 200 && (
              <div className="mb-4 bg-blue-50 border-l-4 border-blue-400 p-4 rounded-r-lg">
                <div className="flex items-start">
                  <ExclamationTriangleIcon className="h-5 w-5 text-blue-400 mt-0.5 mr-3 flex-shrink-0" />
                  <div>
                    <h3 className="text-sm font-medium text-blue-800">Cash-Out Milestone</h3>
                    <p className="text-xs text-blue-700 mt-1">
                      You need to reach 200 SC balance before you can cash out. Current balance: {balance} SC
                      <br />
                      <span className="font-semibold">Progress: {Math.min(100, (balance / 200 * 100)).toFixed(1)}%</span>
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6 mb-6">
              {/* Balance Card - Full Width on Left */}
              <div className="lg:col-span-1 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl p-6 sm:p-8 text-white shadow-lg">
                <p className="text-white/80 text-xs sm:text-sm">Current Balance</p>
                <h2 className="text-3xl sm:text-4xl font-bold mt-2">{balance}</h2>
                <p className="text-white/80 text-xs sm:text-sm mt-1">SkillCoins</p>
                
                {/* Verification Badge */}
                <div className="mt-4 pt-4 border-t border-white/20">
                  <p className="text-white/60 text-xs mb-1">Account Status</p>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    verificationStatus === 'approved' ? 'bg-green-500/20 text-green-100' :
                    verificationStatus === 'pending' ? 'bg-yellow-500/20 text-yellow-100' :
                    'bg-red-500/20 text-red-100'
                  }`}>
                    {verificationStatus === 'approved' ? '✓ Verified' :
                     verificationStatus === 'pending' ? '⏳ Pending' :
                     '✗ Rejected'}
                  </span>
                </div>
              </div>

              {/* Form Section - Takes 2 Columns on Desktop */}
              <div className="lg:col-span-2 space-y-4 sm:space-y-5">
                {/* Admin GCash Info - Only show for Top-Up */}
                {requestType === 'top-up' && (
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-4 sm:p-5 border border-green-200">
                    <h3 className="text-sm font-semibold text-green-800 mb-3 flex items-center">
                      <span className="bg-green-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs mr-2">₱</span>
                      Send Payment To:
                    </h3>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center bg-white rounded-lg px-4 py-2.5">
                        <span className="text-xs text-gray-600">GCash Number</span>
                        <span className="text-sm font-bold text-gray-900">{ADMIN_GCASH.number}</span>
                      </div>
                      <div className="flex justify-between items-center bg-white rounded-lg px-4 py-2.5">
                        <span className="text-xs text-gray-600">Account Name</span>
                        <span className="text-sm font-bold text-gray-900">{ADMIN_GCASH.name}</span>
                      </div>
                    </div>
                    <p className="text-xs text-green-700 mt-3 italic">
                      💡 After sending payment, enter the reference number and upload proof below
                    </p>
                  </div>
                )}

                {/* Request Type Toggle */}
                <div className="flex gap-2">
                  <button 
                    onClick={() => setRequestType('top-up')}
                    disabled={!canTopUp()}
                    className={`flex-1 py-3 rounded-xl font-medium text-sm sm:text-base transition-colors ${
                      requestType === 'top-up' 
                        ? 'bg-blue-600 text-white' 
                        : canTopUp() 
                          ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    Top Up
                  </button>
                  <button 
                    onClick={() => setRequestType('cash-out')}
                    disabled={!canCashOut()}
                    className={`flex-1 py-3 rounded-xl font-medium text-sm sm:text-base transition-colors ${
                      requestType === 'cash-out' 
                        ? 'bg-blue-600 text-white' 
                        : canCashOut()
                          ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    Cash Out
                  </button>
                </div>

                {/* Restriction Message */}
                {restrictionMessage && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-3">
                    <p className="text-xs text-red-700 flex items-start">
                      <ExclamationTriangleIcon className="h-4 w-4 mr-2 flex-shrink-0 mt-0.5" />
                      {restrictionMessage}
                    </p>
                  </div>
                )}

                {/* Form Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  {/* Amount Input */}
                  <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-gray-100">
                    <label className="text-xs sm:text-sm font-medium text-gray-700 mb-2 block">
                      Amount (SkillCoins)
                    </label>
                    <input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="Enter amount"
                      disabled={restrictionMessage !== null}
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-400"
                    />
                  </div>

                  {/* Reference Number Input */}
                  <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-gray-100">
                    <label className="text-xs sm:text-sm font-medium text-gray-700 mb-2 block">
                      {requestType === 'top-up' ? 'GCash Reference Number' : 'GCash Number'}
                    </label>
                    <input
                      type="text"
                      value={referenceNumber}
                      onChange={(e) => setReferenceNumber(e.target.value)}
                      placeholder={requestType === 'top-up' ? 'Enter reference number' : 'Enter GCash number'}
                      disabled={restrictionMessage !== null}
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-400"
                    />
                  </div>
                </div>

                {/* File Upload - Only for Top-Up */}
                {requestType === 'top-up' && (
                  <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-gray-100">
                    <label className="text-xs sm:text-sm font-medium text-gray-700 mb-3 block">
                      Upload Proof of Payment
                    </label>
                    <label className={`border-2 border-dashed border-gray-300 rounded-xl p-6 text-center transition-colors cursor-pointer block ${
                      restrictionMessage ? 'bg-gray-50 cursor-not-allowed' : 'hover:bg-gray-50'
                    }`}>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        disabled={restrictionMessage !== null}
                        className="hidden"
                      />
                      <ArrowUpTrayIcon className="h-6 w-6 mx-auto mb-2 text-gray-400" />
                      <p className="text-xs sm:text-sm text-gray-700 font-medium">
                        {proofFile ? proofFile.name : 'Tap to upload image'}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">(PNG, JPG up to 5MB)</p>
                    </label>
                  </div>
                )}

                {/* Submit Button */}
                <button 
                  onClick={handleSubmitRequest}
                  disabled={isLoading || restrictionMessage !== null || !amount || !referenceNumber || (requestType === 'top-up' && !proofFile)}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 sm:py-4 rounded-xl font-medium text-sm sm:text-base hover:from-blue-700 hover:to-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Processing...' : `Submit ${requestType === 'top-up' ? 'Top-Up' : 'Cash-Out'} Request`}
                </button>
              </div>
            </div>

            {/* Transaction History */}
            <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-gray-100">
              <h3 className="font-semibold text-base sm:text-lg mb-4">Transaction History</h3>
              <div className="space-y-2 sm:space-y-3 max-h-[500px] overflow-y-auto pr-2">
                {transactions.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <p className="text-sm">No transactions yet</p>
                  </div>
                ) : (
                  transactions
                    .filter(t => t.status !== 'pending')
                    .map((t, i) => (
                      <div key={i} className="border border-gray-100 rounded-xl p-3 sm:p-4 hover:bg-gray-50 transition-colors">
                        <div className="flex justify-between items-center mb-2">
                          <p className="text-xs sm:text-sm font-medium text-gray-900">{t.type}</p>
                          <span className={`text-xs sm:text-sm font-semibold ${
                            t.type === 'top-up' || t.type === 'credit' ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {t.type === 'top-up' || t.type === 'credit' ? '+' : '-'}{t.amount}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500">
                          {new Date(t.created_at).toLocaleDateString()}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">Ref: {t.reference_number}</p>
                        <p className={`text-xs mt-2 font-medium ${
                          t.status === 'approved' || t.status === 'completed' ? 'text-green-600' : 
                          t.status === 'rejected' ? 'text-red-600' : 'text-gray-500'
                        }`}>
                          {t.status.charAt(0).toUpperCase() + t.status.slice(1)}
                        </p>
                      </div>
                    ))
                )}
              </div>
            </div>

            {/* Bottom spacing */}
            <div className="h-2 sm:h-3"></div>
          </div>
        </div>
      </div>
    </div>
  );
}