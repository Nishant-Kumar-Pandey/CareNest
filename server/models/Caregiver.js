const mongoose = require('mongoose');

const caregiverSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  bio: { type: String, maxlength: 1000 },
  specializations: [{ type: String, enum: [
    'Dementia Care', 'Post-Surgery Recovery', 'Physical Therapy Assistance',
    'Medication Management', 'Palliative Care', 'Companionship',
    'Wound Care', 'Mobility Assistance', 'Nutrition & Meal Prep', 'Chronic Disease Management', 'Personal Care'
  ]}],
  experience: { type: Number, default: 0 }, // years
  certifications: [{ name: String, issuer: String, year: Number }],
  hourlyRate: { type: Number, required: true },
  languages: [{ type: String }],
  availability: {
    monday:    { available: { type: Boolean, default: false }, hours: { type: String, default: '' } },
    tuesday:   { available: { type: Boolean, default: false }, hours: { type: String, default: '' } },
    wednesday: { available: { type: Boolean, default: false }, hours: { type: String, default: '' } },
    thursday:  { available: { type: Boolean, default: false }, hours: { type: String, default: '' } },
    friday:    { available: { type: Boolean, default: false }, hours: { type: String, default: '' } },
    saturday:  { available: { type: Boolean, default: false }, hours: { type: String, default: '' } },
    sunday:    { available: { type: Boolean, default: false }, hours: { type: String, default: '' } },
  },
  location: { city: String, state: String, zipCode: String },
  serviceAreas: [{ city: String, state: String, zipCode: String }],
  rating: { type: Number, default: 0, min: 0, max: 5 },
  totalReviews: { type: Number, default: 0 },
  totalBookings: { type: Number, default: 0 },
  isVerified: { type: Boolean, default: false },
  backgroundCheck: { type: Boolean, default: false },
  profileComplete: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('Caregiver', caregiverSchema);
