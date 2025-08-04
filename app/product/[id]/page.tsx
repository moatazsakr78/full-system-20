'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { detectDeviceClient, DeviceInfo } from '../../../lib/device-detection';
import { useOptimisticCart } from '../../../lib/optimistic-ui';
import { UserInfo, Product } from '../../../components/website/shared/types';
import { supabase } from '../../lib/supabase/client';

interface DatabaseProduct {
  id: string;
  name: string;
  name_en?: string | null;
  description?: string | null;
  description_en?: string | null;
  barcode?: string | null;
  price: number;
  cost_price: number;
  category_id?: string | null;
  video_url?: string | null;
  is_active?: boolean | null;
  created_at?: string | null;
  updated_at?: string | null;
  product_code?: string | null;
  wholesale_price?: number | null;
  price1?: number | null;
  price2?: number | null;
  price3?: number | null;
  price4?: number | null;
  main_image_url?: string | null;
  sub_image_url?: string | null;
  barcodes?: string[] | null;
  unit?: string | null;
  stock?: number | null;
  min_stock?: number | null;
  max_stock?: number | null;
  location?: string | null;
  status?: string | null;
  warehouse?: string | null;
  branch?: string | null;
  tax_price?: number | null;
  rating?: number | null;
  rating_count?: number | null;
  discount_percentage?: number | null;
  discount_amount?: number | null;
  discount_start_date?: string | null;
  discount_end_date?: string | null;
  category?: {
    id: string;
    name: string;
    name_en?: string | null;
  } | null;
}

interface ProductDetail extends Product {
  gallery: string[];
  specifications: { [key: string]: string };
  colors: { name: string; value: string; available: boolean }[];
  sizes: { name: string; available: boolean }[];
  detailedDescription: string;
}

// Function to get sub-images for a product from database or fallback
const getProductSubImages = async (productId: string, productName: string = '', videoUrl: string | null = null): Promise<string[]> => {
  try {
    // First priority: Check if sub-images are stored in video_url field (admin system)
    if (videoUrl) {
      try {
        const additionalImages = JSON.parse(videoUrl);
        if (Array.isArray(additionalImages) && additionalImages.length > 0) {
          console.log(`Loaded ${additionalImages.length} admin sub-images for product ${productName}`);
          return additionalImages;
        }
      } catch (parseError) {
        console.error('Error parsing video_url for sub-images:', parseError);
      }
    }

    // Second priority: Check product_images table
    const { data: productImages, error } = await supabase
      .from('product_images')
      .select('image_url')
      .eq('product_id', productId)
      .order('sort_order');

    if (!error && productImages && productImages.length > 0) {
      console.log(`Loaded ${productImages.length} database sub-images for product ${productName}`);
      return productImages.map(img => img.image_url);
    }

    // Third priority: Use fallback system
    console.log(`Using fallback sub-images for product ${productName}`);
    return getProductSubImagesFallback(productId, productName);
  } catch (err) {
    console.error('Error fetching product images:', err);
    return getProductSubImagesFallback(productId, productName);
  }
};

// Utility function to populate product_images table (for testing/setup)
const populateProductImages = async (productId: string, imageUrls: string[]) => {
  try {
    // First, delete existing images for this product
    await supabase
      .from('product_images')
      .delete()
      .eq('product_id', productId);

    // Insert new images
    const imagesToInsert = imageUrls.map((url, index) => ({
      product_id: productId,
      image_url: url,
      alt_text: `Product Image ${index + 1}`,
      sort_order: index + 1
    }));

    const { error } = await supabase
      .from('product_images')
      .insert(imagesToInsert);

    if (error) {
      console.error('Error inserting product images:', error);
    } else {
      console.log(`Successfully added ${imageUrls.length} images for product ${productId}`);
    }
  } catch (err) {
    console.error('Error in populateProductImages:', err);
  }
};

