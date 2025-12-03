import React, { useState, useEffect } from "react";
import { FiEdit3, FiStar } from "react-icons/fi";
import { useNavigate } from 'react-router-dom';
import { getUserFeedback } from '../../../services/api';
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
  BookmarkIcon,
  Bars3Icon,
  XMarkIcon,
  BellIcon,
  XCircleIcon
} from "@heroicons/react/24/outline";

// Feedback Modal Component
function FeedbackModal({ feedbacks, serviceName, onClose, feedbackType }) {
  if (!feedbacks || feedbacks.length === 0) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden" onClick={(e) => e.stopPropagation()}>
        {/* Sticky Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-4 sm:p-6 flex justify-between items-center z-10">
          <h2 className="text-lg sm:text-xl font-semibold">
            Feedbacks for {serviceName}
          </h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 flex-shrink-0"
          >
            <XCircleIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="space-y-3">
            {feedbacks.map((feedback) => (
              <div
                key={feedback.id}
                className="bg-gray-50 p-4 rounded-xl border border-gray-200 hover:border-blue-300 transition-all"
              >
                {/* Rating Stars */}
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <span
                        key={i}
                        className={`text-lg ${
                          i < feedback.rating ? "text-yellow-400" : "text-gray-300"
                        }`}
                      >
                        ★
                      </span>
                    ))}
                  </div>
                  <span className="text-sm font-semibold text-gray-700">
                    {feedback.rating}/5
                  </span>
                </div>

                {/* Feedback Person - Clear Separation */}
                <div className="bg-blue-50 border border-blue-200 p-2.5 rounded-lg mb-3">
                  <div className="space-y-1">
                    {feedbackType === 'received' ? (
                      <>
                        <p className="text-xs text-blue-600 font-bold uppercase tracking-wide">From</p>
                        <p className="text-sm font-semibold text-gray-900">
                          {feedback.user_full_name || 'Unknown Learner'}
                        </p>
                        <p className="text-xs text-gray-500">Learner who gave this feedback</p>
                      </>
                    ) : (
                      <>
                        <p className="text-xs text-blue-600 font-bold uppercase tracking-wide">To</p>
                        <p className="text-sm font-semibold text-gray-900">
                          {feedback.provider_name || 'Unknown Tutor'}
                        </p>
                        <p className="text-xs text-gray-500">Tutor of this service</p>
                      </>
                    )}
                  </div>
                </div>

                {/* Feedback Comment */}
                {feedback.comment && (
                  <div className="mb-3 bg-yellow-50 border border-yellow-200 p-3 rounded-lg">
                    <p className="text-xs text-yellow-700 font-semibold mb-1 uppercase">Comment</p>
                    <p className="text-sm text-gray-700 italic">
                      "{feedback.comment}"
                    </p>
                  </div>
                )}

                {/* Date */}
                <div className="flex items-center justify-between">
                  <p className="text-xs text-gray-500 font-semibold">
                    Rated on: <span className="font-normal">{new Date(feedback.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}</span>
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sticky Footer */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4 sm:p-6">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ViewPastFeedback() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("given");
  const [givenFeedback, setGivenFeedback] = useState([]);
  const [receivedFeedback, setReceivedFeedback] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userData, setUserData] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [hasUnreadFeedback, setHasUnreadFeedback] = useState(false);
  const [selectedServiceFeedbacks, setSelectedServiceFeedbacks] = useState(null);
  const [selectedServiceName, setSelectedServiceName] = useState("");

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
    if (userData) {
      fetchFeedback();
    }
  }, [userData]);

  const fetchFeedback = async () => {
    setIsLoading(true);
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      if (!user?.id) {
        console.error('No user ID found');
        setIsLoading(false);
        return;
      }

      console.log('Fetching feedback for user:', user);
      const response = await getUserFeedback(user.id);
      console.log('Feedback response:', response);

      if (response && response.data) {
        const { given = [], received = [] } = response.data;

        console.log('Given feedback:', given);
        console.log('Received feedback:', received);

        setGivenFeedback(given);
        setReceivedFeedback(received);

        // Set default tab based on role
        if (user.role?.toLowerCase() === 'learner') {
          setActiveTab('given');
        } else if (user.role?.toLowerCase() === 'tutor') {
          setActiveTab('received');
        } else if (user.role?.toLowerCase() === 'both') {
          setActiveTab('given');
        }
      } else {
        console.error('Invalid response format:', response);
        setGivenFeedback([]);
        setReceivedFeedback([]);
      }
    } catch (error) {
      console.error('Error fetching feedback:', error);
      setGivenFeedback([]);
      setReceivedFeedback([]);
    } finally {
      setIsLoading(false);
    }
  };

  const currentFeedback = activeTab === "given" ? givenFeedback : receivedFeedback;

  // Group feedbacks by service
  const groupedFeedbacks = currentFeedback.reduce((acc, feedback) => {
    const key = feedback.service_id;
    if (!acc[key]) {
      acc[key] = {
        service_id: feedback.service_id,
        service_title: feedback.service_title || 'Untitled Service',
        service_description: feedback.service_description || '',
        provider_name: feedback.provider_name,
        user_full_name: feedback.user_full_name,
        feedbacks: []
      };
    }
    acc[key].feedbacks.push(feedback);
    return acc;
  }, {});

  // Calculate average rating for a service
  const getServiceAverageRating = (feedbacks) => {
    if (feedbacks.length === 0) return 0;
    const sum = feedbacks.reduce((acc, f) => acc + f.rating, 0);
    return (sum / feedbacks.length).toFixed(1);
  };

  // Determine which tabs to show
  const showGivenTab = userData?.role?.toLowerCase() !== 'tutor';
  const showReceivedTab = userData?.role?.toLowerCase() !== 'learner';

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
          <div className="flex items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <button 
                onClick={() => setIsSidebarOpen(true)}
                className="lg:hidden flex-shrink-0 hover:bg-white/10 p-2 rounded-lg transition-colors"
              >
                <Bars3Icon className="h-6 w-6" />
              </button>
              <h1 className="text-lg sm:text-xl font-semibold truncate">Feedback & Ratings</h1>
            </div>
            <button 
              onClick={() => navigate('/notification')} 
              className="flex-shrink-0 hover:bg-white/10 p-2 rounded-lg transition-colors relative"
            >
              <BellIcon className="h-6 w-6" />
              {hasUnreadFeedback && (
                <span className="absolute -top-1 -right-1 bg-red-500 w-2 h-2 rounded-full"></span>
              )}
            </button>
          </div>

          {/* Combined Toggle Tabs */}
          <div className="bg-white/10 backdrop-blur-sm p-1 rounded-xl flex gap-1">
            {showGivenTab && (
              <button
                onClick={() => setActiveTab("given")}
                className={`flex items-center justify-center gap-1 flex-1 py-2 px-3 sm:px-4 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                  activeTab === "given"
                    ? "bg-white text-blue-600"
                    : "text-white/90 hover:bg-white/10"
                }`}
              >
                <FiEdit3 size={16} />
                <span className="hidden sm:inline">
                  {userData?.role?.toLowerCase() === 'both' ? 'I Gave' : 'Feedback Given'}
                </span>
                <span className="sm:hidden">Gave</span>
              </button>
            )}
            {showReceivedTab && (
              <button
                onClick={() => setActiveTab("received")}
                className={`flex items-center justify-center gap-1 flex-1 py-2 px-3 sm:px-4 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                  activeTab === "received"
                    ? "bg-white text-blue-600"
                    : "text-white/90 hover:bg-white/10"
                }`}
              >
                <FiStar size={16} />
                <span className="hidden sm:inline">
                  {userData?.role?.toLowerCase() === 'both' ? 'I Received' : 'Feedback Received'}
                </span>
                <span className="sm:hidden">Received</span>
              </button>
            )}
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto">
          <div className="w-full px-2 sm:px-3 lg:px-4 py-2 sm:py-3">
            {/* Stats Summary */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 lg:gap-4 mb-4 sm:mb-6">
              <div className="bg-white p-3 sm:p-4 rounded-xl shadow-sm border border-gray-100">
                <p className="text-xl sm:text-2xl font-bold text-center text-blue-600">
                  {currentFeedback.length}
                </p>
                <p className="text-gray-500 text-xs text-center mt-1">
                  {activeTab === "given" ? "Reviews Given" : "Reviews Received"}
                </p>
              </div>
              <div className="bg-white p-3 sm:p-4 rounded-xl shadow-sm border border-gray-100">
                <p className="text-xl sm:text-2xl font-bold text-center text-yellow-500">
                  {currentFeedback.length > 0
                    ? (currentFeedback.reduce((acc, f) => acc + f.rating, 0) / currentFeedback.length).toFixed(1)
                    : "0.0"}
                </p>
                <p className="text-gray-500 text-xs text-center mt-1">Average Rating</p>
              </div>
            </div>

            {/* Services List - Grouped */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 sm:gap-3 lg:gap-4">
              {isLoading ? (
                <div className="col-span-full text-center py-8 text-gray-500 text-sm">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                  Loading feedback...
                </div>
              ) : Object.keys(groupedFeedbacks).length === 0 ? (
                <div className="col-span-full text-center py-12 sm:py-16 text-gray-500">
                  <BellIcon className="h-12 sm:h-16 w-12 sm:w-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-sm sm:text-base">
                    {activeTab === "given" 
                      ? "No feedback given yet" 
                      : "No feedback received yet"}
                  </p>
                </div>
              ) : (
                Object.values(groupedFeedbacks).map((serviceGroup) => {
                  const avgRating = getServiceAverageRating(serviceGroup.feedbacks);
                  
                  return (
                    <div
                      key={serviceGroup.service_id}
                      className="bg-white p-4 sm:p-5 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all space-y-3 flex flex-col"
                    >
                      {/* Service Title */}
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold">Service Title</p>
                        <h3 className="font-bold text-sm sm:text-base text-gray-900 mt-0.5">
                          {serviceGroup.service_title}
                        </h3>
                      </div>

                      {/* Service Description */}
                      {serviceGroup.service_description && (
                        <div className="bg-blue-50 border border-blue-100 p-3 rounded-lg">
                          <p className="text-xs text-blue-600 font-semibold mb-1 uppercase">Description</p>
                          <p className="text-gray-700 text-xs sm:text-sm leading-relaxed line-clamp-3">
                            {serviceGroup.service_description}
                          </p>
                        </div>
                      )}

                      {/* Service Provider/Learner */}
                      <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                        <p className="text-xs text-gray-600 font-semibold uppercase mb-1">
                          {activeTab === "given" ? "Service Tutor" : "Learner"}
                        </p>
                        <p className="text-sm font-medium text-gray-900">
                          {activeTab === "given" 
                            ? serviceGroup.provider_name || 'Unknown Tutor' 
                            : serviceGroup.user_full_name || 'Unknown Learner'}
                        </p>
                      </div>

                      {/* Average Rating */}
                      <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg">
                        <p className="text-xs text-amber-600 font-semibold mb-2 uppercase">Average Service Rating</p>
                        <div className="flex items-center gap-2">
                          <div className="flex gap-0.5">
                            {[...Array(5)].map((_, i) => (
                              <span
                                key={i}
                                className={`text-lg ${
                                  i < Math.floor(avgRating) ? "text-yellow-400" : "text-gray-300"
                                }`}
                              >
                                ★
                              </span>
                            ))}
                          </div>
                          <span className="text-sm font-bold text-amber-700">
                            {avgRating}/5 ({serviceGroup.feedbacks.length} {serviceGroup.feedbacks.length === 1 ? 'feedback' : 'feedbacks'})
                          </span>
                        </div>
                      </div>

                      {/* Feedbacks Button */}
                      <button
                        onClick={() => {
                          setSelectedServiceFeedbacks(serviceGroup.feedbacks);
                          setSelectedServiceName(serviceGroup.service_title);
                        }}
                        className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                      >
                        View All Feedbacks ({serviceGroup.feedbacks.length})
                      </button>
                    </div>
                  );
                })
              )}
            </div>

            {/* Bottom spacing */}
            <div className="h-4 sm:h-6"></div>
          </div>
        </div>
      </div>

      {/* Feedback Modal */}
      {selectedServiceFeedbacks && (
        <FeedbackModal 
          feedbacks={selectedServiceFeedbacks}
          serviceName={selectedServiceName}
          feedbackType={activeTab}
          onClose={() => {
            setSelectedServiceFeedbacks(null);
            setSelectedServiceName("");
          }}
        />
      )}
    </div>
  );
}