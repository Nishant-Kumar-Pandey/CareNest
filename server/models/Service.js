const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema({
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  description: { type: String, required: true },
  category: { type: String, enum: [
    'Personal Care', 'Medical Assistance', 'Companionship',
    'Household Help', 'Transportation', 'Specialized Care'
  ], required: true },
  basePrice: { type: Number, required: true },      // per hour
  duration: { type: String, default: 'Hourly' },   // 'Hourly', 'Daily', 'Weekly'
  icon: { type: String },
  features: [{ type: String }],
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('Service', serviceSchema);
