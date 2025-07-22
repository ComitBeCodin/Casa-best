'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { MapPin, User, Shirt, Phone, Loader2 } from 'lucide-react';
import { authAPI, storage, type User as UserType } from '@/lib/api';

interface OnboardingProps {
  onComplete: (user: UserType) => void;
}

export function ConnectedOnboardingFlow({ onComplete }: OnboardingProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [userData, setUserData] = useState({
    phone: '',
    verificationCode: '',
    age: '',
    interests: [] as string[],
    fits: [] as string[],
    location: '',
    userId: '',
    token: ''
  });

  const steps = [
    {
      title: 'Welcome to CASA',
      subtitle: 'Swipe your way to perfect style',
      component: <WelcomeStep onNext={() => setCurrentStep(1)} />
    },
    {
      title: 'Verify Phone',
      subtitle: 'Enter your mobile number',
      component: <PhoneStep 
        userData={userData} 
        setUserData={setUserData} 
        onNext={() => setCurrentStep(2)}
        loading={loading}
        setLoading={setLoading}
        error={error}
        setError={setError}
      />
    },
    {
      title: 'Verify Code',
      subtitle: 'Enter the 6-digit code sent to your phone',
      component: <CodeStep
        userData={userData}
        setUserData={setUserData}
        onNext={() => setCurrentStep(3)}
        onComplete={onComplete}
        loading={loading}
        setLoading={setLoading}
        error={error}
        setError={setError}
      />
    },
    {
      title: 'Tell us about you',
      subtitle: 'Help us personalize your feed',
      component: <ProfileStep userData={userData} setUserData={setUserData} onNext={() => setCurrentStep(4)} />
    },
    {
      title: 'Your Style Preferences',
      subtitle: 'What fits do you love?',
      component: <StyleStep userData={userData} setUserData={setUserData} onNext={() => setCurrentStep(5)} />
    },
    {
      title: 'Location',
      subtitle: 'For instant delivery magic',
      component: <LocationStep 
        userData={userData} 
        setUserData={setUserData} 
        onComplete={onComplete}
        loading={loading}
        setLoading={setLoading}
        error={error}
        setError={setError}
      />
    }
  ];

  const currentStepData = steps[currentStep];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Progress Bar */}
      <div className="w-full bg-secondary h-1">
        <div 
          className="bg-primary h-1 transition-all duration-300"
          style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
        />
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col justify-center px-6 py-8">
        <div className="max-w-md mx-auto w-full space-y-8">
          {/* Header */}
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-bold text-foreground">
              {currentStepData.title}
            </h1>
            <p className="text-muted-foreground">
              {currentStepData.subtitle}
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Step Component */}
          {currentStepData.component}
        </div>
      </div>
    </div>
  );
}

function WelcomeStep({ onNext }: { onNext: () => void }) {
  return (
    <div className="text-center space-y-8">
      <div className="text-6xl">👗</div>
      <div className="space-y-4">
        <p className="text-lg text-muted-foreground">
          Discover fashion that matches your vibe
        </p>
        <p className="text-sm text-muted-foreground">
          Swipe through curated styles just for you
        </p>
      </div>
      <Button onClick={onNext} className="w-full py-6 text-lg">
        Get Started
      </Button>
    </div>
  );
}

function PhoneStep({ userData, setUserData, onNext, loading, setLoading, error, setError }: any) {
  const handleSendCode = async () => {
    if (!userData.phone) return;
    
    setLoading(true);
    setError('');
    
    try {
      const response = await authAPI.sendVerificationCode(userData.phone);
      if (response.success) {
        console.log('Verification code sent:', response.data?.code); // For development
        onNext();
      } else {
        setError(response.message || 'Failed to send verification code');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to send verification code');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="p-6 bg-card border-border">
        <div className="flex items-center space-x-3 mb-4">
          <Phone className="w-5 h-5 text-primary" />
          <span className="text-sm text-gray-400">Mobile Number</span>
        </div>
        <Input
          type="tel"
          placeholder="9876543210"
          value={userData.phone}
          onChange={(e) => setUserData((prev: any) => ({ ...prev, phone: e.target.value }))}
          className="text-lg py-4"
          disabled={loading}
        />
      </Card>
      <Button 
        onClick={handleSendCode}
        disabled={!userData.phone || loading}
        className="w-full py-6 text-lg"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Sending Code...
          </>
        ) : (
          'Send OTP'
        )}
      </Button>
    </div>
  );
}

function CodeStep({ userData, setUserData, onNext, onComplete, loading, setLoading, error, setError }: any) {
  const handleVerifyCode = async () => {
    if (!userData.verificationCode) return;
    
    setLoading(true);
    setError('');
    
    try {
      const response = await authAPI.verifyPhone(userData.phone, userData.verificationCode);
      if (response.success && response.data) {
        // Store user data and token
        setUserData((prev: any) => ({
          ...prev,
          userId: response.data.user.id,
          token: response.data.token
        }));

        storage.setUser(response.data.user);
        storage.setToken(response.data.token);

        // Check if user has already completed onboarding
        if (response.data.user.onboardingComplete) {
          // User is returning - skip onboarding and go directly to main app
          onComplete(response.data.user);
        } else {
          // New user - continue with onboarding
          onNext();
        }
      } else {
        setError(response.message || 'Invalid verification code');
      }
    } catch (err: any) {
      setError(err.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="p-6 bg-card border-border">
        <div className="flex items-center space-x-3 mb-4">
          <Phone className="w-5 h-5 text-primary" />
          <span className="text-sm text-gray-400">Verification Code</span>
        </div>
        <Input
          type="text"
          placeholder="123456"
          value={userData.verificationCode}
          onChange={(e) => setUserData((prev: any) => ({ ...prev, verificationCode: e.target.value }))}
          className="text-lg py-4 text-center tracking-widest"
          maxLength={6}
          disabled={loading}
        />
        <p className="text-xs text-muted-foreground mt-2">
          Code sent to {userData.phone}
        </p>
      </Card>
      <Button 
        onClick={handleVerifyCode}
        disabled={!userData.verificationCode || userData.verificationCode.length !== 6 || loading}
        className="w-full py-6 text-lg"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Verifying...
          </>
        ) : (
          'Verify Code'
        )}
      </Button>
    </div>
  );
}

