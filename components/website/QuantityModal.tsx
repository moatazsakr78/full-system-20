'use client';

import React, { useState, useEffect } from 'react';

interface QuantityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (quantity: number) => void;
  productName?: string;
}

export default function QuantityModal({ isOpen, onClose, onConfirm, productName }: QuantityModalProps) {
  const [quantity, setQuantity] = useState(1);

  // Reset quantity when modal opens
  useEffect(() => {
    if (isOpen) {
      setQuantity(1);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleIncrement = () => {
    setQuantity(prev => prev + 1);
  };

  const handleDecrement = () => {
    if (quantity > 1) {
      setQuantity(prev => prev - 1);
    }
  };

  const handleConfirm = () => {
    onConfirm(quantity);
    onClose();
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 relative"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Title */}
          <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">
            تحديد الكمية
          </h2>

          {/* Product Name (Optional) */}
          {productName && (
            <p className="text-center text-gray-600 mb-4 text-sm">
              {productName}
            </p>
          )}

          {/* Quantity Controls */}
          <div className="flex items-center justify-center gap-4 mb-8">
            {/* Plus Button */}
            <button
              onClick={handleIncrement}
              className="w-14 h-14 rounded-full flex items-center justify-center text-gray-600 transition-all duration-200 hover:bg-gray-100"
              style={{ backgroundColor: '#E5E7EB' }}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>

            {/* Quantity Display */}
            <div
              className="w-28 h-14 rounded-xl flex items-center justify-center text-2xl font-bold text-blue-600 border-2"
              style={{ borderColor: '#3B82F6' }}
            >
              {quantity}
            </div>

            {/* Minus Button */}
            <button
              onClick={handleDecrement}
              disabled={quantity <= 1}
              className={`w-14 h-14 rounded-full flex items-center justify-center transition-all duration-200 ${
                quantity <= 1
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
              style={quantity > 1 ? { backgroundColor: '#E5E7EB' } : {}}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
              </svg>
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            {/* Confirm Button */}
            <button
              onClick={handleConfirm}
              className="flex-1 py-3 rounded-xl text-white font-bold text-lg transition-all duration-200 hover:opacity-90"
              style={{ backgroundColor: '#5D1F1F' }}
            >
              إضافة للطلب
            </button>

            {/* Cancel Button */}
            <button
              onClick={onClose}
              className="flex-1 py-3 rounded-xl font-bold text-lg transition-all duration-200"
              style={{ backgroundColor: '#E5E7EB', color: '#6B7280' }}
            >
              إلغاء
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
