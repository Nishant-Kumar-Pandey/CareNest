const express = require('express');
const router = express.Router();
const { createOrUpdatePatient, getMyPatientProfile, getHealthLog } = require('../controllers/patientController');
const { protect, authorize } = require('../middleware/auth');

router.get('/me', protect, authorize('patient'), getMyPatientProfile);
router.get('/health-log', protect, authorize('patient'), getHealthLog);
router.post('/', protect, authorize('patient'), createOrUpdatePatient);

module.exports = router;
