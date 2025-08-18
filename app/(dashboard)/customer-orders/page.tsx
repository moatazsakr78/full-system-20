'use client';

import { useState, useEffect } from 'react';
import PrepareOrderModal from '../../components/PrepareOrderModal';

// Order status type
type OrderStatus = 'pending' | 'processing' | 'ready_for_pickup' | 'ready_for_shipping' | 'shipped' | 'delivered' | 'cancelled' | 'issue';

// Order delivery type
type DeliveryType = 'pickup' | 'delivery';

// Order interface with customer info
interface Order {
  id: string;
  orderId?: string; // UUID for database operations
  date: string;
  total: number;
  status: OrderStatus;
  deliveryType: DeliveryType;
  customerName: string;
  customerPhone?: string;
  customerAddress?: string;
  created_at?: string;
  updated_at?: string;
  items: {
    id: string;
    name: string;
    quantity: number;
    price: number;
    image?: string;
    barcode?: string;
    notes?: string;
    isPrepared?: boolean;
  }[];
  preparationProgress?: number;
}

const statusTranslations: Record<OrderStatus, string> = {
  pending: 'معلق',
  processing: 'يتم التحضير',
  ready_for_pickup: 'جاهز للاستلام',
  ready_for_shipping: 'جاهز للشحن',
  shipped: 'تم الشحن',
  delivered: 'تم التسليم',
  cancelled: 'ملغي',
  issue: 'مشكله'
};

const statusColors: Record<OrderStatus, string> = {
  pending: '#EF4444', // Red
  processing: '#F59E0B', // Yellow
  ready_for_pickup: '#86EFAC', // Light Green
  ready_for_shipping: '#FB923C', // Orange
  shipped: '#3B82F6', // Blue
  delivered: '#059669', // Dark Green
  cancelled: '#6B7280', // Gray
  issue: '#8B5CF6' // Purple
};

const statusIcons: Record<OrderStatus, string> = {
  pending: '⏳',
  processing: '👨‍🍳',
  ready_for_pickup: '✅',
  ready_for_shipping: '📦',
  shipped: '🚛',
  delivered: '✅',
  cancelled: '❌',
  issue: '⚠️'
};

