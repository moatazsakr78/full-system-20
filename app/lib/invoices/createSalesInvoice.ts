'use client'

import { supabase } from '../supabase/client'

export interface CartItem {
  id: string
  product: any
  quantity: number
  selectedColors?: { [key: string]: number } | null
  price: number
  total: number
}

export interface InvoiceSelections {
  customer: any
  branch: any
  record: any
}

export interface CreateSalesInvoiceParams {
  cartItems: CartItem[]
  selections: InvoiceSelections
  paymentMethod?: string
  notes?: string
  isReturn?: boolean
}

export async function createSalesInvoice({
  cartItems,
  selections,
  paymentMethod = 'cash',
  notes,
  isReturn = false
}: CreateSalesInvoiceParams) {
  if (!selections.branch || !selections.record) {
    throw new Error('يجب تحديد الفرع والسجل قبل إنشاء الفاتورة')
  }

  if (!cartItems || cartItems.length === 0) {
    throw new Error('لا يمكن إنشاء فاتورة بدون منتجات')
  }

  // Use default customer if none selected
  const DEFAULT_CUSTOMER_ID = '00000000-0000-0000-0000-000000000001' // The default customer from database
  const customerId = (selections.customer && selections.customer.id) ? selections.customer.id : DEFAULT_CUSTOMER_ID
  
  console.log('Customer selection debug:', {
    hasCustomer: !!selections.customer,
    customerId: customerId,
    rawCustomer: selections.customer
  })

  // Validate that customerId is a valid UUID and not null/undefined
  if (!customerId || typeof customerId !== 'string' || customerId.trim() === '') {
    throw new Error(`خطأ في معرف العميل: ${customerId}`)
  }

  try {
    // Calculate totals (negative for returns)
    const baseTotal = cartItems.reduce((sum, item) => sum + item.total, 0)
    const totalAmount = isReturn ? -baseTotal : baseTotal
    const taxAmount = 0 // You can add tax calculation here if needed
    const discountAmount = 0 // You can add discount calculation here if needed
    const profit = cartItems.reduce((sum, item) => {
      const costPrice = item.product.cost_price || 0
      const itemProfit = (item.price - costPrice) * item.quantity
      return sum + (isReturn ? -itemProfit : itemProfit)
    }, 0)

    // Generate invoice number
    const invoiceNumber = `INV-${Date.now()}-${Math.floor(Math.random() * 1000)}`

    // Get current time
    const now = new Date()
    const timeString = now.toTimeString().split(' ')[0] // HH:MM:SS format

    // Start transaction
    const { data: salesData, error: salesError } = await supabase
      .from('sales')
      .insert({
        invoice_number: invoiceNumber,
        total_amount: totalAmount,
        tax_amount: taxAmount,
        discount_amount: discountAmount,
        profit: profit,
        payment_method: paymentMethod,
        branch_id: selections.branch.id,
        customer_id: customerId,
        record_id: selections.record.id,
        notes: notes || null,
        time: timeString,
        invoice_type: (isReturn ? 'Sale Return' : 'Sale Invoice') as any
      })
      .select()
      .single()

    if (salesError) {
      throw new Error(`خطأ في إنشاء الفاتورة: ${salesError.message}`)
    }

    // Create sale items (negative quantities for returns)
    const saleItems = cartItems.map(item => ({
      sale_id: salesData.id,
      product_id: item.product.id,
      quantity: isReturn ? -item.quantity : item.quantity,
      unit_price: item.price,
      cost_price: item.product.cost_price || 0,
      discount: 0, // You can add item-level discount if needed
      notes: item.selectedColors ? `الألوان: ${Object.entries(item.selectedColors).map(([color, qty]) => `${color} (${qty})`).join(', ')}` : null
    }))

    const { error: saleItemsError } = await supabase
      .from('sale_items')
      .insert(saleItems)

    if (saleItemsError) {
      // If sale items creation fails, we should clean up the sale record
      await supabase.from('sales').delete().eq('id', salesData.id)
      throw new Error(`خطأ في إضافة عناصر الفاتورة: ${saleItemsError.message}`)
    }

    // Also create invoice entry for main record (السجل الرئيسي) if selected record is not the main record
    const MAIN_RECORD_ID = '89d38477-6a3a-4c02-95f2-ddafa5880706' // The main record ID from the database
    
    if (selections.record.id !== MAIN_RECORD_ID) {
      const { error: mainRecordError } = await supabase
        .from('sales')
        .insert({
          invoice_number: `${invoiceNumber}-MAIN`,
          total_amount: totalAmount,
          tax_amount: taxAmount,
          discount_amount: discountAmount,
          profit: profit,
          payment_method: paymentMethod,
          branch_id: selections.branch.id,
          customer_id: customerId,
          record_id: MAIN_RECORD_ID, // Always add to main record
          notes: `نسخة من الفاتورة الأصلية: ${invoiceNumber}${notes ? ` - ${notes}` : ''}`,
          time: timeString,
          invoice_type: (isReturn ? 'Sale Return' : 'Sale Invoice') as any
        })

      if (mainRecordError) {
        console.warn('Failed to create main record entry:', mainRecordError.message)
        // Don't throw error here as the main invoice was created successfully
      } else {
        // Get the main record sale ID for creating sale items
        const { data: mainSaleData, error: mainSaleSelectError } = await supabase
          .from('sales')
          .select('id')
          .eq('invoice_number', `${invoiceNumber}-MAIN`)
          .single()

        if (!mainSaleSelectError && mainSaleData) {
          // Create sale items for main record
          const mainSaleItems = saleItems.map(item => ({
            ...item,
            sale_id: mainSaleData.id
          }))

          const { error: mainSaleItemsError } = await supabase
            .from('sale_items')
            .insert(mainSaleItems)

          if (mainSaleItemsError) {
            console.warn('Failed to create main record sale items:', mainSaleItemsError.message)
          }
        }
      }
    }

    // Update inventory quantities
    for (const item of cartItems) {
      // First get current quantity, then update
      const { data: currentInventory, error: getError } = await supabase
        .from('inventory')
        .select('quantity')
        .eq('product_id', item.product.id)
        .eq('branch_id', selections.branch.id)
        .single()

      if (getError) {
        console.warn(`Failed to get current inventory for product ${item.product.id}:`, getError.message)
        continue
      }

      // For returns, add quantity back; for sales, subtract
      const quantityChange = isReturn ? item.quantity : -item.quantity
      const newQuantity = Math.max(0, (currentInventory?.quantity || 0) + quantityChange)

      const { error: inventoryError } = await supabase
        .from('inventory')
        .update({
          quantity: newQuantity
        })
        .eq('product_id', item.product.id)
        .eq('branch_id', selections.branch.id)

      if (inventoryError) {
        console.warn(`Failed to update inventory for product ${item.product.id}:`, inventoryError.message)
        // Don't throw error here as the sale was created successfully
      }

      // Update product variants quantities if the item has color selections
      if (item.selectedColors && Object.keys(item.selectedColors).length > 0) {
        for (const [colorName, colorQuantity] of Object.entries(item.selectedColors as Record<string, number>)) {
          if (colorQuantity > 0) {
            // Get current variant quantity
            const { data: currentVariant, error: variantGetError } = await supabase
              .from('product_variants')
              .select('quantity')
              .eq('product_id', item.product.id)
              .eq('branch_id', selections.branch.id)
              .eq('name', colorName)
              .eq('variant_type', 'color')
              .single()

            if (variantGetError) {
              console.warn(`Failed to get current variant for product ${item.product.id}, color ${colorName}:`, variantGetError.message)
              continue
            }

            // For returns, add quantity back; for sales, subtract
            const variantQuantityChange = isReturn ? colorQuantity : -colorQuantity
            const newVariantQuantity = Math.max(0, (currentVariant?.quantity || 0) + variantQuantityChange)

            // Update variant quantity
            const { error: variantUpdateError } = await supabase
              .from('product_variants')
              .update({
                quantity: newVariantQuantity
              })
              .eq('product_id', item.product.id)
              .eq('branch_id', selections.branch.id)
              .eq('name', colorName)
              .eq('variant_type', 'color')

            if (variantUpdateError) {
              console.warn(`Failed to update variant quantity for product ${item.product.id}, color ${colorName}:`, variantUpdateError.message)
              // Don't throw error here as the sale was created successfully
            }
          }
        }
      }
    }

    return {
      success: true,
      invoiceId: salesData.id,
      invoiceNumber: invoiceNumber,
      totalAmount: totalAmount,
      message: 'تم إنشاء الفاتورة بنجاح'
    }

  } catch (error: any) {
    throw new Error(error.message || 'حدث خطأ أثناء إنشاء الفاتورة')
  }
}