'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Product } from './shared/types';

interface InteractiveProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => Promise<void>;
  deviceType: 'desktop' | 'tablet' | 'mobile';
}

export default function InteractiveProductCard({ 
  product, 
  onAddToCart,
  deviceType 
}: InteractiveProductCardProps) {
  const router = useRouter();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const imageRef = useRef<HTMLDivElement>(null);
  
  // Create array of all available images (main image + additional images)
  const allImages = product.images && product.images.length > 0 
    ? [product.image, ...product.images].filter(Boolean) as string[]
    : product.image 
      ? [product.image]
      : [];

  // Handle mouse movement over the image to cycle through images
  const handleImageMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (allImages.length <= 1) return;
    
    const imageContainer = imageRef.current;
    if (!imageContainer) return;

    const rect = imageContainer.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const containerWidth = rect.width;
    
    // Calculate which image to show based on mouse position
    const imageIndex = Math.floor((mouseX / containerWidth) * allImages.length);
    const clampedIndex = Math.max(0, Math.min(imageIndex, allImages.length - 1));
    
    setCurrentImageIndex(clampedIndex);
  };

  // Reset to first image when mouse leaves
  const handleImageMouseLeave = () => {
    setCurrentImageIndex(0);
  };

  // Get responsive classes based on device type
  const getResponsiveClasses = () => {
    switch (deviceType) {
      case 'desktop':
        return {
          containerClass: 'bg-custom-gray rounded-lg p-4 hover:bg-gray-300 transition-colors border border-gray-300 shadow-md cursor-pointer group',
          imageClass: 'w-full h-72 object-cover rounded-lg scale-105',
          titleClass: 'font-semibold mb-2 text-gray-800 truncate transition-colors group-hover:text-[#5D1F1F]'
        };
      case 'tablet':
        return {
          containerClass: 'bg-gray-800 rounded-lg p-3 hover:bg-gray-700 transition-colors border border-gray-700 cursor-pointer group',
          imageClass: 'w-full h-48 object-cover rounded-lg scale-105',
          titleClass: 'font-semibold mb-2 text-sm text-white truncate transition-colors'
        };
      case 'mobile':
        return {
          containerClass: 'bg-gray-800 rounded-lg p-3 hover:bg-gray-700 transition-colors border border-gray-700 cursor-pointer group',
          imageClass: 'w-full h-40 object-cover rounded-lg scale-105',
          titleClass: 'font-semibold mb-2 text-sm text-white truncate transition-colors'
        };
    }
  };

  const classes = getResponsiveClasses();

  return (
    <div className={classes.containerClass}>
      <div 
        ref={imageRef}
        className="relative mb-4" 
        onClick={() => router.push(`/product/${product.id}`)}
        onMouseMove={handleImageMouseMove}
        onMouseLeave={handleImageMouseLeave}
      >
        <img 
          src={allImages[currentImageIndex] || product.image || '/placeholder-product.jpg'}
          alt={product.name} 
          className={classes.imageClass}
          onError={(e) => {
            (e.target as HTMLImageElement).src = '/placeholder-product.jpg';
          }}
        />
        {product.isOnSale && (
          <span className="absolute top-2 right-2 bg-red-600 text-white px-2 py-1 rounded-full text-xs font-bold">
            -{product.discount}%
          </span>
        )}
        
      </div>
      
      <div onClick={() => router.push(`/product/${product.id}`)}>
        <h4 className={classes.titleClass}>{product.name}</h4>
        <div className="h-10 mb-3">
          <p className={`text-sm overflow-hidden ${
            deviceType === 'desktop' ? 'text-gray-600' : 'text-gray-300'
          }`} style={{
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            lineHeight: '1.25rem',
            maxHeight: '2.5rem'
          }}>
            {product.description}
          </p>
        </div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            {product.originalPrice && (
              <span className={`text-sm line-through ${
                deviceType === 'desktop' ? 'text-gray-500' : 'text-gray-400'
              }`}>
                {product.originalPrice} ريال
              </span>
            )}
            <span className="text-lg font-bold" style={{color: '#5D1F1F'}}>
              {product.price} ريال
            </span>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <span className="text-yellow-400">⭐</span>
            <span className={`text-sm ${
              deviceType === 'desktop' ? 'text-gray-400' : 'text-gray-300'
            }`}>
              {product.rating} ({product.reviews})
            </span>
          </div>
        </div>
      </div>
      
      <button 
        onClick={async (e) => {
          e.stopPropagation();
          await onAddToCart(product);
        }}
        className={`w-full mt-3 rounded-lg font-medium transition-colors text-white ${
          deviceType === 'mobile' 
            ? 'p-1.5 text-xs' 
            : 'px-4 py-2 text-sm'
        }`}
        style={{backgroundColor: '#5D1F1F'}}
        onMouseEnter={(e) => {
          (e.target as HTMLButtonElement).style.backgroundColor = '#4A1616';
        }}
        onMouseLeave={(e) => {
          (e.target as HTMLButtonElement).style.backgroundColor = '#5D1F1F';
        }}
      >
        {deviceType === 'mobile' ? (
          <svg className="w-4 h-4 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        ) : (
          'أضف للسلة'
        )}
      </button>
    </div>
  );
}