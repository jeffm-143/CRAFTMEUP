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
  const [view, setView] = useState("users");
  const [allUsers, setAllUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userConversations, setUserConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);

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

const renderUsersView = () => (
  <div className="flex flex-col h-screen bg-white">
    <div className="p-6 border-b border-gray-200">
      <div className="flex items-center gap-4 mb-4">
        <div className="p-3 bg-blue-600 rounded-2xl">
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
          </svg>
        </div>
        <div>
          <h1 className="text-2xl font-bold text-blue-600">User Messages</h1>
          <p className="text-sm text-gray-500 mt-2">Browse and manage user conversations</p>
        </div>
      </div>
      <div className="relative">
        <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search Messenger"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-gray-100 text-gray-900 placeholder-gray-500 rounded-full pl-10 pr-4 py-2 outline-none focus:bg-gray-200"
        />
      </div>
    </div>

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500">Loading...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500">No users found</p>
          </div>
        ) : (
          <div>
            {filteredUsers.map((user) => (
              <button
                key={user.id}
                onClick={() => handleSelectUser(user)}
                className="w-full p-3 hover:bg-gray-100 transition-colors text-left flex items-center gap-3"
              >
                <div className="relative">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                    <span className="text-white font-semibold text-lg">
                      {user.full_name?.[0]?.toUpperCase()}
                    </span>
                  </div>
                  <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 truncate">
                    {user.full_name}
                  </h3>
                  <p className="text-sm text-gray-500 truncate">{user.email}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );

const renderConversationsView = () => (
  <div className="flex flex-col h-screen bg-white">
    <div className="p-6 border-b border-gray-200">
      <div className="flex items-center gap-4 mb-4">
        <button
          onClick={handleBack}
          className="text-blue-600 hover:bg-gray-100 p-2 rounded-full"
        >
          <ArrowLeftIcon className="h-6 w-6" />
        </button>
        <div className="p-3 bg-blue-600 rounded-2xl">
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </div>
        <div>
          <h1 className="text-2xl font-bold text-blue-600">{selectedUser?.full_name}'s Conversations</h1>
          <p className="text-sm text-gray-500">Browse active conversations</p>
        </div>
      </div>
      <div className="relative">
        <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search in conversations"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-gray-100 text-gray-900 rounded-full pl-10 pr-4 py-2 outline-none focus:bg-gray-200"
        />
      </div>
    </div>

    <div className="flex-1 overflow-y-auto divide-y divide-gray-200">
      {filteredConversations.length === 0 ? (
        <div className="flex items-center justify-center h-full">
          <p className="text-gray-500">No conversations</p>
        </div>
      ) : (
        filteredConversations.map((user) => (
          <button
            key={user.id}
            onClick={() => handleSelectConversation(user)}
            className="w-full p-3 hover:bg-gray-100 text-left flex items-center gap-3 border-b border-gray-200"
          >
            <div className="relative">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                <span className="text-white font-semibold text-lg">
                  {user.full_name?.[0]?.toUpperCase()}
                </span>
              </div>
              <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 truncate">
                {user.full_name}
              </h3>
              <p className="text-sm text-gray-500 truncate">{user.email}</p>
            </div>
          </button>
        ))
      )}
    </div>
  </div>
);

const renderMessagesView = () => (
  <div className="flex flex-col h-screen bg-gradient-to-br from-gray-50 to-white">
    <div className="bg-white border-b border-gray-200 shadow-sm">
      <div className="p-6">
        <div className="flex items-center gap-4 mb-4">
          <button
            onClick={handleBack}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ArrowLeftIcon className="h-6 w-6 text-gray-600" />
          </button>
          <div className="p-3 bg-blue-600 rounded-2xl">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold text-blue-600 truncate">
              Conversation
            </h1>
            <p className="text-sm text-gray-500">
              {selectedUser?.full_name} & {selectedConversation?.full_name}
            </p>
          </div>
        </div>
      </div>
    </div>

    <div className="flex-1 px-6 pt-6 pb-4 space-y-3 overflow-y-auto">
      {messages.length === 0 ? (
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <p className="text-gray-500 font-medium">No messages yet</p>
            <p className="text-gray-400 text-sm mt-1">Start the conversation</p>
          </div>
        </div>
      ) : (
        messages.map((msg, index) => {
          const isSentByFirst = msg.sender_id === selectedUser.id;
          return (
            <div
              key={msg.id || index}
              className={`flex items-end gap-2 ${
                isSentByFirst ? "justify-start" : "justify-end"
              }`}
            >
              {isSentByFirst && (
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-500 flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-semibold text-xs">
                    {selectedUser?.full_name?.[0]?.toUpperCase()}
                  </span>
                </div>
              )}
              <div className={`max-w-xs lg:max-w-md ${isSentByFirst ? "" : "text-right"}`}>
                <div
                  className={`inline-block px-4 py-2.5 rounded-2xl ${
                    isSentByFirst
                      ? "bg-gray-200 text-gray-900"
                      : "bg-blue-600 text-white"
                  }`}
                >
                  <p className="text-sm">{msg.message}</p>
                </div>
                <p className="text-xs text-gray-400 mt-1 px-2">
                  {new Date(msg.created_at).toLocaleString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit'
                  })}
                </p>
              </div>
              {!isSentByFirst && (
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-500 flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-semibold text-xs">
                    {selectedConversation?.full_name?.[0]?.toUpperCase()}
                  </span>
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  </div>
);

return (
  <div className="flex h-screen bg-white">
    <div className="flex-shrink-0 border-r border-gray-200">
      <AdminSidebar />
    </div>
    <div className="flex-1 overflow-hidden">
      {view === "users" && renderUsersView()}
      {view === "conversations" && renderConversationsView()}
      {view === "messages" && renderMessagesView()}
    </div>
  </div>
);
}