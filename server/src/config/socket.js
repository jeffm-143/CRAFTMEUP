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

      socket.join(`user-${userId}`);

        console.log('🟢 User online:', userId, 'in room:', `user-${userId}`);
     console.log('📊 Active users:', Object.keys(activeUsers).length);
    });


socket.on('booking-created', (data) => {
  console.log('📝 Booking created event received:', data);
  console.log('📝 Booking will be sent to tutor:', data.providerId);
  
  if (!data.providerId) {
    console.error('❌ booking-created received without providerId');
    return;
  }
  
  // ✅ Send ONLY to the tutor's room
  io.to(`user-${data.providerId}`).emit('booking-created', {
    bookingId: data.bookingId,
    userId: data.userId,
    providerId: data.providerId,
    status: data.status,
    learnerName: data.learnerName,
    price: data.price,
    timestamp: new Date()
  });
  
  console.log('✅ booking-created event emitted to tutor room:', `user-${data.providerId}`);
});

      // ✅ Handle tutor request
  socket.on('tutor-request-created', (data) => {
    console.log('📋 Tutor request created:', data);
    io.to(`user-${data.tutorId}`).emit('new-tutor-request', data);
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

        socket.on('notification-created', (data) => {
      console.log('🔔 Notification created event received:', data);
      
      if (!data.userId) {
        console.error('❌ notification-created received without userId');
        return;
      }
      
      console.log('📢 Broadcasting new-notification to user:', data.userId);
      
      // ✅ Broadcast to the user's room so their Notifications page updates
      io.to(`user-${data.userId}`).emit('new-notification', {
        type: data.type,
        title: data.title,
        content: data.content,
        timestamp: data.timestamp
      });
      
      console.log('✅ Notification broadcasted successfully');
    });

    // When a client marks a notification as read (or updates it), propagate
    // the change to all sockets in the user's room so badges stay in sync.
    socket.on('notification-updated', (data) => {
      console.log('🔁 notification-updated received:', data);
      if (!data || !data.userId) {
        console.error('❌ notification-updated received without userId');
        return;
      }

      io.to(`user-${data.userId}`).emit('notification-updated', {
        notificationId: data.notificationId || null,
        userId: data.userId,
        action: data.action || 'updated',
        timestamp: new Date()
      });

      console.log('✅ notification-updated emitted to room:', `user-${data.userId}`);
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

// Helper functions to emit admin events
const emitActivityCreated = (activity) => {
  if (io) {
    io.to('admin-room').emit('activity-created', activity);
  }
};

const emitActivityStatusUpdated = (activityId, status, type) => {
  if (io) {
    io.to('admin-room').emit('activity-status-updated', {
      activityId,
      status,
      type,
      timestamp: new Date()
    });
  }
};

const emitStatsUpdated = (stats) => {
  if (io) {
    io.to('admin-room').emit('stats-updated', stats);
  }
};

module.exports = { 
  initializeSocket, 
  getIO,
  emitActivityCreated,
  emitActivityStatusUpdated,
  emitStatsUpdated
};