const express = require('express');
const router = express.Router();
const bookmarkController = require('../controllers/bookmarkController');

// Bookmark a service
router.post('/services/:serviceId/bookmark', bookmarkController.bookmarkService);

// Unbookmark a service
router.delete('/services/:serviceId/bookmark', bookmarkController.unbookmarkService);

// Get all saved services for a user
router.get('/services/saved/:userId', bookmarkController.getSavedServices);

// Check if a service is bookmarked
router.get('/services/:serviceId/is-bookmarked', bookmarkController.isServiceBookmarked);

// Get count of saved services
router.get('/services/saved/:userId/count', bookmarkController.getSavedServicesCount);

module.exports = router;