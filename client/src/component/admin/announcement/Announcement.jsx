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
  PencilIcon
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

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      const response = await getAnnouncements();
      setAnnouncements(response.data);
    } catch (error) {
      console.error('Error fetching announcements:', error);
    }
  };

  const handleEdit = (announcement) => {
    setEditingAnnouncement(announcement);
    setFormData({
      title: announcement.title,
      content: announcement.content,
      targetAudience: announcement.target_audience,
      expirationDate: announcement.expiration_date || ''
    });
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this announcement?')) {
      try {
        await deleteAnnouncement(id);
        fetchAnnouncements();
        alert('Announcement deleted successfully');
      } catch (error) {
        alert('Failed to delete announcement');
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
      } else {
        await createAnnouncement(formData);
      }
      setFormData({
        title: '',
        content: '',
        targetAudience: 'All Users',
        expirationDate: ''
      });
      fetchAnnouncements();
      alert(editingAnnouncement ? 'Announcement updated successfully!' : 'Announcement created successfully!');
    } catch (error) {
      alert(editingAnnouncement ? 'Failed to update announcement' : 'Failed to create announcement');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-50 to-white">
      {/* Sidebar */}
      <AdminSidebar />

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        {/* Header */}
        <div className="bg-white border-b shadow-sm">
          <div className="flex items-center justify-between px-8 py-6">
            <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
              Post Announcement
            </h2>
            <div className="flex items-center space-x-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search..."
                  className="pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 w-64"
                />
                <MagnifyingGlassIcon className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
              </div>
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center text-white font-semibold">
                AS
              </div>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="p-8 overflow-y-auto h-[calc(100vh-5rem)]">
          {/* Content Grid */}
          <div className="grid grid-cols-3 gap-6">
            {/* Form Section */}
            <div className="col-span-2 bg-white p-6 rounded-lg shadow">
              <h2 className="text-lg font-semibold mb-4">Create New Announcement</h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Title */}
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Announcement Title
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Service Notification Policy Update"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full border rounded-md px-3 py-2 text-sm"
                  />
                </div>

                {/* Content */}
                <div>
                  <label className="block text-sm font-medium mb-1">Content</label>
                  <textarea
                    rows="5"
                    placeholder="Enter announcement content, guidelines, news, reminders, policies, or updates..."
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    className="w-full border rounded-md px-3 py-2 text-sm"
                  ></textarea>
                  <div className="flex justify-end text-xs text-gray-400 mt-1">
                    0/1000 characters
                  </div>
                </div>

                {/* Target Audience */}
                <div>
                  <p className="text-sm font-medium mb-1">Target Audience</p>
                  <div className="space-y-1 text-sm">
                    <label className="flex items-center space-x-2">
                      <input
                        type="radio"
                        name="audience"
                        value="All Users"
                        checked={formData.targetAudience === 'All Users'}
                        onChange={(e) => setFormData({ ...formData, targetAudience: e.target.value })}
                      />
                      <span>All Users</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input
                        type="radio"
                        name="audience"
                        value="Tutors Only"
                        checked={formData.targetAudience === 'Tutors Only'}
                        onChange={(e) => setFormData({ ...formData, targetAudience: e.target.value })}
                      />
                      <span>Tutors Only</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input
                        type="radio"
                        name="audience"
                        value="Learners Only"
                        checked={formData.targetAudience === 'Learners Only'}
                        onChange={(e) => setFormData({ ...formData, targetAudience: e.target.value })}
                      />
                      <span>Requesters Only</span>
                    </label>
                  </div>
                </div>

                {/* Expiration Date */}
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Expiration Date (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="mm/dd/yyyy"
                    value={formData.expirationDate}
                    onChange={(e) => setFormData({ ...formData, expirationDate: e.target.value })}
                    className="w-full border rounded-md px-3 py-2 text-sm"
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    Leave empty for permanent announcement
                  </p>
                </div>

                {/* Buttons */}
                <div className="flex space-x-3 mt-4">
                  <button
                    type="submit"
                    className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm"
                    disabled={loading}
                  >
                    {loading ? 'Publishing...' : 'Publish Announcement'}
                  </button>
                </div>
              </form>
            </div>

            {/* Recent Announcements */}
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Recent Announcements</h2>
                <button className="text-sm text-blue-600">View All</button>
              </div>

              <div className="mb-4">
                <div className="relative">
                  <MagnifyingGlassIcon className="w-5 h-5 absolute left-2 top-2.5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search announcements..."
                    className="w-full border rounded-md pl-8 pr-3 py-2 text-sm"
                  />
                </div>
              </div>

              <div className="space-y-4">
                {announcements.map((a) => (
                  <div key={a.id} className="border-b pb-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-sm font-medium">{a.title}</h3>
                        <p className="text-xs text-gray-500">
                          {new Date(a.created_at).toLocaleDateString()} • {a.target_audience}
                        </p>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEdit(a)}
                          className="p-1 hover:bg-gray-100 rounded-full"
                        >
                          <PencilIcon className="h-4 w-4 text-blue-600" />
                        </button>
                        <button
                          onClick={() => handleDelete(a.id)}
                          className="p-1 hover:bg-gray-100 rounded-full"
                        >
                          <TrashIcon className="h-4 w-4 text-red-600" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Stats */}
              <div className="flex justify-between text-sm mt-6">
                <div>
                  <p className="font-semibold">12</p>
                  <p className="text-gray-500">Active</p>
                </div>
                <div>
                  <p className="font-semibold">8</p>
                  <p className="text-gray-500">Archived</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
