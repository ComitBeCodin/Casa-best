'use client';

import { useState, useRef, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Heart, X, Bookmark, Star, MapPin, Clock, Loader2 } from 'lucide-react';
import { productAPI, type Product } from '@/lib/api';

export function ConnectedSwipePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  // Load products on component mount
  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Try to get sample products first
      const response = await productAPI.getSampleProducts();
      
      if (response.success && response.data) {
        setProducts(response.data.products);
      } else {
        setError('Failed to load products');
      }
    } catch (err: any) {
      console.error('Error loading products:', err);
      setError(err.message || 'Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const handleSwipe = (direction: 'left' | 'right') => {
    if (currentIndex >= products.length) return;

    setSwipeDirection(direction);
    
    // Simulate swipe animation
    setTimeout(() => {
      setCurrentIndex(prev => prev + 1);
      setSwipeDirection(null);
      
      // Load more products if we're running low
      if (currentIndex >= products.length - 2) {
        loadMoreProducts();
      }
    }, 300);
  };

  const loadMoreProducts = async () => {
    try {
      // In a real app, you'd load more products from the API
      // For now, we'll just cycle through the existing ones
      console.log('Loading more products...');
    } catch (err) {
      console.error('Error loading more products:', err);
    }
  };

  const handleLike = () => handleSwipe('right');
  const handleDislike = () => handleSwipe('left');

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Loading amazing products...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-red-500">{error}</p>
          <Button onClick={loadProducts} variant="outline">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-muted-foreground">No products available</p>
          <Button onClick={loadProducts} variant="outline">
            Refresh
          </Button>
        </div>
      </div>
    );
  }

  if (currentIndex >= products.length) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="text-6xl">🎉</div>
          <h2 className="text-2xl font-bold">You've seen it all!</h2>
          <p className="text-muted-foreground">Check back later for new arrivals</p>
          <Button onClick={() => setCurrentIndex(0)} className="mt-4">
            Start Over
          </Button>
        </div>
      </div>
    );
  }

  const currentProduct = products[currentIndex];
  const primaryImage = currentProduct.images.find(img => img.isPrimary) || currentProduct.images[0];

  return (
    <div className="flex-1 flex flex-col">
      {/* Product Card */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="relative w-full max-w-sm">
          <Card 
            ref={cardRef}
            className={`relative overflow-hidden bg-card border-border transition-transform duration-300 ${
              swipeDirection === 'left' ? '-translate-x-full rotate-12' :
              swipeDirection === 'right' ? 'translate-x-full -rotate-12' : ''
            }`}
          >
            {/* Product Image */}
            <div className="relative aspect-[3/4] overflow-hidden">
              <img
                src={primaryImage?.url || '/placeholder-product.jpg'}
                alt={currentProduct.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/placeholder-product.jpg';
                }}
              />
              
              {/* Overlay Actions */}
              <div className="absolute top-4 right-4">
                <Button size="sm" variant="secondary" className="rounded-full w-10 h-10 p-0">
                  <Bookmark className="w-4 h-4" />
                </Button>
              </div>

              {/* Price Badge */}
              <div className="absolute top-4 left-4">
                <div className="bg-black/80 text-white px-3 py-1 rounded-full text-sm font-medium">
                  ₹{currentProduct.price.current}
                  {currentProduct.price.original > currentProduct.price.current && (
                    <span className="ml-2 line-through text-gray-300 text-xs">
                      ₹{currentProduct.price.original}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Product Info */}
            <div className="p-6 space-y-4">
              <div>
                <h3 className="text-xl font-bold text-foreground">{currentProduct.name}</h3>
                <p className="text-sm text-muted-foreground">{currentProduct.brand}</p>
              </div>

              <p className="text-sm text-muted-foreground line-clamp-2">
                {currentProduct.description}
              </p>

              {/* Tags */}
              <div className="flex flex-wrap gap-2">
                <span className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-full">
                  {currentProduct.category}
                </span>
                <span className="px-2 py-1 bg-secondary text-secondary-foreground text-xs rounded-full">
                  {currentProduct.gender}
                </span>
                {currentProduct.colors.slice(0, 2).map((color, index) => (
                  <span key={index} className="px-2 py-1 bg-secondary text-secondary-foreground text-xs rounded-full">
                    {color}
                  </span>
                ))}
              </div>

              {/* Delivery Info */}
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <div className="flex items-center space-x-1">
                  <Clock className="w-3 h-3" />
                  <span>Fast delivery</span>
                </div>
                <div className="flex items-center space-x-1">
                  <MapPin className="w-3 h-3" />
                  <span>In stock</span>
                </div>
              </div>
            </div>
          </Card>

          {/* Swipe Indicators */}
          {swipeDirection && (
            <div className={`absolute inset-0 flex items-center justify-center pointer-events-none ${
              swipeDirection === 'right' ? 'text-green-500' : 'text-red-500'
            }`}>
              <div className="text-6xl font-bold opacity-80">
                {swipeDirection === 'right' ? '💚' : '💔'}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="p-6">
        <div className="flex justify-center space-x-6">
          <Button
            size="lg"
            variant="outline"
            className="rounded-full w-16 h-16 p-0 border-red-200 hover:bg-red-50"
            onClick={handleDislike}
            disabled={swipeDirection !== null}
          >
            <X className="w-6 h-6 text-red-500" />
          </Button>
          
          <Button
            size="lg"
            className="rounded-full w-16 h-16 p-0 bg-green-500 hover:bg-green-600"
            onClick={handleLike}
            disabled={swipeDirection !== null}
          >
            <Heart className="w-6 h-6 text-white" />
          </Button>
        </div>
        
        {/* Progress */}
        <div className="mt-4 text-center">
          <p className="text-sm text-muted-foreground">
            {currentIndex + 1} of {products.length}
          </p>
        </div>
      </div>
    </div>
  );
}
