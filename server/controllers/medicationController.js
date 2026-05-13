const Medication = require('../models/Medication');
const Patient = require('../models/Patient');

// @desc   Get all medications for a patient
// @route  GET /api/medications
exports.getMyMedications = async (req, res) => {
  try {
    const patient = await Patient.findOne({ user: req.user._id });
    if (!patient) return res.status(404).json({ success: false, message: 'Patient profile not found' });

    const medications = await Medication.find({ patient: patient._id }).sort({ createdAt: -1 });
    res.json({ success: true, data: medications });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc   Add new medication
// @route  POST /api/medications
exports.addMedication = async (req, res) => {
  try {
    const patient = await Patient.findOne({ user: req.user._id });
    if (!patient) return res.status(404).json({ success: false, message: 'Patient profile not found' });

    const medication = await Medication.create({
      ...req.body,
      patient: patient._id
    });

    res.status(201).json({ success: true, data: medication });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc   Update medication
// @route  PUT /api/medications/:id
exports.updateMedication = async (req, res) => {
  try {
    let medication = await Medication.findById(req.params.id);
    if (!medication) return res.status(404).json({ success: false, message: 'Medication not found' });

    // Ensure it belongs to the patient
    const patient = await Patient.findOne({ user: req.user._id });
    if (medication.patient.toString() !== patient._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    medication = await Medication.findByIdAndUpdate(req.params.id, req.body, {
      new: true, runValidators: true
    });

    res.json({ success: true, data: medication });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc   Delete medication
// @route  DELETE /api/medications/:id
exports.deleteMedication = async (req, res) => {
  try {
    const medication = await Medication.findById(req.params.id);
    if (!medication) return res.status(404).json({ success: false, message: 'Medication not found' });

    const patient = await Patient.findOne({ user: req.user._id });
    if (medication.patient.toString() !== patient._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    await medication.deleteOne();
    res.json({ success: true, data: {} });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
