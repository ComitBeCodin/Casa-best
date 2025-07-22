const express = require('express');
const { body, param, query } = require('express-validator');
const {
  recordSwipe,
  getSwipeHistory,
  getSwipeStats,
  undoLastSwipe,
  getProductEngagement,
  getPersonalizedRecommendations
} = require('../controllers/swipeController');
const {
  authenticate,
  requirePhoneVerification,
  requireOnboarding
} = require('../middleware/auth');
const {
  validateRequest,
  validatePagination,
  isValidObjectId
} = require('../middleware/validation');

const router = express.Router();

// All routes require authentication
router.use(authenticate);
router.use(requirePhoneVerification);
router.use(requireOnboarding);

// POST /api/swipes - Record a swipe action
router.post('/',
  [
    body('productId')
      .custom(value => {
        if (!isValidObjectId(value)) {
          throw new Error('Invalid product ID');
        }
        return true;
      }),
    body('action')
      .isIn(['like', 'dislike', 'super_like', 'skip'])
      .withMessage('Action must be one of: like, dislike, super_like, skip'),
    body('context')
      .optional()
      .isObject()
      .withMessage('Context must be an object'),
    body('context.source')
      .optional()
      .isIn(['home', 'explore', 'category', 'search', 'recommendation'])
      .withMessage('Invalid context source'),
    body('context.position')
      .optional()
      .isInt({ min: 0 })
      .withMessage('Position must be a non-negative integer'),
    body('context.timeSpent')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Time spent must be a non-negative number'),
    body('context.sessionId')
      .optional()
      .isString()
      .isLength({ min: 1, max: 100 })
      .withMessage('Session ID must be a string between 1 and 100 characters')
  ],
  validateRequest,
  recordSwipe
);

// GET /api/swipes/history - Get user's swipe history
router.get('/history',
  validatePagination,
  [
    query('action')
      .optional()
      .isIn(['like', 'dislike', 'super_like', 'skip'])
      .withMessage('Action must be one of: like, dislike, super_like, skip')
  ],
  validateRequest,
  getSwipeHistory
);

// GET /api/swipes/stats - Get swipe statistics
router.get('/stats',
  [
    query('period')
      .optional()
      .isInt({ min: 1, max: 365 })
      .withMessage('Period must be between 1 and 365 days')
  ],
  validateRequest,
  getSwipeStats
);

// POST /api/swipes/undo - Undo last swipe
router.post('/undo',
  undoLastSwipe
);

// GET /api/swipes/recommendations - Get personalized recommendations
router.get('/recommendations',
  [
    query('limit')
      .optional()
      .isInt({ min: 1, max: 50 })
      .withMessage('Limit must be between 1 and 50')
  ],
  validateRequest,
  getPersonalizedRecommendations
);

// GET /api/swipes/product/:productId/engagement - Get product engagement stats
router.get('/product/:productId/engagement',
  [
    param('productId')
      .custom(value => {
        if (!isValidObjectId(value)) {
          throw new Error('Invalid product ID');
        }
        return true;
      })
  ],
  validateRequest,
  getProductEngagement
);

module.exports = router;
