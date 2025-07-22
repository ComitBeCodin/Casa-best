'use client';

import { useState, useEffect } from 'react';
import { ConnectedOnboardingFlow } from '@/components/onboarding/ConnectedOnboardingFlow';
import { MainApp } from '@/components/main/MainApp';
import { storage, type User } from '@/lib/api';

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user exists in storage
    const storedUser = storage.getUser();
    const token = storage.getToken();

    if (storedUser && token && storedUser.onboardingComplete) {
      setUser(storedUser);
    }
    setIsLoading(false);
  }, []);

  const handleOnboardingComplete = (completedUser: User) => {
    setUser(completedUser);
  };

  const handleSignOut = () => {
    // Clear user session
    storage.clearSession();
    setUser(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <>
      {!user ? (
        <ConnectedOnboardingFlow onComplete={handleOnboardingComplete} />
      ) : (
        <MainApp user={user} onSignOut={handleSignOut} />
      )}
    </>
  );
}