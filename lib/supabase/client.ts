import { createClient as createSupabaseClient, SupabaseClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

// Singleton instance for main client
let supabaseInstance: SupabaseClient<Database> | null = null

// Helper to set tenant context before each query
async function ensureTenantContext(client: SupabaseClient) {
  if (typeof window === 'undefined') return;

  const tenantId = localStorage.getItem('current_tenant_id');

  if (tenantId) {
    try {
      // Set tenant context for this request
      await (client as any).rpc('set_current_tenant', {
        tenant_uuid: tenantId
      });
    } catch (error) {
      // Silently fail - tenant context might already be set
      console.debug('Tenant context already set or error:', error);
    }
  }
}

// Create a Proxy wrapper for Supabase client to inject tenant context
function createTenantAwareClient(client: SupabaseClient<Database>): SupabaseClient<Database> {
  return new Proxy(client, {
    get(target, prop) {
      const value = (target as any)[prop];

      // Intercept 'from' method to inject tenant context
      if (prop === 'from') {
        return (...args: any[]) => {
          const table = value.apply(target, args);

          // Wrap all query methods
          return new Proxy(table, {
            get(tableTarget, tableProp) {
              const tableValue = (tableTarget as any)[tableProp];

              // Intercept query execution methods
              if (typeof tableValue === 'function' &&
                  ['select', 'insert', 'update', 'delete', 'upsert'].includes(tableProp as string)) {
                return async (...queryArgs: any[]) => {
                  // Set tenant context before query
                  await ensureTenantContext(client);

                  // Execute the actual query
                  return tableValue.apply(tableTarget, queryArgs);
                };
              }

              return tableValue;
            }
          });
        };
      }

      return value;
    }
  });
}

// Get singleton client instance
export const getSupabase = (): SupabaseClient<Database> => {
  if (!supabaseInstance) {
    const baseClient = createSupabaseClient<Database>(supabaseUrl, supabaseAnonKey, {
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
      }
    });

    // Wrap with tenant-aware proxy
    supabaseInstance = createTenantAwareClient(baseClient);
  }
  return supabaseInstance
}

// Export createClient for compatibility with tenant API
export const createClient = () => {
  const baseClient = createSupabaseClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      flowType: 'pkce'
    }
  });

  return createTenantAwareClient(baseClient);
}

// Legacy export for backwards compatibility
export const supabase = getSupabase()

// Connection health check
export const checkConnection = async () => {
  try {
    await ensureTenantContext(supabase);

    const { data, error } = await supabase
      .from('products')
      .select('id')
      .limit(1)

    return { connected: !error, error }
  } catch (error) {
    return { connected: false, error }
  }
}
