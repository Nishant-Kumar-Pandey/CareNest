const Booking = require('../models/Booking');
const Caregiver = require('../models/Caregiver');
const sendEmail = require('../utils/sendEmail');
const io = require('../socket');

// @desc   Create booking
// @route  POST /api/bookings
exports.createBooking = async (req, res) => {
  try {
    const { caregiver, service, startDate, endDate, startTime, endTime, specialInstructions, address } = req.body;
    const Patient = require('../models/Patient');
    const patient = await Patient.findOne({ user: req.user._id });
    if (!patient) return res.status(400).json({ success: false, message: 'Patient profile required' });

    // 1. Caregiver Verification Firewall
    const targetCaregiver = await Caregiver.findById(caregiver);
    if (!targetCaregiver) return res.status(404).json({ success: false, message: 'Caregiver not found' });
    if (!targetCaregiver.isVerified) {
      return res.status(403).json({ success: false, message: 'Cannot book an unverified caregiver.' });
    }

    // 2. Strict Conflict Check (Dates + Times)
    // Find any overlapping booking ranges for this caregiver
    const conflicts = await Booking.find({
      caregiver,
      status: { $in: ['pending', 'confirmed', 'in_progress'] },
      $or: [
        { startDate: { $lte: new Date(endDate) }, endDate: { $gte: new Date(startDate) } },
      ],
    });

    // Check time overlap if they fall on the same date(s)
    let hasTimeConflict = false;
    for (let c of conflicts) {
      // Basic string comparison works for HH:mm (e.g., "09:00" < "12:00")
      if (startTime < c.endTime && endTime > c.startTime) {
        hasTimeConflict = true;
        break;
      }
    }

    if (hasTimeConflict) {
      return res.status(409).json({ success: false, message: 'Caregiver is unavailable for the selected dates and times.' });
    }

    const booking = await Booking.create({
      patient: patient._id, caregiver, service, startDate, endDate,
      startTime, endTime, specialInstructions, address,
    });

    await Caregiver.findByIdAndUpdate(caregiver, { $inc: { totalBookings: 1 } });
    const populated = await booking.populate(['caregiver', 'service']);

    const { sendNotification, broadcastAdminPulse } = require('../utils/notifications');
    
    // Alert Caregiver
    await sendNotification(caregiver, {
      title: 'New Care Booking Request',
      message: `You have received a new booking request from ${patient.user.name || 'a patient'}.`,
      type: 'BOOKING_UPDATE',
      priority: 'high',
      metadata: { bookingId: booking._id },
      emailSubject: 'New Care Booking Request',
      emailHtml: `<h2>New Booking Request</h2><p>You have received a new booking request from a patient. Please log into your Dashboard to Accept or Decline the request.</p>`
    });

    // Broadcast Admin Pulse
    broadcastAdminPulse({
      type: 'NEW_BOOKING',
      title: 'New Platform Booking',
      message: `${patient.user.name || 'A patient'} just requested care from ${targetCaregiver.user.name || 'a caregiver'}.`,
      metadata: { bookingId: booking._id, value: booking.totalCost }
    });

    res.status(201).json({ success: true, data: populated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc   Get bookings (role-aware)
// @route  GET /api/bookings
exports.getBookings = async (req, res) => {
  try {
    const Patient = require('../models/Patient');
    const { status } = req.query;
    let filter = {};
    if (status) filter.status = status;

    if (req.user.role === 'patient') {
      const patient = await Patient.findOne({ user: req.user._id });
      if (!patient) return res.status(403).json({ success: false, message: 'Patient profile incomplete' });
      filter.patient = patient._id;
    } else if (req.user.role === 'caregiver') {
      const caregiver = await Caregiver.findOne({ user: req.user._id });
      if (!caregiver) return res.status(403).json({ success: false, message: 'SetupRequired' });
      filter.caregiver = caregiver._id;
    }

    const bookings = await Booking.find(filter)
      .populate({ path: 'caregiver', populate: { path: 'user', select: 'name avatar' } })
      .populate({ path: 'patient', populate: { path: 'user', select: 'name avatar' } })
      .populate('service')
      .populate('review')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: bookings });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc   Update booking status
// @route  PATCH /api/bookings/:id/status
exports.updateStatus = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('patient')
      .populate('caregiver');
      
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });

    const { status, cancelReason } = req.body;
    const currentStatus = booking.status;
    const userRole = req.user.role;
    const userId = req.user._id.toString();

    // 1. Authorization Firewall
    let isAuthorized = false;
    if (userRole === 'admin') {
      isAuthorized = true;
    } else if (userRole === 'caregiver' && booking.caregiver.user.toString() === userId) {
      if (['awaiting_payment', 'confirmed', 'in_progress', 'completed', 'cancelled'].includes(status)) isAuthorized = true;
    } else if (userRole === 'patient' && booking.patient.user.toString() === userId) {
      if (['cancelled'].includes(status)) isAuthorized = true;
    }

    if (!isAuthorized) {
      return res.status(403).json({ success: false, message: 'Not authorized to perform this status transition' });
    }

    // 2. State Machine Validation
    const validTransitions = {
      pending: ['awaiting_payment', 'confirmed', 'cancelled'],
      awaiting_payment: ['confirmed', 'cancelled'],
      confirmed: ['in_progress', 'cancelled'],
      in_progress: ['completed'], // cannot cancel once started
      completed: [],
      cancelled: []
    };

    if (!validTransitions[currentStatus].includes(status)) {
      return res.status(400).json({ 
        success: false, 
        message: `Invalid state transition from '${currentStatus}' to '${status}'` 
      });
    }

    // Apply updates
    booking.status = status;
    if (status === 'confirmed') booking.confirmedAt = new Date();
    if (status === 'completed') booking.completedAt = new Date();
    if (status === 'cancelled') {
        booking.cancelReason = cancelReason || 'Cancelled by user prior to session';
    }
    await booking.save();

      const { sendNotification } = require('../utils/notifications');
      const targetUser = req.user.role === 'patient' 
         ? booking.caregiver.user // patient updated, alert caregiver
         : booking.patient.user;  // caregiver updated, alert patient
      
      await sendNotification(targetUser, {
        title: 'Booking Status Update',
        message: `Your booking status has been updated to ${status} by ${req.user.name}.`,
        type: 'BOOKING_UPDATE',
        priority: status === 'cancelled' ? 'high' : 'medium',
        metadata: { bookingId: booking._id },
        emailSubject: `Booking Update: ${status.toUpperCase()}`,
        emailHtml: `<h2>Update on your booking</h2><p>Your booking status has been updated to <strong>${status}</strong> by ${req.user.name}. Please check your dashboard for details.</p>`
      });

      // Trigger Socket Update
      try {
        const socketIO = require('../socket').getIO();
        socketIO.to(booking._id.toString()).emit('booking_status_updated', {
          bookingId: booking._id,
          status: status
        });
      } catch (e) {}

    res.json({ success: true, data: booking });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
