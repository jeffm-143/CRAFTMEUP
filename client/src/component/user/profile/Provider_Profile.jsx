import React, { useState, useEffect } from "react";
import {
  ArrowLeftIcon,
  ExclamationTriangleIcon,
  XMarkIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/outline";
import { useNavigate, useParams } from "react-router-dom";

const API_URL = 'http://localhost:5000';

// ✅ Enhanced Toast Component with Progress Bar
const Toast = ({ message, type = 'success', onClose }) => {
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    const duration = 3000; // 3 seconds
    const interval = 10; // Update every 10ms
    const decrement = (interval / duration) * 100;

    const timer = setInterval(() => {
      setProgress((prev) => {
        const newProgress = prev - decrement;
        if (newProgress <= 0) {
          clearInterval(timer);
          onClose();
          return 0;
        }
        return newProgress;
      });
    }, interval);

    return () => clearInterval(timer);
  }, [onClose]);

  const getStyles = () => {
    if (type === 'success') {
      return {
        bg: 'bg-gradient-to-r from-green-500 to-green-600',
        progressBg: 'bg-green-300',
        icon: <CheckCircleIcon className="h-5 w-5 text-white" />
      };
    }
    return {
      bg: 'bg-gradient-to-r from-red-500 to-red-600',
      progressBg: 'bg-red-300',
      icon: <XMarkIcon className="h-5 w-5 text-white" />
    };
  };

  const styles = getStyles();

  return (
    <div className="fixed top-4 right-4 z-50 animate-slideIn">
      <div className={`${styles.bg} text-white px-5 py-3.5 rounded-xl shadow-2xl min-w-[300px] max-w-md overflow-hidden`}>
        <div className="flex items-center gap-3 mb-2">
          {styles.icon}
          <p className="font-semibold text-sm flex-1">{message}</p>
          <button onClick={onClose} className="text-white/80 hover:text-white transition-colors">
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
        
        {/* Progress Bar */}
        <div className="w-full h-1 bg-white/20 rounded-full overflow-hidden">
          <div 
            className={`h-full ${styles.progressBg} transition-all duration-100 ease-linear`}
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>
    </div>
  );
};

