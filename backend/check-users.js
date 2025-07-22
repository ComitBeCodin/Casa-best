// Check users in database
const mongoose = require('mongoose');
require('dotenv').config();

// Simple User Schema (same as in server)
const userSchema = new mongoose.Schema({
  phone: { type: String, required: true, unique: true },
  phoneVerified: { type: Boolean, default: false },
  verificationCode: { type: String, select: false },
  verificationCodeExpires: { type: Date, select: false },
  age: Number,
  location: String,
  interests: [String],
  fits: [String],
  onboardingComplete: { type: Boolean, default: false },
  profileComplete: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);

async function checkUsers() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const users = await User.find({});
    console.log(`\n📊 Found ${users.length} users in database:\n`);

    users.forEach((user, index) => {
      console.log(`${index + 1}. Phone: ${user.phone}`);
      console.log(`   Phone Verified: ${user.phoneVerified}`);
      console.log(`   Onboarding Complete: ${user.onboardingComplete}`);
      console.log(`   Profile Complete: ${user.profileComplete}`);
      if (user.age) console.log(`   Age: ${user.age}`);
      if (user.location) console.log(`   Location: ${user.location}`);
      if (user.interests && user.interests.length > 0) {
        console.log(`   Interests: ${user.interests.join(', ')}`);
      }
      if (user.fits && user.fits.length > 0) {
        console.log(`   Fits: ${user.fits.join(', ')}`);
      }
      console.log(`   Created: ${user.createdAt.toISOString()}`);
      console.log('');
    });

    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkUsers();
