const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  // Basic Information
  phone: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  phoneVerified: {
    type: Boolean,
    default: false
  },
  verificationCode: {
    type: String,
    select: false // Don't include in queries by default
  },
  verificationCodeExpires: {
    type: Date,
    select: false
  },
  
  // Profile Information
  age: {
    type: Number,
    min: 13,
    max: 120
  },
  location: {
    type: String,
    trim: true
  },
  
  // Style Preferences
  interests: [{
    type: String,
    trim: true
  }],
  fits: [{
    type: String,
    trim: true
  }],
  
  // User Preferences
  preferences: {
    priceRange: {
      min: { type: Number, default: 0 },
      max: { type: Number, default: 10000 }
    },
    brands: [String],
    categories: [String],
    sizes: [String],
    colors: [String]
  },
  
  // Profile Settings
  profileComplete: {
    type: Boolean,
    default: false
  },
  onboardingComplete: {
    type: Boolean,
    default: false
  },
  
  // Activity Tracking
  lastActive: {
    type: Date,
    default: Date.now
  },
  totalSwipes: {
    type: Number,
    default: 0
  },
  totalLikes: {
    type: Number,
    default: 0
  },
  
  // Account Status
  isActive: {
    type: Boolean,
    default: true
  },
  isBlocked: {
    type: Boolean,
    default: false
  },
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Indexes for better performance
userSchema.index({ phone: 1 });
userSchema.index({ createdAt: -1 });
userSchema.index({ lastActive: -1 });

// Update the updatedAt field before saving
userSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Hash verification code before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('verificationCode') || !this.verificationCode) {
    return next();
  }
  
  this.verificationCode = await bcrypt.hash(this.verificationCode, 12);
  next();
});

// Instance method to check verification code
userSchema.methods.checkVerificationCode = async function(candidateCode) {
  if (!this.verificationCode) return false;
  return await bcrypt.compare(candidateCode, this.verificationCode);
};

// Instance method to check if verification code is expired
userSchema.methods.isVerificationCodeExpired = function() {
  return Date.now() > this.verificationCodeExpires;
};

// Instance method to update last active
userSchema.methods.updateLastActive = function() {
  this.lastActive = Date.now();
  return this.save();
};

// Static method to find active users
userSchema.statics.findActive = function() {
  return this.find({ isActive: true, isBlocked: false });
};

module.exports = mongoose.model('User', userSchema);
