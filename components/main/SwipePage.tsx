'use client';

import { useState, useRef, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Heart, X, Bookmark, Star, MapPin, Clock } from 'lucide-react';

const products = [
  {
    id: 1,
    image: "https://images.pexels.com/photos/1926769/pexels-photo-1926769.jpeg?auto=compress&cs=tinysrgb&w=600",
    title: "Cropped Hoodie Set",
    brand: "Street Dreams",
    price: "₹1,899",
    originalPrice: "₹2,799",
    tags: ["Y2K", "Cropped", "Set"],
    rating: 4.8,
    deliveryTime: "30 mins",
    inStock: true
  },
  {
    id: 2,
    image: "https://images.pexels.com/photos/1598505/pexels-photo-1598505.jpeg?auto=compress&cs=tinysrgb&w=600",
    title: "Baggy Cargo Pants",
    brand: "Urban Edge",
    price: "₹2,299",
    originalPrice: "₹3,199",
    tags: ["Streetwear", "Baggy", "Cargo"],
    rating: 4.9,
    deliveryTime: "45 mins",
    inStock: true
  },
  {
    id: 3,
    image: "https://images.pexels.com/photos/1536619/pexels-photo-1536619.jpeg?auto=compress&cs=tinysrgb&w=600",
    title: "Mesh Bodysuit",
    brand: "Femme Fatal",
    price: "₹1,599",
    originalPrice: "₹2,299",
    tags: ["Party", "Mesh", "Bodysuit"],
    rating: 4.7,
    deliveryTime: "60 mins",
    inStock: true
  },
  {
    id: 4,
    image: "https://images.pexels.com/photos/1043474/pexels-photo-1043474.jpeg?auto=compress&cs=tinysrgb&w=600",
    title: "Oversized Blazer",
    brand: "Boss Babe",
    price: "₹3,299",
    originalPrice: "₹4,799",
    tags: ["Formal", "Oversized", "Blazer"],
    rating: 4.8,
    deliveryTime: "30 mins",
    inStock: true
  },
  {
    id: 5,
    image: "https://images.pexels.com/photos/1192609/pexels-photo-1192609.jpeg?auto=compress&cs=tinysrgb&w=600",
    title: "Platform Boots",
    brand: "Chunky Vibes",
    price: "₹2,999",
    originalPrice: "₹4,199",
    tags: ["Y2K", "Platform", "Boots"],
    rating: 4.6,
    deliveryTime: "45 mins",
    inStock: false
  },
  {
    id: 6,
    image: "https://images.pexels.com/photos/1040945/pexels-photo-1040945.jpeg?auto=compress&cs=tinysrgb&w=600",
    title: "Vintage Denim Jacket",
    brand: "Retro Culture",
    price: "₹2,799",
    originalPrice: "₹3,999",
    tags: ["Vintage", "Denim", "Oversized"],
    rating: 4.9,
    deliveryTime: "30 mins",
    inStock: true
  },
  {
    id: 7,
    image: "https://images.pexels.com/photos/1926769/pexels-photo-1926769.jpeg?auto=compress&cs=tinysrgb&w=600",
    title: "Corset Mini Dress",
    brand: "Date Night Co",
    price: "₹1,999",
    originalPrice: "₹2,899",
    tags: ["Party", "Corset", "Mini"],
    rating: 4.7,
    deliveryTime: "60 mins",
    inStock: true
  },
  {
    id: 8,
    image: "https://images.pexels.com/photos/1598505/pexels-photo-1598505.jpeg?auto=compress&cs=tinysrgb&w=600",
    title: "Wide Leg Trousers",
    brand: "Minimalist Co",
    price: "₹2,199",
    originalPrice: "₹3,099",
    tags: ["Minimalist", "Wide Leg", "Formal"],
    rating: 4.8,
    deliveryTime: "45 mins",
    inStock: true
  },
  {
    id: 9,
    image: "https://images.pexels.com/photos/1536619/pexels-photo-1536619.jpeg?auto=compress&cs=tinysrgb&w=600",
    title: "Graphic Band Tee",
    brand: "Vintage Vibes",
    price: "₹899",
    originalPrice: "₹1,399",
    tags: ["Vintage", "Graphic", "Oversized"],
    rating: 4.5,
    deliveryTime: "30 mins",
    inStock: true
  },
  {
    id: 10,
    image: "https://images.pexels.com/photos/1043474/pexels-photo-1043474.jpeg?auto=compress&cs=tinysrgb&w=600",
    title: "Pleated Skirt Set",
    brand: "Seoul Style",
    price: "₹1,699",
    originalPrice: "₹2,399",
    tags: ["Y2K", "Pleated", "Set"],
    rating: 4.9,
    deliveryTime: "60 mins",
    inStock: true
  }
];

