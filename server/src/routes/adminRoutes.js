const express = require("express");
const router = express.Router();
const adminController = require('../controllers/adminController');

// Get all users
router.get('/all-users', adminController.getAllUsers);

// Get conversations for a specific user
router.get('/user-conversations/:userId', adminController.getUserConversations);

// Get messages between two users
router.get(
  '/conversation-messages/:userId/:otherUserId',
  adminController.getConversationMessages
);

module.exports = router;