// Product-specific sub-images mapping
const getProductSpecificSubImages = (productId: string, productName: string): string[] | null => {
  // This function can be customized to assign specific sub-images to specific products
  // You can map by product ID, name, or any other criteria
  
  const productMappings: Record<string, string[]> = {
    // Example mappings - you can customize these
    '3f2d97c6-c4b7-491d-8ee3-55f03dbf13c9': ['/sub-images/1.png', '/sub-images/2.png', '/sub-images/3.png', '/sub-images/4.png'],
    '769bff92-57eb-45bd-bb59-6cef56a2fba0': ['/sub-images/5.png', '/sub-images/6.png', '/sub-images/7.png', '/sub-images/8.png'],
    '5c0b1b90-2e6d-425f-972d-aafae451f4e2': ['/sub-images/9.png', '/sub-images/10.png', '/sub-images/11.png', '/sub-images/12.png'],
  };

  // Check if we have a specific mapping for this product ID
  if (productMappings[productId]) {
    return productMappings[productId];
  }

  // Map by product name patterns - more comprehensive coverage
  if (productName.includes('زجاجه') || productName.includes('لابوبو')) {
    return ['/sub-images/13.png', '/sub-images/14.png', '/sub-images/15.png', '/sub-images/16.png'];
  }
  
  if (productName.includes('دابل فيس')) {
    return ['/sub-images/17.png', '/sub-images/18.png', '/sub-images/19.png', '/sub-images/20.png'];
  }

  if (productName.includes('باسكت') || productName.includes('ألعاب')) {
    return ['/sub-images/21.png', '/sub-images/22.png', '/sub-images/23.png', '/sub-images/24.png'];
  }

  // Additional pattern mappings for common product types
  if (productName.includes('ورق') || productName.includes('زبده')) {
    return ['/sub-images/25.png', '/sub-images/1.png', '/sub-images/2.png', '/sub-images/3.png'];
  }

  if (productName.includes('فاست') || productName.includes('بوش')) {
    return ['/sub-images/4.png', '/sub-images/5.png', '/sub-images/6.png', '/sub-images/7.png'];
  }

  if (productName.includes('طقم') || productName.includes('حمام')) {
    return ['/sub-images/8.png', '/sub-images/9.png', '/sub-images/10.png', '/sub-images/11.png'];
  }

  if (productName.includes('مج') || productName.includes('تاج')) {
    return ['/sub-images/12.png', '/sub-images/13.png', '/sub-images/14.png', '/sub-images/15.png'];
  }

  return null; // Will fall back to deterministic assignment
};

