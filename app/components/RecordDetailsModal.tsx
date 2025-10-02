'use client'

import { useState, useRef, useCallback, useEffect, useMemo } from 'react'
import { MagnifyingGlassIcon, XMarkIcon, ChevronLeftIcon, ChevronRightIcon, PlusIcon, PencilSquareIcon, TrashIcon, TableCellsIcon, CalendarDaysIcon } from '@heroicons/react/24/outline'
import ResizableTable from './tables/ResizableTable'
import { supabase } from '../lib/supabase/client'
import ConfirmDeleteModal from './ConfirmDeleteModal'
import SimpleDateFilterModal, { DateFilter } from './SimpleDateFilterModal'
import { useFormatPrice } from '@/lib/hooks/useCurrency'

interface RecordDetailsModalProps {
  isOpen: boolean
  onClose: () => void
  record: any
}

type ViewMode = 'split' | 'records-only' | 'details-only'

export default function RecordDetailsModal({ isOpen, onClose, record }: RecordDetailsModalProps) {
  const formatPrice = useFormatPrice();
  const [selectedTransaction, setSelectedTransaction] = useState(0) // First row selected (index 0)
  const [showRecordDetails, setShowRecordDetails] = useState(true)
  const [activeTab, setActiveTab] = useState('transactions') // 'transactions', 'payments', 'statement'
  const [viewMode, setViewMode] = useState<ViewMode>('split')
  const [dividerPosition, setDividerPosition] = useState(50) // Percentage
  const [isDragging, setIsDragging] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Real-time state for sales and sale items
  const [sales, setSales] = useState<any[]>([])
  const [saleItems, setSaleItems] = useState<any[]>([])
  const [isLoadingSales, setIsLoadingSales] = useState(false)
  const [isLoadingItems, setIsLoadingItems] = useState(false)

  // Real-time state for purchase invoices and purchase invoice items
  const [purchaseInvoices, setPurchaseInvoices] = useState<any[]>([])
  const [purchaseInvoiceItems, setPurchaseInvoiceItems] = useState<any[]>([])
  const [isLoadingPurchases, setIsLoadingPurchases] = useState(false)
  const [isLoadingPurchaseItems, setIsLoadingPurchaseItems] = useState(false)

  // Delete confirmation modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [transactionToDelete, setTransactionToDelete] = useState<any>(null)

  // Search state
  const [searchQuery, setSearchQuery] = useState('')
  const [highlightedProductId, setHighlightedProductId] = useState<string | null>(null)
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null)

  // Date filter state
  const [showDateFilter, setShowDateFilter] = useState(false)
  const [dateFilter, setDateFilter] = useState<DateFilter>({ type: 'today' })
  const [isLoadingPreferences, setIsLoadingPreferences] = useState(true)

  // Calculate real record balance based on filtered transactions
  const recordBalance = useMemo(() => {
    const salesTotal = sales.reduce((sum, sale) => sum + (sale.total_amount || 0), 0)
    const purchasesTotal = purchaseInvoices.reduce((sum, purchase) => sum + (purchase.total_amount || 0), 0)
    return salesTotal - purchasesTotal
  }, [sales, purchaseInvoices])

  // Load date filter preferences from database
  const loadDateFilterPreferences = async () => {
    if (!record?.id) return

    try {
      const { data, error } = await (supabase as any)
        .from('user_column_preferences')
        .select('preferences')
        .eq('user_id', 'default_user') // You can replace with actual user_id from auth
        .eq('table_name', `record_${record.id}_date_filter`)
        .single()

      if (!error && data?.preferences) {
        const savedFilter = data.preferences as unknown as DateFilter
        setDateFilter(savedFilter)
      }
    } catch (error) {
      console.error('Error loading date filter preferences:', error)
    } finally {
      setIsLoadingPreferences(false)
    }
  }

  // Save date filter preferences to database
  const saveDateFilterPreferences = async (filter: DateFilter) => {
    if (!record?.id) return

    try {
      const { error } = await (supabase as any)
        .from('user_column_preferences')
        .upsert({
          user_id: 'default_user', // You can replace with actual user_id from auth
          table_name: `record_${record.id}_date_filter`,
          preferences: filter,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,table_name'
        })

      if (error) {
        console.error('Error saving date filter preferences:', error)
      }
    } catch (error) {
      console.error('Error saving date filter preferences:', error)
    }
  }

  // Load preferences on mount
  useEffect(() => {
    if (isOpen && record?.id) {
      loadDateFilterPreferences()
    }

    // Cleanup timeout on unmount
    return () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout)
      }
    }
  }, [isOpen, record?.id])

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (viewMode !== 'split' || activeTab !== 'transactions') return
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

  // Fetch sales from Supabase for the specific record
  const fetchSales = async () => {
    if (!record?.id) return
    
    try {
      setIsLoadingSales(true)
      
      let query = supabase
        .from('sales')
        .select(`
          id,
          invoice_number,
          customer_id,
          total_amount,
          payment_method,
          notes,
          created_at,
          time,
          invoice_type,
          customer:customers(
            name,
            phone
          )
        `)
        .eq('record_id', record.id)
      
      // Apply date filter
      query = applyDateFilter(query)
      
      const { data, error } = await query
        .order('created_at', { ascending: false })
        .limit(50)
      
      if (error) {
        console.error('Error fetching sales:', error)
        return
      }
      
      setSales(data || [])
      
      // Auto-select first sale if available
      if (data && data.length > 0) {
        setSelectedTransaction(0)
        fetchSaleItems(data[0].id)
      }
      
    } catch (error) {
      console.error('Error fetching sales:', error)
    } finally {
      setIsLoadingSales(false)
    }
  }

  // Fetch sale items for selected sale
  const fetchSaleItems = async (saleId: string) => {
    try {
      setIsLoadingItems(true)
      
      const { data, error } = await supabase
        .from('sale_items')
        .select(`
          id,
          quantity,
          unit_price,
          cost_price,
          discount,
          notes,
          product:products(
            name,
            barcode,
            category:categories(name)
          )
        `)
        .eq('sale_id', saleId)
        .order('created_at', { ascending: true })
      
      if (error) {
        console.error('Error fetching sale items:', error)
        setSaleItems([])
        return
      }
      
      setSaleItems(data || [])
      
    } catch (error) {
      console.error('Error fetching sale items:', error)
      setSaleItems([])
    } finally {
      setIsLoadingItems(false)
    }
  }

  // Fetch purchase invoices from Supabase for the specific record
  const fetchPurchaseInvoices = async () => {
    if (!record?.id) return
    
    try {
      setIsLoadingPurchases(true)
      
      let query = supabase
        .from('purchase_invoices')
        .select(`
          id,
          invoice_number,
          supplier_id,
          total_amount,
          payment_status,
          notes,
          created_at,
          time,
          invoice_type,
          supplier:suppliers(
            name,
            phone
          )
        `)
        .eq('record_id', record.id)
      
      // Apply date filter
      query = applyDateFilter(query)
      
      const { data, error } = await query
        .order('created_at', { ascending: false })
        .limit(50)
      
      if (error) {
        console.error('Error fetching purchase invoices:', error)
        return
      }
      
      setPurchaseInvoices(data || [])
      
    } catch (error) {
      console.error('Error fetching purchase invoices:', error)
    } finally {
      setIsLoadingPurchases(false)
    }
  }

  // Fetch purchase invoice items for selected purchase invoice
  const fetchPurchaseInvoiceItems = async (purchaseInvoiceId: string) => {
    try {
      setIsLoadingPurchaseItems(true)
      
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
        .eq('purchase_invoice_id', purchaseInvoiceId)
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
      setIsLoadingPurchaseItems(false)
    }
  }

  // Set up real-time subscriptions and fetch initial data
  useEffect(() => {
    if (isOpen && record?.id && !isLoadingPreferences) {
      fetchSales()
      fetchPurchaseInvoices()

      // Set up real-time subscription for sales
      const salesChannel = supabase
        .channel('record_modal_sales_changes')
        .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'sales' },
          (payload: any) => {
            console.log('Sales real-time update:', payload)
            fetchSales()
          }
        )
        .subscribe()

      // Set up real-time subscription for sale_items
      const saleItemsChannel = supabase
        .channel('record_modal_sale_items_changes')
        .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'sale_items' },
          (payload: any) => {
            console.log('Sale items real-time update:', payload)
            if (sales.length > 0 && selectedTransaction < sales.length) {
              fetchSaleItems(sales[selectedTransaction].id)
            }
          }
        )
        .subscribe()

      // Set up real-time subscription for purchase_invoices
      const purchaseInvoicesChannel = supabase
        .channel('record_modal_purchase_invoices_changes')
        .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'purchase_invoices' },
          (payload: any) => {
            console.log('Purchase invoices real-time update:', payload)
            fetchPurchaseInvoices()
          }
        )
        .subscribe()

      // Set up real-time subscription for purchase_invoice_items
      const purchaseInvoiceItemsChannel = supabase
        .channel('record_modal_purchase_invoice_items_changes')
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

      return () => {
        supabase.removeChannel(salesChannel)
        supabase.removeChannel(saleItemsChannel)
        supabase.removeChannel(purchaseInvoicesChannel)
        supabase.removeChannel(purchaseInvoiceItemsChannel)
      }
    }
  }, [isOpen, record?.id, dateFilter, isLoadingPreferences])

  // Search for product in invoices
  const searchProductInInvoices = async (query: string) => {
    if (!query.trim() || !record?.id) {
      setSearchQuery('')
      setHighlightedProductId(null)
      // Reset to normal view with date filter
      fetchSales()
      fetchPurchaseInvoices()
      return
    }

    setSearchQuery(query)
    setIsLoadingSales(true)
    setIsLoadingPurchases(true)

    try {
      // First, search for products matching the query
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('id, name, barcode')
        .or(`name.ilike.%${query}%,barcode.ilike.%${query}%`)
        .limit(50)

      if (productsError || !productsData || productsData.length === 0) {
        console.log('No products found matching:', query)
        setSales([])
        setPurchaseInvoices([])
        setHighlightedProductId(null)
        setIsLoadingSales(false)
        setIsLoadingPurchases(false)
        return
      }

      const productIds = productsData.map(p => p.id)
      const firstProductId = productsData[0].id

      // Search in sale_items for these products
      const { data: saleItemsData } = await supabase
        .from('sale_items')
        .select('sale_id, product_id')
        .in('product_id', productIds)

      // Search in purchase_invoice_items for these products
      const { data: purchaseItemsData } = await supabase
        .from('purchase_invoice_items')
        .select('purchase_invoice_id, product_id')
        .in('product_id', productIds)

      // Get unique sale and purchase IDs
      const saleIds = Array.from(new Set(saleItemsData?.map((item: any) => item.sale_id) || []))
      const purchaseIds = Array.from(new Set(purchaseItemsData?.map((item: any) => item.purchase_invoice_id) || []))

      // Fetch matching sales with date filter
      let matchingSales: any[] = []
      if (saleIds.length > 0) {
        let salesQuery = supabase
          .from('sales')
          .select(`
            id,
            invoice_number,
            customer_id,
            total_amount,
            payment_method,
            notes,
            created_at,
            time,
            invoice_type,
            customer:customers(
              name,
              phone
            )
          `)
          .eq('record_id', record.id)
          .in('id', saleIds)

        // Apply date filter
        salesQuery = applyDateFilter(salesQuery)

        const { data: salesData } = await salesQuery.order('created_at', { ascending: false })
        matchingSales = salesData || []
      }

      // Fetch matching purchases with date filter
      let matchingPurchases: any[] = []
      if (purchaseIds.length > 0) {
        let purchasesQuery = supabase
          .from('purchase_invoices')
          .select(`
            id,
            invoice_number,
            supplier_id,
            total_amount,
            payment_status,
            notes,
            created_at,
            time,
            invoice_type,
            supplier:suppliers(
              name,
              phone
            )
          `)
          .eq('record_id', record.id)
          .in('id', purchaseIds)

        // Apply date filter
        purchasesQuery = applyDateFilter(purchasesQuery)

        const { data: purchasesData } = await purchasesQuery.order('created_at', { ascending: false })
        matchingPurchases = purchasesData || []
      }

      // Update sales and purchases with search results
      setSales(matchingSales)
      setPurchaseInvoices(matchingPurchases)

      // Highlight the first found product
      setHighlightedProductId(firstProductId)

      // Auto-select first transaction if available
      if (matchingSales.length > 0 || matchingPurchases.length > 0) {
        setSelectedTransaction(0)

        // Load items for first transaction
        if (matchingSales.length > 0) {
          fetchSaleItems(matchingSales[0].id)
        } else if (matchingPurchases.length > 0) {
          fetchPurchaseInvoiceItems(matchingPurchases[0].id)
        }
      }

    } catch (error) {
      console.error('Search error:', error)
    } finally {
      setIsLoadingSales(false)
      setIsLoadingPurchases(false)
    }
  }

  // Create combined transactions array from sales and purchase invoices
  const allTransactions = useMemo(() => {
    const salesWithType = sales.map(sale => ({
      ...sale,
      transactionType: 'sale',
      amount: sale.total_amount,
      client: sale.customer,
      clientType: 'عميل'
    }))

    const purchasesWithType = purchaseInvoices.map(purchase => ({
      ...purchase,
      transactionType: 'purchase',
      amount: purchase.total_amount,
      client: purchase.supplier,
      clientType: 'مورد'
    }))

    // Combine and sort by creation date
    return [...salesWithType, ...purchasesWithType].sort((a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
  }, [sales, purchaseInvoices])

  // Create combined transaction items based on selected transaction type
  const allTransactionItems = useMemo(() => {
    if (allTransactions.length === 0 || selectedTransaction >= allTransactions.length) return []
    
    const selectedTxn = allTransactions[selectedTransaction]
    if (selectedTxn.transactionType === 'sale') {
      return saleItems.map(item => ({ ...item, itemType: 'sale' }))
    } else if (selectedTxn.transactionType === 'purchase') {
      return purchaseInvoiceItems.map(item => ({ ...item, itemType: 'purchase' }))
    }
    return []
  }, [allTransactions, selectedTransaction, saleItems, purchaseInvoiceItems])

  // Fetch transaction items when selected transaction changes
  useEffect(() => {
    if (allTransactions.length > 0 && selectedTransaction < allTransactions.length) {
      const selectedTxn = allTransactions[selectedTransaction]
      if (selectedTxn.transactionType === 'sale') {
        fetchSaleItems(selectedTxn.id)
        setPurchaseInvoiceItems([]) // Clear purchase items
      } else if (selectedTxn.transactionType === 'purchase') {
        fetchPurchaseInvoiceItems(selectedTxn.id)
        setSaleItems([]) // Clear sale items
      }
    }
  }, [selectedTransaction, allTransactions])

  // Handle delete transaction
  const handleDeleteTransaction = (transaction: any) => {
    setTransactionToDelete(transaction)
    setShowDeleteModal(true)
  }

  // Confirm delete transaction
  const confirmDeleteTransaction = async () => {
    if (!transactionToDelete) return

    try {
      setIsDeleting(true)

      if (transactionToDelete.transactionType === 'sale') {
        // Delete sale items first (foreign key constraint)
        const { error: saleItemsError } = await supabase
          .from('sale_items')
          .delete()
          .eq('sale_id', transactionToDelete.id)

        if (saleItemsError) {
          console.error('Error deleting sale items:', saleItemsError)
          throw saleItemsError
        }

        // Delete the sale
        const { error: saleError } = await supabase
          .from('sales')
          .delete()
          .eq('id', transactionToDelete.id)

        if (saleError) {
          console.error('Error deleting sale:', saleError)
          throw saleError
        }
      } else if (transactionToDelete.transactionType === 'purchase') {
        // Delete purchase invoice items first (foreign key constraint)
        const { error: purchaseItemsError } = await supabase
          .from('purchase_invoice_items')
          .delete()
          .eq('purchase_invoice_id', transactionToDelete.id)

        if (purchaseItemsError) {
          console.error('Error deleting purchase invoice items:', purchaseItemsError)
          throw purchaseItemsError
        }

        // Delete the purchase invoice
        const { error: purchaseError } = await supabase
          .from('purchase_invoices')
          .delete()
          .eq('id', transactionToDelete.id)

        if (purchaseError) {
          console.error('Error deleting purchase invoice:', purchaseError)
          throw purchaseError
        }
      }

      // Close modal and reset state
      setShowDeleteModal(false)
      setTransactionToDelete(null)
      
      // Refresh data (real-time will handle it but this ensures immediate update)
      fetchSales()
      fetchPurchaseInvoices()
      
      // Reset selected transaction if needed
      if (selectedTransaction >= allTransactions.length - 1) {
        setSelectedTransaction(Math.max(0, allTransactions.length - 2))
      }

    } catch (error) {
      console.error('Error deleting transaction:', error)
      // You could add a toast notification here for error feedback
    } finally {
      setIsDeleting(false)
    }
  }

  // Cancel delete
  const cancelDelete = () => {
    setShowDeleteModal(false)
    setTransactionToDelete(null)
  }

  if (!record) return null

  // Sample account statement data - opening balance, transactions, and payments
  const accountStatements = [
    {
      id: 1,
      date: '7/15/2025',
      time: '07:46 AM',
      description: 'REC-175254784358 قيد محاسبي',
      type: 'قيد محاسبي',
      amount: `${formatPrice(1677)}+`,
      balance: formatPrice(190322)
    },
    {
      id: 2,
      date: '7/3/2025',
      time: '01:22 AM',
      description: 'تحويل داخلي',
      type: 'تحويل',
      amount: `${formatPrice(6000)}-`,
      balance: formatPrice(188645)
    },
    {
      id: 3,
      date: '7/2/2025',
      time: '04:44 AM',
      description: 'REC-175142668178 قيد محاسبي',
      type: 'قيد محاسبي',
      amount: `${formatPrice(210)}+`,
      balance: formatPrice(194645)
    },
    {
      id: 4,
      date: '6/30/2025',
      time: '12:33 AM',
      description: 'تسوية حسابية',
      type: 'تسوية',
      amount: `${formatPrice(7000)}-`,
      balance: formatPrice(194435)
    },
    {
      id: 5,
      date: '6/29/2025',
      time: '06:05 PM',
      description: 'REC-175120953803 قيد محاسبي',
      type: 'قيد محاسبي',
      amount: `${formatPrice(850)}+`,
      balance: formatPrice(201435)
    },
    {
      id: 6,
      date: '6/29/2025',
      time: '05:42 PM',
      description: 'REC-175120816250 قيد محاسبي',
      type: 'قيد محاسبي',
      amount: `${formatPrice(100)}+`,
      balance: formatPrice(200585)
    },
    {
      id: 7,
      date: '6/28/2025',
      time: '11:23 PM',
      description: 'REC-175114219445 قيد محاسبي',
      type: 'قيد محاسبي',
      amount: `${formatPrice(485)}+`,
      balance: formatPrice(200485)
    },
    {
      id: 8,
      date: '6/24/2025',
      time: '04:35 PM',
      description: 'الرصيد الأولي',
      type: 'رصيد أولي',
      amount: `${formatPrice(200000)}+`,
      balance: formatPrice(200000)
    }
  ]

  // Sample payments/transfers data
  const payments = [
    {
      id: 1,
      date: '7/2/2025',
      time: '01:22 AM',
      amount: formatPrice(6000),
      notes: 'تحويل داخلي'
    },
    {
      id: 2,
      date: '6/29/2025', 
      time: '12:33 AM',
      amount: formatPrice(7000),
      notes: 'تسوية حسابية'
    }
  ]

  // Sample invoices data
  const transactions = [
    {
      id: 1,
      invoiceNumber: 'INV-2025-001',
      date: 'July 15, 2025',
      day: 'الثلاثاء',
      barcode: '1234567890123',
      totalAmount: formatPrice(1677),
      paymentMethod: 'نقدي',
      invoiceType: 'بيع',
      notes: 'فاتورة عادية',
      updateDate: '03:22 PM - 6/30/2025',
      updatedBy: 'محمد علي'
    },
    {
      id: 2,
      invoiceNumber: 'INV-2025-002',
      date: 'July 2, 2025', 
      day: 'الأربعاء',
      barcode: '1234567890124',
      totalAmount: formatPrice(210),
      paymentMethod: 'فيزا',
      invoiceType: 'بيع',
      notes: '',
      updateDate: '01:15 PM - 7/2/2025',
      updatedBy: 'فاطمة أحمد'
    },
    {
      id: 3,
      invoiceNumber: 'INV-2025-003',
      date: 'June 29, 2025',
      day: 'الأحد', 
      barcode: '1234567890125',
      totalAmount: formatPrice(850),
      paymentMethod: 'نقدي',
      invoiceType: 'بيع',
      notes: 'عميل VIP',
      updateDate: '11:30 AM - 6/29/2025',
      updatedBy: 'عبد الرحمن'
    },
    {
      id: 4,
      invoiceNumber: 'RET-2025-001',
      date: 'June 29, 2025',
      day: 'الأحد',
      barcode: '1234567890126',
      totalAmount: `-${formatPrice(100)}`,
      paymentMethod: 'نقدي',
      invoiceType: 'مرتجع',
      notes: 'مرتجع معيب',
      updateDate: '04:45 PM - 6/29/2025',
      updatedBy: 'سارة محمد'
    },
    {
      id: 5,
      invoiceNumber: 'INV-2025-004',
      date: 'June 28, 2025',
      day: 'السبت',
      barcode: '1234567890127',
      totalAmount: formatPrice(485), 
      paymentMethod: 'ماستركارد',
      invoiceType: 'بيع',
      notes: '',
      updateDate: '09:15 AM - 6/28/2025',
      updatedBy: 'أحمد خالد'
    }
  ]

  // Sample invoice details data for selected invoice
  const transactionDetails = [
    {
      id: 1,
      category: 'الإلكترونيات',
      productName: 'هاتف سامسونج جالاكسي',
      quantity: 2,
      productCode: 'PHONE-001',
      barcode: '1234567890001',
      variant: { color: 'أسود', shape: 'عادي' },
      price: 15000.00,
      discount: 5,
      total: 28500.00
    },
    {
      id: 2,
      category: 'الإلكترونيات',
      productName: 'سماعات بلوتوث',
      quantity: 1,
      productCode: 'HEADPHONE-001',
      barcode: '1234567890002',
      variant: { color: 'أبيض' },
      price: 2500.00,
      discount: 10,
      total: 2250.00
    },
    {
      id: 3,
      category: 'الملابس',
      productName: 'تي شيرت قطني',
      quantity: 3,
      productCode: 'TSHIRT-001',
      barcode: '1234567890003',
      variant: { color: 'أزرق', shape: 'L' },
      price: 250.00,
      discount: 0,
      total: 750.00
    },
    {
      id: 4,
      category: 'المنزل',
      productName: 'كوب قهوة زجاجي',
      quantity: 6,
      productCode: 'CUP-001',
      barcode: '1234567890004',
      variant: {},
      price: 75.00,
      discount: 15,
      total: 382.50
    },
    {
      id: 5,
      category: 'الكتب',
      productName: 'كتاب البرمجة',
      quantity: 1,
      productCode: 'BOOK-001',
      barcode: '1234567890005',
      variant: {},
      price: 500.00,
      discount: 20,
      total: 400.00
    }
  ];

  // Define columns for each table - exactly like Products page structure
  const statementColumns = [
    { 
      id: 'index', 
      header: '#', 
      accessor: '#', 
      width: 50,
      render: (value: any, item: any, index: number) => (
        <span className="text-gray-400">{item.id}</span>
      )
    },
    { 
      id: 'date', 
      header: 'التاريخ', 
      accessor: 'date', 
      width: 120,
      render: (value: string) => <span className="text-white">{value}</span>
    },
    { 
      id: 'time', 
      header: '⏰ الساعة', 
      accessor: 'time', 
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
          value === 'قيد محاسبي' 
            ? 'bg-purple-600/20 text-purple-400 border border-purple-600' 
            : value === 'تحويل'
            ? 'bg-blue-600/20 text-blue-400 border border-blue-600'
            : value === 'تسوية'
            ? 'bg-orange-600/20 text-orange-400 border border-orange-600'
            : 'bg-green-600/20 text-green-400 border border-green-600'
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
      render: (value: string) => (
        <span className={`font-medium ${
          value && value.includes('+') 
            ? 'text-green-400' 
            : 'text-red-400'
        }`}>
          {value}
        </span>
      )
    },
    { 
      id: 'balance', 
      header: 'الرصيد', 
      accessor: 'balance', 
      width: 140,
      render: (value: string) => <span className="text-blue-400 font-medium">{value}</span>
    }
  ]

  const transactionColumns = [
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
      id: 'client_name', 
      header: 'العميل/المورد', 
      accessor: 'client.name', 
      width: 150,
      render: (value: string, item: any) => (
        <div>
          <span className="text-white">{item.client?.name || 'غير محدد'}</span>
          <br />
          <span className="text-xs text-gray-400">({item.clientType})</span>
        </div>
      )
    },
    { 
      id: 'client_phone', 
      header: 'الهاتف', 
      accessor: 'client.phone', 
      width: 150,
      render: (value: string, item: any) => <span className="text-gray-300 font-mono text-sm">{item.client?.phone || '-'}</span>
    },
    { 
      id: 'total_amount', 
      header: 'المبلغ الإجمالي', 
      accessor: 'total_amount', 
      width: 150,
      render: (value: number) => <span className="text-green-400 font-medium">{formatPrice(value, 'system')}</span>
    },
    { 
      id: 'payment_method', 
      header: 'طريقة الدفع', 
      accessor: 'payment_method', 
      width: 120,
      render: (value: string) => <span className="text-blue-400">{value || 'نقد'}</span>
    },
    { 
      id: 'invoice_type', 
      header: 'نوع الفاتورة', 
      accessor: 'invoice_type', 
      width: 120,
      render: (value: string, item: any) => {
        const getInvoiceTypeText = (invoiceType: string, transactionType: string, notes: string) => {
          // Check if this is a transfer invoice by looking for [TRANSFER] prefix in notes
          if (notes && notes.startsWith('[TRANSFER]')) {
            return 'نقل'
          }
          
          if (transactionType === 'purchase') {
            switch (invoiceType) {
              case 'Purchase Invoice': return 'فاتورة شراء'
              case 'Purchase Return': return 'مرتجع شراء'
              default: return 'فاتورة شراء'
            }
          } else {
            switch (invoiceType) {
              case 'sale': return 'فاتورة بيع'
              case 'Sale Invoice': return 'فاتورة بيع'
              case 'Sale Return': return 'مرتجع بيع'
              default: return invoiceType || 'فاتورة بيع'
            }
          }
        }
        
        const getInvoiceTypeColor = (invoiceType: string, transactionType: string, notes: string) => {
          // Check if this is a transfer invoice by looking for [TRANSFER] prefix in notes
          if (notes && notes.startsWith('[TRANSFER]')) {
            return 'bg-orange-600/20 text-orange-400 border border-orange-600'
          }
          
          if (transactionType === 'purchase') {
            switch (invoiceType) {
              case 'Purchase Invoice': return 'bg-blue-600/20 text-blue-400 border border-blue-600'
              case 'Purchase Return': return 'bg-purple-600/20 text-purple-400 border border-purple-600'
              default: return 'bg-blue-600/20 text-blue-400 border border-blue-600'
            }
          } else {
            switch (invoiceType) {
              case 'sale': 
              case 'Sale Invoice': return 'bg-green-600/20 text-green-400 border border-green-600'
              case 'Sale Return': return 'bg-orange-600/20 text-orange-400 border border-orange-600'
              default: return 'bg-green-600/20 text-green-400 border border-green-600'
            }
          }
        }
        
        return (
          <span className={`px-2 py-1 rounded text-xs font-medium ${getInvoiceTypeColor(value, item.transactionType, item.notes)}`}>
            {getInvoiceTypeText(value, item.transactionType, item.notes)}
          </span>
        )
      }
    },
    { 
      id: 'notes', 
      header: 'ملاحظات', 
      accessor: 'notes', 
      width: 150,
      render: (value: string) => {
        // Clean up transfer notes by removing [TRANSFER] prefix
        const cleanNotes = value && value.startsWith('[TRANSFER]') 
          ? value.replace('[TRANSFER] ', '') 
          : value
        return <span className="text-gray-400">{cleanNotes || '-'}</span>
      }
    }
  ]

  const paymentsColumns = [
    { 
      id: 'index', 
      header: '#', 
      accessor: '#', 
      width: 50,
      render: (value: any, item: any, index: number) => (
        <span className="text-gray-400">{item.id}</span>
      )
    },
    { 
      id: 'date', 
      header: 'التاريخ', 
      accessor: 'date', 
      width: 120,
      render: (value: string) => <span className="text-white">{value}</span>
    },
    { 
      id: 'time', 
      header: '⏰ الساعة', 
      accessor: 'time', 
      width: 80,
      render: (value: string) => <span className="text-blue-400">{value}</span>
    },
    { 
      id: 'amount', 
      header: 'المبلغ', 
      accessor: 'amount', 
      width: 140,
      render: (value: string) => <span className="text-green-400 font-medium">{value}</span>
    },
    { 
      id: 'notes', 
      header: 'الملاحظات', 
      accessor: 'notes', 
      width: 200,
      render: (value: string) => <span className="text-gray-400">{value}</span>
    }
  ]

  const transactionDetailsColumns = [
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
      render: (value: string, item: any) => {
        const isHighlighted = highlightedProductId === item.product?.id
        return (
          <span className={`${isHighlighted ? 'bg-yellow-500/40 px-2 py-1 rounded text-yellow-100 font-semibold' : 'text-purple-400'}`}>
            {item.product?.category?.name || 'غير محدد'}
          </span>
        )
      }
    },
    {
      id: 'productName',
      header: 'اسم المنتج',
      accessor: 'product.name',
      width: 200,
      render: (value: string, item: any) => {
        const isHighlighted = highlightedProductId === item.product?.id
        return (
          <div className={`flex items-center gap-2 ${isHighlighted ? 'bg-yellow-500/40 px-2 py-1 rounded' : ''}`}>
            {isHighlighted && <span className="text-yellow-300 text-lg">★</span>}
            <span className={`font-medium ${isHighlighted ? 'text-yellow-100 font-bold' : 'text-white'}`}>
              {item.product?.name || 'منتج محذوف'}
            </span>
          </div>
        )
      }
    },
    { 
      id: 'quantity', 
      header: 'الكمية', 
      accessor: 'quantity', 
      width: 80,
      render: (value: number) => <span className="text-blue-400 font-medium">{value}</span>
    },
    { 
      id: 'barcode', 
      header: 'الباركود', 
      accessor: 'product.barcode', 
      width: 150,
      render: (value: string, item: any) => (
        <span className="text-gray-300 font-mono text-sm">{item.product?.barcode || '-'}</span>
      )
    },
    { 
      id: 'unit_price', 
      header: 'السعر', 
      accessor: 'unit_price', 
      width: 100,
      render: (value: number, item: any) => {
        const price = item.itemType === 'purchase' ? item.unit_purchase_price : item.unit_price
        return <span className="text-green-400 font-medium">{price ? price.toFixed(2) : '0.00'}</span>
      }
    },
    { 
      id: 'discount', 
      header: 'خصم', 
      accessor: 'discount', 
      width: 80,
      render: (value: number, item: any) => {
        const discount = item.itemType === 'purchase' ? item.discount_amount : item.discount
        return <span className="text-orange-400 font-medium">{discount ? discount.toFixed(2) : '0.00'}</span>
      }
    },
    { 
      id: 'total', 
      header: 'الإجمالي', 
      accessor: 'total', 
      width: 120,
      render: (value: any, item: any) => {
        let total: number
        if (item.itemType === 'purchase') {
          // For purchase items, use total_price if available, otherwise calculate
          total = item.total_price || ((item.quantity * item.unit_purchase_price) - (item.discount_amount || 0))
        } else {
          // For sale items, calculate from unit_price
          total = (item.quantity * item.unit_price) - (item.discount || 0)
        }
        return <span className="text-green-400 font-bold">{total.toFixed(2)}</span>
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
                      if (allTransactions.length > 0 && selectedTransaction < allTransactions.length) {
                        handleDeleteTransaction(allTransactions[selectedTransaction])
                      }
                    }}
                    disabled={allTransactions.length === 0 || selectedTransaction >= allTransactions.length}
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
                    التحويلات
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
                    onClick={() => setActiveTab('transactions')}
                    className={`px-6 py-3 text-base font-semibold border-b-2 rounded-t-lg transition-all duration-200 ${
                      activeTab === 'transactions' 
                        ? 'text-blue-400 border-blue-400 bg-blue-600/10' 
                        : 'text-gray-300 hover:text-white border-transparent hover:border-gray-400 hover:bg-gray-600/20'
                    }`}
                  >
                    فواتير السجل ({allTransactions.length})
                  </button>
                </div>
                
                {/* View Mode Toggle Buttons - Only show for transactions tab */}
                {activeTab === 'transactions' && (
                  <div className="flex gap-1 bg-gray-600/50 rounded-lg p-1">
                    <button
                      onClick={() => setViewMode('records-only')}
                      className={`px-3 py-1.5 text-sm font-medium rounded transition-all duration-200 ${
                        viewMode === 'records-only'
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'text-gray-300 hover:text-white hover:bg-gray-600/50'
                      }`}
                      title="عرض فواتير السجل فقط"
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
                onClick={() => setShowRecordDetails(!showRecordDetails)}
                className="w-6 bg-[#374151] hover:bg-[#4B5563] border-r border-gray-600 flex items-center justify-center transition-colors duration-200"
                title={showRecordDetails ? 'إخفاء تفاصيل السجل' : 'إظهار تفاصيل السجل'}
              >
                {showRecordDetails ? (
                  <ChevronRightIcon className="h-4 w-4 text-gray-300" />
                ) : (
                  <ChevronLeftIcon className="h-4 w-4 text-gray-300" />
                )}
              </button>
            </div>

            {/* Right Sidebar - Record Info (First in RTL) */}
            {showRecordDetails && (
              <div className="w-80 bg-[#3B4754] border-l border-gray-600 flex flex-col">
                
                {/* Record Balance */}
                <div className="p-4 border-b border-gray-600">
                  <div className="bg-purple-600 rounded p-4 text-center">
                    <div className="text-2xl font-bold text-white">{formatPrice(recordBalance, 'system')}</div>
                    <div className="text-purple-200 text-sm">رصيد السجل</div>
                  </div>
                </div>

                {/* Record Details */}
                <div className="p-4 space-y-4 flex-1">
                  <h3 className="text-white font-medium text-lg text-right">معلومات السجل</h3>

                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-white">{record?.name || 'السجل الرئيسي'}</span>
                    <span className="text-gray-400 text-sm">اسم السجل</span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-white">جميع الفروع</span>
                    <span className="text-gray-400 text-sm">الفرع</span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-blue-400 flex items-center gap-1">
                      <span>
                        {dateFilter.type === 'today' && 'اليوم'}
                        {dateFilter.type === 'current_week' && 'الأسبوع الحالي'}
                        {dateFilter.type === 'last_week' && 'الأسبوع الماضي'}
                        {dateFilter.type === 'current_month' && 'الشهر الحالي'}
                        {dateFilter.type === 'last_month' && 'الشهر الماضي'}
                        {dateFilter.type === 'custom' && 'فترة مخصصة'}
                        {dateFilter.type === 'all' && 'جميع الفترات'}
                      </span>
                      <span>📅</span>
                    </span>
                    <span className="text-gray-400 text-sm">الفترة الزمنية</span>
                  </div>

                  {dateFilter.type === 'custom' && dateFilter.startDate && dateFilter.endDate && (
                    <div className="flex justify-between items-center">
                      <span className="text-white text-xs">
                        {dateFilter.startDate.toLocaleDateString('en-GB')} - {dateFilter.endDate.toLocaleDateString('en-GB')}
                      </span>
                      <span className="text-gray-400 text-sm">من - إلى</span>
                    </div>
                  )}

                  <div className="flex justify-between items-center">
                    <span className="text-white">
                      {new Date().toLocaleDateString('en-GB')}
                    </span>
                    <span className="text-gray-400 text-sm">التاريخ الحالي</span>
                  </div>
                </div>
              </div>

              {/* Record Statistics */}
              <div className="p-4 border-t border-gray-600">
                <h4 className="text-white font-medium mb-3 text-right flex items-center gap-2">
                  <span>📊</span>
                  <span>إحصائيات السجل</span>
                </h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-white">{allTransactions.length}</span>
                    <span className="text-gray-400 text-sm">عدد المعاملات</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-green-400">{formatPrice(sales.reduce((sum, sale) => sum + (sale.total_amount || 0), 0), 'system')}</span>
                    <span className="text-gray-400 text-sm">إجمالي المدين</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-red-400">{formatPrice(purchaseInvoices.reduce((sum, purchase) => sum + (purchase.total_amount || 0), 0), 'system')}</span>
                    <span className="text-gray-400 text-sm">إجمالي الدائن</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-white">
                      {allTransactions.length > 0
                        ? new Date(allTransactions[0].created_at).toLocaleDateString('en-GB')
                        : '-'
                      }
                    </span>
                    <span className="text-gray-400 text-sm">آخر معاملة</span>
                  </div>
                </div>
              </div>

              {/* Date Filter Button */}
              <div className="p-4 border-t border-gray-600">
                <button
                  onClick={() => setShowDateFilter(true)}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white px-4 py-3 rounded font-medium flex items-center justify-center gap-2 transition-colors"
                >
                  <CalendarDaysIcon className="h-5 w-5" />
                  <span>التاريخ</span>
                </button>
                
                {/* Current Filter Display */}
                {dateFilter.type !== 'all' && (
                  <div className="mt-2 text-center">
                    <span className="text-xs text-purple-400">
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
              <div className={`bg-[#374151] border-b p-4 transition-colors ${searchQuery ? 'border-blue-500' : 'border-gray-600'}`}>
                {searchQuery && (
                  <div className="mb-2 text-xs flex items-center justify-between">
                    <div className="flex items-center gap-2 text-blue-400">
                      <span>🔍</span>
                      <span>البحث نشط - عرض الفواتير التي تحتوي على المنتج المحدد فقط</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-400">النتائج:</span>
                      <span className="bg-blue-600 text-white px-2 py-0.5 rounded font-medium">
                        {allTransactions.length}
                      </span>
                    </div>
                  </div>
                )}
                <div className="relative">
                  <MagnifyingGlassIcon className={`absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 transition-colors ${searchQuery ? 'text-blue-400' : 'text-gray-400'}`} />
                  <input
                    type="text"
                    placeholder="ابحث عن منتج (اسم المنتج أو الباركود)..."
                    value={searchQuery}
                    onChange={(e) => {
                      const value = e.target.value
                      setSearchQuery(value)

                      // Clear previous timeout
                      if (searchTimeout) {
                        clearTimeout(searchTimeout)
                      }

                      // Set new timeout for auto-search after 500ms
                      if (value.trim()) {
                        const timeout = setTimeout(() => {
                          searchProductInInvoices(value)
                        }, 500)
                        setSearchTimeout(timeout)
                      } else {
                        // If search is cleared, reload normal data
                        setHighlightedProductId(null)
                        fetchSales()
                        fetchPurchaseInvoices()
                      }
                    }}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        // Clear timeout and search immediately
                        if (searchTimeout) {
                          clearTimeout(searchTimeout)
                        }
                        searchProductInInvoices(searchQuery)
                      }
                    }}
                    className="w-full pl-24 pr-10 py-2 bg-[#2B3544] border border-gray-600 rounded text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                  <div className="absolute left-2 top-1/2 transform -translate-y-1/2 flex gap-1">
                    <button
                      onClick={() => searchProductInInvoices(searchQuery)}
                      className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded transition-colors"
                    >
                      بحث
                    </button>
                    <button
                      onClick={() => {
                        setSearchQuery('')
                        setHighlightedProductId(null)
                        fetchSales()
                        fetchPurchaseInvoices()
                      }}
                      className="px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white text-xs rounded transition-colors"
                    >
                      مسح
                    </button>
                  </div>
                </div>
              </div>

              {/* Conditional Content Based on Active Tab and View Mode */}
              <div className="flex-1 overflow-hidden relative">
                {activeTab === 'statement' && (
                  <div className="h-full flex flex-col">
                    {/* Account Statement Header */}
                    <div className="bg-[#2B3544] border-b border-gray-600 p-4">
                      <div className="flex items-center justify-between">
                        <div className="bg-purple-600 text-white px-4 py-2 rounded text-sm font-medium">
                          رصيد {formatPrice(190322)}
                        </div>
                        <div className="text-white text-lg font-medium">كشف حساب السجل</div>
                      </div>
                      <div className="text-gray-400 text-sm mt-2">آخر تحديث: 7/24/2025</div>
                    </div>
                    
                    {/* Account Statement Table */}
                    <div className="flex-1">
                      <ResizableTable
                        className="h-full w-full"
                        columns={statementColumns}
                        data={accountStatements}
                      />
                    </div>
                  </div>
                )}
                
                {activeTab === 'transactions' && (
                  <div className="h-full relative">
                    {/* Records Table - Always rendered but z-indexed based on view mode */}
                    <div 
                      className={`absolute inset-0 bg-[#2B3544] transition-all duration-300 ${
                        viewMode === 'details-only' ? 'z-0 opacity-20' : 'z-10'
                      } ${
                        viewMode === 'split' ? '' : 'opacity-100'
                      }`}
                      style={{
                        height: viewMode === 'split' ? `${dividerPosition}%` : '100%',
                        zIndex: viewMode === 'records-only' ? 20 : viewMode === 'split' ? 10 : 5
                      }}
                    >
                      {isLoadingSales ? (
                        <div className="flex items-center justify-center h-full">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mr-3"></div>
                          <span className="text-gray-400">جاري تحميل الفواتير...</span>
                        </div>
                      ) : allTransactions.length === 0 && searchQuery ? (
                        <div className="flex flex-col items-center justify-center h-full p-8">
                          <div className="text-6xl mb-4">🔍</div>
                          <p className="text-gray-400 text-lg mb-2">لا توجد فواتير تحتوي على هذا المنتج</p>
                          <p className="text-gray-500 text-sm">ابحث عن منتج آخر أو امسح البحث</p>
                        </div>
                      ) : (
                        <ResizableTable
                          className="h-full w-full"
                          columns={transactionColumns}
                          data={allTransactions}
                          selectedRowId={allTransactions[selectedTransaction]?.id?.toString() || null}
                          onRowClick={(transaction: any, index: number) => setSelectedTransaction(index)}
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

                    {/* Transaction Details - Always rendered but z-indexed based on view mode */}
                    <div 
                      className={`absolute inset-0 bg-[#2B3544] flex flex-col transition-all duration-300 ${
                        viewMode === 'records-only' ? 'z-0 opacity-20' : 'z-10'
                      }`}
                      style={{
                        top: viewMode === 'split' ? `${dividerPosition}%` : '0',
                        height: viewMode === 'split' ? `${100 - dividerPosition}%` : '100%',
                        zIndex: viewMode === 'details-only' ? 20 : viewMode === 'split' ? 10 : 5
                      }}
                    >
                      <h3 className="text-blue-400 font-medium text-right p-4 pb-2 flex-shrink-0 border-b border-gray-600">
                        تفاصيل الفاتورة {allTransactions[selectedTransaction]?.invoice_number || ''}
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
                            columns={transactionDetailsColumns}
                            data={allTransactionItems}
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
                          <button className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded text-sm font-medium flex items-center gap-2 transition-colors">
                            <PlusIcon className="h-4 w-4" />
                            إضافة تحويل
                          </button>
                        </div>
                        <div className="text-right">
                          <div className="text-white text-lg font-medium">تحويلات السجل</div>
                          <div className="text-gray-400 text-sm mt-1">إجمالي التحويلات: {formatPrice(13000)}</div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Payments Table */}
                    <div className="flex-1">
                      <ResizableTable
                        className="h-full w-full"
                        columns={paymentsColumns}
                        data={payments}
                      />
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
        onConfirm={confirmDeleteTransaction}
        isDeleting={isDeleting}
        title={transactionToDelete?.transactionType === 'purchase' ? 'تأكيد حذف فاتورة الشراء' : 'تأكيد حذف فاتورة البيع'}
        message={transactionToDelete?.transactionType === 'purchase' ? 'هل أنت متأكد أنك تريد حذف هذه فاتورة الشراء؟' : 'هل أنت متأكد أنك تريد حذف هذه فاتورة البيع؟'}
        itemName={transactionToDelete ? `فاتورة رقم: ${transactionToDelete.invoice_number} (${transactionToDelete.transactionType === 'purchase' ? 'شراء' : 'بيع'})` : ''}
      />

      {/* Date Filter Modal */}
      <SimpleDateFilterModal
        isOpen={showDateFilter}
        onClose={() => setShowDateFilter(false)}
        onDateFilterChange={(filter) => {
          setDateFilter(filter)
          saveDateFilterPreferences(filter)
        }}
        currentFilter={dateFilter}
      />
    </>
  )
}