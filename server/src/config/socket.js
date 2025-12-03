const socketIO = require('socket.io');

// Store active users: { userId: socketId }
const activeUsers = {};

const initializeSocket = (server) => {
  const io = socketIO(server, {
    cors: {
      origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
      methods: ['GET', 'POST'],
      credentials: true
    },
    transports: ['websocket', 'polling'],
    pingInterval: 25000,
    pingTimeout: 60000
  });

  io.on('connection', (socket) => {
    console.log('🔌 New user connected:', socket.id);

    // User comes online
    socket.on('user-online', (userId) => {
      if (!userId) {
        console.error('❌ user-online received without userId');
        return;
      }
      activeUsers[userId] = socket.id;
      console.log('🟢 User online:', userId, '| Active users:', Object.keys(activeUsers));
    });

    // Send message
    socket.on('send-message', (data) => {
      const { senderId, receiverId, message, senderName } = data;
      
      console.log('📤 send-message event from:', senderId, 'to:', receiverId);

      if (!senderId || !receiverId || !message) {
        console.error('❌ Invalid message data');
        socket.emit('error', { message: 'Invalid message data' });
        return;
      }

      const messageData = {
        senderId,
        receiverId,
        message,
        senderName,
        created_at: new Date()
      };

      // Send to receiver if online
      if (activeUsers[receiverId]) {
        console.log('✅ Message sent to receiver');
        io.to(activeUsers[receiverId]).emit('receive-message', messageData);
      } else {
        console.log('⚠️ Receiver OFFLINE');
      }

      socket.emit('message-sent', { success: true });
    });

    // Typing indicator - just relay to receiver, NO TIMEOUT
    socket.on('typing', (data) => {
      const { senderId, receiverId } = data;
      
      if (!senderId || !receiverId) {
        console.error('❌ Invalid typing data');
        return;
      }

      if (activeUsers[receiverId]) {
        console.log('✏️ User', senderId, 'is typing');
        io.to(activeUsers[receiverId]).emit('user-typing', { senderId });
      }
    });

    // Stop typing - immediately when input is cleared
    socket.on('stop-typing', (data) => {
      const { senderId, receiverId } = data;
      
      console.log('🛑 User', senderId, 'stopped typing');

      if (!senderId || !receiverId) {
        console.error('❌ Invalid stop-typing data');
        return;
      }

      // Send stop typing immediately
      if (activeUsers[receiverId]) {
        io.to(activeUsers[receiverId]).emit('user-stop-typing', { senderId });
      }
    });

    // User goes offline
    socket.on('user-offline', (userId) => {
      if (activeUsers[userId]) {
        delete activeUsers[userId];
        console.log('🔴 User offline:', userId);
      }
    });

    // Handle disconnect
    socket.on('disconnect', (reason) => {
      console.log('❌ User disconnected:', socket.id, 'Reason:', reason);
      
      for (let userId in activeUsers) {
        if (activeUsers[userId] === socket.id) {
          delete activeUsers[userId];
          break;
        }
      }
    });
  });

  return io;
};

module.exports = initializeSocket;