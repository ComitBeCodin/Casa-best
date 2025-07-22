const { verifyToken, extractTokenFromHeader } = require('../utils/jwt');
const { User } = require('../models');

// Middleware to authenticate user
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }
    
    const token = extractTokenFromHeader(authHeader);
    const decoded = verifyToken(token);
    
    // Find user and attach to request
    const user = await User.findById(decoded.id).select('-verificationCode -verificationCodeExpires');
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token. User not found.'
      });
    }
    
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated.'
      });
    }
    
    if (user.isBlocked) {
      return res.status(401).json({
        success: false,
        message: 'Account is blocked.'
      });
    }
    
    // Update last active timestamp
    user.updateLastActive();
    
    req.user = user;
    next();
  } catch (error) {
    console.error('Authentication error:', error.message);
    
    if (error.message === 'Invalid token' || error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token.'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired.'
      });
    }
    
    return res.status(500).json({
      success: false,
      message: 'Authentication failed.'
    });
  }
};

// Middleware to check if phone is verified
const requirePhoneVerification = (req, res, next) => {
  if (!req.user.phoneVerified) {
    return res.status(403).json({
      success: false,
      message: 'Phone verification required.',
      requiresVerification: true
    });
  }
  next();
};

// Middleware to check if onboarding is complete
const requireOnboarding = (req, res, next) => {
  if (!req.user.onboardingComplete) {
    return res.status(403).json({
      success: false,
      message: 'Onboarding required.',
      requiresOnboarding: true
    });
  }
  next();
};

// Middleware to check if profile is complete
const requireCompleteProfile = (req, res, next) => {
  if (!req.user.profileComplete) {
    return res.status(403).json({
      success: false,
      message: 'Complete profile required.',
      requiresProfileCompletion: true
    });
  }
  next();
};

// Optional authentication middleware (doesn't fail if no token)
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      req.user = null;
      return next();
    }
    
    const token = extractTokenFromHeader(authHeader);
    const decoded = verifyToken(token);
    
    const user = await User.findById(decoded.id).select('-verificationCode -verificationCodeExpires');
    
    if (user && user.isActive && !user.isBlocked) {
      user.updateLastActive();
      req.user = user;
    } else {
      req.user = null;
    }
    
    next();
  } catch (error) {
    // If token is invalid, just continue without user
    req.user = null;
    next();
  }
};

// Middleware to check admin privileges (for future use)
const requireAdmin = (req, res, next) => {
  if (!req.user.isAdmin) {
    return res.status(403).json({
      success: false,
      message: 'Admin access required.'
    });
  }
  next();
};

// Rate limiting for authentication endpoints
const authRateLimit = (maxAttempts = 5, windowMs = 15 * 60 * 1000) => {
  const attempts = new Map();
  
  return (req, res, next) => {
    const key = req.ip + (req.body.phone || '');
    const now = Date.now();
    
    if (!attempts.has(key)) {
      attempts.set(key, { count: 1, resetTime: now + windowMs });
      return next();
    }
    
    const attempt = attempts.get(key);
    
    if (now > attempt.resetTime) {
      attempt.count = 1;
      attempt.resetTime = now + windowMs;
      return next();
    }
    
    if (attempt.count >= maxAttempts) {
      return res.status(429).json({
        success: false,
        message: 'Too many authentication attempts. Please try again later.',
        retryAfter: Math.ceil((attempt.resetTime - now) / 1000)
      });
    }
    
    attempt.count++;
    next();
  };
};

module.exports = {
  authenticate,
  requirePhoneVerification,
  requireOnboarding,
  requireCompleteProfile,
  optionalAuth,
  requireAdmin,
  authRateLimit
};
