const express = require('express');
const { param, query } = require('express-validator');
const {
  getSwipeProducts,
  getTrendingProducts,
  searchProducts,
  getProductsByCategory,
  getProductById,
  getCategories,
  getBrands,
  getFilters
} = require('../controllers/productController');
const {
  authenticate,
  requirePhoneVerification,
  requireOnboarding,
  optionalAuth
} = require('../middleware/auth');
const {
  validateRequest,
  validatePagination,
  isValidObjectId
} = require('../middleware/validation');

const router = express.Router();

// GET /api/products/swipe - Get products for swiping
router.get('/swipe',
  authenticate,
  requirePhoneVerification,
  requireOnboarding,
  [
    query('limit')
      .optional()
      .isInt({ min: 1, max: 50 })
      .withMessage('Limit must be between 1 and 50'),
    query('category')
      .optional()
      .isIn(['tops', 'bottoms', 'dresses', 'outerwear', 'footwear', 'accessories', 'bags', 'jewelry', 'watches', 'sunglasses'])
      .withMessage('Invalid category'),
    query('gender')
      .optional()
      .isIn(['men', 'women', 'unisex', 'kids'])
      .withMessage('Invalid gender')
  ],
  validateRequest,
  getSwipeProducts
);

// GET /api/products/trending - Get trending products
router.get('/trending',
  optionalAuth,
  [
    query('limit')
      .optional()
      .isInt({ min: 1, max: 50 })
      .withMessage('Limit must be between 1 and 50'),
    query('days')
      .optional()
      .isInt({ min: 1, max: 30 })
      .withMessage('Days must be between 1 and 30')
  ],
  validateRequest,
  getTrendingProducts
);

// GET /api/products/search - Search products
router.get('/search',
  optionalAuth,
  validatePagination,
  [
    query('q')
      .isLength({ min: 2, max: 100 })
      .withMessage('Search query must be between 2 and 100 characters'),
    query('category')
      .optional()
      .isIn(['tops', 'bottoms', 'dresses', 'outerwear', 'footwear', 'accessories', 'bags', 'jewelry', 'watches', 'sunglasses'])
      .withMessage('Invalid category'),
    query('gender')
      .optional()
      .isIn(['men', 'women', 'unisex', 'kids'])
      .withMessage('Invalid gender'),
    query('minPrice')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Minimum price must be a positive number'),
    query('maxPrice')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Maximum price must be a positive number'),
    query('brand')
      .optional()
      .isLength({ min: 1, max: 50 })
      .withMessage('Brand must be between 1 and 50 characters')
  ],
  validateRequest,
  searchProducts
);

// GET /api/products/categories - Get all categories
router.get('/categories',
  getCategories
);

// GET /api/products/brands - Get all brands
router.get('/brands',
  [
    query('category')
      .optional()
      .isIn(['tops', 'bottoms', 'dresses', 'outerwear', 'footwear', 'accessories', 'bags', 'jewelry', 'watches', 'sunglasses'])
      .withMessage('Invalid category')
  ],
  validateRequest,
  getBrands
);

// GET /api/products/filters - Get available filters
router.get('/filters',
  [
    query('category')
      .optional()
      .isIn(['tops', 'bottoms', 'dresses', 'outerwear', 'footwear', 'accessories', 'bags', 'jewelry', 'watches', 'sunglasses'])
      .withMessage('Invalid category'),
    query('gender')
      .optional()
      .isIn(['men', 'women', 'unisex', 'kids'])
      .withMessage('Invalid gender')
  ],
  validateRequest,
  getFilters
);

// GET /api/products/category/:category - Get products by category
router.get('/category/:category',
  optionalAuth,
  validatePagination,
  [
    param('category')
      .isIn(['tops', 'bottoms', 'dresses', 'outerwear', 'footwear', 'accessories', 'bags', 'jewelry', 'watches', 'sunglasses'])
      .withMessage('Invalid category'),
    query('gender')
      .optional()
      .isIn(['men', 'women', 'unisex', 'kids'])
      .withMessage('Invalid gender'),
    query('sort')
      .optional()
      .isIn(['createdAt:desc', 'createdAt:asc', 'price.current:desc', 'price.current:asc', 'totalLikes:desc', 'name:asc'])
      .withMessage('Invalid sort option')
  ],
  validateRequest,
  getProductsByCategory
);

// GET /api/products/:id - Get single product
router.get('/:id',
  optionalAuth,
  [
    param('id')
      .custom(value => {
        if (!isValidObjectId(value)) {
          throw new Error('Invalid product ID');
        }
        return true;
      })
  ],
  validateRequest,
  getProductById
);

module.exports = router;
