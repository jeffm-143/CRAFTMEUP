const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const upload = require('../middleware/upload');

// Authentication routes
router.post('/login', authController.login);

// ✅ Updated registration endpoint - now uses validId instead of studentId/studyLoad
router.post('/register', upload.fields([
  { name: 'validId', maxCount: 1 }  // Single valid ID file
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

// File retrieval - now retrieves valid ID
router.get('/file/:userId/:fileType', authController.getUserFile);

module.exports = router;