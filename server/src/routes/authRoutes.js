const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const upload = require('../middleware/upload');

// Authentication routes
router.post('/login', authController.login);
router.post('/register', upload.fields([
  { name: 'studentId', maxCount: 1 },
  { name: 'studyLoad', maxCount: 1 }
]), authController.register);

// Password reset routes
router.post('/forgot-password', authController.forgotPassword);
router.post('/verify-reset-code', authController.verifyResetCode);
router.post('/reset-password', authController.resetPassword);

// User profile routes
router.get('/user/:id', authController.getUserData);
router.put('/update-profile/:id', authController.updateProfile);
router.post('/upload-profile-image', authController.updateProfilePhoto);

// Admin verification routes
router.get('/unverified-users', authController.getUnverifiedUsers);
router.post('/verify-user/:id', authController.verifyUser);

// File retrieval
router.get('/file/:userId/:fileType', authController.getUserFile);

module.exports = router;