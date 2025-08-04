'use client'

import { useState, useEffect } from 'react'
import { XMarkIcon, PlusIcon, MinusIcon, ShoppingCartIcon } from '@heroicons/react/24/outline'

interface ColorSelectionModalProps {
  isOpen: boolean
  onClose: () => void
  product: any
  onAddToCart: (selections: any, totalQuantity: number, purchasePrice?: number) => void
  hasRequiredForCart?: boolean
  selectedBranchId?: string
  isPurchaseMode?: boolean
}

export default function ColorSelectionModal({ isOpen, onClose, product, onAddToCart, hasRequiredForCart = true, selectedBranchId, isPurchaseMode = false }: ColorSelectionModalProps) {
  const [selections, setSelections] = useState<{[key: string]: number}>({})
  const [totalQuantity, setTotalQuantity] = useState(1)
  const [isEditingQuantity, setIsEditingQuantity] = useState(false)
  const [tempQuantity, setTempQuantity] = useState('1')
  const [editingColorQuantity, setEditingColorQuantity] = useState<string | null>(null)
  const [tempColorQuantities, setTempColorQuantities] = useState<{[key: string]: string}>({})
  
  // Purchase mode specific state
  const [purchasePrice, setPurchasePrice] = useState(product?.cost_price || product?.price || 0)
  const [isEditingPrice, setIsEditingPrice] = useState(false)
  const [tempPrice, setTempPrice] = useState('')

  // Reset purchase price when product changes
  useEffect(() => {
    if (product && isPurchaseMode) {
      const initialPrice = product.cost_price || product.price || 0
      setPurchasePrice(initialPrice)
      setTempPrice(initialPrice.toString())
    }
  }, [product, isPurchaseMode])

  if (!isOpen || !product) return null

  // Get real color variants from the selected branch only
  // In purchase mode, we don't show colors as they are irrelevant
  const getProductColors = () => {
    // In purchase mode, always return empty array to disable color selection
    if (isPurchaseMode) {
      return []
    }
    const colors: any[] = []
    
    // Get color variants from selected branch only
    if (product.variantsData && selectedBranchId && product.variantsData[selectedBranchId]) {
      product.variantsData[selectedBranchId].forEach((variant: any) => {
        if (variant.variant_type === 'color') {
          // Check if color already exists in our list
          const existingColor = colors.find(c => c.name === variant.name)
          if (!existingColor) {
              // Try to get color from product colors table
              let colorValue = '#6B7280' // Default gray
              
              if (product.productColors) {
                const productColor = product.productColors.find((c: any) => c.name === variant.name)
                if (productColor?.color) {
                  colorValue = productColor.color
                }
              }
              
              // Try to parse color from variant value if it's JSON
              try {
                if (variant.value && variant.value.startsWith('{')) {
                  const valueData = JSON.parse(variant.value)
                  if (valueData.color) {
                    colorValue = valueData.color
                  }
                }
              } catch (e) {
                // If parsing fails, use default or existing color
              }

              // Extract image from multiple sources
              let imageUrl = variant.image_url || null
              
              // Try to get image from variant value JSON if not found in image_url
              if (!imageUrl) {
                try {
                  if (variant.value && variant.value.startsWith('{')) {
                    const valueData = JSON.parse(variant.value)
                    if (valueData.image) {
                      imageUrl = valueData.image
                    }
                  }
                } catch (e) {
                  // If parsing fails, use null
                }
              }

              colors.push({
                name: variant.name,
                color: colorValue,
                availableQuantity: variant.quantity || 0,
                image: imageUrl
              })
            }
          }
        })
    }
    
    return colors
  }

  const colors = getProductColors()

  const handleQuantityChange = (colorName: string, change: number) => {
    setSelections(prev => {
      const current = prev[colorName] || 0
      const color = colors.find(c => c.name === colorName)
      const maxAvailable = color?.availableQuantity || 0
      
      let newValue = Math.max(0, current + change)
      
      // Don't allow exceeding available stock for this color
      if (newValue > maxAvailable) {
        newValue = maxAvailable
      }
      
      if (newValue === 0) {
        const { [colorName]: removed, ...rest } = prev
        return rest
      }
      
      return { ...prev, [colorName]: newValue }
    })
  }

  const selectedQuantity = Object.values(selections).reduce((sum, qty) => sum + qty, 0)
  const totalPrice = totalQuantity * (isPurchaseMode ? purchasePrice : (product.price || 0))

  // Calculate validation logic for selected branch only
  const getValidationInfo = (selectedBranchId?: string) => {
    if (colors.length === 0) {
      // No colors available, allow any quantity
      return { isValid: true, message: '', unassignedNeeded: 0, unassignedAvailable: 0 }
    }

    // If no branch is selected, we cannot validate properly
    if (!selectedBranchId) {
      return {
        isValid: false,
        message: 'يجب تحديد الفرع أولاً',
        unassignedNeeded: 0,
        unassignedAvailable: 0
      }
    }

    // Calculate inventory and assigned quantities for SELECTED BRANCH ONLY
    let branchInventoryQuantity = 0
    let branchAssignedQuantity = 0

    // Get inventory for selected branch only
    if (product.inventoryData && product.inventoryData[selectedBranchId]) {
      branchInventoryQuantity = product.inventoryData[selectedBranchId]?.quantity || 0
    }

    // Get assigned color quantities for selected branch only
    if (product.variantsData && product.variantsData[selectedBranchId]) {
      product.variantsData[selectedBranchId].forEach((variant: any) => {
        if (variant.variant_type === 'color') {
          branchAssignedQuantity += variant.quantity || 0
        }
      })
    }

    const unassignedQuantity = branchInventoryQuantity - branchAssignedQuantity
    const unassignedNeeded = totalQuantity - selectedQuantity

    if (selectedQuantity > totalQuantity) {
      return { 
        isValid: false, 
        message: 'الكمية المحددة للألوان أكبر من الكمية المطلوبة',
        unassignedNeeded: 0,
        unassignedAvailable: unassignedQuantity
      }
    }

    if (unassignedNeeded > 0) {
      if (unassignedNeeded > unassignedQuantity) {
        return { 
          isValid: false, 
          message: `نقص في الكمية غير المحددة في هذا الفرع. مطلوب: ${unassignedNeeded}, متوفر: ${unassignedQuantity}`,
          unassignedNeeded,
          unassignedAvailable: unassignedQuantity
        }
      }
    }

    return { 
      isValid: true, 
      message: '', 
      unassignedNeeded,
      unassignedAvailable: unassignedQuantity
    }
  }

  const validationInfo = getValidationInfo(selectedBranchId)

  const handleAddToCart = () => {
    if (totalQuantity > 0 && validationInfo.isValid) {
      // In purchase mode, pass purchase price as a third parameter
      if (isPurchaseMode) {
        onAddToCart(selections, totalQuantity, purchasePrice)
      } else {
        onAddToCart(selections, totalQuantity)
      }
      onClose()
      setSelections({})
      setTotalQuantity(1)
      setTempQuantity('1')
      setIsEditingQuantity(false)
      setEditingColorQuantity(null)
      setTempColorQuantities({})
    }
  }

  const handleTotalQuantityChange = (change: number) => {
    const newQuantity = Math.max(1, totalQuantity + change)
    setTotalQuantity(newQuantity)
    setTempQuantity(newQuantity.toString())
  }

  const handleQuantityClick = () => {
    setIsEditingQuantity(true)
    setTempQuantity(totalQuantity.toString())
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
    setTotalQuantity(finalQuantity)
    setTempQuantity(finalQuantity.toString())
    setIsEditingQuantity(false)
  }

  const handleQuantityInputKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleQuantityInputBlur()
    } else if (e.key === 'Escape') {
      setTempQuantity(totalQuantity.toString())
      setIsEditingQuantity(false)
    }
  }

  const handleColorQuantityClick = (colorName: string) => {
    setEditingColorQuantity(colorName)
    const currentQuantity = selections[colorName] || 0
    setTempColorQuantities(prev => ({ ...prev, [colorName]: currentQuantity.toString() }))
  }

  const handleColorQuantityInputChange = (colorName: string, value: string) => {
    // Only allow numbers
    if (value === '' || /^\d+$/.test(value)) {
      setTempColorQuantities(prev => ({ ...prev, [colorName]: value }))
    }
  }

  const handleColorQuantityInputBlur = (colorName: string) => {
    const numValue = parseInt(tempColorQuantities[colorName]) || 0
    const color = colors.find(c => c.name === colorName)
    const maxAvailable = color?.availableQuantity || 0
    
    let finalQuantity = Math.max(0, numValue)
    
    // Don't allow exceeding available stock for this color
    if (finalQuantity > maxAvailable) {
      finalQuantity = maxAvailable
    }
    
    if (finalQuantity === 0) {
      const { [colorName]: removed, ...rest } = selections
      setSelections(rest)
    } else {
      setSelections(prev => ({ ...prev, [colorName]: finalQuantity }))
    }
    
    setEditingColorQuantity(null)
    setTempColorQuantities(prev => ({ ...prev, [colorName]: '' }))
  }

  const handleColorQuantityInputKeyPress = (colorName: string, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleColorQuantityInputBlur(colorName)
    } else if (e.key === 'Escape') {
      setEditingColorQuantity(null)
      setTempColorQuantities(prev => ({ ...prev, [colorName]: '' }))
    }
  }

  // Purchase price editing functions
  const handlePriceClick = () => {
    setIsEditingPrice(true)
    setTempPrice(purchasePrice.toString())
  }

  const handlePriceInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    // Allow numbers and decimal point
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setTempPrice(value)
    }
  }

  const handlePriceInputBlur = () => {
    const numValue = parseFloat(tempPrice) || 0
    const finalPrice = Math.max(0, numValue)
    setPurchasePrice(finalPrice)
    setTempPrice(finalPrice.toString())
    setIsEditingPrice(false)
  }

  const handlePriceInputKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handlePriceInputBlur()
    } else if (e.key === 'Escape') {
      setTempPrice(purchasePrice.toString())
      setIsEditingPrice(false)
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" onClick={onClose} />
      
      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-[#2B3544] rounded-2xl shadow-2xl border border-[#4A5568] w-full max-w-lg max-h-[90vh] overflow-hidden">
          
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-[#4A5568]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                <span className="text-white text-lg">🎨</span>
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">{product.name}</h2>
                <p className="text-blue-400 text-sm">
                  {isPurchaseMode ? 'وضع الشراء' : `${(product.price || 0).toFixed(2)} ريال`}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-600/30 rounded-full transition-colors"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto scrollbar-hide">
            
            {/* Total Quantity Selector */}
            <div className="bg-[#374151] rounded-xl p-4 border border-[#4A5568]">
              <label className="text-gray-300 text-sm mb-3 block">الكمية الإجمالية</label>
              <div className="flex items-center justify-between gap-4">
                
                {/* Product Image */}
                <div className="w-20 h-20 bg-[#2B3544] rounded-lg flex items-center justify-center overflow-hidden border border-[#4A5568] flex-shrink-0">
                  {product.main_image_url ? (
                    <img
                      src={product.main_image_url}
                      alt={product.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement
                        target.style.display = 'none'
                        target.nextElementSibling?.classList.remove('hidden')
                      }}
                    />
                  ) : null}
                  <div className={`w-10 h-10 bg-yellow-400 rounded-full flex items-center justify-center ${product.main_image_url ? 'hidden' : ''}`}>
                    <span className="text-lg">📦</span>
                  </div>
                </div>

                {/* Quantity Controls */}
                <div className="flex items-center gap-4 flex-1 justify-center">
                  <button
                    onClick={() => handleTotalQuantityChange(-1)}
                    className="w-10 h-10 bg-[#2B3544] hover:bg-[#4B5563] rounded-full flex items-center justify-center transition-colors"
                  >
                    <MinusIcon className="h-4 w-4 text-white" />
                  </button>
                  <div className="bg-[#2B3544] rounded-lg px-6 py-3 min-w-[80px] text-center">
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
                        className="text-white font-bold text-xl cursor-pointer hover:bg-[#374151] rounded px-2 py-1 transition-colors"
                        onClick={handleQuantityClick}
                        title="اضغط للتحرير"
                      >
                        {totalQuantity}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => handleTotalQuantityChange(1)}
                    className="w-10 h-10 bg-[#2B3544] hover:bg-[#4B5563] rounded-full flex items-center justify-center transition-colors"
                  >
                    <PlusIcon className="h-4 w-4 text-white" />
                  </button>
                </div>
              </div>
              
              <div className="text-center mt-3">
                <span className="text-blue-400 font-bold text-lg">{totalPrice.toFixed(2)} ريال</span>
              </div>
            </div>

            {/* Purchase Price Input - Only shown in purchase mode */}
            {isPurchaseMode && (
              <div className="bg-[#374151] rounded-xl p-4 border border-[#4A5568]">
                <label className="text-gray-300 text-sm mb-3 block">سعر الشراء للقطعة الواحدة</label>
                <div className="flex items-center justify-center gap-4">
                  <div className="bg-[#2B3544] rounded-lg px-6 py-3 min-w-[120px] text-center">
                    {isEditingPrice ? (
                      <input
                        type="text"
                        value={tempPrice}
                        onChange={handlePriceInputChange}
                        onBlur={handlePriceInputBlur}
                        onKeyDown={handlePriceInputKeyPress}
                        className="bg-transparent text-green-400 font-bold text-xl text-center outline-none w-full"
                        autoFocus
                        onFocus={(e) => e.target.select()}
                        placeholder="0.00"
                      />
                    ) : (
                      <span 
                        className="text-green-400 font-bold text-xl cursor-pointer hover:bg-[#374151] rounded px-2 py-1 transition-colors"
                        onClick={handlePriceClick}
                        title="اضغط للتحرير"
                      >
                        {purchasePrice.toFixed(2)} ريال
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-center mt-2">
                  <span className="text-gray-400 text-sm">اضغط على السعر لتعديله</span>
                </div>
              </div>
            )}

            {/* Color Selection Title */}
            {colors.length > 0 && (
              <div>
                <h3 className="text-white font-medium mb-3">اختيار الألوان (اختياري)</h3>
                <p className="text-gray-400 text-sm mb-4">يمكنك اختيار ألوان محددة أو ترك الاختيار للافتراضي</p>
                
                {/* Simple Validation Message */}
                {!validationInfo.isValid && (
                  <div className="mb-4 p-2 bg-red-500/10 border border-red-500/30 rounded-lg">
                    <p className="text-red-400 text-sm flex items-center gap-2">
                      <span className="text-red-400">⚠️</span>
                      {validationInfo.message}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Color Grid */}
            {colors.length > 0 ? (
              <div className="grid grid-cols-2 gap-4">
                {colors.map((color) => (
                  <div
                    key={color.name}
                    className="bg-[#374151] rounded-xl p-4 border border-[#4A5568] hover:border-gray-500 transition-all"
                  >
                    {/* Color Display */}
                    <div className="flex items-center gap-3 mb-3">
                      {/* Color Image */}
                      <div className="w-12 h-12 bg-[#2B3544] rounded-lg flex items-center justify-center overflow-hidden border border-[#4A5568] flex-shrink-0">
                        {color.image ? (
                          <img
                            src={color.image}
                            alt={color.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement
                              target.style.display = 'none'
                              target.nextElementSibling?.classList.remove('hidden')
                            }}
                          />
                        ) : null}
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center ${color.image ? 'hidden' : ''}`} style={{ backgroundColor: color.color }}>
                          <span className="text-xs" style={{ color: color.color === '#FFFFFF' || color.color === '#ffffff' ? '#000000' : '#FFFFFF' }}>🎨</span>
                        </div>
                      </div>
                      
                      {/* Color Info with Color Indicator */}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <div
                            className="w-4 h-4 rounded-full border border-gray-600 shadow-sm flex-shrink-0"
                            style={{ backgroundColor: color.color }}
                          />
                          <span className="text-white font-medium text-sm">{color.name}</span>
                        </div>
                        <p className="text-gray-400 text-xs">متوفر: {color.availableQuantity}</p>
                      </div>
                    </div>

                    {/* Quantity Controls */}
                    <div className="flex items-center justify-between">
                      <button
                        onClick={() => handleQuantityChange(color.name, -1)}
                        disabled={!selections[color.name]}
                        className="w-8 h-8 bg-[#2B3544] hover:bg-[#4B5563] disabled:opacity-50 disabled:cursor-not-allowed rounded-full flex items-center justify-center transition-colors"
                      >
                        <MinusIcon className="h-4 w-4 text-white" />
                      </button>
                      
                      <div className="bg-[#2B3544] rounded-lg px-3 py-2 min-w-[50px] text-center">
                        {editingColorQuantity === color.name ? (
                          <input
                            type="text"
                            value={tempColorQuantities[color.name] || '0'}
                            onChange={(e) => handleColorQuantityInputChange(color.name, e.target.value)}
                            onBlur={() => handleColorQuantityInputBlur(color.name)}
                            onKeyDown={(e) => handleColorQuantityInputKeyPress(color.name, e)}
                            className="bg-transparent text-white font-bold text-center outline-none w-full"
                            autoFocus
                            onFocus={(e) => e.target.select()}
                          />
                        ) : (
                          <span 
                            className="text-white font-bold cursor-pointer hover:bg-[#374151] rounded px-1 py-0.5 transition-colors"
                            onClick={() => handleColorQuantityClick(color.name)}
                            title="اضغط للتحرير"
                          >
                            {selections[color.name] || 0}
                          </span>
                        )}
                      </div>
                      
                      <button
                        onClick={() => handleQuantityChange(color.name, 1)}
                        disabled={(selections[color.name] || 0) >= color.availableQuantity}
                        className="w-8 h-8 bg-[#2B3544] hover:bg-[#4B5563] disabled:opacity-50 disabled:cursor-not-allowed rounded-full flex items-center justify-center transition-colors"
                      >
                        <PlusIcon className="h-4 w-4 text-white" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-gray-400">
                  {isPurchaseMode 
                    ? 'في وضع الشراء، يتم تخزين الكمية كـ "غير محدد" بدون تحديد ألوان' 
                    : 'لا توجد ألوان متاحة لهذا المنتج'
                  }
                </p>
              </div>
            )}

          </div>

          {/* Footer */}
          <div className="p-6 border-t border-[#4A5568]">
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-3 rounded-lg font-medium transition-colors"
              >
                إلغاء
              </button>
              <button
                onClick={handleAddToCart}
                disabled={totalQuantity === 0 || !validationInfo.isValid}
                className={`flex-1 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
                  totalQuantity === 0 || !validationInfo.isValid
                    ? 'bg-gray-600 cursor-not-allowed opacity-50'
                    : isPurchaseMode 
                      ? 'bg-green-600 hover:bg-green-700'
                      : 'bg-blue-600 hover:bg-blue-700'
                } text-white`}
              >
                <ShoppingCartIcon className="h-5 w-5" />
                {!validationInfo.isValid 
                  ? 'غير متاح للإضافة' 
                  : isPurchaseMode 
                    ? `إضافة للشراء (${totalQuantity})`
                    : `إضافة للسلة (${totalQuantity})`
                }
              </button>
            </div>
          </div>

        </div>
      </div>
    </>
  )
}