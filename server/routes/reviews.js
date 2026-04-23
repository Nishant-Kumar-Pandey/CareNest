const express = require('express');
const router = express.Router();
const { getCaregiverReviews, respondToReview } = require('../controllers/reviewController');
const { protect, authorize } = require('../middleware/auth');

router.get('/caregiver/:caregiverId', getCaregiverReviews);
router.patch('/:id/respond', protect, authorize('caregiver'), respondToReview);

module.exports = router;
