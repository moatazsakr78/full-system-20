'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Product, ProductColor } from './shared/types';

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
  const [selectedColor, setSelectedColor] = useState<ProductColor | null>(null);
  const imageRef = useRef<HTMLDivElement>(null);
  
  // Create array of all available images (main image + additional images)
  const allImages = product.images && product.images.length > 0 
    ? [product.image, ...product.images].filter(Boolean) as string[]
    : product.image 
      ? [product.image]
      : [];

  // Get current display image - prioritize selected color images, then regular images
  const getCurrentDisplayImage = () => {
    if (selectedColor && selectedColor.image_url) {
      // If a color is selected and has images, create array with color image first, then regular images
      const colorImages = [selectedColor.image_url, ...allImages.filter(img => img !== selectedColor.image_url)];
      return colorImages[currentImageIndex] || selectedColor.image_url;
    }
    return allImages[currentImageIndex] || product.image || '/placeholder-product.svg';
  };

  // Handle mouse movement over the image to cycle through images
  const handleImageMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const imageContainer = imageRef.current;
    if (!imageContainer) return;

    // Get available images array based on selected color
    const availableImages = selectedColor && selectedColor.image_url
      ? [selectedColor.image_url, ...allImages.filter(img => img !== selectedColor.image_url)]
      : allImages;
    
    if (availableImages.length <= 1) return;

    const rect = imageContainer.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const containerWidth = rect.width;
    
    // Calculate which image to show based on mouse position
    const imageIndex = Math.floor((mouseX / containerWidth) * availableImages.length);
    const clampedIndex = Math.max(0, Math.min(imageIndex, availableImages.length - 1));
    
    setCurrentImageIndex(clampedIndex);
  };

  // Reset to first image when mouse leaves
  const handleImageMouseLeave = () => {
    setCurrentImageIndex(0);
  };

  // Handle color selection with toggle functionality
  const handleColorSelect = (color: ProductColor, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent navigation to product page
    // Toggle color selection - if same color is clicked, deselect it
    if (selectedColor?.id === color.id) {
      setSelectedColor(null);
    } else {
      setSelectedColor(color);
    }
    setCurrentImageIndex(0); // Reset image index when color changes
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
          containerClass: 'bg-custom-gray rounded-lg p-4 hover:bg-gray-300 transition-colors border border-gray-300 shadow-md cursor-pointer group',
          imageClass: 'w-full h-64 object-cover rounded-lg scale-105',
          titleClass: 'font-semibold mb-2 text-gray-800 truncate transition-colors group-hover:text-[#5D1F1F]'
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
    <div 
      className={`${classes.containerClass} flex flex-col`}
      data-device-type={deviceType}
    >
      <div 
        ref={imageRef}
        className="relative mb-4" 
        onClick={() => router.push(`/product/${product.id}`)}
        onMouseMove={handleImageMouseMove}
        onMouseLeave={handleImageMouseLeave}
      >
        <img 
          src={getCurrentDisplayImage()}
          alt={product.name} 
          className={classes.imageClass}
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            if (target.src !== '/placeholder-product.svg') {
              target.src = '/placeholder-product.svg';
            }
          }}
        />
        {product.isOnSale && (
          <span className="absolute top-2 right-2 bg-red-600 text-white px-2 py-1 rounded-full text-xs font-bold">
            -{product.discount}%
          </span>
        )}
        
      </div>
      
      <div onClick={() => router.push(`/product/${product.id}`)} className="flex flex-col">
        <h4 className={classes.titleClass}>{product.name}</h4>
        {/* Description with dynamic height based on colors availability */}
        <div 
          className="mb-1"
          style={{ 
            height: product.colors && product.colors.length > 0 
              ? (deviceType === 'tablet' ? '2.75rem' : '2.5rem')
              : (deviceType === 'tablet' ? '4rem' : '3.75rem')
          }}
        >
          <p className={`text-sm overflow-hidden ${
            deviceType === 'mobile' ? 'text-gray-300' : 'text-gray-600'
          }`} style={{
            display: '-webkit-box',
            WebkitLineClamp: product.colors && product.colors.length > 0 ? 2 : 3,
            WebkitBoxOrient: 'vertical',
            lineHeight: '1.25rem',
            maxHeight: product.colors && product.colors.length > 0 
              ? (deviceType === 'tablet' ? '2.75rem' : '2.5rem')
              : (deviceType === 'tablet' ? '4rem' : '3.75rem')
          }}>
            {product.description}
          </p>
        </div>
        
        {/* Color Options - Show container for colors, or empty space for alignment */}
        {product.colors && product.colors.length > 0 ? (
          <div className={`${deviceType === 'tablet' ? 'h-10' : 'h-8'} mb-1 flex items-center`}>
            <div className={`flex flex-wrap ${deviceType === 'tablet' ? 'gap-2.5' : 'gap-2'}`}>
              {product.colors.map((color) => (
                <button
                  key={color.id}
                  onClick={(e) => handleColorSelect(color, e)}
                  className={`${
                    deviceType === 'tablet' ? 'w-7 h-7' : 'w-6 h-6'
                  } rounded-full border-2 transition-all duration-200 ${
                    selectedColor?.id === color.id 
                      ? 'border-gray-800 scale-110 shadow-md' 
                      : 'border-gray-300 hover:border-gray-500'
                  }`}
                  style={{ backgroundColor: color.hex }}
                  title={color.name}
                />
              ))}
            </div>
          </div>
        ) : (
          <div className={`${deviceType === 'tablet' ? 'h-3' : 'h-2'} mb-1`}></div>
        )}
        
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            {product.originalPrice && (
              <span className={`text-sm line-through ${
                deviceType === 'mobile' ? 'text-gray-400' : 'text-gray-500'
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
              deviceType === 'mobile' ? 'text-gray-300' : 'text-gray-400'
            }`}>
              {product.rating} ({product.reviews})
            </span>
          </div>
        </div>
      </div>
      
      <button 
        onClick={async (e) => {
          e.stopPropagation();
          // If no color is selected and colors are available, select the highest quantity color
          const productToAdd = { 
            ...product, 
            selectedColor: selectedColor || (product.colors && product.colors.length > 0 ? product.colors[0] : null)
          };
          await onAddToCart(productToAdd);
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