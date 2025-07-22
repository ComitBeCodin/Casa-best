'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { MapPin, User, Shirt, Phone } from 'lucide-react';

interface OnboardingProps {
  onComplete: () => void;
}

export function OnboardingFlow({ onComplete }: OnboardingProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [userData, setUserData] = useState({
    phone: '',
    age: '',
    interests: [] as string[],
    fits: [] as string[],
    location: ''
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
      component: <PhoneStep userData={userData} setUserData={setUserData} onNext={() => setCurrentStep(2)} />
    },
    {
      title: 'Tell us about you',
      subtitle: 'Help us personalize your feed',
      component: <ProfileStep userData={userData} setUserData={setUserData} onNext={() => setCurrentStep(3)} />
    },
    {
      title: 'Your Style Preferences',
      subtitle: 'What fits do you love?',
      component: <StyleStep userData={userData} setUserData={setUserData} onNext={() => setCurrentStep(4)} />
    },
    {
      title: 'Location',
      subtitle: 'For instant delivery magic',
      component: <LocationStep userData={userData} setUserData={setUserData} onComplete={onComplete} />
    }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-purple-900 via-black to-orange-900 p-6">
      <div className="flex-1 flex flex-col justify-center">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold gradient-text mb-2">CASA</h1>
          <div className="flex justify-center space-x-2 mb-6">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full ${
                  index <= currentStep ? 'bg-primary' : 'bg-gray-600'
                }`}
              />
            ))}
          </div>
          <h2 className="text-2xl font-semibold mb-2">{steps[currentStep].title}</h2>
          <p className="text-gray-400">{steps[currentStep].subtitle}</p>
        </div>
        
        {steps[currentStep].component}
      </div>
    </div>
  );
}

function WelcomeStep({ onNext }: { onNext: () => void }) {
  return (
    <div className="text-center space-y-8">
      <div className="text-6xl">👗</div>
      <div className="space-y-4">
        <p className="text-lg text-gray-300">Discover fashion that fits your vibe</p>
        <p className="text-gray-400">Swipe right to love, left to pass</p>
      </div>
      <Button onClick={onNext} className="w-full py-6 text-lg bg-primary hover:bg-primary/90">
        Let's Get Started
      </Button>
    </div>
  );
}

function PhoneStep({ userData, setUserData, onNext }: any) {
  return (
    <div className="space-y-6">
      <Card className="p-6 bg-card border-border">
        <div className="flex items-center space-x-3 mb-4">
          <Phone className="w-5 h-5 text-primary" />
          <span className="text-sm text-gray-400">Mobile Number</span>
        </div>
        <Input
          type="tel"
          placeholder="+91 98765 43210"
          value={userData.phone}
          onChange={(e) => setUserData(prev => ({ ...prev, phone: e.target.value }))}
          className="text-lg py-4"
        />
      </Card>
      <Button 
        onClick={onNext}
        disabled={!userData.phone}
        className="w-full py-6 text-lg"
      >
        Send OTP
      </Button>
    </div>
  );
}

function ProfileStep({ userData, setUserData, onNext }: any) {
  const ageRanges = ['Gen Z (18-25)', 'Millennial (26-35)', 'Other'];
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
              key={range}
              onClick={() => setUserData(prev => ({ ...prev, age: range }))}
              className={`p-4 rounded-xl text-left ${
                userData.age === range ? 'bg-primary text-black' : 'bg-secondary hover:bg-secondary/80'
              }`}
            >
              {range}
            </button>
          ))}
        </div>
      </Card>

      <Card className="p-6 bg-card border-border">
        <span className="text-sm text-gray-400 mb-4 block">Style Interests (pick 3-5)</span>
        <div className="grid grid-cols-2 gap-3">
          {interests.map(interest => (
            <button
              key={interest}
              onClick={() => {
                const newInterests = userData.interests.includes(interest)
                  ? userData.interests.filter(i => i !== interest)
                  : [...userData.interests, interest];
                setUserData(prev => ({ ...prev, interests: newInterests }));
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
        disabled={!userData.age || userData.interests.length < 3}
        className="w-full py-6 text-lg"
      >
        Continue
      </Button>
    </div>
  );
}

function StyleStep({ userData, setUserData, onNext }: any) {
  const fits = ['Oversized', 'Fitted', 'Loose', 'Cropped', 'Baggy', 'Slim'];

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
                const newFits = userData.fits.includes(fit)
                  ? userData.fits.filter(f => f !== fit)
                  : [...userData.fits, fit];
                setUserData(prev => ({ ...prev, fits: newFits }));
              }}
              className={`p-4 rounded-xl ${
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

function LocationStep({ userData, setUserData, onComplete }: any) {
  return (
    <div className="space-y-6">
      <Card className="p-6 bg-card border-border">
        <div className="flex items-center space-x-3 mb-4">
          <MapPin className="w-5 h-5 text-primary" />
          <span className="text-sm text-gray-400">Your Location</span>
        </div>
        <Input
          type="text"
          placeholder="Mumbai, Maharashtra"
          value={userData.location}
          onChange={(e) => setUserData(prev => ({ ...prev, location: e.target.value }))}
          className="text-lg py-4"
        />
        <p className="text-xs text-gray-500 mt-2">
          We use this for instant delivery and local trends
        </p>
      </Card>

      <Button 
        onClick={onComplete}
        disabled={!userData.location}
        className="w-full py-6 text-lg bg-gradient-to-r from-primary to-accent hover:opacity-90"
      >
        Start Swiping! 🔥
      </Button>
    </div>
  );
}