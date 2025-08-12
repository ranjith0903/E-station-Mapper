const mongoose = require('mongoose');

const onWheelServiceSchema = new mongoose.Schema({
  provider: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  companyName: { type: String, required: true },
  serviceName: { type: String, required: true },
  description: { type: String, required: true },
  serviceArea: {
    type: { type: String, enum: ['Point'], required: true },
    coordinates: { type: [Number], required: true }, // [lng, lat] - base location
    radius: { type: Number, required: true }, // service radius in kilometers
  },
  chargingTypes: [{ type: String }], // e.g., slow, fast, superfast
  plugTypes: [{ type: String }], // e.g., Type-1, CCS, CHAdeMO
  pricePerHour: { type: Number, required: true },
  pricePerUnit: { type: Number }, // price per kWh if applicable
  minimumCharge: { type: Number, default: 0 }, // minimum charge for service
  travelFee: { type: Number, default: 0 }, // additional fee for travel
  maxDistance: { type: Number, required: true }, // maximum distance willing to travel in km
  responseTime: { type: Number, required: true }, // average response time in minutes
  availability: {
    isAvailable24x7: { type: Boolean, default: false },
    workingHours: [{
      day: { type: String, enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] },
      start: String, // e.g., '09:00'
      end: String,   // e.g., '18:00'
    }],
    isCurrentlyAvailable: { type: Boolean, default: true }
  },
  contactInfo: {
    phone: { type: String, required: true },
    email: { type: String, required: true },
    whatsapp: { type: String },
    website: { type: String }
  },
  vehicleInfo: {
    vehicleType: { type: String, required: true }, // e.g., 'mobile-charger-van', 'truck', 'car'
    capacity: { type: Number, required: true }, // charging capacity in kW
    batteryCapacity: { type: Number }, // backup battery capacity if any
  },
  ratings: {
    averageRating: { type: Number, default: 0 },
    totalReviews: { type: Number, default: 0 },
    reviews: [{
      user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
      rating: { type: Number, required: true, min: 1, max: 5 },
      comment: { type: String, required: true, maxlength: 500 },
      date: { type: Date, default: Date.now }
    }]
  },
  documents: {
    businessLicense: { type: String }, // URL to business license
    insuranceCertificate: { type: String }, // URL to insurance certificate
    vehicleRegistration: { type: String }, // URL to vehicle registration
    isVerified: { type: Boolean, default: false }
  },
  status: { type: String, enum: ['active', 'inactive', 'suspended'], default: 'active' },
  isPremium: { type: Boolean, default: false }, // premium listing feature
  featuredUntil: { type: Date }, // premium listing expiry
  totalServices: { type: Number, default: 0 }, // total services provided
  totalEarnings: { type: Number, default: 0 } // total earnings from services
}, { timestamps: true });

// Index for geospatial queries
onWheelServiceSchema.index({ 'serviceArea': '2dsphere' });

// Method to calculate average rating
onWheelServiceSchema.methods.calculateAverageRating = function() {
  if (this.ratings.reviews.length === 0) {
    this.ratings.averageRating = 0;
    this.ratings.totalReviews = 0;
  } else {
    const totalRating = this.ratings.reviews.reduce((sum, review) => sum + review.rating, 0);
    this.ratings.averageRating = Math.round((totalRating / this.ratings.reviews.length) * 10) / 10;
    this.ratings.totalReviews = this.ratings.reviews.length;
  }
  return this.save();
};

// Method to check if service is available at given location
onWheelServiceSchema.methods.isAvailableAtLocation = function(location) {
  // Check if location is within service radius
  const distance = this.calculateDistance(
    this.serviceArea.coordinates[1], // lat
    this.serviceArea.coordinates[0], // lng
    location.lat,
    location.lng
  );
  
  return distance <= this.serviceArea.radius && this.availability.isCurrentlyAvailable;
};

// Helper method to calculate distance between two points
onWheelServiceSchema.methods.calculateDistance = function(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of the Earth in kilometers
  const dLat = this.deg2rad(lat2 - lat1);
  const dLon = this.deg2rad(lon2 - lon1);
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c; // Distance in kilometers
  return distance;
};

onWheelServiceSchema.methods.deg2rad = function(deg) {
  return deg * (Math.PI/180);
};

module.exports = mongoose.model('OnWheelService', onWheelServiceSchema);