const ProviderProfile = () => {
  const navigate = useNavigate();
  const { userId } = useParams();
  const [provider, setProvider] = useState(null);
  const [services, setServices] = useState([]);
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showAllReviewsModal, setShowAllReviewsModal] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reportDescription, setReportDescription] = useState("");
  const [submittingReport, setSubmittingReport] = useState(false);
  const [toast, setToast] = useState(null); // ✅ Toast state

  useEffect(() => {
    fetchProviderData();
  }, [userId]);

  const fetchProviderData = async () => {
    try {
      setLoading(true);
      
      const userRes = await fetch(`${API_URL}/api/auth/user/${userId}`);
      const servicesRes = await fetch(`${API_URL}/api/services/user/${userId}`);
      const feedbacksRes = await fetch(`${API_URL}/api/feedback/provider/${userId}`);
      
      if (!userRes.ok) throw new Error('Failed to fetch user');
      if (!servicesRes.ok) throw new Error('Failed to fetch services');

      setProvider(await userRes.json());
      setServices(await servicesRes.json() || []);
      setFeedbacks(feedbacksRes.ok ? await feedbacksRes.json() : []);
      setError(null);
    } catch (err) {
      console.error('Error fetching provider data:', err);
      setError('Failed to load provider profile');
    } finally {
      setLoading(false);
    }
  };

  const handleReportSubmit = async (e) => {
    e.preventDefault();
    
    // Trim and validate
    const trimmedReason = reportReason.trim();
    const trimmedDescription = reportDescription.trim();
    
    if (!trimmedReason || !trimmedDescription) {
      setToast({ message: 'Please fill in all fields', type: 'error' });
      return;
    }

    try {
      setSubmittingReport(true);
      
      // ✅ Get current user from localStorage
      let currentUser = null;
      const userStr = localStorage.getItem('user');
      
      console.log('🔍 Checking localStorage for user:', userStr);
      
      if (userStr) {
        try {
          currentUser = JSON.parse(userStr);
          console.log('✅ Parsed user:', currentUser);
        } catch (parseError) {
          console.error('❌ Failed to parse user from localStorage:', parseError);
        }
      }
      
      // ✅ Check if user exists and has an id
      if (!currentUser || !currentUser.id) {
        console.error('❌ No valid user found. localStorage user:', currentUser);
        setToast({ message: 'Please login first to submit a report', type: 'error' });
        setSubmittingReport(false);
        return;
      }

      const reportData = {
        reported_user_id: parseInt(userId),
        reporter_id: parseInt(currentUser.id),
        reason: trimmedReason,
        description: trimmedDescription
      };

      console.log('📤 Submitting report with:', reportData);

      const response = await fetch(`${API_URL}/api/reports/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reportData)
      });

      const data = await response.json();
      console.log('📥 Server response:', data);

      if (response.ok && data.success) {
        setToast({ message: 'Report submitted successfully! Our team will review it shortly.', type: 'success' });
        setShowReportModal(false);
        setReportReason('');
        setReportDescription('');
      } else {
        setToast({ message: data.message || 'Failed to submit report', type: 'error' });
      }
    } catch (error) {
      console.error('❌ Error submitting report:', error);
      setToast({ message: 'Failed to submit report. Please try again.', type: 'error' });
    } finally {
      setSubmittingReport(false);
    }
  };

  const calculateAverageRating = () => {
    if (feedbacks.length === 0) return 0;
    const total = feedbacks.reduce((sum, f) => sum + f.rating, 0);
    return (total / feedbacks.length).toFixed(1);
  };

  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, i) => (
      <span key={i} className={i < Math.round(rating) ? "text-yellow-400 text-lg" : "text-gray-300 text-lg"}>
        ★
      </span>
    ));
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const getServiceForFeedback = (feedback) => {
    return services.find(s => s.id === feedback.service_id);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-4">
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 animate-spin"></div>
            <div className="absolute inset-2 rounded-full bg-white"></div>
          </div>
          <p className="text-gray-600 font-semibold">Loading provider profile...</p>
        </div>
      </div>
    );
  }

  if (error || !provider) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center p-4">
        <div className="text-center bg-white rounded-3xl p-8 shadow-xl">
          <p className="text-red-500 mb-4 font-semibold">{error || 'Provider not found'}</p>
          <button
            onClick={() => navigate('/find-classes')}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl hover:from-blue-700 hover:to-purple-700 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
          >
            Back to Services
          </button>
        </div>
      </div>
    );
  }

  const averageRating = calculateAverageRating();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 pb-8">
      {/* ✅ Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4 sticky top-0 z-20 shadow-lg">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
        <button
          onClick={() => navigate(-1)}
          className="relative flex items-center gap-3 hover:bg-white/20 p-3 rounded-2xl transition-all duration-200 backdrop-blur-sm"
        >
          <ArrowLeftIcon className="h-6 w-6" />
          <span className="text-xl font-bold">Provider Profile</span>
        </button>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Profile Card */}
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-8 shadow-2xl mb-6 border border-white/50 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-full blur-3xl"></div>
          
          <div className="relative flex flex-col sm:flex-row items-center gap-6 pb-6 border-b border-gray-200">
            <div className="flex-shrink-0">
              {provider.profile_image ? (
                <img
                  src={provider.profile_image}
                  alt={provider.full_name}
                  className="w-32 h-32 sm:w-40 sm:h-40 rounded-full object-cover border-4 border-gradient-to-r from-blue-500 to-purple-500 shadow-xl"
                />
              ) : (
                <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-full bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center text-white text-5xl font-bold border-4 border-white shadow-xl">
                  {provider.full_name?.charAt(0).toUpperCase()}
                </div>
              )}
            </div>

            <div className="flex-1 text-center sm:text-left">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent mb-3">{provider.full_name}</h1>
              <p className="text-gray-600 mb-4 text-lg">{provider.email}</p>
              
              <div className="flex items-center gap-4 justify-center sm:justify-start mb-4">
                <div className="flex gap-0.5">
                  {renderStars(averageRating)}
                </div>
                <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">{averageRating}/5</span>
                <span className="text-gray-600 font-medium">({feedbacks.length} Reviews)</span>
              </div>

              <span className="inline-flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-blue-100 to-purple-100 text-blue-700 rounded-full text-sm font-bold shadow-sm">
                <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
                {provider.role}
              </span>
            </div>
          </div>
        </div>

        {/* Classes Offered */}
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-8 shadow-2xl mb-6 border border-white/50 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-full blur-3xl"></div>
          
          <div className="relative flex items-center gap-3 mb-6">
            <div className="h-8 w-1 bg-gradient-to-b from-blue-500 to-purple-500 rounded-full"></div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">Classes Offered</h2>
          </div>
          
          {services.length === 0 ? (
            <div className="text-center py-12 bg-gradient-to-br from-gray-50 to-blue-50 rounded-3xl">
              <p className="text-gray-500 font-medium">No services available</p>
            </div>
          ) : (
            <div className="space-y-4 max-h-96 overflow-y-auto custom-scrollbar pr-2">
              {services.map((service) => (
                <div key={service.id} className="group bg-white hover:bg-gradient-to-br hover:from-blue-50 hover:to-purple-50 p-6 border border-gray-200 rounded-3xl hover:shadow-xl transition-all duration-300 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/5 to-purple-500/5 rounded-full blur-2xl transform translate-x-16 -translate-y-16 group-hover:scale-150 transition-transform duration-500"></div>
                  
                  <div className="relative">
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="font-bold text-gray-900 text-xl group-hover:text-blue-600 transition-colors">{service.title}</h3>
                      <span className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold text-lg rounded-xl shadow-lg">SC {service.price}</span>
                    </div>
                    <p className="text-gray-600 text-sm leading-relaxed line-clamp-2 mb-3">{service.description}</p>
                    
                    {service.average_rating > 0 && (
                      <div className="flex items-center gap-2">
                        <div className="flex gap-0.5">
                          {renderStars(service.average_rating)}
                        </div>
                        <span className="text-sm text-gray-600 font-medium">
                          {parseFloat(service.average_rating).toFixed(1)} ({service.total_ratings})
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Reviews */}
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-8 shadow-2xl mb-6 border border-white/50 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-full blur-3xl"></div>
          
          <div className="relative flex items-center gap-3 mb-6">
            <div className="h-8 w-1 bg-gradient-to-b from-blue-500 to-purple-500 rounded-full"></div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">Recent Reviews</h2>
          </div>
          
          {feedbacks.length === 0 ? (
            <div className="text-center py-12 bg-gradient-to-br from-gray-50 to-blue-50 rounded-3xl">
              <p className="text-gray-500 font-medium">No reviews yet</p>
            </div>
          ) : (
            <div className="space-y-4 max-h-[32rem] overflow-y-auto custom-scrollbar pr-2">
              {feedbacks.slice(0, 5).map((feedback) => {
                const service = getServiceForFeedback(feedback);
                return (
                  <div key={feedback.id} className="group bg-white hover:bg-gradient-to-br hover:from-blue-50 hover:to-purple-50 p-6 border border-gray-200 rounded-3xl hover:shadow-xl transition-all duration-300 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/5 to-purple-500/5 rounded-full blur-2xl transform translate-x-16 -translate-y-16 group-hover:scale-150 transition-transform duration-500"></div>
                    
                    <div className="relative">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <h4 className="font-bold text-gray-900 text-lg mb-1">{feedback.learner_name || 'Anonymous'}</h4>
                          {service && (
                            <p className="text-sm text-gray-600 mb-2">
                              <span className="font-semibold">Classes:</span> {service.title}
                            </p>
                          )}
                        </div>
                        <div className="flex gap-0.5">
                          {renderStars(feedback.rating)}
                        </div>
                      </div>
                      
                      {feedback.comment && (
                        <p className="text-gray-700 text-sm leading-relaxed mb-3 italic">"{feedback.comment}"</p>
                      )}
                      
                      <p className="text-xs text-gray-500 font-medium">{formatDate(feedback.created_at)}</p>
                    </div>
                  </div>
                );
              })}
              
              {feedbacks.length > 5 && (
                <button 
                  onClick={() => setShowAllReviewsModal(true)}
                  className="w-full mt-4 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-2xl font-bold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                >
                  View All Reviews ({feedbacks.length})
                </button>
              )}
            </div>
          )}
        </div>

        {/* Report User Button */}
        <button
          onClick={() => setShowReportModal(true)}
          className="w-full px-6 py-4 bg-gradient-to-r from-red-100 to-pink-100 hover:from-red-200 hover:to-pink-200 text-red-700 rounded-2xl font-bold flex items-center justify-center gap-3 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
        >
          <ExclamationTriangleIcon className="h-6 w-6" />
          Report User
        </button>
      </div>

      {/* All Reviews Modal */}
      {showAllReviewsModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl w-full max-w-3xl shadow-2xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 text-white p-6 flex justify-between items-center">
              <h2 className="text-2xl font-bold">All Reviews ({feedbacks.length})</h2>
              <button
                onClick={() => setShowAllReviewsModal(false)}
                className="text-white hover:bg-white/20 p-2 rounded-xl transition-all duration-200"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto custom-scrollbar">
              <div className="space-y-4">
                {feedbacks.map((feedback) => {
                  const service = getServiceForFeedback(feedback);
                  return (
                    <div key={feedback.id} className="group bg-gradient-to-br from-gray-50 to-blue-50 hover:from-blue-50 hover:to-purple-50 p-6 rounded-3xl border border-gray-200 hover:shadow-xl transition-all duration-300 relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-full blur-2xl transform translate-x-16 -translate-y-16 group-hover:scale-150 transition-transform duration-500"></div>
                      
                      <div className="relative">
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex-1">
                            <h4 className="font-bold text-gray-900 text-lg mb-2">{feedback.learner_name || 'Anonymous'}</h4>
                            {service && (
                              <div className="mb-2">
                                <p className="text-sm font-semibold text-gray-700 mb-1">Service: {service.title}</p>
                                <p className="text-xs text-gray-600 line-clamp-1">{service.description}</p>
                              </div>
                            )}
                          </div>
                          <div className="flex gap-0.5 flex-shrink-0 ml-3">
                            {renderStars(feedback.rating)}
                          </div>
                        </div>
                        
                        {feedback.comment && (
                          <div className="bg-white/70 rounded-2xl p-4 mb-3">
                            <p className="text-gray-700 text-sm leading-relaxed italic">"{feedback.comment}"</p>
                          </div>
                        )}
                        
                        <p className="text-xs text-gray-500 font-medium">{formatDate(feedback.created_at)}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">Report User</h2>
              <button
                onClick={() => setShowReportModal(false)}
                className="text-gray-500 hover:text-gray-700 p-2 hover:bg-gray-100 rounded-xl transition-all duration-200"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleReportSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Reason for Report</label>
                <select
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-2xl focus:outline-none focus:border-blue-500 transition-colors"
                >
                  <option value="">Select a reason</option>
                  <option value="Inappropriate Behavior">Inappropriate Behavior</option>
                  <option value="Scam/Fraud">Scam/Fraud</option>
                  <option value="Poor Service Quality">Poor Service Quality</option>
                  <option value="Harassment">Harassment</option>
                  <option value="Fake Account">Fake Account</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Description</label>
                <textarea
                  value={reportDescription}
                  onChange={(e) => setReportDescription(e.target.value)}
                  placeholder="Please provide details about your report..."
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-2xl focus:outline-none focus:border-blue-500 resize-none transition-colors"
                  rows="4"
                  maxLength="500"
                ></textarea>
                <p className="text-xs text-gray-500 mt-2 font-medium">{reportDescription.length}/500 characters</p>
              </div>

              <div className="bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-blue-200 rounded-2xl p-4">
                <p className="text-xs text-blue-700 leading-relaxed">
                  <strong>Note:</strong> False reports may result in your account being suspended. Please ensure all information is accurate.
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowReportModal(false)}
                  className="flex-1 px-4 py-3 border-2 border-gray-300 text-gray-700 rounded-2xl hover:bg-gray-50 font-bold transition-all duration-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingReport || !reportReason || !reportDescription}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white rounded-2xl font-bold disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  {submittingReport ? 'Submitting...' : 'Submit Report'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        .animate-slideIn {
          animation: slideIn 0.3s ease-out;
        }

        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }

        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: linear-gradient(to bottom, #3b82f6, #8b5cf6);
          border-radius: 10px;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(to bottom, #2563eb, #7c3aed);
        }
      `}</style>
    </div>
  );
};

export default ProviderProfile;