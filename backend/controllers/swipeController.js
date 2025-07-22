const { Swipe, Product, User } = require('../models');
const { catchAsync, AppError } = require('../middleware/errorHandler');

// Record a swipe action
const recordSwipe = catchAsync(async (req, res) => {
  const userId = req.user._id;
  const { productId, action, context = {} } = req.body;
  
  // Validate action
  const validActions = ['like', 'dislike', 'super_like', 'skip'];
  if (!validActions.includes(action)) {
    throw new AppError('Invalid swipe action', 400);
  }
  
  // Check if product exists
  const product = await Product.findById(productId);
  if (!product) {
    throw new AppError('Product not found', 404);
  }
  
  if (!product.isActive) {
    throw new AppError('Product is no longer available', 400);
  }
  
  // Check if user has already swiped on this product
  const existingSwipe = await Swipe.findOne({
    user: userId,
    product: productId
  });
  
  if (existingSwipe) {
    // Update existing swipe
    existingSwipe.action = action;
    existingSwipe.swipeContext = {
      ...existingSwipe.swipeContext,
      ...context
    };
    await existingSwipe.save();
    
    // Update product engagement metrics
    await updateProductEngagement(productId, existingSwipe.action, action);
    
    // Update user stats
    await updateUserStats(userId, existingSwipe.action, action);
    
    return res.status(200).json({
      success: true,
      message: 'Swipe updated successfully',
      data: {
        swipe: existingSwipe,
        isUpdate: true
      }
    });
  }
  
  // Create new swipe
  const swipe = new Swipe({
    user: userId,
    product: productId,
    action,
    swipeContext: {
      source: context.source || 'home',
      position: context.position,
      sessionId: context.sessionId,
      timeSpent: context.timeSpent
    },
    deviceInfo: {
      platform: req.headers['x-platform'],
      userAgent: req.headers['user-agent'],
      screenSize: req.headers['x-screen-size']
    }
  });
  
  await swipe.save();
  
  // Update product engagement metrics
  await product.updateEngagement(getEngagementType(action), 1);
  
  // Update user stats
  const user = req.user;
  user.totalSwipes += 1;
  if (action === 'like' || action === 'super_like') {
    user.totalLikes += 1;
  }
  await user.save();
  
  res.status(201).json({
    success: true,
    message: 'Swipe recorded successfully',
    data: {
      swipe,
      isUpdate: false
    }
  });
});

// Get user's swipe history
const getSwipeHistory = catchAsync(async (req, res) => {
  const userId = req.user._id;
  const { page = 1, limit = 20, action } = req.query;
  
  const swipeHistory = await Swipe.getUserSwipeHistory(userId, parseInt(limit));
  
  // Filter by action if specified
  let filteredHistory = swipeHistory;
  if (action && ['like', 'dislike', 'super_like', 'skip'].includes(action)) {
    filteredHistory = swipeHistory.filter(swipe => swipe.action === action);
  }
  
  // Apply pagination
  const skip = (page - 1) * limit;
  const paginatedHistory = filteredHistory.slice(skip, skip + parseInt(limit));
  
  res.status(200).json({
    success: true,
    data: {
      swipes: paginatedHistory,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: filteredHistory.length,
        pages: Math.ceil(filteredHistory.length / limit)
      }
    }
  });
});

// Get swipe statistics
const getSwipeStats = catchAsync(async (req, res) => {
  const userId = req.user._id;
  const { period = 7 } = req.query; // days
  
  const dateThreshold = new Date();
  dateThreshold.setDate(dateThreshold.getDate() - parseInt(period));
  
  // Get swipe stats for the period
  const stats = await Swipe.aggregate([
    {
      $match: {
        user: userId,
        createdAt: { $gte: dateThreshold }
      }
    },
    {
      $group: {
        _id: '$action',
        count: { $sum: 1 },
        avgTimeSpent: { $avg: '$swipeContext.timeSpent' }
      }
    }
  ]);
  
  // Get total stats
  const totalStats = await Swipe.aggregate([
    { $match: { user: userId } },
    {
      $group: {
        _id: '$action',
        count: { $sum: 1 }
      }
    }
  ]);
  
  // Format response
  const periodStats = {};
  const allTimeStats = {};
  
  stats.forEach(stat => {
    periodStats[stat._id] = {
      count: stat.count,
      avgTimeSpent: Math.round(stat.avgTimeSpent || 0)
    };
  });
  
  totalStats.forEach(stat => {
    allTimeStats[stat._id] = stat.count;
  });
  
  res.status(200).json({
    success: true,
    data: {
      period: `${period} days`,
      periodStats,
      allTimeStats,
      totalSwipes: req.user.totalSwipes,
      totalLikes: req.user.totalLikes
    }
  });
});

