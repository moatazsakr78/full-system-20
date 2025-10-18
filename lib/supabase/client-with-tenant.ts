import { createClient } from '@/lib/supabase/client';
import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Get Supabase client with tenant context automatically set
 * This ensures all queries include tenant_id filtering
 */
export async function getSupabaseWithTenant(): Promise<SupabaseClient> {
  const supabase = createClient();

  // Get tenant_id from localStorage
  const tenantId = typeof window !== 'undefined'
    ? localStorage.getItem('current_tenant_id')
    : null;

  if (tenantId) {
    try {
      // Set tenant context for this session
      await (supabase as any).rpc('set_current_tenant', {
        tenant_uuid: tenantId
      });
    } catch (error) {
      console.error('Failed to set tenant context:', error);
    }
  }

  return supabase;
}

/**
 * Execute a Supabase query with tenant context
 * Usage: await withTenantContext(supabase => supabase.from('products').select())
 */
export async function withTenantContext<T>(
  queryFn: (supabase: SupabaseClient) => Promise<T>
): Promise<T> {
  const supabase = await getSupabaseWithTenant();
  return queryFn(supabase);
}
