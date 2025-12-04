const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const db = require('../config/database');

// Debug route
router.get('/debug', async (req, res) => {
  try {
    const [result] = await db.execute('SELECT COUNT(*) as count FROM reports');
    res.json({
      message: 'Database connection successful',
      count: result[0].count
    });
  } catch (error) {
    console.error('Debug route error:', error);
    res.status(500).json({ error: 'Database connection failed' });
  }
});

// ✅ GET all reports
router.get('/all', reportController.getAllReports);

// ✅ POST submit report
router.post('/submit', reportController.submitReport);

// ✅ PUT update report status (CORRECT PATH)
router.put('/:id/status', reportController.updateReportStatus);

// ✅ GET user report history
router.get('/user/:userId', reportController.getUserReportHistory);

module.exports = router;