export default function CustomerOrdersPage() {
  const [activeTab, setActiveTab] = useState<'all' | 'preparation' | 'followup' | 'completed' | 'issues'>('all');
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set());
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedOrderForProcessing, setSelectedOrderForProcessing] = useState<string | null>(null);
  const [showPrepareModal, setShowPrepareModal] = useState(false);
  const [selectedOrderForPreparation, setSelectedOrderForPreparation] = useState<string | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedOrderForEdit, setSelectedOrderForEdit] = useState<Order | null>(null);
  const [contextMenu, setContextMenu] = useState<{
    show: boolean;
    x: number;
    y: number;
    orderId: string;
  }>({
    show: false,
    x: 0,
    y: 0,
    orderId: ''
  });

  // Invoice creation states
  const [showInvoiceConfirmModal, setShowInvoiceConfirmModal] = useState(false);
  const [selectedOrderForInvoice, setSelectedOrderForInvoice] = useState<Order | null>(null);
  const [nextStatus, setNextStatus] = useState<OrderStatus | null>(null);
  const [showCreateInvoiceModal, setShowCreateInvoiceModal] = useState(false);
  const [invoiceData, setInvoiceData] = useState({
    paidAmount: 0,
    selectedBranch: '',
    selectedRecord: '',
    notes: ''
  });
  const [branches, setBranches] = useState<any[]>([]);
  const [records, setRecords] = useState<any[]>([]);
  const [creatingInvoice, setCreatingInvoice] = useState(false);

  // Debug: Log context menu state changes
  useEffect(() => {
    console.log('Context menu state changed:', contextMenu);
    if (contextMenu.show) {
      console.log('Context menu is now showing at position:', contextMenu.x, contextMenu.y, 'for order:', contextMenu.orderId);
    }
  }, [contextMenu]);

  // Load orders from database
  useEffect(() => {
    const loadOrders = async () => {
      try {
        const { supabase } = await import('../../lib/supabase/client');
        
        // Get all orders with their items and product details for all customers
        const { data: ordersData, error: ordersError } = await supabase
          .from('orders')
          .select(`
            id,
            order_number,
            customer_name,
            customer_phone,
            customer_address,
            total_amount,
            status,
            notes,
            created_at,
            updated_at,
            order_items (
              id,
              quantity,
              unit_price,
              notes,
              is_prepared,
              products (
                id,
                name,
                barcode,
                main_image_url
              )
            )
          `)
          .order('created_at', { ascending: false });

        if (ordersError) {
          console.error('Error fetching orders:', ordersError);
          return;
        }

        // Transform data to match our Order interface and filter out orders with no items
        const transformedOrders: Order[] = (ordersData || [])
          .filter((order: any) => order.order_items && order.order_items.length > 0) // Filter out empty orders
          .map((order: any) => {
            // First, map all items
            const rawItems = order.order_items.map((item: any) => ({
              id: item.id.toString(),
              product_id: item.products?.id,
              name: item.products?.name || 'منتج غير معروف',
              quantity: item.quantity,
              price: parseFloat(item.unit_price),
              image: item.products?.main_image_url || undefined,
              barcode: item.products?.barcode || null,
              notes: item.notes || '',
              isPrepared: item.is_prepared || false
            }));

            // Group items by product_id and combine quantities
            const groupedItemsMap = new Map();
            rawItems.forEach((item: any) => {
              const key = item.product_id || item.name; // Use product_id as key, fallback to name
              if (groupedItemsMap.has(key)) {
                const existingItem = groupedItemsMap.get(key);
                existingItem.quantity += item.quantity;
                // Keep the prepared status as true if any of the items is prepared
                existingItem.isPrepared = existingItem.isPrepared || item.isPrepared;
                // Combine notes if different
                if (item.notes && item.notes !== existingItem.notes) {
                  existingItem.notes = existingItem.notes ? `${existingItem.notes}، ${item.notes}` : item.notes;
                }
              } else {
                groupedItemsMap.set(key, { ...item });
              }
            });

            // Convert back to array
            const items = Array.from(groupedItemsMap.values());

            // Calculate preparation progress based on grouped items
            const preparedItems = items.filter((item: { isPrepared: boolean }) => item.isPrepared).length;
            const totalItems = items.length;
            const preparationProgress = totalItems > 0 ? (preparedItems / totalItems) * 100 : 0;

            return {
              id: order.order_number,
              orderId: order.id, // Keep the actual UUID for database operations
              date: order.created_at.split('T')[0], // Extract date part
              total: parseFloat(order.total_amount),
              status: order.status,
              deliveryType: order.delivery_type || 'pickup',
              customerName: order.customer_name || 'عميل غير محدد',
              customerPhone: order.customer_phone,
              customerAddress: order.customer_address,
              created_at: order.created_at,
              updated_at: order.updated_at,
              items,
              preparationProgress
            };
          });

        setOrders(transformedOrders);
        setLoading(false);

        // Load branches and records for invoice creation
        const [branchesResult, recordsResult] = await Promise.all([
          supabase.from('branches').select('id, name').eq('is_active', true).order('name'),
          supabase.from('records').select('id, name').eq('is_active', true).order('name')
        ]);

        if (!branchesResult.error) setBranches(branchesResult.data || []);
        if (!recordsResult.error) setRecords(recordsResult.data || []);

        // Set up real-time subscription for order items preparation status
        const subscription = supabase
          .channel('order_items_preparation_updates')
          .on(
            'postgres_changes',
            {
              event: 'UPDATE',
              schema: 'public',
              table: 'order_items'
            },
            (payload) => {
              console.log('Real-time preparation update received:', payload);
              
              // Update the specific order's progress
              setOrders(prevOrders => {
                return prevOrders.map(order => {
                  // Find if this order contains the updated item
                  const updatedItemIndex = order.items.findIndex(item => 
                    String(item.id) === String(payload.new.id)
                  );
                  
                  if (updatedItemIndex !== -1) {
                    // Update the item's preparation status
                    const updatedItems = [...order.items];
                    updatedItems[updatedItemIndex] = {
                      ...updatedItems[updatedItemIndex],
                      isPrepared: payload.new.is_prepared || false
                    };
                    
                    // Recalculate progress
                    const preparedItems = updatedItems.filter(item => item.isPrepared).length;
                    const totalItems = updatedItems.length;
                    const preparationProgress = totalItems > 0 ? (preparedItems / totalItems) * 100 : 0;
                    
                    return {
                      ...order,
                      items: updatedItems,
                      preparationProgress
                    };
                  }
                  
                  return order;
                });
              });
            }
          )
          .subscribe();

        // Cleanup subscription on unmount
        return () => {
          supabase.removeChannel(subscription);
        };

      } catch (error) {
        console.error('Error loading orders:', error);
        setLoading(false);
      }
    };

    loadOrders();
  }, []);

  // Filter orders based on active tab and date range
  useEffect(() => {
    let filtered = orders;

    // Filter by status
    switch (activeTab) {
      case 'all':
        // Show all orders
        filtered = orders;
        break;
      case 'preparation':
        // Show orders in preparation phase (معلق، يتم التحضير)
        filtered = orders.filter(order => ['pending', 'processing'].includes(order.status));
        break;
      case 'followup':
        // Show orders in follow-up phase (جاهز للاستلام، جاهز للشحن، تم الشحن)
        filtered = orders.filter(order => ['ready_for_pickup', 'ready_for_shipping', 'shipped'].includes(order.status));
        break;
      case 'completed':
        // Show completed orders (تم التسليم)
        filtered = orders.filter(order => order.status === 'delivered');
        break;
      case 'issues':
        // Show orders with issues (ملغي، مشكله)
        filtered = orders.filter(order => ['cancelled', 'issue'].includes(order.status));
        break;
    }

    // Filter by date range for both tabs
    if (dateFrom || dateTo) {
      filtered = filtered.filter(order => {
        const orderDate = new Date(order.date);
        const fromDate = dateFrom ? new Date(dateFrom) : null;
        const toDate = dateTo ? new Date(dateTo) : null;

        if (fromDate && orderDate < fromDate) return false;
        if (toDate && orderDate > toDate) return false;
        return true;
      });
    }

    setFilteredOrders(filtered);
    
    // Set default expanded state for orders
    const newExpandedOrders = new Set<string>();
    filtered.forEach(order => {
      // Auto-expand orders in preparation, followup, and issues tabs
      if ((activeTab === 'preparation' && ['pending', 'processing'].includes(order.status)) ||
          (activeTab === 'followup' && ['ready_for_pickup', 'ready_for_shipping', 'shipped'].includes(order.status)) ||
          (activeTab === 'issues' && ['cancelled', 'issue'].includes(order.status))) {
        newExpandedOrders.add(order.id);
      }
    });
    setExpandedOrders(newExpandedOrders);
  }, [orders, activeTab, dateFrom, dateTo]);

  // Handle click outside context menu to close it
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (contextMenu.show) {
        console.log('Click outside detected, closing context menu');
        setContextMenu({ show: false, x: 0, y: 0, orderId: '' });
      }
    };

    if (contextMenu.show) {
      // Add a small delay to prevent immediate closing
      setTimeout(() => {
        document.addEventListener('click', handleClickOutside);
      }, 100);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [contextMenu.show]);

  // Auto-cleanup and status update system
  useEffect(() => {
    const checkOrdersForAutoUpdate = async () => {
      const now = new Date();
      
      for (const order of orders) {
        const updatedAt = new Date(order.updated_at || order.created_at || order.date);
        const timeDiff = now.getTime() - updatedAt.getTime();
        const hoursDiff = timeDiff / (1000 * 60 * 60);
        const daysDiff = timeDiff / (1000 * 60 * 60 * 24);

        try {
          const { supabase } = await import('../../lib/supabase/client');

          // Rule 1: Delete cancelled orders after 24 hours
          if (order.status === 'cancelled' && hoursDiff >= 24) {
            console.log(`Deleting cancelled order ${order.id} after 24 hours`);
            
            // First delete related sale_items
            await supabase
              .from('sale_items')
              .delete()
              .eq('order_number', order.id);

            // Then delete the order itself
            const { error } = await supabase
              .from('orders')
              .delete()
              .eq('order_number', order.id);

            if (!error) {
              // Remove from local state
              setOrders(prevOrders => 
                prevOrders.filter(o => o.id !== order.id)
              );
              console.log(`Successfully deleted order ${order.id}`);
            } else {
              console.error('Error deleting order:', error);
            }
          }

          // Rule 2: Auto-convert shipped orders to delivered after 6 days
          if (order.status === 'shipped' && daysDiff >= 6) {
            console.log(`Auto-converting shipped order ${order.id} to delivered after 6 days`);
            
            const { error } = await supabase
              .from('orders')
              .update({ 
                status: 'delivered',
                updated_at: new Date().toISOString()
              })
              .eq('order_number', order.id);

            if (!error) {
              // Update local state
              setOrders(prevOrders => 
                prevOrders.map(o => 
                  o.id === order.id 
                    ? { ...o, status: 'delivered' as OrderStatus }
                    : o
                )
              );
              console.log(`Successfully converted order ${order.id} to delivered`);
            } else {
              console.error('Error updating order status:', error);
            }
          }
        } catch (error) {
          console.error('Error in auto-update system:', error);
        }
      }
    };

    // Run the check when orders change
    if (orders.length > 0) {
      checkOrdersForAutoUpdate();
    }

    // Set up interval to check every hour
    const interval = setInterval(checkOrdersForAutoUpdate, 60 * 60 * 1000); // Every hour

    return () => clearInterval(interval);
  }, [orders]);

  // Toggle order expansion
  const toggleOrderExpansion = (orderId: string) => {
    const newExpandedOrders = new Set(expandedOrders);
    if (newExpandedOrders.has(orderId)) {
      newExpandedOrders.delete(orderId);
    } else {
      newExpandedOrders.add(orderId);
    }
    setExpandedOrders(newExpandedOrders);
  };

  // Handle start preparation button click
  const handleStartPreparation = (orderId: string) => {
    setSelectedOrderForProcessing(orderId);
    setShowConfirmModal(true);
  };

  // Confirm start preparation
  const confirmStartPreparation = async () => {
    if (!selectedOrderForProcessing) return;
    
    // Update order status
    await updateOrderStatus(selectedOrderForProcessing, 'processing');
    
    // Close modal
    setShowConfirmModal(false);
    setSelectedOrderForProcessing(null);
  };

  // Complete preparation and move to next status based on delivery type
  const completePreparation = async (orderId: string) => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;

    let nextStatus: OrderStatus;
    if (order.deliveryType === 'pickup') {
      nextStatus = 'ready_for_pickup';
    } else if (order.deliveryType === 'delivery') {
      nextStatus = 'ready_for_shipping';
    } else {
      // Default to pickup if deliveryType is null or undefined
      nextStatus = 'ready_for_pickup';
    }

    await updateOrderStatus(orderId, nextStatus);
  };

  // Move to next status with invoice creation
  const moveToNextStatus = async (orderId: string) => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;

    let nextStatusValue: OrderStatus;
    
    switch (order.status) {
      case 'ready_for_pickup':
        nextStatusValue = 'delivered';
        break;
      case 'ready_for_shipping':
        nextStatusValue = 'shipped';
        break;
      case 'shipped':
        nextStatusValue = 'delivered';
        break;
      default:
        return;
    }

    // Check if this transition requires invoice creation
    if ((order.status === 'ready_for_pickup' && nextStatusValue === 'delivered') ||
        (order.status === 'ready_for_shipping' && nextStatusValue === 'shipped')) {
      // Show invoice confirmation modal
      setSelectedOrderForInvoice(order);
      setNextStatus(nextStatusValue);
      setInvoiceData({
        paidAmount: order.total,
        selectedBranch: branches.length > 0 ? branches[0].id : '',
        selectedRecord: records.length > 0 ? records[0].id : '',
        notes: ''
      });
      setShowInvoiceConfirmModal(true);
    } else {
      // Direct status update for other transitions
      await updateOrderStatus(orderId, nextStatusValue);
    }
  };

  // Handle invoice creation confirmation
  const handleInvoiceConfirmation = (confirmed: boolean) => {
    if (confirmed) {
      setShowInvoiceConfirmModal(false);
      setShowCreateInvoiceModal(true);
    } else {
      setShowInvoiceConfirmModal(false);
      setSelectedOrderForInvoice(null);
      setNextStatus(null);
    }
  };

  // Create invoice
  const createInvoice = async () => {
    if (!selectedOrderForInvoice || !nextStatus) return;

    if (!invoiceData.selectedBranch || !invoiceData.selectedRecord) {
      alert('يرجى التأكد من اختيار الفرع والسجل');
      return;
    }

    if (invoiceData.paidAmount < 0 || invoiceData.paidAmount > selectedOrderForInvoice.total) {
      alert('المبلغ المدفوع غير صحيح');
      return;
    }

    setCreatingInvoice(true);

    try {
      const { supabase } = await import('../../lib/supabase/client');

      // Find customer ID from orders table
      const { data: orderData } = await supabase
        .from('orders')
        .select('customer_id, customer_name')
        .eq('order_number', selectedOrderForInvoice.id)
        .single();

      // Generate invoice number
      const invoiceNumber = 'INV-' + Date.now().toString().slice(-8);

      // Create sale (invoice)
      const { data: saleData, error: saleError } = await supabase
        .from('sales')
        .insert({
          invoice_number: invoiceNumber,
          total_amount: selectedOrderForInvoice.total,
          tax_amount: 0,
          discount_amount: 0,
          payment_method: 'cash',
          branch_id: invoiceData.selectedBranch,
          customer_id: orderData?.customer_id,
          record_id: invoiceData.selectedRecord,
          notes: invoiceData.notes || `فاتورة للطلب رقم: ${selectedOrderForInvoice.id}`,
          invoice_type: 'Sale Invoice' as any,
          time: new Date().toTimeString().split(' ')[0]
        })
        .select('id')
        .single();

      if (saleError) {
        console.error('Error creating sale:', saleError);
        throw saleError;
      }

      // Get order items with product_ids
      const { data: orderItemsData } = await supabase
        .from('order_items')
        .select('id, product_id, quantity, unit_price')
        .eq('order_id', selectedOrderForInvoice.orderId || selectedOrderForInvoice.id);

      // Create sale items using the correct product_ids
      const saleItems = (orderItemsData || []).map(orderItem => ({
        sale_id: saleData.id,
        product_id: orderItem.product_id,
        quantity: orderItem.quantity,
        unit_price: orderItem.unit_price,
        cost_price: orderItem.unit_price * 0.7,
        discount: 0
      }));

      const { error: itemsError } = await supabase
        .from('sale_items')
        .insert(saleItems);

      if (itemsError) {
        console.error('Error creating sale items:', itemsError);
        await supabase.from('sales').delete().eq('id', saleData.id);
        throw itemsError;
      }

      // Update order status
      await updateOrderStatus(selectedOrderForInvoice.id, nextStatus);

      // Show print confirmation
      const shouldPrint = confirm('تم إنشاء الفاتورة بنجاح! هل تريد طباعتها الآن؟');
      if (shouldPrint) {
        printInvoice(saleData.id, invoiceNumber);
      }

      // Close modals
      setShowCreateInvoiceModal(false);
      setSelectedOrderForInvoice(null);
      setNextStatus(null);

    } catch (error) {
      console.error('Error creating invoice:', error);
      alert('حدث خطأ أثناء إنشاء الفاتورة. يرجى المحاولة مرة أخرى.');
    } finally {
      setCreatingInvoice(false);
    }
  };

  // Print invoice function
  const printInvoice = (saleId: string, invoiceNumber: string) => {
    if (!selectedOrderForInvoice) return;

    const printContent = `
      <div style="font-family: 'Cairo', Arial, sans-serif; max-width: 300px; margin: 0 auto; direction: rtl;">
        <div style="text-align: center; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 15px;">
          <h2 style="margin: 0; font-size: 18px;">El Farouk Group</h2>
          <p style="margin: 5px 0; font-size: 12px;">فاتورة بيع</p>
        </div>
        
        <div style="margin-bottom: 15px; font-size: 11px;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 3px;">
            <span>${invoiceNumber}</span>
            <span>رقم الفاتورة:</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 3px;">
            <span>${new Date().toLocaleDateString('ar-SA')}</span>
            <span>التاريخ:</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 3px;">
            <span>${new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}</span>
            <span>الوقت:</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 3px;">
            <span>${selectedOrderForInvoice.customerName}</span>
            <span>العميل:</span>
          </div>
          ${selectedOrderForInvoice.customerPhone ? `
          <div style="display: flex; justify-content: space-between;">
            <span>${selectedOrderForInvoice.customerPhone}</span>
            <span>الهاتف:</span>
          </div>
          ` : ''}
        </div>
        
        <div style="border-top: 1px dashed #000; border-bottom: 1px dashed #000; padding: 10px 0; margin-bottom: 15px;">
          ${selectedOrderForInvoice.items.map(item => `
            <div style="margin-bottom: 8px; font-size: 10px;">
              <div style="font-weight: bold;">${item.name}</div>
              <div style="display: flex; justify-content: space-between;">
                <span>${(item.price * item.quantity).toFixed(2)} ريال</span>
                <span>${item.quantity} × ${item.price.toFixed(2)}</span>
              </div>
            </div>
          `).join('')}
        </div>
        
        <div style="font-size: 12px; margin-bottom: 15px;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
            <span style="font-weight: bold;">${selectedOrderForInvoice.total.toFixed(2)} ريال</span>
            <span>الإجمالي:</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
            <span style="font-weight: bold; color: green;">${invoiceData.paidAmount.toFixed(2)} ريال</span>
            <span>المدفوع:</span>
          </div>
          <div style="display: flex; justify-content: space-between; border-top: 1px solid #000; padding-top: 5px;">
            <span style="font-weight: bold; color: ${selectedOrderForInvoice.total - invoiceData.paidAmount > 0 ? 'red' : 'green'};">
              ${(selectedOrderForInvoice.total - invoiceData.paidAmount).toFixed(2)} ريال
            </span>
            <span>المتبقي:</span>
          </div>
        </div>
        
        <div style="text-align: center; font-size: 10px; color: #666;">
          <p style="margin: 5px 0;">شكراً لزيارتكم</p>
          <p style="margin: 5px 0;">يرجى الاحتفاظ بالفاتورة</p>
        </div>
      </div>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>فاتورة ${invoiceNumber}</title>
          <style>
            @media print {
              body { margin: 0; }
              @page { margin: 10mm; }
            }
          </style>
        </head>
        <body>
          ${printContent}
        </body>
        </html>
      `);
      printWindow.document.close();
      
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 500);
    }
  };

  // Handle preparation page button click
  const handlePreparationPage = (orderId: string) => {
    setSelectedOrderForPreparation(orderId);
    setShowPrepareModal(true);
  };

  // Close prepare modal
  const closePrepareModal = () => {
    setShowPrepareModal(false);
    setSelectedOrderForPreparation(null);
  };

  // Handle edit order button click
  const handleEditOrder = (order: Order) => {
    setSelectedOrderForEdit(order);
    setShowEditModal(true);
  };

  // Close edit modal
  const closeEditModal = () => {
    setShowEditModal(false);
    setSelectedOrderForEdit(null);
  };

  // Handle marking order as cancelled
  const handleMarkAsCancelled = async (orderId: string) => {
    try {
      const { supabase } = await import('../../lib/supabase/client');
      
      const { error } = await supabase
        .from('orders')
        .update({ 
          status: 'cancelled',
          updated_at: new Date().toISOString()
        })
        .eq('order_number', orderId);

      if (error) {
        console.error('Error marking order as cancelled:', error);
        alert('خطأ في تحديث حالة الطلب');
        return;
      }

      // Update local state
      setOrders(prevOrders => 
        prevOrders.map(order => 
          order.id === orderId 
            ? { ...order, status: 'cancelled' as OrderStatus }
            : order
        )
      );

      alert('تم تحديث حالة الطلب إلى ملغي');
    } catch (error) {
      console.error('Error marking order as cancelled:', error);
      alert('خطأ في تحديث حالة الطلب');
    }
  };

  // Handle marking order as having an issue
  const handleMarkAsIssue = async (orderId: string) => {
    try {
      const { supabase } = await import('../../lib/supabase/client');
      
      const { error } = await supabase
        .from('orders')
        .update({ 
          status: 'issue',
          updated_at: new Date().toISOString()
        })
        .eq('order_number', orderId);

      if (error) {
        console.error('Error marking order as issue:', error);
        alert('خطأ في تحديث حالة الطلب');
        return;
      }

      // Update local state
      setOrders(prevOrders => 
        prevOrders.map(order => 
          order.id === orderId 
            ? { ...order, status: 'issue' as OrderStatus }
            : order
        )
      );

      alert('تم تحديث حالة الطلب إلى مشكله');
    } catch (error) {
      console.error('Error marking order as issue:', error);
      alert('خطأ في تحديث حالة الطلب');
    }
  };

  // Handle right-click on status tag
  const handleStatusRightClick = (e: React.MouseEvent, orderId: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    console.log('Right-click detected on order:', orderId);
    console.log('Mouse position:', e.clientX, e.clientY);
    
    setContextMenu({
      show: true,
      x: e.clientX,
      y: e.clientY,
      orderId: orderId
    });
    
    console.log('Context menu state set to show');
  };

  // Handle context menu option selection
  const handleContextMenuAction = async (action: 'cancelled' | 'issue') => {
    if (!contextMenu.orderId) return;

    try {
      if (action === 'cancelled') {
        if (confirm('هل أنت متأكد من إلغاء هذا الطلب؟')) {
          await handleMarkAsCancelled(contextMenu.orderId);
        }
      } else if (action === 'issue') {
        if (confirm('هل أنت متأكد من وضع علامة مشكله على هذا الطلب؟')) {
          await handleMarkAsIssue(contextMenu.orderId);
        }
      }
    } catch (error) {
      console.error('Error handling context menu action:', error);
    }

    // Close context menu
    setContextMenu({ show: false, x: 0, y: 0, orderId: '' });
  };

  // Helper function to calculate time remaining for auto-actions
  const getTimeRemaining = (order: Order) => {
    if (!order.updated_at && !order.created_at && !order.date) return null;
    
    const now = new Date();
    const updatedAt = new Date(order.updated_at || order.created_at || order.date);
    const timeDiff = now.getTime() - updatedAt.getTime();
    
    if (order.status === 'cancelled') {
      const hoursRemaining = 24 - (timeDiff / (1000 * 60 * 60));
      if (hoursRemaining > 0) {
        return {
          type: 'deletion',
          time: Math.ceil(hoursRemaining),
          unit: 'hours',
          text: `سيتم حذف الطلب خلال ${Math.ceil(hoursRemaining)} ساعة`
        };
      }
    } else if (order.status === 'shipped') {
      const daysRemaining = 6 - (timeDiff / (1000 * 60 * 60 * 24));
      if (daysRemaining > 0) {
        return {
          type: 'delivery',
          time: Math.ceil(daysRemaining),
          unit: 'days',
          text: `سيتم تحويله إلى "تم التسليم" خلال ${Math.ceil(daysRemaining)} يوم`
        };
      }
    }
    
    return null;
  };

  // Update item quantity
  const updateItemQuantity = (itemId: string, newQuantity: number) => {
    if (!selectedOrderForEdit || newQuantity <= 0) return;
    
    const updatedItems = selectedOrderForEdit.items.map(item =>
      item.id === itemId ? { ...item, quantity: newQuantity } : item
    );
    
    const newTotal = updatedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    setSelectedOrderForEdit({
      ...selectedOrderForEdit,
      items: updatedItems,
      total: newTotal
    });
  };

  // Update item notes
  const updateItemNotes = (itemId: string, notes: string) => {
    if (!selectedOrderForEdit) return;
    
    const updatedItems = selectedOrderForEdit.items.map(item =>
      item.id === itemId ? { ...item, notes } : item
    );
    
    setSelectedOrderForEdit({
      ...selectedOrderForEdit,
      items: updatedItems
    });
  };

  // Remove item from order
  const removeItem = (itemId: string) => {
    if (!selectedOrderForEdit) return;
    
    const updatedItems = selectedOrderForEdit.items.filter(item => item.id !== itemId);
    const newTotal = updatedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    setSelectedOrderForEdit({
      ...selectedOrderForEdit,
      items: updatedItems,
      total: newTotal
    });
  };

  // Save order changes
  const saveOrderChanges = async () => {
    if (!selectedOrderForEdit) return;
    
    try {
      const { supabase } = await import('../../lib/supabase/client');
      
      // Update order total
      const { error: orderError } = await supabase
        .from('orders')
        .update({ 
          total_amount: selectedOrderForEdit.total,
          updated_at: new Date().toISOString()
        })
        .eq('order_number', selectedOrderForEdit.id);

      if (orderError) {
        console.error('Error updating order:', orderError);
        return;
      }

      // Update order items quantities, notes and remove deleted items
      for (const item of selectedOrderForEdit.items) {
        const { error: itemError } = await supabase
          .from('order_items')
          .update({ 
            quantity: item.quantity,
            notes: item.notes || null
          })
          .eq('id', item.id);

        if (itemError) {
          console.error('Error updating item:', itemError);
        }
      }

      // Remove items that were deleted
      const originalItems = orders.find(o => o.id === selectedOrderForEdit.id)?.items || [];
      const deletedItems = originalItems.filter(original => 
        !selectedOrderForEdit.items.find(current => current.id === original.id)
      );

      for (const deletedItem of deletedItems) {
        const { error: deleteError } = await supabase
          .from('order_items')
          .delete()
          .eq('id', deletedItem.id);

        if (deleteError) {
          console.error('Error deleting item:', deleteError);
        }
      }

      // Update local state
      setOrders(prevOrders => 
        prevOrders.map(order => 
          order.id === selectedOrderForEdit.id ? selectedOrderForEdit : order
        )
      );

      closeEditModal();
    } catch (error) {
      console.error('Error saving order changes:', error);
    }
  };

  // Update order status
  const updateOrderStatus = async (orderId: string, newStatus: OrderStatus) => {
    try {
      const { supabase } = await import('../../lib/supabase/client');
      
      const { error } = await supabase
        .from('orders')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('order_number', orderId);

      if (error) {
        console.error('Error updating order status:', error);
        return;
      }

      // Update local state
      setOrders(prevOrders => 
        prevOrders.map(order => 
          order.id === orderId 
            ? { ...order, status: newStatus }
            : order
        )
      );
    } catch (error) {
      console.error('Error updating order status:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{backgroundColor: '#c0c0c0'}}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4" style={{borderBottomColor: '#5D1F1F'}}></div>
          <p className="text-gray-600">جاري تحميل طلبات العملاء...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-gray-800" style={{backgroundColor: '#c0c0c0'}}>

      {/* Store Header (Red) */}
      <header className="border-b border-gray-700 py-0 relative z-40" style={{backgroundColor: '#5d1f1f'}}>
        <div className="relative flex items-center min-h-[80px]">
          <div className="max-w-[80%] mx-auto px-4 flex items-center justify-between min-h-[80px] w-full">
            <div className="flex items-center gap-8">
              <button
                onClick={() => window.history.back()}
                className="flex items-center gap-2 text-white hover:text-gray-300 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                <span>العودة</span>
              </button>
              
              <div className="flex items-center gap-3">
                <img src="/assets/logo/El Farouk Group2.png" alt="الفاروق" className="h-20 w-20 object-contain" />
                <h1 className="text-xl font-bold text-white">قائمة الطلبات - El Farouk Group</h1>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-[80%] mx-auto px-4 py-8">
        {/* Tabs */}
        <div className="flex mb-8 bg-white rounded-lg overflow-hidden shadow-lg">
          <button
            onClick={() => setActiveTab('all')}
            className={`flex-1 py-4 px-6 font-semibold transition-colors ${
              activeTab === 'all'
                ? 'text-white'
                : 'text-gray-600 hover:text-gray-800'
            }`}
            style={{
              backgroundColor: activeTab === 'all' ? '#5d1f1f' : 'transparent'
            }}
          >
            الكل
          </button>
          <button
            onClick={() => setActiveTab('preparation')}
            className={`flex-1 py-4 px-6 font-semibold transition-colors ${
              activeTab === 'preparation'
                ? 'text-white'
                : 'text-gray-600 hover:text-gray-800'
            }`}
            style={{
              backgroundColor: activeTab === 'preparation' ? '#5d1f1f' : 'transparent'
            }}
          >
            التحضير
          </button>
          <button
            onClick={() => setActiveTab('followup')}
            className={`flex-1 py-4 px-6 font-semibold transition-colors ${
              activeTab === 'followup'
                ? 'text-white'
                : 'text-gray-600 hover:text-gray-800'
            }`}
            style={{
              backgroundColor: activeTab === 'followup' ? '#5d1f1f' : 'transparent'
            }}
          >
            المتابعة
          </button>
          <button
            onClick={() => setActiveTab('completed')}
            className={`flex-1 py-4 px-6 font-semibold transition-colors ${
              activeTab === 'completed'
                ? 'text-white'
                : 'text-gray-600 hover:text-gray-800'
            }`}
            style={{
              backgroundColor: activeTab === 'completed' ? '#5d1f1f' : 'transparent'
            }}
          >
            المنفذ
          </button>
          <button
            onClick={() => setActiveTab('issues')}
            className={`flex-1 py-4 px-6 font-semibold transition-colors ${
              activeTab === 'issues'
                ? 'text-white'
                : 'text-gray-600 hover:text-gray-800'
            }`}
            style={{
              backgroundColor: activeTab === 'issues' ? '#5d1f1f' : 'transparent'
            }}
          >
            مشكله
          </button>
        </div>

        {/* Date Filter (for both tabs) */}
        <div className="bg-white rounded-lg p-6 mb-6 shadow-lg">
          <h3 className="text-lg font-semibold mb-4 text-gray-800">فلتر التاريخ</h3>
          <div className="flex flex-wrap gap-4">
            <div className="flex flex-col">
              <label className="text-sm text-gray-600 mb-1">من تاريخ</label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2"
                style={{"--tw-ring-color": "#5D1F1F"} as React.CSSProperties}
              />
            </div>
            <div className="flex flex-col">
              <label className="text-sm text-gray-600 mb-1">إلى تاريخ</label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2"
                style={{"--tw-ring-color": "#5D1F1F"} as React.CSSProperties}
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={() => {
                  setDateFrom('');
                  setDateTo('');
                }}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                مسح الفلتر
              </button>
            </div>
          </div>
        </div>

        {/* Orders List */}
        <div className="space-y-4">
          {filteredOrders.length === 0 ? (
            <div className="bg-white rounded-lg p-8 shadow-lg text-center">
              <div className="text-gray-400 text-6xl mb-4">📦</div>
              <h3 className="text-xl font-semibold text-gray-600 mb-2">
                {activeTab === 'all' && 'لا توجد طلبات'}
                {activeTab === 'preparation' && 'لا توجد طلبات قيد التحضير'}
                {activeTab === 'followup' && 'لا توجد طلبات في المتابعة'}
                {activeTab === 'completed' && 'لا توجد طلبات مكتملة'}
                {activeTab === 'issues' && 'لا توجد طلبات بها مشاكل'}
              </h3>
              <p className="text-gray-500">
                {activeTab === 'all' && 'لا توجد طلبات في قاعدة البيانات'}
                {activeTab === 'preparation' && 'جميع الطلبات تم تحضيرها'}
                {activeTab === 'followup' && 'لا توجد طلبات تحتاج متابعة'}
                {activeTab === 'completed' && 'لم يتم تسليم أي طلبات بعد'}
                {activeTab === 'issues' && 'جميع الطلبات تسير بسلاسة'}
              </p>
            </div>
          ) : (
            filteredOrders.map((order) => {
              const isExpanded = expandedOrders.has(order.id);
              return (
                <div key={order.id} className="bg-white rounded-lg shadow-lg overflow-hidden">
                  {/* Status Tag - Moved to top */}
                  <div className="px-6 pt-4">
                    <div className="flex gap-3">
                      <span
                        className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-base font-bold cursor-pointer ${
                          order.status === 'ready_for_pickup' ? 'text-green-800' : 'text-white'
                        }`}
                        style={{ backgroundColor: statusColors[order.status] }}
                        onContextMenu={(e) => {
                          console.log('Right-click on order:', order.id, 'status:', order.status);
                          // Show context menu for all orders except delivered, cancelled, and issue
                          if (!['cancelled', 'issue', 'delivered'].includes(order.status)) {
                            console.log('Showing context menu for order:', order.id);
                            handleStatusRightClick(e, order.id);
                          } else {
                            console.log('Context menu blocked for status:', order.status);
                            e.preventDefault(); // Still prevent default browser context menu
                          }
                        }}
                        title={
                          !['cancelled', 'issue', 'delivered'].includes(order.status) 
                            ? "انقر بالزر الأيمن لتغيير الحالة إلى (ملغي) أو (مشكله)" 
                            : "لا يمكن تغيير حالة هذا الطلب"
                        }
                      >
                        <span>{statusIcons[order.status]}</span>
                        {statusTranslations[order.status]}
                      </span>

                      {/* Time Remaining Indicator for Auto-Actions */}
                      {(() => {
                        const timeRemaining = getTimeRemaining(order);
                        if (timeRemaining) {
                          return (
                            <div 
                              className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                                timeRemaining.type === 'deletion' 
                                  ? 'bg-red-100 text-red-800 border border-red-200' 
                                  : 'bg-blue-100 text-blue-800 border border-blue-200'
                              }`}
                              title={timeRemaining.text}
                            >
                              <span>{timeRemaining.type === 'deletion' ? '🗑️' : '📦'}</span>
                              <span>
                                {timeRemaining.time} {timeRemaining.unit === 'hours' ? 'س' : 'ي'}
                              </span>
                            </div>
                          );
                        }
                        return null;
                      })()}
                    </div>
                  </div>


                  {/* Order Header - Always Visible */}
                  <div 
                    className="flex justify-between items-center p-6 cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => toggleOrderExpansion(order.id)}
                    onContextMenu={(e) => {
                      // Prevent the div's context menu and let child elements handle it
                      e.preventDefault();
                    }}
                  >
                    <div className="flex items-center gap-4">
                      {/* Collapse/Expand Arrow */}
                      <svg 
                        className={`w-5 h-5 text-gray-500 transform transition-transform duration-200 ${
                          isExpanded ? 'rotate-90' : 'rotate-0'
                        }`} 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                      
                      <div>
                        <h3 className="text-lg font-semibold text-gray-800">طلب رقم: {order.id}</h3>
                        <p className="text-gray-600">التاريخ: {new Date(order.date).toLocaleDateString('ar-SA')}</p>
                        <p className="text-blue-600 font-medium">العميل: {order.customerName}</p>
                        {order.customerPhone && (
                          <p className="text-gray-500 text-sm">الهاتف: {order.customerPhone}</p>
                        )}
                      </div>
                    </div>
                    
                    <div className="text-left">
                      <p className="text-xl font-bold text-gray-800 mb-2">{order.total.toFixed(2)} ريال</p>
                      
                      {/* Action Buttons - Moved to right side */}
                      <div className="flex flex-col gap-2">
                        {/* Start Preparation Button - Only for pending orders */}
                        {order.status === 'pending' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleStartPreparation(order.id);
                            }}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                            بدء التحضير
                          </button>
                        )}
                        
                        {/* Preparation Page Button - Only for processing orders */}
                        {order.status === 'processing' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handlePreparationPage(order.id);
                            }}
                            className="inline-flex items-center gap-2 px-4 py-2 text-white text-sm font-medium rounded-lg transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105"
                            style={{ backgroundColor: '#F59E0B' }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = '#D97706';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = '#F59E0B';
                            }}
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                            </svg>
                            صفحة التحضير
                          </button>
                        )}

                        {/* Edit Order Button - For pending and processing orders */}
                        {(order.status === 'pending' || order.status === 'processing') && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditOrder(order);
                            }}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            تعديل
                          </button>
                        )}

                        {/* Complete Preparation Button - For processing orders with all items prepared */}
                        {order.status === 'processing' && order.preparationProgress === 100 && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              completePreparation(order.id);
                            }}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            إتمام الطلب
                          </button>
                        )}

                        {/* Next Status Button - For ready orders */}
                        {(order.status === 'ready_for_pickup' || order.status === 'ready_for_shipping' || order.status === 'shipped') && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              moveToNextStatus(order.id);
                            }}
                            className={`inline-flex items-center gap-1 px-3 py-1 text-white text-xs font-medium rounded-md transition-all duration-200 shadow-sm hover:shadow-md transform hover:scale-105 ${
                              order.status === 'ready_for_pickup' ? 'bg-green-600 hover:bg-green-700' :
                              order.status === 'ready_for_shipping' ? 'bg-blue-600 hover:bg-blue-700' :
                              'bg-green-600 hover:bg-green-700'
                            }`}
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {order.status === 'ready_for_pickup' ? 'تم التسليم' :
                             order.status === 'ready_for_shipping' ? 'تم الشحن' :
                             'تم التسليم'}
                          </button>
                        )}
                      </div>
                      
                      {/* Progress Bar at the top - Only for processing orders */}
                      {order.status === 'processing' && order.preparationProgress !== undefined && (
                        <div className="mt-3 min-w-[250px]">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-xs font-medium text-gray-600">
                              {order.items.filter(item => item.isPrepared).length}/{order.items.length}
                            </span>
                            <span className="text-xs font-medium text-gray-600">
                              {Math.round(order.preparationProgress)}%
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-1.5">
                            <div 
                              className={`h-1.5 rounded-full transition-all duration-300 ${
                                order.preparationProgress === 100 ? 'bg-green-500' : 'bg-yellow-500'
                              }`}
                              style={{ width: `${order.preparationProgress}%` }}
                            ></div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Order Items - Collapsible */}
                  {isExpanded && (
                    <div className="px-6 pb-6 border-t border-gray-200">
                      {/* Customer Address */}
                      {order.customerAddress && (
                        <div className="pt-4 pb-2">
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">العنوان:</span> {order.customerAddress}
                          </p>
                        </div>
                      )}
                      
                      {/* Table Header */}
                      <div className="grid grid-cols-6 gap-4 p-3 bg-gray-100 rounded-lg font-semibold text-gray-700 text-sm">
                        <div className="text-right">المنتج</div>
                        <div className="text-center">السعر</div>
                        <div className="text-center">الكمية</div>
                        <div className="text-center">الإجمالي</div>
                        <div className="text-center">ملاحظات</div>
                        <div className="text-center">الألوان</div>
                      </div>

                      {/* Items */}
                      <div className="pt-4 space-y-3">
                        {order.items.map((item) => (
                          <div key={item.id} className="grid grid-cols-6 gap-4 p-3 bg-gray-50 rounded-lg items-center">
                            {/* Product Image and Name */}
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center flex-shrink-0">
                                {item.image ? (
                                  <img 
                                    src={item.image} 
                                    alt={item.name}
                                    className="w-full h-full object-cover rounded-lg"
                                  />
                                ) : (
                                  <span className="text-gray-400 text-xl">📦</span>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="font-semibold text-gray-800 text-sm">
                                  {item.name}
                                </h4>
                              </div>
                            </div>

                            {/* Price */}
                            <div className="text-center">
                              <p className="font-medium text-gray-800 text-sm">{item.price.toFixed(2)} ريال</p>
                            </div>

                            {/* Quantity */}
                            <div className="text-center">
                              <p className="font-medium text-gray-800">{item.quantity}</p>
                            </div>

                            {/* Total */}
                            <div className="text-center">
                              <p className="font-semibold text-gray-800">{(item.price * item.quantity).toFixed(2)} ريال</p>
                            </div>

                            {/* Notes */}
                            <div className="text-center">
                              <p className="text-gray-600 text-sm">{item.notes || '-'}</p>
                            </div>

                            {/* Colors */}
                            <div className="text-center">
                              <p className="text-gray-600 text-sm">-</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </main>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">تأكيد بدء التحضير</h3>
            <p className="text-gray-600 mb-6">هل أنت متأكد أنك تريد تفعيل وضع التحضير لهذا الطلب؟</p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowConfirmModal(false);
                  setSelectedOrderForProcessing(null);
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                إلغاء
              </button>
              <button
                onClick={confirmStartPreparation}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
              >
                نعم، بدء التحضير
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Prepare Order Modal */}
      {showPrepareModal && selectedOrderForPreparation && (
        <PrepareOrderModal
          isOpen={showPrepareModal}
          onClose={closePrepareModal}
          orderId={selectedOrderForPreparation}
        />
      )}

      {/* Edit Order Modal */}
      {showEditModal && selectedOrderForEdit && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-200" style={{ backgroundColor: '#5d1f1f' }}>
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold text-white">تعديل الطلب: {selectedOrderForEdit.id}</h3>
                <button
                  onClick={closeEditModal}
                  className="text-white hover:text-gray-300 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              <div className="space-y-4">
                {/* Order Info */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-800 mb-2">معلومات الطلب</h4>
                  <p className="text-gray-600 text-sm">العميل: {selectedOrderForEdit.customerName}</p>
                  {selectedOrderForEdit.customerPhone && (
                    <p className="text-gray-600 text-sm">الهاتف: {selectedOrderForEdit.customerPhone}</p>
                  )}
                  <p className="text-gray-600 text-sm">التاريخ: {new Date(selectedOrderForEdit.date).toLocaleDateString('ar-SA')}</p>
                </div>

                {/* Items List */}
                <div>
                  <h4 className="font-semibold text-gray-800 mb-4">عناصر الطلب</h4>
                  
                  {selectedOrderForEdit.items.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-gray-500">لا توجد عناصر في الطلب</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {selectedOrderForEdit.items.map((item) => (
                        <div key={item.id} className="bg-gray-50 rounded-lg p-4 space-y-3">
                          {/* First Row: Product Info and Controls */}
                          <div className="flex items-center gap-4">
                            {/* Product Image */}
                            <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center flex-shrink-0">
                              {item.image ? (
                                <img 
                                  src={item.image} 
                                  alt={item.name}
                                  className="w-full h-full object-cover rounded-lg"
                                />
                              ) : (
                                <span className="text-gray-400 text-2xl">📦</span>
                              )}
                            </div>

                            {/* Product Info */}
                            <div className="flex-1">
                              <h5 className="font-semibold text-gray-800">{item.name}</h5>
                              <p className="text-gray-600 text-sm">{item.price.toFixed(2)} ريال لكل قطعة</p>
                            </div>

                            {/* Quantity Controls */}
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => updateItemQuantity(item.id, item.quantity - 1)}
                                className="w-8 h-8 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center text-sm font-bold transition-colors"
                              >
                                -
                              </button>
                              <span className="w-12 text-center font-semibold">{item.quantity}</span>
                              <button
                                onClick={() => updateItemQuantity(item.id, item.quantity + 1)}
                                className="w-8 h-8 bg-green-500 hover:bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-bold transition-colors"
                              >
                                +
                              </button>
                            </div>

                            {/* Item Total */}
                            <div className="text-right min-w-[80px]">
                              <p className="font-semibold text-gray-800">{(item.price * item.quantity).toFixed(2)} ريال</p>
                            </div>

                            {/* Remove Button */}
                            <button
                              onClick={() => removeItem(item.id)}
                              className="w-8 h-8 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center transition-colors"
                              title="حذف المنتج"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>

                          {/* Second Row: Notes */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              ملاحظات على المنتج:
                            </label>
                            <textarea
                              value={item.notes || ''}
                              onChange={(e) => updateItemNotes(item.id, e.target.value)}
                              placeholder="أضف ملاحظات على هذا المنتج..."
                              className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                              rows={2}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Order Total */}
                <div className="bg-gray-100 p-4 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-gray-700">إجمالي الطلب:</span>
                    <span className="font-bold text-xl text-gray-800">{selectedOrderForEdit.total.toFixed(2)} ريال</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-gray-200 bg-gray-50">
              <div className="flex gap-3 justify-end">
                <button
                  onClick={closeEditModal}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  إلغاء
                </button>
                <button
                  onClick={saveOrderChanges}
                  className="px-6 py-2 text-white rounded-lg transition-colors"
                  style={{ backgroundColor: '#5d1f1f' }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#4a1919';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#5d1f1f';
                  }}
                >
                  حفظ التغييرات
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Context Menu for Status Change */}
      {contextMenu.show && (
        <div
          className="fixed bg-white border border-gray-200 rounded-lg shadow-xl py-2"
          style={{
            left: contextMenu.x,
            top: contextMenu.y,
            minWidth: '150px',
            zIndex: 9999
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => handleContextMenuAction('cancelled')}
            className="w-full px-4 py-2 text-right hover:bg-gray-100 transition-colors flex items-center gap-2"
          >
            <span className="w-3 h-3 bg-gray-500 rounded-full"></span>
            <span>ملغي</span>
          </button>
          <button
            onClick={() => handleContextMenuAction('issue')}
            className="w-full px-4 py-2 text-right hover:bg-gray-100 transition-colors flex items-center gap-2"
          >
            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: '#8B5CF6' }}></span>
            <span>مشكله</span>
          </button>
        </div>
      )}

      {/* Invoice Creation Confirmation Modal */}
      {showInvoiceConfirmModal && selectedOrderForInvoice && nextStatus && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">إنشاء فاتورة</h3>
            <p className="text-gray-600 mb-2">
              يتطلب تغيير حالة الطلب إلى <span className="font-bold text-gray-800">&quot;{statusTranslations[nextStatus]}&quot;</span> إنشاء فاتورة أولاً.
            </p>
            <p className="text-gray-600 mb-6">
              هل تريد إنشاء فاتورة للطلب رقم: <span className="font-bold text-blue-600">{selectedOrderForInvoice.id}</span>؟
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => handleInvoiceConfirmation(false)}
                className="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-700 rounded-lg transition-colors"
              >
                إلغاء
              </button>
              <button
                onClick={() => handleInvoiceConfirmation(true)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                نعم، إنشاء فاتورة
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Invoice Modal */}
      {showCreateInvoiceModal && selectedOrderForInvoice && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-200" style={{ backgroundColor: '#5d1f1f' }}>
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold text-white">إنشاء فاتورة للطلب: {selectedOrderForInvoice.id}</h3>
                <button
                  onClick={() => setShowCreateInvoiceModal(false)}
                  className="text-white hover:text-gray-300 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto max-h-[70vh]">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                
                {/* Order Details */}
                <div>
                  <h4 className="text-lg font-semibold text-gray-800 mb-4">تفاصيل الطلب</h4>
                  
                  <div className="space-y-3 mb-6 bg-gray-50 p-4 rounded-lg">
                    <div><span className="font-semibold">رقم الطلب:</span> {selectedOrderForInvoice.id}</div>
                    <div><span className="font-semibold">اسم العميل:</span> {selectedOrderForInvoice.customerName}</div>
                    {selectedOrderForInvoice.customerPhone && (
                      <div><span className="font-semibold">رقم الهاتف:</span> {selectedOrderForInvoice.customerPhone}</div>
                    )}
                    <div><span className="font-semibold">التاريخ:</span> {new Date(selectedOrderForInvoice.date).toLocaleDateString('ar-SA')}</div>
                    <div><span className="font-semibold">الإجمالي:</span> {selectedOrderForInvoice.total.toFixed(2)} ريال</div>
                  </div>

                  {/* Order Items */}
                  <h5 className="text-md font-semibold text-gray-800 mb-3">المنتجات</h5>
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {selectedOrderForInvoice.items.map((item) => (
                      <div key={item.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                          {item.image ? (
                            <img 
                              src={item.image} 
                              alt={item.name}
                              className="w-full h-full object-cover rounded-lg"
                            />
                          ) : (
                            <span className="text-gray-400 text-xl">📦</span>
                          )}
                        </div>
                        <div className="flex-1">
                          <h6 className="font-semibold text-gray-800 text-sm">{item.name}</h6>
                          <p className="text-gray-600 text-sm">الكمية: {item.quantity} × {item.price.toFixed(2)} ريال</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-gray-800">{(item.price * item.quantity).toFixed(2)} ريال</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Invoice Creation Form */}
                <div>
                  <h4 className="text-lg font-semibold text-gray-800 mb-4">بيانات الفاتورة</h4>
                  
                  <div className="space-y-4">
                    {/* Paid Amount */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">المبلغ المدفوع</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        max={selectedOrderForInvoice.total}
                        value={invoiceData.paidAmount}
                        onChange={(e) => setInvoiceData({...invoiceData, paidAmount: parseFloat(e.target.value) || 0})}
                        className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 text-gray-900"
                        placeholder="0.00"
                      />
                      <div className="mt-2 flex gap-2">
                        <button
                          onClick={() => setInvoiceData({...invoiceData, paidAmount: selectedOrderForInvoice.total})}
                          className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm transition-colors"
                        >
                          كامل المبلغ
                        </button>
                        <button
                          onClick={() => setInvoiceData({...invoiceData, paidAmount: selectedOrderForInvoice.total / 2})}
                          className="px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white rounded text-sm transition-colors"
                        >
                          نصف المبلغ
                        </button>
                      </div>
                    </div>

                    {/* Branch Selection */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">الفرع</label>
                      <select
                        value={invoiceData.selectedBranch}
                        onChange={(e) => setInvoiceData({...invoiceData, selectedBranch: e.target.value})}
                        className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 text-gray-900"
                      >
                        <option value="">اختر الفرع</option>
                        {branches.map((branch) => (
                          <option key={branch.id} value={branch.id}>
                            {branch.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Record Selection */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">السجل</label>
                      <select
                        value={invoiceData.selectedRecord}
                        onChange={(e) => setInvoiceData({...invoiceData, selectedRecord: e.target.value})}
                        className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 text-gray-900"
                      >
                        <option value="">اختر السجل</option>
                        {records.map((record) => (
                          <option key={record.id} value={record.id}>
                            {record.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Notes */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">ملاحظات (اختياري)</label>
                      <textarea
                        value={invoiceData.notes}
                        onChange={(e) => setInvoiceData({...invoiceData, notes: e.target.value})}
                        rows={3}
                        className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 text-gray-900 resize-none"
                        placeholder="أدخل أي ملاحظات إضافية..."
                      />
                    </div>

                    {/* Remaining Balance */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-gray-700">إجمالي المبلغ:</span>
                        <span className="font-bold text-gray-800">{selectedOrderForInvoice.total.toFixed(2)} ريال</span>
                      </div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-gray-700">المبلغ المدفوع:</span>
                        <span className="font-bold text-green-600">{invoiceData.paidAmount.toFixed(2)} ريال</span>
                      </div>
                      <div className="flex justify-between items-center border-t pt-2">
                        <span className="text-gray-700">المتبقي:</span>
                        <span className={`font-bold ${(selectedOrderForInvoice.total - invoiceData.paidAmount) > 0 ? 'text-red-600' : 'text-green-600'}`}>
                          {(selectedOrderForInvoice.total - invoiceData.paidAmount).toFixed(2)} ريال
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-gray-200 bg-gray-50">
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setShowCreateInvoiceModal(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  إلغاء
                </button>
                <button
                  onClick={createInvoice}
                  disabled={creatingInvoice || !invoiceData.selectedBranch || !invoiceData.selectedRecord}
                  className={`px-6 py-2 rounded-lg font-semibold transition-colors ${
                    creatingInvoice || !invoiceData.selectedBranch || !invoiceData.selectedRecord
                      ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                      : 'bg-red-600 hover:bg-red-700 text-white'
                  }`}
                >
                  {creatingInvoice ? 'جاري إنشاء الفاتورة...' : 'إنشاء الفاتورة'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}