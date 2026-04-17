const Patient = require('../models/Patient');
const Booking = require('../models/Booking');
const CareNote = require('../models/CareNote');
const User = require('../models/User');

// @desc   Create or update patient profile
// @route  POST /api/patients
// @access Private (Patient Role)
exports.createOrUpdatePatient = async (req, res) => {
  try {
    const {
      dateOfBirth, gender, address,
      conditions, allergies, currentMedications,
      mobilityLevel, cognitionLevel, careNeeds,
      emergencyContact, insuranceProvider, primaryPhysician
    } = req.body;

    const patientFields = {
      user: req.user._id,
      dateOfBirth,
      gender,
      address,
      careNeeds,
      emergencyContact,
      insuranceProvider,
      primaryPhysician,
    };

    // Construct medical history
    patientFields.medicalHistory = {};
    if (conditions) patientFields.medicalHistory.conditions = conditions;
    if (allergies) patientFields.medicalHistory.allergies = allergies;
    if (currentMedications) patientFields.medicalHistory.currentMedications = currentMedications;
    if (mobilityLevel) patientFields.medicalHistory.mobilityLevel = mobilityLevel;
    if (cognitionLevel) patientFields.medicalHistory.cognitionLevel = cognitionLevel;

    // Check if patient profile already exists
    let patient = await Patient.findOne({ user: req.user._id });

    if (patient) {
      // Update existing
      patient = await Patient.findOneAndUpdate(
        { user: req.user._id },
        { $set: patientFields },
        { new: true, runValidators: true }
      );
      return res.status(200).json({ success: true, data: patient });
    }

    // Create new patient
    patient = await Patient.create(patientFields);
    res.status(201).json({ success: true, data: patient });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc   Get current user's patient profile
// @route  GET /api/patients/me
// @access Private (Patient Role)
exports.getMyPatientProfile = async (req, res) => {
  try {
    const patient = await Patient.findOne({ user: req.user._id }).populate('user', ['name', 'email']);

    if (!patient) {
      return res.status(404).json({ success: false, message: 'Patient profile not found' });
    }

    res.status(200).json({ success: true, data: patient });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc   Get consolidated health log (all care notes) for a patient
// @route  GET /api/patients/health-log
// @access Private (Patient Role)
exports.getHealthLog = async (req, res) => {
  try {
    const patientProfile = await Patient.findOne({ user: req.user._id });
    if (!patientProfile) return res.status(404).json({ success: false, message: 'Patient profile not found' });

    const bookings = await Booking.find({ patient: patientProfile._id }).select('_id');
    const bookingIds = bookings.map(b => b._id);

    const notes = await CareNote.find({ booking: { $in: bookingIds } })
      .sort({ date: -1 })
      .populate({
        path: 'booking',
        select: 'service caregiver startDate',
        populate: [
          { path: 'service', select: 'name' },
          { path: 'caregiver', select: 'user', populate: { path: 'user', select: 'name' } }
        ]
      });

    res.json({ success: true, count: notes.length, data: notes });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
