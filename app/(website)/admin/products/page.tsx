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
      <header className="border-b border-gray-700 py-4" style={{backgroundColor: '#5d1f1f'}}>
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="text-white hover:text-red-300 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="text-2xl font-bold text-white">إدارة المنتجات</h1>
          </div>
          
          <div className="flex items-center gap-3">
            {isDragMode && (
              <button
                onClick={saveOrder}
                disabled={isSaving}
                className="bg-green-600 hover:bg-green-700 disabled:bg-gray-500 px-4 py-2 rounded-lg text-white font-medium transition-colors"
              >
                {isSaving ? 'جاري الحفظ...' : 'حفظ الترتيب'}
              </button>
            )}
            <button
              onClick={toggleDragMode}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                isDragMode 
                  ? 'bg-yellow-600 hover:bg-yellow-700 text-white' 
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              {isDragMode ? 'إلغاء تبديل المراكز' : 'تبديل المراكز'}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <DragDropProvider>
          <ProductManagementGrid
            products={products}
            isDragMode={isDragMode}
            onReorder={handleReorder}
            onToggleVisibility={toggleVisibility}
            onToggleFeatured={toggleFeatured}
            onUpdateSuggestedProducts={updateSuggestedProducts}
          />
        </DragDropProvider>
      </main>

      {/* Instructions */}
      <div className="max-w-7xl mx-auto px-6 pb-8">
        <div className="bg-white rounded-lg p-6 border border-gray-300 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">تعليمات الاستخدام:</h3>
          <ul className="list-disc pr-5 space-y-2 text-gray-600">
            <li><strong>تبديل المراكز:</strong> اضغط على زر "تبديل المراكز" لتفعيل خاصية السحب والإفلات، ثم اسحب المنتجات لإعادة ترتيبها</li>
            <li><strong>إخفاء/إظهار:</strong> استخدم مفتاح "مخفي من المتجر" لإخفاء أو إظهار المنتج في الموقع</li>
            <li><strong>المنتجات المميزة:</strong> فعل مفتاح "منتج مميز" لإضافة المنتج لقسم المنتجات المميزة</li>
            <li><strong>المنتجات المقترحة:</strong> اضغط على "إدارة المقترحات" لتحديد المنتجات التي ستظهر كمقترحات مع هذا المنتج</li>
          </ul>
        </div>
      </div>
    </div>
  );
}