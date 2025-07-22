const mongoose = require('mongoose');

const swipeSchema = new mongoose.Schema({
  // User and Product References
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  
  // Swipe Action
  action: {
    type: String,
    required: true,
    enum: ['like', 'dislike', 'super_like', 'skip']
  },
  
  // Additional Context
  swipeContext: {
    source: {
      type: String,
      enum: ['home', 'explore', 'category', 'search', 'recommendation'],
      default: 'home'
    },
    position: Number, // Position in the feed when swiped
    sessionId: String, // To track swipe sessions
    timeSpent: Number // Time spent viewing before swipe (in seconds)
  },
  
  // Metadata
  deviceInfo: {
    platform: String,
    userAgent: String,
    screenSize: String
  },
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Compound indexes for better performance
swipeSchema.index({ user: 1, product: 1 }, { unique: true }); // Prevent duplicate swipes
swipeSchema.index({ user: 1, createdAt: -1 });
swipeSchema.index({ product: 1, action: 1 });
swipeSchema.index({ createdAt: -1 });
swipeSchema.index({ action: 1, createdAt: -1 });

// Static method to get user's swipe history
swipeSchema.statics.getUserSwipeHistory = function(userId, limit = 50) {
  return this.find({ user: userId })
    .populate('product', 'name brand images price category')
    .sort({ createdAt: -1 })
    .limit(limit);
};

// Static method to get products user has already swiped
swipeSchema.statics.getSwipedProductIds = function(userId) {
  return this.find({ user: userId }).distinct('product');
};

// Static method to get user's liked products
swipeSchema.statics.getUserLikedProducts = function(userId) {
  return this.find({ user: userId, action: { $in: ['like', 'super_like'] } })
    .populate('product')
    .sort({ createdAt: -1 });
};

// Static method to get product engagement stats
swipeSchema.statics.getProductEngagement = function(productId) {
  return this.aggregate([
    { $match: { product: new mongoose.Types.ObjectId(productId) } },
    {
      $group: {
        _id: '$action',
        count: { $sum: 1 }
      }
    }
  ]);
};

// Static method to get user's swipe patterns
swipeSchema.statics.getUserSwipePatterns = function(userId) {
  return this.aggregate([
    { $match: { user: new mongoose.Types.ObjectId(userId) } },
    {
      $group: {
        _id: '$action',
        count: { $sum: 1 },
        avgTimeSpent: { $avg: '$swipeContext.timeSpent' }
      }
    }
  ]);
};

// Static method to get trending products based on recent swipes
swipeSchema.statics.getTrendingProducts = function(days = 7, limit = 20) {
  const dateThreshold = new Date();
  dateThreshold.setDate(dateThreshold.getDate() - days);
  
  return this.aggregate([
    {
      $match: {
        createdAt: { $gte: dateThreshold },
        action: { $in: ['like', 'super_like'] }
      }
    },
    {
      $group: {
        _id: '$product',
        likeCount: { $sum: 1 },
        superLikeCount: {
          $sum: { $cond: [{ $eq: ['$action', 'super_like'] }, 1, 0] }
        }
      }
    },
    {
      $addFields: {
        score: { $add: ['$likeCount', { $multiply: ['$superLikeCount', 2] }] }
      }
    },
    { $sort: { score: -1 } },
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
        likeCount: 1,
        superLikeCount: 1,
        score: 1
      }
    }
  ]);
};

// Static method to get recommendation data for a user
swipeSchema.statics.getRecommendationData = function(userId) {
  return this.aggregate([
    { $match: { user: new mongoose.Types.ObjectId(userId) } },
    {
      $lookup: {
        from: 'products',
        localField: 'product',
        foreignField: '_id',
        as: 'productData'
      }
    },
    { $unwind: '$productData' },
    {
      $group: {
        _id: '$action',
        categories: { $addToSet: '$productData.category' },
        brands: { $addToSet: '$productData.brand' },
        colors: { $addToSet: { $arrayElemAt: ['$productData.colors', 0] } },
        priceRange: {
          $push: '$productData.price.current'
        }
      }
    }
  ]);
};

module.exports = mongoose.model('Swipe', swipeSchema);
