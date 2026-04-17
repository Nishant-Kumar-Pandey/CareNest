const CareNote = require('../models/CareNote');

exports.createCareNote = async (req, res) => {
  try {
    const Caregiver = require('../models/Caregiver');
    const caregiver = await Caregiver.findOne({ user: req.user._id });
    const note = await CareNote.create({
      booking: req.params.bookingId,
      caregiver: caregiver._id,
      ...req.body,
    });
    res.status(201).json({ success: true, data: note });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getBookingNotes = async (req, res) => {
  try {
    const notes = await CareNote.find({ booking: req.params.bookingId })
      .populate({ path: 'caregiver', populate: { path: 'user', select: 'name avatar' } })
      .sort({ date: -1 });
    res.json({ success: true, data: notes });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
