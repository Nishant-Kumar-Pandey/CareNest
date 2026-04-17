const express = require('express');
const router = express.Router();
const { getCaregiverReviews } = require('../controllers/reviewController');

router.get('/caregiver/:caregiverId', getCaregiverReviews);

module.exports = router;
