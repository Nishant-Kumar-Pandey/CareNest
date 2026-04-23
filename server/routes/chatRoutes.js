const express = require('express');
const router = express.Router();
const { getMessages, sendMessage } = require('../controllers/chatController');
const { protect } = require('../middleware/auth');
const { uploadChatMedia } = require('../middleware/uploadMiddleware');

router.get('/:bookingId/messages', protect, getMessages);
router.post('/:bookingId/messages', protect, uploadChatMedia, sendMessage);


module.exports = router;
