const mongoose = require('mongoose');

const patientSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  dateOfBirth: { type: Date },
  gender: { type: String, enum: ['male', 'female', 'other', 'prefer_not_to_say'] },
  address: {
    street: String, city: String, state: String, zipCode: String,
  },
  medicalHistory: {
    conditions: [String],      // e.g. ['Diabetes Type 2', 'Hypertension']
    allergies: [String],
    currentMedications: [String],
    mobilityLevel: { type: String, enum: ['independent', 'assisted', 'wheelchair', 'bedridden'] },
    cognitionLevel: { type: String, enum: ['normal', 'mild_impairment', 'moderate_impairment', 'severe_impairment'] },
  },
  careNeeds: [{ type: String }],
  emergencyContact: {
    name: String, relationship: String, phone: String, email: String,
  },
  insuranceProvider: { type: String },
  primaryPhysician: { name: String, phone: String },
}, { timestamps: true });

module.exports = mongoose.model('Patient', patientSchema);
