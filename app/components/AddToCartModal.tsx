'use client'

import { useState } from 'react'
import { XMarkIcon, PlusIcon, MinusIcon, ShoppingCartIcon } from '@heroicons/react/24/outline'

interface AddToCartModalProps {
  isOpen: boolean
  onClose: () => void
  product: any
  onAddToCart: (product: any, quantity: number, selectedColor?: string) => void
  isTransferMode?: boolean
}

export default function AddToCartModal({ isOpen, onClose, product, onAddToCart, isTransferMode = false }: AddToCartModalProps) {
  const [quantity, setQuantity] = useState(1)
  const [selectedColor, setSelectedColor] = useState<string | null>(null)
  const [isEditingQuantity, setIsEditingQuantity] = useState(false)
  const [tempQuantity, setTempQuantity] = useState('1')

  if (!isOpen || !product) return null

  const handleQuantityChange = (change: number) => {
    const newQuantity = Math.max(1, quantity + change)
    setQuantity(newQuantity)
    setTempQuantity(newQuantity.toString())
  }

  const handleQuantityClick = () => {
    setIsEditingQuantity(true)
    setTempQuantity(quantity.toString())
  }

  const handleQuantityInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    // Only allow numbers
    if (value === '' || /^\d+$/.test(value)) {
      setTempQuantity(value)
    }
  }

  const handleQuantityInputBlur = () => {
    const numValue = parseInt(tempQuantity) || 1
    const finalQuantity = Math.max(1, numValue)
    setQuantity(finalQuantity)
    setTempQuantity(finalQuantity.toString())
    setIsEditingQuantity(false)
  }

  const handleQuantityInputKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleQuantityInputBlur()
    } else if (e.key === 'Escape') {
      setTempQuantity(quantity.toString())
      setIsEditingQuantity(false)
    }
  }

  const handleAddToCart = () => {
    onAddToCart(product, quantity, selectedColor || undefined)
    onClose()
    setQuantity(1)
    setSelectedColor(null)
    setTempQuantity('1')
    setIsEditingQuantity(false)
  }

  const colors = [
    { name: 'أزرق', color: '#3B82F6' },
    { name: 'أحمر', color: '#EF4444' },
    { name: 'أخضر', color: '#10B981' },
    { name: 'أصفر', color: '#F59E0B' },
    { name: 'بنفسجي', color: '#8B5CF6' },
    { name: 'وردي', color: '#EC4899' }
  ]

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50" onClick={onClose} />
      
      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-[#2B3544] rounded-2xl shadow-2xl border border-[#4A5568] w-full max-w-md">
          
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-[#4A5568]">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isTransferMode ? 'bg-orange-600' : 'bg-blue-600'}`}>
                <ShoppingCartIcon className="h-5 w-5 text-white" />
              </div>
              <h2 className="text-lg font-bold text-white">
                {isTransferMode ? 'إضافة للنقل' : 'إضافة للسلة'}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-600/30 rounded-full transition-colors"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            
            {/* Product Info */}
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-[#374151] rounded-lg flex items-center justify-center overflow-hidden">
                {product.main_image_url ? (
                  <img
                    src={product.main_image_url}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center">
                    <span className="text-lg">😊</span>
                  </div>
                )}
              </div>
              <div className="flex-1">
                <h3 className="text-white font-medium text-sm">{product.name}</h3>
                {!isTransferMode && (
                  <p className="text-blue-400 font-bold text-lg">{(product.price || 0).toFixed(2)} ريال</p>
                )}
                {isTransferMode && (
                  <p className="text-orange-400 font-bold text-sm">وضع النقل</p>
                )}
              </div>
            </div>

            {/* Quantity Selector */}
            <div className="space-y-3">
              <label className="text-gray-300 text-sm">الكمية</label>
              <div className="flex items-center justify-center gap-4">
                <button
                  onClick={() => handleQuantityChange(-1)}
                  className="w-10 h-10 bg-[#374151] hover:bg-[#4B5563] rounded-full flex items-center justify-center transition-colors"
                >
                  <MinusIcon className="h-4 w-4 text-white" />
                </button>
                <div className="bg-[#374151] rounded-lg px-6 py-3 min-w-[80px] text-center">
                  {isEditingQuantity ? (
                    <input
                      type="text"
                      value={tempQuantity}
                      onChange={handleQuantityInputChange}
                      onBlur={handleQuantityInputBlur}
                      onKeyDown={handleQuantityInputKeyPress}
                      className="bg-transparent text-white font-bold text-xl text-center outline-none w-full"
                      autoFocus
                      onFocus={(e) => e.target.select()}
                    />
                  ) : (
                    <span 
                      className="text-white font-bold text-xl cursor-pointer hover:bg-[#4B5563] rounded px-2 py-1 transition-colors"
                      onClick={handleQuantityClick}
                      title="اضغط للتحرير"
                    >
                      {quantity}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => handleQuantityChange(1)}
                  className="w-10 h-10 bg-[#374151] hover:bg-[#4B5563] rounded-full flex items-center justify-center transition-colors"
                >
                  <PlusIcon className="h-4 w-4 text-white" />
                </button>
              </div>
            </div>

            {/* Color Selection */}
            <div className="space-y-3">
              <label className="text-gray-300 text-sm">اللون</label>
              <div className="grid grid-cols-3 gap-3">
                {colors.map((color) => (
                  <button
                    key={color.name}
                    onClick={() => setSelectedColor(color.name)}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      selectedColor === color.name
                        ? 'border-blue-500 bg-blue-500/10'
                        : 'border-[#4A5568] hover:border-gray-500'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="w-4 h-4 rounded-full border border-gray-600"
                        style={{ backgroundColor: color.color }}
                      />
                      <span className="text-white text-xs">{color.name}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

          </div>

          {/* Footer */}
          <div className="p-6 border-t border-[#4A5568] space-y-3">
            {!isTransferMode && (
              <div className="flex justify-between items-center">
                <span className="text-gray-400">المجموع</span>
                <span className="text-white font-bold text-xl">
                  {((product.price || 0) * quantity).toFixed(2)} ريال
                </span>
              </div>
            )}
            <button
              onClick={handleAddToCart}
              className={`w-full py-3 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2 text-white ${
                isTransferMode 
                  ? 'bg-orange-600 hover:bg-orange-700' 
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              <ShoppingCartIcon className="h-5 w-5" />
              {isTransferMode ? 'إضافة للنقل' : 'إضافة للسلة'}
            </button>
          </div>

        </div>
      </div>
    </>
  )
}