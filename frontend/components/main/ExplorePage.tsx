'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Search, Filter, MapPin, Bookmark, Heart } from 'lucide-react';

export function ExplorePage() {
  const [deliveryRadius, setDeliveryRadius] = useState([15]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const categories = [
    { id: 'all', name: 'All' },
    { id: 'pookie-fits', name: 'Pookie Fits' },
    { id: 'date-night', name: 'Date Night' },
    { id: 'superstar', name: 'Superstar Style' },
    { id: 'street', name: 'Streetwear' },
    { id: 'vintage', name: 'Vintage' }
  ];

  const collections = [
    {
      id: 1,
      title: "Mumbai Street Vibes",
      creator: "@fashionista_mum",
      items: 24,
      saves: 1.2,
      image: "https://images.pexels.com/photos/1040945/pexels-photo-1040945.jpeg?auto=compress&cs=tinysrgb&w=400",
      tags: ["Street", "Mumbai", "Casual"]
    },
    {
      id: 2,
      title: "Date Night Essentials",
      creator: "@stylebypriya",
      items: 18,
      saves: 856,
      image: "https://images.pexels.com/photos/1040945/pexels-photo-1040945.jpeg?auto=compress&cs=tinysrgb&w=400",
      tags: ["Romance", "Evening", "Elegant"]
    },
    {
      id: 3,
      title: "Y2K Revival",
      creator: "@retroqueenz",
      items: 32,
      saves: 2.1,
      image: "https://images.pexels.com/photos/1040945/pexels-photo-1040945.jpeg?auto=compress&cs=tinysrgb&w=400",
      tags: ["Y2K", "Vintage", "Bold"]
    }
  ];

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="p-4 bg-gradient-to-r from-purple-900/30 to-orange-900/30 backdrop-blur">
        <div className="flex items-center space-x-3 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search styles, brands, creators..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-card border-border text-white"
            />
          </div>
          <Button variant="outline" size="icon" className="border-border">
            <Filter className="w-4 h-4" />
          </Button>
        </div>

        {/* Delivery Range Filter */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Instant Delivery Range</span>
            <span className="text-sm text-primary">{deliveryRadius[0]}km</span>
          </div>
          <Slider
            value={deliveryRadius}
            onValueChange={setDeliveryRadius}
            max={35}
            min={0}
            step={5}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>0km</span>
            <span>All India</span>
          </div>
        </div>
      </header>

      <div className="p-4">
        {/* Categories */}
        <div className="flex overflow-x-auto space-x-3 pb-4 mb-6">
          {categories.map(category => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`px-4 py-2 rounded-full whitespace-nowrap text-sm font-medium transition-all ${
                selectedCategory === category.id
                  ? 'bg-primary text-black'
                  : 'bg-card text-gray-300 hover:bg-card/80'
              }`}
            >
              {category.name}
            </button>
          ))}
        </div>

        {/* Featured Collections */}
        <section className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">🔥 Trending Closets</h2>
            <Button variant="ghost" size="sm" className="text-primary">
              View All
            </Button>
          </div>
          
          <div className="space-y-4">
            {collections.map(collection => (
              <Card key={collection.id} className="overflow-hidden bg-card border-0">
                <div className="flex">
                  <img
                    src={collection.image}
                    alt={collection.title}
                    className="w-20 h-20 object-cover"
                  />
                  <div className="flex-1 p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-semibold text-white">{collection.title}</h3>
                        <p className="text-sm text-gray-400">{collection.creator}</p>
                      </div>
                      <Button variant="ghost" size="icon" className="text-gray-400 hover:text-primary">
                        <Bookmark className="w-4 h-4" />
                      </Button>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4 text-xs text-gray-400">
                        <span>{collection.items} items</span>
                        <div className="flex items-center space-x-1">
                          <Heart className="w-3 h-3" />
                          <span>{collection.saves}k saves</span>
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap gap-1">
                        {collection.tags.slice(0, 2).map(tag => (
                          <span 
                            key={tag}
                            className="px-2 py-1 bg-primary/20 text-primary text-xs rounded"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </section>

        {/* Curated Sections */}
        <section className="mb-8">
          <h2 className="text-xl font-bold mb-4">✨ Curated for You</h2>
          <div className="grid grid-cols-2 gap-4">
            {[
              {
                title: "Office Slay",
                count: "45 items",
                image: "https://images.pexels.com/photos/1040945/pexels-photo-1040945.jpeg?auto=compress&cs=tinysrgb&w=400"
              },
              {
                title: "Weekend Vibes",
                count: "32 items",
                image: "https://images.pexels.com/photos/1040945/pexels-photo-1040945.jpeg?auto=compress&cs=tinysrgb&w=400"
              },
              {
                title: "Party Ready",
                count: "28 items",
                image: "https://images.pexels.com/photos/1040945/pexels-photo-1040945.jpeg?auto=compress&cs=tinysrgb&w=400"
              },
              {
                title: "Cozy Comfort",
                count: "41 items",
                image: "https://images.pexels.com/photos/1040945/pexels-photo-1040945.jpeg?auto=compress&cs=tinysrgb&w=400"
              }
            ].map((section, index) => (
              <Card key={index} className="relative overflow-hidden bg-card border-0 h-32">
                <img
                  src={section.image}
                  alt={section.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
                <div className="absolute bottom-3 left-3">
                  <h3 className="font-semibold text-white text-sm">{section.title}</h3>
                  <p className="text-xs text-gray-300">{section.count}</p>
                </div>
              </Card>
            ))}
          </div>
        </section>

        {/* Location-based */}
        <section>
          <div className="flex items-center space-x-2 mb-4">
            <MapPin className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-bold">Hot in Your Area</h2>
          </div>
          
          <div className="space-y-3">
            {['Andheri Streetwear', 'Bandra Boho', 'South Mumbai Chic'].map((trend, index) => (
              <Card key={index} className="p-4 bg-card border-border">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-white">{trend}</h3>
                    <p className="text-sm text-gray-400">Trending in 5km radius</p>
                  </div>
                  <Button variant="outline" size="sm" className="border-primary text-primary">
                    Explore
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