const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  station: { type: mongoose.Schema.Types.ObjectId, ref: 'Station', required: true },
  slot: {
    start: Date,
    end: Date
  },
  status: { 
    type: String, 
    enum: ['pending', 'confirmed', 'ongoing', 'completed', 'cancelled'], 
    default: 'pending' 
  },
  // Actual session times (when user actually starts/ends charging)
  actualStart: { type: Date },
  actualEnd: { type: Date },
  // Session duration tracking
  sessionDuration: { type: Number }, // in minutes
  // Wait time estimation
  estimatedWaitTime: { type: Number }, // in minutes
  queuePosition: { type: Number }, // position in queue
  paymentIntentId: { type: String },
  amount: { type: Number },
  // Additional fields for admin management
  reportedIssues: [{
    type: { type: String, enum: ['technical', 'payment', 'safety', 'other'] },
    description: String,
    reportedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    reportedAt: { type: Date, default: Date.now },
    status: { type: String, enum: ['open', 'investigating', 'resolved'], default: 'open' }
  }]
}, { timestamps: true });

// Virtual for calculating ongoing session duration
bookingSchema.virtual('currentSessionDuration').get(function() {
  if (this.status === 'ongoing' && this.actualStart) {
    return Math.floor((Date.now() - this.actualStart.getTime()) / (1000 * 60)); // minutes
  }
  return 0;
});

// Virtual for calculating remaining time
bookingSchema.virtual('remainingTime').get(function() {
  if (this.status === 'ongoing' && this.actualStart && this.slot.end) {
    const endTime = new Date(this.slot.end);
    const remaining = endTime.getTime() - Date.now();
    return Math.max(0, Math.floor(remaining / (1000 * 60))); // minutes
  }
  return 0;
});

// Method to start charging session
bookingSchema.methods.startSession = function() {
  this.status = 'ongoing';
  this.actualStart = new Date();
  return this.save();
};

// Method to end charging session
bookingSchema.methods.endSession = function() {
  this.status = 'completed';
  this.actualEnd = new Date();
  if (this.actualStart) {
    this.sessionDuration = Math.floor((this.actualEnd.getTime() - this.actualStart.getTime()) / (1000 * 60));
  }
  return this.save();
};

module.exports = mongoose.model('Booking', bookingSchema); 