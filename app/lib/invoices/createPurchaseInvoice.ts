'use client'

import { supabase } from '../supabase/client'
import { CartItem } from './createSalesInvoice'

// Helper function to handle unspecified variant consolidation
async function handleUnspecifiedVariant({
  productId,
  productName,
  branchId,
  quantity,
  isReturn
}: {
  productId: string
  productName: string
  branchId: string
  quantity: number
  isReturn: boolean
}) {
  try {
    console.log('🔍 handleUnspecifiedVariant called with:', {
      productId,
      productName,
      branchId,
      quantity,
      isReturn
    })

    // Step 1: Find ALL existing "غير محدد" variants for this product and branch/location
    const { data: existingVariants, error: searchError } = await supabase
      .from('product_variants')
      .select('id, quantity, branch_id')
      .eq('product_id', productId)
      .eq('branch_id', branchId)
      .eq('name', 'غير محدد')
      .eq('variant_type', 'color')

    if (searchError) {
      console.error(`Error searching variants for product ${productName}:`, searchError.message)
      return
    }

    console.log(`Found ${existingVariants?.length || 0} existing غير محدد variants for ${productName}`, existingVariants)

    if (!existingVariants || existingVariants.length === 0) {
      // No existing variants - create new one (only if not a return)
      if (!isReturn) {
        const newVariant = {
          product_id: productId,
          name: 'غير محدد',
          variant_type: 'color',
          quantity: quantity,
          branch_id: branchId,
          value: JSON.stringify({ 
            color: '#6B7280', 
            description: 'كمية غير محددة اللون - وضع الشراء' 
          })
        }

        const { error: insertError } = await supabase
          .from('product_variants')
          .insert(newVariant)

        if (insertError) {
          console.error(`Failed to create new غير محدد variant for ${productName}:`, insertError.message)
        } else {
          console.log(`✅ Created new غير محدد variant for ${productName} with quantity: ${quantity}`)
        }
      }
    } else {
      // ALWAYS consolidate all existing variants into one, regardless of how many there are
      const totalExistingQuantity = existingVariants.reduce((sum, variant) => sum + (variant.quantity || 0), 0)
      const quantityChange = isReturn ? -quantity : quantity
      const finalQuantity = Math.max(0, totalExistingQuantity + quantityChange)

      console.log(`Consolidating ALL variants for ${productName}:`, {
        existingVariantsCount: existingVariants.length,
        existingVariantIds: existingVariants.map(v => v.id),
        totalExistingQuantity,
        quantityChange,
        finalQuantity
      })

      // Step 1: Delete ALL existing variants first
      const allVariantIds = existingVariants.map(v => v.id)
      const { error: deleteError } = await supabase
        .from('product_variants')
        .delete()
        .in('id', allVariantIds)

      if (deleteError) {
        console.error(`Failed to delete all existing variants for ${productName}:`, deleteError.message)
        return
      } else {
        console.log(`🗑️ Deleted ALL ${existingVariants.length} existing variants for ${productName}`)
      }

      // Step 2: Create a single consolidated variant with the total quantity
      if (finalQuantity > 0) {
        const consolidatedVariant = {
          product_id: productId,
          name: 'غير محدد',
          variant_type: 'color',
          quantity: finalQuantity,
          branch_id: branchId,
          value: JSON.stringify({ 
            color: '#6B7280', 
            description: 'كمية غير محددة اللون - تم الدمج' 
          })
        }

        const { error: insertError } = await supabase
          .from('product_variants')
          .insert(consolidatedVariant)

        if (insertError) {
          console.error(`Failed to create consolidated variant for ${productName}:`, insertError.message)
        } else {
          console.log(`✅ Created consolidated غير محدد variant for ${productName} with quantity: ${finalQuantity}`)
        }
      }
    }
  } catch (error: any) {
    console.error(`Unexpected error handling variant for ${productName}:`, error.message)
  }
}

export interface PurchaseInvoiceSelections {
  supplier: any
  warehouse: any
  record: any
}

export interface CreatePurchaseInvoiceParams {
  cartItems: CartItem[]
  selections: PurchaseInvoiceSelections
  paymentMethod?: string
  notes?: string
  isReturn?: boolean
}

