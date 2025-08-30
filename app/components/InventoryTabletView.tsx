'use client'

import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { ProductGridImage } from './ui/OptimizedImage'
import ResizableTable from './tables/ResizableTable'
import Sidebar from './layout/Sidebar'
import TopHeader from './layout/TopHeader'
import AddBranchModal from './AddBranchModal'
import AddStorageModal from './AddStorageModal'
import ManagementModal from './ManagementModal'
import CategoriesTreeView from './CategoriesTreeView'
import ColumnsControlModal from './ColumnsControlModal'
import { useProducts } from '../lib/hooks/useProductsOptimized'
import {
  ArrowPathIcon,
  BuildingStorefrontIcon,
  BuildingOffice2Icon,
  CogIcon,
  DocumentArrowDownIcon,
  DocumentTextIcon,
  ClipboardDocumentListIcon,
  ChartBarIcon,
  TableCellsIcon,
  MagnifyingGlassIcon,
  ChevronDownIcon,
  Squares2X2Icon,
  ListBulletIcon,
  EyeIcon,
  XMarkIcon,
  Bars3Icon,
  EyeSlashIcon
} from '@heroicons/react/24/outline'

// Database category interface
interface Category {
  id: string
  name: string
  name_en: string | null
  parent_id: string | null
  image_url: string | null
  is_active: boolean | null
  sort_order: number | null
  created_at: string | null
  updated_at: string | null
}

interface InventoryTabletViewProps {
  searchQuery: string
  setSearchQuery: (query: string) => void
  selectedGroup: string
  setSelectedGroup: (group: string) => void
  isSidebarOpen: boolean
  setIsSidebarOpen: (open: boolean) => void
  stockStatusFilters: {
    good: boolean
    low: boolean
    zero: boolean
  }
  setStockStatusFilters: React.Dispatch<React.SetStateAction<{good: boolean, low: boolean, zero: boolean}>>
}

