const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  // Basic Product Information
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000
  },
  brand: {
    type: String,
    required: true,
    trim: true
  },
  
  // Product Images
  images: [{
    url: {
      type: String,
      required: true
    },
    publicId: String, // For Cloudinary
    alt: String,
    isPrimary: {
      type: Boolean,
      default: false
    }
  }],
  
  // Pricing Information
  price: {
    original: {
      type: Number,
      required: true,
      min: 0
    },
    current: {
      type: Number,
      required: true,
      min: 0
    },
    currency: {
      type: String,
      default: 'INR'
    }
  },
  
  // Product Details
  category: {
    type: String,
    required: true,
    enum: [
      'tops', 'bottoms', 'dresses', 'outerwear', 'footwear', 
      'accessories', 'bags', 'jewelry', 'watches', 'sunglasses'
    ]
  },
  subcategory: {
    type: String,
    trim: true
  },
  gender: {
    type: String,
    required: true,
    enum: ['men', 'women', 'unisex', 'kids']
  },
  
  // Size and Fit
  sizes: [{
    size: {
      type: String,
      required: true
    },
    inStock: {
      type: Boolean,
      default: true
    },
    quantity: {
      type: Number,
      default: 0
    }
  }],
  
  // Style Attributes
  colors: [String],
  materials: [String],
  patterns: [String],
  occasions: [String],
  seasons: [String],
  
  // Product Status
  isActive: {
    type: Boolean,
    default: true
  },
  inStock: {
    type: Boolean,
    default: true
  },
  
  // Engagement Metrics
  totalViews: {
    type: Number,
    default: 0
  },
  totalLikes: {
    type: Number,
    default: 0
  },
  totalDislikes: {
    type: Number,
    default: 0
  },
  totalWishlisted: {
    type: Number,
    default: 0
  },
  
  // SEO and Search
  tags: [String],
  searchKeywords: [String],
  
  // External Links
  purchaseUrl: String,
  affiliateUrl: String,
  
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
productSchema.index({ category: 1, gender: 1 });
productSchema.index({ brand: 1 });
productSchema.index({ 'price.current': 1 });
productSchema.index({ createdAt: -1 });
productSchema.index({ totalLikes: -1 });
productSchema.index({ isActive: 1, inStock: 1 });

// Text index for search functionality
productSchema.index({
  name: 'text',
  description: 'text',
  brand: 'text',
  tags: 'text',
  searchKeywords: 'text'
});

// Update the updatedAt field before saving
productSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Virtual for discount percentage
productSchema.virtual('discountPercentage').get(function() {
  if (this.price.original <= this.price.current) return 0;
  return Math.round(((this.price.original - this.price.current) / this.price.original) * 100);
});

// Virtual for primary image
productSchema.virtual('primaryImage').get(function() {
  const primary = this.images.find(img => img.isPrimary);
  return primary || this.images[0] || null;
});

// Instance method to increment view count
productSchema.methods.incrementViews = function() {
  this.totalViews += 1;
  return this.save();
};

// Instance method to update engagement metrics
productSchema.methods.updateEngagement = function(type, increment = 1) {
  switch(type) {
    case 'like':
      this.totalLikes += increment;
      break;
    case 'dislike':
      this.totalDislikes += increment;
      break;
    case 'wishlist':
      this.totalWishlisted += increment;
      break;
  }
  return this.save();
};

// Static method to find trending products
productSchema.statics.findTrending = function(limit = 20) {
  return this.find({ isActive: true, inStock: true })
    .sort({ totalLikes: -1, totalViews: -1 })
    .limit(limit);
};

// Static method to find products by category
productSchema.statics.findByCategory = function(category, gender = null) {
  const query = { category, isActive: true, inStock: true };
  if (gender) query.gender = gender;
  return this.find(query);
};

module.exports = mongoose.model('Product', productSchema);
