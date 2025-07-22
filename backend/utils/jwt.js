const jwt = require('jsonwebtoken');

// Generate JWT token
const generateToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  });
};

// Verify JWT token
const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    throw new Error('Invalid token');
  }
};

// Generate access token for user
const generateAccessToken = (user) => {
  return generateToken({
    id: user._id,
    phone: user.phone,
    phoneVerified: user.phoneVerified
  });
};

// Generate refresh token for user
const generateRefreshToken = (user) => {
  return generateToken({
    id: user._id,
    type: 'refresh'
  });
};

// Extract token from request headers
const extractTokenFromHeader = (authHeader) => {
  if (!authHeader) {
    throw new Error('No authorization header provided');
  }
  
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    throw new Error('Invalid authorization header format');
  }
  
  return parts[1];
};

module.exports = {
  generateToken,
  verifyToken,
  generateAccessToken,
  generateRefreshToken,
  extractTokenFromHeader
};
