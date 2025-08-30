'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Product, ProductColor } from './shared/types';

interface InteractiveProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => Promise<void>;
  deviceType: 'desktop' | 'tablet' | 'mobile';
  onProductClick?: (productId: string) => void;
}

export default function InteractiveProductCard({ 
  product, 
  onAddToCart,
  deviceType,
  onProductClick 
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

  // Handle touch/swipe events for tablets
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [hasMoved, setHasMoved] = useState(false);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
    setHasMoved(false);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
    setHasMoved(true);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    e.stopPropagation(); // Prevent navigation to product page
    
    if (deviceType !== 'tablet') return;

    // Get available images array based on selected color
    const availableImages = selectedColor && selectedColor.image_url
      ? [selectedColor.image_url, ...allImages.filter(img => img !== selectedColor.image_url)]
      : allImages;
    
    if (availableImages.length <= 1) return;

    // Handle swipe if there was movement
    if (touchStart && touchEnd && hasMoved) {
      const distance = touchStart - touchEnd;
      const isLeftSwipe = distance > 50;
      const isRightSwipe = distance < -50;

      if (isLeftSwipe) {
        // Swipe left - next image
        const nextIndex = (currentImageIndex + 1) % availableImages.length;
        setCurrentImageIndex(nextIndex);
        return;
      } else if (isRightSwipe) {
        // Swipe right - previous image
        const prevIndex = currentImageIndex === 0 ? availableImages.length - 1 : currentImageIndex - 1;
        setCurrentImageIndex(prevIndex);
        return;
      }
    }

    // Handle tap on sides if no swipe occurred
    if (!hasMoved && touchStart) {
      const imageContainer = imageRef.current;
      if (!imageContainer) return;

      const rect = imageContainer.getBoundingClientRect();
      const tapX = touchStart;
      const containerLeft = rect.left;
      const containerWidth = rect.width;
      const relativeX = tapX - containerLeft;

      // Divide image into three zones: left (40%), center (20%), right (40%)
      const leftZone = containerWidth * 0.4;
      const rightZone = containerWidth * 0.6;

      if (relativeX < leftZone) {
        // Tap on left side - previous image
        const prevIndex = currentImageIndex === 0 ? availableImages.length - 1 : currentImageIndex - 1;
        setCurrentImageIndex(prevIndex);
      } else if (relativeX > rightZone) {
        // Tap on right side - next image
        const nextIndex = (currentImageIndex + 1) % availableImages.length;
        setCurrentImageIndex(nextIndex);
      }
      // Center zone does nothing (allows for future functionality if needed)
    }
  };

  // Handle mouse movement over the image to cycle through images (for desktop and mobile)
  const handleImageMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (deviceType === 'tablet') return; // Disable mousemove for tablet
    
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

  // Reset to first image when mouse leaves (for desktop and mobile)
  const handleImageMouseLeave = () => {
    if (deviceType === 'tablet') return; // Disable mouseleave for tablet
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
          containerClass: 'bg-custom-gray rounded-lg p-3 hover:bg-gray-300 transition-colors border border-gray-300 shadow-md cursor-pointer group',
          imageClass: 'w-full h-40 object-cover rounded-lg scale-105',
          titleClass: 'font-semibold mb-2 text-sm text-gray-800 truncate transition-colors group-hover:text-[#5D1F1F]'
        };
    }
  };

  const classes = getResponsiveClasses();

  return (
    <div 
      className={`${classes.containerClass} flex flex-col`}
      data-device-type={deviceType}
      onClick={() => {
        if (onProductClick) {
          onProductClick(String(product.id));
        } else {
          router.push(`/product/${product.id}`);
        }
      }}
    >
      <div 
        ref={imageRef}
        className="relative mb-4" 
        onClick={(e) => {
          if (deviceType === 'tablet') {
            e.stopPropagation();
          }
        }}
        onMouseMove={handleImageMouseMove}
        onMouseLeave={handleImageMouseLeave}
        onTouchStart={deviceType === 'tablet' ? handleTouchStart : undefined}
        onTouchMove={deviceType === 'tablet' ? handleTouchMove : undefined}
        onTouchEnd={deviceType === 'tablet' ? handleTouchEnd : undefined}
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
      
      <div className="flex flex-col">
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
          <p className={`text-sm overflow-hidden text-gray-600`} style={{
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
              <span className="text-sm line-through text-gray-500">
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
            <span className="text-sm text-gray-400">
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