const express = require('express');
const router = express.Router();
const { getMessages, sendMessage } = require('../controllers/chatController');
const { protect } = require('../middleware/auth');

router.get('/:bookingId/messages', protect, getMessages);
router.post('/:bookingId/messages', protect, sendMessage);

module.exports = router;
