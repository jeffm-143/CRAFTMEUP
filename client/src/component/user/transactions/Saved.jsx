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
  HeartIcon,
  ChevronDownIcon,
} from "@heroicons/react/24/outline";
import { useNavigate } from 'react-router-dom';

export default function Saved() {
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [userData, setUserData] = useState(null);

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
        { name: "Past Feedbacks", icon: <ChatBubbleOvalLeftIcon className="h-5 w-5" />, path: "/view-past-feedback" },
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
        { name: "Past Feedbacks", icon: <ChatBubbleOvalLeftIcon className="h-5 w-5" />, path: "/view-past-feedback" },
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
      { name: "Past Feedbacks", icon: <ChatBubbleOvalLeftIcon className="h-5 w-5" />, path: "/view-past-feedback" },
      { name: "Log Out", icon: <ArrowRightOnRectangleIcon className="h-5 w-5" />, path: "/" },
    ];
  })();

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem('user'));
    setUserData(storedUser);
    if (storedUser?.role?.toLowerCase() === 'tutor') {
      navigate('/dashboard');
      return;
    }
  }, [navigate]);

  const saved = [
    {
      title: "Origami Basics & Decorative Folding",
      category: "Origami Services",
      price: "SC 150/session",
      rating: "4.8",
      duration: "2-3 hrs",
      tag: "Crafting"
    },
    {
      title: "Crocheting for Beginners",
      category: "Crochet",
      price: "SC 150/hour",
      rating: "4.9",
      duration: "1-2 hrs",
      tag: "Crafting"
    },
    {
      title: "Hand Embroidery Essentials",
      category: "Hand Embroidery",
      price: "SC 150/visit",
      rating: "4.7",
      duration: "3-4 hrs",
      tag: "Crafting"
    },
    {
      title: "DIY Scrapbooking Techniques",
      category: "Scrapbooking",
      price: "SC 150/session",
      rating: "4.6",
      duration: "2 hrs",
      tag: "Crafting"
    },
  ];

  return (
    <div className="bg-gradient-to-b from-blue-50 to-white min-h-screen flex flex-col lg:flex-row w-full">
      {/* Sidebar - Desktop (always visible) */}
      <div className="hidden lg:flex fixed inset-y-0 left-0 bg-gradient-to-b from-gray-50 to-white w-64 flex-col shadow-xl border-r z-30">
        {/* Header - Fixed at top */}
        <div className="p-4 bg-gradient-to-r from-blue-600 to-indigo-600">
          <h2 className="font-semibold text-white text-lg">Menu</h2>
        </div>

        {/* Navigation - Scrollable */}
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

      {/* Sidebar - Mobile (toggle-based) */}
      <div className={`fixed inset-y-0 left-0 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} bg-gradient-to-b from-gray-50 to-white w-64 transition-transform duration-300 ease-in-out z-40 lg:hidden flex flex-col shadow-xl border-r`}>
        {/* Header - Fixed at top */}
        <div className="p-4 bg-gradient-to-r from-blue-600 to-indigo-600 flex justify-between items-center">
          <h2 className="font-semibold text-white">Menu</h2>
          <button 
            onClick={() => setIsSidebarOpen(false)}
            className="text-white hover:bg-white/10 p-1 rounded-lg transition-colors"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Navigation - Scrollable */}
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

      {/* Overlay */}
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
          <div className="flex items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <button 
                onClick={() => setIsSidebarOpen(true)}
                className="lg:hidden flex-shrink-0 hover:bg-white/10 p-2 rounded-lg transition-colors"
              >
                <Bars3Icon className="h-6 w-6" />
              </button>
              <h1 className="text-lg sm:text-xl font-semibold truncate">Saved Services</h1>
            </div>
            <button 
              onClick={() => navigate('/notification')} 
              className="flex-shrink-0 hover:bg-white/10 p-2 rounded-lg transition-colors relative"
            >
              <BellIcon className="h-6 w-6" />
              <span className="absolute -top-1 -right-1 bg-red-500 w-2 h-2 rounded-full"></span>
            </button>
          </div>

          {/* Dropdown Filter */}
          <button className="w-full flex items-center justify-between bg-white/10 backdrop-blur-sm rounded-xl px-3 sm:px-4 py-2 text-xs sm:text-sm hover:bg-white/20 transition-colors">
            <span>All Categories</span>
            <ChevronDownIcon className="h-4 w-4" />
          </button>
        </div>

        {/* Saved Services List */}
        <div className="flex-1 overflow-y-auto">
          <div className="w-full px-2 sm:px-3 lg:px-4 py-2 sm:py-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-2 sm:gap-3 lg:gap-4">
              {saved.length === 0 ? (
                <div className="col-span-full text-center py-12 sm:py-16">
                  <BookmarkIcon className="h-12 sm:h-16 w-12 sm:w-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 text-sm sm:text-base">No saved services yet</p>
                </div>
              ) : (
                saved.map((s, i) => (
                  <div
                    key={i}
                    className="bg-white rounded-2xl p-3 sm:p-4 shadow-sm border border-gray-100 hover:shadow-md transition-all flex flex-col"
                  >
                    <button className="absolute top-2 right-2 text-gray-400 hover:text-red-500 transition-colors p-1 flex-shrink-0">
                      <HeartIcon className="h-5 w-5" />
                    </button>

                    <h2 className="font-semibold text-xs sm:text-base text-gray-900 pr-8 line-clamp-2">{s.title}</h2>
                    <p className="text-xs text-gray-500 mt-1 truncate">{s.category}</p>
                    <p className="font-semibold text-xs sm:text-sm text-blue-600 mt-2">{s.price}</p>

                    <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs text-gray-500 mt-2">
                      <span>⭐ {s.rating}</span>
                      <span>⏱ {s.duration}</span>
                    </div>

                    <div className="mt-2 pt-2 border-t border-gray-100">
                      <span className="inline-block px-2.5 py-1 text-xs rounded-lg bg-gray-100 text-gray-700 font-medium">
                        {s.tag}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Bottom spacing */}
            <div className="h-2 sm:h-3"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
