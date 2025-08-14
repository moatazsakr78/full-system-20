'use client'

import { useState, useEffect } from 'react'
import { XMarkIcon } from '@heroicons/react/24/outline'

interface Column {
  id: string
  header: string
  visible: boolean
}

interface ColumnsControlModalProps {
  isOpen: boolean
  onClose: () => void
  columns: Column[]
  onColumnsChange: (updatedColumns: Column[]) => void
}

export default function ColumnsControlModal({ 
  isOpen, 
  onClose, 
  columns, 
  onColumnsChange 
}: ColumnsControlModalProps) {
  const [localColumns, setLocalColumns] = useState<Column[]>(columns)

  useEffect(() => {
    setLocalColumns(columns)
  }, [columns])

  const handleColumnToggle = (columnId: string) => {
    const updatedColumns = localColumns.map(col => 
      col.id === columnId ? { ...col, visible: !col.visible } : col
    )
    setLocalColumns(updatedColumns)
  }

  const handleSelectAll = () => {
    const updatedColumns = localColumns.map(col => ({ ...col, visible: true }))
    setLocalColumns(updatedColumns)
  }

  const handleDeselectAll = () => {
    const updatedColumns = localColumns.map(col => ({ ...col, visible: false }))
    setLocalColumns(updatedColumns)
  }

  const handleApply = () => {
    onColumnsChange(localColumns)
    onClose()
  }

  const handleCancel = () => {
    setLocalColumns(columns)
    onClose()
  }

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50" onClick={handleCancel} />
      
      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-[#2B3544] rounded-xl shadow-2xl border border-[#4A5568] w-full max-w-md max-h-[80vh] overflow-hidden">
          
          {/* Header */}
          <div className="px-6 py-4 border-b border-[#4A5568] flex items-center justify-between">
            <h3 className="text-lg font-medium text-white text-right">إدارة الأعمدة</h3>
            <button
              onClick={handleCancel}
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-600/30 rounded-full transition-colors"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
          
          {/* Content */}
          <div className="p-6">
            
            {/* Control Buttons */}
            <div className="flex gap-2 mb-4">
              <button
                onClick={handleSelectAll}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium transition-colors"
              >
                تحديد الكل
              </button>
              <button
                onClick={handleDeselectAll}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-md text-sm font-medium transition-colors"
              >
                إلغاء تحديد الكل
              </button>
            </div>

            {/* Columns List */}
            <div className="max-h-64 overflow-y-auto scrollbar-hide space-y-2">
              {localColumns.map((column) => (
                <label
                  key={column.id}
                  className="flex items-center gap-3 p-3 bg-[#374151] hover:bg-[#434E61] rounded-lg cursor-pointer transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={column.visible}
                    onChange={() => handleColumnToggle(column.id)}
                    className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500 focus:ring-2"
                  />
                  <span className="text-white text-sm font-medium flex-1 text-right">
                    {column.header}
                  </span>
                </label>
              ))}
            </div>
            
            {/* Summary */}
            <div className="mt-4 p-3 bg-[#374151] rounded-lg">
              <div className="flex justify-between items-center text-sm">
                <span className="text-blue-400 font-medium">
                  {localColumns.filter(col => col.visible).length} من أصل {localColumns.length}
                </span>
                <span className="text-gray-400">الأعمدة المعروضة</span>
              </div>
            </div>
          </div>
          
          {/* Footer */}
          <div className="px-6 py-4 border-t border-[#4A5568] flex gap-3 justify-end">
            <button
              onClick={handleCancel}
              className="px-4 py-2 text-gray-300 hover:text-white bg-transparent hover:bg-gray-600/20 border border-gray-600 hover:border-gray-500 rounded transition-colors"
            >
              إلغاء
            </button>
            <button
              onClick={handleApply}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
            >
              تطبيق
            </button>
          </div>
        </div>
      </div>
    </>
  )
}