function ProfileStep({ userData, setUserData, onNext }: any) {
  const ageRanges = [
    { label: 'Gen Z (18-25)', value: 22 },
    { label: 'Millennial (26-35)', value: 30 },
    { label: 'Gen X (36-45)', value: 40 },
    { label: 'Other', value: 25 }
  ];
  const interests = ['Streetwear', 'Vintage', 'Minimalist', 'Boho', 'Y2K', 'Grunge', 'Preppy', 'Athleisure'];

  return (
    <div className="space-y-6">
      <Card className="p-6 bg-card border-border">
        <div className="flex items-center space-x-3 mb-4">
          <User className="w-5 h-5 text-primary" />
          <span className="text-sm text-gray-400">Age Range</span>
        </div>
        <div className="grid grid-cols-1 gap-3">
          {ageRanges.map(range => (
            <button
              key={range.label}
              onClick={() => setUserData((prev: any) => ({ ...prev, age: range.value }))}
              className={`p-4 rounded-xl text-left ${
                userData.age === range.value ? 'bg-primary text-black' : 'bg-secondary hover:bg-secondary/80'
              }`}
            >
              {range.label}
            </button>
          ))}
        </div>
      </Card>

      <Card className="p-6 bg-card border-border">
        <div className="flex items-center space-x-3 mb-4">
          <Shirt className="w-5 h-5 text-primary" />
          <span className="text-sm text-gray-400">Style Interests</span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {interests.map(interest => (
            <button
              key={interest}
              onClick={() => {
                setUserData((prev: any) => ({
                  ...prev,
                  interests: prev.interests.includes(interest)
                    ? prev.interests.filter((i: string) => i !== interest)
                    : [...prev.interests, interest]
                }));
              }}
              className={`p-3 rounded-lg text-sm ${
                userData.interests.includes(interest)
                  ? 'bg-primary text-black'
                  : 'bg-secondary hover:bg-secondary/80'
              }`}
            >
              {interest}
            </button>
          ))}
        </div>
      </Card>

      <Button 
        onClick={onNext}
        disabled={!userData.age || userData.interests.length === 0}
        className="w-full py-6 text-lg"
      >
        Continue
      </Button>
    </div>
  );
}

function StyleStep({ userData, setUserData, onNext }: any) {
  const fits = ['Oversized', 'Fitted', 'Relaxed', 'Cropped', 'Flowy', 'Structured', 'Layered', 'Minimal'];

  return (
    <div className="space-y-6">
      <Card className="p-6 bg-card border-border">
        <div className="flex items-center space-x-3 mb-4">
          <Shirt className="w-5 h-5 text-primary" />
          <span className="text-sm text-gray-400">Preferred Fits</span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {fits.map(fit => (
            <button
              key={fit}
              onClick={() => {
                setUserData((prev: any) => ({
                  ...prev,
                  fits: prev.fits.includes(fit)
                    ? prev.fits.filter((f: string) => f !== fit)
                    : [...prev.fits, fit]
                }));
              }}
              className={`p-3 rounded-lg text-sm ${
                userData.fits.includes(fit)
                  ? 'bg-primary text-black'
                  : 'bg-secondary hover:bg-secondary/80'
              }`}
            >
              {fit}
            </button>
          ))}
        </div>
      </Card>

      <Button 
        onClick={onNext}
        disabled={userData.fits.length === 0}
        className="w-full py-6 text-lg"
      >
        Continue
      </Button>
    </div>
  );
}

function LocationStep({ userData, setUserData, onComplete, loading, setLoading, error, setError }: any) {
  const handleComplete = async () => {
    if (!userData.location) return;
    
    setLoading(true);
    setError('');
    
    try {
      const response = await authAPI.completeOnboarding({
        userId: userData.userId,
        age: userData.age,
        interests: userData.interests,
        fits: userData.fits,
        location: userData.location
      });
      
      if (response.success && response.data) {
        storage.setUser(response.data.user);
        onComplete(response.data.user);
      } else {
        setError(response.message || 'Failed to complete onboarding');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to complete onboarding');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="p-6 bg-card border-border">
        <div className="flex items-center space-x-3 mb-4">
          <MapPin className="w-5 h-5 text-primary" />
          <span className="text-sm text-gray-400">Your Location</span>
        </div>
        <Input
          type="text"
          placeholder="Mumbai, Delhi, Bangalore..."
          value={userData.location}
          onChange={(e) => setUserData((prev: any) => ({ ...prev, location: e.target.value }))}
          className="text-lg py-4"
          disabled={loading}
        />
      </Card>
      
      <Button 
        onClick={handleComplete}
        disabled={!userData.location || loading}
        className="w-full py-6 text-lg"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Completing Setup...
          </>
        ) : (
          'Complete Setup'
        )}
      </Button>
    </div>
  );
}
