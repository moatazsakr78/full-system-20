'use client'

import { useState, useEffect } from 'react'
import { Shape } from '../../lib/hooks/useShapes'

interface ShapeModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (name: string) => Promise<void>
  shape?: Shape | null
}

export function ShapeModal({ isOpen, onClose, onSave, shape }: ShapeModalProps) {
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (isOpen) {
      setName(shape?.name || '')
      setError('')
    }
  }, [isOpen, shape])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!name.trim()) {
      setError('يرجى إدخال اسم الشكل')
      return
    }

    setLoading(true)
    setError('')

    try {
      await onSave(name.trim())
    } catch (err) {
      setError('فشل في حفظ الشكل')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    if (!loading) {
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-[#2B3544] rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-white">
            {shape ? 'تعديل الشكل' : 'إضافة شكل جديد'}
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-white p-1 transition-colors"
            disabled={loading}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              اسم الشكل
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="أدخل اسم الشكل"
              className="w-full px-3 py-2 bg-[#374151] border border-gray-600 rounded text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              disabled={loading}
              autoFocus
            />
          </div>

          {error && (
            <div className="text-red-500 text-sm">{error}</div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg disabled:opacity-50 transition-colors font-medium"
            >
              {loading ? 'جاري الحفظ...' : (shape ? 'تحديث' : 'إضافة')}
            </button>
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-2 rounded-lg disabled:opacity-50 transition-colors font-medium"
            >
              إلغاء
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}