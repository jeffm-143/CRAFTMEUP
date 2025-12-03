import { useNavigate } from "react-router-dom";
import {
  HomeIcon,
  UsersIcon,
  WalletIcon,
  MegaphoneIcon,
  ArrowRightOnRectangleIcon,
  CheckCircleIcon,
  ChatBubbleLeftIcon,
} from "@heroicons/react/24/outline";

export default function AdminSidebar() {
  const navigate = useNavigate();

  const sidebarItems = [
    { name: "Dashboard", icon: <HomeIcon className="w-5 h-5" />, path: "/admin-dashboard" },
    { name: "User Reports", icon: <UsersIcon className="w-5 h-5" />, path: "/user-reports" },
    { name: "Account Verification", icon: <CheckCircleIcon className="w-5 h-5" />, path: "/account-verification" },
    { name: "Wallet Requests", icon: <WalletIcon className="w-5 h-5" />, path: "/wallet-logs" },
    { name: "User Messages", icon: <ChatBubbleLeftIcon className="w-5 h-5" />, path: "/admin-messages" },
    { name: "Post Announcement", icon: <MegaphoneIcon className="w-5 h-5" />, path: "/announcements" },
    { name: "Log Out", icon: <ArrowRightOnRectangleIcon className="h-5 w-5" />, path: "/" },
  ];

  return (
    <div className="w-72 bg-white shadow-xl z-20">
      <div className="p-6 bg-gradient-to-r from-blue-600 to-indigo-600">
        <h1 className="text-xl font-bold text-white">Admin Dashboard</h1>
        <p className="text-blue-100 text-sm mt-1">System Management</p>
      </div>

      <nav className="p-4 space-y-2">
        {sidebarItems.map((item) => (
          <button
            key={item.name}
            onClick={() => navigate(item.path)}
            className="flex items-center w-full p-3 text-gray-600 hover:text-blue-600 rounded-xl transition-all duration-200 group hover:bg-gradient-to-r from-blue-50 to-indigo-50"
          >
            <div className="bg-white p-2 rounded-lg shadow-sm group-hover:scale-110 transition-transform duration-200">
              {item.icon}
            </div>
            <span className="ml-3 font-medium">{item.name}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}