'use client'

import { useState } from 'react'
import { ExclamationTriangleIcon, XMarkIcon } from '@heroicons/react/24/outline'

interface DeleteConfirmationModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  itemName: string
  isDeleting?: boolean
}

export default function DeleteConfirmationModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message, 
  itemName,
  isDeleting = false
}: DeleteConfirmationModalProps) {
  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-[#3A4553] rounded-lg shadow-2xl max-w-md w-full mx-4">
          
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-[#4A5568]">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-600/20 rounded-lg">
                <ExclamationTriangleIcon className="h-6 w-6 text-red-400" />
              </div>
              <h3 className="text-lg font-medium text-white">{title}</h3>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
              disabled={isDeleting}
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            <p className="text-gray-300 text-right mb-4">
              {message}
            </p>
            <div className="bg-[#2B3441] rounded-lg p-3 border border-[#4A5568]">
              <p className="text-white font-medium text-right">{itemName}</p>
            </div>
            <p className="text-red-400 text-sm text-right mt-3">
              تحذير: هذا الإجراء لا يمكن التراجع عنه!
            </p>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 p-6 border-t border-[#4A5568]">
            <button
              onClick={onClose}
              disabled={isDeleting}
              className="px-4 py-2 text-gray-300 border border-gray-600 hover:border-gray-500 hover:bg-gray-600/10 rounded transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              إلغاء
            </button>
            <button
              onClick={onConfirm}
              disabled={isDeleting}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded transition-all duration-200 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isDeleting ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="m12 2a10 10 0 1 0 10 10c0-5.52-4.48-10-10-10zm0 18a8 8 0 1 1 0-16 8 8 0 0 1 0 16z"></path>
                  </svg>
                  جاري الحذف...
                </>
              ) : (
                'تأكيد الحذف'
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}