// Undo last swipe
const undoLastSwipe = catchAsync(async (req, res) => {
  const userId = req.user._id;
  
  // Find the most recent swipe
  const lastSwipe = await Swipe.findOne({ user: userId })
    .sort({ createdAt: -1 })
    .populate('product');
  
  if (!lastSwipe) {
    throw new AppError('No swipes to undo', 400);
  }
  
  // Check if swipe is recent enough to undo (within 5 minutes)
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
  if (lastSwipe.createdAt < fiveMinutesAgo) {
    throw new AppError('Swipe is too old to undo', 400);
  }
  
  // Remove the swipe
  await Swipe.findByIdAndDelete(lastSwipe._id);
  
  // Update product engagement metrics
  const product = await Product.findById(lastSwipe.product._id);
  if (product) {
    await product.updateEngagement(getEngagementType(lastSwipe.action), -1);
  }
  
  // Update user stats
  const user = req.user;
  user.totalSwipes = Math.max(0, user.totalSwipes - 1);
  if (lastSwipe.action === 'like' || lastSwipe.action === 'super_like') {
    user.totalLikes = Math.max(0, user.totalLikes - 1);
  }
  await user.save();
  
  res.status(200).json({
    success: true,
    message: 'Last swipe undone successfully',
    data: {
      undoneSwipe: lastSwipe
    }
  });
});

// Get product engagement stats
const getProductEngagement = catchAsync(async (req, res) => {
  const { productId } = req.params;
  
  const product = await Product.findById(productId);
  if (!product) {
    throw new AppError('Product not found', 404);
  }
  
  const engagement = await Swipe.getProductEngagement(productId);
  
  // Format engagement data
  const engagementStats = {};
  engagement.forEach(stat => {
    engagementStats[stat._id] = stat.count;
  });
  
  res.status(200).json({
    success: true,
    data: {
      productId,
      engagement: engagementStats,
      totalViews: product.totalViews,
      totalLikes: product.totalLikes,
      totalDislikes: product.totalDislikes,
      totalWishlisted: product.totalWishlisted
    }
  });
});

// Get personalized recommendations
const getPersonalizedRecommendations = catchAsync(async (req, res) => {
  const userId = req.user._id;
  const { limit = 20 } = req.query;
  
  // Get user's swipe patterns and preferences
  const recommendationData = await Swipe.getRecommendationData(userId);
  
  // Get products user hasn't swiped
  const swipedProductIds = await Swipe.getSwipedProductIds(userId);
  
  // Build recommendation query based on user preferences
  let query = {
    _id: { $nin: swipedProductIds },
    isActive: true,
    inStock: true
  };
  
  // Apply user preferences from swipe history
  const likedData = recommendationData.find(data => data._id === 'like');
  if (likedData) {
    // Prefer categories user has liked
    if (likedData.categories.length > 0) {
      query.category = { $in: likedData.categories };
    }
    
    // Prefer brands user has liked
    if (likedData.brands.length > 0) {
      query.brand = { $in: likedData.brands };
    }
  }
  
  // Apply user's explicit preferences
  const userPrefs = req.user.preferences;
  if (userPrefs && userPrefs.priceRange) {
    query['price.current'] = {
      $gte: userPrefs.priceRange.min || 0,
      $lte: userPrefs.priceRange.max || 100000
    };
  }
  
  const recommendations = await Product.find(query)
    .sort({ totalLikes: -1, createdAt: -1 })
    .limit(parseInt(limit));
  
  res.status(200).json({
    success: true,
    data: {
      recommendations,
      count: recommendations.length,
      basedOn: 'user_preferences_and_swipe_history'
    }
  });
});

// Helper functions
const getEngagementType = (action) => {
  switch (action) {
    case 'like':
    case 'super_like':
      return 'like';
    case 'dislike':
      return 'dislike';
    default:
      return null;
  }
};

const updateProductEngagement = async (productId, oldAction, newAction) => {
  const product = await Product.findById(productId);
  if (!product) return;
  
  // Decrease old action count
  if (oldAction === 'like' || oldAction === 'super_like') {
    product.totalLikes = Math.max(0, product.totalLikes - 1);
  } else if (oldAction === 'dislike') {
    product.totalDislikes = Math.max(0, product.totalDislikes - 1);
  }
  
  // Increase new action count
  if (newAction === 'like' || newAction === 'super_like') {
    product.totalLikes += 1;
  } else if (newAction === 'dislike') {
    product.totalDislikes += 1;
  }
  
  await product.save();
};

const updateUserStats = async (userId, oldAction, newAction) => {
  const user = await User.findById(userId);
  if (!user) return;
  
  // Adjust like count if action changed
  if ((oldAction === 'like' || oldAction === 'super_like') && 
      (newAction !== 'like' && newAction !== 'super_like')) {
    user.totalLikes = Math.max(0, user.totalLikes - 1);
  } else if ((oldAction !== 'like' && oldAction !== 'super_like') && 
             (newAction === 'like' || newAction === 'super_like')) {
    user.totalLikes += 1;
  }
  
  await user.save();
};

module.exports = {
  recordSwipe,
  getSwipeHistory,
  getSwipeStats,
  undoLastSwipe,
  getProductEngagement,
  getPersonalizedRecommendations
};
