import React, { useState, useEffect } from "react";
import {
  HomeIcon,
  UserIcon,
  ChatBubbleLeftIcon,
  ClipboardDocumentListIcon,
  MagnifyingGlassIcon,
  WalletIcon,
  ReceiptRefundIcon,
  ChatBubbleOvalLeftIcon,
  ArrowRightOnRectangleIcon,
  BellIcon,
  Bars3Icon,
  XMarkIcon,
  BookmarkIcon,
  CameraIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon
} from "@heroicons/react/24/outline";
import { useNavigate } from 'react-router-dom';
import api from '../../../services/api';
import defaultProfileImage from '../../../default/default.jpg';

export default function Profile() {
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [userData, setUserData] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState({});
  const [loading, setLoading] = useState(true);
  const [profileImage, setProfileImage] = useState(defaultProfileImage);
  const [tempProfileImage, setTempProfileImage] = useState(defaultProfileImage);
  const [isSaving, setIsSaving] = useState(false);

  // Fetch user data from API
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          const user = JSON.parse(storedUser);
          console.log('Fetching data for user ID:', user.id);
          
          const response = await api.get(`/auth/user/${user.id}`);
          console.log('Full API Response:', response.data);
          
          const freshUserData = {
            id: response.data.id,
            full_name: response.data.full_name,
            email: response.data.email,
            course: response.data.course || 'Not specified',
            year: response.data.year || 'Not specified',
            role: response.data.role,
            verified: response.data.verified,
            verification_status: response.data.verification_status,
            profileImage: response.data.profileImage
          };
          
          console.log('Processed User Data:', freshUserData);
          
          setUserData(freshUserData);
          setProfileImage(freshUserData.profileImage || defaultProfileImage);
          setTempProfileImage(freshUserData.profileImage || defaultProfileImage);
          localStorage.setItem('user', JSON.stringify(freshUserData));
          setLoading(false);
        }
      } catch (error) {
        console.error('Error fetching user data:', error.response?.data || error.message);
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  // Update editedData when userData changes
  useEffect(() => {
  if (userData) {
    setEditedData({
      full_name: userData.full_name || '',
      course: userData.course === 'Not specified' ? '' : (userData.course || ''),
      year: userData.year === 'Not specified' ? '' : (userData.year || '')
    });
  }
}, [userData]);

  const handleEdit = () => {
  setIsEditing(true);
  setTempProfileImage(profileImage);
  // IMPORTANT: Make sure editedData matches exactly with option values
  setEditedData({
    full_name: userData.full_name || '',
    course: userData.course === 'Not specified' ? '' : (userData.course || ''),
    year: userData.year === 'Not specified' ? '' : (userData.year || '')
  });
};

  const handleSave = async () => {
  setIsSaving(true);
  try {
    // Prepare profile data
    let profileData = {
      full_name: editedData.full_name,
      course: editedData.course,
      year: editedData.year
    };

    // IMPORTANT: Only send image if it was actually changed
    // Check if tempProfileImage is different AND is a new base64 (starts with 'data:')
    if (tempProfileImage !== profileImage && tempProfileImage.startsWith('data:')) {
      profileData.profileImage = tempProfileImage;
      console.log('Saving new profile image');
    } else if (tempProfileImage === profileImage) {
      console.log('Image unchanged, not sending');
      // Don't send profileImage if it hasn't changed
    }

    console.log('Profile data being sent:', profileData);

    // Update profile with image in same request
    const response = await api.put(`/auth/update-profile/${userData.id}`, profileData);
    console.log('Update response:', response.data);

    const updatedUser = {
      ...userData,
      full_name: editedData.full_name,
      course: editedData.course,
      year: editedData.year,
      profileImage: tempProfileImage // Use tempProfileImage to persist the change
    };
    
    setUserData(updatedUser);
    setProfileImage(tempProfileImage);
    localStorage.setItem('user', JSON.stringify(updatedUser));
    setIsEditing(false);
    alert('Profile updated successfully!');
  } catch (error) {
    console.error('Error updating profile:', error);
    alert('Failed to update profile: ' + error.message);
  } finally {
    setIsSaving(false);
  }
};

  const handleCancel = () => {
  setIsEditing(false);
  setTempProfileImage(profileImage);
  // Reset to current userData values (not 'Not specified')
  setEditedData({
    full_name: userData.full_name || '',
    course: userData.course === 'Not specified' ? '' : (userData.course || ''),
    year: userData.year === 'Not specified' ? '' : (userData.year || '')
  });
};

  const handleChange = (e) => {
    setEditedData({
      ...editedData,
      [e.target.name]: e.target.value
    });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setTempProfileImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const role = userData?.role?.toLowerCase() || '';

  const navItems = (() => {
    if (role === 'learner') {
      return [
        { name: "Home", icon: <HomeIcon className="h-5 w-5" />, path: "/dashboard" },
        { name: "Profile", icon: <UserIcon className="h-5 w-5" />, path: "/profile" },
        { name: "Messages", icon: <ChatBubbleLeftIcon className="h-5 w-5" />, path: "/messages" },
        { name: "Find Services", icon: <MagnifyingGlassIcon className="h-5 w-5" />, path: "/find-services" },
        { name: "Saved", icon: <BookmarkIcon className="h-5 w-5" />, path: "/saved" },
        { name: "Wallet", icon: <WalletIcon className="h-5 w-5" />, path: "/wallet" },
        { name: "Transactions", icon: <ReceiptRefundIcon className="h-5 w-5" />, path: "/transactions" },
        { name: "Feedbacks & Ratings", icon: <ChatBubbleOvalLeftIcon className="h-5 w-5" />, path: "/view-past-feedback" },
        { name: "Log Out", icon: <ArrowRightOnRectangleIcon className="h-5 w-5" />, path: "/" },
      ];
    }

    if (role === 'tutor') {
      return [
        { name: "Home", icon: <HomeIcon className="h-5 w-5" />, path: "/dashboard" },
        { name: "Profile", icon: <UserIcon className="h-5 w-5" />, path: "/profile" },
        { name: "Messages", icon: <ChatBubbleLeftIcon className="h-5 w-5" />, path: "/messages" },
        { name: "My Services", icon: <ClipboardDocumentListIcon className="h-5 w-5" />, path: "/my-services" },
        { name: "Wallet", icon: <WalletIcon className="h-5 w-5" />, path: "/wallet" },
        { name: "Transactions", icon: <ReceiptRefundIcon className="h-5 w-5" />, path: "/transactions" },
        { name: "Feedbacks & Ratings", icon: <ChatBubbleOvalLeftIcon className="h-5 w-5" />, path: "/view-past-feedback" },
        { name: "Log Out", icon: <ArrowRightOnRectangleIcon className="h-5 w-5" />, path: "/" },
      ];
    }

    return [
      { name: "Home", icon: <HomeIcon className="h-5 w-5" />, path: "/dashboard" },
      { name: "Profile", icon: <UserIcon className="h-5 w-5" />, path: "/profile" },
      { name: "Messages", icon: <ChatBubbleLeftIcon className="h-5 w-5" />, path: "/messages" },
      { name: "My Services", icon: <ClipboardDocumentListIcon className="h-5 w-5" />, path: "/my-services" },
      { name: "Find Services", icon: <MagnifyingGlassIcon className="h-5 w-5" />, path: "/find-services" },
      { name: "Saved", icon: <BookmarkIcon className="h-5 w-5" />, path: "/saved" },
      { name: "Wallet", icon: <WalletIcon className="h-5 w-5" />, path: "/wallet" },
      { name: "Transactions", icon: <ReceiptRefundIcon className="h-5 w-5" />, path: "/transactions" },
      { name: "Feedbacks & Ratings", icon: <ChatBubbleOvalLeftIcon className="h-5 w-5" />, path: "/view-past-feedback" },
      { name: "Log Out", icon: <ArrowRightOnRectangleIcon className="h-5 w-5" />, path: "/" },
    ];
  })();

  const renderVerificationStatus = () => {
    console.log('Verification Status:', userData?.verification_status);
    
    if (userData?.verification_status === 'approved') {
      return (
        <div className="flex items-center gap-2 border rounded-lg px-3 py-2 bg-green-50 border-green-200">
          <CheckCircleIcon className="h-5 w-5 text-green-500" />
          <span className="text-sm text-green-700 font-medium">Account Verified - Your account has been fully verified</span>
        </div>
      );
    } else if (userData?.verification_status === 'rejected') {
      return (
        <div className="flex items-center gap-2 border rounded-lg px-3 py-2 bg-red-50 border-red-200">
          <XCircleIcon className="h-5 w-5 text-red-500" />
          <span className="text-sm text-red-700 font-medium">Verification Rejected - Please contact support</span>
        </div>
      );
    }
    
    return (
      <div className="flex items-center gap-2 border rounded-lg px-3 py-2 bg-yellow-50 border-yellow-200">
        <ClockIcon className="h-5 w-5 text-yellow-500" />
        <span className="text-sm text-yellow-700 font-medium">Verification Pending - Your account is awaiting verification</span>
      </div>
    );
  };

  const renderFormInputs = () => (
  <div className="p-4 sm:p-6 space-y-4">
    <div>
      <label className="text-gray-600 text-sm">Full Name</label>
      <input
        type="text"
        name="full_name"
        value={editedData.full_name || ''}
        onChange={handleChange}
        readOnly={!isEditing}
        className={`w-full border rounded-lg px-3 py-2 mt-1 text-sm ${
          isEditing ? 'bg-white border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500' : 'bg-gray-50'
        }`}
      />
    </div>

    <div>
      <label className="text-gray-600 text-sm">School Email</label>
      <div className="flex items-center border rounded-lg px-3 py-2 mt-1 justify-between bg-gray-50">
        <span className="text-sm">{userData?.email || ''}</span>
      </div>
      <p className="text-xs text-gray-500 mt-1">Verified</p>
    </div>

    <div>
      <label className="text-gray-600 text-sm">Course</label>
      {isEditing ? (
        <select
          name="course"
          value={editedData.course || ''}
          onChange={handleChange}
          className="w-full border border-blue-300 rounded-lg px-3 py-2 mt-1 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="BS IN ACCOUNTANCY">BS IN ACCOUNTANCY</option>
          <option value="BS IN BUSINESS ADMINISTRATION">BS IN BUSINESS ADMINISTRATION</option>
          <option value="BS IN CRIMINOLOGY">BS IN CRIMINOLOGY</option>
          <option value="BS IN CUSTOMS ADMINISTRATION">BS IN CUSTOMS ADMINISTRATION</option>
          <option value="BS IN INFORMATION TECHNOLOGY">BS IN INFORMATION TECHNOLOGY</option>
          <option value="BS IN COMPUTER SCIENCE">BS IN COMPUTER SCIENCE</option>
          <option value="BS IN OFFICE ADMINISTRATION">BS IN OFFICE ADMINISTRATION</option>
          <option value="BS IN SOCIAL WORK">BS IN SOCIAL WORK</option>
          <option value="BACHELOR OF SECONDARY EDUCATION">BACHELOR OF SECONDARY EDUCATION</option>
          <option value="BACHELOR OF ELEMENTARY EDUCATION">BACHELOR OF ELEMENTARY EDUCATION</option>
        </select>
      ) : (
        <div className="w-full border rounded-lg px-3 py-2 mt-1 text-sm bg-gray-50 flex items-center">
          <span>{userData?.course === 'Not specified' ? 'Not specified' : userData?.course || ''}</span>
        </div>
      )}
    </div>

    <div>
      <label className="text-gray-600 text-sm">Year Level</label>
      {isEditing ? (
        <select
          name="year"
          value={editedData.year || ''}
          onChange={handleChange}
          className="w-full border border-blue-300 rounded-lg px-3 py-2 mt-1 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="1st Year">1st Year</option>
          <option value="2nd Year">2nd Year</option>
          <option value="3rd Year">3rd Year</option>
          <option value="4th Year">4th Year</option>
        </select>
      ) : (
        <div className="w-full border rounded-lg px-3 py-2 mt-1 text-sm bg-gray-50 flex items-center">
          <span>{userData?.year === 'Not specified' ? 'Not specified' : userData?.year || ''}</span>
        </div>
      )}
    </div>

    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pt-2 gap-2">
      <span className="text-gray-700 font-medium text-sm">Role: {userData?.role || 'User'}</span>
    </div>

    {renderVerificationStatus()}

    {isEditing && (
      <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3">
        <button
          onClick={handleCancel}
          disabled={isSaving}
          className="px-4 py-2 border rounded-lg hover:bg-gray-50 text-sm transition-colors disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm transition-colors disabled:opacity-50"
        >
          {isSaving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    )}
  </div>
);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-b from-blue-50 to-white min-h-screen flex flex-col lg:flex-row w-full">
      {/* Sidebar - Desktop */}
      <div className="hidden lg:flex fixed inset-y-0 left-0 bg-gradient-to-b from-gray-50 to-white w-64 flex-col shadow-xl border-r z-30">
        <div className="p-4 bg-gradient-to-r from-blue-600 to-indigo-600">
          <h2 className="font-semibold text-white text-lg">Menu</h2>
        </div>

        <nav className="p-3 space-y-1 flex-1 overflow-y-auto">
          {navItems.map((item) => (
            <button
              key={item.name}
              onClick={() => navigate(item.path)}
              className="flex items-center w-full p-3 text-gray-600 hover:text-blue-600 rounded-xl transition-all duration-200 group hover:bg-gradient-to-r from-blue-50 to-indigo-50"
            >
              <div className="bg-white p-2 rounded-lg shadow-sm group-hover:scale-110 transition-transform duration-200">
                {item.icon}
              </div>
              <span className="ml-3 font-medium text-sm">{item.name}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Sidebar - Mobile */}
      <div className={`fixed inset-y-0 left-0 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} bg-gradient-to-b from-gray-50 to-white w-64 transition-transform duration-300 ease-in-out z-40 lg:hidden flex flex-col shadow-xl border-r`}>
        <div className="p-4 bg-gradient-to-r from-blue-600 to-indigo-600 flex justify-between items-center">
          <h2 className="font-semibold text-white">Menu</h2>
          <button 
            onClick={() => setIsSidebarOpen(false)}
            className="text-white hover:bg-white/10 p-1 rounded-lg transition-colors"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <nav className="p-3 space-y-1 flex-1 overflow-y-auto">
          {navItems.map((item) => (
            <button
              key={item.name}
              onClick={() => {
                navigate(item.path);
                setIsSidebarOpen(false);
              }}
              className="flex items-center w-full p-3 text-gray-600 hover:text-blue-600 rounded-xl transition-all duration-200 group hover:bg-gradient-to-r from-blue-50 to-indigo-50"
            >
              <div className="bg-white p-2 rounded-lg shadow-sm group-hover:scale-110 transition-transform duration-200">
                {item.icon}
              </div>
              <span className="ml-3 font-medium text-sm">{item.name}</span>
            </button>
          ))}
        </nav>
      </div>

      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        ></div>
      )}

      {/* Main Content */}
      <div className="flex-1 lg:ml-64 overflow-y-auto">
        <div className="p-4 sm:p-6 bg-gradient-to-r from-blue-600 to-indigo-600 text-white sticky top-0 z-20 shadow-lg">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <button 
                onClick={() => setIsSidebarOpen(true)}
                className="lg:hidden flex-shrink-0 hover:bg-white/10 p-2 rounded-lg transition-colors"
              >
                <Bars3Icon className="h-6 w-6" />
              </button>
              <h1 className="text-lg sm:text-xl font-semibold truncate">Profile</h1>
            </div>
            <button 
              onClick={() => navigate('/notification')} 
              className="flex-shrink-0 hover:bg-white/10 p-2 rounded-lg transition-colors relative"
            >
              <BellIcon className="h-6 w-6" />
              <span className="absolute -top-1 -right-1 bg-red-500 w-2 h-2 rounded-full"></span>
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="w-full px-4 py-4 sm:py-6">
            <div className="bg-white rounded-2xl shadow-sm">
              <div className="flex flex-col items-center py-6 sm:py-8 px-4 border-b">
                <div className="relative">
                  <img
                    src={isEditing ? tempProfileImage : profileImage}
                    alt="Profile"
                    className="w-20 sm:w-24 h-20 sm:h-24 rounded-full border-4 border-white shadow-lg object-cover"
                  />
                  {isEditing && (
                    <label
                      htmlFor="profileImageInput"
                      className="absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-full shadow-lg hover:bg-blue-700 transition-colors cursor-pointer"
                    >
                      <CameraIcon className="h-4 sm:h-5 w-4 sm:w-5" />
                      <input
                        id="profileImageInput"
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>

                {isEditing && (
                  <button 
                    onClick={() => document.getElementById('profileImageInput').click()}
                    className="mt-3 text-blue-600 font-medium text-xs sm:text-sm hover:text-blue-700 transition-colors"
                  >
                    Change Photo
                  </button>
                )}

                {!isEditing && (
                  <button
                    onClick={handleEdit}
                    className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm transition-colors"
                  >
                    Edit Profile
                  </button>
                )}
              </div>

              {renderFormInputs()}
            </div>

            <div className="h-4 sm:h-6"></div>
          </div>
        </div>
      </div>
    </div>
  );
}