const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true, unique: true },
  caregiver: { type: mongoose.Schema.Types.ObjectId, ref: 'Caregiver', required: true },
  patient: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, maxlength: 2000 },
  categories: {
    punctuality:    { type: Number, min: 1, max: 5 },
    communication:  { type: Number, min: 1, max: 5 },
    professionalism:{ type: Number, min: 1, max: 5 },
    quality:        { type: Number, min: 1, max: 5 },
  },
  isPublic: { type: Boolean, default: true },
  caregiverResponse: { type: String, maxlength: 1000 },
  caregiverRespondedAt: { type: Date },
}, { timestamps: true });

// After save — update caregiver's average rating
reviewSchema.post('save', async function () {
  const Caregiver = require('./Caregiver');
  const Review = require('./Review');
  const stats = await Review.aggregate([
    { $match: { caregiver: this.caregiver } },
    { $group: { _id: '$caregiver', avgRating: { $avg: '$rating' }, count: { $sum: 1 } } },
  ]);
  if (stats.length > 0) {
    await Caregiver.findByIdAndUpdate(this.caregiver, {
      rating: Math.round(stats[0].avgRating * 10) / 10,
      totalReviews: stats[0].count,
    });
  }
});

module.exports = mongoose.model('Review', reviewSchema);
