const Review = require('../models/Review');
const Booking = require('../models/Booking');
const Patient = require('../models/Patient');
const Caregiver = require('../models/Caregiver');

exports.createReview = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.bookingId);
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
    if (booking.status !== 'completed') {
      return res.status(400).json({ success: false, message: 'Can only review completed bookings' });
    }
    const existing = await Review.findOne({ booking: booking._id });
    if (existing) return res.status(400).json({ success: false, message: 'Already reviewed' });

    const patient = await Patient.findOne({ user: req.user._id }).populate('user', 'name');
    const caregiver = await Caregiver.findById(booking.caregiver).populate('user', 'name email');
    
    const review = await Review.create({
      booking: booking._id, caregiver: booking.caregiver,
      patient: patient._id, ...req.body,
    });

    // ── NOTIFICATION LOGIC ──
    try {
      const { sendNotification } = require('../utils/notifications');
      const templates = require('../utils/emailTemplates');
      
      await sendNotification(caregiver.user._id, {
        title: 'New Patient Review!',
        message: `${patient.user.name} left you a ${req.body.rating}-star review.`,
        type: 'NEW_REVIEW',
        priority: 'medium',
        emailSubject: `New ${req.body.rating}-Star Review on CareNest`,
        emailHtml: templates.newReviewEmail(caregiver.user.name, req.body.rating, req.body.comment)
      });
    } catch (notifErr) {
      console.error('Review notification failed:', notifErr.message);
    }

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

exports.respondToReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) return res.status(404).json({ success: false, message: 'Review not found' });

    const caregiver = await Caregiver.findOne({ user: req.user._id });
    if (review.caregiver.toString() !== caregiver._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to respond to this review' });
    }

    review.caregiverResponse = req.body.response;
    await review.save();

    res.json({ success: true, data: review });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
