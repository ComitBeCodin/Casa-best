const express = require('express');
const { body } = require('express-validator');
const { 
  sendVerificationCode, 
  verifyPhoneAndLogin, 
  completeOnboarding, 
  getProfile, 
  updateProfile, 
  logout 
} = require('../controllers/authController');
const { 
  authenticate, 
  requirePhoneVerification, 
  authRateLimit 
} = require('../middleware/auth');
const { validateRequest } = require('../middleware/validation');

const router = express.Router();

// Validation rules
const phoneValidation = [
  body('phone')
    .isLength({ min: 10, max: 15 })
    .withMessage('Please provide a valid phone number')
];

const verificationValidation = [
  body('phone')
    .isLength({ min: 10, max: 15 })
    .withMessage('Please provide a valid phone number'),
  body('code')
    .isLength({ min: 6, max: 6 })
    .isNumeric()
    .withMessage('Verification code must be 6 digits')
];

const onboardingValidation = [
  body('age')
    .isInt({ min: 13, max: 120 })
    .withMessage('Age must be between 13 and 120'),
  body('interests')
    .isArray({ min: 1 })
    .withMessage('At least one interest is required'),
  body('fits')
    .isArray({ min: 1 })
    .withMessage('At least one fit preference is required'),
  body('location')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Location must be between 2 and 100 characters')
];

// Routes

// POST /api/auth/send-code - Send verification code
router.post('/send-code', 
  authRateLimit(3, 15 * 60 * 1000), // 3 attempts per 15 minutes
  phoneValidation,
  validateRequest,
  sendVerificationCode
);

// POST /api/auth/verify - Verify phone and login/register
router.post('/verify',
  authRateLimit(5, 15 * 60 * 1000), // 5 attempts per 15 minutes
  verificationValidation,
  validateRequest,
  verifyPhoneAndLogin
);

// POST /api/auth/onboarding - Complete onboarding
router.post('/onboarding',
  authenticate,
  requirePhoneVerification,
  onboardingValidation,
  validateRequest,
  completeOnboarding
);

// GET /api/auth/profile - Get current user profile
router.get('/profile',
  authenticate,
  getProfile
);

// PUT /api/auth/profile - Update user profile
router.put('/profile',
  authenticate,
  requirePhoneVerification,
  [
    body('age')
      .optional()
      .isInt({ min: 13, max: 120 })
      .withMessage('Age must be between 13 and 120'),
    body('location')
      .optional()
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('Location must be between 2 and 100 characters'),
    body('interests')
      .optional()
      .isArray()
      .withMessage('Interests must be an array'),
    body('fits')
      .optional()
      .isArray()
      .withMessage('Fits must be an array')
  ],
  validateRequest,
  updateProfile
);

// POST /api/auth/logout - Logout
router.post('/logout',
  authenticate,
  logout
);

// GET /api/auth/check - Check authentication status
router.get('/check',
  authenticate,
  (req, res) => {
    res.status(200).json({
      success: true,
      message: 'Authenticated',
      data: {
        user: {
          id: req.user._id,
          phone: req.user.phone,
          phoneVerified: req.user.phoneVerified,
          onboardingComplete: req.user.onboardingComplete,
          profileComplete: req.user.profileComplete
        }
      }
    });
  }
);

module.exports = router;
