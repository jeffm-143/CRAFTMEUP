const express = require('express');
const router = express.Router();
const serviceController = require('../controllers/serviceController');

// ⚠️ IMPORTANT: Specific routes MUST come BEFORE generic :id routes

// Feedback route - MUST be here before /:id routes
router.get('/:serviceId/feedbacks', serviceController.getServiceFeedbacks);

// Service CRUD routes
router.post('/create', serviceController.createService);
router.get('/all', serviceController.getAllServices);
router.get('/user/:userId', serviceController.getUserServices);
router.put('/:id', serviceController.updateService);
router.delete('/:id', serviceController.deleteService);

// Booking routes
router.post('/book', serviceController.createBooking);
router.get('/bookings/:userId', serviceController.getUserBookings);
router.get('/transactions/:userId', serviceController.getUserTransactions);
router.put('/bookings/:id/status', serviceController.updateBookingStatus);

// Wallet routes
router.get('/wallet/:userId', serviceController.getWalletBalance);
router.post('/wallet/transfer', serviceController.transferFunds);

module.exports = router;