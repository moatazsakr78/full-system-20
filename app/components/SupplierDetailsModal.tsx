'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { MagnifyingGlassIcon, XMarkIcon, ChevronLeftIcon, ChevronRightIcon, PlusIcon, PencilSquareIcon, TrashIcon, TableCellsIcon, CalendarDaysIcon } from '@heroicons/react/24/outline'
import ResizableTable from './tables/ResizableTable'
import { supabase } from '../lib/supabase/client'
import ConfirmDeleteModal from './ConfirmDeleteModal'
import SimpleDateFilterModal, { DateFilter } from './SimpleDateFilterModal'
import AddPaymentModal from './AddPaymentModal'
import { useFormatPrice } from '@/lib/hooks/useCurrency'

interface SupplierDetailsModalProps {
  isOpen: boolean
  onClose: () => void
  supplier: any
}

type ViewMode = 'split' | 'invoices-only' | 'details-only'

export default function SupplierDetailsModal({ isOpen, onClose, supplier }: SupplierDetailsModalProps) {
  const formatPrice = useFormatPrice();
  const [selectedTransaction, setSelectedTransaction] = useState(0) // First row selected (index 0)
  const [showSupplierDetails, setShowSupplierDetails] = useState(true)
  const [activeTab, setActiveTab] = useState('invoices') // 'invoices', 'payments', 'statement'
  const [viewMode, setViewMode] = useState<ViewMode>('split')
  const [dividerPosition, setDividerPosition] = useState(50) // Percentage
  const [isDragging, setIsDragging] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Real-time state for purchase invoices and purchase invoice items
  const [purchaseInvoices, setPurchaseInvoices] = useState<any[]>([])
  const [purchaseInvoiceItems, setPurchaseInvoiceItems] = useState<any[]>([])
  const [isLoadingInvoices, setIsLoadingInvoices] = useState(false)
  const [isLoadingItems, setIsLoadingItems] = useState(false)

  // Supplier balance state - independent of date filter
  const [supplierBalance, setSupplierBalance] = useState(0)

  // Delete confirmation modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [invoiceToDelete, setInvoiceToDelete] = useState<any>(null)

  // Date filter state
  const [showDateFilter, setShowDateFilter] = useState(false)
  const [dateFilter, setDateFilter] = useState<DateFilter>({ type: 'all' })

  // Add Payment Modal state
  const [showAddPaymentModal, setShowAddPaymentModal] = useState(false)

  // Supplier payments state
  const [supplierPayments, setSupplierPayments] = useState<any[]>([])
  const [isLoadingPayments, setIsLoadingPayments] = useState(false)

  // Account statement state
  const [accountStatements, setAccountStatements] = useState<any[]>([])
  const [isLoadingStatements, setIsLoadingStatements] = useState(false)

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (viewMode !== 'split' || activeTab !== 'invoices') return
    setIsDragging(true)
    e.preventDefault()
  }, [viewMode, activeTab])

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !containerRef.current || viewMode !== 'split') return
    
    const rect = containerRef.current.getBoundingClientRect()
    const y = e.clientY - rect.top
    const percentage = Math.max(20, Math.min(80, (y / rect.height) * 100))
    setDividerPosition(percentage)
  }, [isDragging, viewMode])

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
  }, [])

  // Add global mouse event listeners
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [isDragging, handleMouseMove, handleMouseUp])

  // Helper function to get week start (Saturday) and end (Friday)
  const getWeekRange = (date: Date, isLastWeek: boolean = false) => {
    const targetDate = new Date(date)
    if (isLastWeek) {
      targetDate.setDate(targetDate.getDate() - 7)
    }
    
    // Find Saturday (start of week in Arabic calendar)
    const dayOfWeek = targetDate.getDay()
    const daysToSaturday = dayOfWeek === 6 ? 0 : dayOfWeek + 1
    
    const startOfWeek = new Date(targetDate)
    startOfWeek.setDate(targetDate.getDate() - daysToSaturday)
    startOfWeek.setHours(0, 0, 0, 0)
    
    const endOfWeek = new Date(startOfWeek)
    endOfWeek.setDate(startOfWeek.getDate() + 6)
    endOfWeek.setHours(23, 59, 59, 999)
    
    return { startOfWeek, endOfWeek }
  }

  // Apply date filter to query
  const applyDateFilter = (query: any) => {
    const now = new Date()
    
    switch (dateFilter.type) {
      case 'today':
        const startOfDay = new Date(now)
        startOfDay.setHours(0, 0, 0, 0)
        const endOfDay = new Date(now)
        endOfDay.setHours(23, 59, 59, 999)
        return query.gte('created_at', startOfDay.toISOString()).lte('created_at', endOfDay.toISOString())
      
      case 'current_week':
        const { startOfWeek: currentWeekStart, endOfWeek: currentWeekEnd } = getWeekRange(now)
        const currentWeekEndDate = now < currentWeekEnd ? now : currentWeekEnd
        return query.gte('created_at', currentWeekStart.toISOString()).lte('created_at', currentWeekEndDate.toISOString())
      
      case 'last_week':
        const { startOfWeek: lastWeekStart, endOfWeek: lastWeekEnd } = getWeekRange(now, true)
        return query.gte('created_at', lastWeekStart.toISOString()).lte('created_at', lastWeekEnd.toISOString())
      
      case 'current_month':
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)
        return query.gte('created_at', startOfMonth.toISOString()).lte('created_at', endOfMonth.toISOString())
      
      case 'last_month':
        const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
        const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999)
        return query.gte('created_at', lastMonthStart.toISOString()).lte('created_at', lastMonthEnd.toISOString())
      
      case 'custom':
        if (dateFilter.startDate) {
          const startDate = new Date(dateFilter.startDate)
          startDate.setHours(0, 0, 0, 0)
          query = query.gte('created_at', startDate.toISOString())
        }
        if (dateFilter.endDate) {
          const endDate = new Date(dateFilter.endDate)
          endDate.setHours(23, 59, 59, 999)
          query = query.lte('created_at', endDate.toISOString())
        }
        return query
      
      case 'all':
      default:
        return query
    }
  }

  // Fetch supplier balance - independent of date filter
  const fetchSupplierBalance = async () => {
    if (!supplier?.id) return

    try {
      // Get all purchase invoices for this supplier (without date filter)
      const { data: allInvoices, error: invoicesError } = await supabase
        .from('purchase_invoices')
        .select('total_amount, invoice_type')
        .eq('supplier_id', supplier.id)

      if (invoicesError) {
        console.error('Error fetching supplier invoices:', invoicesError)
        return
      }

      // Get all payments for this supplier (without date filter)
      const { data: allPayments, error: paymentsError } = await supabase
        .from('supplier_payments')
        .select('amount')
        .eq('supplier_id', supplier.id)

      if (paymentsError) {
        console.error('Error fetching supplier payments:', paymentsError)
        return
      }

      // Calculate invoices balance: Purchase Invoices add to balance, Purchase Returns subtract
      const invoicesBalance = (allInvoices || []).reduce((total, invoice) => {
        if (invoice.invoice_type === 'Purchase Invoice') {
          return total + (invoice.total_amount || 0)
        } else if (invoice.invoice_type === 'Purchase Return') {
          return total - (invoice.total_amount || 0)
        }
        return total
      }, 0)

      // Calculate total payments
      const totalPayments = (allPayments || []).reduce((total, payment) => {
        return total + (payment.amount || 0)
      }, 0)

      // Final balance = Invoices Balance - Total Payments
      const finalBalance = invoicesBalance - totalPayments

      setSupplierBalance(finalBalance)
    } catch (error) {
      console.error('Error calculating supplier balance:', error)
    }
  }

  // Fetch purchase invoices from Supabase for the specific supplier
  const fetchPurchaseInvoices = async () => {
    if (!supplier?.id) return
    
    try {
      setIsLoadingInvoices(true)
      
      let query = supabase
        .from('purchase_invoices')
        .select(`
          id,
          invoice_number,
          supplier_id,
          total_amount,
          notes,
          created_at,
          time,
          invoice_type,
          supplier:suppliers(
            name,
            phone
          )
        `)
        .eq('supplier_id', supplier.id)
      
      // Apply date filter
      query = applyDateFilter(query)
      
      const { data, error } = await query
        .order('created_at', { ascending: false })
        .limit(20)
      
      if (error) {
        console.error('Error fetching purchase invoices:', error)
        return
      }
      
      setPurchaseInvoices(data || [])
      
      // Auto-select first invoice if available
      if (data && data.length > 0) {
        setSelectedTransaction(0)
        fetchPurchaseInvoiceItems(data[0].id)
      }
      
    } catch (error) {
      console.error('Error fetching purchase invoices:', error)
    } finally {
      setIsLoadingInvoices(false)
    }
  }

  // Fetch supplier payments
  const fetchSupplierPayments = async () => {
    if (!supplier?.id) return

    try {
      setIsLoadingPayments(true)

      const { data, error } = await supabase
        .from('supplier_payments')
        .select(`
          id,
          amount,
          payment_method,
          reference_number,
          notes,
          payment_date,
          created_at
        `)
        .eq('supplier_id', supplier.id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching supplier payments:', error)
        return
      }

      setSupplierPayments(data || [])

    } catch (error) {
      console.error('Error fetching supplier payments:', error)
    } finally {
      setIsLoadingPayments(false)
    }
  }

  // Fetch account statement
  const fetchAccountStatement = async () => {
    if (!supplier?.id) return

    try {
      setIsLoadingStatements(true)

      // Get supplier with opening balance
      const { data: supplierData, error: supplierError } = await supabase
        .from('suppliers')
        .select('opening_balance, created_at')
        .eq('id', supplier.id)
        .single()

      if (supplierError) {
        console.error('Error fetching supplier data:', supplierError)
        return
      }

      // Get all purchase invoices for this supplier
      const { data: invoices, error: invoicesError } = await supabase
        .from('purchase_invoices')
        .select('id, invoice_number, total_amount, invoice_type, created_at')
        .eq('supplier_id', supplier.id)
        .order('created_at', { ascending: true })

      if (invoicesError) {
        console.error('Error fetching invoices:', invoicesError)
        return
      }

      // Get all payments for this supplier
      const { data: payments, error: paymentsError } = await supabase
        .from('supplier_payments')
        .select('id, amount, payment_method, notes, created_at')
        .eq('supplier_id', supplier.id)
        .order('created_at', { ascending: true })

      if (paymentsError) {
        console.error('Error fetching payments:', paymentsError)
        return
      }

      // Build statements array
      const statements: any[] = []

      // Add opening balance if exists
      if (supplierData?.opening_balance && supplierData.opening_balance !== 0) {
        statements.push({
          id: 0,
          date: new Date(supplierData.created_at),
          description: 'الرصيد الافتتاحي',
          type: 'رصيد افتتاحي',
          amount: supplierData.opening_balance,
          isOpening: true
        })
      }

      // Add invoices
      invoices?.forEach((invoice) => {
        const amount = invoice.invoice_type === 'Purchase Invoice'
          ? invoice.total_amount
          : -invoice.total_amount

        statements.push({
          id: statements.length + 1,
          date: new Date(invoice.created_at),
          description: `فاتورة ${invoice.invoice_number}`,
          type: invoice.invoice_type === 'Purchase Invoice' ? 'فاتورة شراء' : 'مرتجع شراء',
          amount: amount,
          invoiceId: invoice.id
        })
      })

      // Add payments
      payments?.forEach((payment) => {
        statements.push({
          id: statements.length + 1,
          date: new Date(payment.created_at),
          description: payment.notes || 'دفعة',
          type: 'دفعة',
          amount: -payment.amount, // Negative because it reduces the balance
          paymentId: payment.id
        })
      })

      // Sort by date
      statements.sort((a, b) => a.date.getTime() - b.date.getTime())

      // Calculate running balance
      let runningBalance = 0
      const statementsWithBalance = statements.map((statement, index) => {
        runningBalance += statement.amount

        return {
          ...statement,
          balance: runningBalance,
          displayDate: statement.date.toLocaleDateString('en-GB'),
          displayTime: statement.date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
          }),
          displayAmount: statement.amount >= 0
            ? `+${formatPrice(statement.amount)}`
            : formatPrice(statement.amount),
          displayBalance: formatPrice(runningBalance),
          id: index + 1 // Reassign IDs to be sequential
        }
      })

      setAccountStatements(statementsWithBalance)

    } catch (error) {
      console.error('Error fetching account statement:', error)
    } finally {
      setIsLoadingStatements(false)
    }
  }

  // Fetch purchase invoice items for selected invoice
  const fetchPurchaseInvoiceItems = async (invoiceId: string) => {
    try {
      setIsLoadingItems(true)
      
      const { data, error } = await supabase
        .from('purchase_invoice_items')
        .select(`
          id,
          quantity,
          unit_purchase_price,
          total_price,
          discount_amount,
          notes,
          product:products(
            name,
            barcode,
            category:categories(name)
          )
        `)
        .eq('purchase_invoice_id', invoiceId)
        .order('created_at', { ascending: true })
      
      if (error) {
        console.error('Error fetching purchase invoice items:', error)
        setPurchaseInvoiceItems([])
        return
      }
      
      setPurchaseInvoiceItems(data || [])
      
    } catch (error) {
      console.error('Error fetching purchase invoice items:', error)
      setPurchaseInvoiceItems([])
    } finally {
      setIsLoadingItems(false)
    }
  }

  // Set up real-time subscriptions and fetch initial data
  useEffect(() => {
    if (isOpen && supplier?.id) {
      fetchPurchaseInvoices()
      fetchSupplierPayments()
      fetchAccountStatement()

      // Set up real-time subscription for purchase_invoices
      const invoicesChannel = supabase
        .channel('modal_purchase_invoices_changes')
        .on('postgres_changes',
          { event: '*', schema: 'public', table: 'purchase_invoices' },
          (payload: any) => {
            console.log('Purchase invoices real-time update:', payload)
            fetchPurchaseInvoices()
            fetchSupplierBalance() // Also update balance on invoice changes
            fetchAccountStatement() // Update account statement on invoice changes
          }
        )
        .subscribe()

      // Set up real-time subscription for purchase_invoice_items
      const invoiceItemsChannel = supabase
        .channel('modal_purchase_invoice_items_changes')
        .on('postgres_changes',
          { event: '*', schema: 'public', table: 'purchase_invoice_items' },
          (payload: any) => {
            console.log('Purchase invoice items real-time update:', payload)
            if (purchaseInvoices.length > 0 && selectedTransaction < purchaseInvoices.length) {
              fetchPurchaseInvoiceItems(purchaseInvoices[selectedTransaction].id)
            }
          }
        )
        .subscribe()

      // Set up real-time subscription for supplier_payments
      const paymentsChannel = supabase
        .channel('modal_supplier_payments_changes')
        .on('postgres_changes',
          { event: '*', schema: 'public', table: 'supplier_payments' },
          (payload: any) => {
            console.log('Supplier payments real-time update:', payload)
            fetchSupplierPayments()
            fetchSupplierBalance() // Also update balance on payment changes
            fetchAccountStatement() // Update account statement on payment changes
          }
        )
        .subscribe()

      return () => {
        supabase.removeChannel(invoicesChannel)
        supabase.removeChannel(invoiceItemsChannel)
        supabase.removeChannel(paymentsChannel)
      }
    }
  }, [isOpen, supplier?.id, dateFilter])

  // Fetch supplier balance independently of date filter
  useEffect(() => {
    if (isOpen && supplier?.id) {
      fetchSupplierBalance()
    }
  }, [isOpen, supplier?.id])

  // Fetch purchase invoice items when selected transaction changes
  useEffect(() => {
    if (purchaseInvoices.length > 0 && selectedTransaction < purchaseInvoices.length) {
      fetchPurchaseInvoiceItems(purchaseInvoices[selectedTransaction].id)
    }
  }, [selectedTransaction, purchaseInvoices])

  // Handle delete invoice
  const handleDeleteInvoice = (invoice: any) => {
    setInvoiceToDelete(invoice)
    setShowDeleteModal(true)
  }

  // Confirm delete invoice
  const confirmDeleteInvoice = async () => {
    if (!invoiceToDelete) return

    try {
      setIsDeleting(true)

      // Delete purchase invoice items first (foreign key constraint)
      const { error: purchaseItemsError } = await supabase
        .from('purchase_invoice_items')
        .delete()
        .eq('purchase_invoice_id', invoiceToDelete.id)

      if (purchaseItemsError) {
        console.error('Error deleting purchase invoice items:', purchaseItemsError)
        throw purchaseItemsError
      }

      // Delete the purchase invoice
      const { error: purchaseError } = await supabase
        .from('purchase_invoices')
        .delete()
        .eq('id', invoiceToDelete.id)

      if (purchaseError) {
        console.error('Error deleting purchase invoice:', purchaseError)
        throw purchaseError
      }

      // Close modal and reset state
      setShowDeleteModal(false)
      setInvoiceToDelete(null)
      
      // Refresh data (real-time will handle it but this ensures immediate update)
      fetchPurchaseInvoices()
      
      // Reset selected transaction if needed
      if (selectedTransaction >= purchaseInvoices.length - 1) {
        setSelectedTransaction(Math.max(0, purchaseInvoices.length - 2))
      }

    } catch (error) {
      console.error('Error deleting purchase invoice:', error)
      // You could add a toast notification here for error feedback
    } finally {
      setIsDeleting(false)
    }
  }

  // Cancel delete
  const cancelDelete = () => {
    setShowDeleteModal(false)
    setInvoiceToDelete(null)
  }

  if (!supplier) return null

  // Calculate total payments amount
  const totalPayments = supplierPayments.reduce((sum, payment) => sum + (payment.amount || 0), 0)

  // Calculate total invoices amount (for all invoices, not filtered by date)
  const [totalInvoicesAmount, setTotalInvoicesAmount] = useState(0)

  // Fetch total invoices amount
  useEffect(() => {
    const fetchTotalInvoicesAmount = async () => {
      if (!supplier?.id) return

      const { data, error } = await supabase
        .from('purchase_invoices')
        .select('total_amount, invoice_type')
        .eq('supplier_id', supplier.id)

      if (!error && data) {
        const total = data.reduce((sum, invoice) => {
          if (invoice.invoice_type === 'Purchase Invoice') {
            return sum + (invoice.total_amount || 0)
          } else if (invoice.invoice_type === 'Purchase Return') {
            return sum - (invoice.total_amount || 0)
          }
          return sum
        }, 0)
        setTotalInvoicesAmount(total)
      }
    }

    if (isOpen && supplier?.id) {
      fetchTotalInvoicesAmount()
    }
  }, [isOpen, supplier?.id])

  // Calculate average order value
  const averageOrderValue = purchaseInvoices.length > 0
    ? totalInvoicesAmount / purchaseInvoices.length
    : 0

  // Define columns for each table - exactly like RecordDetailsModal structure
  const statementColumns = [
    {
      id: 'index',
      header: '#',
      accessor: 'id',
      width: 50,
      render: (value: any, item: any, index: number) => (
        <span className="text-gray-400">{item.id}</span>
      )
    },
    {
      id: 'date',
      header: 'التاريخ',
      accessor: 'displayDate',
      width: 120,
      render: (value: string) => <span className="text-white">{value}</span>
    },
    {
      id: 'time',
      header: '⏰ الساعة',
      accessor: 'displayTime',
      width: 80,
      render: (value: string) => <span className="text-blue-400">{value}</span>
    },
    {
      id: 'description',
      header: 'البيان',
      accessor: 'description',
      width: 300,
      render: (value: string) => <span className="text-white">{value}</span>
    },
    {
      id: 'type',
      header: 'نوع العملية',
      accessor: 'type',
      width: 120,
      render: (value: string) => (
        <span className={`px-2 py-1 rounded text-xs font-medium ${
          value === 'فاتورة شراء'
            ? 'bg-blue-600/20 text-blue-400 border border-blue-600'
            : value === 'دفعة'
            ? 'bg-green-600/20 text-green-400 border border-green-600'
            : 'bg-blue-600/20 text-blue-400 border border-blue-600'
        }`}>
          {value}
        </span>
      )
    },
    {
      id: 'amount',
      header: 'المبلغ',
      accessor: 'amount',
      width: 140,
      render: (value: number, item: any) => {
        const isDafeaa = item.type === 'دفعة'
        const isPositive = value > 0
        return (
          <span className={`font-medium ${
            isDafeaa ? 'text-green-400' : 'text-blue-400'
          }`}>
            {isPositive ? '' : ''}{formatPrice(Math.abs(value))}
          </span>
        )
      }
    },
    {
      id: 'balance',
      header: 'الرصيد',
      accessor: 'displayBalance',
      width: 140,
      render: (value: string) => <span className="text-white font-medium">{value}</span>
    }
  ]

  const invoiceColumns = [
    { 
      id: 'index', 
      header: '#', 
      accessor: '#', 
      width: 50,
      render: (value: any, item: any, index: number) => (
        <span className="text-gray-400">{index + 1}</span>
      )
    },
    { 
      id: 'invoice_number', 
      header: 'رقم الفاتورة', 
      accessor: 'invoice_number', 
      width: 180,
      render: (value: string) => <span className="text-blue-400">{value}</span>
    },
    { 
      id: 'created_at', 
      header: 'التاريخ', 
      accessor: 'created_at', 
      width: 120,
      render: (value: string) => {
        const date = new Date(value)
        return <span className="text-white">{date.toLocaleDateString('en-GB')}</span>
      }
    },
    { 
      id: 'time', 
      header: 'الوقت', 
      accessor: 'time', 
      width: 100,
      render: (value: string) => {
        if (!value) return <span className="text-gray-400">-</span>
        const timeOnly = value.substring(0, 5)
        return <span className="text-blue-400 font-mono">{timeOnly}</span>
      }
    },
    { 
      id: 'invoice_type', 
      header: 'نوع الفاتورة', 
      accessor: 'invoice_type', 
      width: 120,
      render: (value: string) => {
        const getInvoiceTypeText = (invoiceType: string) => {
          switch (invoiceType) {
            case 'Purchase Invoice': return 'فاتورة شراء'
            case 'Purchase Return': return 'مرتجع شراء'
            default: return invoiceType || 'غير محدد'
          }
        }
        
        const getInvoiceTypeColor = (invoiceType: string) => {
          switch (invoiceType) {
            case 'Purchase Invoice': return 'bg-blue-900 text-blue-300'
            case 'Purchase Return': return 'bg-yellow-900 text-yellow-300'
            default: return 'bg-gray-900 text-gray-300'
          }
        }
        
        return (
          <span className={`px-2 py-1 rounded text-xs font-medium ${getInvoiceTypeColor(value)}`}>
            {getInvoiceTypeText(value)}
          </span>
        )
      }
    },
    { 
      id: 'supplier_name', 
      header: 'المورد', 
      accessor: 'supplier.name', 
      width: 150,
      render: (value: string, item: any) => <span className="text-white">{item.supplier?.name || 'غير محدد'}</span>
    },
    { 
      id: 'supplier_phone', 
      header: 'الهاتف', 
      accessor: 'supplier.phone', 
      width: 150,
      render: (value: string, item: any) => <span className="text-gray-300 font-mono text-sm">{item.supplier?.phone || '-'}</span>
    },
    { 
      id: 'total_amount', 
      header: 'المبلغ الإجمالي', 
      accessor: 'total_amount', 
      width: 150,
      render: (value: number) => <span className="text-green-400 font-medium">{formatPrice(value)}</span>
    },
    { 
      id: 'notes', 
      header: 'ملاحظات', 
      accessor: 'notes', 
      width: 150,
      render: (value: string) => <span className="text-gray-400">{value || '-'}</span>
    }
  ]

  const paymentsColumns = [
    {
      id: 'index',
      header: '#',
      accessor: '#',
      width: 50,
      render: (value: any, item: any, index: number) => (
        <span className="text-gray-400">{index + 1}</span>
      )
    },
    {
      id: 'payment_date',
      header: 'التاريخ',
      accessor: 'payment_date',
      width: 120,
      render: (value: string) => {
        const date = new Date(value)
        return <span className="text-white">{date.toLocaleDateString('en-GB')}</span>
      }
    },
    {
      id: 'created_at',
      header: '⏰ الساعة',
      accessor: 'created_at',
      width: 80,
      render: (value: string) => {
        const date = new Date(value)
        const time = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
        return <span className="text-blue-400">{time}</span>
      }
    },
    {
      id: 'amount',
      header: 'المبلغ',
      accessor: 'amount',
      width: 140,
      render: (value: number) => <span className="text-green-400 font-medium">{formatPrice(value)}</span>
    },
    {
      id: 'payment_method',
      header: 'طريقة الدفع',
      accessor: 'payment_method',
      width: 120,
      render: (value: string) => {
        const methodNames: {[key: string]: string} = {
          'cash': 'نقدي',
          'card': 'بطاقة',
          'bank_transfer': 'تحويل بنكي',
          'check': 'شيك'
        }
        return <span className="text-blue-400">{methodNames[value] || value}</span>
      }
    },
    {
      id: 'notes',
      header: 'الملاحظات',
      accessor: 'notes',
      width: 200,
      render: (value: string) => <span className="text-gray-400">{value || '-'}</span>
    }
  ]

  const invoiceDetailsColumns = [
    { 
      id: 'index', 
      header: '#', 
      accessor: '#', 
      width: 50,
      render: (value: any, item: any, index: number) => (
        <span className="text-white">{index + 1}</span>
      )
    },
    { 
      id: 'category', 
      header: 'المجموعة', 
      accessor: 'product.category.name', 
      width: 120,
      render: (value: string, item: any) => (
        <span className="text-blue-400">{item.product?.category?.name || 'غير محدد'}</span>
      )
    },
    { 
      id: 'productName', 
      header: 'اسم المنتج', 
      accessor: 'product.name', 
      width: 200,
      render: (value: string, item: any) => (
        <span className="text-white font-medium">{item.product?.name || 'منتج محذوف'}</span>
      )
    },
    { 
      id: 'quantity', 
      header: 'الكمية', 
      accessor: 'quantity', 
      width: 80,
      render: (value: number) => <span className="text-white font-medium">{value}</span>
    },
    { 
      id: 'barcode', 
      header: 'الباركود', 
      accessor: 'product.barcode', 
      width: 150,
      render: (value: string, item: any) => (
        <span className="text-orange-400 font-mono text-sm">{item.product?.barcode || 'غير محدد'}</span>
      )
    },
    { 
      id: 'unit_purchase_price', 
      header: 'السعر', 
      accessor: 'unit_purchase_price', 
      width: 100,
      render: (value: number) => <span className="text-green-400 font-medium">{formatPrice(value)}</span>
    },
    { 
      id: 'discount_amount', 
      header: 'خصم', 
      accessor: 'discount_amount', 
      width: 80,
      render: (value: number) => <span className="text-red-400 font-medium">{value ? value.toFixed(2) : '0%'}</span>
    },
    { 
      id: 'total', 
      header: 'الإجمالي', 
      accessor: 'total', 
      width: 120,
      render: (value: any, item: any) => {
        const total = (item.quantity * item.unit_purchase_price) - (item.discount_amount || 0)
        return <span className="text-green-400 font-bold">{formatPrice(total)}</span>
      }
    },
    { 
      id: 'notes', 
      header: 'ملاحظات', 
      accessor: 'notes', 
      width: 150,
      render: (value: string) => <span className="text-gray-400">{value || '-'}</span>
    }
  ]

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={onClose}
        />
      )}

      {/* Modal */}
      <div className={`fixed inset-0 z-50 transition-opacity duration-300 ${
        isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}>
        <div className="bg-[#2B3544] h-full w-full flex flex-col">
          
          {/* Top Navigation - All buttons in one row */}
          <div className="bg-[#374151] border-b border-gray-600 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-8">
                {/* Action Buttons - Same style as customer list */}
                <div className="flex items-center gap-1">
                  <button className="flex flex-col items-center p-2 text-gray-300 hover:text-white cursor-pointer min-w-[80px] transition-colors">
                    <PencilSquareIcon className="h-5 w-5 mb-1" />
                    <span className="text-sm">تحرير الفاتورة</span>
                  </button>

                  <button 
                    onClick={() => {
                      if (purchaseInvoices.length > 0 && selectedTransaction < purchaseInvoices.length) {
                        handleDeleteInvoice(purchaseInvoices[selectedTransaction])
                      }
                    }}
                    disabled={purchaseInvoices.length === 0 || selectedTransaction >= purchaseInvoices.length}
                    className="flex flex-col items-center p-2 text-red-400 hover:text-red-300 disabled:text-gray-500 disabled:cursor-not-allowed cursor-pointer min-w-[80px] transition-colors"
                  >
                    <TrashIcon className="h-5 w-5 mb-1" />
                    <span className="text-sm">حذف الفاتورة</span>
                  </button>

                  <button className="flex flex-col items-center p-2 text-gray-300 hover:text-white cursor-pointer min-w-[80px] transition-colors">
                    <TableCellsIcon className="h-5 w-5 mb-1" />
                    <span className="text-sm">إدارة الأعمدة</span>
                  </button>
                </div>

                {/* Tab Navigation - Same row */}
                <div className="flex gap-2">
                  <button 
                    onClick={() => setActiveTab('payments')}
                    className={`px-6 py-3 text-base font-medium border-b-2 rounded-t-lg transition-all duration-200 ${
                      activeTab === 'payments' 
                        ? 'text-blue-400 border-blue-400 bg-blue-600/10' 
                        : 'text-gray-300 hover:text-white border-transparent hover:border-gray-400 hover:bg-gray-600/20'
                    }`}
                  >
                    الدفعات
                  </button>
                  <button 
                    onClick={() => setActiveTab('statement')}
                    className={`px-6 py-3 text-base font-medium border-b-2 rounded-t-lg transition-all duration-200 ${
                      activeTab === 'statement' 
                        ? 'text-blue-400 border-blue-400 bg-blue-600/10' 
                        : 'text-gray-300 hover:text-white border-transparent hover:border-gray-400 hover:bg-gray-600/20'
                    }`}
                  >
                    كشف الحساب
                  </button>
                  <button 
                    onClick={() => setActiveTab('invoices')}
                    className={`px-6 py-3 text-base font-semibold border-b-2 rounded-t-lg transition-all duration-200 ${
                      activeTab === 'invoices' 
                        ? 'text-blue-400 border-blue-400 bg-blue-600/10' 
                        : 'text-gray-300 hover:text-white border-transparent hover:border-gray-400 hover:bg-gray-600/20'
                    }`}
                  >
                    فواتير المورد ({purchaseInvoices.length})
                  </button>
                </div>
                
                {/* View Mode Toggle Buttons - Only show for invoices tab */}
                {activeTab === 'invoices' && (
                  <div className="flex gap-1 bg-gray-600/50 rounded-lg p-1">
                    <button
                      onClick={() => setViewMode('invoices-only')}
                      className={`px-3 py-1.5 text-sm font-medium rounded transition-all duration-200 ${
                        viewMode === 'invoices-only'
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'text-gray-300 hover:text-white hover:bg-gray-600/50'
                      }`}
                      title="عرض فواتير المورد فقط"
                    >
                      📋
                    </button>
                    <button
                      onClick={() => setViewMode('split')}
                      className={`px-3 py-1.5 text-sm font-medium rounded transition-all duration-200 ${
                        viewMode === 'split'
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'text-gray-300 hover:text-white hover:bg-gray-600/50'
                      }`}
                      title="عرض مقسم"
                    >
                      ⬌
                    </button>
                    <button
                      onClick={() => setViewMode('details-only')}
                      className={`px-3 py-1.5 text-sm font-medium rounded transition-all duration-200 ${
                        viewMode === 'details-only'
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'text-gray-300 hover:text-white hover:bg-gray-600/50'
                      }`}
                      title="عرض تفاصيل الفاتورة فقط"
                    >
                      📄
                    </button>
                  </div>
                )}
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-white text-lg w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-600/30 transition-colors"
              >
                ×
              </button>
            </div>
          </div>

          <div className="flex flex-1 min-h-0" ref={containerRef}>
            {/* Toggle Button - Flat design on the edge */}
            <div className="flex">
              <button
                onClick={() => setShowSupplierDetails(!showSupplierDetails)}
                className="w-6 bg-[#374151] hover:bg-[#4B5563] border-r border-gray-600 flex items-center justify-center transition-colors duration-200"
                title={showSupplierDetails ? 'إخفاء تفاصيل المورد' : 'إظهار تفاصيل المورد'}
              >
                {showSupplierDetails ? (
                  <ChevronRightIcon className="h-4 w-4 text-gray-300" />
                ) : (
                  <ChevronLeftIcon className="h-4 w-4 text-gray-300" />
                )}
              </button>
            </div>

            {/* Right Sidebar - Supplier Info (First in RTL) */}
            {showSupplierDetails && (
              <div className="w-80 bg-[#3B4754] border-l border-gray-600 flex flex-col">
                
                {/* Supplier Balance */}
                <div className="p-4 border-b border-gray-600">
                  <div className="bg-blue-600 rounded p-4 text-center">
                    <div className="text-2xl font-bold text-white">{formatPrice(supplierBalance)}</div>
                    <div className="text-blue-200 text-sm">رصيد المورد</div>
                  </div>
                </div>

                {/* Supplier Details */}
                <div className="p-4 space-y-4 flex-1">
                  <h3 className="text-white font-medium text-lg text-right">معلومات المورد</h3>
                
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-white">{supplier.name || 'شركة المعدات التقنية'}</span>
                    <span className="text-gray-400 text-sm">اسم المورد</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-white">{supplier.address || '23626125215'}</span>
                    <span className="text-gray-400 text-sm">رقم الهاتف</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-white">المنطقة الوسطى</span>
                    <span className="text-gray-400 text-sm">المنطقة</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-white">6/24/2025</span>
                    <span className="text-gray-400 text-sm">تاريخ التسجيل</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-yellow-400 flex items-center gap-1">
                      <span>Premium</span>
                      <span>⭐</span>
                    </span>
                    <span className="text-gray-400 text-sm">الرتبة</span>
                  </div>
                </div>
              </div>

              {/* Supplier Statistics */}
              <div className="p-4 border-t border-gray-600">
                <h4 className="text-white font-medium mb-3 text-right flex items-center gap-2">
                  <span>📊</span>
                  <span>إحصائيات المورد</span>
                </h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-white">{purchaseInvoices.length}</span>
                    <span className="text-gray-400 text-sm">عدد الفواتير</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-blue-400">{formatPrice(totalInvoicesAmount)}</span>
                    <span className="text-gray-400 text-sm">إجمالي الفواتير</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-green-400">{formatPrice(totalPayments)}</span>
                    <span className="text-gray-400 text-sm">إجمالي الدفعات</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-white">{formatPrice(averageOrderValue)}</span>
                    <span className="text-gray-400 text-sm">متوسط قيمة الطلبية</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-white">
                      {purchaseInvoices.length > 0
                        ? new Date(purchaseInvoices[0].created_at).toLocaleDateString('en-GB')
                        : '-'
                      }
                    </span>
                    <span className="text-gray-400 text-sm">آخر فاتورة</span>
                  </div>
                </div>
              </div>

              {/* Date Filter Button */}
              <div className="p-4 border-t border-gray-600">
                <button
                  onClick={() => setShowDateFilter(true)}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded font-medium flex items-center justify-center gap-2 transition-colors"
                >
                  <CalendarDaysIcon className="h-5 w-5" />
                  <span>التاريخ</span>
                </button>
                
                {/* Current Filter Display */}
                {dateFilter.type !== 'all' && (
                  <div className="mt-2 text-center">
                    <span className="text-xs text-blue-400">
                      {dateFilter.type === 'today' && 'عرض فواتير اليوم'}
                      {dateFilter.type === 'current_week' && 'عرض فواتير الأسبوع الحالي'}
                      {dateFilter.type === 'last_week' && 'عرض فواتير الأسبوع الماضي'}
                      {dateFilter.type === 'current_month' && 'عرض فواتير الشهر الحالي'}
                      {dateFilter.type === 'last_month' && 'عرض فواتير الشهر الماضي'}
                      {dateFilter.type === 'custom' && dateFilter.startDate && dateFilter.endDate && 
                        `من ${dateFilter.startDate.toLocaleDateString('en-GB')} إلى ${dateFilter.endDate.toLocaleDateString('en-GB')}`}
                    </span>
                  </div>
                )}
              </div>
            </div>
            )}

            {/* Main Content Area - Left side containing both tables */}
            <div className="flex-1 flex flex-col min-w-0 relative">
              
              {/* Search Bar */}
              <div className="bg-[#374151] border-b border-gray-600 p-4">
                <div className="relative">
                  <MagnifyingGlassIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="ابحث عن فاتورة (رقم الفاتورة، اسم المورد، أو الهاتف)..."
                    className="w-full pl-4 pr-10 py-2 bg-[#2B3544] border border-gray-600 rounded text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>
              </div>

              {/* Conditional Content Based on Active Tab and View Mode */}
              <div className="flex-1 overflow-hidden relative">
                {activeTab === 'statement' && (
                  <div className="h-full">
                    {isLoadingStatements ? (
                      <div className="flex items-center justify-center h-full">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mr-3"></div>
                        <span className="text-gray-400">جاري تحميل كشف الحساب...</span>
                      </div>
                    ) : accountStatements.length === 0 ? (
                      <div className="flex items-center justify-center h-full">
                        <span className="text-gray-400">لا توجد عمليات في كشف الحساب</span>
                      </div>
                    ) : (
                      <ResizableTable
                        className="h-full w-full"
                        columns={statementColumns}
                        data={accountStatements}
                      />
                    )}
                  </div>
                )}
                
                {activeTab === 'invoices' && (
                  <div className="h-full relative">
                    {/* Invoices Table - Always rendered but z-indexed based on view mode */}
                    <div 
                      className={`absolute inset-0 bg-[#2B3544] transition-all duration-300 ${
                        viewMode === 'details-only' ? 'z-0 opacity-20' : 'z-10'
                      } ${
                        viewMode === 'split' ? '' : 'opacity-100'
                      }`}
                      style={{
                        height: viewMode === 'split' ? `${dividerPosition}%` : '100%',
                        zIndex: viewMode === 'invoices-only' ? 20 : viewMode === 'split' ? 10 : 5
                      }}
                    >
                      {isLoadingInvoices ? (
                        <div className="flex items-center justify-center h-full">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mr-3"></div>
                          <span className="text-gray-400">جاري تحميل الفواتير...</span>
                        </div>
                      ) : (
                        <ResizableTable
                          className="h-full w-full"
                          columns={invoiceColumns}
                          data={purchaseInvoices}
                          selectedRowId={purchaseInvoices[selectedTransaction]?.id?.toString() || null}
                          onRowClick={(invoice: any, index: number) => setSelectedTransaction(index)}
                        />
                      )}
                    </div>

                    {/* Resizable Divider - Only show in split mode */}
                    {viewMode === 'split' && (
                      <div
                        className="absolute left-0 right-0 h-2 bg-gray-600 hover:bg-blue-500 cursor-row-resize z-30 flex items-center justify-center transition-colors duration-200"
                        style={{ top: `${dividerPosition}%`, transform: 'translateY(-50%)' }}
                        onMouseDown={handleMouseDown}
                      >
                        <div className="w-12 h-1 bg-gray-400 rounded-full"></div>
                      </div>
                    )}

                    {/* Invoice Details - Always rendered but z-indexed based on view mode */}
                    <div 
                      className={`absolute inset-0 bg-[#2B3544] flex flex-col transition-all duration-300 ${
                        viewMode === 'invoices-only' ? 'z-0 opacity-20' : 'z-10'
                      }`}
                      style={{
                        top: viewMode === 'split' ? `${dividerPosition}%` : '0',
                        height: viewMode === 'split' ? `${100 - dividerPosition}%` : '100%',
                        zIndex: viewMode === 'details-only' ? 20 : viewMode === 'split' ? 10 : 5
                      }}
                    >
                      <h3 className="text-blue-400 font-medium text-right p-4 pb-2 flex-shrink-0 border-b border-gray-600">
                        تفاصيل الفاتورة {purchaseInvoices[selectedTransaction]?.invoice_number || ''}
                      </h3>
                      
                      <div className="flex-1 min-h-0 px-4 pb-4">
                        {isLoadingItems ? (
                          <div className="flex items-center justify-center h-full">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mr-3"></div>
                            <span className="text-gray-400">جاري تحميل العناصر...</span>
                          </div>
                        ) : (
                          <ResizableTable
                            className="h-full w-full"
                            columns={invoiceDetailsColumns}
                            data={purchaseInvoiceItems}
                          />
                        )}
                      </div>
                    </div>
                  </div>
                )}
                
                {activeTab === 'payments' && (
                  <div className="h-full flex flex-col">
                    {/* Payments Header */}
                    <div className="bg-[#2B3544] border-b border-gray-600 p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <button
                            onClick={() => setShowAddPaymentModal(true)}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm font-medium flex items-center gap-2 transition-colors"
                          >
                            <PlusIcon className="h-4 w-4" />
                            إضافة دفعة
                          </button>
                        </div>
                        <div className="text-right">
                          <div className="text-white text-lg font-medium">دفعات المورد</div>
                          <div className="text-gray-400 text-sm mt-1">إجمالي الدفعات: {formatPrice(totalPayments)}</div>
                        </div>
                      </div>
                    </div>

                    {/* Payments Table */}
                    <div className="flex-1">
                      {isLoadingPayments ? (
                        <div className="flex items-center justify-center h-full">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mr-3"></div>
                          <span className="text-gray-400">جاري تحميل الدفعات...</span>
                        </div>
                      ) : supplierPayments.length === 0 ? (
                        <div className="flex items-center justify-center h-full">
                          <span className="text-gray-400">لا توجد دفعات مسجلة</span>
                        </div>
                      ) : (
                        <ResizableTable
                          className="h-full w-full"
                          columns={paymentsColumns}
                          data={supplierPayments}
                        />
                      )}
                    </div>
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={showDeleteModal}
        onClose={cancelDelete}
        onConfirm={confirmDeleteInvoice}
        isDeleting={isDeleting}
        title="تأكيد حذف فاتورة الشراء"
        message="هل أنت متأكد أنك تريد حذف هذه فاتورة الشراء؟"
        itemName={invoiceToDelete ? `فاتورة شراء رقم: ${invoiceToDelete.invoice_number}` : ''}
      />

      {/* Date Filter Modal */}
      <SimpleDateFilterModal
        isOpen={showDateFilter}
        onClose={() => setShowDateFilter(false)}
        onDateFilterChange={(filter) => {
          setDateFilter(filter)
        }}
        currentFilter={dateFilter}
      />

      {/* Add Payment Modal */}
      <AddPaymentModal
        isOpen={showAddPaymentModal}
        onClose={() => setShowAddPaymentModal(false)}
        entityId={supplier.id}
        entityType="supplier"
        entityName={supplier.name}
        currentBalance={supplierBalance}
        onPaymentAdded={() => {
          fetchSupplierPayments()
          fetchSupplierBalance()
        }}
      />
    </>
  )
}