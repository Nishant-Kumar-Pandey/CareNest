const mongoose = require('mongoose');

const medicationSchema = new mongoose.Schema({
  patient: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
  name: { type: String, required: true },
  dosage: { type: String, required: true },
  frequency: { 
    type: String, 
    enum: ['daily', 'weekly', 'twice_daily', 'thrice_daily', 'as_needed'],
    default: 'daily'
  },
  times: [{ type: String }], // Array of "HH:mm" strings
  startDate: { type: Date, default: Date.now },
  endDate: { type: Date },
  instructions: { type: String },
  isActive: { type: Boolean, default: true },
  remindPatient: { type: Boolean, default: true },
  remindCaregiver: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Medication', medicationSchema);
