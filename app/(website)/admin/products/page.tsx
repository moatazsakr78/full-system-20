'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useProducts } from '../../../lib/hooks/useProducts';
import { DragDropProvider } from './components/DragDropProvider';
import ProductManagementGrid from './components/ProductManagementGrid';
import { supabase } from '../../../lib/supabase/client';

interface ProductManagementItem {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
  isHidden: boolean;
  isFeatured: boolean;
  displayOrder: number;
  suggestedProducts: string[];
}

export default function ProductManagementPage() {
  const router = useRouter();
  const { products: databaseProducts, isLoading } = useProducts();
  const [products, setProducts] = useState<ProductManagementItem[]>([]);
  const [isDragMode, setIsDragMode] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Set client-side flag after component mounts
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Convert database products to management format
  useEffect(() => {
    if (databaseProducts && databaseProducts.length > 0) {
      const convertedProducts: ProductManagementItem[] = databaseProducts.map((dbProduct: any, index: number) => ({
        id: dbProduct.id,
        name: dbProduct.name || 'منتج بدون اسم',
        description: dbProduct.description || '',
        price: dbProduct.finalPrice || dbProduct.price || 0,
        image: dbProduct.main_image_url || '/placeholder-product.jpg',
        category: dbProduct.category?.name || 'عام',
        isHidden: dbProduct.is_hidden || false,
        isFeatured: dbProduct.is_featured || false,
        displayOrder: dbProduct.display_order || index,
        suggestedProducts: dbProduct.suggested_products || []
      }));
      
      // Sort by display order
      convertedProducts.sort((a, b) => a.displayOrder - b.displayOrder);
      setProducts(convertedProducts);
    }
  }, [databaseProducts]);

  const toggleDragMode = () => {
    setIsDragMode(!isDragMode);
  };

  const saveOrder = async () => {
    setIsSaving(true);
    try {
      const updates = products.map((product, index) => ({
        id: product.id,
        display_order: index
      }));

      for (const update of updates) {
        const { error } = await supabase
          .from('products')
          .update({ display_order: update.display_order } as any)
          .eq('id', update.id);
        
        if (error) throw error;
      }
      
      alert('تم حفظ الترتيب بنجاح');
      setIsDragMode(false);
    } catch (error) {
      console.error('Error saving order:', error);
      alert('حدث خطأ أثناء حفظ الترتيب');
    } finally {
      setIsSaving(false);
    }
  };

  const toggleVisibility = async (productId: string) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    try {
      const newHiddenState = !product.isHidden;
      
      const { error } = await supabase
        .from('products')
        .update({ is_hidden: newHiddenState } as any)
        .eq('id', productId);
      
      if (error) throw error;

      setProducts(prev => prev.map(p => 
        p.id === productId ? { ...p, isHidden: newHiddenState } : p
      ));
    } catch (error) {
      console.error('Error updating visibility:', error);
      alert('حدث خطأ أثناء تحديث حالة المنتج');
    }
  };

  const toggleFeatured = async (productId: string) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    try {
      const newFeaturedState = !product.isFeatured;
      
      const { error } = await supabase
        .from('products')
        .update({ is_featured: newFeaturedState } as any)
        .eq('id', productId);
      
      if (error) throw error;

      setProducts(prev => prev.map(p => 
        p.id === productId ? { ...p, isFeatured: newFeaturedState } : p
      ));
    } catch (error) {
      console.error('Error updating featured status:', error);
      alert('حدث خطأ أثناء تحديث حالة المنتج المميز');
    }
  };

  const updateSuggestedProducts = async (productId: string, suggestedIds: string[]) => {
    try {
      const { error } = await supabase
        .from('products')
        .update({ suggested_products: suggestedIds } as any)
        .eq('id', productId);
      
      if (error) throw error;

      setProducts(prev => prev.map(p => 
        p.id === productId ? { ...p, suggestedProducts: suggestedIds } : p
      ));
    } catch (error) {
      console.error('Error updating suggested products:', error);
      alert('حدث خطأ أثناء تحديث المنتجات المقترحة');
    }
  };

  const handleReorder = (reorderedProducts: ProductManagementItem[]) => {
    setProducts(reorderedProducts);
  };

  // Filter products based on search term
  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Show loading state during hydration or while loading data
  if (!isClient || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{backgroundColor: '#c0c0c0'}}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600">جاري تحميل صفحة إدارة المنتجات...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-gray-800" style={{backgroundColor: '#c0c0c0'}}>
      {/* Header */}
      <header className="border-b border-gray-700 py-1" style={{backgroundColor: '#5d1f1f'}}>
        <div className="w-full px-6 flex items-center justify-between">
          {/* Right side - Title and Action buttons */}
          <div className="flex items-center gap-1">
            <h1 className="text-2xl font-bold text-white">إدارة المنتجات</h1>
            
            {/* White separator line */}
            <div className="w-px h-8 bg-white/30 mx-3"></div>
            
            {/* Switch Centers Button - System Style */}
            <button
              onClick={toggleDragMode}
              className={`flex flex-col items-center justify-center p-4 transition-colors group min-w-[100px] ${
                isDragMode 
                  ? 'hover:text-yellow-200' 
                  : 'hover:text-gray-200'
              }`}
            >
              <svg 
                className={`w-8 h-8 mb-2 transition-colors ${
                  isDragMode 
                    ? 'text-yellow-300 group-hover:text-yellow-200' 
                    : 'text-white group-hover:text-gray-200'
                }`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2.5} 
                  d="M4 6h16M4 10h16M4 14h16M4 18h16" 
                />
              </svg>
              <span className={`text-sm font-bold text-center leading-tight transition-colors ${
                isDragMode 
                  ? 'text-yellow-300 group-hover:text-yellow-200' 
                  : 'text-white group-hover:text-gray-200'
              }`}>
                {isDragMode ? 'إلغاء تبديل' : 'تبديل المراكز'}
              </span>
            </button>

            {/* Save Order Button - appears when in drag mode */}
            {isDragMode && (
              <>
                <div className="w-px h-8 bg-white/30 mx-2"></div>
                <button
                  onClick={saveOrder}
                  disabled={isSaving}
                  className="flex flex-col items-center justify-center p-4 transition-colors group min-w-[100px] hover:text-green-200"
                >
                  <svg className="w-8 h-8 mb-2 text-green-300 group-hover:text-green-200 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-sm font-bold text-center leading-tight text-green-300 group-hover:text-green-200 transition-colors">
                    {isSaving ? 'جاري الحفظ' : 'حفظ الترتيب'}
                  </span>
                </button>
              </>
            )}
          </div>
          
          {/* Center - Empty space */}
          <div></div>
          
          {/* Left side - Exit button */}
          <button
            onClick={() => router.back()}
            className="text-white hover:text-red-300 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex min-h-screen">
        {/* Control Panel - Right Side */}
        <div className="w-80 bg-white border-l border-gray-300 p-6">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">لوحة التحكم</h2>
            
            
            {/* Navigation Buttons */}
            <div className="space-y-3">
              <button className="w-full flex items-center justify-between px-4 py-3 text-right bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors">
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                <span className="text-gray-700 font-medium">إدارة المنتجات</span>
              </button>
              
              <button className="w-full flex items-center justify-between px-4 py-3 text-right bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors">
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
                <span className="text-gray-700 font-medium">طلبات العملاء</span>
              </button>
              
              <button className="w-full flex items-center justify-between px-4 py-3 text-right bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors">
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <span className="text-gray-700 font-medium">سجل العملاء</span>
              </button>
              
              <button className="w-full flex items-center justify-between px-4 py-3 text-right bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors">
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
                <span className="text-gray-700 font-medium">المبيعات</span>
              </button>
              
              <button className="w-full flex items-center justify-between px-4 py-3 text-right bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors">
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <span className="text-gray-700 font-medium">المستخدمين</span>
              </button>
              
              <button className="w-full flex items-center justify-between px-4 py-3 text-right bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors">
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="text-gray-700 font-medium">تسجيل الخروج</span>
              </button>
            </div>
          </div>
        </div>

        {/* Products Content - Left Side */}
        <main className="flex-1 p-6">
          {/* Search and View Controls Bar */}
          <div className="bg-white border border-gray-300 rounded-lg py-3 px-4 mb-6">
            <div className="flex items-center justify-between gap-4">
              {/* Search Bar */}
              <div className="flex-1 max-w-md">
                <div className="relative">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="البحث في المنتجات..."
                    className="w-full px-4 py-2 pr-10 text-right border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:border-transparent"
                    style={{
                      '--tw-ring-color': '#5D1F1F',
                      '--tw-ring-opacity': '0.5'
                    } as React.CSSProperties}
                    onFocus={(e) => {
                      e.target.style.boxShadow = '0 0 0 2px rgba(93, 31, 31, 0.5)';
                    }}
                    onBlur={(e) => {
                      e.target.style.boxShadow = 'none';
                    }}
                  />
                  <svg 
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m21 21-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>

              {/* View Mode Toggle Buttons */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600 mr-3">وضع العرض:</span>
                
                {/* Grid View Button */}
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-lg transition-colors ${
                    viewMode === 'grid'
                      ? 'text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                  style={viewMode === 'grid' ? { backgroundColor: '#5D1F1F' } : {}}
                  title="عرض الصور"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                </button>

                {/* List View Button */}
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-lg transition-colors ${
                    viewMode === 'list'
                      ? 'text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                  style={viewMode === 'list' ? { backgroundColor: '#5D1F1F' } : {}}
                  title="عرض الصفوف"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                  </svg>
                </button>
              </div>

              {/* Search Results Count */}
              <div className="text-sm text-gray-500">
                {searchTerm && (
                  <span>
                    {filteredProducts.length} من {products.length} منتج
                  </span>
                )}
              </div>
            </div>
          </div>

          <DragDropProvider>
            <ProductManagementGrid
              products={filteredProducts}
              isDragMode={isDragMode}
              onReorder={handleReorder}
              onToggleVisibility={toggleVisibility}
              onToggleFeatured={toggleFeatured}
              onUpdateSuggestedProducts={updateSuggestedProducts}
            />
          </DragDropProvider>
          
          {/* Instructions */}
          <div className="mt-8">
            <div className="bg-white rounded-lg p-6 border border-gray-300 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">تعليمات الاستخدام:</h3>
              <ul className="list-disc pr-5 space-y-2 text-gray-600">
                <li><strong>تبديل المراكز:</strong> اضغط على زر &quot;تبديل المراكز&quot; لتفعيل خاصية السحب والإفلات، ثم اسحب المنتجات لإعادة ترتيبها</li>
                <li><strong>إخفاء/إظهار:</strong> استخدم مفتاح &quot;مخفي من المتجر&quot; لإخفاء أو إظهار المنتج في الموقع</li>
                <li><strong>المنتجات المميزة:</strong> فعل مفتاح &quot;منتج مميز&quot; لإضافة المنتج لقسم المنتجات المميزة</li>
                <li><strong>المنتجات المقترحة:</strong> اضغط على &quot;إدارة المقترحات&quot; لتحديد المنتجات التي ستظهر كمقترحات مع هذا المنتج</li>
              </ul>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}