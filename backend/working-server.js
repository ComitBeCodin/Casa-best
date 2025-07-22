const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

const app = express();

// Import models
const { User, Product, Swipe, Wishlist } = require('./models');

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://your-frontend-domain.com'] 
    : ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Database connection
mongoose.connect(process.env.MONGODB_URI)
.then(() => console.log('✅ Connected to MongoDB'))
.catch((err) => console.error('❌ MongoDB connection error:', err));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'CASA Backend API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
});

// ===== AUTHENTICATION ROUTES =====

// Send verification code
app.post('/api/auth/send-code', async (req, res) => {
  try {
    const { phone } = req.body;
    
    if (!phone) {
      return res.status(400).json({
        success: false,
        message: 'Phone number is required'
      });
    }
    
    // Generate 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
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
    
    // In development, log the code
    console.log(`📱 Verification code for ${phone}: ${code}`);
    
    res.status(200).json({
      success: true,
      message: 'Verification code sent successfully',
      data: {
        phone,
        expiresIn: 600,
        // In development, include the code for testing
        ...(process.env.NODE_ENV === 'development' && { code })
      }
    });
    
  } catch (error) {
    console.error('Send verification code error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send verification code'
    });
  }
});

// Verify phone and login
app.post('/api/auth/verify', async (req, res) => {
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
    
    // Verify code (simple comparison for development)
    const isValidCode = await user.checkVerificationCode(code);
    
    if (!isValidCode) {
      return res.status(400).json({
        success: false,
        message: 'Invalid verification code'
      });
    }
    
    // Mark phone as verified
    user.phoneVerified = true;
    user.verificationCode = undefined;
    user.verificationCodeExpires = undefined;
    
    const isNewUser = !user.onboardingComplete;
    await user.save();
    
    // Generate simple token (in production, use proper JWT)
    const token = `token_${user._id}_${Date.now()}`;
    
    res.status(200).json({
      success: true,
      message: isNewUser ? 'Phone verified successfully. Welcome to CASA!' : 'Login successful',
      data: {
        user: {
          id: user._id,
          phone: user.phone,
          phoneVerified: user.phoneVerified,
          onboardingComplete: user.onboardingComplete,
          profileComplete: user.profileComplete
        },
        token,
        isNewUser
      }
    });
    
  } catch (error) {
    console.error('Verify phone error:', error);
    res.status(500).json({
      success: false,
      message: 'Verification failed'
    });
  }
});

// Complete onboarding
app.post('/api/auth/onboarding', async (req, res) => {
  try {
    const { age, interests, fits, location, userId } = req.body;
    
    if (!userId || !age || !interests || !fits || !location) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required'
      });
    }
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
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
        user: {
          id: user._id,
          phone: user.phone,
          age: user.age,
          interests: user.interests,
          fits: user.fits,
          location: user.location,
          onboardingComplete: user.onboardingComplete,
          profileComplete: user.profileComplete
        }
      }
    });
    
  } catch (error) {
    console.error('Complete onboarding error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to complete onboarding'
    });
  }
});

// ===== PRODUCT ROUTES =====

// Get sample products for testing
app.get('/api/products/sample', async (req, res) => {
  try {
    // Create sample products if none exist
    const productCount = await Product.countDocuments();
    
    if (productCount === 0) {
      const sampleProducts = [
        {
          name: "Stylish Summer Dress",
          description: "Perfect for casual outings and summer parties",
          brand: "Fashion Co",
          images: [{ url: "https://via.placeholder.com/400x600/FF6B6B/FFFFFF?text=Summer+Dress", isPrimary: true }],
          price: { original: 2999, current: 1999, currency: "INR" },
          category: "dresses",
          gender: "women",
          sizes: [{ size: "S", inStock: true }, { size: "M", inStock: true }, { size: "L", inStock: true }],
          colors: ["red", "blue", "white"],
          isActive: true,
          inStock: true
        },
        {
          name: "Classic White Sneakers",
          description: "Comfortable and versatile sneakers for everyday wear",
          brand: "SportStyle",
          images: [{ url: "https://via.placeholder.com/400x600/4ECDC4/FFFFFF?text=White+Sneakers", isPrimary: true }],
          price: { original: 4999, current: 3499, currency: "INR" },
          category: "footwear",
          gender: "unisex",
          sizes: [{ size: "7", inStock: true }, { size: "8", inStock: true }, { size: "9", inStock: true }],
          colors: ["white", "black"],
          isActive: true,
          inStock: true
        },
        {
          name: "Denim Jacket",
          description: "Classic denim jacket perfect for layering",
          brand: "Urban Style",
          images: [{ url: "https://via.placeholder.com/400x600/45B7D1/FFFFFF?text=Denim+Jacket", isPrimary: true }],
          price: { original: 3999, current: 2999, currency: "INR" },
          category: "outerwear",
          gender: "unisex",
          sizes: [{ size: "S", inStock: true }, { size: "M", inStock: true }, { size: "L", inStock: true }],
          colors: ["blue", "black"],
          isActive: true,
          inStock: true
        }
      ];
      
      await Product.insertMany(sampleProducts);
      console.log('✅ Sample products created');
    }
    
    const products = await Product.find({ isActive: true }).limit(20);
    
    res.status(200).json({
      success: true,
      data: {
        products,
        count: products.length
      }
    });
    
  } catch (error) {
    console.error('Get sample products error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get products'
    });
  }
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error'
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 CASA Backend API running on port ${PORT} in ${process.env.NODE_ENV} mode`);
});

module.exports = app;