export default function InventoryTabletView({ 
  searchQuery, 
  setSearchQuery, 
  selectedGroup, 
  setSelectedGroup,
  isSidebarOpen,
  setIsSidebarOpen,
  stockStatusFilters,
  setStockStatusFilters
}: InventoryTabletViewProps) {
  const [showBranchesDropdown, setShowBranchesDropdown] = useState(false)
  const [selectedBranches, setSelectedBranches] = useState<{[key: string]: boolean}>({})
  const [isAddBranchModalOpen, setIsAddBranchModalOpen] = useState(false)
  const [isAddStorageModalOpen, setIsAddStorageModalOpen] = useState(false)
  const [isManagementModalOpen, setIsManagementModalOpen] = useState(false)
  const [editBranch, setEditBranch] = useState<any>(null)
  const [isEditingBranch, setIsEditingBranch] = useState(false)
  const [editWarehouse, setEditWarehouse] = useState<any>(null)
  const [isEditingWarehouse, setIsEditingWarehouse] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null)
  const [selectedProduct, setSelectedProduct] = useState<any>(null)
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table')
  const [showProductModal, setShowProductModal] = useState(false)
  const [modalProduct, setModalProduct] = useState<any>(null)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [showColumnsModal, setShowColumnsModal] = useState(false)
  const [visibleColumns, setVisibleColumns] = useState<{[key: string]: boolean}>({})
  const [isCategoriesHidden, setIsCategoriesHidden] = useState(false)

  // Ref for scrollable toolbar
  const toolbarRef = useRef<HTMLDivElement>(null)

  // Get products and branches data
  const { products, branches, isLoading, error, fetchProducts } = useProducts()

  // OPTIMIZED: Memoized branch toggle handler
  const handleBranchToggle = useCallback((branchId: string) => {
    setSelectedBranches(prev => ({
      ...prev,
      [branchId]: !prev[branchId]
    }))
  }, [])

  // OPTIMIZED: Memoized refresh handler
  const handleRefresh = useCallback(() => {
    fetchProducts()
  }, [fetchProducts])

  // OPTIMIZED: Memoized stock status toggle handler
  const handleStockStatusToggle = useCallback((status: 'good' | 'low' | 'zero') => {
    setStockStatusFilters(prev => ({
      ...prev,
      [status]: !prev[status]
    }))
  }, [setStockStatusFilters])

  // OPTIMIZED: Memoized columns change handler
  const handleColumnsChange = useCallback((updatedColumns: any[]) => {
    const newVisibleColumns: {[key: string]: boolean} = {}
    updatedColumns.forEach(col => {
      newVisibleColumns[col.id] = col.visible
    })
    setVisibleColumns(newVisibleColumns)
  }, [])

  // Initialize selected branches when branches data loads
  useEffect(() => {
    if (branches.length > 0 && Object.keys(selectedBranches).length === 0) {
      const initialBranches: {[key: string]: boolean} = {}
      branches.forEach(branch => {
        initialBranches[branch.id] = true
      })
      setSelectedBranches(initialBranches)
    }
  }, [branches, selectedBranches])

  // Initialize visible columns state
  useEffect(() => {
    const allColumns = ['index', 'name', 'category', 'totalQuantity', 'cost_price', 'price', 'wholesale_price', 'price1', 'price2', 'price3', 'price4', 'barcode', 'activity']
    
    // Add branch columns
    branches.forEach(branch => {
      allColumns.push(`quantity_${branch.id}`, `lowstock_${branch.id}`, `variants_${branch.id}`)
    })
    
    const initialVisible: {[key: string]: boolean} = {}
    allColumns.forEach(colId => {
      initialVisible[colId] = true
    })
    
    setVisibleColumns(initialVisible)
  }, [branches])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (!target.closest('.branches-dropdown')) {
        setShowBranchesDropdown(false)
      }
    }

    if (showBranchesDropdown) {
      document.addEventListener('click', handleClickOutside)
      return () => document.removeEventListener('click', handleClickOutside)
    }
  }, [showBranchesDropdown])

  // OPTIMIZED: Memoized function to calculate total quantity
  const calculateTotalQuantity = useCallback((item: any) => {
    let totalQuantity = 0
    if (item.inventoryData) {
      Object.entries(item.inventoryData).forEach(([branchId, inventory]: [string, any]) => {
        if (selectedBranches[branchId]) {
          totalQuantity += inventory?.quantity || 0
        }
      })
    }
    return totalQuantity
  }, [selectedBranches])

  // OPTIMIZED: Memoized function to determine stock status
  const getStockStatus = useCallback((item: any) => {
    const totalQuantity = calculateTotalQuantity(item)
    
    if (totalQuantity === 0) return 'zero'
    
    let hasLowStock = false
    if (item.inventoryData) {
      Object.entries(item.inventoryData).forEach(([branchId, inventory]: [string, any]) => {
        if (selectedBranches[branchId]) {
          const quantity = inventory?.quantity || 0
          const minStock = inventory?.min_stock || 0
          if (quantity <= minStock && minStock > 0) {
            hasLowStock = true
          }
        }
      })
    }
    
    return hasLowStock ? 'low' : 'good'
  }, [calculateTotalQuantity, selectedBranches])

  // OPTIMIZED: Generate dynamic table columns with advanced memoization
  const dynamicTableColumns = useMemo(() => {
    const staticColumns = [
    { 
      id: 'index', 
      header: '#', 
      accessor: '#', 
      width: 60,
      render: (value: any, item: any, index: number) => (
        <span className="text-gray-400 font-medium">{index + 1}</span>
      )
    },
    { 
      id: 'name', 
      header: 'اسم المنتج', 
      accessor: 'name', 
      width: 200,
      render: (value: string) => <span className="text-white font-medium">{value}</span>
    },
    { 
      id: 'category', 
      header: 'المجموعة', 
      accessor: 'category', 
      width: 120,
      render: (value: any) => (
        <span className="text-gray-300">
          {value?.name || 'غير محدد'}
        </span>
      )
    },
    { 
      id: 'totalQuantity', 
      header: 'كمية كلية', 
      accessor: 'totalQuantity', 
      width: 120,
      render: (value: any, item: any) => {
        // Calculate total quantity based on selected branches only
        let totalQuantity = 0
        if (item.inventoryData) {
          Object.entries(item.inventoryData).forEach(([branchId, inventory]: [string, any]) => {
            if (selectedBranches[branchId]) {
              totalQuantity += inventory?.quantity || 0
            }
          })
        }
        
        // Determine color based on stock status
        const stockStatus = getStockStatus(item)
        let colorClass = 'text-green-400' // Good - Green
        if (stockStatus === 'low') colorClass = 'text-yellow-400' // Low - Yellow  
        if (stockStatus === 'zero') colorClass = 'text-red-400' // Zero - Red
        
        return (
          <span className={`${colorClass} font-medium`}>قطعة {totalQuantity}</span>
        )
      }
    },
    { 
      id: 'cost_price', 
      header: 'سعر الشراء', 
      accessor: 'cost_price', 
      width: 120,
      render: (value: number) => <span className="text-white">{(value || 0).toFixed(2)}</span>
    },
    { 
      id: 'price', 
      header: 'سعر البيع', 
      accessor: 'price', 
      width: 120,
      render: (value: number) => <span className="text-white">{(value || 0).toFixed(2)}</span>
    },
    { 
      id: 'wholesale_price', 
      header: 'سعر الجملة', 
      accessor: 'wholesale_price', 
      width: 120,
      render: (value: number) => <span className="text-white">{(value || 0).toFixed(2)}</span>
    },
    { 
      id: 'price1', 
      header: 'سعر 1', 
      accessor: 'price1', 
      width: 100,
      render: (value: number) => <span className="text-white">{(value || 0).toFixed(2)}</span>
    },
    { 
      id: 'price2', 
      header: 'سعر 2', 
      accessor: 'price2', 
      width: 100,
      render: (value: number) => <span className="text-white">{(value || 0).toFixed(2)}</span>
    },
    { 
      id: 'price3', 
      header: 'سعر 3', 
      accessor: 'price3', 
      width: 100,
      render: (value: number) => <span className="text-white">{(value || 0).toFixed(2)}</span>
    },
    { 
      id: 'price4', 
      header: 'سعر 4', 
      accessor: 'price4', 
      width: 100,
      render: (value: number) => <span className="text-white">{(value || 0).toFixed(2)}</span>
    },
    { 
      id: 'barcode', 
      header: 'الباركود', 
      accessor: 'barcode', 
      width: 150,
      render: (value: string) => <span className="text-gray-300 font-mono text-sm">{value || '-'}</span>
    }
    ]

    // Add dynamic branch quantity columns (only for selected branches)
  const branchQuantityColumns = branches
    .filter(branch => selectedBranches[branch.id])
    .map(branch => ({
      id: `quantity_${branch.id}`,
      header: branch.name,
      accessor: `quantity_${branch.id}`,
      width: 120,
      render: (value: any, item: any) => {
        const inventoryData = item.inventoryData?.[branch.id]
        const quantity = inventoryData?.quantity || 0
        const minStock = inventoryData?.min_stock || 0
        
        // Determine color based on quantity status for this specific branch
        let colorClass = 'text-green-400' // Good - Green
        if (quantity === 0) {
          colorClass = 'text-red-400' // Zero - Red
        } else if (quantity <= minStock && minStock > 0) {
          colorClass = 'text-yellow-400' // Low - Yellow
        }
        
        return (
          <span className={`${colorClass} font-medium`}>
            قطعة {quantity}
          </span>
        )
      }
      }))

    // Add dynamic branch low stock columns (only for selected branches)
  const branchLowStockColumns = branches
    .filter(branch => selectedBranches[branch.id])
    .map(branch => ({
      id: `lowstock_${branch.id}`,
      header: `منخفض - ${branch.name}`,
      accessor: `lowstock_${branch.id}`,
      width: 150,
      render: (value: any, item: any) => {
        const inventoryData = item.inventoryData?.[branch.id]
        const minStock = inventoryData?.min_stock || 0
        const quantity = inventoryData?.quantity || 0
        
        // Show warning style if quantity is below or equal to min stock
        const isLowStock = quantity <= minStock && minStock > 0
        
        return (
          <span className={`font-medium ${isLowStock ? 'text-red-400' : 'text-yellow-400'}`}>
            {minStock} قطعة
          </span>
        )
      }
      }))

      // Add dynamic branch variants columns (only for selected branches)
    const variantColumns = branches
    .filter(branch => selectedBranches[branch.id])
    .map(branch => ({
    id: `variants_${branch.id}`,
    header: `الأشكال والألوان - ${branch.name}`,
    accessor: `variants_${branch.id}`,
    width: 250,
    render: (value: any, item: any) => {
      const variants = item.variantsData?.[branch.id] || []
      const colorVariants = variants.filter((v: any) => v.variant_type === 'color')
      const shapeVariants = variants.filter((v: any) => v.variant_type === 'shape')
      
      // Helper function to get variant color
      const getVariantColor = (variant: any) => {
        if (variant.variant_type === 'color') {
          // Try to find the color from product colors
          const productColor = item.productColors?.find((c: any) => c.name === variant.name)
          if (productColor?.color) {
            return productColor.color
          }
          
          // Try to parse color from variant value if it's JSON
          try {
            if (variant.value && variant.value.startsWith('{')) {
              const valueData = JSON.parse(variant.value)
              if (valueData.color) {
                return valueData.color
              }
            }
          } catch (e) {
            // If parsing fails, use default
          }
        }
        return '#6B7280' // Default gray color
      }

      // Helper function to get text color based on background
      const getTextColor = (bgColor: string) => {
        // Convert hex to RGB
        const hex = bgColor.replace('#', '')
        const r = parseInt(hex.substr(0, 2), 16)
        const g = parseInt(hex.substr(2, 2), 16)
        const b = parseInt(hex.substr(4, 2), 16)
        
        // Calculate luminance
        const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
        
        // Return white for dark colors, black for light colors
        return luminance > 0.5 ? '#000000' : '#FFFFFF'
      }

      // Calculate unassigned quantity
      const totalInventoryQuantity = item.inventoryData?.[branch.id]?.quantity || 0
      const assignedQuantity = [...colorVariants, ...shapeVariants].reduce((sum: number, variant: any) => sum + variant.quantity, 0)
      const unassignedQuantity = totalInventoryQuantity - assignedQuantity

      return (
        <div className="flex flex-wrap gap-1">
          {[...colorVariants, ...shapeVariants].map((variant: any, index: number) => {
            const bgColor = getVariantColor(variant)
            const textColor = getTextColor(bgColor)
            
            return (
              <span
                key={index}
                className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border"
                style={{
                  backgroundColor: bgColor,
                  color: textColor,
                  borderColor: bgColor === '#6B7280' ? '#6B7280' : bgColor
                }}
              >
                {variant.name} ({variant.quantity})
              </span>
            )
          })}
          
          {/* Show unassigned quantity if any */}
          {unassignedQuantity > 0 && (
            <span
              className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium text-white bg-gray-600 border border-gray-600"
            >
              غير محدد ({unassignedQuantity})
            </span>
          )}
        </div>
      )
    }
  }))

    const activityColumn = { 
      id: 'activity', 
      header: 'نشيط', 
      accessor: 'is_active', 
      width: 80,
      render: (value: boolean) => (
        <div className="flex justify-center">
          <div className={`w-3 h-3 rounded-full ${value ? 'bg-green-500' : 'bg-red-500'}`}></div>
        </div>
      )
    }

    // Get count of selected branches
    const selectedBranchesCount = Object.values(selectedBranches).filter(Boolean).length

    // Combine all columns - hide totalQuantity if only one branch is selected
    const allColumns = [
      ...staticColumns.filter(col => {
        // Hide totalQuantity column if only one branch is selected
        if (col.id === 'totalQuantity' && selectedBranchesCount === 1) {
          return false
        }
        return true
      }),
      ...branchQuantityColumns,
      ...branchLowStockColumns,
      ...variantColumns,
      activityColumn
    ]
    
    // Filter columns based on visibility
    return allColumns.filter(col => visibleColumns[col.id] !== false)
  }, [branches, visibleColumns, selectedBranches, calculateTotalQuantity, getStockStatus])

  // OPTIMIZED: Memoized product filtering
  const filteredProducts = useMemo(() => {
    if (!products.length) return []
    
    return products.filter(item => {
      const matchesSearch = !searchQuery || 
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.barcode?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.category?.name?.toLowerCase().includes(searchQuery.toLowerCase())
      
      if (!matchesSearch) return false
      
      const stockStatus = getStockStatus(item)
      return stockStatusFilters[stockStatus as keyof typeof stockStatusFilters]
    })
  }, [products, searchQuery, stockStatusFilters, getStockStatus])

  // OPTIMIZED: Memoized columns data preparation
  const getAllColumns = useMemo(() => {
    return dynamicTableColumns.map(col => ({
      id: col.id,
      header: col.header,
      visible: visibleColumns[col.id] !== false
    }))
  }, [dynamicTableColumns, visibleColumns])

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen)
  }

  const handleCategorySelect = (category: Category | null) => {
    setSelectedCategory(category)
  }

  // Branch management handlers
  const handleBranchCreated = () => {
    console.log('New branch created successfully')
  }

  const handleWarehouseCreated = () => {
    console.log('New warehouse created successfully')
  }

  const handleEditBranch = (branch: any) => {
    setEditBranch(branch)
    setIsEditingBranch(true)
    setIsAddBranchModalOpen(true)
    setIsManagementModalOpen(false)
  }

  const handleEditWarehouse = (warehouse: any) => {
    setEditWarehouse(warehouse)
    setIsEditingWarehouse(true)
    setIsAddStorageModalOpen(true)
    setIsManagementModalOpen(false)
  }

  // Toggle categories visibility
  const toggleCategoriesVisibility = () => {
    setIsCategoriesHidden(!isCategoriesHidden)
  }

  return (
    <div className="h-screen bg-[#2B3544] overflow-hidden">
      {/* Top Header */}
      <TopHeader onMenuClick={toggleSidebar} isMenuOpen={isSidebarOpen} />
      
      {/* Sidebar */}
      <Sidebar isOpen={isSidebarOpen} onToggle={toggleSidebar} />
      
      {/* Main Content Container */}
      <div className="h-full pt-12 overflow-hidden flex flex-col">
        
        {/* Top Action Buttons Toolbar - Tablet Optimized with horizontal scrolling (EXACT COPY FROM PRODUCTS) */}
        <div className="bg-[#374151] border-b border-gray-600 px-2 py-2 w-full">
          <div 
            ref={toolbarRef}
            className="flex items-center gap-1 overflow-x-auto scrollbar-hide"
            style={{
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
              WebkitOverflowScrolling: 'touch'
            }}
          >
            <button 
              onClick={handleRefresh}
              className="flex items-center gap-2 px-3 py-2 text-gray-300 hover:text-white cursor-pointer whitespace-nowrap bg-[#2B3544] hover:bg-[#434E61] rounded transition-colors"
            >
              <ArrowPathIcon className="h-4 w-4" />
              <span className="text-sm">تحديث</span>
            </button>

            <button 
              onClick={() => setIsAddBranchModalOpen(true)}
              className="flex items-center gap-2 px-3 py-2 text-gray-300 hover:text-white cursor-pointer whitespace-nowrap bg-[#2B3544] hover:bg-[#434E61] rounded transition-colors"
            >
              <BuildingStorefrontIcon className="h-4 w-4" />
              <span className="text-sm">إضافة فرع</span>
            </button>

            <button 
              onClick={() => setIsAddStorageModalOpen(true)}
              className="flex items-center gap-2 px-3 py-2 text-gray-300 hover:text-white cursor-pointer whitespace-nowrap bg-[#2B3544] hover:bg-[#434E61] rounded transition-colors"
            >
              <BuildingOffice2Icon className="h-4 w-4" />
              <span className="text-sm">إضافة مخزن</span>
            </button>

            <button 
              onClick={() => setIsManagementModalOpen(true)}
              className="flex items-center gap-2 px-3 py-2 text-gray-300 hover:text-white cursor-pointer whitespace-nowrap bg-[#2B3544] hover:bg-[#434E61] rounded transition-colors"
            >
              <CogIcon className="h-4 w-4" />
              <span className="text-sm">إدارة</span>
            </button>

            <button className="flex items-center gap-2 px-3 py-2 text-gray-300 hover:text-white cursor-pointer whitespace-nowrap bg-[#2B3544] hover:bg-[#434E61] rounded transition-colors">
              <DocumentArrowDownIcon className="h-4 w-4" />
              <span className="text-sm">تصدير PDF</span>
            </button>

            <button className="flex items-center gap-2 px-3 py-2 text-gray-300 hover:text-white cursor-pointer whitespace-nowrap bg-[#2B3544] hover:bg-[#434E61] rounded transition-colors">
              <DocumentTextIcon className="h-4 w-4" />
              <span className="text-sm">تصدير اكسل</span>
            </button>

            <button className="flex items-center gap-2 px-3 py-2 text-gray-300 hover:text-white cursor-pointer whitespace-nowrap bg-[#2B3544] hover:bg-[#434E61] rounded transition-colors">
              <ClipboardDocumentListIcon className="h-4 w-4" />
              <span className="text-sm">جرد سريع</span>
            </button>

            <button className="flex items-center gap-2 px-3 py-2 text-gray-300 hover:text-white cursor-pointer whitespace-nowrap bg-[#2B3544] hover:bg-[#434E61] rounded transition-colors">
              <ChartBarIcon className="h-4 w-4" />
              <span className="text-sm">تقرير</span>
            </button>

            <button 
              onClick={() => setShowColumnsModal(true)}
              className="flex items-center gap-2 px-3 py-2 text-gray-300 hover:text-white cursor-pointer whitespace-nowrap bg-[#2B3544] hover:bg-[#434E61] rounded transition-colors"
            >
              <TableCellsIcon className="h-4 w-4" />
              <span className="text-sm">إدارة الأعمدة</span>
            </button>
          </div>
        </div>

        {/* Content Area with Sidebar and Main Content */}
        <div className="flex-1 flex overflow-hidden">
          
          {/* Categories Tree Sidebar */}
          {!isCategoriesHidden && (
            <CategoriesTreeView 
              onCategorySelect={handleCategorySelect}
              selectedCategoryId={selectedCategory?.id}
              showActionButtons={false}
            />
          )}

          {/* Main Content Area */}
          <div className="flex-1 flex flex-col overflow-hidden">

            {/* Second Toolbar - Search and Controls (EXACT COPY FROM PRODUCTS) */}
            <div className="bg-[#374151] border-b border-gray-600 px-6 py-3 flex-shrink-0">
              <div className="flex items-center justify-between">
                {/* Left Side - Search and Controls */}
                <div className="flex items-center gap-4">
                  {/* Group Filter Dropdown with Categories Toggle Button */}
                  <div className="relative branches-dropdown flex items-center gap-2">
                    <button 
                      onClick={() => setShowBranchesDropdown(!showBranchesDropdown)}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md text-white text-sm font-medium transition-colors"
                    >
                      <span>{selectedGroup}</span>
                      <ChevronDownIcon className={`h-4 w-4 transition-transform ${showBranchesDropdown ? 'rotate-180' : ''}`} />
                    </button>
                    
                    {/* Categories Toggle Button - Right next to the dropdown button */}
                    <button 
                      onClick={toggleCategoriesVisibility}
                      className="p-2 text-gray-300 hover:text-white hover:bg-gray-600/30 rounded-md transition-colors"
                      title={isCategoriesHidden ? 'إظهار الفئات' : 'إخفاء الفئات'}
                    >
                      {isCategoriesHidden ? (
                        <Bars3Icon className="h-5 w-5" />
                      ) : (
                        <EyeSlashIcon className="h-5 w-5" />
                      )}
                    </button>
                    
                    {/* Branches Dropdown */}
                    {showBranchesDropdown && (
                      <div className="absolute top-full right-0 mt-2 w-64 bg-[#2B3544] border-2 border-[#4A5568] rounded-xl shadow-2xl z-[9999] overflow-hidden">
                        <div className="p-2">
                          <div className="space-y-1">
                            {branches.map(branch => (
                              <label
                                key={branch.id}
                                className="flex items-center gap-2 p-2 bg-[#374151] hover:bg-[#434E61] rounded-lg cursor-pointer transition-colors"
                              >
                                <input
                                  type="checkbox"
                                  checked={selectedBranches[branch.id] || false}
                                  onChange={() => handleBranchToggle(branch.id)}
                                  className="w-4 h-4 text-blue-600 bg-[#2B3544] border-2 border-blue-500 rounded focus:ring-blue-500"
                                />
                                <span className="text-white text-sm flex-1 text-right">
                                  {branch.name}
                                </span>
                              </label>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Search Bar */}
                  <div className="relative">
                    <MagnifyingGlassIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="اسم المنتج..."
                      className="w-80 pl-4 pr-10 py-2 bg-[#2B3544] border border-gray-600 rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                  </div>

                  {/* View Toggle */}
                  <div className="flex bg-blue-600 rounded-md overflow-hidden">
                    <button 
                      onClick={() => setViewMode('table')}
                      className={`p-2 transition-colors ${
                        viewMode === 'table' 
                          ? 'bg-blue-700 text-white' 
                          : 'text-blue-200 hover:text-white hover:bg-blue-700'
                      }`}
                    >
                      <ListBulletIcon className="h-4 w-4" />
                    </button>
                    <button 
                      onClick={() => setViewMode('grid')}
                      className={`p-2 transition-colors ${
                        viewMode === 'grid' 
                          ? 'bg-blue-700 text-white' 
                          : 'text-blue-200 hover:text-white hover:bg-blue-700'
                      }`}
                    >
                      <Squares2X2Icon className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Right Side - Status Filter Buttons */}
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => handleStockStatusToggle('good')}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                      stockStatusFilters.good 
                        ? 'bg-green-600 hover:bg-green-700 text-white' 
                        : 'bg-gray-600 text-gray-400 opacity-50'
                    }`}
                  >
                    جيد
                  </button>
                  <button 
                    onClick={() => handleStockStatusToggle('low')}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                      stockStatusFilters.low 
                        ? 'bg-yellow-600 hover:bg-yellow-700 text-white' 
                        : 'bg-gray-600 text-gray-400 opacity-50'
                    }`}
                  >
                    منخفض
                  </button>
                  <button 
                    onClick={() => handleStockStatusToggle('zero')}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                      stockStatusFilters.zero 
                        ? 'bg-red-600 hover:bg-red-700 text-white' 
                        : 'bg-gray-600 text-gray-400 opacity-50'
                    }`}
                  >
                    صفر
                  </button>
                </div>
              </div>

              {/* Bottom Row - Product Count */}
              <div className="mt-2 flex justify-between items-center text-sm text-gray-400">
                <span>عرض {filteredProducts.length} من أصل {products.length} منتج</span>
              </div>
            </div>

            {/* Products Content Container */}
            <div className="flex-1 overflow-hidden bg-[#2B3544]">
              {isLoading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-white">جاري التحميل...</div>
                </div>
              ) : error ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-red-400">خطأ: {error}</div>
                </div>
              ) : viewMode === 'table' ? (
                <ResizableTable
                  className="h-full w-full"
                  columns={dynamicTableColumns}
                  data={filteredProducts}
                  selectedRowId={selectedProduct?.id || null}
                  onRowClick={(item, index) => {
                    if (selectedProduct?.id === item.id) {
                      setSelectedProduct(null)
                    } else {
                      setSelectedProduct(item)
                    }
                  }}
                />
              ) : (
                // Grid View - Tablet Optimized (3 columns)
                <div className="h-full overflow-y-auto scrollbar-hide p-3">
                  <div className="grid grid-cols-3 gap-3">
                    {filteredProducts.map((product, index) => (
                      <div
                        key={product.id}
                        onClick={() => {
                          if (selectedProduct?.id === product.id) {
                            setSelectedProduct(null)
                          } else {
                            setSelectedProduct(product)
                          }
                        }}
                        className={`bg-[#374151] rounded-lg p-3 cursor-pointer transition-all duration-200 border-2 relative group ${
                          selectedProduct?.id === product.id
                            ? 'border-blue-500 bg-[#434E61]'
                            : 'border-transparent hover:border-gray-500 hover:bg-[#434E61]'
                        }`}
                      >
                        {/* Product Image - OPTIMIZED */}
                        <div className="mb-2">
                          <ProductGridImage
                            src={product.main_image_url}
                            alt={product.name}
                            priority={index < 6}
                          />
                        </div>

                        {/* Product Name */}
                        <h3 className="text-white font-medium text-sm text-center mb-2 line-clamp-2">
                          {product.name}
                        </h3>

                        {/* Product Details */}
                        <div className="space-y-1 text-xs">
                          {/* Selling Price */}
                          <div className="flex justify-center mb-1">
                            <span className="text-blue-400 font-medium text-sm">
                              {(product.price || 0).toFixed(2)}
                            </span>
                          </div>
                          
                          {/* Total Quantity */}
                          <div className="flex justify-between items-center">
                            <span className={`font-medium ${
                              (() => {
                                const stockStatus = getStockStatus(product)
                                if (stockStatus === 'zero') return 'text-red-400'
                                if (stockStatus === 'low') return 'text-yellow-400'
                                return 'text-green-400'
                              })()
                            }`}>
                              {calculateTotalQuantity(product)}
                            </span>
                            <span className="text-gray-400">الكمية الإجمالية</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Branch Management Modals */}
      <AddBranchModal 
        isOpen={isAddBranchModalOpen} 
        onClose={() => {
          setIsAddBranchModalOpen(false)
          setEditBranch(null)
          setIsEditingBranch(false)
        }}
        onBranchCreated={handleBranchCreated}
        editBranch={editBranch}
        isEditing={isEditingBranch}
      />

      <AddStorageModal 
        isOpen={isAddStorageModalOpen} 
        onClose={() => {
          setIsAddStorageModalOpen(false)
          setEditWarehouse(null)
          setIsEditingWarehouse(false)
        }}
        onWarehouseCreated={handleWarehouseCreated}
        editWarehouse={editWarehouse}
        isEditing={isEditingWarehouse}
      />

      <ManagementModal 
        isOpen={isManagementModalOpen} 
        onClose={() => setIsManagementModalOpen(false)}
        onEditBranch={handleEditBranch}
        onEditWarehouse={handleEditWarehouse}
      />

      {/* Columns Control Modal */}
      <ColumnsControlModal
        isOpen={showColumnsModal}
        onClose={() => setShowColumnsModal(false)}
        columns={getAllColumns}
        onColumnsChange={handleColumnsChange}
      />

      {/* Tablet-optimized styles - EXACT COPY FROM PRODUCTS */}
      <style jsx global>{`
        /* Hide scrollbars but keep functionality */
        .scrollbar-hide {
          scrollbar-width: none; /* Firefox */
          -ms-overflow-style: none; /* Internet Explorer 10+ */
        }
        
        .scrollbar-hide::-webkit-scrollbar {
          display: none; /* WebKit */
        }

        /* Touch-friendly interactions */
        @media (max-width: 1024px) {
          button, .cursor-pointer {
            min-height: 44px;
          }
        }

        /* Line clamp utility */
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  )
}