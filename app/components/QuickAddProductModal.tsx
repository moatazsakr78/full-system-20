'use client'

import { useState } from 'react'
import { XMarkIcon, PlusIcon, ShoppingCartIcon } from '@heroicons/react/24/outline'

interface QuickAddProductModalProps {
  isOpen: boolean
  onClose: () => void
  onAddToCart: (productData: any) => void
}

export default function QuickAddProductModal({ isOpen, onClose, onAddToCart }: QuickAddProductModalProps) {
  const [productName, setProductName] = useState('')
  const [productPrice, setProductPrice] = useState('')
  const [productCostPrice, setProductCostPrice] = useState('')
  const [productQuantity, setProductQuantity] = useState('1')
  const [productBarcode, setProductBarcode] = useState('')
  const [productDescription, setProductDescription] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)

  const resetForm = () => {
    setProductName('')
    setProductPrice('')
    setProductCostPrice('')
    setProductQuantity('1')
    setProductBarcode('')
    setProductDescription('')
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  const handleAddToCart = async () => {
    // Validate required fields
    if (!productName.trim()) {
      alert('يجب إدخال اسم المنتج')
      return
    }

    if (!productPrice || parseFloat(productPrice) <= 0) {
      alert('يجب إدخال سعر صحيح')
      return
    }

    const quantity = parseInt(productQuantity) || 1
    if (quantity <= 0) {
      alert('يجب إدخال كمية صحيحة')
      return
    }

    setIsProcessing(true)

    try {
      // Create temporary product data for cart
      const tempProductData = {
        id: `temp-${Date.now()}`, // Temporary ID
        name: productName.trim(),
        price: parseFloat(productPrice),
        cost_price: productCostPrice ? parseFloat(productCostPrice) : 0,
        barcode: productBarcode.trim() || null,
        description: productDescription.trim() || null,
        quantity: quantity,
        isNewProduct: true // Flag to indicate this is a new product
      }

      onAddToCart(tempProductData)
      handleClose()
    } catch (error: any) {
      alert(`خطأ في إضافة المنتج: ${error.message}`)
    } finally {
      setIsProcessing(false)
    }
  }

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" onClick={handleClose} />
      
      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-[#2B3544] rounded-2xl shadow-2xl border border-[#4A5568] w-full max-w-md max-h-[90vh] overflow-hidden">
          
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-[#4A5568]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center">
                <PlusIcon className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">إضافة منتج سريع</h2>
                <p className="text-gray-400 text-sm">إنشاء منتج جديد وإضافته للسلة</p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-600/30 rounded-full transition-colors"
              disabled={isProcessing}
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto scrollbar-hide">
            
            {/* Product Name */}
            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">
                اسم المنتج <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                className="w-full bg-[#374151] border border-[#4A5568] rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="أدخل اسم المنتج"
                disabled={isProcessing}
              />
            </div>

            {/* Price and Cost Price */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  سعر البيع <span className="text-red-400">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={productPrice}
                  onChange={(e) => setProductPrice(e.target.value)}
                  className="w-full bg-[#374151] border border-[#4A5568] rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0.00"
                  disabled={isProcessing}
                />
              </div>
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  سعر التكلفة
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={productCostPrice}
                  onChange={(e) => setProductCostPrice(e.target.value)}
                  className="w-full bg-[#374151] border border-[#4A5568] rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0.00"
                  disabled={isProcessing}
                />
              </div>
            </div>

            {/* Quantity and Barcode */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  الكمية
                </label>
                <input
                  type="number"
                  min="1"
                  value={productQuantity}
                  onChange={(e) => setProductQuantity(e.target.value)}
                  className="w-full bg-[#374151] border border-[#4A5568] rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={isProcessing}
                />
              </div>
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  الباركود
                </label>
                <input
                  type="text"
                  value={productBarcode}
                  onChange={(e) => setProductBarcode(e.target.value)}
                  className="w-full bg-[#374151] border border-[#4A5568] rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="اختياري"
                  disabled={isProcessing}
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">
                الوصف
              </label>
              <textarea
                value={productDescription}
                onChange={(e) => setProductDescription(e.target.value)}
                rows={3}
                className="w-full bg-[#374151] border border-[#4A5568] rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                placeholder="وصف المنتج (اختياري)"
                disabled={isProcessing}
              />
            </div>

            {/* Info Notice */}
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
              <p className="text-blue-400 text-sm flex items-center gap-2">
                <span className="text-blue-400">ℹ️</span>
                سيتم إنشاء المنتج وإضافته للسلة مباشرة. يمكن حفظه في قاعدة البيانات لاحقاً عند إنجاز الفاتورة.
              </p>
            </div>

          </div>

          {/* Footer */}
          <div className="p-6 border-t border-[#4A5568]">
            <div className="flex gap-3">
              <button
                onClick={handleClose}
                disabled={isProcessing}
                className="flex-1 bg-gray-600 hover:bg-gray-700 disabled:opacity-50 text-white py-3 rounded-lg font-medium transition-colors"
              >
                إلغاء
              </button>
              <button
                onClick={handleAddToCart}
                disabled={isProcessing || !productName.trim() || !productPrice}
                className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
              >
                {isProcessing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    جاري الإضافة...
                  </>
                ) : (
                  <>
                    <ShoppingCartIcon className="h-5 w-5" />
                    إضافة للسلة
                  </>
                )}
              </button>
            </div>
          </div>

        </div>
      </div>
    </>
  )
}