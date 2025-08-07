'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Product } from './shared/types';

interface FeaturedProductsCarouselProps {
  products: Product[];
  onAddToCart: (product: Product) => Promise<void>;
  itemsPerView?: number;
  className?: string;
}

export default function FeaturedProductsCarousel({
  products,
  onAddToCart,
  itemsPerView = 4,
  className = ""
}: FeaturedProductsCarouselProps) {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  
  const canGoPrevious = currentIndex > 0;
  const canGoNext = currentIndex < products.length - itemsPerView;
  
  const goToPrevious = () => {
    if (canGoPrevious) {
      setCurrentIndex(Math.max(0, currentIndex - 1));
    }
  };
  
  const goToNext = () => {
    if (canGoNext) {
      setCurrentIndex(Math.min(products.length - itemsPerView, currentIndex + 1));
    }
  };

  // Get current visible products
  const visibleProducts = products.slice(currentIndex, currentIndex + itemsPerView);

  return (
    <div className={`relative ${className}`}>
      {/* Previous Arrow (Left) */}
      {canGoPrevious && (
        <button
          onClick={goToPrevious}
          className="absolute -left-6 top-1/2 transform -translate-y-1/2 z-10 w-12 h-12 rounded-full flex items-center justify-center bg-white shadow-lg hover:shadow-xl hover:scale-110 cursor-pointer transition-all duration-300"
        >
          <svg 
            className="w-6 h-6 text-gray-700" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M15 19l-7-7 7-7" 
            />
          </svg>
        </button>
      )}

      {/* Products Grid */}
      <div className="mx-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {visibleProducts.map((product, index) => (
            <div 
              key={product.id} 
              className="bg-custom-gray rounded-lg p-4 hover:bg-gray-300 transition-all duration-300 border border-gray-300 shadow-md cursor-pointer group transform hover:scale-105 hover:shadow-xl"
              style={{
                animationName: 'fadeInUp',
                animationDuration: '0.6s',
                animationTimingFunction: 'ease-out',
                animationDelay: `${index * 0.1}s`,
                animationFillMode: 'both'
              }}
            >
              <div className="relative mb-4" onClick={() => router.push(`/product/${product.id}`)}>
                <img 
                  src={product.image || '/placeholder-product.jpg'} 
                  alt={product.name} 
                  className="w-full h-72 object-cover rounded-lg group-hover:scale-110 transition-transform duration-500"
                />
                {product.isOnSale && (
                  <span className="absolute top-2 right-2 bg-red-600 text-white px-3 py-1 rounded-full text-xs font-bold animate-pulse">
                    -{product.discount}%
                  </span>
                )}
                <div className="absolute top-2 left-2">
                  <span className="bg-yellow-500 text-white px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                    ⭐ مميز
                  </span>
                </div>
              </div>
              <div onClick={() => router.push(`/product/${product.id}`)}>
                <h4 className="font-semibold mb-2 text-gray-800 truncate transition-colors group-hover:text-[#5D1F1F]">{product.name}</h4>
                <div className="h-10 mb-3">
                  <p className="text-gray-600 text-sm overflow-hidden" style={{
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    lineHeight: '1.25rem',
                    maxHeight: '2.5rem'
                  }}>
                    {product.description || ''}
                  </p>
                </div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {product.originalPrice && (
                      <span className="text-sm text-gray-500 line-through">{product.originalPrice} ريال</span>
                    )}
                    <span className="text-lg font-bold" style={{color: '#5D1F1F'}}>{product.price} ريال</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <span className="text-yellow-400">⭐</span>
                    <span className="text-sm text-gray-400">{product.rating} ({product.reviews})</span>
                  </div>
                </div>
              </div>
              <button 
                onClick={async (e) => {
                  e.stopPropagation();
                  await onAddToCart(product);
                }}
                className="w-full mt-3 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 text-white transform hover:scale-105 active:scale-95"
                style={{backgroundColor: '#5D1F1F'}}
                onMouseEnter={(e) => {
                  (e.target as HTMLButtonElement).style.backgroundColor = '#4A1616';
                  (e.target as HTMLButtonElement).style.boxShadow = '0 4px 15px rgba(93, 31, 31, 0.3)';
                }}
                onMouseLeave={(e) => {
                  (e.target as HTMLButtonElement).style.backgroundColor = '#5D1F1F';
                  (e.target as HTMLButtonElement).style.boxShadow = 'none';
                }}
              >
                أضف للسلة
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Next Arrow (Right) */}
      {canGoNext && (
        <button
          onClick={goToNext}
          className="absolute -right-6 top-1/2 transform -translate-y-1/2 z-10 w-12 h-12 rounded-full flex items-center justify-center bg-white shadow-lg hover:shadow-xl hover:scale-110 cursor-pointer transition-all duration-300"
        >
          <svg 
            className="w-6 h-6 text-gray-700" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M9 5l7 7-7 7" 
            />
          </svg>
        </button>
      )}

      {/* Dots Indicator */}
      {products.length > itemsPerView && (
        <div className="flex justify-center mt-6 gap-2">
          {Array.from({ length: Math.ceil((products.length - itemsPerView + 1)) }, (_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`w-3 h-3 rounded-full transition-all duration-300 ${
                index === currentIndex 
                  ? 'scale-110' 
                  : 'hover:bg-gray-400'
              }`}
              style={{
                backgroundColor: index === currentIndex ? '#5D1F1F' : '#D1D5DB'
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}