const express = require('express');
const router = express.Router();
const { getPendingCaregivers, verifyCaregiver, rejectCaregiver, getSystemMetrics } = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/auth');

// All admin routes are strictly guarded by protect and authorize('admin')
router.use(protect);
router.use(authorize('admin'));

router.get('/metrics', getSystemMetrics);
router.get('/pending-caregivers', getPendingCaregivers);
router.patch('/verify-caregiver/:id', verifyCaregiver);
router.delete('/reject-caregiver/:id', rejectCaregiver);

module.exports = router;
