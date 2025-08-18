'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useProducts, Product as DatabaseProduct } from '../../app/lib/hooks/useProducts';
import { UserInfo, Product } from './shared/types';
import AuthButtons from '../../app/components/auth/AuthButtons';
import RightSidebar from '../../app/components/layout/RightSidebar';
import { useRightSidebar } from '../../app/lib/hooks/useRightSidebar';
import { useUserProfile } from '../../lib/hooks/useUserProfile';
import CategoryCarousel from './CategoryCarousel';
import FeaturedProductsCarousel from './FeaturedProductsCarousel';
import InteractiveProductCard from './InteractiveProductCard';
import ProductDetailsModal from '../../app/components/ProductDetailsModal';
import CartModal from '../../app/components/CartModal';
import { useCart } from '../../lib/contexts/CartContext';
import { useCartBadge } from '../../lib/hooks/useCartBadge';

interface DesktopHomeProps {
  userInfo: UserInfo;
  onCartUpdate: (cart: any[]) => void;
  onRemoveFromCart: (productId: string | number) => void;
  onUpdateQuantity: (productId: string | number, quantity: number) => void;
  onClearCart: () => void;
}

export default function DesktopHome({ 
  userInfo, 
  onCartUpdate, 
  onRemoveFromCart, 
  onUpdateQuantity, 
  onClearCart 
}: DesktopHomeProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('الكل');
  const [isCompactHeaderVisible, setIsCompactHeaderVisible] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [isCartModalOpen, setIsCartModalOpen] = useState(false);
  
  // Use right sidebar hook for the website menu
  const { isRightSidebarOpen, toggleRightSidebar, closeRightSidebar } = useRightSidebar();
  const [websiteProducts, setWebsiteProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  
  // Get user profile to check admin status
  const { isAdmin } = useUserProfile();
  
  // Get cart badge count and cart functions
  const { cartBadgeCount } = useCartBadge();
  const { addToCart } = useCart();
  
  // Handle adding products to cart
  const handleAddToCart = async (product: Product) => {
    try {
      console.log('🛒 Desktop: Adding product to cart:', product.name);
      const selectedColorName = product.selectedColor?.name || undefined;
      await addToCart(String(product.id), 1, product.price, selectedColorName);
      console.log('✅ Desktop: Product added successfully');
    } catch (error) {
      console.error('❌ Desktop: Error adding product to cart:', error);
    }
  };
  
  
  // Get real products from database
  const { products: databaseProducts, isLoading } = useProducts();

  // Convert database products to website format
  useEffect(() => {
    try {
      if (databaseProducts && databaseProducts.length > 0) {
        const convertedProducts: Product[] = databaseProducts
          .filter((dbProduct: DatabaseProduct) => !dbProduct.is_hidden) // Hide hidden products
          .map((dbProduct: DatabaseProduct) => ({
            id: dbProduct.id,
            name: dbProduct.name || 'منتج بدون اسم',
            description: dbProduct.description || '',
            price: dbProduct.finalPrice || dbProduct.price || 0,
            originalPrice: dbProduct.isDiscounted ? dbProduct.price : undefined,
            image: dbProduct.main_image_url || undefined,
            images: dbProduct.allImages || [],
            colors: dbProduct.colors || [],
            category: dbProduct.category?.name || 'عام',
            brand: 'El Farouk Group',
            stock: dbProduct.totalQuantity || 0,
            rating: dbProduct.rating || 0,
            reviews: dbProduct.rating_count || 0,
            isOnSale: dbProduct.isDiscounted || false,
            discount: dbProduct.isDiscounted && dbProduct.discount_percentage ? Math.round(dbProduct.discount_percentage) : undefined,
            tags: [],
            isFeatured: dbProduct.is_featured || false
          }));
        setWebsiteProducts(convertedProducts);
      }
    } catch (error) {
      console.error('Error converting database products:', error);
      setWebsiteProducts([]);
    }
  }, [databaseProducts]);

  // Fetch categories from database
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const { supabase } = await import('../../app/lib/supabase/client');
        const { data, error } = await supabase
          .from('categories')
          .select('*')
          .eq('is_active', true)
          .order('sort_order', { ascending: true });
        
        if (error) throw error;
        
        const convertedCategories = (data || []).map((cat: any) => ({
          id: cat.id,
          name: cat.name,
          description: cat.name,
          icon: '📦',
          image: cat.image_url || 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&h=300&fit=crop',
          productCount: 0 // We could calculate this if needed
        }));
        
        setCategories(convertedCategories);
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };
    
    fetchCategories();
  }, []);

  // Set client-side flag after component mounts
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Handle scroll for compact header
  useEffect(() => {
    if (!isClient) return;
    
    const handleScroll = () => {
      setIsCompactHeaderVisible(window.scrollY > 100);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isClient]);

  const filteredProducts = websiteProducts.filter(product => {
    const matchesSearch = searchQuery === '' || 
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (product.description && product.description.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesCategory = selectedCategory === 'الكل' || product.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  const featuredProducts = websiteProducts.filter(product => product.isFeatured || product.isOnSale);

  // Handle product click to show modal instead of navigation
  const handleProductClick = (productId: string) => {
    setSelectedProductId(productId);
    setIsProductModalOpen(true);
  };

  const handleCloseProductModal = () => {
    setIsProductModalOpen(false);
    setSelectedProductId('');
  };

  // Show loading state during hydration or while loading data
  if (!isClient || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{backgroundColor: '#c0c0c0'}}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4" style={{borderBottomColor: '#5D1F1F'}}></div>
          <p className="text-gray-600">جاري تحميل التطبيق...</p>
        </div>
      </div>
    );
  }

  return (
    <>
    {/* Right Sidebar for Website Menu */}
    <RightSidebar isOpen={isRightSidebarOpen} onClose={closeRightSidebar} />
    
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
        /* Hide any potential system headers */
        iframe,
        .system-header,
        [class*="system"],
        [class*="navigation"],
        [style*="background: #374151"],
        [style*="background-color: #374151"] {
          display: none !important;
        }
      `}</style>
      {/* Compact Sticky Header */}
      {isCompactHeaderVisible && (
        <header className="fixed top-0 left-0 right-0 border-b border-gray-700 py-2 z-50 transition-all duration-300" style={{backgroundColor: '#5d1f1f'}}>
          <div className="relative flex items-center min-h-[50px]">
            {/* Main Compact Content Container */}
            <div className="max-w-[90%] mx-auto px-4 flex items-center justify-between w-full min-h-[50px]">
              <div className="flex items-center gap-3">
                <img src="/assets/logo/El Farouk Group2.png" alt="الفاروق" className="h-10 w-10 object-contain" />
                <h1 className="text-base font-bold text-white">El Farouk Group</h1>
              </div>
            
            {/* Compact Search Bar */}
            <div className="flex-1 max-w-xs mx-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="ابحث عن المنتجات..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white border-0 rounded-full px-4 py-1.5 pr-8 text-sm text-gray-800 placeholder-gray-500 shadow-sm focus:outline-none focus:ring-1"
                  style={{"--tw-ring-color": "#5D1F1F"} as React.CSSProperties}
                  onFocus={(e) => {
                    e.target.style.boxShadow = '0 0 0 1px #5D1F1F';
                  }}
                  onBlur={(e) => {
                    e.target.style.boxShadow = 'none';
                  }}
                />
                <svg className="absolute right-3 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
            
            {/* Compact Navigation Links */}
            <nav className="hidden md:flex gap-4">
              <a href="#about" className="text-gray-300 hover:text-white transition-colors text-sm">عن المتجر</a>
              <a href="#offers" className="text-gray-300 hover:text-white transition-colors text-sm">العروض</a>
              <a href="#categories" className="text-gray-300 hover:text-white transition-colors text-sm">الفئات</a>
              <a href="#products" className="text-gray-300 hover:text-white transition-colors text-sm">المنتجات</a>
            </nav>
            
            {/* Compact Auth & Cart & Dashboard with better spacing */}
            <div className="flex items-center gap-4">
              <div className="mr-2">
                <AuthButtons compact />
              </div>
              
              
              <div className="ml-1">
                <button 
                  onClick={() => setIsCartModalOpen(true)}
                  className="relative p-2 rounded-lg transition-colors"
                  onMouseEnter={(e) => {
                    (e.target as HTMLButtonElement).style.backgroundColor = '#4A1616';
                  }}
                  onMouseLeave={(e) => {
                    (e.target as HTMLButtonElement).style.backgroundColor = 'transparent';
                  }}
                >
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-1.5 6H19" />
                  </svg>
                  {cartBadgeCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold" style={{color: '#5D1F1F'}}>
                      {cartBadgeCount}
                    </span>
                  )}
                </button>
              </div>
              </div>
            </div>
            
            {/* Compact Menu Button - Absolute Right Edge, Full Height */}
            <div className="absolute right-0 top-0 h-full">
              <button 
                className="h-full px-4 text-white bg-transparent flex items-center justify-center"
                onClick={toggleRightSidebar}
                title="القائمة"
              >
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>
        </header>
      )}

      {/* Main Desktop Header */}
      <header className="border-b border-gray-700 py-0 relative z-40" style={{backgroundColor: '#5d1f1f'}}>
        <div className="relative flex items-center min-h-[80px]">
          {/* Main Content Container */}
          <div className="max-w-[80%] mx-auto px-4 flex items-center justify-between min-h-[80px] w-full">
            <div className="flex items-center gap-8">
              <div className="flex items-center gap-3">
                <img src="/assets/logo/El Farouk Group2.png" alt="الفاروق" className="h-20 w-20 object-contain" />
                <h1 className="text-xl font-bold text-white">El Farouk Group</h1>
              </div>
            </div>
          
          {/* Search Bar in Header */}
          <div className="flex-1 max-w-md mx-8">
            <div className="relative">
              <input
                type="text"
                placeholder="ابحث عن المنتجات..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white border-0 rounded-full px-5 py-2.5 pr-12 text-gray-800 placeholder-gray-500 shadow-md focus:outline-none focus:ring-2 transition-all duration-300"
                style={{"--tw-ring-color": "#5D1F1F"} as React.CSSProperties}
                onFocus={(e) => {
                  e.target.style.boxShadow = '0 0 0 2px #5D1F1F';
                }}
                onBlur={(e) => {
                  e.target.style.boxShadow = 'none';
                }}
              />
              <svg className="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <nav className="flex gap-6">
              <a href="#products" className="text-gray-300 transition-colors font-medium hover:text-[#5D1F1F]">المنتجات</a>
              <a href="#categories" className="text-gray-300 transition-colors font-medium hover:text-[#5D1F1F]">الفئات</a>
              <a href="#offers" className="text-gray-300 transition-colors font-medium hover:text-[#5D1F1F]">العروض</a>
              <a href="#about" className="text-gray-300 transition-colors font-medium hover:text-[#5D1F1F]">عن المتجر</a>
            </nav>
          </div>
          
          <div className="flex items-center gap-6">
            {/* Authentication Buttons with margin */}
            <div className="mr-8">
              <AuthButtons />
            </div>
            
            
            {/* Cart Button pushed to the right */}
            <div className="ml-4">
              <button 
                onClick={() => setIsCartModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg transition-colors text-white"
                style={{backgroundColor: '#5D1F1F'}}
                onMouseEnter={(e) => {
                  (e.target as HTMLButtonElement).style.backgroundColor = '#4A1616';
                }}
                onMouseLeave={(e) => {
                  (e.target as HTMLButtonElement).style.backgroundColor = '#5D1F1F';
                }}
              >
                <span>السلة ({cartBadgeCount})</span>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-1.5 6H19" />
                </svg>
              </button>
            </div>
            </div>
          </div>
          
          {/* Menu Button - Absolute Right Edge, Full Height */}
          <div className="absolute right-0 top-0 h-full">
            <button 
              className="h-full px-6 text-white bg-transparent flex items-center justify-center"
              onClick={toggleRightSidebar}
              title="القائمة"
            >
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </header>


      {/* Desktop Main Content */}
      <main className="max-w-[80%] mx-auto px-4 py-8">

        {/* Featured Products */}
        <section className="mb-8">
          <h3 className="text-3xl font-bold mb-6 text-black">المنتجات المميزة</h3>
          {featuredProducts.length > 0 ? (
            <FeaturedProductsCarousel
              products={featuredProducts}
              onAddToCart={handleAddToCart}
              itemsPerView={4}
              onProductClick={handleProductClick}
            />
          ) : (
            <div className="text-center py-12">
              <div className="text-gray-400 text-lg mb-2">⭐</div>
              <p className="text-gray-500">لا توجد منتجات مميزة حالياً</p>
              <p className="text-gray-400 text-sm">يمكنك إضافة منتجات مميزة من لوحة إدارة المنتجات</p>
            </div>
          )}
        </section>


        {/* Categories Section */}
        <section id="categories" className="mb-8">
          <h3 className="text-3xl font-bold mb-6 text-black">فئات المنتجات</h3>
          <CategoryCarousel
            categories={categories}
            onCategorySelect={setSelectedCategory}
            itemsPerView={4}
          />
        </section>

        {/* All Products */}
        <section id="products" className="mb-8">
          <h3 className="text-3xl font-bold mb-6 text-black">جميع المنتجات</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filteredProducts.map((product) => (
              <InteractiveProductCard
                key={product.id}
                product={product}
                onAddToCart={handleAddToCart}
                deviceType="desktop"
                onProductClick={handleProductClick}
              />
            ))}
          </div>
        </section>
      </main>
    </div>

      {/* Desktop Footer */}
      <footer className="py-8 mt-0 w-full" style={{backgroundColor: '#4D4D4D', borderTop: '1px solid #666'}}>
        <div className="max-w-6xl mx-auto px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <img src="/assets/logo/El Farouk Group2.png" alt="الفاروق" className="h-8 w-8 object-contain" />
                <h5 className="font-bold text-lg text-white">El Farouk Group</h5>
              </div>
              <p className="text-gray-400">متجرك المتكامل للحصول على أفضل المنتجات بأسعار مميزة وجودة عالية</p>
            </div>
            <div>
              <h6 className="font-semibold mb-3">روابط سريعة</h6>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="transition-colors hover:text-[#5D1F1F]">الرئيسية</a></li>
                <li><a href="#" className="transition-colors hover:text-[#5D1F1F]">المنتجات</a></li>
                <li><a href="#" className="transition-colors hover:text-[#5D1F1F]">من نحن</a></li>
                <li><a href="#" className="transition-colors hover:text-[#5D1F1F]">اتصل بنا</a></li>
              </ul>
            </div>
            <div>
              <h6 className="font-semibold mb-3">خدمة العملاء</h6>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="transition-colors hover:text-[#5D1F1F]">المساعدة</a></li>
                <li><a href="#" className="transition-colors hover:text-[#5D1F1F]">سياسة الإرجاع</a></li>
                <li><a href="#" className="transition-colors hover:text-[#5D1F1F]">الشحن والتوصيل</a></li>
                <li><a href="#" className="transition-colors hover:text-[#5D1F1F]">الدفع</a></li>
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

      {/* Product Details Modal */}
      <ProductDetailsModal
        isOpen={isProductModalOpen}
        onClose={handleCloseProductModal}
        productId={selectedProductId}
        userCart={userInfo.cart}
        onUpdateCart={onCartUpdate}
      />

      {/* Cart Modal */}
      <CartModal
        isOpen={isCartModalOpen}
        onClose={() => setIsCartModalOpen(false)}
      />
    </>
  );
}