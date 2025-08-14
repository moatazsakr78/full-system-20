'use client'

import { supabase } from '../supabase/client'
import { CartItem } from './createSalesInvoice'
import { updateProductCostAfterPurchase } from '../utils/purchase-cost-management'

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

      // In purchase mode, we store quantities as "unspecified" variant
      // Find ANY existing "غير محدد" variant for this product and location (regardless of duplicate entries)
      const { data: existingVariants, error: variantGetError } = await supabase
        .from('product_variants')
        .select('id, quantity')
        .eq('product_id', item.product.id)
        .eq(branchId ? 'branch_id' : 'warehouse_id', locationId)
        .eq('name', 'غير محدد')
        .eq('variant_type', 'color')

      if (variantGetError) {
        console.warn(`Failed to get unspecified variants for product ${item.product.id}:`, variantGetError.message)
        continue
      }

      if (existingVariants && existingVariants.length > 0) {
        // If multiple "غير محدد" variants exist, merge them into the first one and delete the rest
        const primaryVariant = existingVariants[0]
        const totalQuantity = existingVariants.reduce((sum, variant) => sum + (variant.quantity || 0), 0) + item.quantity

        // Update the primary variant with the combined quantity
        const variantUpdateData: any = { quantity: totalQuantity }
        if (branchId) {
          variantUpdateData.branch_id = branchId
        } else {
          variantUpdateData.warehouse_id = warehouseId
        }

        const { error: variantUpdateError } = await supabase
          .from('product_variants')
          .update(variantUpdateData)
          .eq('id', primaryVariant.id)

        if (variantUpdateError) {
          console.warn(`Failed to update primary unspecified variant for product ${item.product.id}:`, variantUpdateError.message)
        } else {
          // Delete duplicate variants if they exist
          if (existingVariants.length > 1) {
            const duplicateIds = existingVariants.slice(1).map(v => v.id)
            const { error: deleteError } = await supabase
              .from('product_variants')
              .delete()
              .in('id', duplicateIds)

            if (deleteError) {
              console.warn(`Failed to delete duplicate unspecified variants for product ${item.product.id}:`, deleteError.message)
            }
          }
        }
      } else {
        // Create new unspecified variant
        const variantInsertData: any = {
          product_id: item.product.id,
          name: 'غير محدد',
          variant_type: 'color',
          quantity: item.quantity,
          value: JSON.stringify({ color: '#6B7280', description: 'كمية غير محددة اللون - وضع الشراء' })
        }
        
        if (branchId) {
          variantInsertData.branch_id = branchId
        } else {
          variantInsertData.warehouse_id = warehouseId
        }

        const { error: variantInsertError } = await supabase
          .from('product_variants')
          .insert(variantInsertData)

        if (variantInsertError) {
          console.warn(`Failed to create unspecified variant for product ${item.product.id}:`, variantInsertError.message)
        }
      }
    }

    // Update product costs using weighted average cost method
    console.log('🔄 Updating product costs after purchase...')
    for (const item of cartItems) {
      try {
        const costUpdate = await updateProductCostAfterPurchase(
          item.product.id,
          item.quantity,
          item.price
        )
        
        if (costUpdate) {
          console.log(`💰 Updated cost for product ${item.product.id}:`, {
            oldCost: 'calculated from previous data',
            newCost: costUpdate.newAverageCost,
            quantity: item.quantity,
            unitPrice: item.price
          })
        } else {
          console.warn(`⚠️  Failed to update cost for product ${item.product.id}`)
        }
      } catch (costError: any) {
        console.error(`❌ Error updating cost for product ${item.product.id}:`, costError.message)
        // Don't fail the entire invoice creation if cost update fails
      }
    }

    return {
      success: true,
      invoiceId: purchaseData.id,
      invoiceNumber: invoiceNumber,
      totalAmount: totalAmount,
      message: 'تم إنشاء فاتورة الشراء وتحديث تكاليف المنتجات بنجاح'
    }

  } catch (error: any) {
    throw new Error(error.message || 'حدث خطأ أثناء إنشاء فاتورة الشراء')
  }
}