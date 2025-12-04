import React, { useState, useEffect, useRef } from "react";
import { FiArrowLeft, FiEdit3, FiStar } from "react-icons/fi";
import { useNavigate } from 'react-router-dom';
import io from "socket.io-client";

export default function View_Past_Feedback() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("given");
  const [feedbacks, setFeedbacks] = useState({ given: [], received: [] });
  const [loading, setLoading] = useState(true);
  const socketRef = useRef(null);

  useEffect(() => {
    fetchFeedbacks();
    
    // ✅ Initialize socket connection
    const socket = io('http://localhost:5000', {
      transports: ['websocket', 'polling'],
      reconnection: true
    });
    
    socketRef.current = socket;
    
    socket.on('connect', () => {
      console.log('✅ Connected to socket for feedback updates');
    });
    
    // ✅ Listen for service deletions
    socket.on('service-deleted', (deletedServiceId) => {
      console.log('🗑️ Service deleted, updating feedbacks:', deletedServiceId);
      
      // Remove feedbacks for deleted service from received tab
      setFeedbacks(prev => ({
        given: prev.given, // Keep given feedbacks
        received: prev.received.filter(f => f.service_id !== deletedServiceId) // Remove from received
      }));
    });
    
    return () => {
      socket.disconnect();
    };
  }, []);

  const fetchFeedbacks = async () => {
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      const response = await fetch(`http://localhost:5000/api/feedback/user/${user.id}`);
      const data = await response.json();
      
      if (data.success) {
        setFeedbacks(data.data);
      }
    } catch (error) {
      console.error('Error fetching feedbacks:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (rating) => {
    return (
      <div className="flex">
        {[...Array(5)].map((_, i) => (
          <span
            key={i}
            className={i < rating ? "text-yellow-500" : "text-gray-300"}
          >
            ★
          </span>
        ))}
      </div>
    );
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const currentFeedbacks = activeTab === "given" ? feedbacks.given : feedbacks.received;

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex flex-col w-full md:max-w-sm mx-auto">
      {/* Header */}
      <div className="p-6 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
        <div className="flex items-center space-x-3">
          <button 
            className="text-white"
            onClick={() => navigate(-1)}
          >
            <FiArrowLeft size={20} />
          </button>
          <h1 className="text-lg font-semibold">Feedback & Ratings</h1>
        </div>

        {/* Stats */}
        <div className="mt-4 flex justify-around bg-white/10 backdrop-blur-sm rounded-xl p-4">
          <div className="text-center">
            <p className="text-2xl font-bold">{feedbacks.given?.length || 0}</p>
            <p className="text-xs text-white/80">Reviews Given</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold">{feedbacks.received?.length || 0}</p>
            <p className="text-xs text-white/80">Reviews Received</p>
          </div>
        </div>

        {/* Toggle Tabs */}
        <div className="mt-4 bg-white/10 backdrop-blur-sm p-1 rounded-xl flex">
          <button
            onClick={() => setActiveTab("given")}
            className={`flex items-center justify-center gap-1 w-1/2 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === "given"
                ? "bg-white text-blue-600"
                : "text-white/90 hover:bg-white/10"
            }`}
          >
            <FiEdit3 />
            <span>Given</span>
          </button>
          <button
            onClick={() => setActiveTab("received")}
            className={`flex items-center justify-center gap-1 w-1/2 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === "received"
                ? "bg-white text-blue-600"
                : "text-white/90 hover:bg-white/10"
            }`}
          >
            <FiStar />
            <span>Received</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="p-4 bg-white border-b">
        <div className="flex justify-between gap-2">
          <select className="w-1/2 border rounded-xl px-3 py-2 text-sm bg-gray-50">
            <option>All Services</option>
          </select>
          <select className="w-1/2 border rounded-xl px-3 py-2 text-sm bg-gray-50">
            <option>All Ratings</option>
          </select>
        </div>
      </div>

      {/* Feedback List */}
      <div className="flex-1 p-4 space-y-4 overflow-y-auto">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-500">Loading feedbacks...</p>
          </div>
        ) : currentFeedbacks.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">
              {activeTab === "given" ? "No feedbacks given yet" : "No feedbacks received yet"}
            </p>
          </div>
        ) : (
          currentFeedbacks.map((feedback, index) => (
            <div 
              key={feedback.id || index} 
              className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 hover:scale-[1.02] transition-transform"
            >
              <div className="flex justify-between items-start mb-2">
                <div className="flex-1">
                  <span className="font-semibold">{feedback.service_title}</span>
                  {/* ✅ Show deleted indicator for given feedbacks */}
                  {activeTab === "given" && feedback.service_deleted_at && (
                    <span className="ml-2 inline-block px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded-full">
                      ⚠️ Service Deleted
                    </span>
                  )}
                </div>
                <span className="text-xs text-gray-500">{formatDate(feedback.created_at)}</span>
              </div>
              
              {activeTab === "given" && feedback.provider_name && (
                <p className="text-xs text-gray-500 mb-2">by {feedback.provider_name}</p>
              )}
              
              {activeTab === "received" && feedback.user_full_name && (
                <p className="text-xs text-gray-500 mb-2">from {feedback.user_full_name}</p>
              )}
              
              <div className="flex items-center mb-2">
                {renderStars(feedback.rating)}
              </div>
              
              {feedback.comment && (
                <p className="text-gray-700 text-sm">
                  {feedback.comment}
                </p>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}