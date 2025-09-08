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
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('الكل');
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const [isSearchActive, setIsSearchActive] = useState(false);
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
          .map((dbProduct: DatabaseProduct) => {
            // Calculate if product has discount
            const hasDiscount = dbProduct.discount_percentage && dbProduct.discount_percentage > 0;
            const finalPrice = hasDiscount 
              ? Number(dbProduct.price) * (1 - Number(dbProduct.discount_percentage) / 100)
              : Number(dbProduct.price);
            
            return {
              id: dbProduct.id,
              name: dbProduct.name || 'منتج بدون اسم',
              description: dbProduct.description || '',
              price: finalPrice,
              originalPrice: hasDiscount ? Number(dbProduct.price) : undefined,
              image: dbProduct.main_image_url || undefined,
              images: dbProduct.main_image_url ? [dbProduct.main_image_url] : [],
              colors: [], // Will be populated from product variants if needed
              category: dbProduct.category?.name || 'عام',
              brand: 'El Farouk Group',
              stock: dbProduct.stock || 0,
              rating: Number(dbProduct.rating) || 0,
              reviews: dbProduct.rating_count || 0,
              isOnSale: hasDiscount || false,
              discount: hasDiscount && dbProduct.discount_percentage ? Math.round(Number(dbProduct.discount_percentage)) : undefined,
              tags: [],
              isFeatured: dbProduct.is_featured || false
            };
          });
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

  // Handle menu toggle with animation
  const toggleMenu = () => {
    if (isMenuOpen) {
      // Close menu
      setIsMenuOpen(false);
      setTimeout(() => setIsMenuVisible(false), 300); // Wait for animation to complete
    } else {
      // Open menu
      setIsMenuVisible(true);
      setTimeout(() => setIsMenuOpen(true), 10); // Small delay to allow render
    }
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
    setTimeout(() => setIsMenuVisible(false), 300);
  };

  // Handle search toggle - now controls search bar visibility in header
  const toggleSearch = () => {
    setIsSearchActive(!isSearchActive);
    if (isSearchActive) {
      setSearchQuery(''); // Clear search when closing
    }
  };

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
      <div className="min-h-screen flex items-center justify-center bg-custom-gray">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-800">جاري تحميل التطبيق...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-gray-800 bg-custom-gray">
      {/* Mobile Header */}
      <header className="border-b border-gray-700 py-2 fixed top-0 left-0 right-0 z-50 h-16" style={{backgroundColor: '#5d1f1f'}}>
        <div className="px-4 flex items-center justify-between w-full">
          {/* Complete horizontal layout from right to left */}
          <div className="flex items-center gap-2 w-full justify-between">
            {/* Right Side - Menu, Logo, Logo Text */}
            <div className="flex items-center gap-2">
              {/* Menu Button - Far Right */}
              <button 
                onClick={toggleMenu}
                className="p-2 rounded-lg transition-colors"
              >
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              
              {/* Logo */}
              <img src="/assets/logo/El Farouk Group2.png" alt="الفاروق" className="h-14 w-14 object-contain" />
              
              {/* Logo Text */}
              <div className="flex flex-col leading-tight">
                <span className="text-white text-lg font-bold">El Farouk</span>
                <span className="text-white text-lg font-bold">Group</span>
              </div>
            </div>

            {/* Left Side - Search, Cart, Account */}
            <div className="flex items-center gap-2">
              {/* Search Toggle Button */}
              <button 
                onClick={toggleSearch}
                className={`p-2 rounded-lg transition-all duration-300 ${isSearchActive ? 'bg-white text-black hover:bg-gray-100' : 'text-white bg-transparent'}`}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
              
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
              
              {/* Account Icon - Far Left */}
              <AuthButtons compact mobileIconOnly />
            </div>
          </div>
        </div>

        {/* Mobile Menu Overlay - Advanced Menu like Desktop/Tablet */}
        {isMenuVisible && (
          <>
            <div className="fixed top-[72px] right-0 bottom-0 left-0 bg-black bg-opacity-50 z-40" onClick={closeMenu} />
            <div className={`fixed top-[72px] right-0 h-[calc(100vh-72px)] w-80 bg-[#eaeaea] border-l border-gray-400 shadow-2xl z-50 transform transition-transform duration-300 ease-in-out ${
              isMenuOpen ? 'translate-x-0' : 'translate-x-full'
            }`}>
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-red-600 bg-[#5d1f1f]">
                <h2 className="text-lg font-bold text-white">القائمة الرئيسية</h2>
                <button
                  onClick={closeMenu}
                  className="p-2 text-gray-200 hover:text-white hover:bg-gray-600 rounded-full transition-colors"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Menu Items */}
              <div className="p-3 overflow-y-auto scrollbar-hide h-[calc(100%-140px)]">
                <div className="space-y-1">
                  
                  {/* Admin-specific buttons */}
                  {isAdmin && (
                    <>
                      {/* Customer Orders (Admin Only) */}
                      <button
                        onClick={() => {
                          window.location.href = '/customer-orders';
                          closeMenu();
                        }}
                        className="flex items-center gap-3 w-full p-3 text-black hover:bg-gray-300 rounded-lg transition-colors text-right group"
                      >
                        <div className="p-2 bg-[#5d1f1f] rounded-full group-hover:bg-red-700 transition-colors">
                          <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                        </div>
                        <div className="flex-1 text-right">
                          <h3 className="font-semibold text-base text-black">طلبات العملاء</h3>
                          <p className="text-xs text-gray-600">إدارة ومراجعة طلبات جميع العملاء</p>
                        </div>
                      </button>

                      {/* Manage Products */}
                      <button
                        onClick={() => {
                          window.location.href = '/admin/products';
                          closeMenu();
                        }}
                        className="flex items-center gap-3 w-full p-3 text-black hover:bg-gray-300 rounded-lg transition-colors text-right group"
                      >
                        <div className="p-2 bg-[#5d1f1f] rounded-full group-hover:bg-red-700 transition-colors">
                          <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                          </svg>
                        </div>
                        <div className="flex-1 text-right">
                          <h3 className="font-semibold text-base text-black">إدارة المنتجات</h3>
                          <p className="text-xs text-gray-600">إضافة وتعديل وحذف المنتجات</p>
                        </div>
                      </button>

                      {/* Store Management */}
                      <button
                        onClick={() => {
                          alert('سيتم إضافة صفحة إدارة المتجر قريباً');
                          closeMenu();
                        }}
                        className="flex items-center gap-3 w-full p-3 text-black hover:bg-gray-300 rounded-lg transition-colors text-right group"
                      >
                        <div className="p-2 bg-[#5d1f1f] rounded-full group-hover:bg-red-700 transition-colors">
                          <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                          </svg>
                        </div>
                        <div className="flex-1 text-right">
                          <h3 className="font-semibold text-base text-black">إدارة المتجر</h3>
                          <p className="text-xs text-gray-600">إعدادات وإدارة المتجر العامة</p>
                        </div>
                      </button>

                      {/* Shipping Details */}
                      <button
                        onClick={() => {
                          window.location.href = '/shipping';
                          closeMenu();
                        }}
                        className="flex items-center gap-3 w-full p-3 text-black hover:bg-gray-300 rounded-lg transition-colors text-right group"
                      >
                        <div className="p-2 bg-[#5d1f1f] rounded-full group-hover:bg-red-700 transition-colors">
                          <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                        </div>
                        <div className="flex-1 text-right">
                          <h3 className="font-semibold text-base text-black">تفاصيل الشحن</h3>
                          <p className="text-xs text-gray-600">إدارة شركات الشحن وأسعار المحافظات</p>
                        </div>
                      </button>
                    </>
                  )}

                  {/* Regular user buttons (hidden for admins) */}
                  {!isAdmin && (
                    <>
                      {/* Profile */}
                      <button
                        onClick={() => {
                          alert('سيتم إضافة صفحة الملف الشخصي قريباً');
                          closeMenu();
                        }}
                        className="flex items-center gap-3 w-full p-3 text-black hover:bg-gray-300 rounded-lg transition-colors text-right group"
                      >
                        <div className="p-2 bg-[#5d1f1f] rounded-full group-hover:bg-red-700 transition-colors">
                          <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </div>
                        <div className="flex-1 text-right">
                          <h3 className="font-semibold text-base text-black">الملف الشخصي</h3>
                          <p className="text-xs text-gray-600">إعدادات الحساب والمعلومات الشخصية</p>
                        </div>
                      </button>

                      {/* Favorites */}
                      <button
                        onClick={() => {
                          alert('سيتم إضافة صفحة المفضلة قريباً');
                          closeMenu();
                        }}
                        className="flex items-center gap-3 w-full p-3 text-black hover:bg-gray-300 rounded-lg transition-colors text-right group"
                      >
                        <div className="p-2 bg-[#5d1f1f] rounded-full group-hover:bg-red-700 transition-colors">
                          <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                          </svg>
                        </div>
                        <div className="flex-1 text-right">
                          <h3 className="font-semibold text-base text-black">المفضلة</h3>
                          <p className="text-xs text-gray-600">المنتجات والعناصر المفضلة لديك</p>
                        </div>
                      </button>

                      {/* Orders List */}
                      <button
                        onClick={() => {
                          window.location.href = '/my-orders';
                          closeMenu();
                        }}
                        className="flex items-center gap-3 w-full p-3 text-black hover:bg-gray-300 rounded-lg transition-colors text-right group"
                      >
                        <div className="p-2 bg-[#5d1f1f] rounded-full group-hover:bg-red-700 transition-colors">
                          <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                        <div className="flex-1 text-right">
                          <h3 className="font-semibold text-base text-black">قائمة الطلبات</h3>
                          <p className="text-xs text-gray-600">عرض وإدارة جميع الطلبات</p>
                        </div>
                      </button>
                    </>
                  )}

                </div>
              </div>

              {/* Footer */}
              <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-gray-400 bg-[#eaeaea]">
                <p className="text-center text-black text-xs">
                  El Farouk Group
                </p>
              </div>
            </div>
          </>
        )}
      </header>

      {/* Search Bar - Part of Header, Fixed Position */}
      <div 
        className="fixed left-0 right-0 z-40 transition-all duration-300 ease-in-out overflow-hidden" 
        style={{
          backgroundColor: '#5d1f1f',
          top: isSearchActive ? '64px' : '0px',
          transform: isSearchActive ? 'translateY(0)' : 'translateY(-100%)',
          opacity: isSearchActive ? 1 : 0,
          visibility: isSearchActive ? 'visible' : 'hidden',
          height: isSearchActive ? '70px' : '0'
        }}
      >
        <div className="px-4 flex items-center justify-center h-full">
          <div className="relative w-full">
            <input 
              type="text" 
              placeholder="ابحث عن المنتجات..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border-0 rounded-full px-4 py-3 pr-12 text-base text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white transition-all duration-300"
              style={{
                fontFamily: 'Cairo, sans-serif'
              }}
              autoFocus={isSearchActive}
            />
            <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>


      {/* Mobile Main Content */}
      <main 
        className="px-3 py-4 transition-all duration-300" 
        style={{ 
          paddingTop: isSearchActive ? '140px' : '70px' // Adjust for header + search bar
        }}
      >

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