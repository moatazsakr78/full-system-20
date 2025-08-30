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

  // Handle scroll for sticky search
  useEffect(() => {
    if (!isClient) return;
    
    const handleScroll = () => {
      setIsSearchSticky(window.scrollY > 120);
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
      <div className="min-h-screen flex items-center justify-center bg-[#2B3544]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-300">جاري تحميل التطبيق...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-gray-800" style={{backgroundColor: '#c0c0c0'}}>
      {/* Mobile Header */}
      <header className="border-b border-gray-700 py-3 sticky top-0 z-50" style={{backgroundColor: '#5d1f1f'}}>
        <div className="px-3 flex items-center justify-between">
          <button 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="p-2 hover:bg-gray-700 rounded-lg"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          
          <div className="flex items-center gap-2">
            <img src="/assets/logo/El Farouk Group2.png" alt="El Farouk Group" className="h-8 w-8 object-contain" />
            <h1 className="text-lg font-bold text-white">El Farouk Group</h1>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="mr-1">
              <AuthButtons compact />
            </div>
            
            
            <div className="ml-1">
              <button 
                onClick={() => setIsCartModalOpen(true)}
                className="relative p-2 hover:bg-gray-700 rounded-lg"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-1.5 6H19" />
                </svg>
              </button>
            </div>
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

      {/* Sticky Search Bar */}
      <div className={`${isSearchSticky ? 'fixed top-14 left-0 right-0 bg-gray-800 border-b border-gray-600 py-3 z-40' : 'bg-gray-800 border-b border-gray-700 py-3'} transition-all duration-300`}>
        <div className="px-3">
          <div className="relative">
            <input 
              type="text" 
              placeholder="ابحث عن المنتجات..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2.5 pr-10 text-white placeholder-gray-400 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
            />
            <svg className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Mobile Main Content */}
      <main className="px-3 py-4 pb-20">

        {/* Quick Categories - Horizontal Scroll */}
        <section className="mb-4">
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            <button 
              onClick={() => setSelectedCategory('الكل')}
              className={`flex-shrink-0 px-3 py-2 rounded-full text-xs font-medium transition-colors whitespace-nowrap ${
                selectedCategory === 'الكل' 
                  ? 'text-white' 
                  : 'bg-gray-800 hover:bg-gray-700 text-gray-300'
              }`}
              style={selectedCategory === 'الكل' ? {backgroundColor: '#5D1F1F'} : {}}
            >
              الكل
            </button>
            {categories.slice(0, 7).map((category) => (
              <button 
                key={category.id}
                onClick={() => setSelectedCategory(category.name)}
                className={`flex-shrink-0 px-3 py-2 rounded-full text-xs font-medium transition-colors whitespace-nowrap ${
                  selectedCategory === category.name 
                    ? 'text-white' 
                    : 'bg-gray-800 hover:bg-gray-700 text-gray-300'
                }`}
                style={selectedCategory === category.name ? {backgroundColor: '#5D1F1F'} : {}}
              >
                {category.name}
              </button>
            ))}
          </div>
        </section>

        {/* Featured Products */}
        <section className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-black">المنتجات المميزة</h3>
          </div>
          
          {featuredProducts.length > 0 ? (
            <FeaturedProductsCarousel
              products={featuredProducts}
              onAddToCart={handleAddToCart}
              itemsPerView={2}
              className="mobile-carousel"
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


        {/* All Products */}
        <section id="products" className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-black">جميع المنتجات</h3>
            <button className="text-red-400 text-sm">عرض الكل</button>
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
          
          <div className="text-center mt-4">
            <button className="bg-gray-800 hover:bg-gray-700 px-6 py-2.5 rounded-lg text-sm font-medium w-full border border-gray-700">
              عرض المزيد
            </button>
          </div>
        </section>

        {/* Featured Categories */}
        <section id="categories" className="mb-6">
          <h3 className="text-xl font-bold mb-4 text-black">فئات المنتجات</h3>
          <div className="grid grid-cols-2 gap-3">
            {categories.slice(0, 8).map((category) => (
              <div 
                key={category.id} 
                className="bg-gray-800 p-4 rounded-lg text-center hover:bg-gray-700 transition-colors border border-gray-700 group"
                onClick={() => setSelectedCategory(category.name)}
              >
                <div className="relative mb-3">
                  <img 
                    src={category.image} 
                    alt={category.name} 
                    className="w-full h-28 object-cover rounded-lg"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-40 rounded-lg flex items-center justify-center">
                    <span className="text-xl">{category.icon}</span>
                  </div>
                </div>
                <h4 className="font-semibold text-sm text-white group-hover:text-red-400 transition-colors">{category.name}</h4>
                <p className="text-xs text-gray-400 mt-1">{category.productCount} منتج</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Fixed Bottom Navigation (Mobile) */}
      <nav className="fixed bottom-0 left-0 right-0 px-4 py-2 z-40" style={{backgroundColor: '#4D4D4D', borderTop: '1px solid #666'}}>
        <div className={`flex items-center ${isAdmin ? 'justify-between' : 'justify-around'}`}>
          <button className="flex flex-col items-center gap-1 p-2 text-red-400">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            <span className="text-xs">الرئيسية</span>
          </button>
          
          <button className="flex flex-col items-center gap-1 p-2 text-gray-400">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <span className="text-xs">البحث</span>
          </button>
          
          
          <button 
            onClick={() => setIsCartModalOpen(true)}
            className="flex flex-col items-center gap-1 p-2 text-gray-400 relative"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-1.5 6H19" />
            </svg>
            <span className="text-xs">السلة ({cartBadgeCount})</span>
          </button>
          
          <button className="flex flex-col items-center gap-1 p-2 text-gray-400">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span className="text-xs">الحساب</span>
          </button>
        </div>
      </nav>

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