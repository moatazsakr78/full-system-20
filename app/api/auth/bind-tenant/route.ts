import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Get tenant ID from headers (set by middleware)
    const tenantId = request.headers.get('x-tenant-id');

    if (!tenantId) {
      console.error('No tenant ID found in headers');
      return NextResponse.json(
        { error: 'Tenant not found' },
        { status: 400 }
      );
    }

    console.log(`🔗 Binding user ${userId} to tenant ${tenantId}`);

    const supabase = createClient();

    // Call the bind_user_to_tenant function
    const { data, error } = await (supabase as any).rpc('bind_user_to_tenant', {
      p_user_id: userId,
      p_tenant_id: tenantId,
      p_role: 'customer'
    });

    if (error) {
      console.error('❌ Error binding user to tenant:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    console.log('✅ User successfully bound to tenant');

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('❌ Unexpected error in bind-tenant:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
