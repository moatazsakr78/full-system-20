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
  const [originalProducts, setOriginalProducts] = useState<ProductManagementItem[]>([]);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isDragMode, setIsDragMode] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Set client-side flag after component mounts
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Warn user when leaving with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = 'لديك تغييرات غير محفوظة. هل تريد المغادرة دون حفظ؟';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [hasUnsavedChanges]);

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
      setOriginalProducts(JSON.parse(JSON.stringify(convertedProducts))); // Deep copy
      setHasUnsavedChanges(false);
    }
  }, [databaseProducts]);

  const toggleDragMode = () => {
    setIsDragMode(!isDragMode);
  };


  const toggleVisibility = (productId: string) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    const newHiddenState = !product.isHidden;
    
    setProducts(prev => prev.map(p => 
      p.id === productId ? { ...p, isHidden: newHiddenState } : p
    ));
    setHasUnsavedChanges(true);
  };

  const toggleFeatured = (productId: string) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    const newFeaturedState = !product.isFeatured;
    
    setProducts(prev => prev.map(p => 
      p.id === productId ? { ...p, isFeatured: newFeaturedState } : p
    ));
    setHasUnsavedChanges(true);
  };

  const updateSuggestedProducts = (productId: string, suggestedIds: string[]) => {
    setProducts(prev => prev.map(p => 
      p.id === productId ? { ...p, suggestedProducts: suggestedIds } : p
    ));
    setHasUnsavedChanges(true);
  };

  const saveAllChanges = async () => {
    setIsSaving(true);
    console.log('🟢 Starting save process...');
    console.log('Current products:', products);
    console.log('Original products:', originalProducts);
    
    try {
      // Prepare all updates - use Promise.all for better performance
      const updates: Array<{
        id: string;
        display_order: number;
        is_hidden: boolean;
        is_featured: boolean;
        suggested_products: string[];
        hasChanges: boolean;
      }> = [];

      for (let index = 0; index < products.length; index++) {
        const product = products[index];
        const original = originalProducts.find(op => op.id === product.id);
        
        const hasChanges = !original || (
          original.displayOrder !== index ||
          original.isHidden !== product.isHidden ||
          original.isFeatured !== product.isFeatured ||
          JSON.stringify(original.suggestedProducts || []) !== JSON.stringify(product.suggestedProducts || [])
        );
        
        console.log(`Product ${product.name}:`, {
          id: product.id,
          hasChanges,
          changes: {
            displayOrder: { from: original?.displayOrder, to: index },
            isHidden: { from: original?.isHidden, to: product.isHidden },
            isFeatured: { from: original?.isFeatured, to: product.isFeatured },
            suggestedProducts: { from: original?.suggestedProducts, to: product.suggestedProducts }
          }
        });

        if (hasChanges) {
          updates.push({
            id: product.id,
            display_order: index,
            is_hidden: product.isHidden,
            is_featured: product.isFeatured,
            suggested_products: product.suggestedProducts || [],
            hasChanges: true
          });
        }
      }

      console.log('Updates to be processed:', updates);

      if (updates.length === 0) {
        console.log('🟡 No changes to save');
        alert('لا توجد تغييرات للحفظ');
        setIsSaving(false);
        return;
      }

      // Update database using Promise.all for better performance
      console.log('🔄 Updating database...');
      const updatePromises = updates.map(async (update) => {
        console.log(`Updating product ${update.id}:`, {
          display_order: update.display_order,
          is_hidden: update.is_hidden,
          is_featured: update.is_featured,
          suggested_products: update.suggested_products
        });
        
        const { data, error } = await supabase
          .from('products')
          .update({
            display_order: update.display_order,
            is_hidden: update.is_hidden,
            is_featured: update.is_featured,
            suggested_products: update.suggested_products,
            updated_at: new Date().toISOString()
          })
          .eq('id', update.id)
          .select('id, name');
        
        if (error) {
          console.error(`❌ Error updating product ${update.id}:`, error);
          throw new Error(`Failed to update product ${update.id}: ${error.message}`);
        }
        
        console.log(`✅ Successfully updated product ${update.id}:`, data);
        return { id: update.id, success: true, data };
      });

      // Execute all updates in parallel
      const results = await Promise.all(updatePromises);
      const successCount = results.filter(r => r.success).length;
      
      console.log(`🎉 Successfully updated ${successCount} products`);
      
      // Update original products state to match current state
      setOriginalProducts(JSON.parse(JSON.stringify(products)));
      setHasUnsavedChanges(false);
      
      alert(`تم حفظ ${successCount} تغيير بنجاح!`);
      
      // Optional: Refresh data without full page reload
      setTimeout(() => {
        window.location.reload();
      }, 1000);
      
    } catch (error) {
      console.error('❌ Error saving changes:', error);
      const errorMessage = error instanceof Error ? error.message : 'خطأ غير معروف';
      alert(`حدث خطأ أثناء حفظ التغييرات: ${errorMessage}`);
    } finally {
      setIsSaving(false);
    }
  };

  const discardChanges = () => {
    if (!hasUnsavedChanges) return;
    
    if (confirm('هل أنت متأكد من إلغاء جميع التغييرات؟')) {
      setProducts(JSON.parse(JSON.stringify(originalProducts)));
      setHasUnsavedChanges(false);
      setIsDragMode(false);
    }
  };

  const handleReorder = (reorderedProducts: ProductManagementItem[]) => {
    setProducts(reorderedProducts);
    setHasUnsavedChanges(true);
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
                  onClick={saveAllChanges}
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

      {/* Save Changes Bar */}
      {hasUnsavedChanges && (
        <div className="sticky top-0 z-40 bg-amber-50 border-b-2 border-amber-200 px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-amber-500 rounded-full animate-pulse"></div>
              <span className="text-amber-800 font-semibold">
                لديك تغييرات غير محفوظة
              </span>
              <span className="text-sm text-amber-600">
                احفظ التغييرات لتطبيقها على المتجر
              </span>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={discardChanges}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                disabled={isSaving}
              >
                إلغاء التغييرات
              </button>
              <button
                onClick={saveAllChanges}
                disabled={isSaving}
                className="px-6 py-2 text-white font-semibold rounded-lg transition-colors flex items-center gap-2"
                style={{
                  backgroundColor: '#5D1F1F'
                }}
                onMouseEnter={(e) => {
                  if (!isSaving) (e.target as HTMLButtonElement).style.backgroundColor = '#4A1616';
                }}
                onMouseLeave={(e) => {
                  if (!isSaving) (e.target as HTMLButtonElement).style.backgroundColor = '#5D1F1F';
                }}
              >
                {isSaving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    جاري الحفظ...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    حفظ جميع التغييرات
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

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
                <li><strong>⚠️ مهم:</strong> جميع التغييرات تتطلب الضغط على زر &quot;حفظ التغييرات&quot; لتطبيقها على المتجر</li>
              </ul>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}