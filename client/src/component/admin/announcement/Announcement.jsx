import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  HomeIcon,
  UsersIcon,
  WalletIcon,
  MegaphoneIcon,
  MagnifyingGlassIcon,
  ArrowRightOnRectangleIcon,
  CheckCircleIcon,
  TrashIcon,
  PencilIcon,
  XMarkIcon
} from "@heroicons/react/24/outline";
import { createAnnouncement, getAnnouncements, deleteAnnouncement, updateAnnouncement } from '../../../services/api';
import AdminSidebar from "../../AdminSidebar";

export default function Announcements() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    targetAudience: 'All Users',
    expirationDate: ''
  });
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [modalSearchQuery, setModalSearchQuery] = useState('');
  const [showAllModal, setShowAllModal] = useState(false);
  const [notification, setNotification] = useState({ show: false, message: '', type: '' });

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      console.log('📋 Fetching announcements...');
      const data = await getAnnouncements();
      
      const validAnnouncements = Array.isArray(data) ? data : [];
      setAnnouncements(validAnnouncements);
      console.log('✅ Announcements loaded:', validAnnouncements);
    } catch (error) {
      console.error('❌ Error fetching announcements:', error);
      setAnnouncements([]);
    }
  };

  const showNotification = (message, type = 'success') => {
    setNotification({ show: true, message, type });
    setTimeout(() => {
      setNotification({ show: false, message: '', type: '' });
    }, 3000);
  };

  const handleEdit = (announcement) => {
    setEditingAnnouncement(announcement);
    setFormData({
      title: announcement.title,
      content: announcement.content,
      targetAudience: announcement.target_audience,
      expirationDate: announcement.expiration_date || ''
    });
    setShowAllModal(false);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this announcement?')) {
      try {
        await deleteAnnouncement(id);
        fetchAnnouncements();
        showNotification('Announcement deleted successfully', 'success');
      } catch (error) {
        showNotification('Failed to delete announcement', 'error');
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editingAnnouncement) {
        await updateAnnouncement(editingAnnouncement.id, formData);
        setEditingAnnouncement(null);
        showNotification('Announcement updated successfully!', 'success');
      } else {
        await createAnnouncement(formData);
        showNotification('Announcement created successfully!', 'success');
      }
      setFormData({
        title: '',
        content: '',
        targetAudience: 'All Users',
        expirationDate: ''
      });
      fetchAnnouncements();
    } catch (error) {
      showNotification(editingAnnouncement ? 'Failed to update announcement' : 'Failed to create announcement', 'error');
    } finally {
      setLoading(false);
    }
  };

  const validAnnouncements = Array.isArray(announcements) ? announcements : [];

  // Filter announcements based on search query
  const filteredAnnouncements = validAnnouncements.filter(announcement => 
    announcement.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    announcement.content?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    announcement.target_audience?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Filter for modal search
  const modalFilteredAnnouncements = validAnnouncements.filter(announcement => 
    announcement.title?.toLowerCase().includes(modalSearchQuery.toLowerCase()) ||
    announcement.content?.toLowerCase().includes(modalSearchQuery.toLowerCase()) ||
    announcement.target_audience?.toLowerCase().includes(modalSearchQuery.toLowerCase())
  );

  // Show only first 5 in sidebar
  const recentAnnouncements = filteredAnnouncements.slice(0, 5);

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-50 to-white overflow-hidden">
      {/* Sidebar */}
      <div className="flex-shrink-0">
        <AdminSidebar />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 shadow-sm flex-shrink-0">
          <div className="px-8 py-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-lg">
                <MegaphoneIcon className="w-8 h-8 text-white" />
              </div>
              <div>
                <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
                  Post Announcement
                </h2>
                <p className="text-gray-500 text-sm mt-2">Create and manage platform announcements</p>
              </div>
            </div>
          </div>
        </div>

        {/* Notification Toast */}
        {notification.show && (
          <div className="fixed top-4 right-4 z-50 animate-slideIn">
            <div className={`flex items-center gap-3 px-6 py-4 rounded-xl shadow-lg ${
              notification.type === 'success' 
                ? 'bg-green-500 text-white' 
                : 'bg-red-500 text-white'
            }`}>
              {notification.type === 'success' ? (
                <CheckCircleIcon className="w-6 h-6" />
              ) : (
                <XMarkIcon className="w-6 h-6" />
              )}
              <p className="font-semibold">{notification.message}</p>
              <div className="ml-2 w-1 h-8 bg-white/30 rounded-full overflow-hidden">
                <div className="h-full bg-white animate-shrink"></div>
              </div>
            </div>
          </div>
        )}

        {/* Content Area - Fixed height with independent scrolling */}
        <div className="flex-1 overflow-hidden">
          <div className="h-full p-8 overflow-y-auto">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-7xl">
              {/* Form Section - Scrollable */}
              <div className="lg:col-span-2">
                <div className="bg-white rounded-2xl shadow-sm border-2 border-gray-100 overflow-hidden">
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b-2 border-blue-100">
                    <h2 className="text-xl font-bold text-gray-800">
                      {editingAnnouncement ? '✏️ Edit Announcement' : '📝 Create New Announcement'}
                    </h2>
                  </div>

                  <form onSubmit={handleSubmit} className="p-6 pb-32 space-y-6">
                    {/* Title */}
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">
                        Announcement Title
                      </label>
                      <input
                        type="text"
                        placeholder="e.g., Service Notification Policy Update"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                        required
                      />
                    </div>

                    {/* Content */}
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Content</label>
                      <textarea
                        rows="6"
                        placeholder="Enter announcement content, guidelines, news, reminders, policies, or updates..."
                        value={formData.content}
                        onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                        className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all resize-none"
                        required
                      ></textarea>
                      <div className="flex justify-end text-xs text-gray-400 mt-2">
                        {formData.content.length}/1000 characters
                      </div>
                    </div>

                    {/* Target Audience */}
                    <div>
                      <p className="text-sm font-bold text-gray-700 mb-3">Target Audience</p>
                      <div className="grid grid-cols-3 gap-3">
                        {['All Users', 'Tutors Only', 'Learners Only'].map((audience) => (
                          <label
                            key={audience}
                            className={`flex items-center justify-center gap-2 px-4 py-3 border-2 rounded-xl cursor-pointer transition-all ${
                              formData.targetAudience === audience
                                ? 'border-blue-500 bg-blue-50 text-blue-700 font-semibold'
                                : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                            }`}
                          >
                            <input
                              type="radio"
                              name="audience"
                              value={audience}
                              checked={formData.targetAudience === audience}
                              onChange={(e) => setFormData({ ...formData, targetAudience: e.target.value })}
                              className="sr-only"
                            />
                            <span className="text-sm">{audience}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Expiration Date */}
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">
                        Expiration Date (Optional)
                      </label>
                      <input
                        type="text"
                        placeholder="mm/dd/yyyy"
                        value={formData.expirationDate}
                        onChange={(e) => setFormData({ ...formData, expirationDate: e.target.value })}
                        className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                      />
                      <p className="text-xs text-gray-500 mt-2">
                        💡 Leave empty for permanent announcement
                      </p>
                    </div>

                    {/* Buttons */}
                    <div className="flex gap-3 mt-8 pt-6 border-t-2 border-gray-100">
                      <button
                        type="submit"
                        className="bg-blue-600 text-white px-8 py-3 rounded-lg text-base font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg flex items-center gap-2"
                        disabled={loading}
                      >
                        {loading && (
                          <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                        )}
                        {loading ? 'Publishing...' : editingAnnouncement ? 'Update Announcement' : 'Publish Announcement'}
                      </button>
                      {editingAnnouncement && (
                        <button
                          type="button"
                          onClick={() => {
                            setEditingAnnouncement(null);
                            setFormData({
                              title: '',
                              content: '',
                              targetAudience: 'All Users',
                              expirationDate: ''
                            });
                          }}
                          className="bg-gray-300 text-gray-700 px-8 py-3 rounded-lg text-base font-semibold hover:bg-gray-400 transition-colors shadow-md hover:shadow-lg"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </form>
                </div>
              </div>

              {/* Recent Announcements - Fixed position, independent scroll */}
              <div className="lg:col-span-1">
                <div className="bg-white rounded-2xl shadow-sm border-2 border-gray-100 overflow-hidden sticky top-0">
                  <div className="bg-gradient-to-r from-purple-50 to-pink-50 px-6 py-4 border-b-2 border-purple-100 flex-shrink-0">
                    <div className="flex items-center justify-between">
                      <h2 className="text-xl font-bold text-gray-800">📋 Recent Posts</h2>
                      <button 
                        onClick={() => setShowAllModal(true)}
                        className="text-sm text-blue-600 font-semibold hover:text-blue-700"
                      >
                        View All
                      </button>
                    </div>
                  </div>

                  <div className="p-4 flex-shrink-0">
                    <div className="relative">
                      <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-3 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search announcements..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full border-2 border-gray-200 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div className="px-4 pb-4 max-h-96 overflow-y-auto">
                    <div className="space-y-3">
                      {recentAnnouncements.length === 0 ? (
                        <div className="text-center py-12">
                          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                            <MegaphoneIcon className="w-8 h-8 text-gray-400" />
                          </div>
                          <p className="text-gray-500 text-sm font-medium">
                            {searchQuery ? 'No announcements found' : 'No announcements yet'}
                          </p>
                          <p className="text-gray-400 text-xs mt-1">
                            {searchQuery ? 'Try a different search term' : 'Create your first announcement'}
                          </p>
                        </div>
                      ) : (
                        recentAnnouncements.map((a) => (
                          <div key={a.id} className="bg-gradient-to-br from-gray-50 to-white p-4 rounded-xl border-2 border-gray-100 hover:border-blue-200 transition-all group">
                            <div className="flex justify-between items-start gap-3">
                              <div className="flex-1 min-w-0">
                                <h3 className="text-sm font-bold text-gray-900 truncate mb-1">{a.title}</h3>
                                <div className="flex items-center gap-2 text-xs text-gray-500">
                                  <span>📅 {new Date(a.created_at).toLocaleDateString()}</span>
                                  <span>•</span>
                                  <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full font-semibold">
                                    {a.target_audience}
                                  </span>
                                </div>
                              </div>
                              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                  onClick={() => handleEdit(a)}
                                  className="p-2 hover:bg-blue-100 rounded-lg transition-colors"
                                  title="Edit"
                                >
                                  <PencilIcon className="h-4 w-4 text-blue-600" />
                                </button>
                                <button
                                  onClick={() => handleDelete(a.id)}
                                  className="p-2 hover:bg-red-100 rounded-lg transition-colors"
                                  title="Delete"
                                >
                                  <TrashIcon className="h-4 w-4 text-red-600" />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="border-t-2 border-gray-100 bg-gradient-to-r from-gray-50 to-white px-6 py-4 flex-shrink-0">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-blue-600">{validAnnouncements.length}</p>
                        <p className="text-xs text-gray-500 font-semibold">Total Posts</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-green-600">{validAnnouncements.filter(a => a.status === 'active').length}</p>
                        <p className="text-xs text-gray-500 font-semibold">Active</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* View All Modal */}
      {showAllModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden animate-slideUp flex flex-col">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 px-8 py-6 flex items-center justify-between flex-shrink-0">
              <div>
                <h3 className="text-2xl font-bold text-white">All Announcements</h3>
                <p className="text-blue-100 text-sm mt-1">{modalFilteredAnnouncements.length} announcements {modalSearchQuery && 'found'}</p>
              </div>
              <button
                onClick={() => {
                  setShowAllModal(false);
                  setModalSearchQuery('');
                }}
                className="text-white hover:bg-white/20 p-2.5 rounded-xl transition-all"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            {/* Search Bar */}
            <div className="px-8 py-4 border-b border-gray-200 flex-shrink-0">
              <div className="relative">
                <MagnifyingGlassIcon className="w-5 h-5 absolute left-4 top-3.5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search all announcements..."
                  value={modalSearchQuery}
                  onChange={(e) => setModalSearchQuery(e.target.value)}
                  className="w-full border-2 border-gray-200 rounded-xl pl-12 pr-4 py-3 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                />
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-8 overflow-y-auto flex-1">
              {modalFilteredAnnouncements.length === 0 ? (
                <div className="text-center py-16">
                  <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <MegaphoneIcon className="w-10 h-10 text-gray-400" />
                  </div>
                  <p className="text-gray-500 font-medium text-lg">
                    {modalSearchQuery ? 'No announcements found' : 'No announcements yet'}
                  </p>
                  <p className="text-gray-400 text-sm mt-1">
                    {modalSearchQuery ? 'Try a different search term' : 'Create your first announcement to get started'}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {modalFilteredAnnouncements.map((a) => (
                    <div key={a.id} className="bg-gradient-to-br from-white to-gray-50 p-6 rounded-2xl border-2 border-gray-100 hover:border-blue-200 transition-all group">
                      <div className="flex justify-between items-start gap-4">
                        <div className="flex-1">
                          <div className="flex items-start gap-3 mb-3">
                            <div className="p-2 bg-blue-100 rounded-lg">
                              <MegaphoneIcon className="w-5 h-5 text-blue-600" />
                            </div>
                            <div className="flex-1">
                              <h3 className="text-lg font-bold text-gray-900 mb-1">{a.title}</h3>
                              <div className="flex items-center gap-3 text-xs text-gray-500">
                                <span>📅 {new Date(a.created_at).toLocaleDateString()}</span>
                                <span>•</span>
                                <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full font-semibold">
                                  {a.target_audience}
                                </span>
                                {a.status && (
                                  <>
                                    <span>•</span>
                                    <span className={`px-2 py-1 rounded-full font-semibold ${
                                      a.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                                    }`}>
                                      {a.status}
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                          <p className="text-sm text-gray-700 leading-relaxed ml-11">{a.content}</p>
                          {a.expiration_date && (
                            <p className="text-xs text-gray-500 mt-2 ml-11">
                              ⏰ Expires: {new Date(a.expiration_date).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleEdit(a)}
                            className="p-2 hover:bg-blue-100 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <PencilIcon className="h-5 w-5 text-blue-600" />
                          </button>
                          <button
                            onClick={() => handleDelete(a.id)}
                            className="p-2 hover:bg-red-100 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <TrashIcon className="h-5 w-5 text-red-600" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
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
        @keyframes shrink {
          from {
            height: 100%;
          }
          to {
            height: 0%;
          }
        }
        .animate-fadeIn { animation: fadeIn 0.3s ease-out; }
        .animate-slideUp { animation: slideUp 0.3s ease-out; }
        .animate-slideIn { animation: slideIn 0.3s ease-out; }
        .animate-shrink { animation: shrink 3s linear; }
      `}</style>
    </div>
  );
}