// Fallback system for assigning sub-images to products
const getProductSubImagesFallback = (productId: string, productName: string = ''): string[] => {
  // First try to get product-specific sub-images
  const specificImages = getProductSpecificSubImages(productId, productName);
  if (specificImages) {
    return specificImages;
  }

  // ALWAYS provide sub-images using deterministic assignment for ANY product
  const images: string[] = [];
  const totalSubImages = 27; // We now have 27 sub-images (1-27)
  
  // Create a more robust hash from the product ID
  let hash = 0;
  for (let i = 0; i < productId.length; i++) {
    const char = productId.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  
  // Ensure positive number and get starting index
  const startIndex = Math.abs(hash) % totalSubImages;
  
  // Always return exactly 5 different sub-images for every product
  for (let i = 0; i < 5; i++) {
    const imageNumber = ((startIndex + i) % totalSubImages) + 1;
    images.push(`/sub-images/${imageNumber}.png`);
  }
  
  console.log(`Assigned sub-images for product ${productName} (${productId}):`, images);
  return images;
};

// منتجات مقترحة
const suggestedProducts: Product[] = [
  {
    id: 2,
    name: 'ماوس لاسلكي من Apple',
    description: 'ماوس أنيق وعملي للاستخدام اليومي',
    price: 299,
    originalPrice: 349,
    image: 'https://images.unsplash.com/photo-1527814050087-3793815479db?w=300&h=300&fit=crop',
    category: 'إكسسوارات',
    rating: 4.5,
    reviews: 89,
    isOnSale: true,
    discount: 15
  },
  {
    id: 3,
    name: 'لوحة مفاتيح مكانيكية',
    description: 'لوحة مفاتيح احترافية للكتابة والألعاب',
    price: 459,
    originalPrice: 529,
    image: 'https://images.unsplash.com/photo-1541140532154-b024d705b90a?w=300&h=300&fit=crop',
    category: 'إكسسوارات',
    rating: 4.7,
    reviews: 124,
    isOnSale: true,
    discount: 13
  },
  {
    id: 4,
    name: 'سماعات بلوتوث AirPods Pro',
    description: 'سماعات لاسلكية بتقنية إلغاء الضوضاء',
    price: 899,
    originalPrice: 999,
    image: 'https://images.unsplash.com/photo-1606220945770-b5b6c2c55bf1?w=300&h=300&fit=crop',
    category: 'إلكترونيات',
    rating: 4.9,
    reviews: 203,
    isOnSale: true,
    discount: 10
  },
  {
    id: 5,
    name: 'شاحن لاسلكي سريع',
    description: 'شاحن لاسلكي سريع لجميع الأجهزة المتوافقة',
    price: 199,
    originalPrice: 249,
    image: 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=300&h=300&fit=crop',
    category: 'إكسسوارات',
    rating: 4.3,
    reviews: 67,
    isOnSale: true,
    discount: 20
  }
];

interface ProductDetailPageProps {
  params: { id: string };
}

export default function ProductDetailPage({ params }: ProductDetailPageProps) {
  const router = useRouter();
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo>({
    type: 'desktop',
    userAgent: '',
    isMobile: false,
    isTablet: false,
    isDesktop: true
  });
  
  const [userInfo, setUserInfo] = useState<UserInfo>({
    id: '1',
    name: 'عميل تجريبي',
    email: 'customer@example.com',
    cart: []
  });

  const [productDetails, setProductDetails] = useState<ProductDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { cart, addToCart, removeFromCart, updateQuantity, clearCart } = useOptimisticCart(
    userInfo.cart || []
  );

  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedColor, setSelectedColor] = useState<{ name: string; value: string; available: boolean } | null>(null);
  const [selectedSize, setSelectedSize] = useState<{ name: string; available: boolean } | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [isCompactHeaderVisible, setIsCompactHeaderVisible] = useState(false);
  const [currentSuggestedIndex, setCurrentSuggestedIndex] = useState(0);

  // Fetch product data
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const { data: product, error: productError } = await supabase
          .from('products')
          .select(`
            *,
            category:categories(
              id,
              name,
              name_en
            )
          `)
          .eq('id', params.id)
          .eq('is_active', true)
          .single();

        if (productError) throw productError;

        if (!product) {
          setError('المنتج غير موجود');
          return;
        }

        // Get sub-images for this product
        const subImages = await getProductSubImages(product.id, product.name, product.video_url);
        
        // Build gallery array
        const gallery: string[] = [];
        
        // Add main image first
        if (product.main_image_url) {
          gallery.push(product.main_image_url);
        }
        
        // Add sub-images
        gallery.push(...subImages);
        
        // Add sub_image_url if it exists and is different from main
        if ((product as any).sub_image_url && (product as any).sub_image_url !== product.main_image_url) {
          gallery.push((product as any).sub_image_url);
        }

        // Calculate discount information
        const now = new Date();
        const discountStart = (product as any).discount_start_date ? new Date((product as any).discount_start_date) : null;
        const discountEnd = (product as any).discount_end_date ? new Date((product as any).discount_end_date) : null;
        
        const discountPercentage = (product as any).discount_percentage || 0;
        const discountAmount = (product as any).discount_amount || 0;
        
        const isDiscountActive = (
          (discountPercentage > 0 || discountAmount > 0) &&
          (!discountStart || now >= discountStart) &&
          (!discountEnd || now <= discountEnd)
        );
        
        let finalPrice = product.price;
        let calculatedDiscountPercentage = 0;
        
        if (isDiscountActive && discountPercentage > 0) {
          finalPrice = product.price * (1 - (discountPercentage / 100));
          calculatedDiscountPercentage = discountPercentage;
        } else if (isDiscountActive && discountAmount > 0) {
          finalPrice = Math.max(0, product.price - discountAmount);
          calculatedDiscountPercentage = Math.round((discountAmount / product.price) * 100);
        }

        // Create product detail object
        const productDetail: ProductDetail = {
          id: parseInt(product.id.split('-')[0], 16) % 1000, // Convert UUID to number for compatibility
          name: product.name,
          description: product.description || '',
          detailedDescription: product.description || 'لا يوجد وصف تفصيلي متاح حالياً.',
          price: finalPrice,
          originalPrice: isDiscountActive ? product.price : undefined,
          image: product.main_image_url || '/placeholder-image.jpg',
          gallery: gallery,
          category: product.category?.name || 'غير محدد',
          rating: (product as any).rating || 0,
          reviews: (product as any).rating_count || 0,
          isOnSale: isDiscountActive,
          discount: calculatedDiscountPercentage,
          specifications: {
            'الكود': product.product_code || 'غير محدد',
            'الباركود': product.barcode || 'غير محدد',
            'الوحدة': product.unit || 'قطعة',
            'المخزون': product.stock?.toString() || '0',
            'الحد الأدنى للمخزون': product.min_stock?.toString() || '0',
            'سعر الجملة': product.wholesale_price ? `${product.wholesale_price} ريال` : 'غير محدد'
          },
          colors: [
            { name: 'أساسي', value: '#3B82F6', available: true }
          ],
          sizes: [
            { name: 'قياس عادي', available: true }
          ]
        };

        setProductDetails(productDetail);
        
        // Set initial selections
        setSelectedColor(productDetail.colors[0]);
        setSelectedSize(productDetail.sizes[0]);

      } catch (err) {
        console.error('Error fetching product:', err);
        setError(err instanceof Error ? err.message : 'فشل في تحميل المنتج');
      } finally {
        setIsLoading(false);
      }
    };

    if (params.id) {
      fetchProduct();
    }
  }, [params.id]);

  useEffect(() => {
    const detected = detectDeviceClient();
    setDeviceInfo(detected);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setIsCompactHeaderVisible(window.scrollY > 100);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleAddToCart = () => {
    if (!productDetails || !selectedColor || !selectedSize) return;
    
    const productToAdd = {
      ...productDetails,
      selectedColor: selectedColor.name,
      selectedSize: selectedSize.name,
      quantity
    };
    addToCart(productToAdd);
  };

  const updatedUserInfo = {
    ...userInfo,
    cart
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen text-gray-800 flex items-center justify-center" style={{backgroundColor: '#c0c0c0'}}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-lg">جاري تحميل المنتج...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error || !productDetails) {
    return (
      <div className="min-h-screen text-gray-800 flex items-center justify-center" style={{backgroundColor: '#c0c0c0'}}>
        <div className="text-center">
          <div className="text-red-600 text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold mb-2">خطأ</h1>
          <p className="text-lg mb-4">{error || 'المنتج غير موجود'}</p>
          <button 
            onClick={() => router.back()}
            className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg transition-colors"
          >
            العودة
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-gray-800" style={{backgroundColor: '#c0c0c0'}}>
      {/* Hide system blue header */}
      <style jsx global>{`
        body {
          margin-top: 0 !important;
          padding-top: 0 !important;
        }
        html {
          margin-top: 0 !important;
          padding-top: 0 !important;
        }
        iframe,
        .system-header,
        [class*="system"],
        [class*="navigation"],
        [style*="background: #374151"],
        [style*="background-color: #374151"] {
          display: none !important;
        }
        /* Hide scrollbar but keep functionality */
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        /* Custom border width */
        .border-3 {
          border-width: 3px;
        }
      `}</style>

      {/* Compact Sticky Header */}
      {isCompactHeaderVisible && (
        <header className="fixed top-0 left-0 right-0 border-b border-gray-700 py-2 z-40 transition-all duration-300" style={{backgroundColor: '#661a1a'}}>
          <div className="max-w-[90%] mx-auto px-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src="/assets/logo/El Farouk Group2.png" alt="الفاروق" className="h-10 w-10 object-contain" />
              <h1 className="text-base font-bold text-white">El Farouk Group</h1>
            </div>
            
            <div className="flex items-center gap-4">
              <button 
                onClick={() => router.back()}
                className="text-gray-300 hover:text-white transition-colors text-sm flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                العودة
              </button>
              
              <button className="relative p-2 hover:bg-red-700 rounded-lg transition-colors">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-1.5 6H19" />
                </svg>
                {(updatedUserInfo.cart?.length || 0) > 0 && (
                  <span className="absolute -top-1 -right-1 bg-white text-red-600 text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                    {updatedUserInfo.cart?.length || 0}
                  </span>
                )}
              </button>
            </div>
          </div>
        </header>
      )}

      {/* Main Header */}
      <header className="border-b border-gray-700 py-0 relative z-40" style={{backgroundColor: '#661a1a'}}>
        <div className="max-w-[80%] mx-auto px-4 flex items-center justify-between min-h-[80px]">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-3">
              <img src="/assets/logo/El Farouk Group2.png" alt="الفاروق" className="h-20 w-20 object-contain" />
              <h1 className="text-xl font-bold text-white">El Farouk Group</h1>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <button 
              onClick={() => router.back()}
              className="text-gray-300 hover:text-red-400 transition-colors font-medium flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              العودة للمتجر
            </button>
          </div>
          
          <div className="flex items-center gap-4">
            {updatedUserInfo.name && (
              <span className="text-sm text-gray-300">مرحباً، {updatedUserInfo.name}</span>
            )}
            <button className="flex items-center gap-2 bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg transition-colors">
              <span>السلة ({updatedUserInfo.cart?.length || 0})</span>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-1.5 6H19" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Product Details Content */}
      <main className="ml-0 px-4 py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-gray-600 mb-6">
          <button onClick={() => router.push('/')} className="hover:text-red-600 transition-colors">الرئيسية</button>
          <span>›</span>
          <span className="text-gray-800">{productDetails.category}</span>
          <span>›</span>
          <span className="text-gray-800 font-medium">{productDetails.name}</span>
        </nav>

        {/* Product Main Section */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-12">
          {/* Main Product Image */}
          <div className="lg:col-span-6 space-y-4">
            {/* Main Image */}
            <div className="w-full max-w-3xl aspect-square bg-white rounded-lg overflow-hidden shadow-lg">
              <img 
                src={productDetails.gallery[selectedImage]} 
                alt={productDetails.name}
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* Product Info */}
          <div className="lg:col-span-4 space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">{productDetails.name}</h1>
              <p className="text-gray-600">{productDetails.description}</p>
            </div>

            {/* Rating and Reviews */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <span key={i} className={i < Math.floor(productDetails.rating || 0) ? 'text-yellow-400' : 'text-gray-300'}>
                    ⭐
                  </span>
                ))}
                <span className="text-sm text-gray-600 mr-2">
                  {productDetails.rating} ({productDetails.reviews} تقييم)
                </span>
              </div>
            </div>

            {/* Price */}
            <div className="flex items-center gap-4">
              <span className="text-3xl font-bold text-red-600">{productDetails.price} ريال</span>
              {productDetails.originalPrice && (
                <span className="text-xl text-gray-500 line-through">{productDetails.originalPrice} ريال</span>
              )}
              {productDetails.isOnSale && (
                <span className="bg-red-100 text-red-600 px-3 py-1 rounded-full text-sm font-bold">
                  خصم {productDetails.discount}%
                </span>
              )}
            </div>

            {/* Colors */}
            {productDetails.colors.length > 0 && (
              <div>
                <h3 className="font-semibold text-gray-800 mb-3">اللون المتاح:</h3>
                <div className="flex gap-3">
                  {productDetails.colors.map((color) => (
                    <button
                      key={color.name}
                      disabled={!color.available}
                      onClick={() => setSelectedColor(color)}
                      className={`relative w-12 h-12 rounded-full border-2 transition-all ${
                        selectedColor?.name === color.name
                          ? 'border-red-500 shadow-lg scale-110'
                          : color.available
                          ? 'border-gray-300 hover:border-red-300'
                          : 'border-gray-200 opacity-50 cursor-not-allowed'
                      }`}
                      style={{ backgroundColor: color.value }}
                      title={color.name}
                    >
                      {selectedColor?.name === color.name && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <svg className="w-6 h-6 text-white drop-shadow-lg" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                      {!color.available && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-8 h-0.5 bg-gray-500 rotate-45"></div>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
                <p className="text-sm text-gray-600 mt-2">اللون المحدد: {selectedColor?.name}</p>
              </div>
            )}

            {/* Sizes */}
            {productDetails.sizes.length > 0 && (
              <div>
                <h3 className="font-semibold text-gray-800 mb-3">الحجم:</h3>
                <div className="flex gap-3 flex-wrap">
                  {productDetails.sizes.map((size) => (
                    <button
                      key={size.name}
                      disabled={!size.available}
                      onClick={() => setSelectedSize(size)}
                      className={`px-4 py-2 border rounded-lg transition-all ${
                        selectedSize?.name === size.name
                          ? 'border-red-500 bg-red-50 text-red-600 font-semibold'
                          : size.available
                          ? 'border-gray-300 hover:border-red-300 bg-white'
                          : 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      {size.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity */}
            <div>
              <h3 className="font-semibold text-gray-800 mb-3">الكمية:</h3>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-10 h-10 flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                  </svg>
                </button>
                <span className="text-xl font-semibold px-4">{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-10 h-10 flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Add to Cart Buttons */}
            <div className="flex gap-4 pt-4">
              <button
                onClick={handleAddToCart}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-1.5 6H19" />
                </svg>
                أضف إلى السلة
              </button>
              <button className="px-6 py-3 border border-red-600 text-red-600 hover:bg-red-50 rounded-lg font-semibold transition-colors flex items-center justify-center">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </button>
            </div>
          </div>

          {/* Product Thumbnails Gallery */}
          <div className="lg:col-span-2 space-y-3">
            <div className="h-full min-h-[600px] max-h-[800px] overflow-y-auto scrollbar-hide space-y-3 mr-5">
              {productDetails.gallery.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImage(index)}
                  className={`w-full aspect-square rounded-lg overflow-hidden transition-all duration-300 hover:scale-105 ${
                    selectedImage === index 
                      ? 'ring-2 ring-red-500 shadow-lg' 
                      : 'hover:shadow-md'
                  }`}
                >
                  <img 
                    src={image} 
                    alt={`${productDetails.name} ${index + 1}`}
                    className="w-full h-full object-cover hover:brightness-110 transition-all duration-300"
                  />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Product Details Tabs */}
        <div className="mx-16">
          <div className="bg-white rounded-lg p-6 shadow-lg mb-12">
          <div className="border-b border-gray-200 mb-6">
            <nav className="flex gap-8">
              <button className="pb-4 border-b-2 border-red-500 text-red-600 font-semibold">الوصف التفصيلي</button>
              <button className="pb-4 text-gray-600 hover:text-red-600 transition-colors">المواصفات</button>
              <button className="pb-4 text-gray-600 hover:text-red-600 transition-colors">آراء العملاء</button>
            </nav>
          </div>
          
          <div className="prose max-w-none text-gray-700 leading-relaxed">
            <p>{productDetails.detailedDescription}</p>
            
            <div className="mt-6">
              <h4 className="font-semibold text-gray-800 mb-3">المواصفات الفنية:</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(productDetails.specifications).map(([key, value]) => (
                  <div key={key} className="flex justify-between py-2 border-b border-gray-100">
                    <span className="font-medium text-gray-600">{key}:</span>
                    <span className="text-gray-800">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        </div>

        {/* Suggested Products */}
        <section>
          <div className="mx-16">
            <h3 className="text-2xl font-bold mb-6 text-red-700">منتجات مقترحة</h3>
          </div>
          <div className="relative">
            {/* Navigation Arrows */}
            <button 
              onClick={() => setCurrentSuggestedIndex(Math.max(0, currentSuggestedIndex - 4))}
              className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-12 h-12 bg-white rounded-full shadow-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors"
              disabled={currentSuggestedIndex === 0}
            >
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            
            <button 
              onClick={() => setCurrentSuggestedIndex(Math.min(suggestedProducts.length - 4, currentSuggestedIndex + 4))}
              className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-12 h-12 bg-white rounded-full shadow-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors"
              disabled={currentSuggestedIndex >= suggestedProducts.length - 4}
            >
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>

            {/* Products Grid with Margins for Arrows */}
            <div className="mx-16">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                {suggestedProducts.slice(currentSuggestedIndex, currentSuggestedIndex + 4).map((product) => (
                  <div key={product.id} className="bg-white rounded-lg p-4 hover:bg-gray-100 transition-colors border border-gray-300 shadow-md group">
                    <div className="relative mb-4">
                      <img 
                        src={product.image} 
                        alt={product.name} 
                        className="w-full h-48 object-cover rounded-lg"
                      />
                      {product.isOnSale && (
                        <span className="absolute top-2 right-2 bg-red-600 text-white px-2 py-1 rounded-full text-xs font-bold">
                          -{product.discount}%
                        </span>
                      )}
                    </div>
                    <h4 className="font-semibold mb-2 text-gray-800 truncate group-hover:text-red-600 transition-colors">{product.name}</h4>
                    <p className="text-gray-600 text-sm mb-3 line-clamp-2">{product.description}</p>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        {product.originalPrice && (
                          <span className="text-sm text-gray-500 line-through">{product.originalPrice} ريال</span>
                        )}
                        <span className="text-lg font-bold text-red-400">{product.price} ريال</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <span className="text-yellow-400">⭐</span>
                        <span className="text-sm text-gray-400">{product.rating} ({product.reviews})</span>
                      </div>
                      <button 
                        onClick={() => addToCart(product)}
                        className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                      >
                        أضف للسلة
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="py-8 mt-12" style={{backgroundColor: '#4D4D4D', borderTop: '1px solid #666'}}>
        <div className="max-w-[80%] mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <img src="/assets/logo/El Farouk Group2.png" alt="الفاروق" className="h-8 w-8 object-contain" />
                <h5 className="font-bold text-lg text-red-400">متجر الفاروق</h5>
              </div>
              <p className="text-gray-400">متجرك المتكامل للحصول على أفضل المنتجات بأسعار مميزة وجودة عالية</p>
            </div>
            <div>
              <h6 className="font-semibold mb-3">روابط سريعة</h6>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-red-400 transition-colors">الرئيسية</a></li>
                <li><a href="#" className="hover:text-red-400 transition-colors">المنتجات</a></li>
                <li><a href="#" className="hover:text-red-400 transition-colors">من نحن</a></li>
                <li><a href="#" className="hover:text-red-400 transition-colors">اتصل بنا</a></li>
              </ul>
            </div>
            <div>
              <h6 className="font-semibold mb-3">خدمة العملاء</h6>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-red-400 transition-colors">المساعدة</a></li>
                <li><a href="#" className="hover:text-red-400 transition-colors">سياسة الإرجاع</a></li>
                <li><a href="#" className="hover:text-red-400 transition-colors">الشحن والتوصيل</a></li>
                <li><a href="#" className="hover:text-red-400 transition-colors">الدفع</a></li>
              </ul>
            </div>
            <div>
              <h6 className="font-semibold mb-3">تواصل معنا</h6>
              <div className="space-y-2 text-gray-400">
                <p>📞 966+123456789</p>
                <p>✉️ info@elfarouk-store.com</p>
                <p>📍 الرياض، المملكة العربية السعودية</p>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}