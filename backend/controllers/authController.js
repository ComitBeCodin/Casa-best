const { User } = require('../models');
const { generateAccessToken } = require('../utils/jwt');
const { generateVerificationCode, sendVerificationSMS, sendWelcomeSMS, isValidPhoneNumber } = require('../utils/sms');

// Send verification code to phone
const sendVerificationCode = async (req, res) => {
  try {
    const { phone } = req.body;
    
    if (!phone) {
      return res.status(400).json({
        success: false,
        message: 'Phone number is required'
      });
    }
    
    if (!isValidPhoneNumber(phone)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid phone number format'
      });
    }
    
    // Generate verification code
    const code = generateVerificationCode();
    const codeExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    
    // Find or create user
    let user = await User.findOne({ phone });
    
    if (!user) {
      user = new User({
        phone,
        verificationCode: code,
        verificationCodeExpires: codeExpires
      });
    } else {
      user.verificationCode = code;
      user.verificationCodeExpires = codeExpires;
    }
    
    await user.save();
    
    // Send SMS
    await sendVerificationSMS(phone, code);
    
    res.status(200).json({
      success: true,
      message: 'Verification code sent successfully',
      data: {
        phone,
        expiresIn: 600 // 10 minutes in seconds
      }
    });
    
  } catch (error) {
    console.error('Send verification code error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send verification code',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Verify phone and login/register
const verifyPhoneAndLogin = async (req, res) => {
  try {
    const { phone, code } = req.body;
    
    if (!phone || !code) {
      return res.status(400).json({
        success: false,
        message: 'Phone number and verification code are required'
      });
    }
    
    // Find user
    const user = await User.findOne({ phone }).select('+verificationCode +verificationCodeExpires');
    
    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid phone number or verification code'
      });
    }
    
    // Check if code is expired
    if (user.isVerificationCodeExpired()) {
      return res.status(400).json({
        success: false,
        message: 'Verification code has expired. Please request a new one.'
      });
    }
    
    // Verify code
    const isValidCode = await user.checkVerificationCode(code);
    
    if (!isValidCode) {
      return res.status(400).json({
        success: false,
        message: 'Invalid verification code'
      });
    }
    
    // Mark phone as verified and clear verification code
    user.phoneVerified = true;
    user.verificationCode = undefined;
    user.verificationCodeExpires = undefined;
    
    // If this is first time verification, send welcome SMS
    const isNewUser = !user.onboardingComplete;
    
    await user.save();
    
    if (isNewUser) {
      // Send welcome SMS (don't await to avoid blocking response)
      sendWelcomeSMS(phone).catch(err => 
        console.error('Failed to send welcome SMS:', err.message)
      );
    }
    
    // Generate access token
    const token = generateAccessToken(user);
    
    // Remove sensitive fields from response
    const userResponse = user.toObject();
    delete userResponse.verificationCode;
    delete userResponse.verificationCodeExpires;
    
    res.status(200).json({
      success: true,
      message: isNewUser ? 'Phone verified successfully. Welcome to CASA!' : 'Login successful',
      data: {
        user: userResponse,
        token,
        isNewUser
      }
    });
    
  } catch (error) {
    console.error('Verify phone and login error:', error);
    res.status(500).json({
      success: false,
      message: 'Verification failed',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Complete user onboarding
const completeOnboarding = async (req, res) => {
  try {
    const { age, interests, fits, location } = req.body;
    const user = req.user;
    
    // Validate required fields
    if (!age || !interests || !fits || !location) {
      return res.status(400).json({
        success: false,
        message: 'Age, interests, fits, and location are required'
      });
    }
    
    // Update user profile
    user.age = age;
    user.interests = interests;
    user.fits = fits;
    user.location = location;
    user.onboardingComplete = true;
    user.profileComplete = true;
    
    await user.save();
    
    res.status(200).json({
      success: true,
      message: 'Onboarding completed successfully',
      data: {
        user: user.toObject()
      }
    });
    
  } catch (error) {
    console.error('Complete onboarding error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to complete onboarding',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get current user profile
const getProfile = async (req, res) => {
  try {
    const user = req.user;
    
    res.status(200).json({
      success: true,
      data: {
        user: user.toObject()
      }
    });
    
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get profile',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Update user profile
const updateProfile = async (req, res) => {
  try {
    const user = req.user;
    const updates = req.body;
    
    // Fields that can be updated
    const allowedUpdates = ['age', 'location', 'interests', 'fits', 'preferences'];
    const actualUpdates = {};
    
    // Filter only allowed updates
    Object.keys(updates).forEach(key => {
      if (allowedUpdates.includes(key)) {
        actualUpdates[key] = updates[key];
      }
    });
    
    if (Object.keys(actualUpdates).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid fields to update'
      });
    }
    
    // Apply updates
    Object.keys(actualUpdates).forEach(key => {
      user[key] = actualUpdates[key];
    });
    
    await user.save();
    
    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user: user.toObject()
      }
    });
    
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Logout (client-side token removal, server-side cleanup if needed)
const logout = async (req, res) => {
  try {
    // In a more complex setup, you might want to blacklist the token
    // For now, we'll just return success and let client handle token removal
    
    res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });
    
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Logout failed',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  sendVerificationCode,
  verifyPhoneAndLogin,
  completeOnboarding,
  getProfile,
  updateProfile,
  logout
};
