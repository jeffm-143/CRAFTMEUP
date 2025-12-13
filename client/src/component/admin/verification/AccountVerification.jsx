import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  XMarkIcon,
  CheckCircleIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";
import AdminSidebar from "../../AdminSidebar";
import api from '../../../services/api';

export default function AccountVerification() {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [studentIdPreview, setStudentIdPreview] = useState(null);
  const [studyLoadPreview, setStudyLoadPreview] = useState(null);
  const [enlargeImage, setEnlargeImage] = useState(null);

  useEffect(() => {
    fetchUnverifiedUsers();
  }, []);

  const fetchUnverifiedUsers = async () => {
    try {
      const response = await api.get('/auth/unverified-users');
      setUsers(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching users:', error);
      setLoading(false);
    }
  };

  const blobToDataUrl = (base64String) => {
    if (!base64String) return null;
    return `data:image/jpeg;base64,${base64String}`;
  };

  const handleViewDetails = async (user) => {
    setSelectedUser(user);
    
    if (user.student_id_file) {
      setStudentIdPreview(blobToDataUrl(user.student_id_file));
    }
    
    if (user.study_load_file) {
      setStudyLoadPreview(blobToDataUrl(user.study_load_file));
    }
    
    setIsModalOpen(true);
  };

  const handleVerify = async (userId, status) => {
    try {
      await api.post(`/auth/verify-user/${userId}`, { status });
      fetchUnverifiedUsers();
      setIsModalOpen(false);
      setSelectedUser(null);
      setStudentIdPreview(null);
      setStudyLoadPreview(null);
    } catch (error) {
      console.error('Error verifying user:', error);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedUser(null);
    setStudentIdPreview(null);
    setStudyLoadPreview(null);
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-50 to-white">
      {/* Sidebar - UNIFIED NAVIGATION */}
      <AdminSidebar />

      {/* Main Content */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-white border-b shadow-sm">
          <div className="flex items-center justify-between px-8 py-6">
            <div>
              <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
                Account Verification
              </h2>
              <p className="text-sm text-gray-500 mt-2">
                Manage and approve pending user accounts
              </p>
            </div>
            <div className="text-sm text-gray-600 flex items-center space-x-2">
              <span>Pending:</span>
              <span className="font-semibold text-blue-600 text-lg">{users.length}</span>
            </div>
          </div>
        </div>


        <div className="flex-1 p-8 overflow-y-auto">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-600 mt-4">Loading users...</p>
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl shadow">
              <CheckCircleIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-lg text-gray-600 font-medium">No pending verifications</p>
              <p className="text-gray-500 text-sm mt-2">All users have been verified</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {users.map((user) => (
                <div
                  key={user.id}
                  className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-all border border-gray-100"
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg text-gray-800">{user.full_name}</h3>
                        <p className="text-sm text-gray-500 mt-1">{user.email}</p>
                      </div>
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center flex-shrink-0">
                        <span className="text-white font-bold text-lg">
                          {user.full_name?.[0]?.toUpperCase() || "U"}
                        </span>
                      </div>
                    </div>
                    
                    <div className="space-y-2 mb-6 bg-gray-50 p-4 rounded-lg">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Course:</span>
                        <span className="font-medium text-gray-700">{user.course}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Year:</span>
                        <span className="font-medium text-gray-700">{user.year}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Role:</span>
                        <span className={`font-medium px-2 py-1 rounded-full text-xs ${
                          user.role === "Learner"
                            ? "bg-blue-100 text-blue-700"
                            : user.role === "Tutor"
                            ? "bg-purple-100 text-purple-700"
                            : "bg-green-100 text-green-700"
                        }`}>
                          {user.role}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleViewDetails(user)}
                      className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-2.5 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all font-medium"
                    >
                      View Details & Verify
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white">Verification Details</h2>
                <p className="text-blue-100 text-sm mt-1">Review user information and documents</p>
              </div>
              <button
                onClick={closeModal}
                className="text-white hover:bg-white/20 p-2 rounded-lg transition-colors"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* User Information */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg text-gray-800 mb-4">User Information</h3>
                  
                  <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                    <div>
                      <label className="text-xs text-gray-500 font-medium uppercase">Full Name</label>
                      <p className="font-medium text-gray-800 mt-1">{selectedUser.full_name}</p>
                    </div>
                    
                    <div>
                      <label className="text-xs text-gray-500 font-medium uppercase">Email</label>
                      <p className="font-medium text-gray-800 mt-1">{selectedUser.email}</p>
                    </div>
                    
                    <div>
                      <label className="text-xs text-gray-500 font-medium uppercase">Course</label>
                      <p className="font-medium text-gray-800 mt-1">{selectedUser.course}</p>
                    </div>
                    
                    <div>
                      <label className="text-xs text-gray-500 font-medium uppercase">Year Level</label>
                      <p className="font-medium text-gray-800 mt-1">{selectedUser.year}</p>
                    </div>

                    <div>
                      <label className="text-xs text-gray-500 font-medium uppercase">Role</label>
                      <p className={`font-medium mt-1 px-3 py-1 rounded-full text-sm w-fit ${
                        selectedUser.role === "Learner"
                          ? "bg-blue-100 text-blue-700"
                          : selectedUser.role === "Tutor"
                          ? "bg-purple-100 text-purple-700"
                          : "bg-green-100 text-green-700"
                      }`}>
                        {selectedUser.role}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Documents */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg text-gray-800 mb-4">Submitted Documents</h3>
                  
                    {/* Inside your Modal Content for each document */}
                    <div>
                      <label className="text-sm text-gray-600 font-medium mb-2 block">Student ID</label>
                      {studentIdPreview ? (
                        <div className="border-2 border-gray-200 rounded-lg overflow-hidden bg-gray-50 flex flex-col items-center p-4">
                          <img
                            src={studentIdPreview}
                            alt="Student ID"
                            className="w-full object-contain max-h-48"
                          />
                          <button
                            onClick={() => setEnlargeImage(studentIdPreview)}
                            className="mt-2 px-4 py-1 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                          >
                            View
                          </button>
                        </div>
                      ) : (
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center bg-gray-50">
                          <p className="text-gray-500 text-sm">No file uploaded</p>
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="text-sm text-gray-600 font-medium mb-2 block">Study Load</label>
                      {studyLoadPreview ? (
                        <div className="border-2 border-gray-200 rounded-lg overflow-hidden bg-gray-50 flex flex-col items-center p-4">
                          <img
                            src={studyLoadPreview}
                            alt="Study Load"
                            className="w-full object-contain max-h-48"
                          />
                          <button
                            onClick={() => setEnlargeImage(studyLoadPreview)}
                            className="mt-2 px-4 py-1 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                          >
                            View
                          </button>
                        </div>
                      ) : (
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center bg-gray-50">
                          <p className="text-gray-500 text-sm">No file uploaded</p>
                        </div>
                      )}
                    </div>

                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-gray-50 p-6 flex space-x-4 border-t">
              <button
                onClick={() => handleVerify(selectedUser.id, 'approved')}
                className="flex-1 bg-green-500 text-white py-3 rounded-lg hover:bg-green-600 transition-colors flex items-center justify-center space-x-2 font-medium"
              >
                <CheckCircleIcon className="w-5 h-5" />
                <span>Approve Account</span>
              </button>
              <button
                onClick={() => handleVerify(selectedUser.id, 'rejected')}
                className="flex-1 bg-red-500 text-white py-3 rounded-lg hover:bg-red-600 transition-colors flex items-center justify-center space-x-2 font-medium"
              >
                <XCircleIcon className="w-5 h-5" />
                <span>Reject</span>
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Enlarged Image Modal */}
      {enlargeImage && (
        <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex items-center justify-center p-4">
          <div className="relative">
            {/* Close button */}
            <button
              onClick={() => setEnlargeImage(null)}
              className="absolute top-2 right-2 text-white bg-black/50 rounded-full p-2 hover:bg-black/70 transition-colors"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>

            <img
              src={enlargeImage}
              alt="Enlarged"
              className="max-h-[90vh] max-w-[90vw] object-contain rounded-lg shadow-2xl"
            />
          </div>
        </div>
      )}
  </div>
);
}