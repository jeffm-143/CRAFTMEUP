const pool = require('../config/database');

exports.sendMessage = async (req, res) => {
  try {
    const { senderId, receiverId, message, senderName } = req.body;

    console.log('Received message data:', { senderId, receiverId, message, senderName });

    // Validate required fields
    if (!senderId || !receiverId || !message) {
      console.error('Missing required fields:', { senderId, receiverId, message });
      return res.status(400).json({ 
        success: false,
        message: 'Missing required fields: senderId, receiverId, message'
      });
    }

    if (!senderName) {
      console.warn('Missing senderName, using default');
    }

    const cleanMessage = String(message).trim();
    const cleanSenderName = senderName ? String(senderName).trim() : 'User';

    console.log('Executing insert with:', {
      senderId: parseInt(senderId),
      receiverId: parseInt(receiverId),
      message: cleanMessage,
      senderName: cleanSenderName
    });

    const [result] = await pool.execute(
      `INSERT INTO messages (sender_id, receiver_id, message, sender_name, read_status)
       VALUES (?, ?, ?, ?, 0)`,
      [
        parseInt(senderId),
        parseInt(receiverId),
        cleanMessage,
        cleanSenderName
      ]
    );

    console.log('Message inserted with ID:', result.insertId);

    res.status(201).json({ 
      success: true, 
      messageId: result.insertId,
      message: 'Message sent successfully',
      created_at: new Date()
    });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to send message',
      error: error.message 
    });
  }
};

exports.getMessages = async (req, res) => {
  try {
    const { userId, otherUserId } = req.params;

    console.log('Fetching messages for:', { userId, otherUserId });

    const [messages] = await pool.execute(
      `SELECT 
        id,
        sender_id,
        receiver_id, 
        message,
        sender_name,
        created_at,
        read_status
       FROM messages 
       WHERE (sender_id = ? AND receiver_id = ?) 
       OR (sender_id = ? AND receiver_id = ?)
       ORDER BY created_at ASC`,
      [parseInt(userId), parseInt(otherUserId), parseInt(otherUserId), parseInt(userId)]
    );

    console.log('Found messages:', messages.length);
    console.log('Sample message:', messages[0]); // Log to verify field names

    res.json(messages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ message: 'Failed to fetch messages' });
  }
};

exports.getConversations = async (req, res) => {
  try {
    const { userId } = req.params;

    const [conversations] = await pool.execute(
      `SELECT DISTINCT 
        CASE 
          WHEN sender_id = ? THEN receiver_id 
          ELSE sender_id 
        END as user_id,
        CASE 
          WHEN sender_id = ? THEN (SELECT full_name FROM users WHERE id = receiver_id)
          ELSE (SELECT full_name FROM users WHERE id = sender_id)
        END as name,
        (SELECT role FROM users WHERE id = CASE 
          WHEN sender_id = ? THEN receiver_id 
          ELSE sender_id 
        END) as role,
        MAX(created_at) as last_message_time
      FROM messages
      WHERE sender_id = ? OR receiver_id = ?
      GROUP BY user_id
      ORDER BY last_message_time DESC`,
      [userId, userId, userId, userId, userId]
    );

    res.json(conversations);
  } catch (error) {
    console.error('Error fetching conversations:', error);
    res.status(500).json({ message: 'Failed to fetch conversations' });
  }
};

exports.markAsRead = async (req, res) => {
  try {
    const { messageId } = req.params;

    await pool.execute(
      'UPDATE messages SET read_status = 1 WHERE id = ?',
      [messageId]
    );

    res.json({ success: true });
  } catch (error) {
    console.error('Error marking message as read:', error);
    res.status(500).json({ message: 'Failed to mark message as read' });
  }
};