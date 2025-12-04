const express = require('express');
const router = express.Router();
const serviceController = require('../controllers/serviceController');
const { getIO } = require('../config/socket');

// Initialize Socket.IO in controller
router.use((req, res, next) => {
  serviceController.setIO(getIO());
  next();
});


// Feedback route - MUST be here before /:id routes
router.get('/:serviceId/feedbacks', serviceController.getServiceFeedbacks);

// Service CRUD routes
router.post('/create', serviceController.createService);
router.get('/all', serviceController.getAllServices);
router.get('/user/:userId', serviceController.getUserServices);
router.put('/:id', serviceController.updateService);
router.delete('/:id', serviceController.deleteService);
router.post('/:id/restore', serviceController.restoreService);

// Booking routes
router.post('/book', serviceController.createBooking);
router.get('/bookings/:userId', serviceController.getUserBookings);
router.get('/transactions/:userId', serviceController.getUserTransactions);
router.put('/bookings/:id/status', serviceController.updateBookingStatus);

// Feedback routes
router.post('/feedback', serviceController.createFeedback);
router.get('/feedback/:userId', serviceController.getUserFeedback);


// Wallet routes
router.get('/wallet/:userId', serviceController.getWalletBalance);
router.post('/wallet/transfer', serviceController.transferFunds);

module.exports = router;