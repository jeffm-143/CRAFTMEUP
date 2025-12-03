const express = require('express');
const router = express.Router();
const feedbackController = require('../controllers/feedbackController');

// Make sure these functions exist in feedbackController
router.post('/', feedbackController.createFeedback);
router.get('/user/:userId', feedbackController.getUserFeedback);
router.get('/provider/:userId', feedbackController.getProviderFeedbacks);

module.exports = router;