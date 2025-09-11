'use client';

import { useState, useEffect } from 'react';
import Sidebar from '@/app/components/layout/Sidebar';
import TopHeader from '@/app/components/layout/TopHeader';
import ResizableTable from '@/app/components/tables/ResizableTable';
import SimpleDateFilterModal, { DateFilter } from '@/app/components/SimpleDateFilterModal';
import { supabase } from '@/app/lib/supabase/client';
import ProductsFilterModal from '@/app/components/ProductsFilterModal';
import CustomersFilterModal from '@/app/components/CustomersFilterModal';
import { 
  ChevronLeftIcon, 
  ChevronRightIcon,
  ChartBarIcon, 
  DocumentArrowDownIcon,
  PrinterIcon,
  ShoppingCartIcon,
  UserGroupIcon,
  ArchiveBoxIcon,
  CurrencyDollarIcon,
  ChevronDownIcon,
  DocumentTextIcon,
  ArrowsUpDownIcon,
  FunnelIcon,
  CalendarDaysIcon,
  PresentationChartBarIcon,
  DocumentChartBarIcon,
  ClockIcon,
  ArrowPathIcon,
  CalendarIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

// Sample reports data - matching the customer details table structure
const reportsData = [
  {
    id: 1,
    type: 'مبيعات يومية',
    date: '2024-01-15',
    amount: 'EGP 15,420.50',
    status: 'مكتمل',
    invoice_count: 45,
    customer_count: 32
  },
  {
    id: 2,
    type: 'مردودات',
    date: '2024-01-15',
    amount: 'EGP -1,200.00',
    status: 'مراجعة',
    invoice_count: 3,
    customer_count: 2
  },
  {
    id: 3,
    type: 'مبيعات أسبوعية',
    date: '2024-01-14',
    amount: 'EGP 89,350.75',
    status: 'مكتمل',
    invoice_count: 287,
    customer_count: 156
  }
];

// Table columns for reports
const tableColumns = [
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
    id: 'type', 
    header: 'نوع التقرير', 
    accessor: 'type', 
    width: 150,
    render: (value: string) => <span className="text-white font-medium">{value}</span>
  },
  { 
    id: 'date', 
    header: 'التاريخ', 
    accessor: 'date', 
    width: 120,
    render: (value: string) => <span className="text-gray-300">{value}</span>
  },
  { 
    id: 'amount', 
    header: 'المبلغ الإجمالي', 
    accessor: 'amount', 
    width: 150,
    render: (value: string) => <span className="text-white font-medium">{value}</span>
  },
  { 
    id: 'status', 
    header: 'الحالة', 
    accessor: 'status', 
    width: 100,
    render: (value: string) => (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
        value === 'مكتمل' 
          ? 'bg-green-500/20 text-green-400' 
          : value === 'مراجعة'
          ? 'bg-yellow-500/20 text-yellow-400'
          : 'bg-gray-500/20 text-gray-400'
      }`}>
        {value}
      </span>
    )
  },
  { 
    id: 'invoice_count', 
    header: 'عدد الفواتير', 
    accessor: 'invoice_count', 
    width: 100,
    render: (value: number) => <span className="text-gray-300">{value}</span>
  },
  { 
    id: 'customer_count', 
    header: 'عدد العملاء', 
    accessor: 'customer_count', 
    width: 100,
    render: (value: number) => <span className="text-gray-300">{value}</span>
  }
];

// Table columns for products report
const productsTableColumns = [
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
    id: 'category_name', 
    header: 'المجموعة', 
    accessor: 'category_name', 
    width: 120,
    render: (value: string) => <span className="text-white font-medium">{value || 'غير محدد'}</span>
  },
  { 
    id: 'product_name', 
    header: 'اسم المنتج', 
    accessor: 'product_name', 
    width: 200,
    render: (value: string) => <span className="text-white font-medium">{value}</span>
  },
  { 
    id: 'total_quantity_sold', 
    header: 'الكمية', 
    accessor: 'total_quantity_sold', 
    width: 80,
    render: (value: number) => <span className="text-gray-300">{value || 0}</span>
  },
  { 
    id: 'branch_name', 
    header: 'الفرع', 
    accessor: 'branch_name', 
    width: 100,
    render: (value: string) => <span className="text-gray-300">{value || 'جميع الفروع'}</span>
  },
  { 
    id: 'total_sales_amount', 
    header: 'الاجمالي', 
    accessor: 'total_sales_amount', 
    width: 120,
    render: (value: number) => <span className="text-white font-medium">EGP {(value || 0).toFixed(2)}</span>
  },
  { 
    id: 'current_sale_price', 
    header: 'سعر البيع', 
    accessor: 'current_sale_price', 
    width: 100,
    render: (value: string) => <span className="text-gray-300">EGP {parseFloat(value || '0').toFixed(2)}</span>
  },
  { 
    id: 'total_sale_price', 
    header: 'إجمالي سعر البيع', 
    accessor: 'total_sale_price', 
    width: 150,
    render: (value: any, item: any) => {
      const quantity = item.total_quantity_sold || 0;
      const price = parseFloat(item.current_sale_price || '0');
      const total = quantity * price;
      return (
        <span className="text-white">
          <span className="text-blue-400">{quantity}</span>
          <span className="text-gray-300">*</span>
          <span className="text-green-400">{price.toFixed(2)}</span>
          <span className="text-gray-300"> = </span>
          <span className="text-white">{total.toFixed(2)}</span>
        </span>
      );
    }
  },
  { 
    id: 'wholesale_price', 
    header: 'سعر الجملة', 
    accessor: 'wholesale_price', 
    width: 100,
    render: (value: string) => <span className="text-gray-300">EGP {parseFloat(value || '0').toFixed(2)}</span>
  },
  { 
    id: 'total_wholesale_price', 
    header: 'إجمالي سعر الجملة', 
    accessor: 'total_wholesale_price', 
    width: 150,
    render: (value: any, item: any) => {
      const quantity = item.total_quantity_sold || 0;
      const price = parseFloat(item.wholesale_price || '0');
      const total = quantity * price;
      return (
        <span className="text-white">
          <span className="text-blue-400">{quantity}</span>
          <span className="text-gray-300">*</span>
          <span className="text-green-400">{price.toFixed(2)}</span>
          <span className="text-gray-300"> = </span>
          <span className="text-white">{total.toFixed(2)}</span>
        </span>
      );
    }
  },
  { 
    id: 'price1', 
    header: 'سعر 1', 
    accessor: 'price1', 
    width: 80,
    render: (value: string) => <span className="text-gray-300">EGP {parseFloat(value || '0').toFixed(2)}</span>
  },
  { 
    id: 'total_price1', 
    header: 'إجمالي سعر 1', 
    accessor: 'total_price1', 
    width: 150,
    render: (value: any, item: any) => {
      const quantity = item.total_quantity_sold || 0;
      const price = parseFloat(item.price1 || '0');
      const total = quantity * price;
      return (
        <span className="text-white">
          <span className="text-blue-400">{quantity}</span>
          <span className="text-gray-300">*</span>
          <span className="text-green-400">{price.toFixed(2)}</span>
          <span className="text-gray-300"> = </span>
          <span className="text-white">{total.toFixed(2)}</span>
        </span>
      );
    }
  },
  { 
    id: 'price2', 
    header: 'سعر 2', 
    accessor: 'price2', 
    width: 80,
    render: (value: string) => <span className="text-gray-300">EGP {parseFloat(value || '0').toFixed(2)}</span>
  },
  { 
    id: 'total_price2', 
    header: 'إجمالي سعر 2', 
    accessor: 'total_price2', 
    width: 150,
    render: (value: any, item: any) => {
      const quantity = item.total_quantity_sold || 0;
      const price = parseFloat(item.price2 || '0');
      const total = quantity * price;
      return (
        <span className="text-white">
          <span className="text-blue-400">{quantity}</span>
          <span className="text-gray-300">*</span>
          <span className="text-green-400">{price.toFixed(2)}</span>
          <span className="text-gray-300"> = </span>
          <span className="text-white">{total.toFixed(2)}</span>
        </span>
      );
    }
  },
  { 
    id: 'price3', 
    header: 'سعر 3', 
    accessor: 'price3', 
    width: 80,
    render: (value: string) => <span className="text-gray-300">EGP {parseFloat(value || '0').toFixed(2)}</span>
  },
  { 
    id: 'total_price3', 
    header: 'إجمالي سعر 3', 
    accessor: 'total_price3', 
    width: 150,
    render: (value: any, item: any) => {
      const quantity = item.total_quantity_sold || 0;
      const price = parseFloat(item.price3 || '0');
      const total = quantity * price;
      return (
        <span className="text-white">
          <span className="text-blue-400">{quantity}</span>
          <span className="text-gray-300">*</span>
          <span className="text-green-400">{price.toFixed(2)}</span>
          <span className="text-gray-300"> = </span>
          <span className="text-white">{total.toFixed(2)}</span>
        </span>
      );
    }
  },
  { 
    id: 'price4', 
    header: 'سعر 4', 
    accessor: 'price4', 
    width: 80,
    render: (value: string) => <span className="text-gray-300">EGP {parseFloat(value || '0').toFixed(2)}</span>
  },
  { 
    id: 'total_price4', 
    header: 'إجمالي سعر 4', 
    accessor: 'total_price4', 
    width: 150,
    render: (value: any, item: any) => {
      const quantity = item.total_quantity_sold || 0;
      const price = parseFloat(item.price4 || '0');
      const total = quantity * price;
      return (
        <span className="text-white">
          <span className="text-blue-400">{quantity}</span>
          <span className="text-gray-300">*</span>
          <span className="text-green-400">{price.toFixed(2)}</span>
          <span className="text-gray-300"> = </span>
          <span className="text-white">{total.toFixed(2)}</span>
        </span>
      );
    }
  }
];

export default function ReportsPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [currentView, setCurrentView] = useState('main'); // 'main' or 'periodic'
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [showDateFilter, setShowDateFilter] = useState(false);
  const [dateFilter, setDateFilter] = useState<DateFilter>({ type: 'all' });
  const [showReportsSidebar, setShowReportsSidebar] = useState(true);
  const [showProductsFilter, setShowProductsFilter] = useState(false);
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [showCustomersFilter, setShowCustomersFilter] = useState(false);
  const [selectedCustomerIds, setSelectedCustomerIds] = useState<string[]>([]);
  const [selectedCustomerGroupIds, setSelectedCustomerGroupIds] = useState<string[]>([]);
  const [showSalesReportsModal, setShowSalesReportsModal] = useState(false);
  const [showProductsReport, setShowProductsReport] = useState(false);
  const [productsReportData, setProductsReportData] = useState<any[]>([]);
  const [totalSalesAmount, setTotalSalesAmount] = useState<string>('0.00');
  const [loading, setLoading] = useState(false);
  const [openTabs, setOpenTabs] = useState<{ id: string; title: string; active: boolean }[]>([
    { id: 'main', title: 'التقارير', active: true }
  ]);
  const [activeTab, setActiveTab] = useState<string>('main');
  
  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };
  
  const handlePeriodicReportsClick = () => {
    setCurrentView('periodic');
  };

  const handleBackToMain = () => {
    setCurrentView('main');
  };

  // Tab management functions
  const addTab = (id: string, title: string) => {
    const existingTab = openTabs.find(tab => tab.id === id);
    if (!existingTab) {
      setOpenTabs(prev => [
        ...prev.map(tab => ({ ...tab, active: false })),
        { id, title, active: true }
      ]);
    } else {
      setOpenTabs(prev => prev.map(tab => ({
        ...tab,
        active: tab.id === id
      })));
    }
    setActiveTab(id);
  };

  const closeTab = (tabId: string) => {
    if (tabId === 'main') return; // Can't close main tab
    
    const newTabs = openTabs.filter(tab => tab.id !== tabId);
    setOpenTabs(newTabs);
    
    if (activeTab === tabId) {
      const lastTab = newTabs[newTabs.length - 1];
      const newActiveTab = lastTab?.id || 'main';
      setActiveTab(newActiveTab);
      setShowProductsReport(newActiveTab === 'products');
      
      // Clear products data if closing products tab
      if (tabId === 'products') {
        setProductsReportData([]);
      }
    }
  };

  const switchTab = (tabId: string) => {
    setOpenTabs(prev => prev.map(tab => ({
      ...tab,
      active: tab.id === tabId
    })));
    setActiveTab(tabId);
    
    // Update legacy showProductsReport state for compatibility
    setShowProductsReport(tabId === 'products');
  };

  // Fetch total sales amount on component mount (using sale_items for consistency)
  useEffect(() => {
    const fetchTotalSales = async () => {
      try {
        const { data, error } = await supabase
          .from('sale_items')
          .select(`
            quantity,
            unit_price,
            sales!inner(created_at)
          `)
          .gte('sales.created_at', '2024-01-01');
        
        if (error) {
          console.error('Error fetching total sales:', error);
          return;
        }
        
        const total = data?.reduce((sum: number, item: any) => {
          const lineTotal = (item.quantity || 0) * (item.unit_price || 0);
          return sum + lineTotal;
        }, 0) || 0;
        
        setTotalSalesAmount(total.toFixed(2));
      } catch (error) {
        console.error('Error calculating total sales:', error);
      }
    };
    
    fetchTotalSales();
  }, []);
  
  // Function to fetch products report data
  const fetchProductsReport = async () => {
    setLoading(true);
    try {
      let salesQuery = supabase
        .from('sale_items')
        .select(`
          product_id,
          quantity,
          unit_price,
          products!inner(
            id,
            name,
            price,
            wholesale_price,
            price1,
            price2,
            price3,
            price4,
            categories(name)
          ),
          sales!inner(
            branch_id,
            created_at,
            branches(name)
          )
        `);
        
      // Apply date filters
      if (dateFilter.type === 'today') {
        const today = new Date().toISOString().split('T')[0];
        salesQuery = salesQuery.gte('sales.created_at', today + 'T00:00:00');
      } else if (dateFilter.type === 'current_week') {
        const weekStart = new Date();
        weekStart.setDate(weekStart.getDate() - weekStart.getDay());
        salesQuery = salesQuery.gte('sales.created_at', weekStart.toISOString());
      } else if (dateFilter.type === 'current_month') {
        const monthStart = new Date();
        monthStart.setDate(1);
        salesQuery = salesQuery.gte('sales.created_at', monthStart.toISOString());
      } else if (dateFilter.type === 'custom' && dateFilter.startDate && dateFilter.endDate) {
        salesQuery = salesQuery
          .gte('sales.created_at', dateFilter.startDate.toISOString())
          .lte('sales.created_at', dateFilter.endDate.toISOString());
      } else {
        salesQuery = salesQuery.gte('sales.created_at', '2024-01-01T00:00:00');
      }
      
      const { data: salesData, error: salesError } = await salesQuery;
      
      if (salesError) {
        console.error('Error fetching sales data:', salesError);
        return;
      }
      
      // Process the data to aggregate by product
      const productMap = new Map();
      
      salesData?.forEach((saleItem: any) => {
        const productId = saleItem.product_id;
        const product = saleItem.products;
        const branch = saleItem.sales?.branches;
        const quantity = saleItem.quantity || 0;
        const totalAmount = (saleItem.quantity || 0) * (saleItem.unit_price || 0);
        
        if (productMap.has(productId)) {
          const existing = productMap.get(productId);
          existing.total_quantity_sold += quantity;
          existing.total_sales_amount += totalAmount;
        } else {
          productMap.set(productId, {
            product_id: productId,
            product_name: product?.name || 'منتج غير محدد',
            category_name: product?.categories?.name || 'غير محدد',
            branch_name: branch?.name || 'غير محدد',
            total_quantity_sold: quantity,
            total_sales_amount: totalAmount,
            current_sale_price: product?.price || '0.00',
            wholesale_price: product?.wholesale_price || '0.00',
            price1: product?.price1 || '0.00',
            price2: product?.price2 || '0.00',
            price3: product?.price3 || '0.00',
            price4: product?.price4 || '0.00'
          });
        }
      });
      
      const processedData = Array.from(productMap.values())
        .sort((a, b) => b.total_quantity_sold - a.total_quantity_sold);
      
      setProductsReportData(processedData);
      
      // Update the total sales amount to match the filtered products
      const filteredTotal = processedData.reduce((sum, product) => sum + (product.total_sales_amount || 0), 0);
      setTotalSalesAmount(filteredTotal.toFixed(2));
    } catch (error) {
      console.error('Error fetching products report:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleProductsReportClick = () => {
    addTab('products', 'الأصناف');
    setShowProductsReport(true);
    setShowSalesReportsModal(false);
    fetchProductsReport();
  };
  
  const handleBackToMainReports = async () => {
    switchTab('main');
    setShowProductsReport(false);
    setShowSalesReportsModal(false);
    setProductsReportData([]);
    
    // Restore the original total sales amount
    try {
      const { data, error } = await supabase
        .from('sale_items')
        .select(`
          quantity,
          unit_price,
          sales!inner(created_at)
        `)
        .gte('sales.created_at', '2024-01-01');
      
      if (!error && data) {
        const total = data.reduce((sum: number, item: any) => {
          const lineTotal = (item.quantity || 0) * (item.unit_price || 0);
          return sum + lineTotal;
        }, 0);
        
        setTotalSalesAmount(total.toFixed(2));
      }
    } catch (error) {
      console.error('Error restoring total sales:', error);
    }
  };

  return (
    <div className="h-screen bg-[#2B3544] overflow-hidden">
      {/* Top Header */}
      <TopHeader onMenuClick={toggleSidebar} isMenuOpen={isSidebarOpen} />
      
      {/* Sidebar */}
      <Sidebar isOpen={isSidebarOpen} onToggle={toggleSidebar} />
      
      {/* Main Content Container */}
      <div className="h-full pt-12 overflow-hidden flex flex-col">
        
        {/* Top Action Buttons Toolbar - Full Width */}
        <div className="bg-[#374151] border-b border-gray-600 px-4 py-2 w-full">
          <div className="flex items-center justify-start gap-1 overflow-x-auto scrollbar-hide">
            <button 
              onClick={() => setCurrentView('main')}
              className={`flex flex-col items-center p-2 cursor-pointer min-w-[80px] ${
                currentView === 'main' 
                  ? 'text-blue-400 bg-blue-500/10' 
                  : 'text-gray-300 hover:text-white'
              }`}
            >
              <DocumentTextIcon className="h-5 w-5 mb-1" />
              <span className="text-sm">التقارير</span>
            </button>

            <button className="flex flex-col items-center p-2 text-gray-300 hover:text-white cursor-pointer min-w-[80px]">
              <ArrowsUpDownIcon className="h-5 w-5 mb-1" />
              <span className="text-sm">ترتيب</span>
            </button>

            <button className="flex flex-col items-center p-2 text-gray-300 hover:text-white cursor-pointer min-w-[80px]">
              <DocumentArrowDownIcon className="h-5 w-5 mb-1" />
              <span className="text-sm">تصدير</span>
            </button>

            <button 
              onClick={() => setShowProductsFilter(true)}
              className={`flex flex-col items-center p-2 cursor-pointer min-w-[80px] ${
                selectedProductIds.length > 0 || selectedCategoryIds.length > 0
                  ? 'text-green-400 bg-green-500/10'
                  : 'text-gray-300 hover:text-white'
              }`}
            >
              <FunnelIcon className="h-5 w-5 mb-1" />
              <span className="text-sm">المنتجات</span>
              {(selectedProductIds.length > 0 || selectedCategoryIds.length > 0) && (
                <span className="text-xs bg-green-500/20 text-green-400 px-1 rounded">
                  {selectedProductIds.length + selectedCategoryIds.length}
                </span>
              )}
            </button>

            <button 
              onClick={() => setShowCustomersFilter(true)}
              className={`flex flex-col items-center p-2 cursor-pointer min-w-[80px] ${
                selectedCustomerIds.length > 0 || selectedCustomerGroupIds.length > 0
                  ? 'text-green-400 bg-green-500/10'
                  : 'text-gray-300 hover:text-white'
              }`}
            >
              <UserGroupIcon className="h-5 w-5 mb-1" />
              <span className="text-sm">العملاء</span>
              {(selectedCustomerIds.length > 0 || selectedCustomerGroupIds.length > 0) && (
                <span className="text-xs bg-green-500/20 text-green-400 px-1 rounded">
                  {selectedCustomerIds.length + selectedCustomerGroupIds.length}
                </span>
              )}
            </button>

            <button 
              onClick={() => setShowDateFilter(true)}
              className="flex flex-col items-center p-2 text-gray-300 hover:text-white cursor-pointer min-w-[80px]"
            >
              <CalendarDaysIcon className="h-5 w-5 mb-1" />
              <span className="text-sm">تواريخ</span>
            </button>

            <button className="flex flex-col items-center p-2 text-gray-300 hover:text-white cursor-pointer min-w-[80px]">
              <FunnelIcon className="h-5 w-5 mb-1" />
              <span className="text-sm">فروع ومخازن</span>
            </button>

            <button className="flex flex-col items-center p-2 text-gray-300 hover:text-white cursor-pointer min-w-[80px]">
              <PresentationChartBarIcon className="h-5 w-5 mb-1" />
              <span className="text-sm">عرض بياني</span>
            </button>

            <button className="flex flex-col items-center p-2 text-gray-300 hover:text-white cursor-pointer min-w-[80px]">
              <PrinterIcon className="h-5 w-5 mb-1" />
              <span className="text-sm">طباعة</span>
            </button>

            <button className="flex flex-col items-center p-2 text-gray-300 hover:text-white cursor-pointer min-w-[80px]">
              <DocumentChartBarIcon className="h-5 w-5 mb-1" />
              <span className="text-sm">تقرير مفصل</span>
            </button>

            <button 
              onClick={() => setShowSalesReportsModal(true)}
              className="flex flex-col items-center p-2 text-gray-300 hover:text-white cursor-pointer min-w-[80px]"
            >
              <ChartBarIcon className="h-5 w-5 mb-1" />
              <span className="text-sm">تقارير البيع</span>
            </button>

            <button 
              onClick={handlePeriodicReportsClick}
              className={`flex flex-col items-center p-2 cursor-pointer min-w-[80px] ${
                currentView === 'periodic' 
                  ? 'text-blue-400 bg-blue-500/10' 
                  : 'text-gray-300 hover:text-white'
              }`}
            >
              <ClockIcon className="h-5 w-5 mb-1" />
              <span className="text-sm">تقارير دورية</span>
            </button>

            <button className="flex flex-col items-center p-2 text-gray-300 hover:text-white cursor-pointer min-w-[80px]">
              <ArrowPathIcon className="h-5 w-5 mb-1" />
              <span className="text-sm">تحديث</span>
            </button>
          </div>
        </div>

        {/* Content Area with Sidebar and Main Content */}
        <div className="flex-1 flex overflow-hidden">
          {currentView === 'periodic' ? (
            /* Periodic Reports Content */
            <div className="flex-1 p-4 overflow-y-auto scrollbar-hide">
              {/* Top Summary Cards */}
              <div className="grid grid-cols-4 gap-4 mb-4">
                {/* Card 1 - Products Sold */}
                <div className="bg-[#374151] rounded-lg border border-gray-600 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-right">
                      <div className="text-3xl font-bold text-white mb-1">3,456</div>
                      <div className="text-red-400 text-sm font-medium">2.1%-</div>
                    </div>
                    <div className="p-3 bg-orange-500/20 rounded-lg">
                      <ArchiveBoxIcon className="h-8 w-8 text-orange-400" />
                    </div>
                  </div>
                  <div className="text-gray-300 text-sm text-right">المنتجات المباعة</div>
                </div>

                {/* Card 2 - Active Customers */}
                <div className="bg-[#374151] rounded-lg border border-gray-600 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-right">
                      <div className="text-3xl font-bold text-white mb-1">892</div>
                      <div className="text-green-400 text-sm font-medium">+15.2%</div>
                    </div>
                    <div className="p-3 bg-purple-500/20 rounded-lg">
                      <UserGroupIcon className="h-8 w-8 text-purple-400" />
                    </div>
                  </div>
                  <div className="text-gray-300 text-sm text-right">العملاء النشطون</div>
                </div>

                {/* Card 3 - Invoice Count */}
                <div className="bg-[#374151] rounded-lg border border-gray-600 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-right">
                      <div className="text-3xl font-bold text-white mb-1">1,234</div>
                      <div className="text-green-400 text-sm font-medium">+8.3%</div>
                    </div>
                    <div className="p-3 bg-blue-500/20 rounded-lg">
                      <ShoppingCartIcon className="h-8 w-8 text-blue-400" />
                    </div>
                  </div>
                  <div className="text-gray-300 text-sm text-right">عدد الفواتير</div>
                </div>

                {/* Card 4 - Total Sales */}
                <div className="bg-[#374151] rounded-lg border border-gray-600 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-right">
                      <div className="text-3xl font-bold text-white mb-1">₾ 45,230.50</div>
                      <div className="text-green-400 text-sm font-medium">+12.5%</div>
                    </div>
                    <div className="p-3 bg-green-500/20 rounded-lg">
                      <CurrencyDollarIcon className="h-8 w-8 text-green-400" />
                    </div>
                  </div>
                  <div className="text-gray-300 text-sm text-right">إجمالي المبيعات</div>
                </div>
              </div>

              {/* Charts Section */}
              <div className="grid grid-cols-2 gap-4 h-64">
                {/* Category Distribution */}
                <div className="bg-[#374151] rounded-lg border border-gray-600 p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-white text-lg font-semibold text-right">توزيع الفئات</h3>
                    <ArchiveBoxIcon className="h-6 w-6 text-green-400" />
                  </div>
                  
                  <div className="flex h-full">
                    {/* Categories List */}
                    <div className="flex-1 space-y-4">
                      <div className="flex items-center justify-between text-right">
                        <div className="text-white font-semibold">35%</div>
                        <div className="flex items-center gap-3">
                          <span className="text-gray-300 text-sm">الإلكترونيات</span>
                          <div className="w-3 h-3 rounded-full bg-blue-400"></div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-right">
                        <div className="text-white font-semibold">25%</div>
                        <div className="flex items-center gap-3">
                          <span className="text-gray-300 text-sm">الملابس</span>
                          <div className="w-3 h-3 rounded-full bg-green-400"></div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-right">
                        <div className="text-white font-semibold">20%</div>
                        <div className="flex items-center gap-3">
                          <span className="text-gray-300 text-sm">المواد الغذائية</span>
                          <div className="w-3 h-3 rounded-full bg-orange-400"></div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-right">
                        <div className="text-white font-semibold">12%</div>
                        <div className="flex items-center gap-3">
                          <span className="text-gray-300 text-sm">الكتب</span>
                          <div className="w-3 h-3 rounded-full bg-red-400"></div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-right">
                        <div className="text-white font-semibold">8%</div>
                        <div className="flex items-center gap-3">
                          <span className="text-gray-300 text-sm">أخرى</span>
                          <div className="w-3 h-3 rounded-full bg-purple-400"></div>
                        </div>
                      </div>
                    </div>

                    {/* Compact Donut Chart */}
                    <div className="w-32 h-32 relative flex items-center justify-center">
                      <svg className="w-32 h-32 -rotate-90">
                        <circle
                          cx="64"
                          cy="64"
                          r="56"
                          fill="none"
                          stroke="#3B82F6"
                          strokeWidth="12"
                          strokeDasharray="123 227"
                          strokeDashoffset="0"
                          className="transition-all duration-500"
                        />
                        <circle
                          cx="64"
                          cy="64"
                          r="56"
                          fill="none"
                          stroke="#10B981"
                          strokeWidth="12"
                          strokeDasharray="88 262"
                          strokeDashoffset="-123"
                          className="transition-all duration-500"
                        />
                        <circle
                          cx="64"
                          cy="64"
                          r="56"
                          fill="none"
                          stroke="#F59E0B"
                          strokeWidth="12"
                          strokeDasharray="70 280"
                          strokeDashoffset="-211"
                          className="transition-all duration-500"
                        />
                        <circle
                          cx="64"
                          cy="64"
                          r="56"
                          fill="none"
                          stroke="#EF4444"
                          strokeWidth="12"
                          strokeDasharray="42 308"
                          strokeDashoffset="-281"
                          className="transition-all duration-500"
                        />
                        <circle
                          cx="64"
                          cy="64"
                          r="56"
                          fill="none"
                          stroke="#8B5CF6"
                          strokeWidth="12"
                          strokeDasharray="28 322"
                          strokeDashoffset="-323"
                          className="transition-all duration-500"
                        />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Weekly Sales */}
                <div className="bg-[#374151] rounded-lg border border-gray-600 p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-white text-lg font-semibold text-right">مبيعات الأسبوع</h3>
                    <ChartBarIcon className="h-6 w-6 text-blue-400" />
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <div className="text-white text-sm font-medium min-w-[50px] text-right">₾ 6,800</div>
                      <div className="flex-1 bg-gray-600 rounded-full h-6 relative">
                        <div className="h-6 bg-blue-500 rounded-full" style={{ width: '74%' }}></div>
                      </div>
                      <div className="text-gray-300 text-sm min-w-[50px] text-right">السبت</div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-white text-sm font-medium min-w-[50px] text-right">₾ 7,200</div>
                      <div className="flex-1 bg-gray-600 rounded-full h-6 relative">
                        <div className="h-6 bg-blue-500 rounded-full" style={{ width: '78%' }}></div>
                      </div>
                      <div className="text-gray-300 text-sm min-w-[50px] text-right">الأحد</div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-white text-sm font-medium min-w-[50px] text-right">₾ 5,600</div>
                      <div className="flex-1 bg-gray-600 rounded-full h-6 relative">
                        <div className="h-6 bg-blue-500 rounded-full" style={{ width: '61%' }}></div>
                      </div>
                      <div className="text-gray-300 text-sm min-w-[50px] text-right">الاثنين</div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-white text-sm font-medium min-w-[50px] text-right">₾ 8,100</div>
                      <div className="flex-1 bg-gray-600 rounded-full h-6 relative">
                        <div className="h-6 bg-blue-500 rounded-full" style={{ width: '88%' }}></div>
                      </div>
                      <div className="text-gray-300 text-sm min-w-[50px] text-right">الثلاثاء</div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-white text-sm font-medium min-w-[50px] text-right">₾ 7,500</div>
                      <div className="flex-1 bg-gray-600 rounded-full h-6 relative">
                        <div className="h-6 bg-blue-500 rounded-full" style={{ width: '82%' }}></div>
                      </div>
                      <div className="text-gray-300 text-sm min-w-[50px] text-right">الأربعاء</div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-white text-sm font-medium min-w-[50px] text-right">₾ 9,200</div>
                      <div className="flex-1 bg-gray-600 rounded-full h-6 relative">
                        <div className="h-6 bg-green-500 rounded-full" style={{ width: '100%' }}></div>
                      </div>
                      <div className="text-gray-300 text-sm min-w-[50px] text-right">الخميس</div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-white text-sm font-medium min-w-[50px] text-right">₾ 8,900</div>
                      <div className="flex-1 bg-gray-600 rounded-full h-6 relative">
                        <div className="h-6 bg-blue-500 rounded-full" style={{ width: '97%' }}></div>
                      </div>
                      <div className="text-gray-300 text-sm min-w-[50px] text-right">الجمعة</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Main Reports View */
            <>
              {/* Toggle Button */}
              <div className="flex">
                <button
                  onClick={() => setShowReportsSidebar(!showReportsSidebar)}
                  className="w-6 bg-[#374151] hover:bg-[#4B5563] border-l border-gray-600 flex items-center justify-center transition-colors duration-200"
                  title={showReportsSidebar ? 'إخفاء الشريط الجانبي' : 'إظهار الشريط الجانبي'}
                >
                  {showReportsSidebar ? (
                    <ChevronLeftIcon className="h-4 w-4 text-gray-300" />
                  ) : (
                    <ChevronRightIcon className="h-4 w-4 text-gray-300" />
                  )}
                </button>
              </div>

              {/* Right Sidebar */}
              {showReportsSidebar && (
                <div className="w-80 bg-[#3B4754] border-r border-gray-600 flex flex-col overflow-hidden">
                  {/* Show Sales Reports or Normal Sidebar */}
                  {showSalesReportsModal ? (
                    /* Sales Reports Content */
                    <>
                      {/* Header */}
                      <div className="p-3 border-b border-gray-600 flex-shrink-0 flex items-center justify-between">
                        <button
                          onClick={() => setShowSalesReportsModal(false)}
                          className="text-gray-400 hover:text-white p-1 rounded transition-colors"
                        >
                          <ChevronLeftIcon className="h-5 w-5" />
                        </button>
                        <h2 className="text-lg font-semibold text-white text-right">تقارير البيع</h2>
                      </div>

                      {/* Sales Reports List - Scrollable */}
                      <div className="flex-1 overflow-y-auto scrollbar-hide p-3">
                        <div className="space-y-3">
                          {[
                            'الاصناف',
                            'التصنيفات الرئيسية',
                            'العملاء',
                            'المستخدمين',
                            'أنواع الدفع',
                            'انواع الدفع من قبل المستخدمين',
                            'انواع الدفع من قبل العملاء',
                            'المرتجعات',
                            'فواتير العملاء',
                            'المبيعات اليوميه',
                            'المبيعات بالساعه',
                            'هامش الربح',
                            'الفواتير الغير مدفوعه'
                          ].map((report, index) => (
                            <button
                              key={index}
                              onClick={() => {
                                if (report === 'الاصناف') {
                                  handleProductsReportClick();
                                } else {
                                  // Add tab for other reports but don't implement functionality yet
                                  const reportId = report.replace(/\s+/g, '_');
                                  addTab(reportId, report);
                                  console.log('Selected report:', report);
                                }
                              }}
                              className="w-full bg-[#2B3544] hover:bg-[#3B4754] border border-gray-600 rounded-lg p-4 text-right text-white transition-colors duration-200 hover:border-blue-500 group"
                            >
                              <div className="flex items-center justify-between">
                                <ChartBarIcon className="h-5 w-5 text-blue-400 group-hover:text-blue-300" />
                                <span className="font-medium">{report}</span>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    </>
                  ) : (
                    /* Normal Sidebar Content */
                    <>
                      {/* Balance Section */}
                      <div className="p-3 border-b border-gray-600 flex-shrink-0">
                        <div className="bg-blue-600 rounded-lg p-3 text-center text-white">
                          <div className="text-xl font-bold mb-1">EGP {totalSalesAmount}</div>
                          <div className="text-xs opacity-90">{showProductsReport ? 'إجمالي المبيعات' : 'رصيد الحساب'}</div>
                        </div>
                      </div>

                      {/* Report Information - Scrollable */}
                      <div className="flex-1 overflow-y-auto scrollbar-hide">
                        {selectedReport && (
                          <div className="p-3 border-b border-gray-600">
                            <h3 className="text-white font-medium mb-2 text-right">معلومات التقرير</h3>
                            <div className="space-y-2">
                              <div className="flex justify-between text-sm">
                                <span className="text-white">{selectedReport.type}</span>
                                <span className="text-gray-400">نوع التقرير</span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span className="text-white">{selectedReport.date}</span>
                                <span className="text-gray-400">تاريخ التقرير</span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span className="text-white">{selectedReport.amount}</span>
                                <span className="text-gray-400">المبلغ الإجمالي</span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span className="text-white">{selectedReport.invoice_count}</span>
                                <span className="text-gray-400">عدد الفواتير</span>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Summary Statistics */}
                        <div className="p-3 border-b border-gray-600">
                          <h3 className="text-white font-medium mb-2 text-right">إحصائيات التقرير</h3>
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="text-white">1</span>
                              <span className="text-gray-400">عدد التقارير</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-white">EGP 480.00</span>
                              <span className="text-gray-400">إجمالي المشتريات</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-white">EGP 480.00</span>
                              <span className="text-gray-400">متوسط قيمة الطلبية</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-white">7/15/2025</span>
                              <span className="text-gray-400">آخر تحديث</span>
                            </div>
                          </div>
                        </div>

                        {/* Message Area */}
                        <div className="p-3 text-center text-gray-500 text-sm">
                          {selectedReport ? 'تفاصيل إضافية للتقرير المحدد' : 'اختر تقريراً لعرض التفاصيل'}
                        </div>
                      </div>

                      {/* Date Filter Button - Fixed at Bottom */}
                      <div className="p-2 border-t border-gray-600 flex-shrink-0 bg-[#3B4754]">
                        <button
                          onClick={() => setShowDateFilter(true)}
                          className="w-full bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded font-medium flex items-center justify-center gap-2 transition-colors text-sm"
                        >
                          <CalendarDaysIcon className="h-4 w-4" />
                          <span>التاريخ</span>
                        </button>
                        
                        {/* Current Filter Display */}
                        {dateFilter.type !== 'all' && (
                          <div className="mt-1.5 text-center">
                            <span className="text-xs text-blue-400 break-words leading-tight">
                              {dateFilter.type === 'today' && 'عرض تقارير اليوم'}
                              {dateFilter.type === 'current_week' && 'عرض تقارير الأسبوع الحالي'}
                              {dateFilter.type === 'last_week' && 'عرض تقارير الأسبوع الماضي'}
                              {dateFilter.type === 'current_month' && 'عرض تقارير الشهر الحالي'}
                              {dateFilter.type === 'last_month' && 'عرض تقارير الشهر الماضي'}
                              {dateFilter.type === 'custom' && dateFilter.startDate && dateFilter.endDate && 
                                <span className="break-words">{`من ${dateFilter.startDate.toLocaleDateString('ar-SA')} إلى ${dateFilter.endDate.toLocaleDateString('ar-SA')}`}</span>}
                            </span>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Main Content Area */}
              <div className="flex-1 flex flex-col overflow-hidden">
                {/* Tabs Bar - Only for table area, not sidebar */}
                <div className="bg-[#374151] border-b border-gray-600 flex-shrink-0">
                  <div className="flex items-center overflow-x-auto scrollbar-hide">
                    {openTabs.map((tab) => (
                      <div key={tab.id} className="flex items-center">
                        <button
                          onClick={() => switchTab(tab.id)}
                          className={`px-4 py-2 text-sm font-medium border-r border-gray-600 flex items-center gap-2 transition-colors ${
                            tab.active 
                              ? 'bg-[#2B3544] text-white border-b-2 border-blue-400' 
                              : 'text-gray-300 hover:text-white hover:bg-[#4B5563]'
                          }`}
                        >
                          {tab.id === 'main' && (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                          )}
                          <span>{tab.title}</span>
                          {tab.id !== 'main' && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                closeTab(tab.id);
                              }}
                              className="ml-2 hover:text-red-400 transition-colors"
                            >
                              <XMarkIcon className="w-4 h-4" />
                            </button>
                          )}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Table Container */}
                <div className="flex-1 overflow-hidden bg-[#2B3544]">
                  {activeTab === 'products' ? (
                    <>
                      {loading && (
                        <div className="flex items-center justify-center h-32">
                          <div className="text-white">جاري تحميل البيانات...</div>
                        </div>
                      )}
                      {!loading && (
                        <>
                          <ResizableTable
                            className="h-full w-full"
                            columns={productsTableColumns}
                            data={productsReportData}
                            selectedRowId={null}
                            onRowClick={(product, index) => {
                              console.log('Selected product:', product);
                            }}
                            onRowDoubleClick={(product, index) => {
                              // Handle double click if needed
                            }}
                          />
                        </>
                      )}
                    </>
                  ) : activeTab === 'main' ? (
                    <ResizableTable
                      className="h-full w-full"
                      columns={tableColumns}
                      data={reportsData}
                      selectedRowId={selectedReport?.id || null}
                      onRowClick={(report, index) => {
                        if (selectedReport?.id === report.id) {
                          setSelectedReport(null);
                        } else {
                          setSelectedReport(report);
                        }
                      }}
                      onRowDoubleClick={(report, index) => {
                        // Handle double click if needed
                      }}
                    />
                  ) : (
                    /* Other Reports - Not implemented yet */
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center">
                        <DocumentTextIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-white mb-2">
                          {openTabs.find(tab => tab.id === activeTab)?.title}
                        </h3>
                        <p className="text-gray-400">هذا التقرير قيد التطوير</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

        {/* Date Filter Modal */}
        <SimpleDateFilterModal
          isOpen={showDateFilter}
          onClose={() => setShowDateFilter(false)}
          onDateFilterChange={(filter) => {
            setDateFilter(filter);
            if (showProductsReport) {
              // Re-fetch products report when date filter changes
              setTimeout(() => fetchProductsReport(), 100);
            }
          }}
          currentFilter={dateFilter}
        />

        {/* Products Filter Modal */}
        <ProductsFilterModal
          isOpen={showProductsFilter}
          onClose={() => setShowProductsFilter(false)}
          onFilterApply={(productIds, categoryIds) => {
            setSelectedProductIds(productIds)
            setSelectedCategoryIds(categoryIds)
            console.log('Selected Products:', productIds)
            console.log('Selected Categories:', categoryIds)
            if (showProductsReport) {
              // Re-fetch products report when product filter changes
              setTimeout(() => fetchProductsReport(), 100);
            }
          }}
          initialSelectedProducts={selectedProductIds}
          initialSelectedCategories={selectedCategoryIds}
        />

        {/* Customers Filter Modal */}
        <CustomersFilterModal
          isOpen={showCustomersFilter}
          onClose={() => setShowCustomersFilter(false)}
          onFilterApply={(customerIds, groupIds) => {
            setSelectedCustomerIds(customerIds)
            setSelectedCustomerGroupIds(groupIds)
            console.log('Selected Customers:', customerIds)
            console.log('Selected Customer Groups:', groupIds)
          }}
          initialSelectedCustomers={selectedCustomerIds}
          initialSelectedGroups={selectedCustomerGroupIds}
        />

    </div>
  );
}

