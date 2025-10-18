import { createClient, SupabaseClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

// Singleton instance for main client
let supabaseInstance: SupabaseClient<Database> | null = null

// Track if tenant context was set (simple in-memory cache)
let lastTenantContextSet: string | null = null;
let tenantContextSetAt: number = 0;
const CONTEXT_CACHE_DURATION = 5000; // 5 seconds

// Custom fetch to inject tenant context
const customFetch: typeof fetch = async (input, init) => {
  // Get tenant ID from localStorage
  const tenantId = typeof window !== 'undefined'
    ? localStorage.getItem('current_tenant_id')
    : null;

  const now = Date.now();
  const needsContextRefresh = !lastTenantContextSet ||
                               lastTenantContextSet !== tenantId ||
                               (now - tenantContextSetAt) > CONTEXT_CACHE_DURATION;

  if (tenantId && needsContextRefresh && init?.method !== 'OPTIONS') {
    // Only set context if it's not an RPC call to set_current_tenant
    if (typeof input === 'string' && !input.includes('/rpc/set_current_tenant')) {
      try {
        // Set tenant context via separate RPC call
        await fetch(`${supabaseUrl}/rest/v1/rpc/set_current_tenant`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': supabaseAnonKey,
            'Authorization': `Bearer ${supabaseAnonKey}`,
            ...(init?.headers || {})
          },
          body: JSON.stringify({ tenant_uuid: tenantId })
        });

        // Update cache
        lastTenantContextSet = tenantId;
        tenantContextSetAt = now;
      } catch (error) {
        console.debug('Could not set tenant context:', error);
      }
    }
  }

  // Execute the original fetch
  return fetch(input, init);
};

// Get singleton client instance
export const getSupabase = (): SupabaseClient<Database> => {
  if (!supabaseInstance) {
    supabaseInstance = createClient<Database>(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        flowType: 'pkce'
      },
      realtime: {
        params: {
          eventsPerSecond: 10
        }
      },
      global: {
        fetch: customFetch
      }
    })
  }
  return supabaseInstance
}

// Legacy export for backwards compatibility
export const supabase = getSupabase()

// Connection health check
export const checkConnection = async () => {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('id')
      .limit(1)

    return { connected: !error, error }
  } catch (error) {
    return { connected: false, error }
  }
}
