'use client'

import { useState, useEffect } from 'react'
import { XMarkIcon, BuildingOfficeIcon, CheckIcon } from '@heroicons/react/24/outline'
import { supabase } from '../lib/supabase/client'

interface Branch {
  id: string
  name: string
  address: string
  phone: string
  is_active: boolean | null
  manager_id?: string | null
}

interface BranchSelectionModalProps {
  isOpen: boolean
  onClose: () => void
  onSelectBranch?: (branch: Branch) => void
}

export default function BranchSelectionModal({ 
  isOpen, 
  onClose, 
  onSelectBranch 
}: BranchSelectionModalProps) {
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null)
  const [branches, setBranches] = useState<Branch[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch branches from database
  const fetchBranches = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      const { data, error } = await supabase
        .from('branches')
        .select('*')
        .eq('is_active', true)
        .order('name', { ascending: true })
      
      if (error) {
        console.error('Error fetching branches:', error)
        setError('فشل في تحميل الفروع')
        return
      }
      
      setBranches(data || [])
      // Set first branch as default selection
      if (data && data.length > 0) {
        setSelectedBranch(data[0])
      }
      
    } catch (error) {
      console.error('Error fetching branches:', error)
      setError('حدث خطأ أثناء تحميل الفروع')
    } finally {
      setIsLoading(false)
    }
  }

  // Fetch branches when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchBranches()
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleBranchSelect = (branch: Branch) => {
    setSelectedBranch(branch)
  }

  const handleConfirm = () => {
    if (selectedBranch && onSelectBranch) {
      onSelectBranch(selectedBranch)
    }
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-[#374151] rounded-lg w-[500px] shadow-2xl">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-600">
          <div className="flex items-center gap-2">
            <BuildingOfficeIcon className="h-5 w-5 text-blue-400" />
            <h2 className="text-white text-lg font-semibold">اختيار فرع البيع</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6">
          {/* Description */}
          <p className="text-gray-300 text-center mb-6 leading-relaxed">
            اختر الفرع الذي ترغب في البيع منه، إلى نظام نقطة البيع
          </p>

          {/* Branch Selection */}
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-4"></div>
                <p className="text-gray-400">جاري تحميل الفروع...</p>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center p-8">
                <BuildingOfficeIcon className="h-16 w-16 text-red-500 mb-4" />
                <p className="text-red-400 text-lg mb-2">خطأ في التحميل</p>
                <p className="text-gray-500 text-sm mb-4">{error}</p>
                <button
                  onClick={fetchBranches}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-colors"
                >
                  إعادة المحاولة
                </button>
              </div>
            ) : branches.length > 0 ? (
              branches.map((branch) => (
                <div
                  key={branch.id}
                  className={`relative p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                    selectedBranch?.id === branch.id
                      ? 'border-blue-500 bg-blue-500/10'
                      : 'border-gray-600 bg-[#2B3544] hover:border-gray-500'
                  }`}
                  onClick={() => handleBranchSelect(branch)}
                >
                  {/* Selection Indicator */}
                  <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                    {selectedBranch?.id === branch.id ? (
                      <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                        <CheckIcon className="h-4 w-4 text-white" />
                      </div>
                    ) : (
                      <div className="w-6 h-6 border-2 border-gray-500 rounded-full"></div>
                    )}
                  </div>

                  {/* Branch Info */}
                  <div className="pr-10">
                    <h3 className="text-white font-semibold text-lg mb-1">
                      {branch.name}
                    </h3>
                    <p className="text-gray-400 text-sm mb-1">
                      {branch.address}
                    </p>
                    <p className="text-gray-500 text-xs">
                      الهاتف: {branch.phone}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center p-8">
                <BuildingOfficeIcon className="h-16 w-16 text-gray-500 mb-4" />
                <p className="text-gray-400 text-lg mb-2">لا توجد فروع نشطة</p>
                <p className="text-gray-500 text-sm">لا توجد فروع متاحة في قاعدة البيانات</p>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="border-t border-gray-600 p-4 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg text-sm transition-colors"
          >
            إلغاء
          </button>
          <button
            onClick={handleConfirm}
            disabled={!selectedBranch}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg text-sm transition-colors"
          >
            تأكيد الاختيار
          </button>
        </div>
      </div>
    </div>
  )
}