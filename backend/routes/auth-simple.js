const express = require('express');
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
  requirePhoneVerification
} = require('../middleware/auth');

const router = express.Router();

// Simple routes without validation for testing
router.post('/send-code', sendVerificationCode);
router.post('/verify', verifyPhoneAndLogin);
router.post('/onboarding', authenticate, requirePhoneVerification, completeOnboarding);
router.get('/profile', authenticate, getProfile);
router.put('/profile', authenticate, requirePhoneVerification, updateProfile);
router.post('/logout', authenticate, logout);

// Simple check route
router.get('/check', authenticate, (req, res) => {
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
});

module.exports = router;
