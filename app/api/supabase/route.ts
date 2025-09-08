import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Use service role for admin operations or anon key for regular operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

export async function POST(request: NextRequest) {
  try {
    const { action, productId, branchId, quantity, auditStatus } = await request.json()
    
    console.log('API request:', { action, productId, branchId, quantity, auditStatus })
    
    if (action === 'update_inventory') {
      // Use stored procedure with SECURITY DEFINER to bypass RLS
      const { data, error } = await supabase
        .rpc('update_inventory_quantity', {
          input_product_id: productId,
          input_branch_id: branchId,
          input_quantity: parseInt(quantity)
        })
        
      if (error) {
        console.error('Supabase error:', error)
        throw error
      }
      
      console.log('Successfully updated inventory:', data)
      
      return NextResponse.json({ 
        success: true, 
        data,
        message: 'Inventory updated successfully' 
      })
    }
    
    if (action === 'update_audit_status') {
      console.log('Updating audit status:', { productId, branchId, auditStatus })
      
      // Validate input parameters
      if (!productId || !branchId || !auditStatus) {
        console.error('Missing required parameters:', { productId, branchId, auditStatus })
        return NextResponse.json(
          { 
            success: false, 
            error: 'Missing required parameters: productId, branchId, and auditStatus are required' 
          },
          { status: 400 }
        )
      }
      
      // Validate audit status value
      const validStatuses = ['غير مجرود', 'استعد', 'تام الجرد']
      if (!validStatuses.includes(auditStatus)) {
        console.error('Invalid audit status:', auditStatus)
        return NextResponse.json(
          { 
            success: false, 
            error: `Invalid audit status. Must be one of: ${validStatuses.join(', ')}` 
          },
          { status: 400 }
        )
      }
      
      // Check if inventory record exists first
      const { data: existingRecord, error: checkError } = await supabase
        .from('inventory')
        .select('id, audit_status')
        .eq('product_id', productId)
        .eq('branch_id', branchId)
        .single()
        
      if (checkError) {
        console.error('Error checking existing inventory record:', checkError)
        return NextResponse.json(
          { 
            success: false, 
            error: 'Inventory record not found for this product-branch combination',
            details: checkError 
          },
          { status: 404 }
        )
      }
      
      console.log('Found existing inventory record:', existingRecord)
      
      // Update audit status in inventory table for specific product-branch combination
      const { data, error } = await supabase
        .from('inventory')
        .update({ 
          audit_status: auditStatus,
          last_updated: new Date().toISOString()
        })
        .eq('product_id', productId)
        .eq('branch_id', branchId)
        .select()
        
      if (error) {
        console.error('Supabase audit status update error:', error)
        return NextResponse.json(
          { 
            success: false, 
            error: 'Failed to update audit status in database',
            details: error 
          },
          { status: 500 }
        )
      }
      
      if (!data || data.length === 0) {
        console.error('No records were updated')
        return NextResponse.json(
          { 
            success: false, 
            error: 'No inventory records were updated. Please check the product and branch IDs.' 
          },
          { status: 404 }
        )
      }
      
      console.log('Successfully updated audit status:', data)
      
      return NextResponse.json({ 
        success: true, 
        data: data[0],
        message: `Audit status successfully updated to "${auditStatus}"`,
        previousStatus: existingRecord.audit_status
      })
    }
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Invalid action' 
      },
      { status: 400 }
    )
    
  } catch (error: any) {
    console.error('API Error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Internal server error',
        details: error
      },
      { status: 500 }
    )
  }
}