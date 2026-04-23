const express = require('express');
const router = express.Router();
const { register, login, getMe, forgotPassword, resetPassword, verifyEmail, uploadAvatar } = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { uploadProfile } = require('../middleware/uploadMiddleware');


router.post('/register', register);
router.post('/login', login);
router.post('/verify-email', verifyEmail);
router.get('/me', protect, getMe);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.post('/upload-avatar', protect, uploadProfile, uploadAvatar);


module.exports = router;
