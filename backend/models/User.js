const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['user', 'owner', 'admin'], default: 'user' },
  phone: { type: String },
  address: { type: String },
  vehicleType: { 
    type: String, 
    enum: ['electric-car', 'electric-bike', 'electric-scooter', 'hybrid', 'other', ''],
    default: ''
  },
  vehicleNumber: { type: String },
  // Admin-specific fields
  isActive: { type: Boolean, default: true },
  lastLogin: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema); 