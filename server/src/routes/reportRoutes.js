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

router.get('/all', reportController.getAllReports);
router.post('/submit', reportController.submitReport);
router.put('/:id/status', reportController.updateReportStatus);

module.exports = router;