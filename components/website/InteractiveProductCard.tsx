'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Product, ProductColor } from './shared/types';
import { useCart } from '../../lib/contexts/CartContext';
import { useUserProfile } from '../../lib/hooks/useUserProfile';

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
  
  // Mobile-specific states
  const [showQuantityModal, setShowQuantityModal] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [quantity, setQuantity] = useState('1');
  const [note, setNote] = useState('');
  
  // Get cart functions for direct access
  const { addToCart: directAddToCart } = useCart();
  
  // Get user profile to check role
  const { profile } = useUserProfile();
  
  // Determine which price to display based on user role
  const getDisplayPrice = () => {
    if (profile?.role === 'جملة' && product.wholesale_price) {
      return product.wholesale_price;
    }
    return product.price;
  };
  
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
        
        {/* Color Options - Horizontal Scroll for colors */}
        {product.colors && product.colors.length > 0 ? (
          <div className={`${deviceType === 'tablet' ? 'h-10' : 'h-8'} mb-1 flex items-center`}>
            <div className={`flex overflow-x-auto scrollbar-hide ${deviceType === 'tablet' ? 'gap-2.5' : 'gap-2'} pb-1`}>
              {product.colors.map((color) => (
                <button
                  key={color.id}
                  onClick={(e) => handleColorSelect(color, e)}
                  className={`${
                    deviceType === 'tablet' ? 'w-7 h-7' : 'w-6 h-6'
                  } rounded-full border-2 transition-all duration-200 flex-shrink-0 ${
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
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              {product.originalPrice && (
                <span className="text-sm line-through text-gray-500">
                  {product.originalPrice} ريال
                </span>
              )}
              <span className="text-lg font-bold" style={{color: '#5D1F1F'}}>
                {getDisplayPrice()} ريال
              </span>
            </div>
            {profile?.role === 'جملة' && product.wholesale_price && (
              <span className="text-xs text-blue-600 font-medium">سعر الجملة</span>
            )}
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
      
      {/* Desktop/Tablet Button */}
      {deviceType !== 'mobile' && (
        <button 
          onClick={async (e) => {
            e.stopPropagation();
            const productToAdd = { 
              ...product, 
              selectedColor: selectedColor || (product.colors && product.colors.length > 0 ? product.colors[0] : null),
              price: getDisplayPrice() // Use the display price based on user role
            };
            await onAddToCart(productToAdd);
          }}
          className={`w-full mt-3 rounded-lg font-medium transition-colors text-white px-4 py-2 text-sm`}
          style={{backgroundColor: '#5D1F1F'}}
          onMouseEnter={(e) => {
            (e.target as HTMLButtonElement).style.backgroundColor = '#4A1616';
          }}
          onMouseLeave={(e) => {
            (e.target as HTMLButtonElement).style.backgroundColor = '#5D1F1F';
          }}
        >
          أضف للسلة
        </button>
      )}
      
      {/* Mobile Buttons */}
      {deviceType === 'mobile' && (
        <div className="flex gap-1 mt-3">
          {/* Add Button (80% width) */}
          <button 
            onClick={(e) => {
              e.stopPropagation();
              setShowQuantityModal(true);
            }}
            className="flex-[4] rounded-lg font-medium transition-colors text-white p-1.5 text-xs"
            style={{backgroundColor: '#5D1F1F'}}
            onMouseEnter={(e) => {
              (e.target as HTMLButtonElement).style.backgroundColor = '#4A1616';
            }}
            onMouseLeave={(e) => {
              (e.target as HTMLButtonElement).style.backgroundColor = '#5D1F1F';
            }}
          >
            إضافة
          </button>
          
          {/* Note Button (20% width) with gray color like in the image */}
          <button 
            onClick={(e) => {
              e.stopPropagation();
              setShowNoteModal(true);
            }}
            className="flex-1 rounded-lg font-medium transition-colors p-1.5"
            style={{backgroundColor: '#D1D5DB', color: '#374151'}}
            onMouseEnter={(e) => {
              (e.target as HTMLButtonElement).style.backgroundColor = '#9CA3AF';
            }}
            onMouseLeave={(e) => {
              (e.target as HTMLButtonElement).style.backgroundColor = '#D1D5DB';
            }}
            title="إضافة ملاحظة"
          >
            <svg className="w-3 h-3 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
        </div>
      )}
      
      {/* Quantity Modal */}
      {showQuantityModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
             onClick={(e) => {
               if (e.target === e.currentTarget) {
                 setShowQuantityModal(false);
               }
             }}>
          <div className="bg-white rounded-xl p-6 w-full max-w-sm mx-4">
            <h3 className="text-lg font-bold text-center mb-6 text-gray-800">تحديد الكمية</h3>
            
            <div className="flex items-center justify-center gap-4 mb-6">
              <button 
                onClick={() => {
                  const newValue = Math.max(1, parseInt(quantity) - 1).toString();
                  setQuantity(newValue);
                }}
                className="w-12 h-12 bg-gray-200 hover:bg-gray-300 rounded-full flex items-center justify-center text-xl font-bold transition-colors"
              >
                -
              </button>
              
              <input 
                type="text" 
                value={quantity}
                onChange={(e) => {
                  const value = e.target.value.replace(/[^0-9]/g, '');
                  if (value === '' || parseInt(value) >= 1) {
                    setQuantity(value || '1');
                  }
                }}
                className="w-20 h-12 text-center text-xl font-bold border-2 border-blue-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300"
                style={{ color: '#3B82F6' }}
                autoFocus
                onFocus={(e) => e.target.select()}
              />
              
              <button 
                onClick={() => {
                  const newValue = (parseInt(quantity) + 1).toString();
                  setQuantity(newValue);
                }}
                className="w-12 h-12 bg-gray-200 hover:bg-gray-300 rounded-full flex items-center justify-center text-xl font-bold transition-colors"
              >
                +
              </button>
            </div>
            
            <div className="flex gap-3">
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setShowQuantityModal(false);
                }}
                className="flex-1 py-3 bg-gray-300 hover:bg-gray-400 text-gray-700 rounded-lg font-medium transition-colors"
              >
                إلغاء
              </button>
              <button 
                onClick={async (e) => {
                  e.stopPropagation();
                  const productToAdd = { 
                    ...product, 
                    selectedColor: selectedColor || (product.colors && product.colors.length > 0 ? product.colors[0] : null)
                  };
                  
                  const selectedColorName = productToAdd.selectedColor?.name || undefined;
                  const quantityToAdd = parseInt(quantity);
                  const priceToUse = getDisplayPrice(); // Use the display price based on user role
                  
                  try {
                    console.log('🛒 Adding to cart:', quantityToAdd, 'units of product:', product.name, 'at price:', priceToUse);
                    // Use directAddToCart with the full quantity at once - much faster!
                    await directAddToCart(String(product.id), quantityToAdd, priceToUse, selectedColorName);
                    console.log('✅ Successfully added', quantityToAdd, 'units to cart');
                  } catch (error) {
                    console.error('❌ Error adding to cart:', error);
                  }
                  
                  setShowQuantityModal(false);
                  setQuantity('1');
                }}
                className="flex-1 py-3 text-white rounded-lg font-medium transition-colors"
                style={{backgroundColor: '#5D1F1F'}}
                onMouseEnter={(e) => {
                  (e.target as HTMLButtonElement).style.backgroundColor = '#4A1616';
                }}
                onMouseLeave={(e) => {
                  (e.target as HTMLButtonElement).style.backgroundColor = '#5D1F1F';
                }}
              >
                إضافة للطلب
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Note Modal */}
      {showNoteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
             onClick={(e) => {
               if (e.target === e.currentTarget) {
                 setShowNoteModal(false);
               }
             }}>
          <div className="bg-white rounded-xl p-6 w-full max-w-sm mx-4">
            <h3 className="text-lg font-bold text-center mb-6 text-gray-800">إضافة ملاحظة</h3>
            
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="أدخل ملاحظتك هنا..."
              className="w-full h-32 p-4 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-500 resize-none text-right"
              style={{ fontFamily: 'Cairo, sans-serif' }}
            />
            
            <div className="flex gap-3 mt-4">
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setShowNoteModal(false);
                }}
                className="flex-1 py-3 bg-gray-300 hover:bg-gray-400 text-gray-700 rounded-lg font-medium transition-colors"
              >
                إلغاء
              </button>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  // Here you would save the note with the product
                  console.log('Note saved:', note, 'for product:', product.name);
                  setShowNoteModal(false);
                  setNote('');
                }}
                className="flex-1 py-3 text-white rounded-lg font-medium transition-colors"
                style={{backgroundColor: '#5D1F1F'}}
                onMouseEnter={(e) => {
                  (e.target as HTMLButtonElement).style.backgroundColor = '#4A1616';
                }}
                onMouseLeave={(e) => {
                  (e.target as HTMLButtonElement).style.backgroundColor = '#5D1F1F';
                }}
              >
                حفظ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}