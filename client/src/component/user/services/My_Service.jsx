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
  PencilIcon,
  TrashIcon,
  PlusIcon,
  BookmarkIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";
import { useNavigate } from "react-router-dom";
import {
  createService,
  getUserServices,
  updateService,
  deleteService,
} from "../../../services/api";
import Toast from "../../common/Toast";

// Star Rating Display Component
const StarRating = ({ rating, totalRatings }) => {
  const stars = [];
  const ratingNum = parseFloat(rating) || 0;

  for (let i = 1; i <= 5; i++) {
    if (i <= Math.floor(ratingNum)) {
      stars.push(
        <span key={i} className="text-yellow-400 text-sm">
          ★
        </span>
      );
    } else if (i - ratingNum < 1) {
      stars.push(
        <span key={i} className="text-yellow-400 text-sm">
          ★
        </span>
      );
    } else {
      stars.push(
        <span key={i} className="text-gray-300 text-sm">
          ★
        </span>
      );
    }
  }

  return (
    <div className="flex items-center gap-1">
      <div className="flex gap-0.5">
        {stars}
      </div>
      {totalRatings > 0 ? (
        <span className="text-xs text-gray-600">
          {ratingNum.toFixed(1)} ({totalRatings})
        </span>
      ) : (
        <span className="text-xs text-gray-400">No ratings</span>
      )}
    </div>
  );
};

export default function MyServices() {
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [services, setServices] = useState([]);
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [toast, setToast] = useState(null);
  const [userData, setUserData] = useState(null);
  const [newService, setNewService] = useState({
    title: "",
    description: "",
    price: "",
    availability: [],
    status: "Active",
  });

  const [tempAvailability, setTempAvailability] = useState({
    day: "",
    startTime: "",
    endTime: "",
  });

  const days = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ];

  const role = userData?.role?.toLowerCase() || '';

  // Dynamic navigation based on role
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

    // Default for 'both' role
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

  // Helper function to safely parse availability
  const parseAvailability = (availability) => {
    if (!availability) return [];
    
    if (Array.isArray(availability)) return availability;
    
    if (typeof availability === 'string') {
      try {
        const parsed = JSON.parse(availability);
        if (Array.isArray(parsed)) return parsed;
        return [];
      } catch (e) {
        console.warn('Could not parse availability:', availability);
        return [];
      }
    }
    
    return [];
  };

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem('user'));
    setUserData(storedUser);
  }, []);

  useEffect(() => {
    if (userData) {
      fetchUserServices();
    }
  }, [userData]);

