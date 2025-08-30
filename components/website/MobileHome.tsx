'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useProducts, Product as DatabaseProduct } from '../../app/lib/hooks/useProducts';
import { UserInfo, Product } from './shared/types';
import AuthButtons from '../../app/components/auth/AuthButtons';
import { useUserProfile } from '../../lib/hooks/useUserProfile';
import InteractiveProductCard from './InteractiveProductCard';
import CategoryCarousel from './CategoryCarousel';
import FeaturedProductsCarousel from './FeaturedProductsCarousel';
import ProductDetailsModal from '../../app/components/ProductDetailsModal';
import CartModal from '../../app/components/CartModal';
import { useCart } from '../../lib/contexts/CartContext';
import { useCartBadge } from '../../lib/hooks/useCartBadge';

interface MobileHomeProps {
  userInfo: UserInfo;
  onCartUpdate: (cart: any[]) => void;
  onRemoveFromCart: (productId: string | number) => void;
  onUpdateQuantity: (productId: string | number, quantity: number) => void;
  onClearCart: () => void;
}

export default function MobileHome({ 
  userInfo, 
  onCartUpdate, 
  onRemoveFromCart, 
  onUpdateQuantity, 
  onClearCart 
}: MobileHomeProps) {
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('الكل');
  const [isSearchSticky, setIsSearchSticky] = useState(false);
  const [isSearchVisible, setIsSearchVisible] = useState(true);
  const [isSearchCompact, setIsSearchCompact] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [isClient, setIsClient] = useState(false);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [isCartModalOpen, setIsCartModalOpen] = useState(false);
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
      console.log('🛒 Mobile: Adding product to cart:', product.name);
      const selectedColorName = product.selectedColor?.name || undefined;
      await addToCart(String(product.id), 1, product.price, selectedColorName);
      console.log('✅ Mobile: Product added successfully');
    } catch (error) {
      console.error('❌ Mobile: Error adding product to cart:', error);
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
          productCount: 0
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

  // Handle scroll for sticky search and show/hide
  useEffect(() => {
    if (!isClient) return;
    
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // Show/hide search based on scroll direction
      if (currentScrollY > lastScrollY && currentScrollY > 50) {
        // Scrolling down - hide search completely
        setIsSearchVisible(false);
      } else if (currentScrollY < lastScrollY) {
        // Scrolling up - show search immediately
        setIsSearchVisible(true);
      }
      
      // Determine if search should be sticky and compact
      const shouldBeSticky = currentScrollY > 80;
      const shouldBeCompact = currentScrollY > 20; // Compact when scrolled a bit
      
      setLastScrollY(currentScrollY);
      setIsSearchSticky(shouldBeSticky);
      setIsSearchCompact(shouldBeCompact);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isClient, lastScrollY]);

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
      <div className="min-h-screen flex items-center justify-center bg-[#2B3544]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-300">جاري تحميل التطبيق...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-gray-800 bg-custom-gray">
      {/* Mobile Header */}
      <header className="border-b border-gray-700 py-2 sticky top-0 z-50" style={{backgroundColor: '#5d1f1f'}}>
        <div className="px-4 flex items-center justify-between">
          {/* Left - Menu Button and Logo */}
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 hover:bg-red-600 rounded-lg transition-colors"
            >
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            
            {/* Logo and Text */}
            <div className="flex items-center gap-2">
              <img src="/assets/logo/El Farouk Group2.png" alt="الفاروق" className="h-14 w-14 object-contain" />
              <div className="flex flex-col leading-tight">
                <span className="text-white text-lg font-bold">El Farouk</span>
                <span className="text-white text-lg font-bold">Group</span>
              </div>
            </div>
          </div>
          
          {/* Right - User and Cart */}
          <div className="flex items-center gap-2">
            {/* User Profile Icon */}
            <AuthButtons compact mobileIconOnly />
            
            {/* Cart Button */}
            <button 
              onClick={() => setIsCartModalOpen(true)}
              className="relative p-2 hover:bg-red-600 rounded-lg transition-colors"
            >
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-1.5 6H19" />
              </svg>
              {cartBadgeCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-white text-red-600 text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                  {cartBadgeCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu Overlay */}
        {isMenuOpen && (
          <>
            <div className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={() => setIsMenuOpen(false)} />
            <div className="absolute top-full right-0 left-0 bg-gray-700 border-b border-gray-600 z-50">
              <nav className="px-4 py-3 space-y-1">
                {userInfo.name && (
                  <div className="py-2 px-3 text-sm text-gray-300 border-b border-gray-600 mb-2">
                    مرحباً، {userInfo.name}
                  </div>
                )}
                <a href="#products" className="block py-3 px-3 text-gray-300 hover:text-red-400 hover:bg-gray-600 rounded">المنتجات</a>
                <a href="#categories" className="block py-3 px-3 text-gray-300 hover:text-red-400 hover:bg-gray-600 rounded">الفئات</a>
                <a href="#offers" className="block py-3 px-3 text-gray-300 hover:text-red-400 hover:bg-gray-600 rounded">العروض</a>
                <a href="#about" className="block py-3 px-3 text-gray-300 hover:text-red-400 hover:bg-gray-600 rounded">عن المتجر</a>
              </nav>
            </div>
          </>
        )}
      </header>

      {/* Dynamic Search Bar */}
      <div className={`${isSearchSticky ? 'fixed left-0 right-0 z-40' : ''} bg-white border-b border-gray-200 transition-all duration-300 ease-in-out overflow-hidden`}
           style={{
             top: isSearchSticky ? '56px' : 'auto',
             transform: isSearchVisible ? 'translateY(0)' : 'translateY(-100%)',
             opacity: isSearchVisible ? 1 : 0,
             visibility: isSearchVisible ? 'visible' : 'hidden'
           }}>
        
        {isSearchCompact ? (
          /* Compact Search - Same as Full Search but with Different Placeholder */
          <div className="px-4 py-2">
            <div className="flex items-center gap-3 bg-gray-100 border border-gray-300 rounded-full px-5 py-2.5">
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input 
                type="text" 
                placeholder="البحث..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 bg-transparent outline-none text-base text-gray-700 placeholder-gray-500 font-medium focus:placeholder-gray-400"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        ) : (
          /* Full Search - Enhanced Visibility */
          <div className="px-4 py-2">
            <div className="flex items-center gap-3 bg-gray-100 border border-gray-300 rounded-full px-5 py-2.5">
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input 
                type="text" 
                placeholder="ابحث عن المنتجات..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 bg-transparent outline-none text-base text-gray-700 placeholder-gray-500 font-medium focus:placeholder-gray-400"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Mobile Main Content */}
      <main className="px-3 py-4">

        {/* Featured Categories - Now First Section with Horizontal Scroll */}
        <section id="categories" className="mb-6">
          <h3 className="text-xl font-bold mb-4 text-black">فئات المنتجات</h3>
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {categories.slice(0, 8).map((category) => (
              <div 
                key={category.id} 
                className="bg-white p-4 rounded-lg text-center hover:shadow-lg transition-all duration-200 border border-gray-200 group flex-shrink-0 w-40"
                onClick={() => setSelectedCategory(category.name)}
              >
                <div className="mb-3">
                  <img 
                    src={category.image} 
                    alt={category.name} 
                    className="w-full h-24 object-cover rounded-lg"
                  />
                </div>
                <h4 className="font-semibold text-sm text-gray-800 group-hover:text-red-500 transition-colors truncate">{category.name}</h4>
                <p className="text-xs text-gray-500 mt-1">{category.productCount} منتج</p>
              </div>
            ))}
          </div>
        </section>

        {/* Featured Products - Horizontal Scroll */}
        <section className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-black">المنتجات المميزة</h3>
          </div>
          
          {featuredProducts.length > 0 ? (
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
              {featuredProducts.map((product) => (
                <div key={product.id} className="flex-shrink-0 w-44">
                  <InteractiveProductCard
                    product={product}
                    onAddToCart={handleAddToCart}
                    deviceType="mobile"
                    onProductClick={handleProductClick}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-gray-400 text-lg mb-2">⭐</div>
              <p className="text-gray-500">لا توجد منتجات مميزة حالياً</p>
              <p className="text-gray-400 text-sm">يمكنك إضافة منتجات مميزة من لوحة إدارة المنتجات</p>
            </div>
          )}
        </section>

        {/* All Products */}
        <section id="products" className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-black">جميع المنتجات</h3>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            {filteredProducts.map((product) => (
              <InteractiveProductCard
                key={product.id}
                product={product}
                onAddToCart={handleAddToCart}
                deviceType="mobile"
                onProductClick={handleProductClick}
              />
            ))}
          </div>
        </section>
      </main>


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
    </div>
  );
}