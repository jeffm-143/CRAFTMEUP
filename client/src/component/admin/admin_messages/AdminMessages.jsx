import React, { useState, useEffect } from "react";
import {
  ArrowLeftIcon,
  MagnifyingGlassIcon,
  EllipsisVerticalIcon,
} from "@heroicons/react/24/outline";
import { useNavigate } from "react-router-dom";
import { getAllUsers, getUserConversations, getConversationMessages } from "../../../services/api";
import AdminSidebar from "../../AdminSidebar";

export default function AdminMessages() {
  const navigate = useNavigate();
  const [view, setView] = useState("users"); // "users", "conversations", "messages"
  const [allUsers, setAllUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userConversations, setUserConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);

  // Fetch all users on mount
  useEffect(() => {
    fetchAllUsers();
  }, []);

  const fetchAllUsers = async () => {
    try {
      setLoading(true);
      const data = await getAllUsers();
      setAllUsers(data || []);
    } catch (error) {
      console.error("Error fetching users:", error);
      alert("Failed to fetch users");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectUser = async (user) => {
    setSelectedUser(user);
    setView("conversations");
    await fetchUserConversations(user.id);
  };

  const fetchUserConversations = async (userId) => {
    try {
      setLoading(true);
      const data = await getUserConversations(userId);
      setUserConversations(data || []);
    } catch (error) {
      console.error("Error fetching conversations:", error);
      alert("Failed to fetch conversations");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectConversation = async (otherUser) => {
    setSelectedConversation(otherUser);
    setView("messages");
    await fetchConversationMessages(selectedUser.id, otherUser.id);
  };

  const fetchConversationMessages = async (userId, otherUserId) => {
    try {
      setLoading(true);
      const data = await getConversationMessages(userId, otherUserId);
      setMessages(data || []);
    } catch (error) {
      console.error("Error fetching messages:", error);
      alert("Failed to fetch messages");
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (view === "messages") {
      setView("conversations");
      setSelectedConversation(null);
      setMessages([]);
    } else if (view === "conversations") {
      setView("users");
      setSelectedUser(null);
      setUserConversations([]);
    }
  };

  const filteredUsers = allUsers.filter((user) =>
    user.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredConversations = userConversations.filter((user) =>
    user.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // ========== VIEWS ==========
  const renderUsersView = () => (
    <div className="flex flex-col h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="p-4 sm:p-6 bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg flex-shrink-0">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-lg sm:text-xl font-semibold">User Messages</h1>
        </div>

        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-white/60" />
          <input
            type="text"
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white/10 text-white placeholder-white/50 rounded-lg pl-10 pr-4 py-2 outline-none focus:ring-2 focus:ring-white/20"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pt-4">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500">Loading users...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500">No users found</p>
          </div>
        ) : (
          <div className="divide-y">
            {filteredUsers.map((user) => (
              <button
                key={user.id}
                onClick={() => handleSelectUser(user)}
                className="w-full p-4 hover:bg-gray-50 transition-colors text-left border-b"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-bold">
                      {user.full_name?.[0]?.toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate">
                      {user.full_name}
                    </h3>
                    <p className="text-sm text-gray-500 truncate">{user.email}</p>
                  </div>
                  <EllipsisVerticalIcon className="h-5 w-5 text-gray-400 flex-shrink-0" />
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const renderConversationsView = () => (
    <div className="flex flex-col h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="p-4 sm:p-6 bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg flex-shrink-0">
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={handleBack}
            className="text-white hover:bg-white/10 p-2 rounded-lg flex-shrink-0"
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg sm:text-xl font-semibold truncate">
              {selectedUser?.full_name}'s Conversations
            </h1>
            <p className="text-sm text-white/80">
              {userConversations.length} conversations
            </p>
          </div>
        </div>

        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-white/60" />
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white/10 text-white rounded-lg pl-10 pr-4 py-2 outline-none"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pt-4">
        {filteredConversations.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500">No conversations found</p>
          </div>
        ) : (
          <div className="divide-y">
            {filteredConversations.map((user) => (
              <button
                key={user.id}
                onClick={() => handleSelectConversation(user)}
                className="w-full p-4 hover:bg-gray-50 border-b text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-bold">
                      {user.full_name?.[0]?.toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate">
                      {user.full_name}
                    </h3>
                    <p className="text-sm text-gray-500 truncate">{user.email}</p>
                  </div>
                  <EllipsisVerticalIcon className="h-5 w-5 text-gray-400 flex-shrink-0" />
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const renderMessagesView = () => (
    <div className="flex flex-col h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="p-4 sm:p-6 bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg flex-shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={handleBack}
            className="text-white hover:bg-white/10 p-2 rounded-lg flex-shrink-0"
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg sm:text-xl font-semibold truncate">
              {selectedUser?.full_name} ↔ {selectedConversation?.full_name}
            </h1>
            <p className="text-sm text-white/80">{messages.length} messages</p>
          </div>
        </div>
      </div>

      <div className="flex-1 px-4 pt-6 pb-4 space-y-4 overflow-y-auto">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500">No messages found</p>
          </div>
        ) : (
          messages.map((msg, index) => {
            const isSentByFirst = msg.sender_id === selectedUser.id;
            return (
              <div
                key={msg.id || index}
                className={`flex ${
                  isSentByFirst ? "justify-start" : "justify-end"
                }`}
              >
                <div
                  className={`max-w-xs lg:max-w-md ${
                    isSentByFirst ? "mr-auto" : "ml-auto"
                  }`}
                >
                  <p
                    className={`px-4 py-2 rounded-2xl shadow text-sm ${
                      isSentByFirst
                        ? "bg-white border border-gray-200"
                        : "bg-blue-600 text-white"
                    }`}
                  >
                    {msg.message}
                  </p>
                  <p
                    className={`text-xs mt-1 ${
                      isSentByFirst
                        ? "text-left text-gray-400"
                        : "text-right text-gray-400"
                    }`}
                  >
                    {new Date(msg.created_at).toLocaleString()}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );

  // ========== WRAP WITH SIDEBAR ==========
  return (
    <div className="flex h-screen gap-4">
      {/* LEFT: SIDEBAR */}
      <div className="flex-shrink-0 h-screen overflow-y-auto">
        <AdminSidebar />
      </div>

      {/* RIGHT: MAIN CONTENT */}
      <div className="flex-1 overflow-hidden">
        {view === "users" && renderUsersView()}
        {view === "conversations" && renderConversationsView()}
        {view === "messages" && renderMessagesView()}
      </div>
    </div>
  );
}