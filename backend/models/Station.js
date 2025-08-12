const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, required: true, maxlength: 500 },
  date: { type: Date, default: Date.now }
});

const stationSchema = new mongoose.Schema({
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  address: { type: String, required: true }, // Human-readable address
  location: {
    type: { type: String, enum: ['Point'], required: true },
    coordinates: { type: [Number], required: true }, // [lng, lat]
  },
  types: [{ type: String }], // e.g., slow, fast, superfast
  plugTypes: [{ type: String }], // e.g., Type-1, CCS, CHAdeMO
  price: { type: Number, required: true }, // per hour/unit
  isAvailable24x7: { type: Boolean, default: false }, // 24/7 availability option
  availabilitySlots: [{
    start: String, // e.g., '09:00'
    end: String,   // e.g., '18:00'
  }],
  acceptMode: { type: String, enum: ['auto', 'request'], default: 'auto' }, // auto: accept without request, request: owner must approve
  // Reviews and Ratings
  reviews: [reviewSchema],
  averageRating: { type: Number, default: 0 },
  totalReviews: { type: Number, default: 0 }
}, { timestamps: true });

stationSchema.index({ location: '2dsphere' });

// Method to calculate average rating
stationSchema.methods.calculateAverageRating = function() {
  if (this.reviews.length === 0) {
    this.averageRating = 0;
    this.totalReviews = 0;
  } else {
    const totalRating = this.reviews.reduce((sum, review) => sum + review.rating, 0);
    this.averageRating = Math.round((totalRating / this.reviews.length) * 10) / 10; // Round to 1 decimal
    this.totalReviews = this.reviews.length;
  }
  return this.save();
};

module.exports = mongoose.model('Station', stationSchema); 