const fetchUserServices = async () => {
  try {
    const user = JSON.parse(localStorage.getItem("user"));
    const data = await getUserServices(user.id);
    
    console.log('Raw response:', data);
    
    // Handle different response formats
    let servicesArray = [];
    if (Array.isArray(data)) {
      servicesArray = data;
    } else if (data?.data && Array.isArray(data.data)) {
      servicesArray = data.data;
    } else if (data?.services && Array.isArray(data.services)) {
      servicesArray = data.services;
    }
    
    // Add average rating and total ratings to each service
    const servicesWithRatings = servicesArray.map(service => {
      console.log('Service data before mapping:', {
        id: service.id,
        title: service.title,
        average_rating: service.average_rating,
        total_ratings: service.total_ratings,
        rating: service.rating,
        feedback_count: service.feedback_count
      });
      
      // Handle different possible field names from backend
      const avgRating = service.average_rating || service.rating || 0;
      const totalRatings = service.total_ratings || service.feedback_count || 0;
      
      return {
        ...service,
        average_rating: parseFloat(avgRating) || 0,
        total_ratings: parseInt(totalRatings) || 0
      };
    });
    
    console.log('Services with ratings:', servicesWithRatings);
    setServices(servicesWithRatings);
  } catch (error) {
    console.error("Error fetching services:", error);
    setServices([]);
  }
};

  const handleEdit = (service) => {
    setEditingService(service);
    const availabilityArray = parseAvailability(service.availability);
    
    setNewService({
      title: service.title,
      description: service.description,
      price: service.price.toString(),
      availability: availabilityArray,
      status: service.status || "Active",
    });
    setTempAvailability({
      day: "",
      startTime: "",
      endTime: "",
    });
    setShowServiceModal(true);
  };

  const handleDelete = async (serviceId) => {
    if (window.confirm("Are you sure you want to delete this service?")) {
      try {
        await deleteService(serviceId);
        fetchUserServices();
        
        setToast({
          message: "Service deleted successfully!",
          type: "success",
          isLoading: false,
          showProgress: true,
          duration: 2000,
        });
      } catch (error) {
        setToast({
          message: "Failed to delete service",
          type: "error",
          isLoading: false,
          showProgress: false,
          duration: 2000,
        });
      }
    }
  };

  const addAvailability = () => {
    if (!tempAvailability.day || !tempAvailability.startTime || !tempAvailability.endTime) {
      setToast({
        message: "Please fill in all availability fields",
        type: "error",
        isLoading: false,
        showProgress: false,
        duration: 2000,
      });
      return;
    }

    setNewService(prev => ({
      ...prev,
      availability: [
        ...prev.availability,
        {
          day: tempAvailability.day,
          startTime: tempAvailability.startTime,
          endTime: tempAvailability.endTime,
        }
      ]
    }));

    setTempAvailability({
      day: "",
      startTime: "",
      endTime: "",
    });
  };

  const removeAvailability = (index) => {
    setNewService(prev => ({
      ...prev,
      availability: prev.availability.filter((_, i) => i !== index)
    }));
  };

  const handleCreateOrUpdate = async (e) => {
    e.preventDefault();
    
    if (newService.availability.length === 0) {
      setToast({
        message: "Please add at least one availability slot",
        type: "error",
        isLoading: false,
        showProgress: false,
        duration: 2000,
      });
      return;
    }

    const price = parseFloat(newService.price);
    if (isNaN(price) || price <= 0) {
      setToast({
        message: "Please enter a valid price",
        type: "error",
        isLoading: false,
        showProgress: false,
        duration: 2000,
      });
      return;
    }

    try {
      const user = JSON.parse(localStorage.getItem("user"));
      const serviceData = {
        userId: user.id,
        title: newService.title,
        description: newService.description,
        price: price.toString(),
        availability: JSON.stringify(newService.availability),
        status: newService.status,
      };

      if (editingService) {
        await updateService(editingService.id, serviceData);
        
        setToast({
          message: "Service updated successfully!",
          type: "success",
          isLoading: false,
          showProgress: true,
          duration: 2000,
        });
      } else {
        await createService(serviceData);
        
        setToast({
          message: "Service created successfully!",
          type: "success",
          isLoading: false,
          showProgress: true,
          duration: 2000,
        });
      }

      setShowServiceModal(false);
      setNewService({
        title: "",
        description: "",
        price: "",
        availability: [],
        status: "Active",
      });
      setTempAvailability({
        day: "",
        startTime: "",
        endTime: "",
      });
      setEditingService(null);
      fetchUserServices();
    } catch (error) {
      console.error('Error creating/updating service:', error);
      setToast({
        message: editingService ? "Failed to update service" : "Failed to create service",
        type: "error",
        isLoading: false,
        showProgress: false,
        duration: 2000,
      });
    }
  };

  const renderServiceForm = () => (
    <div className="fixed inset-0 bg-gradient-to-b from-blue-50 to-white z-50 w-full flex flex-col">
      <div className="flex flex-col h-screen">
        {/* Header */}
        <div className="p-4 sm:p-6 bg-gradient-to-r from-blue-600 to-indigo-600 text-white sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <h2 className="text-lg sm:text-xl font-semibold">
              {editingService ? "Edit Service" : "Add New Service"}
            </h2>
            <button
              onClick={() => {
                setShowServiceModal(false);
                setEditingService(null);
                setNewService({
                  title: "",
                  description: "",
                  price: "",
                  availability: [],
                  status: "Active",
                });
                setTempAvailability({
                  day: "",
                  startTime: "",
                  endTime: "",
                });
              }}
              className="text-white hover:bg-white/10 p-2 rounded-lg transition-colors"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Form Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-2xl mx-auto w-full px-4 py-4 sm:py-6">
            <form onSubmit={handleCreateOrUpdate} className="space-y-4 sm:space-y-6">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Service Title</label>
                <input
                  type="text"
                  value={newService.title}
                  onChange={(e) => setNewService(prev => ({
                    ...prev,
                    title: e.target.value
                  }))}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Description</label>
                <textarea
                  value={newService.description}
                  onChange={(e) => setNewService(prev => ({
                    ...prev,
                    description: e.target.value
                  }))}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  rows="4"
                  required
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Price (SC)</label>
                <input
                  type="number"
                  value={newService.price}
                  onChange={(e) => setNewService(prev => ({
                    ...prev,
                    price: e.target.value
                  }))}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  required
                />
              </div>

              {/* Availability Section */}
              <div className="border-t pt-6">
                <h3 className="text-sm font-medium text-gray-700 mb-4">Add Availability</h3>
                
                <div className="space-y-3 mb-4">
                  <div>
                    <label className="text-xs font-medium text-gray-600 mb-1 block">Day</label>
                    <select
                      value={tempAvailability.day}
                      onChange={(e) => setTempAvailability(prev => ({
                        ...prev,
                        day: e.target.value
                      }))}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    >
                      <option value="">Select a day</option>
                      {days.map(day => (
                        <option key={day} value={day}>{day}</option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium text-gray-600 mb-1 block">Start Time</label>
                      <input
                        type="time"
                        value={tempAvailability.startTime}
                        onChange={(e) => setTempAvailability(prev => ({
                          ...prev,
                          startTime: e.target.value
                        }))}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-600 mb-1 block">End Time</label>
                      <input
                        type="time"
                        value={tempAvailability.endTime}
                        onChange={(e) => setTempAvailability(prev => ({
                          ...prev,
                          endTime: e.target.value
                        }))}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={addAvailability}
                    className="w-full px-4 py-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 text-sm font-medium transition-colors"
                  >
                    Add Availability Slot
                  </button>
                </div>

                {/* Display Added Availability */}
                {newService.availability.length > 0 && (
                  <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                    <p className="text-xs font-medium text-gray-600 mb-3">Availability Slots:</p>
                    {newService.availability.map((slot, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between bg-white p-3 rounded-lg border border-gray-200"
                      >
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {slot.day}
                          </p>
                          <p className="text-xs text-gray-500">
                            {slot.startTime} - {slot.endTime}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeAvailability(index)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <XCircleIcon className="h-5 w-5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-4 flex flex-col sm:flex-row gap-2 sm:gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowServiceModal(false);
                    setEditingService(null);
                    setNewService({
                      title: "",
                      description: "",
                      price: "",
                      availability: [],
                      status: "Active",
                    });
                    setTempAvailability({
                      day: "",
                      startTime: "",
                      endTime: "",
                    });
                  }}
                  className="flex-1 px-6 py-3 text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 text-sm font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 text-sm font-medium transition-all"
                >
                  {editingService ? "Update Service" : "Create Service"}
                </button>
              </div>

              {/* Bottom spacing */}
              <div className="h-4 sm:h-6"></div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );

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
      <div
        className={`fixed inset-y-0 left-0 transform ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        } bg-gradient-to-b from-gray-50 to-white w-64 transition-transform duration-300 ease-in-out z-40 lg:hidden flex flex-col shadow-xl border-r`}
      >
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
        {/* Header */}
        <div className="p-4 sm:p-6 bg-gradient-to-r from-blue-600 to-indigo-600 text-white sticky top-0 z-20 shadow-lg">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <button 
                onClick={() => setIsSidebarOpen(true)}
                className="lg:hidden flex-shrink-0 hover:bg-white/10 p-2 rounded-lg transition-colors"
              >
                <Bars3Icon className="h-6 w-6" />
              </button>
              <h1 className="text-lg sm:text-xl font-semibold truncate">My Services</h1>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button 
                onClick={() => navigate("/notification")} 
                className="hover:bg-white/10 p-2 rounded-lg transition-colors relative"
              >
                <BellIcon className="h-6 w-6" />
                <span className="absolute -top-1 -right-1 bg-red-500 w-2 h-2 rounded-full"></span>
              </button>
              <button
                onClick={() => {
                  setShowServiceModal(true);
                  setEditingService(null);
                  setNewService({
                    title: "",
                    description: "",
                    price: "",
                    availability: [],
                    status: "Active",
                  });
                }}
                className="hidden sm:flex items-center gap-2 bg-white/10 backdrop-blur-sm px-3 py-2 rounded-lg text-xs sm:text-sm hover:bg-white/20 transition-all"
              >
                <PlusIcon className="h-4 w-4" /> Add Service
              </button>
              <button
                onClick={() => {
                  setShowServiceModal(true);
                  setEditingService(null);
                  setNewService({
                    title: "",
                    description: "",
                    price: "",
                    availability: [],
                    status: "Active",
                  });
                }}
                className="sm:hidden flex items-center justify-center bg-white/10 backdrop-blur-sm p-2 rounded-lg hover:bg-white/20 transition-all"
              >
                <PlusIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        
{/* Service List */}
<div className="flex-1 overflow-y-auto">
  <div className="w-full px-2 sm:px-3 lg:px-4 py-2 sm:py-3">
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-2 sm:gap-3 lg:gap-4 auto-rows-max">
      {services.length === 0 ? (
        <div className="col-span-full text-center py-12 sm:py-16">
          <ClipboardDocumentListIcon className="h-12 sm:h-16 w-12 sm:w-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-sm sm:text-base mb-4">No services created yet</p>
          <button
            onClick={() => setShowServiceModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
          >
            Create Your First Service
          </button>
        </div>
      ) : (
        services.map((service) => {
          const availabilityArray = parseAvailability(service.availability);
          
          return (
            <div
              key={service.id}
              className="bg-white rounded-2xl p-3 sm:p-4 shadow-sm border border-gray-100 hover:shadow-md transition-all flex flex-col h-fit"
            >
              {/* Status Badge */}
              <span
                className={`self-end px-2 sm:px-3 py-1 text-xs font-medium rounded-full mb-2 ${
                  service.status === "Active"
                    ? "bg-green-100 text-green-700"
                    : "bg-green-100 text-green-700"
                }`}
              >
                {service.status || "Active"}
              </span>

              {/* Title and Description - Fixed Height with Scroll */}
              <div className="min-h-16 mb-3">
                <h2 className="font-semibold text-sm sm:text-base text-gray-900 line-clamp-2">
                  {service.title}
                </h2>
                <div className="h-9 overflow-y-auto mt-1">
                  <p className="text-gray-600 text-xs sm:text-sm">
                    {service.description}
                  </p>
                </div>
              </div>

              {/* Rating Section - Fixed Height */}
              <div className="h-8 py-2 border-t border-b border-gray-100 flex items-center">
                <StarRating 
                  rating={service.average_rating}
                  totalRatings={service.total_ratings}
                />
              </div>

              {/* Availability Slots - Fixed Height with Scroll */}
              {availabilityArray.length > 0 && (
                <div className="mt-3 py-2 border-t border-b border-gray-100 h-20">
                  <p className="text-xs font-semibold text-gray-600 mb-1.5 uppercase">Available:</p>
                  <div className="max-h-12 overflow-y-auto space-y-1 pr-2">
                    {availabilityArray.map((slot, index) => (
                      <div key={index} className="flex items-center gap-2 text-xs">
                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full flex-shrink-0"></span>
                        <span className="text-gray-700 truncate">
                          {slot.day} {slot.startTime}-{slot.endTime}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Price Section - Fixed Height */}
              <div className="h-10 flex items-center justify-end mt-3 pt-2 border-t border-gray-100">
                <p className="font-semibold text-blue-600 text-sm sm:text-base">SC {service.price}</p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 mt-auto pt-3">
                <button
                  onClick={() => handleEdit(service)}
                  className="flex items-center justify-center gap-1.5 flex-1 px-3 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors text-sm font-medium border border-blue-200"
                >
                  <PencilIcon className="h-4 w-4" />
                  <span>Edit</span>
                </button>
                <button
                  onClick={() => handleDelete(service.id)}
                  className="flex items-center justify-center gap-1.5 flex-1 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors text-sm font-medium border border-red-200"
                >
                  <TrashIcon className="h-4 w-4" />
                  <span>Delete</span>
                </button>
              </div>
            </div>
          );
        })
      )}
    </div>

    {/* Bottom spacing */}
    <div className="h-2 sm:h-3"></div>
  </div>
</div>
      </div>

      {/* Modal */}
      {showServiceModal && renderServiceForm()}

      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
          isLoading={toast.isLoading}
          showProgress={toast.showProgress}
          duration={toast.duration}
        />
      )}
    </div>
  );
}