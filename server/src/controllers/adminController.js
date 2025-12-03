const pool = require('../config/database');

exports.getAllUsers = async (req, res) => {
  try {
    const [users] = await pool.execute(
      `SELECT id, full_name, email, role FROM users ORDER BY full_name ASC`
    );

    res.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ message: "Failed to fetch users" });
  }
};

exports.getUserConversations = async (req, res) => {
  try {
    const { userId } = req.params;

    // Get all unique users that this user has messaged with
    const [conversations] = await pool.execute(
      `SELECT DISTINCT u.id, u.full_name, u.email, u.role
       FROM users u
       WHERE u.id IN (
         SELECT DISTINCT 
           CASE 
             WHEN sender_id = ? THEN receiver_id 
             ELSE sender_id 
           END as other_user_id
         FROM messages 
         WHERE sender_id = ? OR receiver_id = ?
       )
       ORDER BY u.full_name ASC`,
      [userId, userId, userId]
    );

    res.json(conversations);
  } catch (error) {
    console.error("Error fetching conversations:", error);
    res.status(500).json({ message: "Failed to fetch conversations" });
  }
};

exports.getConversationMessages = async (req, res) => {
  try {
    const { userId, otherUserId } = req.params;

    // Get all messages between two users
    const [messages] = await pool.execute(
      `SELECT id, sender_id, receiver_id, message, created_at
       FROM messages
       WHERE (sender_id = ? AND receiver_id = ?) 
          OR (sender_id = ? AND receiver_id = ?)
       ORDER BY created_at ASC`,
      [userId, otherUserId, otherUserId, userId]
    );

    res.json(messages);
  } catch (error) {
    console.error("Error fetching messages:", error);
    res.status(500).json({ message: "Failed to fetch messages" });
  }
};