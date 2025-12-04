const express = require('express');
const router = express.Router();
const announcementController = require('../controllers/announcementController');
const { getIO } = require('../config/socket');

// Initialize Socket.IO in controller
router.use((req, res, next) => {
  announcementController.setIO(getIO());
  next();
});

router.post('/create', announcementController.createAnnouncement);
router.get('/', announcementController.getAnnouncements);
router.delete('/:id', announcementController.deleteAnnouncement);
router.put('/:id', announcementController.updateAnnouncement);

module.exports = router;