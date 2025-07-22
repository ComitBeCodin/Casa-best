const { Product, Swipe } = require('../models');
const { catchAsync, AppError } = require('../middleware/errorHandler');

// Get products for swiping (excluding already swiped)
const getSwipeProducts = catchAsync(async (req, res) => {
  const userId = req.user._id;
  const { limit = 20, category, gender } = req.query;
  
  // Get products user has already swiped
  const swipedProductIds = await Swipe.getSwipedProductIds(userId);
  
  // Build query
  let query = {
    _id: { $nin: swipedProductIds },
    isActive: true,
    inStock: true
  };
  
  if (category) query.category = category;
  if (gender) query.gender = gender;
  
  // Get user preferences for better recommendations
  const userPreferences = req.user.preferences;
  if (userPreferences) {
    if (userPreferences.categories && userPreferences.categories.length > 0) {
      query.category = { $in: userPreferences.categories };
    }
    if (userPreferences.priceRange) {
      query['price.current'] = {
        $gte: userPreferences.priceRange.min || 0,
        $lte: userPreferences.priceRange.max || 100000
      };
    }
    if (userPreferences.brands && userPreferences.brands.length > 0) {
      query.brand = { $in: userPreferences.brands };
    }
  }
  
  const products = await Product.find(query)
    .limit(parseInt(limit))
    .sort({ createdAt: -1 }); // Show newer products first
  
  res.status(200).json({
    success: true,
    data: {
      products,
      count: products.length,
      hasMore: products.length === parseInt(limit)
    }
  });
});

// Get trending products
const getTrendingProducts = catchAsync(async (req, res) => {
  const { limit = 20, days = 7 } = req.query;
  
  const trendingProducts = await Swipe.getTrendingProducts(parseInt(days), parseInt(limit));
  
  res.status(200).json({
    success: true,
    data: {
      products: trendingProducts,
      period: `${days} days`
    }
  });
});

// Search products
const searchProducts = catchAsync(async (req, res) => {
  const { q, category, gender, minPrice, maxPrice, brand, page = 1, limit = 20 } = req.query;
  
  if (!q || q.trim().length < 2) {
    return res.status(400).json({
      success: false,
      message: 'Search query must be at least 2 characters long'
    });
  }
  
  const skip = (page - 1) * limit;
  
  // Build search query
  let query = {
    $text: { $search: q },
    isActive: true,
    inStock: true
  };
  
  if (category) query.category = category;
  if (gender) query.gender = gender;
  if (brand) query.brand = new RegExp(brand, 'i');
  
  if (minPrice || maxPrice) {
    query['price.current'] = {};
    if (minPrice) query['price.current'].$gte = parseFloat(minPrice);
    if (maxPrice) query['price.current'].$lte = parseFloat(maxPrice);
  }
  
  const products = await Product.find(query, { score: { $meta: 'textScore' } })
    .sort({ score: { $meta: 'textScore' } })
    .skip(skip)
    .limit(parseInt(limit));
  
  const total = await Product.countDocuments(query);
  
  res.status(200).json({
    success: true,
    data: {
      products,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      },
      searchQuery: q
    }
  });
});

// Get products by category
const getProductsByCategory = catchAsync(async (req, res) => {
  const { category } = req.params;
  const { gender, page = 1, limit = 20, sort = 'createdAt:desc' } = req.query;
  
  const skip = (page - 1) * limit;
  
  let query = { category, isActive: true, inStock: true };
  if (gender) query.gender = gender;
  
  // Parse sort parameter
  const [sortField, sortOrder] = sort.split(':');
  const sortObj = {};
  sortObj[sortField] = sortOrder === 'desc' ? -1 : 1;
  
  const products = await Product.find(query)
    .sort(sortObj)
    .skip(skip)
    .limit(parseInt(limit));
  
  const total = await Product.countDocuments(query);
  
  res.status(200).json({
    success: true,
    data: {
      products,
      category,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    }
  });
});

// Get single product details
const getProductById = catchAsync(async (req, res) => {
  const { id } = req.params;
  
  const product = await Product.findById(id);
  
  if (!product) {
    throw new AppError('Product not found', 404);
  }
  
  if (!product.isActive) {
    throw new AppError('Product is no longer available', 404);
  }
  
  // Increment view count
  product.incrementViews();
  
  // Get user's swipe status for this product (if authenticated)
  let userSwipeStatus = null;
  if (req.user) {
    const userSwipe = await Swipe.findOne({
      user: req.user._id,
      product: id
    });
    userSwipeStatus = userSwipe ? userSwipe.action : null;
  }
  
  res.status(200).json({
    success: true,
    data: {
      product,
      userSwipeStatus
    }
  });
});

// Get product categories
const getCategories = catchAsync(async (req, res) => {
  const categories = await Product.distinct('category', { isActive: true });
  
  // Get product count for each category
  const categoryStats = await Product.aggregate([
    { $match: { isActive: true, inStock: true } },
    { $group: { _id: '$category', count: { $sum: 1 } } },
    { $sort: { count: -1 } }
  ]);
  
  res.status(200).json({
    success: true,
    data: {
      categories: categoryStats.map(cat => ({
        name: cat._id,
        count: cat.count
      }))
    }
  });
});

// Get product brands
const getBrands = catchAsync(async (req, res) => {
  const { category } = req.query;
  
  let query = { isActive: true };
  if (category) query.category = category;
  
  const brands = await Product.distinct('brand', query);
  
  res.status(200).json({
    success: true,
    data: {
      brands: brands.sort()
    }
  });
});

// Get product filters (for advanced filtering)
const getFilters = catchAsync(async (req, res) => {
  const { category, gender } = req.query;
  
  let matchQuery = { isActive: true, inStock: true };
  if (category) matchQuery.category = category;
  if (gender) matchQuery.gender = gender;
  
  const filters = await Product.aggregate([
    { $match: matchQuery },
    {
      $group: {
        _id: null,
        brands: { $addToSet: '$brand' },
        colors: { $addToSet: { $arrayElemAt: ['$colors', 0] } },
        materials: { $addToSet: { $arrayElemAt: ['$materials', 0] } },
        priceRange: {
          $push: {
            min: { $min: '$price.current' },
            max: { $max: '$price.current' }
          }
        }
      }
    }
  ]);
  
  const result = filters[0] || {
    brands: [],
    colors: [],
    materials: [],
    priceRange: [{ min: 0, max: 10000 }]
  };
  
  res.status(200).json({
    success: true,
    data: {
      filters: {
        brands: result.brands.filter(Boolean).sort(),
        colors: result.colors.filter(Boolean).sort(),
        materials: result.materials.filter(Boolean).sort(),
        priceRange: {
          min: Math.min(...result.priceRange.map(p => p.min)),
          max: Math.max(...result.priceRange.map(p => p.max))
        }
      }
    }
  });
});

module.exports = {
  getSwipeProducts,
  getTrendingProducts,
  searchProducts,
  getProductsByCategory,
  getProductById,
  getCategories,
  getBrands,
  getFilters
};
