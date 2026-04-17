const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  patient: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
  caregiver: { type: mongoose.Schema.Types.ObjectId, ref: 'Caregiver', required: true },
  service: { type: mongoose.Schema.Types.ObjectId, ref: 'Service', required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  startTime: { type: String },   // e.g. "09:00"
  endTime: { type: String },
  totalHours: { type: Number },
  totalCost: { type: Number },
  status: {
    type: String,
    enum: ['pending', 'awaiting_payment', 'confirmed', 'in_progress', 'completed', 'cancelled'],
    default: 'pending',
  },
  paymentStatus: {
    type: String,
    enum: ['unpaid', 'paid', 'refunded'],
    default: 'unpaid',
  },
  razorpayOrderId: { type: String },
  amount: { type: Number },
  specialInstructions: { type: String, maxlength: 1000 },
  address: {
    street: String, city: String, state: String, zipCode: String,
  },
  cancelReason: { type: String },
  confirmedAt: { type: Date },
  completedAt: { type: Date },
}, { timestamps: true });

// Virtual: care notes
bookingSchema.virtual('careNotes', {
  ref: 'CareNote',
  localField: '_id',
  foreignField: 'booking',
});

// Virtual: review
bookingSchema.virtual('review', {
  ref: 'Review',
  localField: '_id',
  foreignField: 'booking',
  justOne: true,
});

module.exports = mongoose.model('Booking', bookingSchema);
