'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MapPin, Clock, Search, Bell, User } from 'lucide-react';

export function HomePage() {
  const [selectedGender, setSelectedGender] = useState('all');

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <header className="p-4 bg-gradient-to-r from-purple-900/50 to-orange-900/50 backdrop-blur">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4 text-green-400" />
            <span className="text-sm text-green-400 font-medium">Delivery in 60 minutes</span>
          </div>
          <div className="flex items-center space-x-3">
            <Search className="w-5 h-5 text-gray-400" />
            <Bell className="w-5 h-5 text-gray-400" />
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
              <User className="w-4 h-4 text-black" />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center mb-4">
          <div className="text-center">
            <h1 className="text-2xl font-bold gradient-text">CASA</h1>
            <div className="flex items-center justify-center text-sm text-gray-400 mt-1">
              <MapPin className="w-3 h-3 mr-1" />
              <span>Shreepal Complex, Suren Road</span>
            </div>
          </div>
        </div>

        {/* Gender Toggle */}
        <div className="flex justify-center space-x-2">
          {['MAN', 'WOMAN', 'ALL'].map(gender => (
            <button
              key={gender}
              onClick={() => setSelectedGender(gender.toLowerCase())}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                selectedGender === gender.toLowerCase() || (selectedGender === 'all' && gender === 'ALL')
                  ? 'bg-white text-black' 
                  : 'bg-transparent border border-gray-600 text-white hover:bg-gray-800'
              }`}
            >
              {gender}
            </button>
          ))}
        </div>
      </header>

      <div className="p-4 space-y-6">
        {/* Brand Drops */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">+ CERTIFIED +</h2>
            <span className="text-sm text-primary">DRIPSTER</span>
          </div>
          
          <Card className="relative overflow-hidden bg-gradient-to-br from-orange-500 to-red-600 border-0 h-80">
            <div className="absolute inset-0 bg-black/20"></div>
            <img 
              src="https://images.pexels.com/photos/1040945/pexels-photo-1040945.jpeg?auto=compress&cs=tinysrgb&w=400" 
              alt="French accent"
              className="w-full h-full object-cover"
            />
            <div className="absolute bottom-6 left-6">
              <h3 className="text-2xl font-bold text-white mb-2">French<br />accent</h3>
              <div className="flex items-center space-x-2">
                <span className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                  ₹8 NOW LIVE
                </span>
              </div>
            </div>
          </Card>
        </section>

        {/* Category Grid */}
        <section className="grid grid-cols-4 gap-3">
          {[
            { name: 'Dresses', emoji: '👗' },
            { name: 'Tops', emoji: '👚' },
            { name: 'Jeans', emoji: '👖' },
            { name: 'Jackets', emoji: '🧥' }
          ].map(category => (
            <Card key={category.name} className="p-4 text-center bg-card hover:bg-card/80 transition-colors">
              <div className="text-2xl mb-2">{category.emoji}</div>
              <span className="text-xs text-gray-400">{category.name}</span>
            </Card>
          ))}
        </section>

        {/* Hot in Location */}
        <section>
          <h2 className="text-lg font-semibold mb-4">🔥 Hot in Mumbai</h2>
          <div className="grid grid-cols-2 gap-4">
            {[
              {
                image: "https://images.pexels.com/photos/1040945/pexels-photo-1040945.jpeg?auto=compress&cs=tinysrgb&w=400",
                title: "Street Vibes",
                price: "₹1,299"
              },
              {
                image: "https://images.pexels.com/photos/1040945/pexels-photo-1040945.jpeg?auto=compress&cs=tinysrgb&w=400",
                title: "Date Night",
                price: "₹899"
              }
            ].map((item, index) => (
              <Card key={index} className="overflow-hidden bg-card border-0">
                <div className="relative">
                  <img 
                    src={item.image}
                    alt={item.title}
                    className="w-full h-32 object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
                  <div className="absolute bottom-2 left-2">
                    <p className="text-white text-sm font-medium">{item.title}</p>
                    <p className="text-primary text-xs">{item.price}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </section>

        {/* Followed Brands */}
        <section>
          <h2 className="text-lg font-semibold mb-4">Following</h2>
          <div className="space-y-3">
            {['Zara', 'H&M', 'Urban Outfitters'].map(brand => (
              <Card key={brand} className="p-4 bg-card border-border">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-r from-primary to-accent"></div>
                    <div>
                      <p className="font-medium">{brand}</p>
                      <p className="text-sm text-gray-400">New drop • 2h ago</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" className="border-primary text-primary hover:bg-primary hover:text-black">
                    View
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}