import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ExclamationTriangleIcon, XMarkIcon, StarIcon, ArrowLeftIcon } from "@heroicons/react/24/outline";
import { submitFeedback } from '../../../services/api';

const API_URL = 'http://localhost:5000';

// ✅ Report User Modal - SAME CONTENT AS PROVIDER PROFILE
function ReportUserModal({ userId, userName, onClose }) {
  const [reportReason, setReportReason] = useState("");
  const [reportDescription, setReportDescription] = useState("");
  const [submittingReport, setSubmittingReport] = useState(false);

  const handleReportSubmit = async (e) => {
    e.preventDefault();
    
    if (!reportReason.trim() || !reportDescription.trim()) {
      alert('Please fill in all fields');
      return;
    }

    try {
      setSubmittingReport(true);
      const currentUser = JSON.parse(localStorage.getItem('user'));
      
      if (!currentUser?.id) {
        alert('Please login first');
        return;
      }

      const reportPayload = {
        reported_user_id: parseInt(userId),
        reporter_id: parseInt(currentUser.id),
        reason: reportReason,
        description: reportDescription
      };

      console.log('📝 Submitting report with payload:', reportPayload);

      const response = await fetch(`${API_URL}/api/reports/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reportPayload)
      });

      const data = await response.json();
      console.log('📨 Response from server:', data);

      if (response.ok) {
        alert('✅ Report submitted successfully! Our team will review it shortly.');
        onClose();
        setReportReason('');
        setReportDescription('');
      } else {
        alert('❌ ' + (data.message || 'Failed to submit report'));
      }
    } catch (error) {
      console.error('❌ Error submitting report:', error);
      alert('Failed to submit report. Please try again.');
    } finally {
      setSubmittingReport(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Report User</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleReportSubmit} className="space-y-4">
          {/* Reason for Report */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Reason for Report
            </label>
            <select
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-700"
              required
            >
              <option value="">Select a reason</option>
              <option value="Inappropriate Behavior">Inappropriate Behavior</option>
              <option value="Scam/Fraud">Scam/Fraud</option>
              <option value="Poor Service Quality">Poor Service Quality</option>
              <option value="Harassment">Harassment</option>
              <option value="Fake Account">Fake Account</option>
              <option value="Offensive Content">Offensive Content</option>
              <option value="Other">Other</option>
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Description
            </label>
            <textarea
              value={reportDescription}
              onChange={(e) => setReportDescription(e.target.value)}
              placeholder="Please provide details about your report..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-gray-700 placeholder-gray-400"
              rows="4"
              maxLength="500"
              required
            />
            <p className="text-xs text-gray-500 mt-1">{reportDescription.length}/500 characters</p>
          </div>

          {/* Information Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-xs text-blue-700 leading-relaxed">
              <strong>Note:</strong> False reports may result in your account being suspended. Please ensure all information is accurate.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => {
                onClose();
                setReportReason('');
                setReportDescription('');
              }}
              className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submittingReport || !reportReason.trim() || !reportDescription.trim()}
              className="flex-1 px-4 py-2.5 bg-red-500 text-white rounded-lg hover:bg-red-600 font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {submittingReport ? 'Submitting...' : 'Submit Report'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Feedback() {
  const location = useLocation();
  const navigate = useNavigate();
  const booking = location.state?.booking;
  
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportingUserId, setReportingUserId] = useState(null);
  const [reportingUserName, setReportingUserName] = useState(null);

  if (!booking) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">No Booking Found</h1>
          <p className="text-gray-600 mb-6">Please complete a transaction first before leaving feedback.</p>
          <button
            onClick={() => navigate('/transactions')}
            className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 font-semibold transition-all"
          >
            Back to Transactions
          </button>
        </div>
      </div>
    );
  }

  const handleReportUser = () => {
    const reportedUserId = booking.provider_id || booking.user_id;
    const reportedUserName = booking.provider_name || booking.user_name || 'Provider';
    
    setReportingUserId(reportedUserId);
    setReportingUserName(reportedUserName);
    setShowReportModal(true);
  };

  const handleSubmitFeedback = async (e) => {
    e.preventDefault();

    if (rating === 0) {
      alert('Please select a rating');
      return;
    }

    if (comment.trim() === '') {
      alert('Please write a comment');
      return;
    }

    try {
      setSubmitting(true);
      const currentUser = JSON.parse(localStorage.getItem('user'));

      const feedbackData = {
        service_id: parseInt(booking.service_id),
        user_id: parseInt(currentUser.id),
        rating: parseInt(rating),
        comment: comment.trim()
      };

      console.log('📝 Submitting feedback:', feedbackData);

      await submitFeedback(feedbackData);

      console.log('✅ Feedback submitted successfully');
      setSubmitted(true);

      // Redirect after 2 seconds
      setTimeout(() => {
        navigate('/transactions');
      }, 2000);
    } catch (error) {
      console.error('❌ Error submitting feedback:', error);
      alert('Failed to submit feedback. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center animate-fade-in">
          <div className="mb-4 flex justify-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Thank You!</h1>
          <p className="text-gray-600 mb-6">Your feedback has been submitted successfully. We appreciate your time and feedback.</p>
          <p className="text-sm text-gray-500">Redirecting to transactions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header with Back Button */}
        <div className="mb-8 flex items-center">
          <button
            onClick={() => navigate('/transactions')}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium transition-colors"
          >
            <ArrowLeftIcon className="h-5 w-5" />
            Back to Transactions
          </button>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Header Section */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-8 text-white">
            <h1 className="text-3xl font-bold mb-2">Rate & Review</h1>
            <p className="text-blue-100">Share your experience with this service</p>
          </div>

          {/* Content Section */}
          <div className="p-8">
            {/* Service Info */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 mb-8 border border-blue-100">
              <h2 className="font-semibold text-gray-900 mb-2">{booking.service_title}</h2>
              <p className="text-sm text-gray-600 mb-3">{booking.description}</p>
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-blue-600">Provider: {booking.provider_name}</span>
                <span className="text-sm font-semibold text-blue-600">SC {Number(booking.price).toFixed(2)}</span>
              </div>
            </div>

            {/* Feedback Form */}
            <form onSubmit={handleSubmitFeedback} className="space-y-8">
              {/* Rating Section */}
              <div>
                <label className="block text-lg font-semibold text-gray-900 mb-4">
                  How was your experience?
                </label>
                <div className="flex justify-center gap-4">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      className="transition-transform duration-200 hover:scale-110 focus:outline-none"
                    >
                      <StarIcon
                        className={`h-12 w-12 ${
                          star <= (hoverRating || rating)
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-gray-300'
                        } transition-colors duration-200`}
                      />
                    </button>
                  ))}
                </div>
                <p className="text-center mt-4 text-lg font-semibold text-gray-900">
                  {rating > 0 ? `${rating} out of 5 stars` : 'Select a rating'}
                </p>
              </div>

              {/* Comment Section */}
              <div>
                <label className="block text-lg font-semibold text-gray-900 mb-3">
                  Share your experience
                </label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Tell us what you think about this service..."
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 resize-none font-sans"
                  rows="5"
                  maxLength="500"
                />
                <div className="flex justify-between items-center mt-2">
                  <p className="text-xs text-gray-500">
                    {comment.length}/500 characters
                  </p>
                  {comment.length > 450 && (
                    <p className="text-xs text-orange-500">Warning: Character limit approaching</p>
                  )}
                </div>
              </div>

              {/* Information Box */}
              <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-700 leading-relaxed">
                  <strong>💡 Tip:</strong> Your feedback helps other users make informed decisions and helps providers improve their services. Be honest and constructive in your review.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-3">
                <button
                  type="submit"
                  disabled={submitting || rating === 0 || comment.trim() === ''}
                  className={`w-full px-6 py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all ${
                    submitting || rating === 0 || comment.trim() === ''
                      ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                      : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl'
                  }`}
                >
                  {submitting ? (
                    <>
                      <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Submitting...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Submit Feedback
                    </>
                  )}
                </button>

                {/* ✅ Report User Button */}
                <button
                  type="button"
                  onClick={handleReportUser}
                  className="w-full px-6 py-3 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 font-semibold flex items-center justify-center gap-2 transition-colors"
                >
                  <ExclamationTriangleIcon className="h-5 w-5" />
                  Report User
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Footer Help Text */}
        <div className="mt-6 text-center text-sm text-gray-600">
          <p>Your feedback is valuable and helps maintain the quality of our community.</p>
        </div>
      </div>

      {/* ✅ Report User Modal */}
      {showReportModal && (
        <ReportUserModal
          userId={reportingUserId}
          userName={reportingUserName}
          onClose={() => {
            setShowReportModal(false);
            setReportingUserId(null);
            setReportingUserName(null);
          }}
        />
      )}
    </div>
  );
}