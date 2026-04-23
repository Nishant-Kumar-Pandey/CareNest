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

    const attachments = [];
    if (req.files && req.files.length > 0) {
      req.files.forEach(file => {
        attachments.push({
          url: file.path,
          fileType: file.mimetype.startsWith('image') ? 'image' : 'document'
        });
      });
    }

    if (!text && attachments.length === 0) {
      return res.status(400).json({ success: false, message: 'Message cannot be empty' });
    }

    const message = await Message.create({
      booking: bookingId,
      sender: req.user.id,
      text: text || '',
      attachments,
      timestamp: new Date()
    });


    await message.populate('sender', 'name role');

    // Emit via socket
    const io = require('../socket').getIO();
    io.to(bookingId).emit('receive_message', message);
    
    // Notify participants (In-app + Socket)
    const patientUserId = booking.patient?.user?._id || booking.patient?.user;
    const caregiverUserId = booking.caregiver?.user?._id || booking.caregiver?.user;
    
    const recipientId = isPatient ? caregiverUserId : patientUserId;
    
    if (patientUserId) io.to(patientUserId.toString()).emit('new_chat_message', message);
    if (caregiverUserId) io.to(caregiverUserId.toString()).emit('new_chat_message', message);

    // ── EMAIL NOTIFICATION LOGIC ──
    try {
      const { sendNotification } = require('../utils/notifications');
      const templates = require('../utils/emailTemplates');
      const User = require('../models/User');
      
      const recipient = await User.findById(recipientId);
      const senderName = req.user.name || 'A user';

      if (recipient) {
        await sendNotification(recipient._id, {
          title: `New Message from ${senderName}`,
          message: text ? (text.substring(0, 50) + (text.length > 50 ? '...' : '')) : 'Sent an attachment',
          type: 'CHAT_MESSAGE',
          priority: 'medium',
          emailSubject: `New Message on CareNest from ${senderName}`,
          emailHtml: templates.newMessageEmail(recipient.name, senderName, text ? text.substring(0, 100) : 'Sent an attachment')
        });
      }
    } catch (notifErr) {
      console.error('Chat notification failed:', notifErr.message);
    }

    res.status(201).json({ success: true, data: message });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
