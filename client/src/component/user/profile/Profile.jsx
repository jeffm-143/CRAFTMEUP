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
  ClockIcon,
  PhoneIcon,
  EnvelopeIcon,
  UserCircleIcon,
  CalendarIcon,
  DocumentTextIcon,
  IdentificationIcon,
  ShieldCheckIcon
} from "@heroicons/react/24/outline";
import { useNavigate } from 'react-router-dom';
import api, { getNotifications } from '../../../services/api';
import defaultProfileImage from '../../../default/default.jpg';

// Enhanced Toast Component with Loading Progress Bar
const Toast = ({ message, type = 'success', isLoading = false, onClose }) => {
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    if (!isLoading) {
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
    } else {
      setProgress(100); // Reset progress when loading
    }
  }, [onClose, isLoading]);

  const getStyles = () => {
    if (isLoading) {
      return {
        bg: 'bg-gradient-to-r from-blue-500 to-blue-600',
        progressBg: 'bg-blue-300',
        icon: <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
      };
    }
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
      icon: <XCircleIcon className="h-5 w-5 text-white" />
    };
  };

  const styles = getStyles();

  return (
    <div className="fixed top-4 right-4 z-50 animate-slideIn">
      <div className={`${styles.bg} text-white px-5 py-3.5 rounded-xl shadow-2xl min-w-[300px] overflow-hidden`}>
        <div className="flex items-center gap-3 mb-2">
          {styles.icon}
          <p className="font-semibold text-sm flex-1">{message}</p>
          {!isLoading && (
            <button onClick={onClose} className="text-white/80 hover:text-white transition-colors">
              <XMarkIcon className="h-5 w-5" />
            </button>
          )}
        </div>
        
        {/* Progress Bar */}
        {!isLoading && (
          <div className="w-full h-1 bg-white/20 rounded-full overflow-hidden">
            <div 
              className={`h-full ${styles.progressBg} transition-all duration-100 ease-linear`}
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        )}
      </div>
    </div>
  );
};

// Info Field Component
const InfoField = ({ icon, label, value, name, type = "text", isEditing, onChange, options, maxLength, rows, max, placeholder }) => {
  return (
    <div className="space-y-2">
      <label className="flex items-center gap-2 text-xs font-bold text-gray-600 uppercase tracking-wide">
        <span className="text-blue-600">{icon}</span>
        {label}
      </label>
      
      {isEditing ? (
        type === 'select' ? (
          <select
            name={name}
            value={value}
            onChange={onChange}
            className="w-full bg-white border-2 border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
          >
            {options}
          </select>
        ) : type === 'textarea' ? (
          <div>
            <textarea
              name={name}
              value={value}
              onChange={onChange}
              rows={rows}
              maxLength={maxLength}
              placeholder={placeholder}
              className="w-full bg-white border-2 border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all resize-none"
            />
            {maxLength && (
              <p className="text-xs text-gray-400 mt-1.5 text-right">
                {value?.length || 0}/{maxLength}
              </p>
            )}
          </div>
        ) : (
          <input
            type={type}
            name={name}
            value={value}
            onChange={onChange}
            max={max}
            placeholder={placeholder}
            className="w-full bg-white border-2 border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
          />
        )
      ) : (
        <div className="bg-gradient-to-r from-gray-50 to-gray-100/50 border border-gray-200 rounded-xl px-4 py-3.5 min-h-[48px] flex items-center">
          <p className="text-sm font-medium text-gray-900">
            {value || <span className="text-gray-400 italic">Not provided</span>}
          </p>
        </div>
      )}
    </div>
  );
};

