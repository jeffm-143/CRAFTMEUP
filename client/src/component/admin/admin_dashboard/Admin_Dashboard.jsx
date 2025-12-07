import React, { useState, useEffect, useRef } from 'react';
import { FaEye, FaCheck, FaTimes, FaExchangeAlt, FaFileAlt, FaUserPlus, FaWallet, FaUser, FaEnvelope, FaBriefcase, FaTag, FaClock, FaCheckCircle, FaImage } from 'react-icons/fa';
import { XMarkIcon } from "@heroicons/react/24/outline";
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import api, { 
  initializeAdminSocket,
  onActivityStatusUpdated,
  onStatsUpdated,
  onActivityCreated,
  removeActivityStatusUpdatedListener,
  removeStatsUpdatedListener,
  removeActivityCreatedListener,
  disconnectAdmin
} from '../../../services/adminApi';
import AdminSidebar from "../../AdminSidebar";

const Admin_Dashboard = () => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [filterType, setFilterType] = useState('all');
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [detailsModal, setDetailsModal] = useState(false);
  const [stats, setStats] = useState(null);
  const [totalPages, setTotalPages] = useState(1);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [imagePreview, setImagePreview] = useState(null);
  const [selectedViolationType, setSelectedViolationType] = useState('minor');
  const contentRef = useRef(null);
  const scrollPositionRef = useRef(0);

  const violationTypes = {
    minor: ['spam', 'rude_message', 'irrelevant_post'],
    serious: ['harassment', 'scamming', 'fake_credentials', 'offensive_behavior'],
    abuse: ['fake_account', 'coin_misuse', 'credit_abuse']
  };

  // Initialize Socket on mount
  useEffect(() => {
    initializeAdminSocket();

    return () => {
      removeActivityStatusUpdatedListener();
      removeStatsUpdatedListener();
      removeActivityCreatedListener();
      disconnectAdmin();
    };
  }, []);

  // Setup real-time listeners
  useEffect(() => {
    onActivityStatusUpdated(() => {
      console.log('📡 Activity status updated via socket');
      setRefreshing(true);
      setTimeout(() => {
        fetchActivities();
        fetchStats();
        setRefreshing(false);
      }, 300);
    });

    onStatsUpdated(() => {
      console.log('📡 Stats updated via socket');
      fetchStats();
    });

    onActivityCreated(() => {
      console.log('📡 New activity created via socket');
      setRefreshing(true);
      setTimeout(() => {
        fetchActivities();
        fetchStats();
        setRefreshing(false);
      }, 300);
    });

    return () => {
      removeActivityStatusUpdatedListener();
      removeStatsUpdatedListener();
      removeActivityCreatedListener();
    };
  }, [currentPage, filterType]);

  // Initial load
  useEffect(() => {
    fetchActivities();
    fetchStats();
  }, [currentPage, filterType, searchQuery]);

  const handlePageChange = (newPage) => {
    if (contentRef.current) {
      scrollPositionRef.current = contentRef.current.scrollTop;
    }
    setCurrentPage(newPage);
  };

  useEffect(() => {
    if (!loading && contentRef.current) {
      contentRef.current.scrollTop = scrollPositionRef.current;
    }
  }, [loading]);

  const fetchActivities = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/activities', {
        params: {
          page: currentPage,
          limit: 10,
          filterType: filterType,
          search: searchQuery
        }
      });
      setActivities(response.data.data || []);
      setTotalPages(response.data.pagination?.totalPages || 1);
    } catch (error) {
      console.error('Error fetching activities:', error);
      setActivities([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await api.get('/admin/dashboard-stats');
      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

const handleViewDetails = async (activity) => {
  try {
    const response = await api.get(`/admin/activities/${activity.related_id}?type=${encodeURIComponent(activity.activity_type)}`);
    if (response.data.success) {
      // ✅ FIX: Preserve the user_id from the original activity
      const detailedActivity = {
        ...response.data.data,
        user_id: activity.user_id  // ✅ Keep the original user_id
      };
      setSelectedActivity(detailedActivity);
      setDetailsModal(true);
      if (activity.activity_type === 'Report Submitted') {
        setSelectedViolationType('minor');
      }
    }
  } catch (error) {
    console.error('Error fetching details:', error);
    alert('Failed to fetch activity details');
  }
};

  // ✅ Wallet Request Update Handler
const handleWalletRequestUpdate = async (newStatus) => {
  try {
    const activity = selectedActivity;
    const amount = parseFloat(activity.amount);
    const actualRequestId = activity.id;

    let type = 'none';
    if (activity.type && activity.type.toLowerCase() === 'top-up') {
      type = newStatus === 'approved' ? 'credit' : 'none';
    } else if (activity.type && activity.type.toLowerCase() === 'cash-out') {
      type = newStatus === 'completed' ? 'debit' : 'none';
    }

    // ✅ DEBUG: Log all activity properties to find the correct user ID field
    console.log('📋 Activity object:', activity);
    console.log('🔍 Looking for userId in:', {
      user_id: activity.user_id,
      userId: activity.userId,
      uid: activity.uid,
      id: activity.id
    });

    // ✅ Use the correct field - check which one has the value
    const userId = activity.user_id || activity.userId;

    console.log('📤 Sending wallet update:', { 
      id: actualRequestId, 
      status: newStatus, 
      userId: userId,
      amount: amount,
      type: type
    });

    const response = await api.put(`/transactions/wallet/requests/${actualRequestId}/status`, {
      status: newStatus,
      userId: userId,
      amount: amount,
      type: type
    });

    if (response.data && response.data.success) {
      alert('Request status updated successfully');
      setDetailsModal(false);
      setSelectedActivity(null);
      fetchActivities();
      fetchStats();
    }
  } catch (error) {
    console.error('Error updating wallet request:', error);
    alert('Failed to update request status: ' + (error.response?.data?.message || error.message));
  }
};

  // ✅ Report Update Handler with violation type
  const handleReportUpdate = async (reportId, newStatus, violationType = 'minor') => {
    try {
      const statusData = {
        status: newStatus,
        violationType: violationType,
        adminNotes: newStatus === 'invalid' 
          ? 'No violation found' 
          : `${violationType} violation confirmed - ${newStatus} action taken`,
        resolvedAt: new Date().toISOString()
      };

      await api.put(`/reports/${reportId}/status`, statusData);
      
      alert(`Report has been marked as ${newStatus}`);
      setDetailsModal(false);
      setSelectedActivity(null);
      setSelectedViolationType('minor');
      fetchActivities();
      fetchStats();
    } catch (error) {
      console.error('Error updating report:', error);
      alert('Failed to update report status');
    }
  };

  // ✅ User Verification Handler
  const handleUserVerification = async (userId, newStatus) => {
    try {
      await api.put(`/admin/users/${userId}/verify`, { 
        status: newStatus
      });
      alert('User verification status updated successfully');
      setDetailsModal(false);
      setSelectedActivity(null);
      fetchActivities();
      fetchStats();
    } catch (error) {
      console.error('Error updating user verification:', error);
      alert('Failed to update verification status');
    }
  };

  const getActivityTypeColor = (type) => {
    const colors = {
      'Service Created': 'bg-blue-100 text-blue-800',
      'Transaction': 'bg-green-100 text-green-800',
      'Wallet Request': 'bg-yellow-100 text-yellow-800',
      'Report Submitted': 'bg-red-100 text-red-800',
      'User Registered': 'bg-purple-100 text-purple-800'
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  const getStatusColor = (status) => {
    const colors = {
      'Active': 'text-green-600',
      'pending': 'text-yellow-600',
      'Pending': 'text-yellow-600',
      'completed': 'text-blue-600',
      'Completed': 'text-blue-600',
      'rejected': 'text-red-600',
      'Rejected': 'text-red-600',
      'approved': 'text-green-600',
      'ongoing': 'text-blue-600',
      'verified': 'text-green-600',
      'warning': 'text-orange-600',
      'suspended': 'text-red-600',
      'invalid': 'text-gray-600'
    };
    return colors[status] || 'text-gray-600';
  };

  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderDetailCard = (icon, label, value, isHighlight = false, isBadge = false) => {
    return (
      <div className={`p-4 rounded-lg border transition-all ${isHighlight ? 'bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200' : 'bg-white border-gray-200 hover:shadow-md'}`}>
        <div className="flex items-start gap-3">
          <div className={`flex-shrink-0 p-2.5 rounded-lg ${isHighlight ? 'bg-blue-100' : 'bg-gray-100'}`}>
            {icon}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</p>
            <p className={`mt-1 ${isBadge ? 'inline-block' : 'text-sm'} font-medium text-gray-900 break-words`}>
              {isBadge ? (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {value}
                </span>
              ) : (
                value || 'N/A'
              )}
            </p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-50 to-white">
      <AdminSidebar />

      <div className="flex-1 overflow-hidden">
      {/* Header */}
      <div className="bg-white border-b shadow-sm">
        <div className="flex items-center justify-between px-8 py-6">
          <div className="flex items-center gap-4">
            <div>
              <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
                Admin Dashboard
              </h2>
              <p className="text-sm text-gray-500 mt-2">
                Manage and monitor platform activities
              </p>
            </div>

            {refreshing && (
              <div className="flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
                Updating...
              </div>
            )}
          </div>
        </div>
      </div>

        {/* Content Area */}
        <div ref={contentRef} className="p-8 overflow-y-auto h-[calc(100vh-5rem)]">
        {/* Stats Cards */}
        {stats && (
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-7 gap-3 mb-8">
              <div className="bg-white p-4 rounded-lg shadow hover:shadow-lg transition-shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-xs font-semibold">Total Activities</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{stats.totalActivities}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      +{stats.pendingActions || 0} pending
                    </p>
                  </div>
                  <FaEye className="text-blue-500 text-xl" />
                </div>
              </div>
          
              <div className="bg-white p-4 rounded-lg shadow hover:shadow-lg transition-shadow border-l-4 border-yellow-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-xs font-semibold">Pending Activities</p>
                  <p className="text-2xl font-bold text-yellow-600 mt-1">
                    {stats.activitiesByType?.reduce((total, activity) => {
                      const pending = parseInt(activity.pendingCount) || 0;
                      return total + pending;
                    }, 0) || 0}
                  </p>
                </div>
                <div className="text-xl">⏳</div>
              </div>
            </div>

            <div className="bg-white p-4 rounded-lg shadow hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-xs font-semibold">Services</p>
                  <p className="text-2xl font-bold text-blue-600 mt-1">
                    {stats.activitiesByType?.find(a => a.activity_type === 'Service Created')?.count || 0}
                  </p>
                </div>
                <FaCheck className="text-blue-500 text-xl" />
              </div>
            </div>

            <div className="bg-white p-4 rounded-lg shadow hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-xs font-semibold">Transactions</p>
                  <p className="text-2xl font-bold text-green-600 mt-1">
                    {stats.activitiesByType?.find(a => a.activity_type === 'Transaction')?.count || 0}
                  </p>
                  <p className="text-xs text-yellow-600 mt-1">
                    {parseInt(stats.activitiesByType?.find(a => a.activity_type === 'Transaction')?.pendingCount) || 0} pending
                  </p>
                </div>
                <FaExchangeAlt className="text-green-500 text-xl" />
              </div>
            </div>

            <div className="bg-white p-4 rounded-lg shadow hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-xs font-semibold">Wallet Req.</p>
                  <p className="text-2xl font-bold text-yellow-600 mt-1">
                    {stats.activitiesByType?.find(a => a.activity_type === 'Wallet Request')?.count || 0}
                  </p>
                  <p className="text-xs text-yellow-600 mt-1">
                    {parseInt(stats.activitiesByType?.find(a => a.activity_type === 'Wallet Request')?.pendingCount) || 0} pending
                  </p>
                </div>
                <FaWallet className="text-yellow-500 text-xl" />
              </div>
            </div>

            <div className="bg-white p-4 rounded-lg shadow hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-xs font-semibold">Reports</p>
                  <p className="text-2xl font-bold text-red-600 mt-1">
                    {stats.activitiesByType?.find(a => a.activity_type === 'Report Submitted')?.count || 0}
                  </p>
                  <p className="text-xs text-yellow-600 mt-1">
                    {parseInt(stats.activitiesByType?.find(a => a.activity_type === 'Report Submitted')?.pendingCount) || 0} pending
                  </p>
                </div>
                <FaFileAlt className="text-red-500 text-xl" />
              </div>
            </div>

            <div className="bg-white p-4 rounded-lg shadow hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-xs font-semibold">Users</p>
                  <p className="text-2xl font-bold text-purple-600 mt-1">
                    {stats.activitiesByType?.find(a => a.activity_type === 'User Registered')?.count || 0}
                  </p>
                  <p className="text-xs text-yellow-600 mt-1">
                    {parseInt(stats.activitiesByType?.find(a => a.activity_type === 'User Registered')?.pendingCount) || 0} pending
                  </p>
                </div>
                <FaUserPlus className="text-purple-500 text-xl" />
              </div>
            </div>
          </div>
        )}

          {/* Filter and Search */}
          <div className="mb-6 flex gap-4">
            <select
              value={filterType}
              onChange={(e) => {
                setFilterType(e.target.value);
                setCurrentPage(1);
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white cursor-pointer"
            >
              <option value="all">All Activities</option>
              <option value="Service Created">Service Created</option>
              <option value="Transaction">Transaction</option>
              <option value="Wallet Request">Wallet Request</option>
              <option value="Report Submitted">Report Submitted</option>
              <option value="User Registered">User Registered</option>
            </select>

            <div className="relative flex-1 max-w-md">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, email, role, activity, details, or status..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              />
              {searchQuery && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setCurrentPage(1);
                  }}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>

          {/* Activities Table */}
          <div className={`bg-white rounded-lg shadow overflow-x-auto max-h-96 transition-opacity ${refreshing ? 'opacity-60' : 'opacity-100'}`}>
            <table className="min-w-full">
              <thead className="bg-gray-100 border-b sticky top-0">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Date & Time</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">User Name</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Email</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Role</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Activity Type</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Details</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="8" className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center justify-center gap-4">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                        <p className="text-gray-600 font-medium">Loading activities...</p>
                      </div>
                    </td>
                  </tr>
                ) : activities.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="px-6 py-8 text-center text-gray-600">No activities found</td>
                  </tr>
                ) : (
                  activities.map((activity, idx) => (
                    <tr key={idx} className="border-b hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-3 text-sm text-gray-900">{formatDateTime(activity.created_at)}</td>
                      <td className="px-6 py-3 text-sm text-gray-900">{activity.full_name}</td>
                      <td className="px-6 py-3 text-sm text-gray-600">{activity.email}</td>
                      <td className="px-6 py-3 text-sm">
                        <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                          {activity.role}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-sm">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getActivityTypeColor(activity.activity_type)}`}>
                          {activity.activity_type}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-sm text-gray-600 max-w-xs truncate">{activity.details}</td>
                      <td className={`px-6 py-3 text-sm font-semibold ${getStatusColor(activity.status)}`}>
                        {activity.status}
                      </td>
                      <td className="px-6 py-3 text-sm">
                        <button 
                          onClick={() => handleViewDetails(activity)} 
                          className="text-blue-600 hover:text-blue-800 transition-colors font-medium"
                        >
                          <FaEye className="inline mr-1" /> View
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-8 flex items-center justify-between bg-white rounded-lg shadow p-6 border-t-4 border-blue-500">
              <button
                onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1 || loading}
                className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed transition-all font-semibold shadow-md hover:shadow-lg"
              >
                ← Previous
              </button>
              
              <div className="flex flex-col items-center gap-2">
                <span className="text-lg font-bold text-gray-800">
                  Page <span className="text-blue-600">{currentPage}</span> of <span className="text-blue-600">{totalPages}</span>
                </span>
                <div className="flex gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const pageNum = currentPage > 3 ? currentPage - 2 + i : i + 1;
                    if (pageNum > totalPages) return null;
                    return (
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        disabled={loading}
                        className={`px-3 py-1 rounded text-sm font-medium transition-all ${
                          pageNum === currentPage
                            ? 'bg-blue-600 text-white shadow-md'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
              </div>

              <button
                onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages || loading}
                className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed transition-all font-semibold shadow-md hover:shadow-lg"
              >
                Next →
              </button>
            </div>
          )}

          {/* Details Modal - Modern Design */}
          {detailsModal && selectedActivity && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-fadeIn">
              <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden animate-slideUp relative shadow-2xl flex flex-col">
                {/* Header with gradient background */}
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-6 text-white rounded-t-2xl flex items-start justify-between relative">
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold">Activity Details</h2>
                    <p className="text-blue-100 text-sm mt-1">
                      {selectedActivity.activity_type || 'Activity'} • {formatDateTime(selectedActivity.created_at)}
                    </p>
                  </div>
                  <div className="flex items-center gap-4 ml-4">
                    <div className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap ${
                      selectedActivity.activity_type === 'User Registered'
                        ? // ✅ For User Registered, use verification_status
                          selectedActivity.verification_status === 'pending'
                            ? 'bg-yellow-400 text-yellow-900'
                            : selectedActivity.verification_status === 'approved'
                            ? 'bg-green-400 text-green-900'
                            : 'bg-red-400 text-red-900'
                        : // For other activities, use status
                          selectedActivity.status === 'pending' || selectedActivity.status === 'Pending'
                          ? 'bg-yellow-400 text-yellow-900'
                          : selectedActivity.status === 'completed' || selectedActivity.status === 'Active' || selectedActivity.status === 'approved'
                          ? 'bg-green-400 text-green-900'
                          : 'bg-red-400 text-red-900'
                    }`}>
                      {selectedActivity.activity_type === 'User Registered' 
                        ? selectedActivity.verification_status 
                        : selectedActivity.status}
                    </div>
                    <button
                      onClick={() => {
                        setDetailsModal(false);
                        setImagePreview(null);
                        setSelectedViolationType('minor');
                      }}
                      className="text-white hover:text-gray-200 hover:bg-white/20 transition-all p-2 rounded-lg w-10 h-10 flex items-center justify-center flex-shrink-0"
                    >
                      <XMarkIcon className="w-6 h-6" />
                    </button>
                  </div>
                </div>

                {/* Content */}
                <div className="overflow-y-auto flex-1 p-8">
                  {/* Transaction Type - Special Layout */}
                  {selectedActivity.activity_type === 'Transaction' && (
                    <>
                      {/* Requester and Provider Info */}
                      <div className="mb-8">
                        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                          <div className="w-1 h-6 bg-blue-600 rounded"></div>
                          Transaction Parties
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Requester Card */}
                          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
                            <h4 className="text-sm font-semibold text-blue-900 mb-3">📝 REQUESTER (Learner)</h4>
                            {renderDetailCard(<FaUser className="text-blue-600" />, 'Name', selectedActivity.requester_name, true)}
                            <div className="mt-2">
                              {renderDetailCard(<FaEnvelope className="text-blue-600" />, 'Email', selectedActivity.requester_email, true)}
                            </div>
                            <div className="mt-2">
                              {renderDetailCard(<FaBriefcase className="text-blue-600" />, 'Role', selectedActivity.requester_role, true, true)}
                            </div>
                          </div>

                          {/* Provider Card */}
                          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border border-green-200">
                            <h4 className="text-sm font-semibold text-green-900 mb-3">👨‍🏫 PROVIDER (Tutor)</h4>
                            {renderDetailCard(<FaUser className="text-green-600" />, 'Name', selectedActivity.provider_name, true)}
                            <div className="mt-2">
                              {renderDetailCard(<FaEnvelope className="text-green-600" />, 'Email', selectedActivity.provider_email, true)}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Service Details */}
                      <div className="mb-8">
                        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                          <div className="w-1 h-6 bg-indigo-600 rounded"></div>
                          Service Details
                        </h3>
                        <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-xl p-6 border border-indigo-200">
                          <div className="mb-4">
                            {renderDetailCard(<FaTag className="text-indigo-600" />, 'Service Title', selectedActivity.service_title, true)}
                          </div>
                          <div className="mb-4">
                            <div className="p-4 rounded-lg bg-white border-2 border-indigo-200">
                              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">📝 Description</p>
                              <p className="text-sm text-gray-900 leading-relaxed">{selectedActivity.service_description || 'N/A'}</p>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            {renderDetailCard(<FaTag className="text-indigo-600" />, 'Price', `SC ${selectedActivity.service_price}`, true)}
                            {(selectedActivity.status === 'completed' || selectedActivity.status === 'Completed') && (
                              renderDetailCard(<FaTag className="text-indigo-600" />, 'Amount Paid', `SC ${selectedActivity.amount}`, true)
                            )}
                          </div>
                        </div>
                      </div>
                    </>
                  )}

                  {/* ✅ SERVICE CREATED DETAILS - NO ACTION BUTTONS */}
                  {selectedActivity.activity_type === 'Service Created' && (
                    <>
                      <div className="mb-8">
                        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                          <div className="w-1 h-6 bg-blue-600 rounded"></div>
                          Creator Information
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {renderDetailCard(<FaUser className="text-blue-600" />, 'Name', selectedActivity.full_name, true)}
                          {renderDetailCard(<FaEnvelope className="text-blue-600" />, 'Email', selectedActivity.email, true)}
                          {renderDetailCard(<FaBriefcase className="text-blue-600" />, 'Role', selectedActivity.role, true, true)}
                        </div>
                      </div>

                      <div className="mb-8">
                        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                          <div className="w-1 h-6 bg-indigo-600 rounded"></div>
                          Service Information
                        </h3>
                        <div className="space-y-4">
                          {renderDetailCard(<FaTag className="text-indigo-600" />, 'Service Title', selectedActivity.title, true)}
                          <div className="p-4 rounded-lg bg-indigo-50 border-2 border-indigo-200">
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">📝 Description</p>
                            <p className="text-sm text-gray-900 leading-relaxed">{selectedActivity.description || 'N/A'}</p>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            {renderDetailCard(<FaTag className="text-indigo-600" />, 'Price', `SC ${selectedActivity.price}`, true)}
                            {renderDetailCard(<FaCheckCircle className="text-indigo-600" />, 'Status', selectedActivity.status, true, true)}
                          </div>
                        </div>
                      </div>

                      {/* ℹ️ INFO MESSAGE - No actions needed */}
                      <div className="mt-6 p-4 bg-blue-50 rounded-lg border-2 border-blue-200">
                        <p className="text-sm text-blue-700">
                          <span className="font-semibold">ℹ️ Info:</span> This service was created by the user and does not require admin approval. It is automatically listed in the marketplace.
                        </p>
                      </div>
                    </>
                  )}

                  {/* ✅ WALLET REQUEST DETAILS */}
                  {selectedActivity.activity_type === 'Wallet Request' && (
                    <>
                      <div className="mb-8">
                        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                          <div className="w-1 h-6 bg-yellow-600 rounded"></div>
                          User Information
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {renderDetailCard(<FaUser className="text-yellow-600" />, 'Name', selectedActivity.full_name, true)}
                          {renderDetailCard(<FaEnvelope className="text-yellow-600" />, 'Email', selectedActivity.email, true)}
                          {renderDetailCard(<FaBriefcase className="text-yellow-600" />, 'Role', selectedActivity.role, true, true)}
                        </div>
                      </div>

                      <div className="mb-8">
                        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                          <div className="w-1 h-6 bg-yellow-600 rounded"></div>
                          Transaction Details
                        </h3>
                        <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl p-6 border border-yellow-200">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div>
                              {renderDetailCard(
                                <FaWallet className="text-yellow-600" />, 
                                'Transaction Type', 
                                selectedActivity.type && selectedActivity.type.trim() 
                                  ? (selectedActivity.type.toLowerCase() === 'top-up' ? '💰 Top-Up' : '💸 Cash Out') 
                                  : 'N/A', 
                                true, 
                                true
                              )}
                            </div>
                            {renderDetailCard(<FaTag className="text-yellow-600" />, 'Amount', `SC ${selectedActivity.amount}`, true)}
                          </div>

                          {selectedActivity.type && selectedActivity.type.toLowerCase() === 'top-up' && (
                            <div className="mb-4">
                              {renderDetailCard(<FaTag className="text-yellow-600" />, 'Reference Number', selectedActivity.reference_number || 'N/A', true)}
                            </div>
                          )}

                          {selectedActivity.type && selectedActivity.type.toLowerCase() === 'cash-out' && (
                            <div className="mb-4">
                              {renderDetailCard(<FaTag className="text-yellow-600" />, 'Reference Number', selectedActivity.reference_number || 'N/A', true)}
                            </div>
                          )}

                          {selectedActivity.type && selectedActivity.type.toLowerCase() === 'top-up' && selectedActivity.proof_image && selectedActivity.proof_image.trim() !== '' && selectedActivity.proof_image.toLowerCase() !== 'null' && (
                            <div className="mb-4">
                              <div className="p-4 rounded-lg bg-white border-2 border-yellow-200">
                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">📸 Payment Proof</p>
                                <button
                                  onClick={() => setImagePreview(selectedActivity.proof_image)}
                                  className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg font-medium transition-colors"
                                >
                                  <FaImage className="text-lg" />
                                  View Image
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="mb-8">
                        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                          <div className="w-1 h-6 bg-yellow-600 rounded"></div>
                          Status & Timeline
                        </h3>
                        <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl p-6 border border-yellow-200">
                          <div className="grid grid-cols-2 gap-4">
                            {renderDetailCard(<FaCheckCircle className="text-yellow-600" />, 'Status', selectedActivity.status, true, true)}
                            {renderDetailCard(<FaClock className="text-yellow-600" />, 'Created At', formatDateTime(selectedActivity.created_at), true)}
                          </div>
                        </div>
                      </div>

                      {/* ✅ WALLET REQUEST ACTION BUTTONS */}
                      {(selectedActivity.status === 'pending' || selectedActivity.status === 'Pending') && (
                        <div className="flex space-x-4 mt-6 pt-6 border-t border-gray-200">
                          {selectedActivity.type && selectedActivity.type.toLowerCase() === 'top-up' ? (
                          <>
                            <button
                              onClick={() => handleWalletRequestUpdate('approved')}
                              className="flex-1 bg-green-500 text-white py-2 rounded-lg hover:bg-green-600 transition-colors font-medium"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleWalletRequestUpdate('rejected')}
                              className="flex-1 bg-red-500 text-white py-2 rounded-lg hover:bg-red-600 transition-colors font-medium"
                            >
                              Reject
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => handleWalletRequestUpdate('completed')}
                            className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition-colors font-medium"
                          >
                            Mark as Complete
                          </button>
                          )}
                        </div>
                      )}
                    </>
                  )}

                  {/* ✅ REPORT SUBMITTED DETAILS WITH VIOLATION TYPE SELECTOR */}
                  {selectedActivity.activity_type === 'Report Submitted' && (
                    <>
                      <div className="mb-8">
                        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                          <div className="w-1 h-6 bg-red-600 rounded"></div>
                          Reporter Information
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {renderDetailCard(<FaUser className="text-red-600" />, 'Name', selectedActivity.reporter_name, true)}
                          {renderDetailCard(<FaEnvelope className="text-red-600" />, 'Email', selectedActivity.reporter_email, true)}
                        </div>
                      </div>

                      <div className="mb-8">
                        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                          <div className="w-1 h-6 bg-red-600 rounded"></div>
                          Reported User Information
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {renderDetailCard(<FaUser className="text-red-600" />, 'Name', selectedActivity.reported_user_name, true)}
                          {renderDetailCard(<FaEnvelope className="text-red-600" />, 'Email', selectedActivity.reported_user_email, true)}
                        </div>
                      </div>

                      <div className="mb-8">
                        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                          <div className="w-1 h-6 bg-red-600 rounded"></div>
                          Report Details
                        </h3>
                        <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-6 border border-red-200">
                          <div className="mb-4">
                            {renderDetailCard(<FaTag className="text-red-600" />, 'Reason', selectedActivity.reason, true)}
                          </div>
                          <div className="mb-4">
                            <div className="p-4 rounded-lg bg-white border-2 border-red-200">
                              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">📝 Description</p>
                              <p className="text-sm text-gray-900 leading-relaxed">{selectedActivity.description || 'N/A'}</p>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            {renderDetailCard(<FaCheckCircle className="text-red-600" />, 'Status', selectedActivity.status, true, true)}
                            {renderDetailCard(<FaClock className="text-red-600" />, 'Created At', formatDateTime(selectedActivity.created_at), true)}
                          </div>
                        </div>
                      </div>

                      {/* ✅ VIOLATION TYPE SELECTOR - SAME AS USER_REPORTS.JSX */}
                      {(selectedActivity.status === 'pending' || selectedActivity.status === 'Pending') && (
                        <>
                          <div className="mb-8">
                            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                              <div className="w-1 h-6 bg-orange-600 rounded"></div>
                              Select Violation Type
                            </h3>
                            <div className="grid grid-cols-3 gap-3 mb-4">
                              {Object.keys(violationTypes).map(type => (
                                <button
                                  key={type}
                                  onClick={() => setSelectedViolationType(type)}
                                  className={`p-3 rounded-lg border-2 transition-all capitalize font-medium text-sm ${
                                    selectedViolationType === type
                                      ? 'border-blue-500 bg-blue-50 text-blue-600'
                                      : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                                  }`}
                                >
                                  {type}
                                </button>
                              ))}
                            </div>

                            {/* Subcategories Display */}
                            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                              <h5 className="text-sm font-medium text-gray-700 mb-3">Subcategories:</h5>
                              <div className="flex flex-wrap gap-2">
                                {violationTypes[selectedViolationType]?.map(subType => (
                                  <span 
                                    key={subType} 
                                    className="px-3 py-1 bg-white border border-gray-300 rounded-full text-xs font-medium text-gray-700"
                                  >
                                    {subType.replace(/_/g, ' ')}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>

                          {/* ✅ REPORT ACTION BUTTONS - SAME AS USER_REPORTS.JSX */}
                          <div className="flex space-x-3 mt-6 pt-6 border-t border-gray-200">
                            <button
                              onClick={() => handleReportUpdate(selectedActivity.id, 'invalid', selectedViolationType)}
                              className="flex-1 px-4 py-3 text-gray-600 border-2 border-gray-300 rounded-lg hover:bg-gray-50 font-medium transition-colors"
                            >
                              Mark Invalid
                            </button>
                            <button
                              onClick={() => handleReportUpdate(selectedActivity.id, 'warning', selectedViolationType)}
                              className="flex-1 bg-yellow-500 text-white py-3 rounded-lg hover:bg-yellow-600 transition-colors font-medium"
                            >
                              Issue Warning
                            </button>
                            <button
                              onClick={() => handleReportUpdate(selectedActivity.id, 'suspended', selectedViolationType)}
                              className="flex-1 bg-red-500 text-white py-3 rounded-lg hover:bg-red-600 transition-colors font-medium"
                            >
                              Suspend User
                            </button>
                          </div>
                        </>
                      )}

                      {/* Show resolved state */}
                      {selectedActivity.status && selectedActivity.status !== 'pending' && selectedActivity.status !== 'Pending' && (
                        <div className="mt-6 p-4 bg-green-50 rounded-lg border-2 border-green-200">
                          <h4 className="font-medium text-green-900 mb-2">Resolution Details</h4>
                          <p className="text-sm text-green-700">
                            Status: <span className="font-semibold capitalize">{selectedActivity.status}</span>
                          </p>
                          {selectedActivity.violationType && (
                            <p className="text-sm text-green-700 mt-1">
                              Violation Type: <span className="font-semibold capitalize">{selectedActivity.violationType}</span>
                            </p>
                          )}
                        </div>
                      )}
                    </>
                  )}

                {/* ✅ USER REGISTERED DETAILS */}
                {selectedActivity.activity_type === 'User Registered' && (
                  <>
                    <div className="mb-8">
                      <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <div className="w-1 h-6 bg-purple-600 rounded"></div>
                        User Information
                      </h3>
                      <div className="grid grid-cols-1 gap-4">
                        {renderDetailCard(<FaUser className="text-purple-600" />, 'Full Name', selectedActivity.full_name, true)}
                        {renderDetailCard(<FaEnvelope className="text-purple-600" />, 'Email', selectedActivity.email, true)}
                        {renderDetailCard(<FaBriefcase className="text-purple-600" />, 'Role', selectedActivity.role, true, true)}
                      </div>
                    </div>

                    <div className="mb-8">
                      <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <div className="w-1 h-6 bg-purple-600 rounded"></div>
                        Academic Information
                      </h3>
                      <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-200">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          {renderDetailCard(<FaTag className="text-purple-600" />, 'Course', selectedActivity.course, true)}
                          {renderDetailCard(<FaTag className="text-purple-600" />, 'Year Level', selectedActivity.year, true)}
                        </div>
                        <div className="grid grid-cols-1 gap-4">
                          {renderDetailCard(<FaClock className="text-purple-600" />, 'Joined', formatDateTime(selectedActivity.created_at), true)}
                        </div>
                      </div>
                    </div>

                    {/* ✅ SINGLE VERIFICATION STATUS SECTION - DISPLAYS ONLY WHEN NOT PENDING */}
                    {selectedActivity.verification_status && selectedActivity.verification_status !== 'pending' && (
                      <div className={`mb-8 p-6 rounded-xl border-2 ${
                        selectedActivity.verification_status === 'approved' 
                          ? 'bg-green-50 border-green-200' 
                          : 'bg-red-50 border-red-200'
                      }`}>
                        <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
                          <div className={`w-1 h-6 rounded ${selectedActivity.verification_status === 'approved' ? 'bg-green-600' : 'bg-red-600'}`}></div>
                          <span className={selectedActivity.verification_status === 'approved' ? 'text-green-900' : 'text-red-900'}>
                            Verification Status
                          </span>
                        </h3>
                        <p className={`text-sm font-semibold ${
                          selectedActivity.verification_status === 'approved' 
                            ? 'text-green-700' 
                            : 'text-red-700'
                        }`}>
                          Status: <span className="capitalize">{selectedActivity.verification_status}</span>
                        </p>
                      </div>
                    )}

                    {/* ✅ USER VERIFICATION ACTION BUTTONS - Only show when pending */}
                    {selectedActivity.verification_status && selectedActivity.verification_status === 'pending' && (
                      <>
                        <div className="mb-8 p-6 rounded-xl bg-yellow-50 border-2 border-yellow-200">
                          <h3 className="text-lg font-bold text-yellow-900 mb-4 flex items-center gap-2">
                            <div className="w-1 h-6 bg-yellow-600 rounded"></div>
                            Pending Verification
                          </h3>
                          <p className="text-sm text-yellow-700 mb-6">
                            This user account is awaiting admin verification. Review the information and approve or reject the registration.
                          </p>
                        </div>

                        <div className="flex gap-4 mt-6 pt-6 border-t border-gray-200">
                          <button
                            onClick={() => handleUserVerification(selectedActivity.id, 'approved')}
                            className="flex-1 bg-green-500 text-white py-3 rounded-lg hover:bg-green-600 transition-colors font-medium flex items-center justify-center space-x-2"
                          >
                            <FaCheck className="text-lg" />
                            <span>Approve</span>
                          </button>
                          <button
                            onClick={() => handleUserVerification(selectedActivity.id, 'rejected')}
                            className="flex-1 bg-red-500 text-white py-3 rounded-lg hover:bg-red-600 transition-colors font-medium flex items-center justify-center space-x-2"
                          >
                            <FaTimes className="text-lg" />
                            <span>Reject</span>
                          </button>
                        </div>
                      </>
                    )}
                  </>
                )}

                  {/* Timestamp */}
                  <div className="pt-6 border-t border-gray-200 flex items-center justify-between">
                    <p className="text-xs text-gray-500">
                      Last updated: {formatDateTime(selectedActivity.created_at)}
                    </p>
                    <p className="text-xs text-gray-500">
                      Activity ID: <span className="font-mono text-gray-700 font-semibold">{selectedActivity.id}</span>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Image Preview Modal */}
          {imagePreview && (
            <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50 animate-fadeIn">
              <div className="relative max-w-2xl w-full">
                <button
                  onClick={() => setImagePreview(null)}
                  className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors z-10 p-2 hover:bg-black/30 rounded-lg"
                >
                  <XMarkIcon className="w-8 h-8" />
                </button>
                <img 
                  src={imagePreview} 
                  alt="Payment Proof" 
                  className="w-full h-auto rounded-lg shadow-2xl max-h-[80vh] object-contain"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
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

        .animate-fadeIn {
          animation: fadeIn 0.3s ease-in-out;
        }

        .animate-slideUp {
          animation: slideUp 0.3s ease-in-out;
        }
      `}</style>
    </div>
  );
};

export default Admin_Dashboard;