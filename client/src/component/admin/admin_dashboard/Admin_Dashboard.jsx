import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  BellIcon,
  MagnifyingGlassIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  UserGroupIcon,
  CurrencyDollarIcon,
} from "@heroicons/react/24/outline";
import AdminSidebar from "../../AdminSidebar";
import api from "../../../services/api";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalReports: 0,
    pendingVerifications: 0,
    walletRequests: 0,
  });
  const [recentReports, setRecentReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch all necessary data
      const [usersRes, reportsRes, verificationsRes, walletRes] = await Promise.all([
        api.get("/admin/all-users").catch(() => ({ data: [] })),
        api.get("/admin/reports").catch(() => ({ data: [] })),
        api.get("/auth/unverified-users").catch(() => ({ data: [] })),
        api.get("/admin/wallet-requests").catch(() => ({ data: [] })),
      ]);

      const reports = reportsRes.data || [];
      const pendingReports = reports.filter(r => r.status === 'pending' || !r.status);
      const walletRequests = (walletRes.data || []).filter(w => w.status === 'pending');

      setStats({
        totalUsers: (usersRes.data || []).length,
        totalReports: reports.length,
        pendingVerifications: (verificationsRes.data || []).length,
        walletRequests: walletRequests.length,
      });

      setRecentReports(pendingReports.slice(0, 5));
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, icon: Icon, color }) => (
    <div className={`bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-500 text-sm mb-1">{title}</p>
          <p className={`text-3xl font-bold ${color}`}>{value}</p>
        </div>
        <div className={`p-4 rounded-xl ${color === 'text-blue-600' ? 'bg-blue-100' : color === 'text-red-600' ? 'bg-red-100' : color === 'text-yellow-600' ? 'bg-yellow-100' : 'bg-green-100'}`}>
          <Icon className={`w-8 h-8 ${color}`} />
        </div>
      </div>
    </div>
  );

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
              <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
                Dashboard Overview
              </h2>
              <p className="text-gray-500 text-sm mt-1">Welcome back, Admin</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="relative hidden sm:block">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search..."
                  className="pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 w-64"
                />
              </div>
              <button className="relative hover:bg-gray-100 p-2 rounded-lg transition-colors">
                <BellIcon className="h-6 w-6 text-gray-600" />
                <span className="absolute -top-1 -right-1 bg-red-500 w-2 h-2 rounded-full"></span>
              </button>
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center text-white font-semibold">
                AD
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <>
              {/* Stats Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatCard 
                  title="Total Users" 
                  value={stats.totalUsers} 
                  icon={UserGroupIcon}
                  color="text-blue-600"
                />
                <StatCard 
                  title="Total Reports" 
                  value={stats.totalReports} 
                  icon={ExclamationCircleIcon}
                  color="text-red-600"
                />
                <StatCard 
                  title="Pending Verifications" 
                  value={stats.pendingVerifications} 
                  icon={CheckCircleIcon}
                  color="text-yellow-600"
                />
                <StatCard 
                  title="Wallet Requests" 
                  value={stats.walletRequests} 
                  icon={CurrencyDollarIcon}
                  color="text-green-600"
                />
              </div>

              {/* Recent Reports */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100">
                  <h3 className="text-lg font-semibold text-gray-900">Recent Reports</h3>
                </div>
                
                {recentReports.length === 0 ? (
                  <div className="p-6 text-center text-gray-500">
                    No recent reports
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 border-b">
                        <tr>
                          <th className="px-6 py-3 text-left text-gray-600 font-medium">Reported User</th>
                          <th className="px-6 py-3 text-left text-gray-600 font-medium">Reporter</th>
                          <th className="px-6 py-3 text-left text-gray-600 font-medium">Reason</th>
                          <th className="px-6 py-3 text-left text-gray-600 font-medium">Date</th>
                          <th className="px-6 py-3 text-left text-gray-600 font-medium">Status</th>
                          <th className="px-6 py-3 text-left text-gray-600 font-medium">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {recentReports.map((report) => (
                          <tr key={report.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4">
                              <p className="font-medium text-gray-900">{report.reported_user_name}</p>
                            </td>
                            <td className="px-6 py-4 text-gray-600">{report.reporter_name}</td>
                            <td className="px-6 py-4 text-gray-600">{report.reason}</td>
                            <td className="px-6 py-4 text-gray-600">
                              {new Date(report.created_at).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4">
                              <span className="px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
                                Pending
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <button 
                                onClick={() => navigate("/user-reports")}
                                className="text-blue-600 hover:text-blue-700 font-medium"
                              >
                                Review
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}