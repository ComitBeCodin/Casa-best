const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Basic middleware
app.use(cors());
app.use(express.json());

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

// Simple auth routes
app.post('/api/auth/send-code', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Verification code sent (development mode)',
    data: { phone: req.body.phone, code: '123456' }
  });
});

app.post('/api/auth/verify', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Phone verified successfully',
    data: { 
      user: { phone: req.body.phone, phoneVerified: true },
      token: 'fake-jwt-token-for-testing'
    }
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Minimal server running on port ${PORT}`);
});

module.exports = app;
