const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');

router.post('/create', notificationController.createNotification);
router.get('/user/:userId', notificationController.getUserNotifications);
router.put('/:notificationId/read', notificationController.markAsRead);
router.put('/user/:userId/read-all', notificationController.markAllAsRead);
router.post('/feedback', notificationController.createFeedbackNotification);
router.post('/tutor-request', notificationController.createTutorRequestNotification);

module.exports = router;