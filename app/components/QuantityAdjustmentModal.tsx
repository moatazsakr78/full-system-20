'use client'

import React, { useState } from 'react'
import { XMarkIcon, PlusIcon, PencilIcon } from '@heroicons/react/24/outline'

interface QuantityAdjustmentModalProps {
  isOpen: boolean
  onClose: () => void
  product: any | null
  mode: 'add' | 'edit'
  branches: any[]
  onConfirm: (newQuantity: number, reason: string, branchId: string) => void
}

export default function QuantityAdjustmentModal({
  isOpen,
  onClose,
  product,
  mode,
  branches,
  onConfirm
}: QuantityAdjustmentModalProps) {
  const [quantity, setQuantity] = useState('')
  const [reason, setReason] = useState('')
  const [selectedBranchId, setSelectedBranchId] = useState('')
  
  // Get current branch info
  const selectedBranch = branches.find(b => b.id === selectedBranchId)
  const currentQuantity = selectedBranch ? (product?.inventoryData?.[selectedBranchId]?.quantity || 0) : 0
  const branchName = selectedBranch?.name || ''
  
  // Set default branch when modal opens
  React.useEffect(() => {
    if (isOpen && branches.length > 0 && !selectedBranchId) {
      setSelectedBranchId(branches[0].id)
    }
  }, [isOpen, branches, selectedBranchId])

  if (!isOpen || !product) return null

  const handleSubmit = () => {
    if (!selectedBranchId) {
      alert('يرجى اختيار فرع')
      return
    }
    
    const numQuantity = parseInt(quantity) || 0
    
    if (mode === 'add') {
      // إضافة: الكمية الجديدة = الكمية الحالية + الكمية المدخلة
      const newQuantity = currentQuantity + numQuantity
      onConfirm(newQuantity, reason, selectedBranchId)
    } else {
      // تعديل: الكمية الجديدة = الكمية المدخلة
      onConfirm(numQuantity, reason, selectedBranchId)
    }
    
    setQuantity('')
    setReason('')
    setSelectedBranchId('')
    onClose()
  }

  const handleClose = () => {
    setQuantity('')
    setReason('')
    setSelectedBranchId('')
    onClose()
  }

  const isAddMode = mode === 'add'
  const title = isAddMode ? 'إضافة كمية' : 'تعديل الكمية'
  const icon = isAddMode ? PlusIcon : PencilIcon
  const IconComponent = icon

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" onClick={handleClose} />
      
      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-[#2B3544] rounded-2xl shadow-2xl border border-[#4A5568] max-w-md w-full">
          {/* Header */}
          <div className="px-6 py-4 border-b border-[#4A5568] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                <IconComponent className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">{title}</h2>
                <p className="text-sm text-blue-400">{product.name}</p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-600/30 rounded-full transition-colors"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
          
          {/* Content */}
          <div className="p-6 space-y-6">
            
            {/* Branch Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                اختر الفرع
              </label>
              <select
                value={selectedBranchId}
                onChange={(e) => setSelectedBranchId(e.target.value)}
                className="w-full px-4 py-3 bg-[#374151] border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">اختر فرع...</option>
                {branches.map(branch => (
                  <option key={branch.id} value={branch.id}>
                    {branch.name}
                  </option>
                ))}
              </select>
            </div>
            
            {/* Current Quantity Info */}
            {selectedBranchId && (
              <div className="bg-[#374151] rounded-lg p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-400">الفرع</span>
                  <span className="text-white font-medium">{branchName}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">الكمية الحالية</span>
                  <span className={`font-bold text-lg ${
                    currentQuantity < 0 ? 'text-red-400' : 
                    currentQuantity === 0 ? 'text-gray-400' : 'text-green-400'
                  }`}>
                    {currentQuantity}
                  </span>
                </div>
              </div>
            )}

            {/* Quantity Input */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                {isAddMode ? 'الكمية المراد إضافتها' : 'الكمية الجديدة'}
              </label>
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-full px-4 py-3 bg-[#374151] border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder={isAddMode ? "أدخل الكمية المراد إضافتها..." : "أدخل الكمية الجديدة..."}
                min={isAddMode ? undefined : "-999999"}
                autoFocus
              />
            </div>

            {/* Result Preview */}
            {quantity && (
              <div className="bg-blue-600/10 border border-blue-600/20 rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <span className="text-blue-400">النتيجة النهائية</span>
                  <span className="text-blue-400 font-bold text-lg">
                    {isAddMode ? currentQuantity + (parseInt(quantity) || 0) : (parseInt(quantity) || 0)}
                  </span>
                </div>
              </div>
            )}

            {/* Reason Input */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                السبب (اختياري)
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
                className="w-full px-4 py-3 bg-[#374151] border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                placeholder="اكتب سبب التعديل..."
              />
            </div>
          </div>
          
          {/* Footer */}
          <div className="px-6 py-4 border-t border-[#4A5568] flex gap-3 justify-end">
            <button
              onClick={handleClose}
              className="px-4 py-2 text-gray-400 hover:text-white hover:bg-gray-600/30 rounded-lg transition-colors"
            >
              إلغاء
            </button>
            <button
              onClick={handleSubmit}
              disabled={!quantity}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors font-medium"
            >
              تأكيد {isAddMode ? 'الإضافة' : 'التعديل'}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}