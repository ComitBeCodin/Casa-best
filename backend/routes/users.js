const express = require('express');
const { body } = require('express-validator');
const {
  getUserStats,
  updatePreferences,
  getActivityHistory,
  getLikedProducts,
  updateInterests,
  updateFits,
  deleteAccount,
  getRecommendations
} = require('../controllers/userController');
const {
  authenticate,
  requirePhoneVerification,
  requireOnboarding
} = require('../middleware/auth');
const {
  validateRequest,
  validatePagination
} = require('../middleware/validation');

const router = express.Router();

// All routes require authentication
router.use(authenticate);
router.use(requirePhoneVerification);

// GET /api/users/stats - Get user statistics
router.get('/stats',
  requireOnboarding,
  getUserStats
);

// PUT /api/users/preferences - Update user preferences
router.put('/preferences',
  [
    body('preferences')
      .isObject()
      .withMessage('Preferences must be an object'),
    body('preferences.priceRange.min')
      .optional()
      .isNumeric()
      .withMessage('Price range minimum must be a number'),
    body('preferences.priceRange.max')
      .optional()
      .isNumeric()
      .withMessage('Price range maximum must be a number'),
    body('preferences.brands')
      .optional()
      .isArray()
      .withMessage('Brands must be an array'),
    body('preferences.categories')
      .optional()
      .isArray()
      .withMessage('Categories must be an array'),
    body('preferences.sizes')
      .optional()
      .isArray()
      .withMessage('Sizes must be an array'),
    body('preferences.colors')
      .optional()
      .isArray()
      .withMessage('Colors must be an array')
  ],
  validateRequest,
  updatePreferences
);

// GET /api/users/activity - Get user activity history
router.get('/activity',
  validatePagination,
  getActivityHistory
);

// GET /api/users/liked - Get user's liked products
router.get('/liked',
  requireOnboarding,
  validatePagination,
  getLikedProducts
);

// PUT /api/users/interests - Update user interests
router.put('/interests',
  [
    body('interests')
      .isArray({ min: 1 })
      .withMessage('At least one interest is required'),
    body('interests.*')
      .isString()
      .trim()
      .isLength({ min: 1, max: 50 })
      .withMessage('Each interest must be a string between 1 and 50 characters')
  ],
  validateRequest,
  updateInterests
);

// PUT /api/users/fits - Update user fits
router.put('/fits',
  [
    body('fits')
      .isArray({ min: 1 })
      .withMessage('At least one fit preference is required'),
    body('fits.*')
      .isString()
      .trim()
      .isLength({ min: 1, max: 50 })
      .withMessage('Each fit must be a string between 1 and 50 characters')
  ],
  validateRequest,
  updateFits
);

// GET /api/users/recommendations - Get user recommendations
router.get('/recommendations',
  requireOnboarding,
  getRecommendations
);

// DELETE /api/users/account - Delete user account
router.delete('/account',
  [
    body('confirmation')
      .equals('DELETE_MY_ACCOUNT')
      .withMessage('Please confirm account deletion by sending "DELETE_MY_ACCOUNT"')
  ],
  validateRequest,
  deleteAccount
);

module.exports = router;
