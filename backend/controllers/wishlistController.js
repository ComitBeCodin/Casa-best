const { Wishlist, Product } = require('../models');
const { catchAsync, AppError } = require('../middleware/errorHandler');

// Get user's wishlist
const getWishlist = catchAsync(async (req, res) => {
  const userId = req.user._id;
  
  const wishlist = await Wishlist.findOrCreateForUser(userId);
  await wishlist.populate('items.product');
  
  res.status(200).json({
    success: true,
    data: {
      wishlist
    }
  });
});

// Add item to wishlist
const addToWishlist = catchAsync(async (req, res) => {
  const userId = req.user._id;
  const { productId, priority, notes, notifyOnPriceChange, notifyOnRestock } = req.body;
  
  // Check if product exists
  const product = await Product.findById(productId);
  if (!product) {
    throw new AppError('Product not found', 404);
  }
  
  const wishlist = await Wishlist.findOrCreateForUser(userId);
  
  await wishlist.addItem(productId, {
    priority,
    notes,
    priceWhenAdded: product.price.current,
    notifyOnPriceChange,
    notifyOnRestock
  });
  
  // Update product wishlist count
  await product.updateEngagement('wishlist', 1);
  
  await wishlist.populate('items.product');
  
  res.status(200).json({
    success: true,
    message: 'Item added to wishlist successfully',
    data: {
      wishlist
    }
  });
});

// Remove item from wishlist
const removeFromWishlist = catchAsync(async (req, res) => {
  const userId = req.user._id;
  const { productId } = req.params;
  
  const wishlist = await Wishlist.findOne({ user: userId });
  if (!wishlist) {
    throw new AppError('Wishlist not found', 404);
  }
  
  if (!wishlist.hasProduct(productId)) {
    throw new AppError('Product not in wishlist', 400);
  }
  
  await wishlist.removeItem(productId);
  
  // Update product wishlist count
  const product = await Product.findById(productId);
  if (product) {
    await product.updateEngagement('wishlist', -1);
  }
  
  await wishlist.populate('items.product');
  
  res.status(200).json({
    success: true,
    message: 'Item removed from wishlist successfully',
    data: {
      wishlist
    }
  });
});

// Update wishlist item
const updateWishlistItem = catchAsync(async (req, res) => {
  const userId = req.user._id;
  const { productId } = req.params;
  const { priority, notes, notifyOnPriceChange, notifyOnRestock } = req.body;
  
  const wishlist = await Wishlist.findOne({ user: userId });
  if (!wishlist) {
    throw new AppError('Wishlist not found', 404);
  }
  
  const item = wishlist.items.find(item => 
    item.product.toString() === productId
  );
  
  if (!item) {
    throw new AppError('Product not in wishlist', 400);
  }
  
  // Update item properties
  if (priority !== undefined) item.priority = priority;
  if (notes !== undefined) item.notes = notes;
  if (notifyOnPriceChange !== undefined) item.notifyOnPriceChange = notifyOnPriceChange;
  if (notifyOnRestock !== undefined) item.notifyOnRestock = notifyOnRestock;
  
  await wishlist.save();
  await wishlist.populate('items.product');
  
  res.status(200).json({
    success: true,
    message: 'Wishlist item updated successfully',
    data: {
      wishlist
    }
  });
});

// Check if product is in wishlist
const checkWishlistStatus = catchAsync(async (req, res) => {
  const userId = req.user._id;
  const { productId } = req.params;
  
  const wishlist = await Wishlist.findOne({ user: userId });
  const inWishlist = wishlist ? wishlist.hasProduct(productId) : false;
  
  res.status(200).json({
    success: true,
    data: {
      inWishlist,
      productId
    }
  });
});

module.exports = {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
  updateWishlistItem,
  checkWishlistStatus
};