export default function Profile() {
  const navigate = useNavigate();
  
  const [userData, setUserData] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState({});
  const [loading, setLoading] = useState(true);
  const [profileImage, setProfileImage] = useState(defaultProfileImage);
  const [tempProfileImage, setTempProfileImage] = useState(defaultProfileImage);
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

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
            phone: response.data.phone || '',
            gender: response.data.gender || '',
            date_of_birth: response.data.date_of_birth || '',
            bio: response.data.bio || '',
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
          
          // Fetch unread notifications count
          try {
            const notificationsResponse = await getNotifications(user.id);
            const unread = notificationsResponse.filter(n => !n.read).length;
            setUnreadCount(unread);
          } catch (notifError) {
            console.error('Error fetching notifications:', notifError);
          }
        }
      } catch (error) {
        console.error('Error fetching user data:', error.response?.data || error.message);
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  useEffect(() => {
    if (userData) {
      let formattedDate = '';
      if (userData.date_of_birth) {
        const date = new Date(userData.date_of_birth);
        if (!isNaN(date.getTime())) {
          formattedDate = date.toISOString().split('T')[0];
        }
      }
      
      setEditedData({
        full_name: userData.full_name || '',
        phone: userData.phone || '',
        gender: userData.gender || '',
        date_of_birth: formattedDate,
        bio: userData.bio || ''
      });
    }
  }, [userData]);

  const handleEdit = () => {
    setIsEditing(true);
    setTempProfileImage(profileImage);
  };

  const handleSave = async () => {
    setIsSaving(true);
    setToast({ message: 'Updating your profile...', type: 'success', isLoading: true });
    
    try {
      // Prepare profile data
      let profileData = {
        full_name: editedData.full_name,
        phone: editedData.phone,
        gender: editedData.gender,
        date_of_birth: editedData.date_of_birth,
        bio: editedData.bio
      };

      // Only send image if it was actually changed
      if (tempProfileImage !== profileImage && tempProfileImage.startsWith('data:')) {
        profileData.profileImage = tempProfileImage;
        console.log('Saving new profile image');
      }

      console.log('Profile data being sent:', profileData);

      const response = await api.put(`/auth/update-profile/${userData.id}`, profileData);
      console.log('Update response:', response.data);

      const updatedUser = {
        ...userData,
        full_name: editedData.full_name,
        phone: editedData.phone,
        gender: editedData.gender,
        date_of_birth: editedData.date_of_birth,
        bio: editedData.bio,
        profileImage: tempProfileImage
      };
      
      setUserData(updatedUser);
      setProfileImage(tempProfileImage);
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setIsEditing(false);
      setIsSaving(false);
      
      // Close the loading toast first
      setToast(null);
      
      // Show success toast after a brief delay
      setTimeout(() => {
        setToast({ message: 'Profile updated successfully!', type: 'success', isLoading: false });
      }, 100);
    } catch (error) {
      console.error('Error updating profile:', error);
      setIsSaving(false);
      
      // Close the loading toast first
      setToast(null);
      
      // Show error toast after a brief delay
      setTimeout(() => {
        setToast({ 
          message: 'Failed to update profile. Please try again.', 
          type: 'error',
          isLoading: false 
        });
      }, 100);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setTempProfileImage(profileImage);
    
    let formattedDate = '';
    if (userData.date_of_birth) {
      const date = new Date(userData.date_of_birth);
      if (!isNaN(date.getTime())) {
        formattedDate = date.toISOString().split('T')[0];
      }
    }
    
    setEditedData({
      full_name: userData.full_name || '',
      phone: userData.phone || '',
      gender: userData.gender || '',
      date_of_birth: formattedDate,
      bio: userData.bio || ''
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
        { name: "Find Classes", icon: <MagnifyingGlassIcon className="h-5 w-5" />, path: "/find-classes" },
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
        { name: "My Classes", icon: <ClipboardDocumentListIcon className="h-5 w-5" />, path: "/my-classes" },
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
      { name: "My Classes", icon: <ClipboardDocumentListIcon className="h-5 w-5" />, path: "/my-classes" },
      { name: "Find Classes", icon: <MagnifyingGlassIcon className="h-5 w-5" />, path: "/find-classes" },
      { name: "Saved", icon: <BookmarkIcon className="h-5 w-5" />, path: "/saved" },
      { name: "Wallet", icon: <WalletIcon className="h-5 w-5" />, path: "/wallet" },
      { name: "Transactions", icon: <ReceiptRefundIcon className="h-5 w-5" />, path: "/transactions" },
      { name: "Feedbacks & Ratings", icon: <ChatBubbleOvalLeftIcon className="h-5 w-5" />, path: "/view-past-feedback" },
      { name: "Log Out", icon: <ArrowRightOnRectangleIcon className="h-5 w-5" />, path: "/" },
    ];
  })();

  const renderVerificationStatus = () => {
    if (userData?.verification_status === 'approved') {
      return (
        <div className="bg-gradient-to-br from-green-50 via-emerald-50 to-green-50 border-2 border-green-300 rounded-2xl p-5 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl p-3 shadow-md">
              <CheckCircleIcon className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-bold text-green-900 text-base mb-1">Account Verified</h4>
              <p className="text-sm text-green-700 leading-relaxed">Your account has been successfully verified. You have full access to all platform features.</p>
            </div>
          </div>
        </div>
      );
    } else if (userData?.verification_status === 'rejected') {
      return (
        <div className="bg-gradient-to-br from-red-50 via-rose-50 to-red-50 border-2 border-red-300 rounded-2xl p-5 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="bg-gradient-to-br from-red-500 to-rose-600 rounded-xl p-3 shadow-md">
              <XCircleIcon className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-bold text-red-900 text-base mb-1">Verification Rejected</h4>
              <p className="text-sm text-red-700 leading-relaxed">Your verification request was rejected. Please contact our support team for assistance.</p>
            </div>
          </div>
        </div>
      );
    }
    
    return (
      <div className="bg-gradient-to-br from-yellow-50 via-amber-50 to-yellow-50 border-2 border-yellow-300 rounded-2xl p-5 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="bg-gradient-to-br from-yellow-500 to-amber-600 rounded-xl p-3 shadow-md">
            <ClockIcon className="h-6 w-6 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-bold text-yellow-900 text-base mb-1">Verification Pending</h4>
            <p className="text-sm text-yellow-700 leading-relaxed">Your account verification is in progress. This typically takes 1-2 business days.</p>
          </div>
        </div>
      </div>
    );
  };

  const formatDateForDisplay = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

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
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          isLoading={toast.isLoading}
          onClose={() => setToast(null)}
        />
      )}

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
          <button onClick={() => setIsSidebarOpen(false)} className="text-white hover:bg-white/10 p-1 rounded-lg transition-colors">
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>
        <nav className="p-3 space-y-1 flex-1 overflow-y-auto">
          {navItems.map((item) => (
            <button
              key={item.name}
              onClick={() => { navigate(item.path); setIsSidebarOpen(false); }}
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
        <div className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden" onClick={() => setIsSidebarOpen(false)}></div>
      )}

      {/* Main Content */}
      <div className="flex-1 lg:ml-64 overflow-y-auto">
        <div className="p-4 sm:p-6 bg-gradient-to-r from-blue-600 to-indigo-600 text-white sticky top-0 z-20 shadow-lg">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden flex-shrink-0 hover:bg-white/10 p-2 rounded-lg transition-colors">
                <Bars3Icon className="h-6 w-6" />
              </button>
              <h1 className="text-lg sm:text-xl font-semibold truncate">Profile</h1>
            </div>
            <button onClick={() => navigate('/notification')} className="flex-shrink-0 hover:bg-white/10 p-2 rounded-lg transition-colors relative">
              <BellIcon className="h-6 w-6" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
            
            {/* Profile Header Card */}
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              <div className="relative">
                <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 h-32"></div>
                <div className="absolute -bottom-14 left-1/2 transform -translate-x-1/2">
                  <div className="relative">
                    <img
                      src={isEditing ? tempProfileImage : profileImage}
                      alt="Profile"
                      className="w-28 h-28 rounded-full border-4 border-white shadow-xl object-cover bg-white"
                    />
                    {isEditing && (
                      <label
                        htmlFor="profileImageInput"
                        className="absolute bottom-0 right-0 bg-blue-600 text-white p-2.5 rounded-full shadow-lg hover:bg-blue-700 transition-all cursor-pointer hover:scale-110"
                      >
                        <CameraIcon className="h-5 w-5" />
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
                </div>
              </div>
              
              <div className="pt-16 pb-6 px-6 text-center">
                <h2 className="text-2xl font-bold text-gray-900 mb-1">{userData?.full_name}</h2>
                <p className="text-sm text-gray-500 mb-3 flex items-center justify-center gap-1.5">
                  <EnvelopeIcon className="h-4 w-4" />
                  {userData?.email}
                </p>
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-700 rounded-full text-sm font-semibold shadow-sm">
                  <IdentificationIcon className="h-4 w-4" />
                  {userData?.role}
                </div>
                
                {!isEditing && (
                  <button
                    onClick={handleEdit}
                    className="mt-5 px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 text-sm font-semibold transition-all shadow-md hover:shadow-lg"
                  >
                    Edit Profile
                  </button>
                )}
              </div>
            </div>

            {/* Personal Information Card */}
            <div className="bg-white rounded-2xl shadow-lg p-6 space-y-6">
              <div className="flex items-center gap-3 pb-4 border-b-2 border-gray-100">
                <div className="bg-blue-100 rounded-xl p-2.5">
                  <UserCircleIcon className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">Personal Information</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <InfoField
                  icon={<UserIcon className="h-4 w-4" />}
                  label="Full Name"
                  name="full_name"
                  value={isEditing ? editedData.full_name : userData?.full_name}
                  isEditing={isEditing}
                  onChange={handleChange}
                  placeholder="Enter your full name"
                />
                
                <InfoField
                  icon={<EnvelopeIcon className="h-4 w-4" />}
                  label="Email Address"
                  value={userData?.email}
                  isEditing={false}
                />
                
                <InfoField
                  icon={<PhoneIcon className="h-4 w-4" />}
                  label="Phone Number"
                  name="phone"
                  type="tel"
                  value={isEditing ? editedData.phone : userData?.phone}
                  isEditing={isEditing}
                  onChange={handleChange}
                  placeholder="+1 234 567 8900"
                />
                
                <InfoField
                  icon={<UserCircleIcon className="h-4 w-4" />}
                  label="Gender"
                  name="gender"
                  type="select"
                  value={isEditing ? editedData.gender : userData?.gender}
                  isEditing={isEditing}
                  onChange={handleChange}
                  options={
                    <>
                      <option value="">Select Gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                    </>
                  }
                />
                
                <InfoField
                  icon={<CalendarIcon className="h-4 w-4" />}
                  label="Date of Birth"
                  name="date_of_birth"
                  type="date"
                  value={isEditing ? editedData.date_of_birth : formatDateForDisplay(userData?.date_of_birth)}
                  isEditing={isEditing}
                  onChange={handleChange}
                  max={new Date().toISOString().split('T')[0]}
                />
              </div>
            </div>

            {/* About Me Card */}
            <div className="bg-white rounded-2xl shadow-lg p-6 space-y-6">
              <div className="flex items-center gap-3 pb-4 border-b-2 border-gray-100">
                <div className="bg-purple-100 rounded-xl p-2.5">
                  <DocumentTextIcon className="h-6 w-6 text-purple-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">About Me</h3>
              </div>
              
              <InfoField
                icon={<DocumentTextIcon className="h-4 w-4" />}
                label="Bio"
                name="bio"
                type="textarea"
                value={isEditing ? editedData.bio : userData?.bio}
                isEditing={isEditing}
                onChange={handleChange}
                rows={5}
                maxLength={300}
                placeholder="Tell us about yourself..."
              />
            </div>

            {/* Account Status Card */}
            <div className="bg-white rounded-2xl shadow-lg p-6 space-y-6">
              <div className="flex items-center gap-3 pb-4 border-b-2 border-gray-100">
                <div className="bg-green-100 rounded-xl p-2.5">
                  <ShieldCheckIcon className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">Account Status</h3>
              </div>
              
              {renderVerificationStatus()}
            </div>

            {/* Action Buttons */}
            {isEditing && (
              <div className="flex flex-col sm:flex-row justify-end gap-3">
                <button
                  onClick={handleCancel}
                  disabled={isSaving}
                  className="px-6 py-3 border-2 border-gray-300 rounded-xl hover:bg-gray-50 text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:border-gray-400"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 text-sm font-semibold transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSaving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      Saving...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

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
      `}</style>
    </div>
  );
}