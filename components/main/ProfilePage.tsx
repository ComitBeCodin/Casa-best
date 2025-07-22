'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { User, MapPin, Bell, Heart, ShoppingBag, Settings, LogOut, Edit } from 'lucide-react';

export function ProfilePage() {
  const [notifications, setNotifications] = useState(true);
  const [instantDelivery, setInstantDelivery] = useState(true);

  const userStats = {
    itemsLiked: 156,
    closetsSaved: 23,
    ordersPlaced: 8,
    following: 45
  };

  const preferences = JSON.parse(localStorage.getItem('casa-userData') || '{}');

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="p-4 bg-gradient-to-r from-purple-900/30 to-orange-900/30 backdrop-blur">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold gradient-text">Profile</h1>
          <Button variant="ghost" size="icon">
            <Settings className="w-5 h-5" />
          </Button>
        </div>
      </header>

      <div className="p-4 space-y-6">
        {/* Profile Info */}
        <Card className="p-6 bg-card border-0">
          <div className="flex items-center space-x-4 mb-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-r from-primary to-accent flex items-center justify-center">
              <User className="w-8 h-8 text-black" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-white">Fashion Explorer</h2>
              <div className="flex items-center space-x-1 text-gray-400">
                <MapPin className="w-3 h-3" />
                <span className="text-sm">{preferences.location || 'Mumbai, Maharashtra'}</span>
              </div>
            </div>
            <Button variant="outline" size="sm" className="border-border">
              <Edit className="w-3 h-3 mr-1" />
              Edit
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-4">
            {[
              { label: 'Liked', value: userStats.itemsLiked },
              { label: 'Saved', value: userStats.closetsSaved },
              { label: 'Orders', value: userStats.ordersPlaced },
              { label: 'Following', value: userStats.following }
            ].map(stat => (
              <div key={stat.label} className="text-center">
                <div className="text-xl font-bold text-primary">{stat.value}</div>
                <div className="text-xs text-gray-400">{stat.label}</div>
              </div>
            ))}
          </div>
        </Card>

        {/* Style Preferences */}
        <Card className="p-6 bg-card border-0">
          <h3 className="font-semibold mb-4 flex items-center">
            <Heart className="w-4 h-4 mr-2 text-primary" />
            Your Style DNA
          </h3>
          
          <div className="space-y-4">
            <div>
              <span className="text-sm text-gray-400 block mb-2">Age Group</span>
              <Badge variant="secondary" className="bg-primary/20 text-primary">
                {preferences.age || 'Gen Z (18-25)'}
              </Badge>
            </div>
            
            <div>
              <span className="text-sm text-gray-400 block mb-2">Style Interests</span>
              <div className="flex flex-wrap gap-2">
                {(preferences.interests || ['Streetwear', 'Y2K', 'Vintage']).map(interest => (
                  <Badge key={interest} variant="outline" className="border-border text-gray-300">
                    {interest}
                  </Badge>
                ))}
              </div>
            </div>
            
            <div>
              <span className="text-sm text-gray-400 block mb-2">Preferred Fits</span>
              <div className="flex flex-wrap gap-2">
                {(preferences.fits || ['Oversized', 'Loose']).map(fit => (
                  <Badge key={fit} variant="outline" className="border-border text-gray-300">
                    {fit}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </Card>

        {/* Settings */}
        <Card className="p-6 bg-card border-0">
          <h3 className="font-semibold mb-4">Preferences</h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Bell className="w-4 h-4 text-gray-400" />
                <div>
                  <span className="text-sm font-medium">Push Notifications</span>
                  <p className="text-xs text-gray-400">New drops, sales, and updates</p>
                </div>
              </div>
              <Switch checked={notifications} onCheckedChange={setNotifications} />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <ShoppingBag className="w-4 h-4 text-gray-400" />
                <div>
                  <span className="text-sm font-medium">Instant Delivery Priority</span>
                  <p className="text-xs text-gray-400">Show instant delivery items first</p>
                </div>
              </div>
              <Switch checked={instantDelivery} onCheckedChange={setInstantDelivery} />
            </div>
          </div>
        </Card>

        {/* Quick Actions */}
        <Card className="p-6 bg-card border-0">
          <h3 className="font-semibold mb-4">Quick Actions</h3>
          
          <div className="space-y-3">
            {[
              { icon: Heart, label: 'Order History', description: 'View past purchases' },
              { icon: MapPin, label: 'Delivery Addresses', description: 'Manage delivery locations' },
              { icon: User, label: 'Help & Support', description: 'Get help or contact us' },
              { icon: Settings, label: 'Privacy Settings', description: 'Manage your data and privacy' }
            ].map(({ icon: Icon, label, description }) => (
              <button key={label} className="w-full text-left p-3 rounded-lg hover:bg-secondary/50 transition-colors">
                <div className="flex items-center space-x-3">
                  <Icon className="w-4 h-4 text-gray-400" />
                  <div>
                    <div className="text-sm font-medium text-white">{label}</div>
                    <div className="text-xs text-gray-400">{description}</div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </Card>

        {/* Logout */}
        <Button 
          variant="outline" 
          className="w-full border-red-600 text-red-400 hover:bg-red-600 hover:text-white"
          onClick={() => {
            localStorage.removeItem('casa-onboarded');
            window.location.reload();
          }}
        >
          <LogOut className="w-4 h-4 mr-2" />
          Sign Out
        </Button>
      </div>
    </div>
  );
}