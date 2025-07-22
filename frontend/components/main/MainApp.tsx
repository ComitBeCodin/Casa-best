'use client';

import { useState } from 'react';
import { Home, Compass, Heart, ShoppingBag, User } from 'lucide-react';
import { HomePage } from './HomePage';
import { ExplorePage } from './ExplorePage';
import { ConnectedSwipePage } from './ConnectedSwipePage';
import { WishlistPage } from './WishlistPage';
import { ProfilePage } from './ProfilePage';
import { type User } from '@/lib/api';

interface MainAppProps {
  user: User;
  onSignOut: () => void;
}

export function MainApp({ user, onSignOut }: MainAppProps) {
  const [currentTab, setCurrentTab] = useState('home');

  const tabs = [
    { id: 'home', label: 'Home', icon: Home, component: HomePage },
    { id: 'explore', label: 'Explore', icon: Compass, component: ExplorePage },
    { id: 'swipe', label: 'Swipe', icon: Heart, component: ConnectedSwipePage },
    { id: 'wishlist', label: 'Wishlist', icon: ShoppingBag, component: WishlistPage },
    {
      id: 'profile',
      label: 'Profile',
      icon: User,
      component: () => <ProfilePage onSignOut={onSignOut} />
    }
  ];

  const CurrentComponent = tabs.find(tab => tab.id === currentTab)?.component || HomePage;

  return (
    <div className="min-h-screen bg-black text-white">
      <main className="pb-20">
        <CurrentComponent />
      </main>
      
      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-1/2 transform -translate-x-1/2 w-full max-w-sm bg-card/95 backdrop-blur-md border-t border-border">
        <div className="flex justify-around py-3">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setCurrentTab(id)}
              className={`flex flex-col items-center py-2 px-3 rounded-lg transition-all ${
                currentTab === id 
                  ? 'text-primary bg-primary/10' 
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Icon className="w-5 h-5 mb-1" />
              <span className="text-xs font-medium">{label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}