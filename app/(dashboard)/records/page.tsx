'use client'

import { 
  PlusIcon,
  MagnifyingGlassIcon,
  ClipboardDocumentListIcon,
  PencilIcon,
  TrashIcon
} from '@heroicons/react/24/outline'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase/client'
import { ensureTransferRecordExists, linkTransferInvoicesToRecord } from '../../lib/utils/transfer-record-manager'
import Sidebar from '../../components/layout/Sidebar'
import TopHeader from '../../components/layout/TopHeader'
import RecordDetailsModal from '../../components/RecordDetailsModal'
import AddRecordModal from '../../components/AddRecordModal'
import EditRecordModal from '../../components/EditRecordModal'

export default function RecordsPage() {
  const router = useRouter()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isRecordDetailsModalOpen, setIsRecordDetailsModalOpen] = useState(false)
  const [isAddRecordModalOpen, setIsAddRecordModalOpen] = useState(false)
  const [isEditRecordModalOpen, setIsEditRecordModalOpen] = useState(false)
  const [selectedRecord, setSelectedRecord] = useState<any>(null)
  const [recordToEdit, setRecordToEdit] = useState<any>(null)
  const [records, setRecords] = useState<any[]>([])
  const [activeRecordsCount, setActiveRecordsCount] = useState(0)

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen)
  }

  const openRecordDetails = (record: any) => {
    setSelectedRecord(record)
    setIsRecordDetailsModalOpen(true)
  }

  const closeRecordDetails = () => {
    setIsRecordDetailsModalOpen(false)
    setSelectedRecord(null)
  }

  const openAddRecordModal = () => {
    setIsAddRecordModalOpen(true)
  }

  const closeAddRecordModal = () => {
    setIsAddRecordModalOpen(false)
  }

  const openEditRecordModal = (record: any) => {
    setRecordToEdit(record)
    setIsEditRecordModalOpen(true)
  }

  const closeEditRecordModal = () => {
    setIsEditRecordModalOpen(false)
    setRecordToEdit(null)
  }

  const handleDeleteRecord = async (record: any) => {
    // Prevent deletion of primary record or transfer record
    if (record.is_primary) {
      if (record.name === 'سجل النقل') {
        alert('لا يمكن حذف سجل النقل الافتراضي')
      } else {
        alert('لا يمكن حذف السجل الرئيسي')
      }
      return
    }

    if (window.confirm(`هل أنت متأكد من حذف السجل "${record.name}"؟`)) {
      try {
        const { error } = await supabase
          .from('records')
          .delete()
          .eq('id', record.id)

        if (error) {
          console.error('Error deleting record:', error)
          alert('حدث خطأ أثناء حذف السجل')
          return
        }

        // The real-time subscription will automatically update the UI
      } catch (error) {
        console.error('Error deleting record:', error)
        alert('حدث خطأ أثناء حذف السجل')
      }
    }
  }


  const fetchRecords = async () => {
    try {
      // Ensure transfer record exists first
      await ensureTransferRecordExists()
      
      // Link any orphaned transfer invoices to the transfer record
      await linkTransferInvoicesToRecord()

      const { data, error } = await supabase
        .from('records')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching records:', error)
        return
      }

      setRecords(data || [])
      setActiveRecordsCount(data?.filter((record: any) => record.is_active).length || 0)
    } catch (error) {
      console.error('Error fetching records:', error)
    }
  }

  const handleRecordAdded = () => {
    fetchRecords()
  }

  const handleRecordUpdated = () => {
    fetchRecords()
  }

  useEffect(() => {
    fetchRecords()

    // Set up real-time subscription
    const channel = supabase
      .channel('records_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'records' },
        (payload: any) => {
          console.log('Real-time update:', payload)
          fetchRecords()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-GB', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    })
  }

  return (
    <div className="h-screen bg-[#2B3544] overflow-hidden">
      {/* Top Header */}
      <TopHeader onMenuClick={toggleSidebar} isMenuOpen={isSidebarOpen} />
      
      {/* Sidebar */}
      <Sidebar isOpen={isSidebarOpen} onToggle={toggleSidebar} />
      
      {/* Main Content Container */}
      <div className="h-full pt-12 overflow-y-auto scrollbar-hide bg-pos-dark text-white" dir="rtl">
      {/* Header */}
      <div className="bg-pos-darker p-4 flex items-center justify-between border-b border-gray-700">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => router.push('/payment-methods')}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-purple-700 transition-colors"
          >
            <ClipboardDocumentListIcon className="h-4 w-4" />
            طرق الدفع
          </button>
        </div>
        
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-medium text-gray-300">
            إدارة وعرض جميع السجلات المالية
          </h1>
          <h1 className="text-xl font-bold">السجلات</h1>
          <ClipboardDocumentListIcon className="h-6 w-6 text-purple-600" />
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Total Balance */}
        <div className="bg-pos-darker rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">الرصيد الإجمالي</p>
              <p className="text-2xl font-bold text-white mt-1">$٠.٠٠</p>
            </div>
            <div className="text-blue-500 text-3xl">$</div>
          </div>
        </div>

        {/* Active Records */}
        <div className="bg-pos-darker rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">السجلات النشطة</p>
              <p className="text-2xl font-bold text-white mt-1">{activeRecordsCount}</p>
            </div>
            <div className="text-green-500 text-2xl">👁</div>
          </div>
        </div>

        {/* Total Records */}
        <div className="bg-pos-darker rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">إجمالي السجلات</p>
              <p className="text-2xl font-bold text-white mt-1">{records.length}</p>
            </div>
            <div className="text-purple-500 text-2xl">📋</div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="px-6 pb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={openAddRecordModal}
              className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-green-700 transition-colors"
            >
              <PlusIcon className="h-4 w-4" />
              إضافة سجل جديد
            </button>
            <button className="px-4 py-2 bg-gray-700 text-gray-300 rounded-lg text-sm font-medium">
              جميع الفروع
            </button>
            <button className="px-4 py-2 bg-gray-700 text-gray-300 rounded-lg text-sm font-medium flex items-center gap-2">
              جميع الأنواع
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>

          <div className="relative">
            <input
              type="text"
              placeholder="البحث في السجلات..."
              className="bg-gray-700 text-white placeholder-gray-400 pl-10 pr-4 py-2 rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 w-80"
            />
            <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          </div>
        </div>
      </div>

      {/* Records Table */}
      <div className="mx-6 bg-pos-darker rounded-lg overflow-hidden">
        <table className="w-full text-sm text-right">
          <thead className="bg-gray-700 text-gray-300">
            <tr>
              <th className="p-3 text-right font-medium">#</th>
              <th className="p-3 text-right font-medium">اسم السجل</th>
              <th className="p-3 text-right font-medium">الحالة</th>
              <th className="p-3 text-right font-medium">تاريخ الإنشاء</th>
              <th className="p-3 text-right font-medium">الإجراءات</th>
            </tr>
          </thead>
          <tbody className="bg-pos-darker divide-y divide-gray-700">
            {records.map((record, index) => (
              <tr 
                key={record.id}
                className="hover:bg-gray-700 transition-colors cursor-pointer"
                onDoubleClick={() => openRecordDetails(record)}
              >
                <td className="p-3 text-white font-medium">{index + 1}</td>
                <td className="p-3">
                  <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 ${
                      record.name === 'سجل النقل' 
                        ? 'bg-green-600' 
                        : record.is_primary 
                          ? 'bg-purple-600' 
                          : 'bg-blue-600'
                    } rounded flex items-center justify-center text-white text-sm`}>
                      {record.name === 'سجل النقل' ? '🔄' : '📋'}
                    </div>
                    <span className="text-white font-medium">{record.name}</span>
                    {record.is_primary && (
                      <span className={`px-2 py-1 rounded-full text-xs mr-2 ${
                        record.name === 'سجل النقل'
                          ? 'bg-green-900 text-green-300'
                          : 'bg-purple-900 text-purple-300'
                      }`}>
                        {record.name === 'سجل النقل' ? 'نقل' : 'رئيسي'}
                      </span>
                    )}
                  </div>
                </td>
                <td className="p-3">
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    record.is_active 
                      ? 'bg-green-900 text-green-300' 
                      : 'bg-red-900 text-red-300'
                  }`}>
                    {record.is_active ? 'نشط' : 'غير نشط'}
                  </span>
                </td>
                <td className="p-3 text-gray-400">{formatDate(record.created_at)}</td>
                <td className="p-3">
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => openEditRecordModal(record)}
                      className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors flex items-center gap-1"
                    >
                      <PencilIcon className="h-3 w-3" />
                      تعديل
                    </button>
                    {!record.is_primary && (
                      <button 
                        onClick={() => handleDeleteRecord(record)}
                        className="px-3 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 transition-colors flex items-center gap-1"
                      >
                        <TrashIcon className="h-3 w-3" />
                        حذف
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="p-6"></div>
      </div>

      {/* Record Details Modal */}
      <RecordDetailsModal 
        isOpen={isRecordDetailsModalOpen} 
        onClose={closeRecordDetails}
        record={selectedRecord}
      />

      {/* Add Record Modal */}
      <AddRecordModal 
        isOpen={isAddRecordModalOpen}
        onClose={closeAddRecordModal}
        onRecordAdded={handleRecordAdded}
      />

      {/* Edit Record Modal */}
      <EditRecordModal 
        isOpen={isEditRecordModalOpen}
        onClose={closeEditRecordModal}
        onRecordUpdated={handleRecordUpdated}
        record={recordToEdit}
      />
    </div>
  )
}