const express = require('express');
const router = express.Router();
const announcementController = require('../controllers/announcementController');

router.post('/create', announcementController.createAnnouncement);
router.get('/', announcementController.getAnnouncements);
router.delete('/:id', announcementController.deleteAnnouncement);
router.put('/:id', announcementController.updateAnnouncement);

module.exports = router;
