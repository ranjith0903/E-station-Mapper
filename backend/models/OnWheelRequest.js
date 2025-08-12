const mongoose = require('mongoose');

const onWheelRequestSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  service: { type: mongoose.Schema.Types.ObjectId, ref: 'OnWheelService', required: true },
  requestLocation: {
    type: { type: String, enum: ['Point'], required: true },
    coordinates: { type: [Number], required: true }, // [lng, lat]
    address: { type: String, required: true } // Human-readable address
  },
  vehicleInfo: {
    vehicleType: { type: String, required: true },
    vehicleNumber: { type: String },
    batteryLevel: { type: Number, min: 0, max: 100 }, // current battery percentage
    requiredCharge: { type: Number }, // required charge in kWh
  },
  chargingRequirements: {
    chargingType: { type: String, required: true }, // slow, fast, superfast
    plugType: { type: String, required: true }, // Type-1, CCS, CHAdeMO, etc.
    estimatedDuration: { type: Number }, // estimated charging time in hours
  },
  urgency: { type: String, enum: ['low', 'medium', 'high', 'emergency'], default: 'medium' },
  status: { 
    type: String, 
    enum: ['pending', 'accepted', 'in-progress', 'completed', 'cancelled', 'rejected'], 
    default: 'pending' 
  },
  pricing: {
    basePrice: { type: Number, required: true },
    travelFee: { type: Number, default: 0 },
    totalAmount: { type: Number, required: true },
    currency: { type: String, default: 'USD' }
  },
  schedule: {
    requestedTime: { type: Date, required: true },
    estimatedArrival: { type: Date },
    actualArrival: { type: Date },
    startTime: { type: Date },
    endTime: { type: Date },
    duration: { type: Number } // actual duration in minutes
  },
  contactInfo: {
    userPhone: { type: String, required: true },
    userEmail: { type: String, required: true },
    additionalNotes: { type: String, maxlength: 500 }
  },
  payment: {
    method: { type: String, enum: ['card', 'cash', 'digital-wallet'], default: 'card' },
    status: { type: String, enum: ['pending', 'paid', 'failed', 'refunded'], default: 'pending' },
    transactionId: { type: String },
    paidAt: { type: Date }
  },
  feedback: {
    rating: { type: Number, min: 1, max: 5 },
    comment: { type: String, maxlength: 500 },
    submittedAt: { type: Date }
  },
  cancellation: {
    cancelledBy: { type: String, enum: ['user', 'provider', 'system'] },
    reason: { type: String },
    cancelledAt: { type: Date }
  },
  // Real-time tracking
  tracking: {
    providerLocation: {
      type: { type: String, enum: ['Point'] },
      coordinates: [Number] // [lng, lat]
    },
    lastUpdated: { type: Date },
    eta: { type: Date }
  }
}, { timestamps: true });

// Index for geospatial queries
onWheelRequestSchema.index({ 'requestLocation': '2dsphere' });

// Method to calculate total amount
onWheelRequestSchema.methods.calculateTotalAmount = function() {
  this.pricing.totalAmount = this.pricing.basePrice + this.pricing.travelFee;
  return this.save();
};

// Method to update status
onWheelRequestSchema.methods.updateStatus = function(newStatus, additionalData = {}) {
  this.status = newStatus;
  
  // Update timestamps based on status
  switch (newStatus) {
    case 'accepted':
      this.schedule.estimatedArrival = additionalData.estimatedArrival;
      break;
    case 'in-progress':
      this.schedule.actualArrival = new Date();
      this.schedule.startTime = new Date();
      break;
    case 'completed':
      this.schedule.endTime = new Date();
      if (this.schedule.startTime) {
        this.schedule.duration = Math.round((this.schedule.endTime - this.schedule.startTime) / (1000 * 60));
      }
      break;
    case 'cancelled':
      this.cancellation.cancelledAt = new Date();
      this.cancellation.cancelledBy = additionalData.cancelledBy;
      this.cancellation.reason = additionalData.reason;
      break;
  }
  
  return this.save();
};

// Method to add feedback
onWheelRequestSchema.methods.addFeedback = function(rating, comment) {
  this.feedback.rating = rating;
  this.feedback.comment = comment;
  this.feedback.submittedAt = new Date();
  return this.save();
};

module.exports = mongoose.model('OnWheelRequest', onWheelRequestSchema);
