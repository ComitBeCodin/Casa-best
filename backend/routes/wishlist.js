const express = require('express');
const { body, param } = require('express-validator');
const {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
  updateWishlistItem,
  checkWishlistStatus
} = require('../controllers/wishlistController');
const {
  authenticate,
  requirePhoneVerification,
  requireOnboarding
} = require('../middleware/auth');
const {
  validateRequest,
  isValidObjectId
} = require('../middleware/validation');

const router = express.Router();

// All routes require authentication
router.use(authenticate);
router.use(requirePhoneVerification);
router.use(requireOnboarding);

// GET /api/wishlist - Get user's wishlist
router.get('/',
  getWishlist
);

// POST /api/wishlist - Add item to wishlist
router.post('/',
  [
    body('productId')
      .custom(value => {
        if (!isValidObjectId(value)) {
          throw new Error('Invalid product ID');
        }
        return true;
      }),
    body('priority')
      .optional()
      .isInt({ min: 0, max: 5 })
      .withMessage('Priority must be between 0 and 5'),
    body('notes')
      .optional()
      .isString()
      .isLength({ max: 500 })
      .withMessage('Notes must be a string with maximum 500 characters'),
    body('notifyOnPriceChange')
      .optional()
      .isBoolean()
      .withMessage('notifyOnPriceChange must be a boolean'),
    body('notifyOnRestock')
      .optional()
      .isBoolean()
      .withMessage('notifyOnRestock must be a boolean')
  ],
  validateRequest,
  addToWishlist
);

// DELETE /api/wishlist/:productId - Remove item from wishlist
router.delete('/:productId',
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
  removeFromWishlist
);

// PUT /api/wishlist/:productId - Update wishlist item
router.put('/:productId',
  [
    param('productId')
      .custom(value => {
        if (!isValidObjectId(value)) {
          throw new Error('Invalid product ID');
        }
        return true;
      }),
    body('priority')
      .optional()
      .isInt({ min: 0, max: 5 })
      .withMessage('Priority must be between 0 and 5'),
    body('notes')
      .optional()
      .isString()
      .isLength({ max: 500 })
      .withMessage('Notes must be a string with maximum 500 characters'),
    body('notifyOnPriceChange')
      .optional()
      .isBoolean()
      .withMessage('notifyOnPriceChange must be a boolean'),
    body('notifyOnRestock')
      .optional()
      .isBoolean()
      .withMessage('notifyOnRestock must be a boolean')
  ],
  validateRequest,
  updateWishlistItem
);

// GET /api/wishlist/check/:productId - Check if product is in wishlist
router.get('/check/:productId',
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
  checkWishlistStatus
);

module.exports = router;
