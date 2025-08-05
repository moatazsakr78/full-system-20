'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useProducts, Product as DatabaseProduct } from '../../app/lib/hooks/useProducts';
import { UserInfo, Product } from './shared/types';
import AuthButtons from '../../app/components/auth/AuthButtons';

interface MobileHomeProps {
  userInfo: UserInfo;
  onCartUpdate: (cart: any[]) => void;
  onAddToCart: (product: Product) => Promise<void>;
  onRemoveFromCart: (productId: string | number) => void;
  onUpdateQuantity: (productId: string | number, quantity: number) => void;
  onClearCart: () => void;
}

export default function MobileHome({ 
  userInfo, 
  onCartUpdate, 
  onAddToCart, 
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
  const [websiteProducts, setWebsiteProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  
  // Get real products from database
  const { products: databaseProducts, isLoading } = useProducts();

  // Convert database products to website format
  useEffect(() => {
    if (databaseProducts && databaseProducts.length > 0) {
      const convertedProducts: Product[] = databaseProducts.map((dbProduct: DatabaseProduct) => ({
        id: dbProduct.id,
        name: dbProduct.name,
        description: dbProduct.description || '',
        price: dbProduct.finalPrice || dbProduct.price,
        originalPrice: dbProduct.isDiscounted ? dbProduct.price : undefined,
        image: dbProduct.main_image_url || undefined,
        images: dbProduct.allImages || [],
        category: dbProduct.category?.name || 'عام',
        brand: 'El Farouk Group',
        stock: dbProduct.totalQuantity || 0,
        rating: dbProduct.rating || 0,
        reviews: dbProduct.rating_count || 0,
        isOnSale: dbProduct.isDiscounted || false,
        discount: dbProduct.isDiscounted && dbProduct.discount_percentage ? Math.round(dbProduct.discount_percentage) : undefined,
        tags: []
      }));
      setWebsiteProducts(convertedProducts);
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

  const featuredProducts = websiteProducts.filter(product => product.isOnSale || (product.rating && product.rating >= 4.5));

  // Show loading state during hydration or while loading data
  if (!isClient || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{backgroundColor: '#c0c0c0'}}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600">جاري تحميل التطبيق...</p>
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
            <img src="/assets/logo/El Farouk Group2.png" alt="الفاروق" className="h-8 w-8 object-contain" />
            <h1 className="text-lg font-bold text-red-500">الفاروق</h1>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="mr-1">
              <AuthButtons compact />
            </div>
            <div className="ml-1">
              <button 
                onClick={() => router.push('/cart')}
                className="relative p-2 hover:bg-gray-700 rounded-lg"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-1.5 6H19" />
                </svg>
                {(userInfo.cart?.length || 0) > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {userInfo.cart?.length || 0}
                  </span>
                )}
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
        {/* Hero Section - Mobile Optimized */}
        <section className="bg-gradient-to-r from-red-600 to-red-800 rounded-lg p-4 mb-4 text-center">
          <div className="text-4xl mb-3">🛍️</div>
          <h2 className="text-lg font-bold mb-2">اكتشف منتجاتنا المميزة</h2>
          <p className="text-sm text-red-100 mb-3">أحدث المنتجات بأفضل الأسعار والجودة العالية</p>
          <button className="bg-white text-red-600 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-gray-100">
            تسوق الآن
          </button>
        </section>

        {/* Quick Categories - Horizontal Scroll */}
        <section className="mb-4">
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            <button 
              onClick={() => setSelectedCategory('الكل')}
              className={`flex-shrink-0 px-3 py-2 rounded-full text-xs font-medium transition-colors whitespace-nowrap ${
                selectedCategory === 'الكل' 
                  ? 'bg-red-600 text-white' 
                  : 'bg-gray-800 hover:bg-gray-700 text-gray-300'
              }`}
            >
              الكل
            </button>
            {categories.slice(0, 7).map((category) => (
              <button 
                key={category.id}
                onClick={() => setSelectedCategory(category.name)}
                className={`flex-shrink-0 px-3 py-2 rounded-full text-xs font-medium transition-colors whitespace-nowrap ${
                  selectedCategory === category.name 
                    ? 'bg-red-600 text-white' 
                    : 'bg-gray-800 hover:bg-gray-700 text-gray-300'
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>
        </section>

        {/* Featured Products */}
        <section className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-red-400">المنتجات المميزة</h3>
            <button className="text-red-400 text-sm">عرض الكل</button>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            {featuredProducts.slice(0, 6).map((product) => (
              <div key={product.id} className="bg-gray-800 rounded-lg p-3 border border-gray-700 cursor-pointer group">
                <div className="relative mb-3" onClick={() => router.push(`/product/${product.id}`)}>
                  <img 
                    src={product.image} 
                    alt={product.name} 
                    className="w-full h-40 object-cover rounded-lg group-hover:scale-105 transition-transform duration-300"
                  />
                  {product.isOnSale && (
                    <span className="absolute top-2 right-2 bg-red-600 text-white px-2 py-1 rounded-full text-xs font-bold">
                      -{product.discount}%
                    </span>
                  )}
                </div>
                <div onClick={() => router.push(`/product/${product.id}`)}>
                  <h4 className="font-semibold mb-1 text-sm truncate text-white group-hover:text-red-600 transition-colors">{product.name}</h4>
                  <p className="text-gray-400 text-xs mb-2 truncate">{product.description}</p>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1">
                      {product.originalPrice && (
                        <span className="text-xs text-gray-500 line-through">{product.originalPrice}</span>
                      )}
                      <span className="text-sm font-bold text-red-400">{product.price} ريال</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <span className="text-yellow-400 text-xs">⭐</span>
                      <span className="text-xs text-gray-400">{product.rating}</span>
                    </div>
                  </div>
                </div>
                <button 
                  onClick={async (e) => {
                    e.stopPropagation();
                    await onAddToCart(product);
                  }}
                  className="bg-red-600 hover:bg-red-700 p-1.5 rounded-lg w-full mt-2"
                >
                  <svg className="w-4 h-4 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* All Products */}
        <section id="products" className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold">جميع المنتجات</h3>
            <button className="text-red-400 text-sm">عرض الكل</button>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            {filteredProducts.map((product) => (
              <div key={product.id} className="bg-gray-800 rounded-lg p-3 border border-gray-700 cursor-pointer group">
                <div className="relative mb-3" onClick={() => router.push(`/product/${product.id}`)}>
                  <img 
                    src={product.image} 
                    alt={product.name} 
                    className="w-full h-40 object-cover rounded-lg group-hover:scale-105 transition-transform duration-300"
                  />
                  {product.isOnSale && (
                    <span className="absolute top-2 right-2 bg-red-600 text-white px-2 py-1 rounded-full text-xs font-bold">
                      -{product.discount}%
                    </span>
                  )}
                </div>
                <div onClick={() => router.push(`/product/${product.id}`)}>
                  <h4 className="font-semibold mb-1 text-sm truncate text-white group-hover:text-red-600 transition-colors">{product.name}</h4>
                  <p className="text-gray-400 text-xs mb-2 truncate">{product.description}</p>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1">
                      {product.originalPrice && (
                        <span className="text-xs text-gray-500 line-through">{product.originalPrice}</span>
                      )}
                      <span className="text-sm font-bold text-red-400">{product.price} ريال</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <span className="text-yellow-400 text-xs">⭐</span>
                      <span className="text-xs text-gray-400">{product.rating}</span>
                    </div>
                  </div>
                </div>
                <button 
                  onClick={async (e) => {
                    e.stopPropagation();
                    await onAddToCart(product);
                  }}
                  className="bg-red-600 hover:bg-red-700 p-1.5 rounded-lg w-full mt-2"
                >
                  <svg className="w-4 h-4 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </button>
              </div>
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
          <h3 className="text-lg font-bold mb-4 text-red-400">فئات المنتجات</h3>
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
        <div className="flex items-center justify-around">
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
            onClick={() => router.push('/cart')}
            className="flex flex-col items-center gap-1 p-2 text-gray-400 relative"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-1.5 6H19" />
            </svg>
            {(userInfo.cart?.length || 0) > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-600 text-xs rounded-full w-4 h-4 flex items-center justify-center">
                {userInfo.cart?.length || 0}
              </span>
            )}
            <span className="text-xs">السلة</span>
          </button>
          
          <button className="flex flex-col items-center gap-1 p-2 text-gray-400">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span className="text-xs">الحساب</span>
          </button>
        </div>
      </nav>
    </div>
  );
}