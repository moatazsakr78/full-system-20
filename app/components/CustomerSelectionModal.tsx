'use client'

import { useState, useEffect } from 'react'
import { 
  XMarkIcon, 
  UserIcon, 
  MagnifyingGlassIcon,
  Squares2X2Icon,
  ListBulletIcon,
  StarIcon,
  UsersIcon
} from '@heroicons/react/24/outline'
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid'
import { supabase } from '../lib/supabase/client'

interface Customer {
  id: string
  name: string
  phone: string | null
  city: string | null
  account_balance: number | null
  rank: string | null
  category: string | null
  loyalty_points: number | null
  is_active: boolean | null
  group_id: string | null
}

interface CustomerGroup {
  id: string
  name: string
  parent_id: string | null
  count: number
  isSelected?: boolean
  is_active: boolean | null
  sort_order: number | null
}

interface CustomerSelectionModalProps {
  isOpen: boolean
  onClose: () => void
  onSelectCustomer?: (customer: Customer) => void
}

export default function CustomerSelectionModal({ 
  isOpen, 
  onClose, 
  onSelectCustomer 
}: CustomerSelectionModalProps) {
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [selectedGroup, setSelectedGroup] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list')
  const [customers, setCustomers] = useState<Customer[]>([])
  const [customerGroups, setCustomerGroups] = useState<CustomerGroup[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch customers and customer groups from database
  const fetchCustomers = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      // Fetch customers
      const { data: customersData, error: customersError } = await supabase
        .from('customers')
        .select('*')
        .eq('is_active', true)
        .order('name', { ascending: true })
      
      if (customersError) {
        console.error('Error fetching customers:', customersError)
        setError('فشل في تحميل العملاء')
        return
      }
      
      setCustomers(customersData || [])
      
      // Fetch customer groups with customer counts
      const { data: groupsData, error: groupsError } = await supabase
        .from('customer_groups')
        .select(`
          id,
          name,
          parent_id,
          is_active,
          sort_order
        `)
        .eq('is_active', true)
        .order('sort_order', { ascending: true })
        .order('name', { ascending: true })
      
      if (groupsError) {
        console.error('Error fetching customer groups:', groupsError)
        setError('فشل في تحميل مجموعات العملاء')
        return
      }
      
      // Calculate customer counts per group
      const groups = (groupsData || []).map(group => {
        const customerCount = (customersData || []).filter(c => c.group_id === group.id).length
        return {
          ...group,
          count: customerCount
        }
      })
      
      // Add "All Customers" group at the beginning
      const allCustomersGroup = {
        id: 'all',
        name: 'جميع العملاء',
        parent_id: null,
        count: (customersData || []).length,
        isSelected: true,
        is_active: true,
        sort_order: -1
      }
      
      setCustomerGroups([allCustomersGroup, ...groups])
      
    } catch (error) {
      console.error('Error fetching data:', error)
      setError('حدث خطأ أثناء تحميل البيانات')
    } finally {
      setIsLoading(false)
    }
  }

  // Fetch customers when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchCustomers()
      setSelectedCustomer(null)
      setSearchQuery('')
      setSelectedGroup('all')
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleCustomerSelect = (customer: Customer) => {
    setSelectedCustomer(customer)
  }

  const handleConfirm = () => {
    if (selectedCustomer && onSelectCustomer) {
      onSelectCustomer(selectedCustomer)
    }
    onClose()
  }

  const getRankIcon = (rank: string | null) => {
    const baseClasses = "h-4 w-4"
    switch (rank) {
      case 'immortal':
        return <StarIconSolid className={`${baseClasses} text-red-500`} />
      case 'vip':
        return <StarIconSolid className={`${baseClasses} text-yellow-500`} />
      case 'gold':
        return <StarIconSolid className={`${baseClasses} text-yellow-600`} />
      case 'silver':
        return <StarIcon className={`${baseClasses} text-gray-400`} />
      case 'bronze':
        return <StarIcon className={`${baseClasses} text-orange-600`} />
      default:
        return <StarIcon className={`${baseClasses} text-gray-400`} />
    }
  }

  // Filter customers based on search query and selected group
  const filteredCustomers = customers.filter(customer => {
    const matchesSearch = searchQuery === '' || 
      customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (customer.phone && customer.phone.includes(searchQuery)) ||
      (customer.city && customer.city.includes(searchQuery))
    
    if (selectedGroup === 'all') return matchesSearch
    
    // Filter by specific customer group
    return matchesSearch && customer.group_id === selectedGroup
  })

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-[#374151] rounded-lg w-[1200px] h-[700px] flex flex-col shadow-2xl">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-600">
          <div className="flex items-center gap-2">
            <UserIcon className="h-5 w-5 text-blue-400" />
            <h2 className="text-white text-lg font-semibold">اختيار عميل</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Customer Groups Sidebar */}
          <div className="w-80 bg-[#2B3544] border-l border-gray-600 flex flex-col">
            <div className="p-4 border-b border-gray-600">
              <h3 className="text-white font-semibold mb-3">مجموعات العملاء</h3>
              <div className="space-y-1">
                {customerGroups.map((group) => (
                  <div
                    key={group.id}
                    className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${
                      selectedGroup === group.id 
                        ? 'bg-blue-600 text-white' 
                        : 'text-gray-300 hover:bg-[#374151]'
                    }`}
                    onClick={() => setSelectedGroup(group.id)}
                  >
                    <div className="flex items-center gap-2">
                      <UsersIcon className="h-4 w-4" />
                      <span className="text-sm font-medium">{group.name}</span>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      selectedGroup === group.id 
                        ? 'bg-blue-700 text-white' 
                        : 'bg-gray-600 text-gray-300'
                    }`}>
                      {group.count}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex-1 flex flex-col">
            {/* Search and Controls */}
            <div className="p-4 border-b border-gray-600 bg-[#2B3544]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {/* Search */}
                  <div className="relative">
                    <MagnifyingGlassIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="البحث عن عميل..."
                      className="w-80 pl-4 pr-10 py-2 bg-[#374151] border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* View Mode Toggle */}
                  <div className="flex bg-[#374151] rounded-lg overflow-hidden">
                    <button 
                      className={`p-2 ${viewMode === 'grid' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}
                      onClick={() => setViewMode('grid')}
                    >
                      <Squares2X2Icon className="h-4 w-4" />
                    </button>
                    <button 
                      className={`p-2 ${viewMode === 'list' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}
                      onClick={() => setViewMode('list')}
                    >
                      <ListBulletIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Customer List */}
            <div className="flex-1 overflow-hidden">
              {/* Table Header */}
              <div className="bg-[#2B3544] border-b border-gray-600">
                <div className="grid grid-cols-6 gap-4 p-3 text-gray-300 text-sm font-medium">
                  <div className="text-center">#</div>
                  <div className="text-right">الاسم</div>
                  <div className="text-center">الهاتف</div>
                  <div className="text-center">المدينة</div>
                  <div className="text-center">الرصيد</div>
                  <div className="text-center">الرتبة</div>
                </div>
              </div>

              {/* Table Content */}
              <div className="flex-1 overflow-auto h-[400px]">
                {isLoading ? (
                  <div className="flex-1 flex flex-col items-center justify-center p-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-4"></div>
                    <p className="text-gray-400 text-lg">جاري تحميل العملاء...</p>
                  </div>
                ) : error ? (
                  <div className="flex-1 flex flex-col items-center justify-center p-8">
                    <UserIcon className="h-16 w-16 text-red-500 mb-4" />
                    <p className="text-red-400 text-lg mb-2">خطأ في التحميل</p>
                    <p className="text-gray-500 text-sm mb-4">{error}</p>
                    <button
                      onClick={fetchCustomers}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-colors"
                    >
                      إعادة المحاولة
                    </button>
                  </div>
                ) : filteredCustomers.length > 0 ? (
                  <div className="divide-y divide-gray-600">
                    {filteredCustomers.map((customer, index) => (
                      <div
                        key={customer.id}
                        className={`grid grid-cols-6 gap-4 p-3 hover:bg-[#2B3544] cursor-pointer transition-colors ${
                          selectedCustomer?.id === customer.id ? 'bg-blue-600/20 border-l-4 border-blue-500' : ''
                        }`}
                        onClick={() => handleCustomerSelect(customer)}
                      >
                        <div className="text-center text-gray-400 text-sm">
                          {index + 1}
                        </div>
                        <div className="text-right text-white font-medium">
                          {customer.name}
                        </div>
                        <div className="text-center text-gray-300 text-sm">
                          {customer.phone || '-'}
                        </div>
                        <div className="text-center text-gray-300 text-sm">
                          {customer.city || 'غير محدد'}
                        </div>
                        <div className={`text-center text-sm font-medium ${
                          (customer.account_balance && customer.account_balance > 0) ? 'text-green-400' : 
                          (customer.account_balance && customer.account_balance < 0) ? 'text-red-400' : 'text-gray-400'
                        }`}>
                          {(customer.account_balance || 0).toLocaleString()}
                        </div>
                        <div className="flex justify-center">
                          {getRankIcon(customer.rank)}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center p-8">
                    <UserIcon className="h-16 w-16 text-gray-500 mb-4" />
                    <p className="text-gray-400 text-lg mb-2">لا توجد عملاء</p>
                    <p className="text-gray-500 text-sm">جرب تغيير معايير البحث</p>
                  </div>
                )}
              </div>
            </div>

            {/* Footer Stats */}
            <div className="border-t border-gray-600 p-3 bg-[#2B3544]">
              <div className="flex justify-between items-center text-sm text-gray-400">
                <span>إجمالي العملاء: {filteredCustomers.length}</span>
                <span>المطلوب تحديد عميل من الجدول للمتابعة</span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="border-t border-gray-600 p-4 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg text-sm transition-colors"
          >
            إلغاء
          </button>
          <button
            onClick={handleConfirm}
            disabled={!selectedCustomer}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg text-sm transition-colors"
          >
            تأكيد الاختيار
          </button>
        </div>
      </div>
    </div>
  )
}