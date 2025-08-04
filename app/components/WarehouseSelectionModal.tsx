'use client'

import { useState, useEffect } from 'react'
import { XMarkIcon, MagnifyingGlassIcon, BuildingStorefrontIcon } from '@heroicons/react/24/outline'
import { supabase } from '../lib/supabase/client'

interface WarehouseSelectionModalProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (warehouse: any) => void
  selectedWarehouse: any
}

export default function WarehouseSelectionModal({ isOpen, onClose, onSelect, selectedWarehouse }: WarehouseSelectionModalProps) {
  const [branches, setBranches] = useState<any[]>([])
  const [warehouses, setWarehouses] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'branches' | 'warehouses'>('branches')

  useEffect(() => {
    if (isOpen) {
      loadLocations()
    }
  }, [isOpen])

  const loadLocations = async () => {
    setLoading(true)
    try {
      // Load branches
      const { data: branchesData, error: branchesError } = await supabase
        .from('branches')
        .select('*')
        .order('name')

      if (branchesError) throw branchesError
      setBranches(branchesData || [])

      // Load warehouses
      const { data: warehousesData, error: warehousesError } = await supabase
        .from('warehouses')
        .select('*')
        .order('name')

      if (warehousesError) throw warehousesError
      setWarehouses(warehousesData || [])
    } catch (error) {
      console.error('Error loading locations:', error)
    } finally {
      setLoading(false)
    }
  }

  const getCurrentItems = () => {
    return activeTab === 'branches' ? branches : warehouses
  }

  const filteredItems = getCurrentItems().filter(item =>
    item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.address?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleLocationSelect = (location: any) => {
    // Add type to distinguish between branch and warehouse
    const locationWithType = {
      ...location,
      locationType: activeTab === 'branches' ? 'branch' : 'warehouse'
    }
    onSelect(locationWithType)
    onClose()
  }

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" onClick={onClose} />
      
      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-[#2B3544] rounded-2xl shadow-2xl border border-[#4A5568] w-full max-w-2xl max-h-[80vh] overflow-hidden">
          
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-[#4A5568]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
                <BuildingStorefrontIcon className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">اختيار المخزن أو الفرع</h2>
                <p className="text-gray-400 text-sm">اختر الموقع لاستقبال البضائع</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-600/30 rounded-full transition-colors"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>

          {/* Tabs */}
          <div className="px-6 pt-4">
            <div className="flex gap-1 bg-[#374151] rounded-lg p-1">
              <button
                onClick={() => setActiveTab('branches')}
                className={`flex-1 py-2 px-4 rounded-md font-medium transition-all ${
                  activeTab === 'branches'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                الفروع ({branches.length})
              </button>
              <button
                onClick={() => setActiveTab('warehouses')}
                className={`flex-1 py-2 px-4 rounded-md font-medium transition-all ${
                  activeTab === 'warehouses'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                المخازن ({warehouses.length})
              </button>
            </div>
          </div>

          {/* Search */}
          <div className="p-6 pb-4">
            <div className="relative">
              <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder={`البحث في ${activeTab === 'branches' ? 'الفروع' : 'المخازن'}...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-[#374151] border border-[#4A5568] rounded-lg pl-10 pr-4 py-3 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Content */}
          <div className="px-6 pb-6 max-h-[50vh] overflow-y-auto scrollbar-hide">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                <span className="text-gray-400 mr-3">جاري التحميل...</span>
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="text-center py-8">
                <BuildingStorefrontIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-400">لا توجد {activeTab === 'branches' ? 'فروع' : 'مخازن'}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredItems.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => handleLocationSelect(item)}
                    className={`bg-[#374151] rounded-xl p-4 border cursor-pointer transition-all hover:border-blue-500 ${
                      selectedWarehouse?.id === item.id ? 'border-blue-500 bg-blue-500/10' : 'border-[#4A5568]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                          <BuildingStorefrontIcon className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <h3 className="text-white font-medium">{item.name}</h3>
                          <div className="flex items-center gap-4 text-sm text-gray-400 mt-1">
                            {item.address && (
                              <span>{item.address}</span>
                            )}
                            {item.phone && (
                              <span>{item.phone}</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-left flex-shrink-0">
                        <div className="text-purple-400 font-bold text-sm">
                          {activeTab === 'branches' ? 'فرع' : 'مخزن'}
                        </div>
                        {item.is_active !== undefined && (
                          <div className={`text-xs ${item.is_active ? 'text-green-400' : 'text-red-400'}`}>
                            {item.is_active ? 'نشط' : 'غير نشط'}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-[#4A5568]">
            <button
              onClick={onClose}
              className="w-full bg-gray-600 hover:bg-gray-700 text-white py-3 rounded-lg font-medium transition-colors"
            >
              إغلاق
            </button>
          </div>

        </div>
      </div>
    </>
  )
}