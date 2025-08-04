'use client'

import { useState, useEffect } from 'react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { supabase } from '../lib/supabase/client'

interface EditRecordModalProps {
  isOpen: boolean
  onClose: () => void
  onRecordUpdated: () => void
  record: any
}

export default function EditRecordModal({ isOpen, onClose, onRecordUpdated, record }: EditRecordModalProps) {
  const [recordName, setRecordName] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (record) {
      setRecordName(record.name || '')
    }
  }, [record])

  const handleSave = async () => {
    if (!recordName.trim() || !record?.id) return

    setIsLoading(true)
    try {
      const { error } = await supabase
        .from('records')
        .update({
          name: recordName.trim(),
          updated_at: new Date().toISOString()
        })
        .eq('id', record.id)

      if (error) {
        console.error('Error updating record:', error)
        return
      }

      onRecordUpdated()
      onClose()
    } catch (error) {
      console.error('Error updating record:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    setRecordName(record?.name || '')
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" dir="rtl">
      <div className="bg-pos-darker rounded-lg p-6 w-96 max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white">تعديل السجل</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Form */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              اسم السجل
            </label>
            <input
              type="text"
              value={recordName}
              onChange={(e) => setRecordName(e.target.value)}
              placeholder="أدخل اسم السجل..."
              className="w-full bg-gray-700 text-white placeholder-gray-400 px-4 py-2 rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isLoading}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 mt-6">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-gray-300 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors"
            disabled={isLoading}
          >
            إلغاء
          </button>
          <button
            onClick={handleSave}
            disabled={!recordName.trim() || isLoading || recordName === record?.name}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'جاري الحفظ...' : 'حفظ التغييرات'}
          </button>
        </div>
      </div>
    </div>
  )
}