export async function createPurchaseInvoice({
  cartItems,
  selections,
  paymentMethod = 'cash',
  notes,
  isReturn = false
}: CreatePurchaseInvoiceParams) {
  if (!selections.supplier || !selections.warehouse || !selections.record) {
    throw new Error('يجب تحديد المورد والمخزن والسجل قبل إنشاء فاتورة الشراء')
  }

  if (!cartItems || cartItems.length === 0) {
    throw new Error('لا يمكن إنشاء فاتورة شراء بدون منتجات')
  }

  try {
    // Calculate totals (negative for returns)
    const baseTotal = cartItems.reduce((sum, item) => sum + item.total, 0)
    const totalAmount = isReturn ? -baseTotal : baseTotal
    const taxAmount = 0 // You can add tax calculation here if needed
    const discountAmount = 0 // You can add discount calculation here if needed
    const netAmount = totalAmount - discountAmount + taxAmount

    // Generate invoice number
    const invoiceNumber = `PINV-${Date.now()}-${Math.floor(Math.random() * 1000)}`

    // Get current time
    const now = new Date()
    const timeString = now.toTimeString().split(' ')[0] // HH:MM:SS format

    // Determine location IDs based on warehouse selection
    const branchId = selections.warehouse.locationType === 'branch' ? selections.warehouse.id : null
    const warehouseId = selections.warehouse.locationType === 'warehouse' ? selections.warehouse.id : null
    
    console.log('🔍 Purchase Invoice Debug - Location Selection:', {
      selectedWarehouse: selections.warehouse,
      locationType: selections.warehouse.locationType,
      branchId,
      warehouseId,
      locationIdForVariants: branchId || warehouseId
    })

    // Start transaction - Create purchase invoice
    const { data: purchaseData, error: purchaseError } = await supabase
      .from('purchase_invoices')
      .insert({
        invoice_number: invoiceNumber,
        supplier_id: selections.supplier.id,
        invoice_date: now.toISOString().split('T')[0], // Current date in YYYY-MM-DD format
        total_amount: totalAmount,
        tax_amount: taxAmount,
        discount_amount: discountAmount,
        net_amount: netAmount,
        payment_status: 'pending', // Can be 'pending', 'paid', 'partial'
        notes: notes || null,
        branch_id: branchId,
        warehouse_id: warehouseId,
        record_id: selections.record.id,
        time: timeString,
        invoice_type: (isReturn ? 'Purchase Return' : 'Purchase Invoice') as any,
        is_active: true
      })
      .select()
      .single()

    if (purchaseError) {
      throw new Error(`خطأ في إنشاء فاتورة الشراء: ${purchaseError.message}`)
    }

    // Create purchase invoice items
    const purchaseItems = cartItems.map(item => ({
      purchase_invoice_id: purchaseData.id,
      product_id: item.product.id,
      quantity: item.quantity,
      unit_purchase_price: item.price,
      total_price: item.total,
      discount_amount: 0, // You can add item-level discount if needed
      tax_amount: 0, // You can add item-level tax if needed
      notes: item.selectedColors ? `الألوان: ${Object.entries(item.selectedColors).map(([color, qty]) => `${color} (${qty})`).join(', ')}` : 'غير محدد - وضع الشراء'
    }))

    const { error: purchaseItemsError } = await supabase
      .from('purchase_invoice_items')
      .insert(purchaseItems)

    if (purchaseItemsError) {
      // If purchase items creation fails, we should clean up the purchase invoice record
      await supabase.from('purchase_invoices').delete().eq('id', purchaseData.id)
      throw new Error(`خطأ في إضافة عناصر فاتورة الشراء: ${purchaseItemsError.message}`)
    }

    // Also create invoice entry for main record (السجل الرئيسي) if selected record is not the main record
    const MAIN_RECORD_ID = '89d38477-6a3a-4c02-95f2-ddafa5880706' // The main record ID from the database
    
    if (selections.record.id !== MAIN_RECORD_ID) {
      const { error: mainRecordError } = await supabase
        .from('purchase_invoices')
        .insert({
          invoice_number: `${invoiceNumber}-MAIN`,
          supplier_id: selections.supplier.id,
          invoice_date: now.toISOString().split('T')[0],
          total_amount: totalAmount,
          tax_amount: taxAmount,
          discount_amount: discountAmount,
          net_amount: netAmount,
          payment_status: 'pending',
          notes: `نسخة من فاتورة الشراء الأصلية: ${invoiceNumber}${notes ? ` - ${notes}` : ''}`,
          branch_id: branchId,
          warehouse_id: warehouseId,
          record_id: MAIN_RECORD_ID, // Always add to main record
          time: timeString,
          invoice_type: (isReturn ? 'Purchase Return' : 'Purchase Invoice') as any,
          is_active: true
        })

      if (mainRecordError) {
        console.warn('Failed to create main record entry:', mainRecordError.message)
        // Don't throw error here as the main invoice was created successfully
      } else {
        // Get the main record purchase invoice ID for creating purchase items
        const { data: mainPurchaseData, error: mainPurchaseSelectError } = await supabase
          .from('purchase_invoices')
          .select('id')
          .eq('invoice_number', `${invoiceNumber}-MAIN`)
          .single()

        if (!mainPurchaseSelectError && mainPurchaseData) {
          // Create purchase items for main record
          const mainPurchaseItems = purchaseItems.map(item => ({
            ...item,
            purchase_invoice_id: mainPurchaseData.id
          }))

          const { error: mainPurchaseItemsError } = await supabase
            .from('purchase_invoice_items')
            .insert(mainPurchaseItems)

          if (mainPurchaseItemsError) {
            console.warn('Failed to create main record purchase items:', mainPurchaseItemsError.message)
          }
        }
      }
    }

    // Update inventory quantities (increase for purchases)
    const locationId = branchId || warehouseId
    
    for (const item of cartItems) {
      // Check if inventory record exists for this product and location
      const { data: existingInventory, error: getInventoryError } = await supabase
        .from('inventory')
        .select('quantity')
        .eq('product_id', item.product.id)
        .eq(branchId ? 'branch_id' : 'warehouse_id', locationId)
        .single()

      if (getInventoryError && getInventoryError.code !== 'PGRST116') {
        console.warn(`Failed to get current inventory for product ${item.product.id}:`, getInventoryError.message)
        continue
      }

      if (existingInventory) {
        // Update existing inventory (for returns, subtract; for purchases, add)
        const quantityChange = isReturn ? -item.quantity : item.quantity
        const newQuantity = Math.max(0, (existingInventory.quantity || 0) + quantityChange)

        const updateData: any = { quantity: newQuantity }
        if (branchId) {
          updateData.branch_id = branchId
        } else {
          updateData.warehouse_id = warehouseId
        }

        const { error: inventoryError } = await supabase
          .from('inventory')
          .update(updateData)
          .eq('product_id', item.product.id)
          .eq(branchId ? 'branch_id' : 'warehouse_id', locationId)

        if (inventoryError) {
          console.warn(`Failed to update inventory for product ${item.product.id}:`, inventoryError.message)
        }
      } else {
        // Create new inventory record (only if not a return or return quantity is positive)
        const effectiveQuantity = isReturn ? 0 : item.quantity // Don't create inventory for returns
        if (effectiveQuantity > 0) {
          const insertData: any = {
            product_id: item.product.id,
            quantity: effectiveQuantity,
            min_stock: 0 // Default minimum stock
          }
        
          if (branchId) {
            insertData.branch_id = branchId
          } else {
            insertData.warehouse_id = warehouseId
          }

          const { error: inventoryError } = await supabase
            .from('inventory')
            .insert(insertData)

          if (inventoryError) {
            console.warn(`Failed to create inventory for product ${item.product.id}:`, inventoryError.message)
          }
        }
      }

      // Handle "غير محدد" (unspecified) variant consolidation for purchase invoices
      console.log('🔍 About to call handleUnspecifiedVariant for:', {
        productName: item.product.name,
        productId: item.product.id,
        locationId: locationId,
        quantity: item.quantity,
        itemDetails: item
      })
      
      await handleUnspecifiedVariant({
        productId: item.product.id,
        productName: item.product.name,
        branchId: locationId,
        quantity: item.quantity,
        isReturn
      })
    }

    return {
      success: true,
      invoiceId: purchaseData.id,
      invoiceNumber: invoiceNumber,
      totalAmount: totalAmount,
      message: 'تم إنشاء فاتورة الشراء بنجاح'
    }

  } catch (error: any) {
    throw new Error(error.message || 'حدث خطأ أثناء إنشاء فاتورة الشراء')
  }
}