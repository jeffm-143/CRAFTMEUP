import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  MagnifyingGlassIcon,
  ClockIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  XMarkIcon,
  CheckCircleIcon,
  ExclamationIcon,
  ShieldExclamationIcon,
} from "@heroicons/react/24/outline";
import AdminSidebar from "../../AdminSidebar";
import { getAllReports, updateReportStatus, getUserReportHistory, notifyUser } from "../../../services/api";

const ReportDetailModal = ({ selectedReport, onClose, reportHistory, onResolve, violationTypes, getStatusBadgeClass }) => {
  const [selectedViolationType, setSelectedViolationType] = useState(selectedReport?.violationType || 'minor');
  
  if (!selectedReport) return null;

  const isResolved = selectedReport.status && selectedReport.status !== 'pending' && selectedReport.status !== null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden animate-slideUp flex flex-col">
        {/* Header with gradient */}
        <div className="bg-gradient-to-r from-red-600 to-red-700 px-8 py-6 text-white flex items-start justify-between">
          <div>
            <h3 className="text-2xl font-bold">Report Details</h3>
            <p className="text-red-100 text-sm mt-1">Review and take action</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1 p-8 space-y-6">
          {/* Reporter & Reported User */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-5 border border-blue-200">
              <h4 className="font-bold text-blue-900 mb-3 flex items-center gap-2">
                <div className="w-1 h-5 bg-blue-600 rounded"></div>
                Reporter
              </h4>
              <p className="font-semibold text-gray-900">{selectedReport.reporter_name}</p>
              <p className="text-sm text-gray-600 mt-1">ID: {selectedReport.reporter_id}</p>
            </div>

            <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-5 border border-red-200">
              <h4 className="font-bold text-red-900 mb-3 flex items-center gap-2">
                <div className="w-1 h-5 bg-red-600 rounded"></div>
                Reported User
              </h4>
              <p className="font-semibold text-gray-900">{selectedReport.reported_user_name}</p>
              <p className="text-sm text-gray-600 mt-1">ID: {selectedReport.reported_user_id}</p>
            </div>
          </div>

          {/* Report Details */}
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
              <h4 className="font-bold text-gray-900 mb-2">Report Reason</h4>
              <p className="text-gray-700 font-medium">{selectedReport.reason}</p>
            </div>

            {selectedReport.description && (
              <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                <h4 className="font-bold text-gray-900 mb-2">Description</h4>
                <p className="text-gray-700 text-sm leading-relaxed">{selectedReport.description}</p>
              </div>
            )}
          </div>

          {/* Violation Type Selector */}
          {!isResolved && (
            <div className="space-y-4">
              <div>
                <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <ShieldExclamationIcon className="w-5 h-5 text-orange-600" />
                  Select Violation Type
                </h4>
                <div className="grid grid-cols-3 gap-3">
                  {Object.keys(violationTypes).map(type => (
                    <button
                      key={type}
                      onClick={() => setSelectedViolationType(type)}
                      className={`p-4 rounded-lg border-2 transition-all capitalize font-semibold text-sm ${
                        selectedViolationType === type
                          ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-md'
                          : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              {/* Subcategories */}
              <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-5 border border-orange-200">
                <h5 className="font-semibold text-orange-900 mb-3">Subcategories:</h5>
                <div className="flex flex-wrap gap-2">
                  {violationTypes[selectedViolationType]?.map(subType => (
                    <span 
                      key={subType} 
                      className="px-3 py-1 bg-white border border-orange-300 rounded-full text-xs font-medium text-orange-700"
                    >
                      {subType.replace('_', ' ')}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Display Violation Type if Resolved */}
          {isResolved && (
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-5 border border-green-200">
              <h4 className="font-bold text-green-900 mb-3 flex items-center gap-2">
                <CheckCircleIcon className="w-5 h-5 text-green-600" />
                Violation Type
              </h4>
              <p className="text-green-700 font-semibold capitalize mb-3">
                {selectedReport.violationType || 'Not specified'}
              </p>
              <div>
                <h5 className="text-sm font-semibold text-green-900 mb-2">Subcategories:</h5>
                <div className="flex flex-wrap gap-2">
                  {violationTypes[selectedReport.violationType || 'minor']?.map(type => (
                    <span 
                      key={type} 
                      className="px-3 py-1 bg-white border border-green-300 rounded-full text-xs font-medium text-green-700"
                    >
                      {type.replace('_', ' ')}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Resolution Details if Resolved */}
          {isResolved && (
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-5 border border-purple-200">
              <h4 className="font-bold text-purple-900 mb-3">Resolution Details</h4>
              <div className="space-y-2">
                <p className="text-sm text-purple-700">
                  <span className="font-semibold">Status:</span>
                  <span className={`ml-2 px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadgeClass(selectedReport.status)}`}>
                    {selectedReport.status}
                  </span>
                </p>
                <p className="text-sm text-purple-700">
                  <span className="font-semibold">Resolved on:</span> {selectedReport.updated_at ? new Date(selectedReport.updated_at).toLocaleString() : 'Not resolved'}
                </p>
                {selectedReport.adminNotes && (
                  <p className="text-sm text-purple-700">
                    <span className="font-semibold">Notes:</span> {selectedReport.adminNotes}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        {!isResolved && (
          <div className="border-t border-gray-200 bg-gray-50 px-8 py-6 flex gap-3">
            <button
              onClick={() => onResolve(selectedReport.id, 'invalid', selectedViolationType)}
              className="flex-1 px-4 py-3 text-gray-700 border-2 border-gray-300 rounded-lg hover:bg-gray-100 font-semibold transition-all"
            >
              Mark Invalid
            </button>
            <button
              onClick={() => onResolve(selectedReport.id, 'warning', selectedViolationType)}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-yellow-500 to-yellow-600 text-white rounded-lg hover:from-yellow-600 hover:to-yellow-700 font-semibold shadow-md transition-all"
            >
              Issue Warning
            </button>
            <button
              onClick={() => onResolve(selectedReport.id, 'suspended', selectedViolationType)}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 font-semibold shadow-md transition-all"
            >
              Suspend User
            </button>
          </div>
        )}
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
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
        .animate-fadeIn { animation: fadeIn 0.3s ease-in-out; }
        .animate-slideUp { animation: slideUp 0.3s ease-in-out; }
      `}</style>
    </div>
  );
};

export default function UserReports() {
  const [selectedReport, setSelectedReport] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [reportHistory, setReportHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [reports, setReports] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    resolved: 0,
    thisWeek: 0
  });

  const violationTypes = {
    minor: ['spam', 'rude_message', 'irrelevant_post'],
    serious: ['harassment', 'scamming', 'fake_credentials', 'offensive_behavior'],
    abuse: ['fake_account', 'coin_misuse', 'credit_abuse']
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      setIsLoading(true);
      const response = await getAllReports();
      console.log('Reports response:', response);
      
      setReports(response);
      
      const pending = response.filter(r => !r.status || r.status === 'pending').length;
      const resolved = response.filter(r => r.status && r.status !== 'pending').length;
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      const thisWeek = response.filter(r => new Date(r.created_at) > oneWeekAgo).length;

      setStats({
        total: response.length,
        pending,
        resolved,
        thisWeek
      });
    } catch (error) {
      console.error('Error fetching reports:', error);
      setReports([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewDetails = async (report) => {
    try {
      console.log('Opening modal for report:', report);
      setSelectedReport(report);
      setShowDetailModal(true);
    } catch (error) {
      console.error('Error showing report details:', error);
    }
  };

  const handleResolveReport = async (reportId, resolution, violationType = 'minor') => {
    try {
      console.log('Resolving report:', { reportId, resolution, violationType });

      const statusData = {
        status: resolution,
        violationType: violationType || 'minor',
        adminNotes: resolution === 'invalid' 
          ? 'No violation found' 
          : `${violationType} violation confirmed - ${resolution} action taken`,
        resolvedAt: new Date().toISOString()
      };

      console.log('📝 Sending status data:', statusData);

      await updateReportStatus(reportId, statusData);

      const notifications = [
        notifyUser(selectedReport.reporter_id, {
          type: 'report_resolved',
          message: `Your report has been reviewed and marked as ${resolution}.`
        })
      ];

      if (resolution !== 'invalid') {
        notifications.push(
          notifyUser(selectedReport.reported_user_id, {
            type: resolution,
            message: `Your account has received a ${resolution} due to ${violationType} violation.`
          })
        );
      }

      await Promise.all(notifications);

      setShowDetailModal(false);
      await fetchReports();
      
      alert(`✅ Report has been marked as ${resolution}`);
      
    } catch (error) {
      console.error('❌ Error resolving report:', error);
      alert('Failed to resolve report. Please try again.');
    }
  };

  const getStatusBadgeClass = (status) => {
    switch(status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-700 font-semibold';
      case 'invalid':
        return 'bg-gray-100 text-gray-700 font-semibold';
      case 'warning':
        return 'bg-orange-100 text-orange-700 font-semibold';
      case 'suspended':
        return 'bg-red-100 text-red-700 font-semibold';
      default:
        return 'bg-gray-100 text-gray-700 font-semibold';
    }
  };

  const filteredReports = reports.filter(report => {
    const matchesSearch = 
      report.reported_user_name?.toLowerCase().includes(search.toLowerCase()) ||
      report.reporter_name?.toLowerCase().includes(search.toLowerCase()) ||
      report.reason?.toLowerCase().includes(search.toLowerCase()) ||
      report.description?.toLowerCase().includes(search.toLowerCase());

    const isPending = !report.status || report.status === 'pending';
    const isResolved = report.status && report.status !== 'pending';

    const matchesFilter = showHistory ? isResolved : isPending;

    return matchesSearch && matchesFilter;
  });

  // Pagination calculations
  const totalPages = Math.ceil(filteredReports.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentReports = filteredReports.slice(indexOfFirstItem, indexOfLastItem);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, showHistory]);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  // Generate page numbers to display
  const getPageNumbers = () => {
    const pages = [];
    const maxPagesToShow = 5;
    
    if (totalPages <= maxPagesToShow) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push('...');
        pages.push(currentPage - 1);
        pages.push(currentPage);
        pages.push(currentPage + 1);
        pages.push('...');
        pages.push(totalPages);
      }
    }
    
    return pages;
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-50 to-white">
      {/* Sidebar */}
      <AdminSidebar />

      {/* Main Content */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-white border-b shadow-sm">
          <div className="flex items-center justify-between px-8 py-6">
            <div>
              <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-red-600 to-red-700">
                User Reports
              </h2>
              <p className="text-gray-500 text-sm mt-1">Manage and resolve community reports</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8 space-y-8">
          {/* Stats Cards */}
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-blue-600 text-sm font-semibold uppercase tracking-wide">Total Reports</p>
                  <p className="text-3xl font-bold text-blue-900 mt-2">{stats.total}</p>
                </div>
                <div className="w-12 h-12 bg-blue-200 rounded-lg flex items-center justify-center text-blue-600 text-xl">
                  📋
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl p-6 border border-yellow-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-yellow-600 text-sm font-semibold uppercase tracking-wide">Pending</p>
                  <p className="text-3xl font-bold text-yellow-900 mt-2">{stats.pending}</p>
                </div>
                <div className="w-12 h-12 bg-yellow-200 rounded-lg flex items-center justify-center text-yellow-600 text-xl">
                  ⏳
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-green-600 text-sm font-semibold uppercase tracking-wide">Resolved</p>
                  <p className="text-3xl font-bold text-green-900 mt-2">{stats.resolved}</p>
                </div>
                <div className="w-12 h-12 bg-green-200 rounded-lg flex items-center justify-center text-green-600 text-xl">
                  ✓
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-purple-600 text-sm font-semibold uppercase tracking-wide">This Week</p>
                  <p className="text-3xl font-bold text-purple-900 mt-2">{stats.thisWeek}</p>
                </div>
                <div className="w-12 h-12 bg-purple-200 rounded-lg flex items-center justify-center text-purple-600 text-xl">
                  📊
                </div>
              </div>
            </div>
          </div>

          {/* Filter & Search */}
          <div className="flex justify-between items-center gap-4 bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <div className="relative flex-1 max-w-sm">
              <MagnifyingGlassIcon className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by reported user, reporter, or reason..."
                className="pl-10 pr-4 py-2.5 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
            </div>

            {/* Status Filters */}
            <div className="flex gap-2">
              <button
                onClick={() => setShowHistory(false)}
                className={`px-4 py-2.5 rounded-lg font-semibold transition-all flex items-center gap-2 ${
                  !showHistory 
                    ? 'bg-yellow-500 text-white shadow-md' 
                    : 'bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200'
                }`}
              >
                <span className="text-lg">⏳</span> Pending
              </button>
              <button
                onClick={() => setShowHistory(true)}
                className={`px-4 py-2.5 rounded-lg font-semibold transition-all flex items-center gap-2 ${
                  showHistory 
                    ? 'bg-green-500 text-white shadow-md' 
                    : 'bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200'
                }`}
              >
                <span className="text-lg">✓</span> Resolved
              </button>
            </div>
          </div>

          {/* Reports Table */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden" style={{ maxHeight: '500px' }}>
            {isLoading ? (
              <div className="text-center py-16">
                <div className="inline-flex items-center gap-3">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
                  <span className="text-gray-600 font-medium">Loading reports...</span>
                </div>
              </div>
            ) : filteredReports.length === 0 ? (
              <div className="text-center py-16">
                <div className="text-5xl mb-4">📭</div>
                <p className="text-gray-600 font-medium">No reports found</p>
              </div>
            ) : (
              <div className="overflow-x-auto overflow-y-auto" style={{ maxHeight: '500px' }}>
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Reported User</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Reporter</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Reason</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {currentReports.map((report) => (
                      <tr key={report.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <p className="font-semibold text-gray-900">{report.reported_user_name}</p>
                          <p className="text-xs text-gray-500 mt-0.5">ID: {report.reported_user_id}</p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="font-semibold text-gray-900">{report.reporter_name}</p>
                          <p className="text-xs text-gray-500 mt-0.5">ID: {report.reporter_id}</p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-gray-900">{report.reason}</p>
                          {report.description && (
                            <p className="text-xs text-gray-500 truncate max-w-xs mt-0.5">
                              {report.description}
                            </p>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {new Date(report.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-block px-3 py-1.5 rounded-full text-xs font-bold ${
                              getStatusBadgeClass(report.status)
                            }`}
                          >
                            {report.status || 'pending'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button 
                            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-red-500 to-red-600 rounded-lg hover:from-red-600 hover:to-red-700 transition-all shadow-sm hover:shadow-md"
                            onClick={() => handleViewDetails(report)}
                          >
                            View Details
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Pagination */}
          {filteredReports.length > 0 && totalPages > 1 && (
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <p className="text-sm text-gray-600 font-medium text-center mb-4">
                Showing <span className="font-bold">{indexOfFirstItem + 1}</span> to <span className="font-bold">{Math.min(indexOfLastItem, filteredReports.length)}</span> of <span className="font-bold">{filteredReports.length}</span> reports
              </p>
              <div className="flex justify-center gap-2">
                <button 
                  onClick={handlePrevPage}
                  className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={currentPage === 1}
                >
                  <ChevronLeftIcon className="h-5 w-5 text-gray-600" />
                </button>
                
                {getPageNumbers().map((page, index) => (
                  page === '...' ? (
                    <span key={`ellipsis-${index}`} className="px-4 py-2 text-gray-400">...</span>
                  ) : (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      className={`min-w-[40px] px-4 py-2 border border-gray-300 rounded-lg font-semibold transition-all ${
                        currentPage === page
                          ? 'bg-red-600 text-white hover:bg-red-700 shadow-sm'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  )
                ))}
                
                <button 
                  onClick={handleNextPage}
                  className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={currentPage === totalPages}
                >
                  <ChevronRightIcon className="h-5 w-5 text-gray-600" />
                </button>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Report Detail Modal */}
      {showDetailModal && (
        <ReportDetailModal
          selectedReport={selectedReport}
          onClose={() => setShowDetailModal(false)}
          onResolve={handleResolveReport}
          violationTypes={violationTypes}
          getStatusBadgeClass={getStatusBadgeClass}
        />
      )}
    </div>
  );
}