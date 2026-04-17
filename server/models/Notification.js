const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  actor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['BOOKING_UPDATE', 'VETTING_REQUIRED', 'CRISIS_ALERT', 'SYSTEM', 'PAYMENT', 'VETTING_UPDATE'],
    required: true
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  isRead: {
    type: Boolean,
    default: false
  },
  metadata: {
    bookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking' },
    caregiverId: { type: mongoose.Schema.Types.ObjectId, ref: 'Caregiver' },
    link: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Notification', notificationSchema);
