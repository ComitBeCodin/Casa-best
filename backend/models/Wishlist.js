const mongoose = require('mongoose');

const wishlistItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  addedAt: {
    type: Date,
    default: Date.now
  },
  priority: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  notes: {
    type: String,
    maxlength: 500,
    trim: true
  },
  priceWhenAdded: {
    type: Number,
    min: 0
  },
  notifyOnPriceChange: {
    type: Boolean,
    default: false
  },
  notifyOnRestock: {
    type: Boolean,
    default: false
  }
});

const wishlistSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  items: [wishlistItemSchema],
  
  // Wishlist Settings
  isPublic: {
    type: Boolean,
    default: false
  },
  name: {
    type: String,
    default: 'My Wishlist',
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    maxlength: 500,
    trim: true
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
wishlistSchema.index({ user: 1 });
wishlistSchema.index({ 'items.product': 1 });
wishlistSchema.index({ 'items.addedAt': -1 });
wishlistSchema.index({ updatedAt: -1 });

// Update the updatedAt field before saving
wishlistSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Virtual for total items count
wishlistSchema.virtual('totalItems').get(function() {
  return this.items.length;
});

// Instance method to add item to wishlist
wishlistSchema.methods.addItem = function(productId, options = {}) {
  // Check if item already exists
  const existingItem = this.items.find(item => 
    item.product.toString() === productId.toString()
  );
  
  if (existingItem) {
    // Update existing item
    existingItem.priority = options.priority || existingItem.priority;
    existingItem.notes = options.notes || existingItem.notes;
    existingItem.notifyOnPriceChange = options.notifyOnPriceChange !== undefined 
      ? options.notifyOnPriceChange 
      : existingItem.notifyOnPriceChange;
    existingItem.notifyOnRestock = options.notifyOnRestock !== undefined 
      ? options.notifyOnRestock 
      : existingItem.notifyOnRestock;
    return this.save();
  }
  
  // Add new item
  this.items.push({
    product: productId,
    priority: options.priority || 0,
    notes: options.notes || '',
    priceWhenAdded: options.priceWhenAdded,
    notifyOnPriceChange: options.notifyOnPriceChange || false,
    notifyOnRestock: options.notifyOnRestock || false
  });
  
  return this.save();
};

// Instance method to remove item from wishlist
wishlistSchema.methods.removeItem = function(productId) {
  this.items = this.items.filter(item => 
    item.product.toString() !== productId.toString()
  );
  return this.save();
};

// Instance method to update item priority
wishlistSchema.methods.updateItemPriority = function(productId, priority) {
  const item = this.items.find(item => 
    item.product.toString() === productId.toString()
  );
  
  if (item) {
    item.priority = priority;
    return this.save();
  }
  
  throw new Error('Item not found in wishlist');
};

// Instance method to check if product is in wishlist
wishlistSchema.methods.hasProduct = function(productId) {
  return this.items.some(item => 
    item.product.toString() === productId.toString()
  );
};

// Instance method to get items sorted by priority
wishlistSchema.methods.getItemsByPriority = function() {
  return this.items.sort((a, b) => b.priority - a.priority);
};

// Instance method to get items sorted by date added
wishlistSchema.methods.getItemsByDate = function(ascending = false) {
  return this.items.sort((a, b) => {
    return ascending 
      ? new Date(a.addedAt) - new Date(b.addedAt)
      : new Date(b.addedAt) - new Date(a.addedAt);
  });
};

// Static method to find or create wishlist for user
wishlistSchema.statics.findOrCreateForUser = async function(userId) {
  let wishlist = await this.findOne({ user: userId });
  
  if (!wishlist) {
    wishlist = new this({ user: userId });
    await wishlist.save();
  }
  
  return wishlist;
};

// Static method to get popular wishlist items
wishlistSchema.statics.getPopularItems = function(limit = 20) {
  return this.aggregate([
    { $unwind: '$items' },
    {
      $group: {
        _id: '$items.product',
        count: { $sum: 1 },
        avgPriority: { $avg: '$items.priority' }
      }
    },
    { $sort: { count: -1, avgPriority: -1 } },
    { $limit: limit },
    {
      $lookup: {
        from: 'products',
        localField: '_id',
        foreignField: '_id',
        as: 'product'
      }
    },
    { $unwind: '$product' },
    {
      $project: {
        product: 1,
        wishlistCount: '$count',
        avgPriority: 1
      }
    }
  ]);
};

// Static method to get price change notifications
wishlistSchema.statics.getPriceChangeNotifications = function() {
  return this.aggregate([
    { $unwind: '$items' },
    { $match: { 'items.notifyOnPriceChange': true } },
    {
      $lookup: {
        from: 'products',
        localField: 'items.product',
        foreignField: '_id',
        as: 'productData'
      }
    },
    { $unwind: '$productData' },
    {
      $match: {
        $expr: {
          $lt: ['$productData.price.current', '$items.priceWhenAdded']
        }
      }
    },
    {
      $project: {
        user: 1,
        product: '$productData',
        originalPrice: '$items.priceWhenAdded',
        currentPrice: '$productData.price.current',
        savings: {
          $subtract: ['$items.priceWhenAdded', '$productData.price.current']
        }
      }
    }
  ]);
};

module.exports = mongoose.model('Wishlist', wishlistSchema);