export function SwipePage() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const startX = useRef(0);
  const currentX = useRef(0);
  const isDragging = useRef(false);

  const currentProduct = products[currentIndex];

  const handleTouchStart = (e: React.TouchEvent) => {
    isDragging.current = true;
    startX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging.current) return;
    
    currentX.current = e.touches[0].clientX - startX.current;
    
    if (cardRef.current) {
      const rotation = currentX.current / 10;
      cardRef.current.style.transform = `translateX(${currentX.current}px) rotate(${rotation}deg)`;
      cardRef.current.style.opacity = String(1 - Math.abs(currentX.current) / 300);
    }
  };

  const handleTouchEnd = () => {
    if (!isDragging.current) return;
    isDragging.current = false;

    const threshold = 100;
    
    if (Math.abs(currentX.current) > threshold) {
      handleSwipe(currentX.current > 0 ? 'right' : 'left');
    } else {
      // Reset position
      if (cardRef.current) {
        cardRef.current.style.transform = 'translateX(0) rotate(0deg)';
        cardRef.current.style.opacity = '1';
      }
    }
    
    currentX.current = 0;
  };

  // Add mouse events for desktop testing
  const handleMouseDown = (e: React.MouseEvent) => {
    isDragging.current = true;
    startX.current = e.clientX;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current) return;
    
    currentX.current = e.clientX - startX.current;
    
    if (cardRef.current) {
      const rotation = currentX.current / 10;
      cardRef.current.style.transform = `translateX(${currentX.current}px) rotate(${rotation}deg)`;
      cardRef.current.style.opacity = String(1 - Math.abs(currentX.current) / 300);
    }
  };

  const handleMouseUp = () => {
    if (!isDragging.current) return;
    isDragging.current = false;

    const threshold = 100;
    
    if (Math.abs(currentX.current) > threshold) {
      handleSwipe(currentX.current > 0 ? 'right' : 'left');
    } else {
      // Reset position
      if (cardRef.current) {
        cardRef.current.style.transform = 'translateX(0) rotate(0deg)';
        cardRef.current.style.opacity = '1';
      }
    }
    
    currentX.current = 0;
  };

  const handleSwipe = (direction: 'left' | 'right') => {
    if (isAnimating) return;
    
    setIsAnimating(true);
    
    if (cardRef.current) {
      cardRef.current.classList.add(direction === 'left' ? 'swipe-left' : 'swipe-right');
    }
    
    setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % products.length);
      setIsAnimating(false);
      if (cardRef.current) {
        cardRef.current.classList.remove('swipe-left', 'swipe-right');
        cardRef.current.style.transform = 'translateX(0) rotate(0deg)';
        cardRef.current.style.opacity = '1';
      }
    }, 300);

    // Analytics: Track swipe
    console.log(`Swiped ${direction} on product:`, currentProduct.id);
  };

  if (!currentProduct) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-black to-orange-900 p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 pt-4">
        <div className="flex items-center space-x-2">
          <Clock className="w-4 h-4 text-green-400" />
          <span className="text-sm text-green-400">Instant delivery available</span>
        </div>
        <div className="flex items-center space-x-1">
          <Star className="w-4 h-4 text-yellow-400 fill-current" />
          <span className="text-sm">{currentProduct.rating}</span>
        </div>
      </div>

      {/* Main Card */}
      <div className="relative h-[70vh] flex items-center justify-center">
        <Card
          ref={cardRef}
          className="relative w-full max-w-sm h-full bg-card border-0 overflow-hidden cursor-grab active:cursor-grabbing"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          style={{ touchAction: 'none' }}
        >
          <div className="relative h-full">
            <img
              src={currentProduct.image}
              alt={currentProduct.title}
              className="w-full h-full object-cover"
              draggable={false}
            />
            
            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent"></div>
            
            {/* Stock Status */}
            {!currentProduct.inStock && (
              <div className="absolute top-4 right-4 bg-red-500 text-white px-3 py-1 rounded-full text-sm">
                Out of Stock
              </div>
            )}
            
            {/* Product Info */}
            <div className="absolute bottom-0 left-0 right-0 p-6">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-2xl font-bold text-white">{currentProduct.title}</h2>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="text-white hover:bg-white/20"
                  onClick={(e) => {
                    e.stopPropagation();
                    console.log('Bookmarked:', currentProduct.id);
                  }}
                >
                  <Bookmark className="w-5 h-5" />
                </Button>
              </div>
              
              <p className="text-gray-300 mb-2">{currentProduct.brand}</p>
              
              <div className="flex items-center space-x-4 mb-4">
                <span className="text-2xl font-bold text-primary">{currentProduct.price}</span>
                <span className="text-lg text-gray-400 line-through">{currentProduct.originalPrice}</span>
                <div className="flex items-center space-x-1">
                  <MapPin className="w-3 h-3 text-gray-400" />
                  <span className="text-sm text-gray-400">{currentProduct.deliveryTime}</span>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-2 mb-4">
                {currentProduct.tags.map(tag => (
                  <span 
                    key={tag}
                    className="px-3 py-1 bg-white/20 backdrop-blur rounded-full text-sm text-white"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Swipe Instructions */}
      <div className="text-center mt-6">
        <p className="text-sm text-gray-400">
          👈 Swipe left to pass • Swipe right to like 👉
        </p>
      </div>
    </div>
  );
}