const express = require('express');
const router = express.Router();
const { getMyMedications, addMedication, updateMedication, deleteMedication } = require('../controllers/medicationController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);
router.use(authorize('patient'));

router.route('/')
  .get(getMyMedications)
  .post(addMedication);

router.route('/:id')
  .put(updateMedication)
  .delete(deleteMedication);

module.exports = router;
