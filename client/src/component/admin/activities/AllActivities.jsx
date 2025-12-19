import React, { useState, useEffect } from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { api } from '../../../services/api';

export default function AllActivitiesModal({ isOpen, onClose }) {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filterType, setFilterType] = useState('all');

  useEffect(() => {
    if (isOpen) {
      fetchActivities(1);
    }
  }, [isOpen, filterType]);

  const fetchActivities = async (pageNum) => {
    try {
      setLoading(true);
      const response = await api.get('/admin/activities', {
        params: {
          page: pageNum,
          limit: 20,
          filterType: filterType
        }
      });
      
      setActivities(response.data.data || []);
      setTotalPages(response.data.pagination?.totalPages || 1);
      setPage(pageNum);
    } catch (error) {
      console.error('Error fetching activities:', error);
      setActivities([]);
    } finally {
      setLoading(false);
    }
  };

  const getActivityColor = (type) => {
    const colors = {
      'Class Created': 'bg-blue-50 text-blue-700 border-blue-200',
      'Transaction': 'bg-green-50 text-green-700 border-green-200',
      'Wallet Request': 'bg-purple-50 text-purple-700 border-purple-200',
      'Report Submitted': 'bg-red-50 text-red-700 border-red-200',
      'User Registered': 'bg-indigo-50 text-indigo-700 border-indigo-200'
    };
    return colors[type] || 'bg-gray-50 text-gray-700 border-gray-200';
  };

  const getStatusBadge = (status) => {
    const statusColors = {
      'pending': 'bg-yellow-100 text-yellow-800',
      'approved': 'bg-green-100 text-green-800',
      'completed': 'bg-blue-100 text-blue-800',
      'rejected': 'bg-red-100 text-red-800',
      'active': 'bg-green-100 text-green-800',
      'verified': 'bg-green-100 text-green-800'
    };
    return statusColors[status?.toLowerCase()] || 'bg-gray-100 text-gray-800';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 flex items-center justify-between rounded-t-2xl">
          <h2 className="text-2xl font-bold text-white">All Activities</h2>
          <button
            onClick={onClose}
            className="text-white hover:bg-white/10 p-2 rounded-lg transition-colors"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Filter */}
        <div className="p-4 border-b border-gray-200">
          <select
            value={filterType}
            onChange={(e) => {
              setFilterType(e.target.value);
              setPage(1);
            }}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Activities</option>
            <option value="Service Created">Service Created</option>
            <option value="Transaction">Transaction</option>
            <option value="Wallet Request">Wallet Request</option>
            <option value="Report Submitted">Report Submitted</option>
            <option value="User Registered">User Registered</option>
          </select>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-40">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-500">Loading activities...</p>
              </div>
            </div>
          ) : activities.length === 0 ? (
            <div className="flex items-center justify-center h-40">
              <p className="text-gray-500">No activities found</p>
            </div>
          ) : (
            <div className="divide-y">
              {activities.map((activity, index) => (
                <div key={index} className={`p-4 ${getActivityColor(activity.activity_type)} border-l-4`}>
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-lg">{activity.activity_type}</span>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(activity.status)}`}>
                          {activity.status || 'N/A'}
                        </span>
                      </div>
                      <p className="text-sm font-medium">{activity.full_name}</p>
                      <p className="text-xs opacity-75">{activity.email}</p>
                    </div>
                  </div>
                  
                  <div className="mt-2">
                    <p className="text-sm mb-1">{activity.details}</p>
                    {activity.description && (
                      <p className="text-xs opacity-75">Description: {activity.description.substring(0, 100)}</p>
                    )}
                  </div>
                  
                  <p className="text-xs opacity-50 mt-2">
                    {new Date(activity.created_at).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="border-t border-gray-200 p-4 flex items-center justify-center gap-4">
            <button
              onClick={() => fetchActivities(page - 1)}
              disabled={page === 1}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <span className="text-sm text-gray-600">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => fetchActivities(page + 1)}
              disabled={page === totalPages}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}