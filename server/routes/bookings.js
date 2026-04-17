const express = require('express');
const router = express.Router();
const { createBooking, getBookings, updateStatus } = require('../controllers/bookingController');
const { protect, authorize } = require('../middleware/auth');
const { createReview, getCaregiverReviews } = require('../controllers/reviewController');
const { createCareNote, getBookingNotes } = require('../controllers/careNoteController');

router.get('/', protect, getBookings);
router.post('/', protect, authorize('patient'), createBooking);
router.patch('/:id/status', protect, updateStatus);

// Nested: care notes
router.get('/:bookingId/notes', protect, getBookingNotes);
router.post('/:bookingId/notes', protect, authorize('caregiver'), createCareNote);

// Nested: review
router.post('/:bookingId/review', protect, authorize('patient'), createReview);

module.exports = router;
