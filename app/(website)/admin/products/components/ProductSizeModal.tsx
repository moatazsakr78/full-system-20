'use client';

import { useState, useEffect, useRef } from 'react';
import { useProductSizeGroups, CreateProductSizeGroupData } from '../../../../../lib/hooks/useProductSizeGroups';

interface ProductSizeStep {
  sizeName: string;
  productId: string | null;
  productData?: any;
}

interface ProductSizeModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: any[];
  onSizeGroupCreated: () => void;
}

export default function ProductSizeModal({
  isOpen,
  onClose,
  products,
  onSizeGroupCreated
}: ProductSizeModalProps) {
  const { createSizeGroup, isLoading: isCreating, error } = useProductSizeGroups();

  const [step, setStep] = useState<'sizeCount' | 'sizeNames' | 'productSelection'>('sizeCount');
  const [sizeCount, setSizeCount] = useState<number>(0);
  const [sizeSteps, setSizeSteps] = useState<ProductSizeStep[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isProductBrowserOpen, setIsProductBrowserOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [groupDescription, setGroupDescription] = useState('');

  // Scroll state for hiding tabs section based on content scroll
  const [isTabsHidden, setIsTabsHidden] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Reset modal state when opened/closed
  useEffect(() => {
    if (isOpen) {
      setStep('sizeCount');
      setSizeCount(0);
      setSizeSteps([]);
      setCurrentStepIndex(0);
      setSearchTerm('');
      setIsProcessing(false);
      setGroupName('');
      setGroupDescription('');
      setIsTabsHidden(false);
      setLastScrollY(0);
    }
  }, [isOpen]);

  // Handle scroll to hide/show tabs section like in the main page
  const handleScroll = () => {
    if (!scrollRef.current) return;

    const currentScrollY = scrollRef.current.scrollTop;
    const threshold = 10; // Minimum scroll to trigger hide/show

    if (Math.abs(currentScrollY - lastScrollY) < threshold) return;

    if (currentScrollY > lastScrollY && currentScrollY > 50) {
      // Scrolling down and past threshold - hide tabs
      if (!isTabsHidden) {
        setIsTabsHidden(true);
      }
    } else if (currentScrollY < lastScrollY) {
      // Scrolling up - show tabs
      if (isTabsHidden) {
        setIsTabsHidden(false);
      }
    }

    setLastScrollY(currentScrollY);
  };

  // Handle size count submission
  const handleSizeCountSubmit = () => {
    if (!groupName.trim()) {
      alert('يجب إدخال اسم مجموعة الأحجام');
      return;
    }

    if (sizeCount < 2 || sizeCount > 10) {
      alert('يجب إدخال عدد من 2 إلى 10 مقاسات');
      return;
    }

    const initialSteps: ProductSizeStep[] = Array.from({ length: sizeCount }, () => ({
      sizeName: '',
      productId: null
    }));

    setSizeSteps(initialSteps);
    setStep('sizeNames');
  };

  // Handle size names submission
  const handleSizeNamesSubmit = () => {
    const hasEmptyNames = sizeSteps.some(step => !step.sizeName.trim());
    if (hasEmptyNames) {
      alert('يجب إدخال أسماء جميع المقاسات');
      return;
    }

    setStep('productSelection');
    setCurrentStepIndex(0);
  };

  // Handle product selection
  const handleProductSelect = (product: any) => {
    const updatedSteps = [...sizeSteps];
    updatedSteps[currentStepIndex] = {
      ...updatedSteps[currentStepIndex],
      productId: product.id,
      productData: product
    };
    setSizeSteps(updatedSteps);
    setIsProductBrowserOpen(false);

    // Move to next step or finish
    if (currentStepIndex < sizeSteps.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1);
    }
  };

  // Navigation functions
  const goToStep = (index: number) => {
    setCurrentStepIndex(index);
  };

  const goToPreviousStep = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(currentStepIndex - 1);
    }
  };

  const goToNextStep = () => {
    if (currentStepIndex < sizeSteps.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1);
    }
  };

  // Handle final save
  const handleSave = async () => {
    const hasEmptyProducts = sizeSteps.some(step => !step.productId);
    if (hasEmptyProducts) {
      alert('يجب اختيار منتج لكل مقاس');
      return;
    }

    if (!groupName.trim()) {
      alert('يجب إدخال اسم مجموعة الأحجام');
      return;
    }

    setIsProcessing(true);
    try {
      // Prepare size group data
      const sizeGroupData: CreateProductSizeGroupData = {
        name: groupName.trim(),
        description: groupDescription.trim() || undefined,
        items: sizeSteps.map((step, index) => ({
          product_id: step.productId!,
          size_name: step.sizeName,
          sort_order: index + 1
        }))
      };

      await createSizeGroup(sizeGroupData);

      alert('تم حفظ مجموعة أحجام المنتج بنجاح!');
      onSizeGroupCreated();
      onClose();
    } catch (error) {
      console.error('Error saving product size group:', error);
      alert('حدث خطأ أثناء حفظ مجموعة الأحجام: ' + (error instanceof Error ? error.message : 'خطأ غير معروف'));
    } finally {
      setIsProcessing(false);
    }
  };

  // Filter products for search
  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 md:p-4" style={{ touchAction: 'none' }}>
      <div
        className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[95vh] md:h-[90vh] flex flex-col overflow-hidden"
        style={{ touchAction: 'auto' }}
      >

        {/* Header - Mobile optimized */}
        <div className="flex items-center justify-between p-3 md:p-6 border-b border-gray-200 flex-shrink-0">
          <h2 className="text-base md:text-xl font-bold text-gray-800">إضافة مجموعة أحجام للمنتج</h2>
          <button
            onClick={onClose}
            disabled={isProcessing || isCreating}
            className="text-gray-400 hover:text-gray-600 disabled:text-gray-300 text-xl md:text-2xl min-w-[40px] min-h-[40px] flex items-center justify-center"
          >
            ×
          </button>
        </div>

        {/* Error Display - Mobile optimized */}
        {error && (
          <div className="mx-3 md:mx-6 mt-2 md:mt-4 p-3 md:p-4 bg-red-50 border border-red-200 rounded-lg flex-shrink-0">
            <div className="flex items-center">
              <svg className="w-4 md:w-5 h-4 md:h-5 text-red-500 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 19c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <p className="text-red-700 text-xs md:text-sm">{error}</p>
            </div>
          </div>
        )}

        {/* Content - Mobile optimized layout */}
        <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
          {/* Left Sidebar - Steps - Mobile: horizontal, Desktop: vertical */}
          <div className="md:w-1/4 bg-gray-50 border-b md:border-l md:border-b-0 border-gray-200 p-2 md:p-4 flex-shrink-0">
            <h3 className="font-semibold mb-2 md:mb-4 text-gray-700 text-sm md:text-base">خطوات الإنشاء</h3>
            <div className="flex md:flex-col space-x-2 md:space-x-0 md:space-y-2 overflow-x-auto md:overflow-x-visible">
              <div className={`p-2 md:p-3 rounded-lg text-xs md:text-sm whitespace-nowrap md:whitespace-normal ${
                step === 'sizeCount' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-600'
              }`}>
                1. عدد المقاسات
              </div>
              <div className={`p-2 md:p-3 rounded-lg text-xs md:text-sm whitespace-nowrap md:whitespace-normal ${
                step === 'sizeNames' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-600'
              }`}>
                2. أسماء المقاسات
              </div>
              <div className={`p-2 md:p-3 rounded-lg text-xs md:text-sm whitespace-nowrap md:whitespace-normal ${
                step === 'productSelection' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-600'
              }`}>
                3. اختيار المنتجات
              </div>
            </div>

            {/* Size Steps Progress - Mobile: horizontal scroll */}
            {step === 'productSelection' && sizeSteps.length > 0 && (
              <div className="mt-3 md:mt-6">
                <h4 className="font-semibold mb-2 md:mb-3 text-gray-700 text-sm md:text-base">المقاسات:</h4>
                <div className="flex md:flex-col space-x-2 md:space-x-0 md:space-y-2 overflow-x-auto md:overflow-x-visible">
                  {sizeSteps.map((sizeStep, index) => (
                    <button
                      key={index}
                      onClick={() => goToStep(index)}
                      className={`p-2 rounded text-xs md:text-sm text-right whitespace-nowrap md:whitespace-normal min-w-[80px] md:min-w-0 md:w-full ${
                        index === currentStepIndex
                          ? 'bg-blue-500 text-white'
                          : sizeStep.productId
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {sizeStep.sizeName}
                      {sizeStep.productId && (
                        <div className="text-xs mt-1 opacity-75">
                          ✓ تم الاختيار
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Main Content - Mobile optimized scrolling */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Tabs Section - Hidden on scroll down */}
            <div
              className={`bg-white border-b border-gray-300 flex-shrink-0 transition-all duration-300 ease-in-out ${
                isTabsHidden ? 'transform -translate-y-full opacity-0 h-0 overflow-hidden' : 'transform translate-y-0 opacity-100'
              }`}
            >
              <div className="flex items-center justify-between p-3 md:p-4 pb-0">
                <h3 className="text-base md:text-lg font-semibold text-gray-800">إعداد مجموعة الأحجام</h3>
              </div>
              <div className="px-3 md:px-4">
                <div className="flex space-x-6">
                  <div className="pb-3 border-b-2 border-blue-500">
                    <span className="text-sm md:text-base text-blue-600 font-medium">
                      {step === 'sizeCount' ? 'معلومات المجموعة' :
                       step === 'sizeNames' ? 'أسماء المقاسات' :
                       'اختيار المنتجات'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Scrollable Content Area with tabs hide/show */}
            <div
              ref={scrollRef}
              onScroll={handleScroll}
              className="flex-1 p-3 md:p-6 overflow-y-auto scrollbar-hide"
              style={{
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
                WebkitScrollbar: 'none',
                touchAction: 'pan-y'
              } as React.CSSProperties}
            >
            {/* Step 1: Size Count - Mobile optimized */}
            {step === 'sizeCount' && (
              <div className="max-w-md mx-auto">
                <h3 className="text-base md:text-lg font-semibold mb-3 md:mb-4">معلومات مجموعة الأحجام</h3>
                <p className="text-gray-600 mb-4 md:mb-6 text-xs md:text-sm">أدخل معلومات المجموعة وعدد المقاسات المختلفة</p>

                <div className="mb-3 md:mb-4">
                  <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1 md:mb-2">
                    اسم مجموعة الأحجام *
                  </label>
                  <input
                    type="text"
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    className="w-full px-2 md:px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="مثال: أطباق متنوعة الأحجام"
                  />
                </div>

                <div className="mb-3 md:mb-4">
                  <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1 md:mb-2">
                    وصف المجموعة (اختياري)
                  </label>
                  <textarea
                    value={groupDescription}
                    onChange={(e) => setGroupDescription(e.target.value)}
                    className="w-full px-2 md:px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    rows={3}
                    placeholder="وصف مختصر لمجموعة الأحجام"
                  />
                </div>

                <div className="mb-4 md:mb-6">
                  <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1 md:mb-2">
                    عدد المقاسات (من 2 إلى 10)
                  </label>
                  <input
                    type="number"
                    min="2"
                    max="10"
                    value={sizeCount || ''}
                    onChange={(e) => setSizeCount(Number(e.target.value))}
                    className="w-full px-2 md:px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="أدخل عدد المقاسات"
                  />
                </div>

                <button
                  onClick={handleSizeCountSubmit}
                  disabled={!groupName.trim() || !sizeCount || sizeCount < 2 || sizeCount > 10}
                  className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white px-4 py-2 rounded-md transition-colors text-sm"
                >
                  التالي
                </button>
              </div>
            )}

            {/* Step 2: Size Names */}
            {step === 'sizeNames' && (
              <div className="max-w-2xl mx-auto">
                <h3 className="text-lg font-semibold mb-4">أسماء المقاسات</h3>
                <p className="text-gray-600 mb-6">أدخل اسم كل مقاس (مثال: صغير، وسط، كبير أو 20، 22، 24)</p>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  {sizeSteps.map((step, index) => (
                    <div key={index}>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        المقاس {index + 1}
                      </label>
                      <input
                        type="text"
                        value={step.sizeName}
                        onChange={(e) => {
                          const updatedSteps = [...sizeSteps];
                          updatedSteps[index] = { ...updatedSteps[index], sizeName: e.target.value };
                          setSizeSteps(updatedSteps);
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder={`اسم المقاس ${index + 1}`}
                      />
                    </div>
                  ))}
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setStep('sizeCount')}
                    className="flex-1 bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-md transition-colors"
                  >
                    السابق
                  </button>
                  <button
                    onClick={handleSizeNamesSubmit}
                    className="flex-1 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md transition-colors"
                  >
                    التالي
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Product Selection */}
            {step === 'productSelection' && (
              <div>
                <h3 className="text-lg font-semibold mb-4">
                  اختيار المنتج للمقاس: {sizeSteps[currentStepIndex]?.sizeName}
                </h3>

                {/* Current Step Info */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-blue-800 font-medium">
                        المقاس الحالي: {sizeSteps[currentStepIndex]?.sizeName}
                      </span>
                      <span className="text-blue-600 text-sm mr-4">
                        ({currentStepIndex + 1} من {sizeSteps.length})
                      </span>
                    </div>
                    {sizeSteps[currentStepIndex]?.productData && (
                      <div className="text-green-600 text-sm">
                        ✓ تم اختيار: {sizeSteps[currentStepIndex].productData.name}
                      </div>
                    )}
                  </div>
                </div>

                {/* Product Selection */}
                <div className="mb-4">
                  <div className="flex gap-3 mb-4">
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="البحث في المنتجات..."
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      onClick={() => setIsProductBrowserOpen(true)}
                      className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-md transition-colors"
                    >
                      تصفح
                    </button>
                  </div>

                  {/* Product Grid */}
                  <div className="grid grid-cols-4 gap-4 max-h-96 overflow-y-auto">
                    {filteredProducts.map((product) => (
                      <button
                        key={product.id}
                        onClick={() => handleProductSelect(product)}
                        className={`p-3 border rounded-lg text-right hover:shadow-md transition-all ${
                          sizeSteps[currentStepIndex]?.productId === product.id
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        {product.image && (
                          <img
                            src={product.image}
                            alt={product.name}
                            className="w-full h-24 object-cover rounded mb-2"
                          />
                        )}
                        <div className="text-sm font-medium truncate">{product.name}</div>
                        <div className="text-xs text-gray-500">{product.price} ريال</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Navigation */}
                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => setStep('sizeNames')}
                    className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-md transition-colors"
                  >
                    السابق
                  </button>

                  {currentStepIndex > 0 && (
                    <button
                      onClick={goToPreviousStep}
                      className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md transition-colors"
                    >
                      المقاس السابق
                    </button>
                  )}

                  {currentStepIndex < sizeSteps.length - 1 ? (
                    <button
                      onClick={goToNextStep}
                      disabled={!sizeSteps[currentStepIndex]?.productId}
                      className="px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white rounded-md transition-colors"
                    >
                      المقاس التالي
                    </button>
                  ) : (
                    <button
                      onClick={handleSave}
                      disabled={isProcessing || isCreating || sizeSteps.some(step => !step.productId)}
                      className="px-6 py-2 bg-green-500 hover:bg-green-600 disabled:bg-gray-300 text-white rounded-md transition-colors"
                    >
                      {(isProcessing || isCreating) ? 'جاري الحفظ...' : 'حفظ مجموعة الأحجام'}
                    </button>
                  )}
                </div>
              </div>
            )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}