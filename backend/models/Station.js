const mongoose = require('mongoose');

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
  acceptMode: { type: String, enum: ['auto', 'request'], default: 'auto' } // auto: accept without request, request: owner must approve
}, { timestamps: true });

stationSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Station', stationSchema); 