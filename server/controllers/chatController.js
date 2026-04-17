const Message = require('../models/Message');
const Booking = require('../models/Booking');

// @desc    Get all messages for a booking
// @route   GET /api/bookings/:bookingId/messages
// @access  Private (Participants only)
exports.getMessages = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.bookingId)
      .populate({ path: 'patient', select: 'user' })
      .populate({ path: 'caregiver', select: 'user' });
      
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });

    // Ensure user is part of the booking
    const patientUserId = booking.patient?.user?._id || booking.patient?.user;
    const caregiverUserId = booking.caregiver?.user?._id || booking.caregiver?.user;

    const isPatient = patientUserId?.toString() === req.user.id;
    const isCaregiver = caregiverUserId?.toString() === req.user.id;
    
    if (!isPatient && !isCaregiver && req.user.role !== 'admin') {
      console.log(`403 Debug: User ${req.user.id} (${req.user.role}) trying to access booking ${req.params.bookingId}. PatientUser: ${patientUserId}, CaregiverUser: ${caregiverUserId}`);
      return res.status(403).json({ success: false, message: 'Not authorized to view these messages' });
    }

    const messages = await Message.find({ booking: req.params.bookingId })
      .populate('sender', 'name role')
      .sort({ timestamp: 1 });

    res.json({ success: true, count: messages.length, data: messages });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Create a new message (API version - usually used via Socket.io)
// @route   POST /api/bookings/:bookingId/messages
// @access  Private
exports.sendMessage = async (req, res) => {
  try {
    const { text } = req.body;
    const bookingId = req.params.bookingId;

    const booking = await Booking.findById(bookingId)
      .populate('patient', 'user')
      .populate('caregiver', 'user');
      
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });

    // Ensure user is part of the booking
    const isPatient = booking.patient?.user?.toString() === req.user.id;
    const isCaregiver = booking.caregiver?.user?.toString() === req.user.id;
    
    if (!isPatient && !isCaregiver && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to send messages to this booking' });
    }

    const message = await Message.create({
      booking: bookingId,
      sender: req.user.id,
      text,
      timestamp: new Date()
    });

    await message.populate('sender', 'name role');

    res.status(201).json({ success: true, data: message });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
