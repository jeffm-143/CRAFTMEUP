const db = require('../config/database');

exports.createNotification = async (req, res) => {
  try {
    const { userId, type, title, content } = req.body;
    
    const [result] = await db.query(
      'INSERT INTO notifications (user_id, type, title, content, `read`) VALUES (?, ?, ?, ?, ?)',
      [userId, type, title, content, false]
    );
    
    res.status(201).json({
      success: true,
      notification: {
        id: result.insertId,
        user_id: userId,
        type,
        title,
        content,
        read: false,
        created_at: new Date()
      }
    });
  } catch (error) {
    console.error('Error creating notification:', error);
    res.status(500).json({ success: false, message: 'Failed to create notification' });
  }
};

exports.getUserNotifications = async (req, res) => {
  try {
    const { userId } = req.params;
    
    const [notifications] = await db.query(
      'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC',
      [userId]
    );
    
    res.json(notifications);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ message: 'Failed to fetch notifications' });
  }
};

exports.markAsRead = async (req, res) => {
  try {
    const { notificationId } = req.params;
    
    await db.query(
      'UPDATE notifications SET `read` = true WHERE id = ?',
      [notificationId]
    );
    
    res.json({ message: 'Notification marked as read' });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ message: 'Failed to mark notification as read' });
  }
};

exports.markAllAsRead = async (req, res) => {
  try {
    const { userId } = req.params;
    
    await db.query(
      'UPDATE notifications SET `read` = true WHERE user_id = ? AND `read` = false',
      [userId]
    );
    
    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({ message: 'Failed to mark all notifications as read' });
  }
};


exports.createFeedbackNotification = async (req, res) => {
  try {
    const { tutorId, learnerName, comment, rating } = req.body;
    
    const notificationData = {
      userId: tutorId,
      type: 'feedback_received',
      title: 'New Feedback Received',
      content: `You received a ${rating}-star feedback from ${learnerName}${comment ? `:\n${comment}` : ''}`
    };
    
    const [result] = await db.query(
      'INSERT INTO notifications (user_id, type, title, content, `read`) VALUES (?, ?, ?, ?, ?)',
      [
        notificationData.userId,
        notificationData.type,
        notificationData.title,
        notificationData.content,
        false
      ]
    );
    
    res.status(201).json({
      success: true,
      notification: {
        id: result.insertId,
        ...notificationData,
        read: false,
        created_at: new Date()
      }
    });
  } catch (error) {
    console.error('Error creating feedback notification:', error);
    res.status(500).json({ success: false, message: 'Failed to create feedback notification' });
  }
};

exports.createTutorRequestNotification = async (req, res) => {
  try {
  
    
    const [result] = await db.query(
      'INSERT INTO notifications (user_id, type, title, content, `read`) VALUES (?, ?, ?, ?, ?)',
      [
        notificationData.userId,
        notificationData.type,
        notificationData.title,
        notificationData.content,
        false
      ]
    );
    
    res.status(201).json({
      success: true,
      notification: {
        id: result.insertId,
        ...notificationData,
        read: false,
        created_at: new Date()
      }
    });
  } catch (error) {
    console.error('Error creating tutor request notification:', error);
    res.status(500).json({ success: false, message: 'Failed to create tutor request notification' });
  }
};