const Review = require('../models/Review');
const Booking = require('../models/Booking');
const Patient = require('../models/Patient');

exports.createReview = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.bookingId);
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
    if (booking.status !== 'completed') {
      return res.status(400).json({ success: false, message: 'Can only review completed bookings' });
    }
    const existing = await Review.findOne({ booking: booking._id });
    if (existing) return res.status(400).json({ success: false, message: 'Already reviewed' });

    const patient = await Patient.findOne({ user: req.user._id });
    const review = await Review.create({
      booking: booking._id, caregiver: booking.caregiver,
      patient: patient._id, ...req.body,
    });
    res.status(201).json({ success: true, data: review });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getCaregiverReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ caregiver: req.params.caregiverId, isPublic: true })
      .populate({ path: 'patient', populate: { path: 'user', select: 'name avatar' } })
      .sort({ createdAt: -1 });
    res.json({ success: true, data: reviews });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
