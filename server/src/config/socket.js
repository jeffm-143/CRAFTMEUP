const socketIO = require('socket.io');

const activeUsers = {};
let io = null;

const initializeSocket = (server) => {
  io = socketIO(server, {
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

    socket.on('user-online', (userId) => {
      if (!userId) {
        console.error('❌ user-online received without userId');
        return;
      }
      activeUsers[userId] = socket.id;
      console.log('🟢 User online:', userId);
    });

        socket.on('booking-created', (data) => {
      console.log('📝 Booking created event received:', data);
      
      // ✅ BROADCAST TO ALL CONNECTED CLIENTS
      io.emit('booking-created', {
        bookingId: data.bookingId,
        userId: data.userId,
        serviceId: data.serviceId,
        providerId: data.providerId,
        status: 'pending',
        price: data.price,
        timestamp: new Date()
      });
      
      console.log('📢 Broadcasting booking-created to all clients');
    });


    // Transaction status changed
    socket.on('booking-status-changed', (data) => {
      const { bookingId, status, userId } = data;
      console.log('📢 Booking status changed:', data);
      
      // Broadcast to all connected clients
      io.emit('booking-updated', {
        bookingId,
        status,
        changedBy: userId,
        timestamp: new Date()
      });
    });

    // Payment completed
    socket.on('payment-completed', (data) => {
      const { bookingId, fromUserId, toUserId, amount } = data;
      console.log('💳 Payment completed:', data);
      
      // Notify both users
      io.emit('payment-confirmed', {
        bookingId,
        fromUserId,
        toUserId,
        amount,
        timestamp: new Date()
      });

      // Emit wallet update
      io.emit('wallet-updated', {
        userId: toUserId,
        amount,
        type: 'credit'
      });
    });

    socket.on('send-message', (data) => {
      const { senderId, receiverId, message, senderName } = data;
      
      if (!senderId || !receiverId || !message) {
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

      if (activeUsers[receiverId]) {
        io.to(activeUsers[receiverId]).emit('receive-message', messageData);
      }

      socket.emit('message-sent', { success: true });
    });

    socket.on('typing', (data) => {
      const { senderId, receiverId } = data;
      
      if (!senderId || !receiverId) {
        return;
      }

      if (activeUsers[receiverId]) {
        io.to(activeUsers[receiverId]).emit('user-typing', { senderId });
      }
    });

    socket.on('stop-typing', (data) => {
      const { senderId, receiverId } = data;
      
      if (!senderId || !receiverId) {
        return;
      }

      if (activeUsers[receiverId]) {
        io.to(activeUsers[receiverId]).emit('user-stop-typing', { senderId });
      }
    });

    socket.on('user-offline', (userId) => {
      if (activeUsers[userId]) {
        delete activeUsers[userId];
        console.log('🔴 User offline:', userId);
      }
    });

    socket.on('disconnect', (reason) => {
      console.log('❌ User disconnected:', socket.id);
      
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

const getIO = () => {
  if (!io) {
    throw new Error('Socket.IO not initialized');
  }
  return io;
};

module.exports = { initializeSocket, getIO };