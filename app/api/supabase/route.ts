import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
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
      console.log('Updating audit status:', { productId, auditStatus })
      
      // Update audit status directly in products table
      const { data, error } = await supabase
        .from('products')
        .update({ 
          audit_status: auditStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', productId)
        .select()
        
      if (error) {
        console.error('Supabase audit status update error:', error)
        throw error
      }
      
      console.log('Successfully updated audit status:', data)
      
      return NextResponse.json({ 
        success: true, 
        data,
        message: 'Audit status updated successfully' 
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