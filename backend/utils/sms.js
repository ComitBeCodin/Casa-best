const twilio = require('twilio');

// Initialize Twilio client
let twilioClient = null;

const initializeTwilio = () => {
  if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN ||
      process.env.TWILIO_ACCOUNT_SID === 'your-twilio-account-sid') {
    console.warn('⚠️  Twilio credentials not configured. SMS functionality will be disabled.');
    return null;
  }

  try {
    twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    console.log('✅ Twilio client initialized successfully');
    return twilioClient;
  } catch (error) {
    console.warn('⚠️  Failed to initialize Twilio client:', error.message);
    console.warn('⚠️  SMS functionality will be disabled.');
    return null;
  }
};

// Generate random verification code
const generateVerificationCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit code
};

// Format phone number to international format
const formatPhoneNumber = (phone) => {
  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, '');
  
  // Add country code if not present (assuming India +91)
  if (cleaned.length === 10) {
    return `+91${cleaned}`;
  } else if (cleaned.length === 12 && cleaned.startsWith('91')) {
    return `+${cleaned}`;
  } else if (cleaned.length === 13 && cleaned.startsWith('+91')) {
    return cleaned;
  }
  
  // Return as is if already in international format or unknown format
  return phone;
};

// Send verification SMS
const sendVerificationSMS = async (phone, code) => {
  if (!twilioClient) {
    // In development, log the code instead of sending SMS
    if (process.env.NODE_ENV === 'development') {
      console.log(`📱 Verification code for ${phone}: ${code}`);
      return { success: true, message: 'Verification code logged (development mode)' };
    }
    
    throw new Error('SMS service not configured');
  }
  
  try {
    const formattedPhone = formatPhoneNumber(phone);
    const message = `Your CASA verification code is: ${code}. This code will expire in 10 minutes. Do not share this code with anyone.`;
    
    const result = await twilioClient.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: formattedPhone
    });
    
    console.log(`✅ SMS sent successfully to ${formattedPhone}. SID: ${result.sid}`);
    
    return {
      success: true,
      message: 'Verification code sent successfully',
      sid: result.sid
    };
  } catch (error) {
    console.error('❌ Failed to send SMS:', error.message);
    
    // In development, still log the code even if SMS fails
    if (process.env.NODE_ENV === 'development') {
      console.log(`📱 Verification code for ${phone}: ${code} (SMS failed, logging instead)`);
      return { success: true, message: 'Verification code logged (SMS failed in development)' };
    }
    
    throw new Error(`Failed to send verification SMS: ${error.message}`);
  }
};

// Send welcome SMS
const sendWelcomeSMS = async (phone, userName = '') => {
  if (!twilioClient) {
    if (process.env.NODE_ENV === 'development') {
      console.log(`📱 Welcome SMS for ${phone}: Welcome to CASA!`);
      return { success: true, message: 'Welcome SMS logged (development mode)' };
    }
    return { success: false, message: 'SMS service not configured' };
  }
  
  try {
    const formattedPhone = formatPhoneNumber(phone);
    const message = `Welcome to CASA${userName ? `, ${userName}` : ''}! 👗 Start swiping to discover your perfect style. Happy shopping!`;
    
    const result = await twilioClient.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: formattedPhone
    });
    
    console.log(`✅ Welcome SMS sent to ${formattedPhone}. SID: ${result.sid}`);
    
    return {
      success: true,
      message: 'Welcome SMS sent successfully',
      sid: result.sid
    };
  } catch (error) {
    console.error('❌ Failed to send welcome SMS:', error.message);
    return {
      success: false,
      message: `Failed to send welcome SMS: ${error.message}`
    };
  }
};

// Validate phone number format
const isValidPhoneNumber = (phone) => {
  const phoneRegex = /^(\+91|91)?[6-9]\d{9}$/; // Indian phone number format
  const cleaned = phone.replace(/\D/g, '');
  return phoneRegex.test(cleaned) || phoneRegex.test(`91${cleaned}`);
};

// Initialize Twilio on module load
initializeTwilio();

module.exports = {
  generateVerificationCode,
  sendVerificationSMS,
  sendWelcomeSMS,
  formatPhoneNumber,
  isValidPhoneNumber
};
