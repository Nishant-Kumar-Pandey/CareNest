const express = require('express');
const router = express.Router();
const { getCaregivers, getCaregiver, updateCaregiver, getMyCaregiverProfile, createOrUpdateMyProfile } = require('../controllers/caregiverController');
const { protect, authorize } = require('../middleware/auth');

router.get('/', getCaregivers);

// Self endpoints (must precede /:id)
router.get('/me', protect, authorize('caregiver'), getMyCaregiverProfile);
router.post('/me', protect, authorize('caregiver'), createOrUpdateMyProfile);

router.get('/:id', getCaregiver);
router.put('/:id', protect, authorize('caregiver', 'admin'), updateCaregiver);

module.exports = router;
