const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  booking: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    required: true
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  text: {
    type: String,
    trim: true
  },
  attachments: [{
    url: String,
    fileType: { type: String, enum: ['image', 'document', 'other'] }
  }],
  timestamp: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// Index for fast retrieval of messages per booking
messageSchema.index({ booking: 1, timestamp: 1 });

module.exports = mongoose.model('Message', messageSchema);
