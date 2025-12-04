const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const http = require('http');
const { initializeSocket } = require('./config/socket');
const serviceController = require('./controllers/serviceController');

dotenv.config();

const app = express();
const server = http.createServer(app);
const port = process.env.PORT || 5000;


// ✅ Initialize Socket.IO ONCE
const io = initializeSocket(server);

// ✅ Pass Socket.IO to serviceController ONCE
serviceController.setIO(io);

// Middleware - MUST be before routes
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use(cors());
app.use(express.json());

// Routes
const authRoutes = require('./routes/authRoutes');
const announcementRoutes = require('./routes/announcementRoutes');
const serviceRoutes = require('./routes/serviceRoutes');
const transactionRoutes = require('./routes/transactionRoutes');
const feedbackRoutes = require('./routes/feedbackRoutes');
const reportRoutes = require('./routes/reportRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const messageRoutes = require('./routes/messageRoutes');
const adminRoutes = require('./routes/adminRoutes');
const bookmarkRoutes = require('./routes/bookmarkRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
app.use('/api/feedback', feedbackRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api', bookmarkRoutes);

app.get('/api/test-db', async (req, res) => {
    try {
        const pool = require('./config/database');
        const [result] = await pool.execute('SELECT 1');
        res.json({ success: true, result });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

server.listen(port, () => {
    console.log(`🚀 Server running on port ${port}`);
    console.log(`🔌 WebSocket ready for real-time updates`);
});