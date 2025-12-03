import React, { useState, useEffect } from "react";
import {
  ArrowLeftIcon,
  ExclamationTriangleIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { useNavigate, useParams } from "react-router-dom";

const API_URL = 'http://localhost:5000';

const ProviderProfile = () => {
  const navigate = useNavigate();
  const { userId } = useParams();
  const [provider, setProvider] = useState(null);
  const [services, setServices] = useState([]);
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reportDescription, setReportDescription] = useState("");
  const [submittingReport, setSubmittingReport] = useState(false);

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
    
    if (!reportReason || !reportDescription) {
      alert('Please fill in all fields');
      return;
    }

    try {
      setSubmittingReport(true);
      const currentUser = JSON.parse(localStorage.getItem('user'));
      
      const response = await fetch(`${API_URL}/api/reports/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reported_user_id: userId,
          reporter_id: currentUser?.id,
          reason: reportReason,
          description: reportDescription,
          violation_type: 'minor'
        })
      });

      if (response.ok) {
        alert('Report submitted successfully');
        setShowReportModal(false);
        setReportReason('');
        setReportDescription('');
      } else {
        alert('Failed to submit report');
      }
    } catch (error) {
      console.error('Error submitting report:', error);
      alert('Failed to submit report');
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Loading provider profile...</p>
        </div>
      </div>
    );
  }

  if (error || !provider) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error || 'Provider not found'}</p>
          <button
            onClick={() => navigate('/find-services')}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to Services
          </button>
        </div>
      </div>
    );
  }

  const averageRating = calculateAverageRating();

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white pb-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4 sticky top-0 z-20 shadow-lg">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 hover:bg-white/10 p-2 rounded-lg transition-colors"
        >
          <ArrowLeftIcon className="h-6 w-6" />
          <span className="text-lg font-semibold">Provider Profile</span>
        </button>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Profile Card */}
        <div className="bg-white rounded-2xl p-6 shadow-lg mb-6">
          <div className="flex flex-col sm:flex-row items-center gap-6 pb-6 border-b">
            <div className="flex-shrink-0">
              {provider.profile_image ? (
                <img
                  src={provider.profile_image}
                  alt={provider.full_name}
                  className="w-24 h-24 sm:w-32 sm:h-32 rounded-full object-cover border-4 border-blue-200"
                />
              ) : (
                <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center text-white text-4xl font-bold border-4 border-blue-200">
                  {provider.full_name?.charAt(0).toUpperCase()}
                </div>
              )}
            </div>

            <div className="flex-1 text-center sm:text-left">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{provider.full_name}</h1>
              <p className="text-gray-600 mb-3">{provider.email}</p>
              
              <div className="flex items-center gap-3 justify-center sm:justify-start mb-4">
                <div className="flex gap-0.5">
                  {renderStars(averageRating)}
                </div>
                <span className="text-xl font-bold text-blue-600">{averageRating}/5</span>
                <span className="text-gray-600">({feedbacks.length} Reviews)</span>
              </div>

              <span className="inline-block px-4 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold">
                {provider.role}
              </span>
            </div>
          </div>
        </div>

        {/* Services Offered */}
        <div className="bg-white rounded-2xl p-6 shadow-lg mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Services Offered</h2>
          
          {services.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No services available</p>
          ) : (
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {services.map((service) => (
                <div key={service.id} className="p-4 border border-gray-200 rounded-xl hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-gray-900 text-lg">{service.title}</h3>
                    <span className="text-blue-600 font-bold text-lg">SC {service.price}</span>
                  </div>
                  <p className="text-gray-600 text-sm line-clamp-2">{service.description}</p>
                  
                  {service.average_rating > 0 && (
                    <div className="flex items-center gap-2 mt-2">
                      <div className="flex gap-0.5">
                        {renderStars(service.average_rating)}
                      </div>
                      <span className="text-xs text-gray-600">
                        {parseFloat(service.average_rating).toFixed(1)} ({service.total_ratings})
                      </span>
                    </div>
                  )}

                  <button
                    onClick={() => navigate('/find-services')}
                    className="mt-3 w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
                  >
                    Book Now
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Reviews */}
        <div className="bg-white rounded-2xl p-6 shadow-lg mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Recent Reviews</h2>
          
          {feedbacks.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No reviews yet</p>
          ) : (
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {feedbacks.slice(0, 5).map((feedback) => (
                <div key={feedback.id} className="p-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-semibold text-gray-900">{feedback.learner_name || 'Anonymous'}</h4>
                    <div className="flex gap-0.5">
                      {renderStars(feedback.rating)}
                    </div>
                  </div>
                  {feedback.comment && (
                    <p className="text-gray-700 text-sm mb-2">"{feedback.comment}"</p>
                  )}
                  <p className="text-xs text-gray-500">{formatDate(feedback.created_at)}</p>
                </div>
              ))}
              
              {feedbacks.length > 5 && (
                <button className="w-full mt-4 px-4 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 font-medium">
                  View All Reviews ({feedbacks.length})
                </button>
              )}
            </div>
          )}
        </div>

        {/* Report User Button */}
        <button
          onClick={() => setShowReportModal(true)}
          className="w-full px-6 py-3 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 font-semibold flex items-center justify-center gap-2"
        >
          <ExclamationTriangleIcon className="h-5 w-5" />
          Report User
        </button>
      </div>

      {/* Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-gray-900">Report User</h2>
              <button
                onClick={() => setShowReportModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleReportSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Reason for Report</label>
                <select
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                >
                  <option value="">Select a reason</option>
                  <option value="inappropriate-behavior">Inappropriate Behavior</option>
                  <option value="scam">Scam/Fraud</option>
                  <option value="poor-service">Poor Service Quality</option>
                  <option value="harassment">Harassment</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
                <textarea
                  value={reportDescription}
                  onChange={(e) => setReportDescription(e.target.value)}
                  placeholder="Please provide details about your report..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 resize-none"
                  rows="4"
                ></textarea>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowReportModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingReport}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium disabled:opacity-50"
                >
                  {submittingReport ? 'Submitting...' : 'Submit Report'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProviderProfile;