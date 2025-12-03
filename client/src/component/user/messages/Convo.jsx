import React, { useState, useEffect, useRef } from "react";
import { useParams } from 'react-router-dom';
import { io } from 'socket.io-client';
import { getMessages, sendMessage } from '../../../services/api';
import {
  ArrowLeftIcon,
  EllipsisVerticalIcon,
  PaperAirplaneIcon
} from "@heroicons/react/24/outline";
import { useNavigate } from 'react-router-dom';

export default function Convo() {
  const navigate = useNavigate();
  const { userId } = useParams();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [otherUser, setOtherUser] = useState(null);
  const [socket, setSocket] = useState(null);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);
  const socketRef = useRef(null);

  useEffect(() => {
    const initializeChat = async () => {
      try {
        const user = JSON.parse(localStorage.getItem('user'));
        setCurrentUser(user);
        console.log('👤 Current user:', user?.id);

        // Fetch other user's data
        const otherUserId = parseInt(userId);
        try {
          const response = await fetch(`http://localhost:5000/api/auth/user/${otherUserId}`);
          if (response.ok) {
            const userData = await response.json();
            setOtherUser(userData);
            console.log('👥 Other user:', userData);
          }
        } catch (error) {
          console.error('Error fetching other user:', error);
        }

        // Only initialize socket if not already initialized
        if (!socketRef.current) {
          // Initialize Socket.IO
          const newSocket = io('http://localhost:5000', {
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
            reconnectionAttempts: 5,
            forceNew: false
          });

          newSocket.on('connect', () => {
            console.log('🔌 Socket connected:', newSocket.id);
            newSocket.emit('user-online', user?.id);
            console.log('📡 Emitted user-online:', user?.id);
          });

          // Listen for incoming messages
          newSocket.on('receive-message', (messageData) => {
            console.log('📨 receive-message event received:', messageData);
            setMessages(prev => [...prev, {
              id: Date.now(),
              sender_id: messageData.senderId,
              receiver_id: messageData.receiverId,
              message: messageData.message,
              sender_name: messageData.senderName,
              created_at: new Date(messageData.created_at)
            }]);
            setOtherUserTyping(false);
          });

          // Listen for typing indicator
          newSocket.on('user-typing', (data) => {
            console.log('✏️ user-typing event from:', data.senderId, 'checking against userId:', parseInt(userId));
            if (data.senderId === parseInt(userId)) {
              console.log('✅ Setting otherUserTyping to true');
              setOtherUserTyping(true);
            }
          });

          // Listen for stop typing
          newSocket.on('user-stop-typing', (data) => {
            console.log('🛑 user-stop-typing event from:', data.senderId);
            if (data.senderId === parseInt(userId)) {
              console.log('✅ Setting otherUserTyping to false');
              setOtherUserTyping(false);
            }
          });

          newSocket.on('disconnect', () => {
            console.log('❌ Socket disconnected');
          });

          newSocket.on('connect_error', (error) => {
            console.error('🔴 Socket connection error:', error);
          });

          socketRef.current = newSocket;
          setSocket(newSocket);
        }

        // Fetch initial messages
        if (user?.id && userId) {
          await fetchMessages(user.id, otherUserId);
        }
        setLoading(false);

      } catch (error) {
        console.error('Error initializing chat:', error);
        setLoading(false);
      }
    };

    initializeChat();

    // Cleanup only on unmount
    return () => {
      console.log('🧹 Component unmounting');
    };
  }, [userId]);

  // Separate cleanup on actual unmount
  useEffect(() => {
    return () => {
      console.log('🧹 Final cleanup - disconnecting socket');
      if (socketRef.current) {
        socketRef.current.emit('user-offline', currentUser?.id);
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, []);

  const fetchMessages = async (currentUserId, otherUserId) => {
    try {
      const data = await getMessages(currentUserId, otherUserId);
      setMessages(Array.isArray(data) ? data : []);
      scrollToBottom();
    } catch (error) {
      console.error('Error fetching messages:', error);
      setMessages([]);
    }
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, otherUserTyping]);

  // Handle typing indicator
  const handleMessageChange = (e) => {
    const value = e.target.value;
    setNewMessage(value);

    if (!socketRef.current?.connected) {
      console.warn('⚠️ Socket not connected');
      return;
    }

    // If there's text in input, show typing
    if (value.trim().length > 0) {
      const typingData = {
        senderId: currentUser?.id,
        receiverId: parseInt(userId)
      };
      console.log('📤 Emitting typing (text in input)');
      socketRef.current.emit('typing', typingData);
    } else {
      // Input is empty - stop typing immediately
      if (socketRef.current?.connected) {
        const stopData = {
          senderId: currentUser?.id,
          receiverId: parseInt(userId)
        };
        console.log('📤 Emitting stop-typing (input cleared)');
        socketRef.current.emit('stop-typing', stopData);
      }
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();

    if (!newMessage.trim()) {
      console.warn('Empty message');
      return;
    }

    if (!socketRef.current) {
      console.error('Socket does not exist');
      alert('Socket connection error. Please refresh the page.');
      return;
    }

    if (!socketRef.current.connected) {
      console.error('Socket is not connected');
      socketRef.current.connect();
      alert('Connection lost. Attempting to reconnect...');
      return;
    }

    if (!currentUser) {
      console.error('No current user');
      return;
    }

    const messageData = {
      senderId: currentUser?.id,
      receiverId: parseInt(userId),
      message: newMessage.trim(),
      senderName: currentUser?.full_name
    };

    // Check role compatibility
    const currentRole = currentUser?.role?.toLowerCase();
    const otherRole = otherUser?.role?.toLowerCase();

    // Allow messaging if:
    // 1. Roles are different (learner ↔ tutor)
    // 2. Either user has "both" role
    const canMessage = 
      currentRole !== otherRole || 
      currentRole === 'both' || 
      otherRole === 'both';

    if (!canMessage) {
      alert('You can only message users with different roles');
      return;
    }

    try {
      // Step 1: Save to database via API
      console.log('💾 Saving message to database...');
      await sendMessage(messageData);
      console.log('✅ Message saved to database');

      // Step 2: Add to UI immediately
      const newMsg = {
        id: Date.now(),
        sender_id: currentUser?.id,
        receiver_id: parseInt(userId),
        message: messageData.message,
        sender_name: currentUser?.full_name,
        created_at: new Date()
      };
      setMessages(prev => [...prev, newMsg]);
      console.log('✅ Message added to UI');

      // Step 3: Emit via Socket.IO to other user
      console.log('📤 Emitting send-message via socket...');
      socketRef.current.emit('send-message', messageData);

      // Step 4: Clear input and typing indicator
      setNewMessage('');
      setOtherUserTyping(false);
      
      // Send stop-typing since input is now empty
      console.log('📤 Emitting stop-typing...');
      socketRef.current.emit('stop-typing', {
        senderId: currentUser?.id,
        receiverId: parseInt(userId)
      });

    } catch (error) {
      console.error('❌ Error sending message:', error);
      alert('Failed to send message: ' + (error.message || 'Unknown error'));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex flex-col w-full">
      {/* Header */}
      <div className="p-3 sm:p-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white sticky top-0 z-50 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button 
              className="text-white hover:bg-white/10 p-2 rounded-lg transition-colors"
              onClick={() => navigate(-1)}
            >
              <ArrowLeftIcon className="w-5 h-5" />
            </button>
            <div className="flex flex-col min-w-0">
              <h1 className="font-semibold text-sm sm:text-base truncate">{otherUser?.full_name || otherUser?.name || 'User'}</h1>
              <p className="text-xs text-white/80 h-4 sm:h-5">
                {otherUserTyping ? '✏️ typing...' : 'Active now'}
              </p>
            </div>
          </div>
          <button className="text-white hover:bg-white/10 p-2 rounded-lg transition-colors flex-shrink-0">
            <EllipsisVerticalIcon className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 px-2 sm:px-4 lg:px-6 py-2 sm:py-3 space-y-3 overflow-y-auto">
        {messages.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p className="text-sm">No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((msg, index) => {
            const isSentByCurrentUser = msg.sender_id === currentUser?.id;
            
            return (
              <div 
                key={msg.id || index}
                className={`flex ${isSentByCurrentUser ? 'justify-end' : 'gap-2 sm:gap-3'}`}
              >
                {!isSentByCurrentUser && (
                  <div className="w-7 sm:w-8 h-7 sm:h-8 rounded-full bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-xs font-bold">
                      {msg.sender_name?.[0]?.toUpperCase() || 'U'}
                    </span>
                  </div>
                )}
                <div className={`max-w-xs sm:max-w-sm lg:max-w-md ${isSentByCurrentUser ? 'mr-1 sm:mr-2' : ''}`}>
                  <p className={`px-3 sm:px-4 py-2 rounded-2xl shadow-sm text-xs sm:text-sm ${
                    isSentByCurrentUser 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-white border border-gray-100'
                  }`}>
                    {msg.message}
                  </p>
                  <p className={`text-xs mt-0.5 sm:mt-1 ${
                    isSentByCurrentUser ? 'text-right mr-1 sm:mr-2' : 'text-left ml-1 sm:ml-2'
                  } text-gray-400`}>
                    {msg.created_at ? new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'now'}
                  </p>
                </div>
              </div>
            );
          })
        )}

        {/* Typing Indicator */}
        {otherUserTyping && (
          <div className="flex gap-2 sm:gap-3">
            <div className="w-7 sm:w-8 h-7 sm:h-8 rounded-full bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center flex-shrink-0">
              <span className="text-white text-xs font-bold">
                {otherUser?.full_name?.[0]?.toUpperCase() || 'U'}
              </span>
            </div>
            <div className="bg-white border border-gray-100 rounded-2xl px-3 sm:px-4 py-2">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="border-t px-2 sm:px-4 lg:px-6 py-2 sm:py-3 bg-white/80 backdrop-blur-md">
        <form onSubmit={handleSendMessage} className="flex items-center gap-1.5 sm:gap-2 bg-gray-50 rounded-2xl p-1.5 sm:p-2 border border-gray-100">
          <input
            type="text"
            placeholder="Type a message..."
            value={newMessage}
            onChange={handleMessageChange}
            className="flex-1 bg-transparent outline-none text-xs sm:text-sm px-2 py-1"
          />
          <button 
            type="submit"
            className="bg-blue-600 text-white p-2 sm:p-3 rounded-xl hover:bg-blue-700 transition-all disabled:opacity-50 flex-shrink-0"
            disabled={!newMessage.trim()}
          >
            <PaperAirplaneIcon className="w-4 sm:w-5 h-4 sm:h-5" />
          </button>
        </form>
      </div>
    </div>
  );
}