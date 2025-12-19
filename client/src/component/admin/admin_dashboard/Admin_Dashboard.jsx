import React, { useState, useEffect, useRef } from 'react';
import { FaEye, FaCheck, FaTimes, FaExchangeAlt, FaFileAlt, FaUserPlus, FaWallet, FaUser, FaEnvelope, FaBriefcase, FaTag, FaClock, FaCheckCircle, FaImage, FaMoneyBillWave, FaChartLine, FaDollarSign, FaArrowUp, FaArrowDown } from 'react-icons/fa';
import { 
  XMarkIcon, 
  MagnifyingGlassIcon,
  CheckCircleIcon,
  XCircleIcon
} from "@heroicons/react/24/outline";
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
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, LineElement, PointElement, Filler } from 'chart.js';
import { Pie, Bar, Line } from 'react-chartjs-2';


ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, LineElement, PointElement, Filler);

const Admin_Dashboard = () => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [filterType, setFilterType] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedActivity, setSelectedActivity] = useState(null);
  const isResolved = selectedActivity?.status && 
  selectedActivity.status !== 'pending' && 
  selectedActivity.status !== 'Pending';
  
  const [detailsModal, setDetailsModal] = useState(false);
  const [stats, setStats] = useState(null);
  const [revenueData, setRevenueData] = useState(null); // ✅ NEW STATE FOR REVENUE
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

  // ✅ FETCH REVENUE DATA FUNCTION
  const fetchRevenueData = async () => {
    try {
      const response = await api.get('/transactions/revenue/stats');
      if (response.data.success) {
        setRevenueData(response.data.data);
        console.log('✅ Revenue data fetched:', response.data.data);
      }
    } catch (error) {
      console.error('Error fetching revenue data:', error);
    }
  };

  // --- Chart helpers ---
  const getActivityChartData = () => {
    const labels = stats?.activitiesByType?.map(a => a.activity_type) || [];
    const counts = stats?.activitiesByType?.map(a => parseInt(a.count) || 0) || [];
    const pending = stats?.activitiesByType?.map(a => parseInt(a.pendingCount) || 0) || [];
    return { labels, counts, pending };
  };

  const chartColors = [
    '#3b82f6', // blue
    '#10b981', // green
    '#f59e0b', // amber
    '#ef4444', // red
    '#8b5cf6', // purple
    '#06b6d4', // teal
    '#f97316'  // orange
  ];

  const buildPieData = () => {
    const { labels, counts } = getActivityChartData();
    return {
      labels,
      datasets: [
        {
          data: counts,
          backgroundColor: labels.map((_, i) => chartColors[i % chartColors.length]),
          borderWidth: 2,
          borderColor: '#fff',
          hoverOffset: 8
        }
      ]
    };
  };

  const buildBarData = () => {
    const { labels, counts, pending } = getActivityChartData();
    return {
      labels,
      datasets: [
        {
          label: 'Pending',
          data: pending,
          backgroundColor: 'rgba(251,191,36,0.9)',
          borderRadius: 6,
          borderWidth: 0
        },
        {
          label: 'Total',
          data: counts,
          backgroundColor: 'rgba(59,130,246,0.85)',
          borderRadius: 6,
          borderWidth: 0
        }
      ]
    };
  };

const buildRevenueLineData = () => {
  if (!revenueData?.dailyRevenue || revenueData.dailyRevenue.length === 0) {
    return { 
      labels: ['No Data'], 
      datasets: [{
        label: 'Daily Revenue (SC)',
        data: [0],
        borderColor: 'rgb(34, 197, 94)',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
      }] 
    };
  }
    
  const sortedData = [...revenueData.dailyRevenue]
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .slice(-30);
  
  const labels = sortedData.map(d => {
    const date = new Date(d.date);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  });
  
  const revenues = sortedData.map(d => parseFloat(d.daily_revenue) || 0);

  return {
    labels,
    datasets: [{
      label: 'Daily Revenue (₱)',
      data: revenues,
      borderColor: 'rgb(34, 197, 94)',
      backgroundColor: 'rgba(34, 197, 94, 0.2)',
      tension: 0.3,
      fill: true,
      pointRadius: 5,
      pointHoverRadius: 7,
      pointBackgroundColor: 'rgb(34, 197, 94)',
      pointBorderColor: '#fff',
      pointBorderWidth: 2,
      pointHoverBackgroundColor: 'rgb(34, 197, 94)',
      pointHoverBorderColor: '#fff',
      pointHoverBorderWidth: 3,
      borderWidth: 3
    }]
  };
};

  const pieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { 
        position: 'bottom',
        labels: {
          padding: 15,
          font: { size: 12, weight: 'bold' }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 12,
        titleFont: { size: 13, weight: 'bold' },
        bodyFont: { size: 12 },
        callbacks: {
          label: (context) => {
            const label = context.label || '';
            const value = context.parsed || 0;
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = ((value / total) * 100).toFixed(1);
            return `${label}: ${value} (${percentage}%)`;
          }
        }
      },
      datalabels: {
        color: '#fff',
        font: {
          weight: 'bold',
          size: 14
        },
        formatter: (value, context) => {
          const total = context.dataset.data.reduce((a, b) => a + b, 0);
          const percentage = ((value / total) * 100).toFixed(1);
          return value > 0 ? `${value}\n(${percentage}%)` : '';
        }
      }
    }
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { 
      legend: { 
        position: 'bottom',
        labels: {
          padding: 15,
          font: { size: 13, weight: 'bold' }
        }
      },
      datalabels: {
        anchor: 'end',
        align: 'top',
        color: '#374151',
        font: {
          weight: 'bold',
          size: 12
        },
        formatter: (value) => value > 0 ? value : ''
      }
    },
    scales: { 
      x: { 
        ticks: { 
          maxRotation: 45, 
          minRotation: 45, 
          font: { size: 11, weight: '500' } 
        },
        grid: { display: false }
      }, 
      y: { 
        beginAtZero: true,
        ticks: { font: { size: 11 } },
        grid: { color: 'rgba(0, 0, 0, 0.05)' }
      }
    }
  };

