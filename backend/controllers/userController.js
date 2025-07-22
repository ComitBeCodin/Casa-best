const { User, Swipe, Wishlist } = require('../models');
const { catchAsync } = require('../middleware/errorHandler');

// Get user statistics
const getUserStats = catchAsync(async (req, res) => {
  const userId = req.user._id;
  
  // Get swipe statistics
  const swipeStats = await Swipe.getUserSwipePatterns(userId);
  
  // Get wishlist count
  const wishlist = await Wishlist.findOne({ user: userId });
  const wishlistCount = wishlist ? wishlist.totalItems : 0;
  
  // Format swipe stats
  const formattedSwipeStats = {};
  swipeStats.forEach(stat => {
    formattedSwipeStats[stat._id] = {
      count: stat.count,
      avgTimeSpent: Math.round(stat.avgTimeSpent || 0)
    };
  });
  
  res.status(200).json({
    success: true,
    data: {
      stats: {
        totalSwipes: req.user.totalSwipes,
        totalLikes: req.user.totalLikes,
        wishlistItems: wishlistCount,
        swipeBreakdown: formattedSwipeStats,
        memberSince: req.user.createdAt,
        lastActive: req.user.lastActive
      }
    }
  });
});

// Update user preferences
const updatePreferences = catchAsync(async (req, res) => {
  const user = req.user;
  const { preferences } = req.body;
  
  if (!preferences || typeof preferences !== 'object') {
    return res.status(400).json({
      success: false,
      message: 'Valid preferences object is required'
    });
  }
  
  // Merge with existing preferences
  user.preferences = {
    ...user.preferences,
    ...preferences
  };
  
  await user.save();
  
  res.status(200).json({
    success: true,
    message: 'Preferences updated successfully',
    data: {
      preferences: user.preferences
    }
  });
});

// Get user activity history
const getActivityHistory = catchAsync(async (req, res) => {
  const userId = req.user._id;
  const { page = 1, limit = 20, type } = req.query;
  
  const skip = (page - 1) * limit;
  
  let query = { user: userId };
  if (type && ['like', 'dislike', 'super_like', 'skip'].includes(type)) {
    query.action = type;
  }
  
  const activities = await Swipe.find(query)
    .populate('product', 'name brand images price category')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));
  
  const total = await Swipe.countDocuments(query);
  
  res.status(200).json({
    success: true,
    data: {
      activities,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    }
  });
});

// Get user's liked products
const getLikedProducts = catchAsync(async (req, res) => {
  const userId = req.user._id;
  const { page = 1, limit = 20 } = req.query;
  
  const skip = (page - 1) * limit;
  
  const likedProducts = await Swipe.find({
    user: userId,
    action: { $in: ['like', 'super_like'] }
  })
    .populate('product')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));
  
  const total = await Swipe.countDocuments({
    user: userId,
    action: { $in: ['like', 'super_like'] }
  });
  
  res.status(200).json({
    success: true,
    data: {
      products: likedProducts.map(swipe => ({
        ...swipe.product.toObject(),
        likedAt: swipe.createdAt,
        swipeType: swipe.action
      })),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    }
  });
});

// Update user interests
const updateInterests = catchAsync(async (req, res) => {
  const user = req.user;
  const { interests } = req.body;
  
  if (!Array.isArray(interests)) {
    return res.status(400).json({
      success: false,
      message: 'Interests must be an array'
    });
  }
  
  user.interests = interests;
  await user.save();
  
  res.status(200).json({
    success: true,
    message: 'Interests updated successfully',
    data: {
      interests: user.interests
    }
  });
});

// Update user fits
const updateFits = catchAsync(async (req, res) => {
  const user = req.user;
  const { fits } = req.body;
  
  if (!Array.isArray(fits)) {
    return res.status(400).json({
      success: false,
      message: 'Fits must be an array'
    });
  }
  
  user.fits = fits;
  await user.save();
  
  res.status(200).json({
    success: true,
    message: 'Fits updated successfully',
    data: {
      fits: user.fits
    }
  });
});

// Delete user account
const deleteAccount = catchAsync(async (req, res) => {
  const userId = req.user._id;
  
  // Soft delete - mark as inactive instead of actually deleting
  await User.findByIdAndUpdate(userId, {
    isActive: false,
    phone: `deleted_${Date.now()}_${req.user.phone}` // Prevent phone conflicts
  });
  
  // Note: In a production app, you might want to:
  // 1. Delete or anonymize user data according to privacy laws
  // 2. Remove user from all wishlists, swipes, etc.
  // 3. Send confirmation email
  
  res.status(200).json({
    success: true,
    message: 'Account deleted successfully'
  });
});

// Get user recommendations based on activity
const getRecommendations = catchAsync(async (req, res) => {
  const userId = req.user._id;
  
  // Get user's recommendation data
  const recommendationData = await Swipe.getRecommendationData(userId);
  
  // Extract preferences from user's swipe history
  let preferredCategories = [];
  let preferredBrands = [];
  let preferredColors = [];
  let priceRange = { min: 0, max: 10000 };
  
  recommendationData.forEach(data => {
    if (data._id === 'like' || data._id === 'super_like') {
      preferredCategories = [...preferredCategories, ...data.categories];
      preferredBrands = [...preferredBrands, ...data.brands];
      preferredColors = [...preferredColors, ...data.colors];
      
      if (data.priceRange.length > 0) {
        const prices = data.priceRange.sort((a, b) => a - b);
        priceRange.min = Math.min(priceRange.min, prices[0]);
        priceRange.max = Math.max(priceRange.max, prices[prices.length - 1]);
      }
    }
  });
  
  // Remove duplicates
  preferredCategories = [...new Set(preferredCategories)];
  preferredBrands = [...new Set(preferredBrands)];
  preferredColors = [...new Set(preferredColors.filter(Boolean))];
  
  res.status(200).json({
    success: true,
    data: {
      recommendations: {
        categories: preferredCategories,
        brands: preferredBrands,
        colors: preferredColors,
        priceRange,
        interests: req.user.interests,
        fits: req.user.fits
      }
    }
  });
});

module.exports = {
  getUserStats,
  updatePreferences,
  getActivityHistory,
  getLikedProducts,
  updateInterests,
  updateFits,
  deleteAccount,
  getRecommendations
};
