const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');

// ✅ All routes now use the controller
router.post('/submit', reportController.submitReport);
router.get('/all', reportController.getAllReports);
router.put('/:id/status', reportController.updateReportStatus);  // ⚠️ Changed from :reportId to :id
router.get('/user/:userId', reportController.getUserReportHistory);

module.exports = router;