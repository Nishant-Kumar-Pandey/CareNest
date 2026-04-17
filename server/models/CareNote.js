const mongoose = require('mongoose');

const careNoteSchema = new mongoose.Schema({
  booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true },
  caregiver: { type: mongoose.Schema.Types.ObjectId, ref: 'Caregiver', required: true },
  date: { type: Date, required: true, default: Date.now },
  content: { type: String, required: true, maxlength: 5000 },
  vitals: {
    bloodPressure: String,     // e.g. "120/80"
    heartRate: Number,         // bpm
    temperature: Number,       // Fahrenheit
    bloodGlucose: Number,      // mg/dL
    oxygenSaturation: Number,  // %
    weight: Number,            // lbs
  },
  medications: [{
    name: String, dosage: String, administered: Boolean, time: String, notes: String,
  }],
  mood: { type: String, enum: ['excellent', 'good', 'fair', 'poor', 'distressed'] },
  activities: [String],
  concerns: { type: String },
  followUp: { type: Boolean, default: false },
  isPrivate: { type: Boolean, default: false },   // caregiver-only notes
}, { timestamps: true });

module.exports = mongoose.model('CareNote', careNoteSchema);
