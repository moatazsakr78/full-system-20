'use client';

import { useState, useEffect, useRef } from 'react';
import { useStoreCategories, CreateStoreCategoryData } from '../../../../../lib/hooks/useStoreCategories';
import { uploadCategoryImage } from '../../../../../app/lib/supabase/storage';

interface ProductSelectionItem {
  id: string;
  name: string;
  image: string;
  category: string;
  isSelected: boolean;
}

interface AddStoreCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: any[];
  onCategoryCreated?: () => void;
}

export default function AddStoreCategoryModal({
  isOpen,
  onClose,
  products,
  onCategoryCreated
}: AddStoreCategoryModalProps) {
  const { createCategory } = useStoreCategories();
  const [isCreating, setIsCreating] = useState(false);

  // Form state - simplified
  const [categoryName, setCategoryName] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);

  // Image upload states
  const [isUploading, setIsUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Products selection state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
  const [selectAll, setSelectAll] = useState(false);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setCategoryName('');
      setImageUrl('');
      setImageFile(null);
      setSearchTerm('');
      setSelectedProducts(new Set());
      setSelectAll(false);
    }
  }, [isOpen]);

  // Filter products based on search
  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handle individual product selection
  const toggleProductSelection = (productId: string) => {
    const newSelected = new Set(selectedProducts);
    if (newSelected.has(productId)) {
      newSelected.delete(productId);
    } else {
      newSelected.add(productId);
    }
    setSelectedProducts(newSelected);

    // Update select all checkbox
    setSelectAll(newSelected.size === filteredProducts.length);
  };

  // Handle select all toggle
  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedProducts(new Set());
    } else {
      setSelectedProducts(new Set(filteredProducts.map(p => p.id)));
    }
    setSelectAll(!selectAll);
  };

  // Image upload functions
  const handleImageUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('يرجى اختيار ملف صورة صالح');
      return;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      alert('حجم الصورة يجب أن يكون أقل من 5 ميجابايت');
      return;
    }

    setIsUploading(true);
    try {
      const uploadedImageUrl = await uploadCategoryImage(file);
      setImageUrl(uploadedImageUrl);
      setImageFile(file);
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('حدث خطأ أثناء رفع الصورة');
    } finally {
      setIsUploading(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleImageUpload(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleImageUpload(files[0]);
    }
  };

  const removeImage = () => {
    setImageUrl('');
    setImageFile(null);
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!categoryName.trim()) {
      alert('يرجى إدخال اسم الفئة');
      return;
    }

    if (selectedProducts.size === 0) {
      if (!confirm('لم تقم بتحديد أي منتجات. هل تريد إنشاء فئة فارغة؟')) {
        return;
      }
    }

    setIsCreating(true);

    try {
      const categoryData: CreateStoreCategoryData = {
        name: categoryName.trim(),
        image_url: imageUrl.trim() || undefined,
        product_ids: Array.from(selectedProducts)
      };

      await createCategory(categoryData);

      alert(`تم إنشاء فئة "${categoryName}" بنجاح مع ${selectedProducts.size} منتج!`);

      if (onCategoryCreated) {
        onCategoryCreated();
      }

      onClose();
    } catch (error) {
      console.error('Error creating store category:', error);
      alert('حدث خطأ أثناء إنشاء الفئة. يرجى المحاولة مرة أخرى.');
    } finally {
      setIsCreating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={onClose} />

      {/* Modal */}
      <div className="fixed top-0 right-0 h-full w-[480px] bg-[#eaeaea] border-l border-gray-400 shadow-2xl z-50 transform transition-transform duration-300 ease-in-out">

        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-red-600 bg-[#5d1f1f]">
          <h2 className="text-lg font-bold text-white">إضافة فئة جديدة للمتجر</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-200 hover:text-white hover:bg-gray-600 rounded-full transition-colors"
            disabled={isCreating}
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex flex-col h-[calc(100vh-140px)] overflow-hidden">

          {/* Form Section */}
          <div className="p-4 bg-white border-b border-gray-300">
            {/* Category Name */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                اسم الفئة (مطلوب) *
              </label>
              <input
                type="text"
                value={categoryName}
                onChange={(e) => setCategoryName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-right"
                placeholder="أدخل اسم الفئة..."
                disabled={isCreating}
              />
            </div>

            {/* Category Image - Drag & Drop */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                صورة الفئة
              </label>
              <div className="relative">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                  id="category-image"
                />

                {!imageUrl ? (
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`flex items-center justify-center w-full px-4 py-8 bg-gray-50 border-2 border-dashed rounded-lg cursor-pointer transition-all ${
                      isDragOver
                        ? 'border-red-400 bg-red-50'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <div className="text-center">
                      {isUploading ? (
                        <>
                          <div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                          <span className="text-red-500 text-sm">جاري الرفع...</span>
                        </>
                      ) : (
                        <>
                          <svg className="h-8 w-8 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span className="text-gray-500 text-sm">
                            {isDragOver ? 'اتركها هنا' : 'اسحب الصورة هنا أو انقر للاختيار'}
                          </span>
                          <p className="text-xs text-gray-400 mt-1">PNG, JPG, GIF - حتى 5MB</p>
                        </>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="relative">
                    <img
                      src={imageUrl}
                      alt="صورة الفئة"
                      className="w-full h-32 object-cover rounded-lg border border-gray-300"
                    />
                    <button
                      type="button"
                      onClick={removeImage}
                      className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 transition-colors"
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                    <div className="absolute bottom-2 left-2 bg-black/70 text-white px-2 py-1 rounded text-xs">
                      {imageFile?.name || 'صورة مرفوعة'}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Products Selection Section */}
          <div className="flex-1 flex flex-col bg-gray-50">

            {/* Products Header */}
            <div className="p-4 bg-white border-b border-gray-300">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold text-gray-800">
                  اختر المنتجات ({selectedProducts.size} محدد)
                </h3>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectAll}
                    onChange={handleSelectAll}
                    className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                    disabled={isCreating}
                  />
                  <span className="text-sm text-gray-600">تحديد الكل</span>
                </label>
              </div>

              {/* Search */}
              <div className="relative">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-right text-sm"
                  placeholder="البحث في المنتجات..."
                  disabled={isCreating}
                />
                <svg className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>

            {/* Products List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2 scrollbar-hide">
              {filteredProducts.map((product) => (
                <div
                  key={product.id}
                  className={`flex items-center gap-3 p-3 bg-white rounded-lg border transition-colors cursor-pointer ${
                    selectedProducts.has(product.id)
                      ? 'border-red-300 bg-red-50'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                  onClick={() => !isCreating && toggleProductSelection(product.id)}
                >
                  <input
                    type="checkbox"
                    checked={selectedProducts.has(product.id)}
                    onChange={() => toggleProductSelection(product.id)}
                    className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                    disabled={isCreating}
                  />

                  <img
                    src={product.image || '/placeholder-product.svg'}
                    alt={product.name}
                    className="w-10 h-10 object-cover rounded-lg bg-gray-100"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/placeholder-product.svg';
                    }}
                  />

                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-gray-900 truncate text-sm">{product.name}</h4>
                    <p className="text-xs text-gray-500 truncate">{product.category}</p>
                  </div>

                  <div className="text-sm font-medium text-gray-600">
                    {product.price} ج.م
                  </div>
                </div>
              ))}

              {filteredProducts.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <p>لا توجد منتجات تطابق البحث</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-white border-t border-gray-300 flex justify-between items-center">
          <div className="text-sm text-gray-600">
            تم تحديد {selectedProducts.size} من {filteredProducts.length} منتج
          </div>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              disabled={isCreating}
            >
              إلغاء
            </button>

            <button
              onClick={handleSubmit}
              disabled={isCreating || !categoryName.trim()}
              className="px-6 py-2 text-white font-semibold rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                backgroundColor: !categoryName.trim() ? '#9CA3AF' : '#5D1F1F'
              }}
              onMouseEnter={(e) => {
                if (!isCreating && categoryName.trim()) {
                  (e.target as HTMLButtonElement).style.backgroundColor = '#4A1616';
                }
              }}
              onMouseLeave={(e) => {
                if (!isCreating && categoryName.trim()) {
                  (e.target as HTMLButtonElement).style.backgroundColor = '#5D1F1F';
                }
              }}
            >
              {isCreating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  جاري الإنشاء...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  إنشاء الفئة
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}