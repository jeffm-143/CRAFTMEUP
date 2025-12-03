const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');

router.post('/send', messageController.sendMessage);
router.get('/messages/:userId/:otherUserId', messageController.getMessages);
router.get('/conversations/:userId', messageController.getConversations);
router.put('/mark-read/:messageId', messageController.markAsRead);

module.exports = router;