const lineOptions = {
  responsive: true,
  maintainAspectRatio: false,
  interaction: {
    mode: 'index',
    intersect: false,
  },
  plugins: {
    legend: { 
      display: true,
      position: 'top',
      labels: {
        font: { size: 13, weight: 'bold' },
        padding: 15,
        usePointStyle: true
      }
    },
    tooltip: {
      backgroundColor: 'rgba(0, 0, 0, 0.9)',
      padding: 15,
      displayColors: true,
      titleFont: { size: 14, weight: 'bold' },
      bodyFont: { size: 13 },
      callbacks: {
        title: (context) => {
          return `Date: ${context[0].label}`;
        },
        label: (context) => {
          return `Revenue: ₱${context.parsed.y.toFixed(2)} SC`;
        }
      }
    },
    datalabels: {
      display: false
    }
  },
  scales: {
    x: {
      ticks: { 
        font: { size: 11, weight: '500' },
        maxRotation: 45,
        minRotation: 45
      },
      grid: { 
        display: true,
        color: 'rgba(0, 0, 0, 0.05)'
      }
    },
    y: {
      beginAtZero: true,
      ticks: { 
        font: { size: 12, weight: '500' },
        callback: (value) => `₱${value.toFixed(0)}`
      },
      grid: { 
        color: 'rgba(0, 0, 0, 0.1)',
        drawBorder: false
      }
    }
  }
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
        fetchRevenueData(); // ✅ REFRESH REVENUE ON UPDATE
        setRefreshing(false);
      }, 300);
    });

    onStatsUpdated(() => {
      console.log('📡 Stats updated via socket');
      fetchStats();
      fetchRevenueData(); // ✅ REFRESH REVENUE ON UPDATE
    });

    onActivityCreated(() => {
      console.log('📡 New activity created via socket');
      setRefreshing(true);
      setTimeout(() => {
        fetchActivities();
        fetchStats();
        fetchRevenueData(); // ✅ REFRESH REVENUE ON UPDATE
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
    fetchRevenueData(); // ✅ FETCH REVENUE ON LOAD
  }, [currentPage, filterType, searchQuery, dateFrom, dateTo]);

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
          search: searchQuery,
          dateFrom: dateFrom || undefined,
          dateTo: dateTo || undefined
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
    // ✅ ADD DEBUG LOG
    console.log('🔍 Activity object:', {
      related_id: activity.related_id,
      activity_type: activity.activity_type,
      full_activity: activity
    });

    const response = await api.get(`/admin/activities/${activity.related_id}?type=${encodeURIComponent(activity.activity_type)}`);
    
    console.log('📸 Raw response data:', response.data.data);
    
    if (response.data.success) {
      // Helper to convert image data
      const convertImage = (imageData) => {
        if (!imageData) return null;
        if (typeof imageData === 'string' && imageData.startsWith('data:')) return imageData;
        if (typeof imageData === 'string') return `data:image/jpeg;base64,${imageData}`;
        if (imageData.type === 'Buffer' && imageData.data) {
          const base64 = btoa(String.fromCharCode(...new Uint8Array(imageData.data)));
          return `data:image/jpeg;base64,${base64}`;
        }
        return null;
      };

      const detailedActivity = {
        ...response.data.data,
        user_id: activity.user_id,
        activity_type: activity.activity_type,
        status: activity.status,
        // ✅ CHANGED: Only convert valid_id_file (matches backend)
        valid_id_file: convertImage(response.data.data.valid_id_file),
        proof_image: convertImage(response.data.data.proof_image)
      };
      
      console.log('📸 Converted images:', {
        valid_id: !!detailedActivity.valid_id_file,
        proof: !!detailedActivity.proof_image
      });
      
      setSelectedActivity(detailedActivity);
      setDetailsModal(true);
      
      if (activity.activity_type === 'Report Submitted') {
        setSelectedViolationType('minor');
      }
    }
  } catch (error) {
    console.error('Error fetching details:', error);
    alert('Failed to fetch activity details: ' + error.message);
  }
};

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

      const userId = activity.user_id || activity.userId;

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
        fetchRevenueData(); // ✅ REFRESH REVENUE AFTER UPDATE
      }
    } catch (error) {
      console.error('Error updating wallet request:', error);
      alert('Failed to update request status: ' + (error.response?.data?.message || error.message));
    }
  };

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
      'Class Created': 'bg-blue-100 text-blue-800',
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

  const formatCurrency = (value) => {
    return `₱${parseFloat(value || 0).toFixed(2)}`;
  };

  const exportToExcel = () => {
    if (activities.length === 0) {
      alert('No activities to export');
      return;
    }

    const headers = ['Date & Time', 'User Name', 'Email', 'Role', 'Activity Type', 'Details', 'Status'];
    const rows = activities.map(activity => [
      formatDateTime(activity.created_at),
      activity.full_name,
      activity.email,
      activity.role,
      activity.activity_type,
      activity.details,
      activity.status
    ]);

    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += headers.join(',') + '\n';
    rows.forEach(row => {
      csvContent += row.map(cell => `"${(cell || '').toString().replace(/"/g, '""')}"`).join(',') + '\n';
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `activities_${filterType}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToPDF = () => {
    if (activities.length === 0) {
      alert('No activities to export');
      return;
    }

    import('html2pdf.js').then(({ default: html2pdf }) => {
      const element = document.createElement('div');
      element.style.padding = '20px';
      element.style.fontFamily = 'Arial, sans-serif';
      element.style.fontSize = '10px';

      let htmlContent = `
        <h1 style="text-align: center; color: #1f2937; margin-bottom: 20px;">
          Activities Report - ${filterType.charAt(0).toUpperCase() + filterType.slice(1)}
        </h1>
        <p style="text-align: center; color: #6b7280; margin-bottom: 20px;">
          Generated on ${new Date().toLocaleString()}
        </p>
        <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
          <thead>
            <tr style="background-color: #f3f4f6; border-bottom: 2px solid #d1d5db;">
              <th style="padding: 10px; text-align: left; border: 1px solid #d1d5db;">Date & Time</th>
              <th style="padding: 10px; text-align: left; border: 1px solid #d1d5db;">User Name</th>
              <th style="padding: 10px; text-align: left; border: 1px solid #d1d5db;">Email</th>
              <th style="padding: 10px; text-align: left; border: 1px solid #d1d5db;">Role</th>
              <th style="padding: 10px; text-align: left; border: 1px solid #d1d5db;">Activity Type</th>
              <th style="padding: 10px; text-align: left; border: 1px solid #d1d5db;">Status</th>
            </tr>
          </thead>
          <tbody>
      `;

      activities.forEach((activity, idx) => {
        const bgColor = idx % 2 === 0 ? '#ffffff' : '#f9fafb';
        htmlContent += `
          <tr style="background-color: ${bgColor}; border-bottom: 1px solid #d1d5db;">
            <td style="padding: 8px; border: 1px solid #d1d5db;">${formatDateTime(activity.created_at)}</td>
            <td style="padding: 8px; border: 1px solid #d1d5db;">${activity.full_name}</td>
            <td style="padding: 8px; border: 1px solid #d1d5db;">${activity.email}</td>
            <td style="padding: 8px; border: 1px solid #d1d5db;">${activity.role}</td>
            <td style="padding: 8px; border: 1px solid #d1d5db;">${activity.activity_type}</td>
            <td style="padding: 8px; border: 1px solid #d1d5db;">${activity.status}</td>
          </tr>
        `;
      });

      htmlContent += `
          </tbody>
        </table>
      `;

      element.innerHTML = htmlContent;

      const opt = {
        margin: 10,
        filename: `activities_${filterType}_${new Date().toISOString().split('T')[0]}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { orientation: 'landscape', unit: 'mm', format: 'a4' }
      };

      html2pdf().set(opt).from(element).save();
    }).catch(() => {
      alert('PDF export library not available. Please use Excel export instead.');
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
                  Manage and monitor platform activities & revenue
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
          
          {/* ✅ REVENUE OVERVIEW SECTION */}
          {revenueData && (
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                  <FaMoneyBillWave className="text-green-600" />
                  Revenue Overview (5% Platform Fee)
                </h3>
              </div>

              {/* Revenue Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {/* Total Revenue Card */}
                <div className="bg-gradient-to-br from-green-500 to-green-600 p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow">
                  <div className="flex items-center justify-between mb-2">
                    <FaDollarSign className="text-4xl text-white/80" />
                    <span className="text-xs font-semibold bg-white/20 px-2 py-1 rounded text-white">Total</span>
                  </div>
                  <p className="text-sm text-white/90 font-medium">Total Platform Revenue</p>
                  <p className="text-3xl font-bold text-white mt-2">
                    {formatCurrency(revenueData.totalRevenue.total_platform_revenue)}
                  </p>
                  <p className="text-xs text-white/75 mt-1">
                    {revenueData.totalRevenue.total_transactions} transactions
                  </p>
                </div>

                {/* Top-Up Revenue Card */}
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow">
                  <div className="flex items-center justify-between mb-2">
                    <FaArrowUp className="text-4xl text-white/80" />
                    <span className="text-xs font-semibold bg-white/20 px-2 py-1 rounded text-white">Top-Up</span>
                  </div>
                  <p className="text-sm text-white/90 font-medium">Top-Up Fee Revenue</p>
                  <p className="text-3xl font-bold text-white mt-2">
                    {formatCurrency(revenueData.totalRevenue.topup_revenue)}
                  </p>
                  <p className="text-xs text-white/75 mt-1">
                    {revenueData.totalRevenue.topup_count} top-ups
                  </p>
                </div>

                {/* Cash-Out Revenue Card */}
                <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow">
                  <div className="flex items-center justify-between mb-2">
                    <FaArrowDown className="text-4xl text-white/80" />
                    <span className="text-xs font-semibold bg-white/20 px-2 py-1 rounded text-white">Cash-Out</span>
                  </div>
                  <p className="text-sm text-white/90 font-medium">Cash-Out Fee Revenue</p>
                  <p className="text-3xl font-bold text-white mt-2">
                    {formatCurrency(revenueData.totalRevenue.cashout_revenue)}
                  </p>
                  <p className="text-xs text-white/75 mt-1">
                    {revenueData.totalRevenue.cashout_count} cash-outs
                  </p>
                </div>

                {/* Average Fee Card */}
                <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow">
                  <div className="flex items-center justify-between mb-2">
                    <FaChartLine className="text-4xl text-white/80" />
                    <span className="text-xs font-semibold bg-white/20 px-2 py-1 rounded text-white">Avg</span>
                  </div>
                  <p className="text-sm text-white/90 font-medium">Average Fee per Transaction</p>
                  <p className="text-3xl font-bold text-white mt-2">
                    {formatCurrency(
                      revenueData.totalRevenue.total_transactions > 0
                        ? revenueData.totalRevenue.total_platform_revenue / revenueData.totalRevenue.total_transactions
                        : 0
                    )}
                  </p>
                  <p className="text-xs text-white/75 mt-1">per transaction</p>
                </div>
              </div>

{/* Revenue Trend Chart */}
<div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow">
  <h4 className="text-base font-bold text-gray-700 mb-4 flex items-center gap-2">
    <FaChartLine className="text-green-600" />
    Revenue Trend (Last 30 Days)
  </h4>
  {revenueData?.dailyRevenue && revenueData.dailyRevenue.length > 0 ? (
    <>
      <div className="h-64">
        <Line data={buildRevenueLineData()} options={lineOptions} />
      </div>
      {revenueData.dailyRevenue.length < 7 && (
        <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-xs text-blue-700">
            <span className="font-semibold">💡 Tip:</span> More data points will show as transactions are processed over time. Currently showing {revenueData.dailyRevenue.length} day(s) of data.
          </p>
        </div>
      )}
    </>
  ) : (
    <div className="h-64 flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg border-2 border-dashed border-gray-300">
      <div className="text-center p-8">
        <div className="text-6xl mb-4">📊</div>
        <p className="text-gray-600 text-base font-semibold mb-2">No Revenue Data Yet</p>
        <p className="text-gray-500 text-sm">
          Revenue tracking will begin once wallet top-up and cash-out requests are processed.
        </p>
      </div>
    </div>
  )}
</div>
            </div>
          )}

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
                    <p className="text-gray-600 text-xs font-semibold">Classes</p>
                    <p className="text-2xl font-bold text-blue-600 mt-1">
                      {stats.activitiesByType?.find(a => a.activity_type === 'Class Created')?.count || 0}
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

          {/* Charts (Pie + Bar) - IMPROVED */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow">
                <h4 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                  📊 Activity Distribution
                </h4>
                <div className="w-full h-80">
                  <Pie data={buildPieData()} options={pieOptions} />
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow">
                <h4 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                  📈 Pending vs Total Activities
                </h4>
                <div className="w-full h-80">
                  <Bar data={buildBarData()} options={barOptions} />
                </div>
              </div>
            </div>
          )}

          {/* Filter and Search */}
          <div className="mb-6 flex gap-4 items-center flex-wrap">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => { setDateFrom(e.target.value); setCurrentPage(1); }}
                  className="px-3 py-2 border border-gray-200 rounded-lg bg-white text-sm"
                  aria-label="From date"
                />
                <span className="text-gray-400">to</span>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => { setDateTo(e.target.value); setCurrentPage(1); }}
                  className="px-3 py-2 border border-gray-200 rounded-lg bg-white text-sm"
                  aria-label="To date"
                />
                <button
                  onClick={() => { setDateFrom(''); setDateTo(''); setCurrentPage(1); }}
                  className="ml-2 px-3 py-2 bg-gray-100 rounded-lg text-sm text-gray-600 hover:bg-gray-200"
                  title="Clear dates"
                >
                  Clear
                </button>
              </div>

              <select
                value={filterType}
                onChange={(e) => {
                  setFilterType(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white cursor-pointer"
              >
                <option value="all">All Activities</option>
                <option value="Class Created">Class Created</option>
                <option value="Transaction">Transaction</option>
                <option value="Wallet Request">Wallet Request</option>
                <option value="Report Submitted">Report Submitted</option>
                <option value="User Registered">User Registered</option>
              </select>
            </div>

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

            {/* Export Buttons */}
            <div className="flex gap-2">
              <button
                onClick={exportToExcel}
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium flex items-center gap-2 whitespace-nowrap"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2H3V4zm0 5h14v9a1 1 0 01-1 1H4a1 1 0 01-1-1V9zm0-3v3h14V6H3z" />
                </svg>
                Excel
              </button>
              <button
                onClick={exportToPDF}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium flex items-center gap-2 whitespace-nowrap"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 110 2H4a1 1 0 110-2V4zm3 5a1 1 0 000 2h.01a1 1 0 000-2H7zm3 0a1 1 0 000 2h3a1 1 0 000-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" />
                </svg>
                PDF
              </button>
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

          {/* Note: Details Modal and Image Preview Modal code remains the same as in your original file */}
          {/* I'm keeping the modal code unchanged to preserve all the functionality */}
        </div>
      </div>

{/* Details Modal */}
{detailsModal && selectedActivity && (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fadeIn">
    <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden animate-slideUp flex flex-col">
      {/* Header with gradient */}
      <div className={`px-8 py-6 text-white flex items-start justify-between ${
        selectedActivity.activity_type === 'Wallet Request' 
          ? 'bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600'
          : selectedActivity.activity_type === 'Report Submitted'
          ? 'bg-gradient-to-r from-red-600 to-red-700'
          : selectedActivity.activity_type === 'User Registered'
          ? 'bg-gradient-to-r from-blue-600 to-indigo-600'
          : 'bg-gradient-to-r from-blue-600 to-indigo-600'
      }`}>
        <div>
          <h3 className="text-2xl font-bold">
            {selectedActivity.activity_type === 'Wallet Request' && 'Transaction Details'}
            {selectedActivity.activity_type === 'Report Submitted' && 'Report Details'}
            {selectedActivity.activity_type === 'User Registered' && 'Verification Details'}
            {!['Wallet Request', 'Report Submitted', 'User Registered'].includes(selectedActivity.activity_type) && 'Activity Details'}
          </h3>
          <p className={`text-sm mt-1 ${
            selectedActivity.activity_type === 'Wallet Request' ? 'text-blue-100' :
            selectedActivity.activity_type === 'Report Submitted' ? 'text-red-100' :
            'text-blue-100'
          }`}>
            {selectedActivity.activity_type === 'Wallet Request' && 'Review and manage request • 5% platform fee'}
            {selectedActivity.activity_type === 'Report Submitted' && 'Review and take action'}
            {selectedActivity.activity_type === 'User Registered' && 'Review user information and documents'}
          </p>
        </div>
        <button
          onClick={() => {
            setDetailsModal(false);
            setSelectedActivity(null);
          }}
          className="p-2 hover:bg-white/20 rounded-lg transition-colors"
        >
          <XMarkIcon className="w-6 h-6" />
        </button>
      </div>

{/* Content */}
<div className="overflow-y-auto flex-1 p-8">
  {/* WALLET REQUEST CONTENT */}
  {selectedActivity.activity_type === 'Wallet Request' && (() => {
    const amount = parseFloat(selectedActivity.amount);
    const feePercentage = 5;
    const feeAmount = (amount * feePercentage) / 100;
    const netAmount = amount - feeAmount;
    
    return (
      <>
        <div className="flex justify-center mb-6">
          <div className={`inline-flex items-center gap-3 px-6 py-3 rounded-2xl ${
            selectedActivity.type === 'top-up' 
              ? 'bg-gradient-to-r from-green-100 to-emerald-100 border-2 border-green-300' 
              : 'bg-gradient-to-r from-blue-100 to-indigo-100 border-2 border-blue-300'
          }`}>
            <div className={`p-2 rounded-lg ${selectedActivity.type === 'top-up' ? 'bg-green-200' : 'bg-blue-200'}`}>
              {selectedActivity.type === 'top-up' ? '💰' : '💳'}
            </div>
            <span className={`font-bold text-lg ${selectedActivity.type === 'top-up' ? 'text-green-700' : 'text-blue-700'}`}>
              {selectedActivity.type === 'top-up' ? 'Top Up Request' : 'Cash Out Request'}
            </span>
          </div>
        </div>

        {/* Fee Breakdown */}
        <div className="mb-6 bg-gradient-to-br from-orange-50 to-amber-50 p-6 rounded-2xl border-2 border-orange-200">
          <h4 className="text-sm font-bold text-orange-800 mb-4 flex items-center gap-2">
            <span className="bg-orange-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs">₱</span>
            Fee Breakdown
          </h4>
          <div className="space-y-3">
            <div className="flex justify-between items-center bg-white rounded-lg px-4 py-3">
              <span className="text-sm text-gray-600 font-medium">Original Amount</span>
              <span className="text-lg font-bold text-gray-900">₱{amount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center bg-white rounded-lg px-4 py-3">
              <span className="text-sm text-orange-600 font-bold">Platform Fee (5%)</span>
              <span className="text-lg font-bold text-orange-600">-₱{feeAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center bg-gradient-to-r from-green-100 to-emerald-100 rounded-lg px-4 py-3 border-2 border-green-300">
              <span className="text-sm text-green-800 font-bold">
                {selectedActivity.type === 'top-up' ? 'User Receives (SC)' : 'Cash-out Value'}
              </span>
              <span className="text-2xl font-bold text-green-800">₱{netAmount.toFixed(2)}</span>
            </div>
          </div>
          <p className="text-xs text-orange-700 mt-4 italic">
            💡 {selectedActivity.type === 'top-up' 
              ? 'User will receive the net amount in SkillCoins after 5% platform fee deduction'
              : 'User will receive the net amount in cash/GCash after 5% platform fee deduction'}
          </p>
        </div>

        {/* Transaction Details */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-5 rounded-2xl border-2 border-gray-200">
            <p className="text-sm text-gray-600 font-semibold mb-2">Transaction ID</p>
            <p className="font-bold text-gray-900 text-lg">#{selectedActivity.id}</p>
          </div>
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-5 rounded-2xl border-2 border-blue-200">
            <p className="text-sm text-blue-600 font-semibold mb-2">Type</p>
            <p className="font-bold text-blue-900 text-lg capitalize">{selectedActivity.type}</p>
          </div>
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-5 rounded-2xl border-2 border-purple-200 col-span-2">
            <p className="text-sm text-purple-600 font-semibold mb-2">Reference Number</p>
            <p className="font-mono font-bold text-purple-900">{selectedActivity.reference_number}</p>
          </div>
        </div>

        {/* User Information */}
        <div className="bg-gradient-to-br from-indigo-50 to-blue-50 p-6 rounded-2xl border-2 border-indigo-200 mb-6">
          <p className="text-sm text-indigo-600 font-semibold mb-3">User Information</p>
          <p className="font-bold text-gray-900 text-xl mb-2">{selectedActivity.full_name}</p>
          <p className="text-gray-600">{selectedActivity.email}</p>
        </div>

        {/* ✅ ONLY SHOW PROOF IMAGE FOR TOP-UP */}
        {selectedActivity.type === 'top-up' && selectedActivity.proof_image && (
          <div className="bg-gradient-to-br from-orange-50 to-amber-50 p-6 rounded-2xl border-2 border-orange-200">
            <p className="text-sm text-orange-600 font-semibold mb-4">Proof of Payment</p>
            <div className="bg-white p-4 rounded-xl border-2 border-orange-100">
              <img
                src={selectedActivity.proof_image.startsWith('data:') 
                  ? selectedActivity.proof_image 
                  : `data:image/jpeg;base64,${selectedActivity.proof_image}`}
                alt="Proof"
                className="max-h-48 w-auto mx-auto object-contain rounded cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => setImagePreview(
                  selectedActivity.proof_image.startsWith('data:') 
                    ? selectedActivity.proof_image 
                    : `data:image/jpeg;base64,${selectedActivity.proof_image}`
                )}
              />
            </div>
          </div>
        )}
      </>
    );
  })()}

{/* REPORT SUBMITTED CONTENT */}
{selectedActivity.activity_type === 'Report Submitted' && (
  <>
    {/* Reporter & Reported User - Side by Side */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
      {/* Reporter Card */}
      <div className="bg-blue-50 rounded-lg p-6 border-l-4 border-blue-600">
        <h4 className="font-bold text-blue-900 mb-3 text-base flex items-center gap-2">
          <div className="w-1 h-5 bg-blue-600 rounded"></div>
          Reporter
        </h4>
        <p className="font-semibold text-gray-900 text-lg mb-1">{selectedActivity.reporter_name}</p>
        <p className="text-sm text-gray-600">ID: {selectedActivity.reporter_id}</p>
      </div>

      {/* Reported User Card */}
      <div className="bg-red-50 rounded-lg p-6 border-l-4 border-red-600">
        <h4 className="font-bold text-red-900 mb-3 text-base flex items-center gap-2">
          <div className="w-1 h-5 bg-red-600 rounded"></div>
          Reported User
        </h4>
        <p className="font-semibold text-gray-900 text-lg mb-1">{selectedActivity.reported_user_name}</p>
        <p className="text-sm text-gray-600">ID: {selectedActivity.reported_user_id}</p>
      </div>
    </div>

    {/* Report Reason */}
    <div className="bg-gray-50 rounded-lg p-6 mb-4">
      <h4 className="font-bold text-gray-900 mb-3 text-base">Report Reason</h4>
      <p className="text-gray-800 text-base">{selectedActivity.reason}</p>
    </div>

    {/* Description */}
    {selectedActivity.description && (
      <div className="bg-gray-50 rounded-lg p-6 mb-4">
        <h4 className="font-bold text-gray-900 mb-3 text-base">Description</h4>
        <p className="text-gray-800 text-base">{selectedActivity.description}</p>
      </div>
    )}

{/* Violation Type Section */}
<div className="bg-green-50 rounded-lg p-6 mb-4">
  <h4 className="font-bold text-green-800 mb-3 text-base flex items-center gap-2">
    <CheckCircleIcon className="w-5 h-5 text-green-600" />
    Violation Type
  </h4>
  
  {/* Show selection or display based on resolution status */}
  {isResolved ? (
    <>
      {/* ✅ ADD THIS - Display the violation type name */}
      <p className="text-green-800 font-semibold text-lg mb-4 capitalize">
        {selectedActivity.violationType || 'Not specified'}
      </p>
      
      <div>
        <h5 className="text-base font-semibold text-green-800 mb-3">Subcategories:</h5>
        <div className="flex flex-wrap gap-2">
          {violationTypes[selectedActivity.violationType]?.map(type => (
            <span 
              key={type} 
              className="px-4 py-2 bg-white border border-green-400 rounded-full text-sm font-medium text-green-800"
            >
              {type.replace('_', ' ')}
            </span>
          ))}
        </div>
      </div>
    </>
  ) : (
        <>
          {/* Violation Type Buttons */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            {Object.keys(violationTypes).map(type => (
              <button
                key={type}
                onClick={() => setSelectedViolationType(type)}
                className={`p-3 rounded-lg border-2 transition-all capitalize font-semibold text-sm ${
                  selectedViolationType === type
                    ? 'border-green-600 bg-green-100 text-green-900'
                    : 'border-gray-300 bg-white text-gray-700 hover:border-green-300'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
          
          {/* Subcategories Display */}
          <div>
            <h5 className="text-base font-semibold text-green-800 mb-3">Subcategories:</h5>
            <div className="flex flex-wrap gap-2">
              {violationTypes[selectedViolationType]?.map(type => (
                <span 
                  key={type} 
                  className="px-4 py-2 bg-white border border-green-400 rounded-full text-sm font-medium text-green-800"
                >
                  {type.replace('_', ' ')}
                </span>
              ))}
            </div>
          </div>
        </>
      )}
    </div>

{/* Resolution Details - Only show if resolved */}
{isResolved && (
  <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border-2 border-purple-200">
    <h4 className="font-bold text-purple-900 mb-5 text-lg flex items-center gap-2">
      <CheckCircleIcon className="w-6 h-6 text-purple-600" />
      Resolution Details
    </h4>
    
    <div className="space-y-4">
      {/* Status Badge */}
      <div className="bg-white rounded-lg p-4 shadow-sm border border-purple-100">
        <p className="text-xs text-purple-600 font-semibold uppercase tracking-wide mb-2">Resolution Status</p>
        <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-bold ${
          selectedActivity.status === 'invalid' 
            ? 'bg-gray-100 text-gray-800 border-2 border-gray-300'
            : selectedActivity.status === 'warning'
            ? 'bg-yellow-100 text-yellow-800 border-2 border-yellow-400'
            : selectedActivity.status === 'suspended'
            ? 'bg-red-100 text-red-800 border-2 border-red-400'
            : 'bg-purple-100 text-purple-800 border-2 border-purple-300'
        }`}>
          {selectedActivity.status === 'invalid' && '✓ Marked as Invalid'}
          {selectedActivity.status === 'warning' && '⚠️ Warning Issued'}
          {selectedActivity.status === 'suspended' && '🚫 User Suspended'}
          {!['invalid', 'warning', 'suspended'].includes(selectedActivity.status) && selectedActivity.status}
        </span>
      </div>

      {/* Resolved On */}
      <div className="bg-white rounded-lg p-4 shadow-sm border border-purple-100">
        <p className="text-xs text-purple-600 font-semibold uppercase tracking-wide mb-2">Resolved On</p>
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p className="text-gray-900 font-semibold text-base">
            {selectedActivity.updated_at 
              ? new Date(selectedActivity.updated_at).toLocaleString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                  hour: 'numeric',
                  minute: '2-digit',
                  hour12: true
                })
              : 'Not Available'}
          </p>
        </div>
      </div>

      {/* Admin Notes */}
      {selectedActivity.adminNotes && (
        <div className="bg-white rounded-lg p-4 shadow-sm border border-purple-100">
          <p className="text-xs text-purple-600 font-semibold uppercase tracking-wide mb-2">Admin Notes</p>
          <div className="flex items-start gap-2">
            <svg className="w-5 h-5 text-purple-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-gray-800 text-base leading-relaxed">{selectedActivity.adminNotes}</p>
          </div>
        </div>
      )}

      {/* Resolution Summary Info Box */}
      <div className="bg-purple-600 rounded-lg p-4 text-white">
        <div className="flex items-start gap-3">
          <div className="bg-white/20 rounded-full p-2 flex-shrink-0">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div>
            <p className="font-semibold text-sm mb-1">Report Resolved</p>
            <p className="text-white/90 text-xs leading-relaxed">
              This report has been reviewed by an administrator and appropriate action has been taken. Both parties have been notified of the resolution.
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
)}
  </>
)}

 {/* CLASS CREATED CONTENT */}
  {selectedActivity.activity_type === 'Class Created' && (
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
          Class Information
        </h3>
        <div className="space-y-4">
          {renderDetailCard(<FaTag className="text-indigo-600" />, 'Class Title', selectedActivity.title, true)}
          <div className="p-4 rounded-lg bg-indigo-50 border-2 border-indigo-200">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">📝 Description</p>
            <p className="text-sm text-gray-900 leading-relaxed">{selectedActivity.description || 'N/A'}</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {renderDetailCard(<FaTag className="text-indigo-600" />, 'Price', `SC ${selectedActivity.price}`, true)}
            {renderDetailCard(<FaCheckCircle className="text-indigo-600" />, 'Status', selectedActivity.status, true, true)}
          </div>
          {/* Status Display with Date */}
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-5 rounded-xl border-2 border-gray-200">
            <h4 className="font-bold text-gray-900 mb-3">Class Status</h4>
            <div className="flex items-center gap-3">
              <span className={`px-4 py-2 rounded-full text-sm font-bold ${
                selectedActivity.status === 'Active'
                  ? 'bg-green-100 text-green-800'
                  : selectedActivity.status === 'pending' || selectedActivity.status === 'Pending'
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {selectedActivity.status?.toUpperCase() || 'ACTIVE'}
              </span>
              <span className="text-sm text-gray-600">
                {selectedActivity.created_at && `Created: ${formatDateTime(selectedActivity.created_at)}`}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ℹ️ INFO MESSAGE - No actions needed */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg border-2 border-blue-200">
        <p className="text-sm text-blue-700">
          <span className="font-semibold">ℹ️ Info:</span> This class was created by the user and does not require admin approval. It is automatically listed in the marketplace.
        </p>
      </div>
    </>
  )}

  {/* TRANSACTION CONTENT */}
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

      {/* Class Details */}
      <div className="mb-8">
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <div className="w-1 h-6 bg-indigo-600 rounded"></div>
          Class Details
        </h3>
        <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-xl p-6 border border-indigo-200">
          <div className="mb-4">
            {renderDetailCard(<FaTag className="text-indigo-600" />, 'Class Title', selectedActivity.service_title, true)}
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
          {/* Status Display with Date */}
          <div className="mt-4 bg-gradient-to-br from-gray-50 to-gray-100 p-5 rounded-xl border-2 border-gray-200">
            <h4 className="font-bold text-gray-900 mb-3">Transaction Status</h4>
            <div className="flex items-center gap-3">
              <span className={`px-4 py-2 rounded-full text-sm font-bold ${
                selectedActivity.status === 'completed' || selectedActivity.status === 'Completed'
                  ? 'bg-green-100 text-green-800'
                  : selectedActivity.status === 'ongoing'
                  ? 'bg-blue-100 text-blue-800'
                  : selectedActivity.status === 'pending' || selectedActivity.status === 'Pending'
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-red-100 text-red-800'
              }`}>
                {selectedActivity.status?.toUpperCase() || 'PENDING'}
              </span>
              <span className="text-sm text-gray-600">
                {selectedActivity.created_at && `Created: ${formatDateTime(selectedActivity.created_at)}`}
              </span>
            </div>
          </div>
        </div>
      </div>
    </>
  )}

{/* USER REGISTERED CONTENT */}
{selectedActivity.activity_type === 'User Registered' && (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
    {/* User Information */}
    <div className="space-y-4">
      <h3 className="font-semibold text-lg text-gray-800 mb-4">User Information</h3>
      
      <div className="bg-gray-50 rounded-lg p-4 space-y-3">
        <div>
          <label className="text-xs text-gray-500 font-medium uppercase">Full Name</label>
          <p className="font-medium text-gray-800 mt-1">{selectedActivity.full_name}</p>
        </div>
        
        <div>
          <label className="text-xs text-gray-500 font-medium uppercase">Email</label>
          <p className="font-medium text-gray-800 mt-1">{selectedActivity.email}</p>
        </div>

        <div>
          <label className="text-xs text-gray-500 font-medium uppercase">Role</label>
          <p className={`font-medium mt-1 px-3 py-1 rounded-full text-sm w-fit ${
            selectedActivity.role === "Learner"
              ? "bg-blue-100 text-blue-700"
              : selectedActivity.role === "Tutor"
              ? "bg-purple-100 text-purple-700"
              : "bg-green-100 text-green-700"
          }`}>
            {selectedActivity.role}
          </p>
        </div>

        <div>
          <label className="text-xs text-gray-500 font-medium uppercase">Verification Status</label>
          <p className={`font-medium mt-1 px-3 py-1 rounded-full text-sm w-fit ${
            selectedActivity.verification_status === "approved"
              ? "bg-green-100 text-green-700"
              : selectedActivity.verification_status === "rejected"
              ? "bg-red-100 text-red-700"
              : "bg-yellow-100 text-yellow-700"
          }`}>
            {selectedActivity.verification_status}
          </p>
        </div>
      </div>
    </div>

          {/* Documents */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg text-gray-800 mb-4">Submitted Documents</h3>
            
            <div>
              <label className="text-sm text-gray-600 font-medium mb-2 block">Valid ID</label>
              {selectedActivity.valid_id_file ? (
                <div className="border-2 border-gray-200 rounded-lg overflow-hidden bg-gray-50 flex flex-col items-center p-4">
                  <img
                    src={selectedActivity.valid_id_file.startsWith('data:') 
                      ? selectedActivity.valid_id_file 
                      : `data:image/jpeg;base64,${selectedActivity.valid_id_file}`}
                    alt="Valid ID"
                    className="w-full object-contain max-h-64 cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={() => setImagePreview(
                      selectedActivity.valid_id_file.startsWith('data:') 
                        ? selectedActivity.valid_id_file 
                        : `data:image/jpeg;base64,${selectedActivity.valid_id_file}`
                    )}
                  />
                </div>
              ) : (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center bg-gray-50">
                  <p className="text-gray-500 text-sm">No file uploaded</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
  </div>

      {/* Action Buttons */}
      {!isResolved && selectedActivity && (
        <div className="border-t border-gray-200 bg-gray-50 px-8 py-6">
          {selectedActivity.activity_type === 'Wallet Request' && (
            <div className={selectedActivity.type === 'top-up' ? 'flex gap-4' : ''}>
              {selectedActivity.type === 'top-up' ? (
                <>
                  <button
                    onClick={() => handleWalletRequestUpdate('approved')}
                    className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 text-white py-4 rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all font-bold shadow-lg hover:shadow-xl text-lg"
                  >
                    ✓ Approve (User gets ₱{((parseFloat(selectedActivity.amount) * 95) / 100).toFixed(2)})
                  </button>
                  <button
                    onClick={() => handleWalletRequestUpdate('rejected')}
                    className="flex-1 bg-gradient-to-r from-red-500 to-rose-600 text-white py-4 rounded-xl hover:from-red-600 hover:to-rose-700 transition-all font-bold shadow-lg hover:shadow-xl text-lg"
                  >
                    ✕ Reject Request
                  </button>
                </>
              ) : (
                <button
                  onClick={() => handleWalletRequestUpdate('completed')}
                  className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-4 rounded-xl hover:from-blue-600 hover:to-indigo-700 transition-all font-bold shadow-lg hover:shadow-xl text-lg"
                >
                  ✓ Complete (Send ₱{((parseFloat(selectedActivity.amount) * 95) / 100).toFixed(2)})
                </button>
              )}
            </div>
          )}

        {selectedActivity.activity_type === 'Report Submitted' && (
          <div className="space-y-4">
            <div className="flex gap-3">
              <button
                onClick={() => handleReportUpdate(selectedActivity.id, 'invalid', selectedViolationType)}
                className="flex-1 px-6 py-3 text-gray-800 bg-white border-2 border-gray-300 rounded-xl hover:bg-gray-50 hover:border-gray-400 font-bold transition-all shadow-sm hover:shadow-md text-base"
              >
                Mark Invalid
              </button>
              <button
                onClick={() => handleReportUpdate(selectedActivity.id, 'warning', selectedViolationType)}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-yellow-500 to-amber-500 text-white rounded-xl hover:from-yellow-600 hover:to-amber-600 font-bold shadow-md hover:shadow-lg transition-all text-base"
              >
                Issue Warning
              </button>
              <button
                onClick={() => handleReportUpdate(selectedActivity.id, 'suspended', selectedViolationType)}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl hover:from-red-600 hover:to-red-700 font-bold shadow-md hover:shadow-lg transition-all text-base"
              >
                Suspend User
              </button>
            </div>
          </div>
        )}

          {selectedActivity.activity_type === 'User Registered' && (
            <div className="flex space-x-4">
              <button
                onClick={() => handleUserVerification(selectedActivity.user_id, 'approved')}
                className="flex-1 bg-green-500 text-white py-3 rounded-lg hover:bg-green-600 transition-colors flex items-center justify-center space-x-2 font-medium"
              >
                <CheckCircleIcon className="w-5 h-5" />
                <span>Approve Account</span>
              </button>
              <button
                onClick={() => handleUserVerification(selectedActivity.user_id, 'rejected')}
                className="flex-1 bg-red-500 text-white py-3 rounded-lg hover:bg-red-600 transition-colors flex items-center justify-center space-x-2 font-medium"
              >
                <XCircleIcon className="w-5 h-5" />
                <span>Reject</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  </div>
)}

      {/* Image Preview Modal */}
      {imagePreview && (
        <div className="fixed inset-0 bg-black/90 z-[60] flex items-center justify-center p-4" onClick={() => setImagePreview(null)}>
          <div className="relative max-w-6xl max-h-[90vh]">
            <button
              onClick={() => setImagePreview(null)}
              className="absolute -top-12 right-0 text-white hover:text-gray-300 p-2"
            >
              <XMarkIcon className="w-8 h-8" />
            </button>
            <img
              src={imagePreview}
              alt="Preview"
              className="max-w-full max-h-[85vh] object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}

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
}

export default Admin_Dashboard;