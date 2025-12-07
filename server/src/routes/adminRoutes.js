const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');


// Activities routes
router.get('/activities', adminController.getActivities);
router.get('/activities/:activityId', adminController.getActivityDetails);
router.put('/activities/:activityId/status', adminController.updateActivityStatus);

// Dashboard Stats
router.get('/dashboard-stats', adminController.getDashboardStats);

// Users
router.get('/all-users', adminController.getAllUsers);
router.put('/users/:userId/verify', adminController.verifyUser);

// Conversations
router.get('/user-conversations/:userId', adminController.getUserConversations);
router.get(
  '/conversation-messages/:userId/:otherUserId',
  adminController.getConversationMessages
);

// Activity Logging
router.post('/log-activity', adminController.logActivity);

module.exports = router;