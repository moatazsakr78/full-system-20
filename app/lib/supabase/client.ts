import { createClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true, // Enable session persistence for authentication
    detectSessionInUrl: true,
    flowType: 'pkce' // Use PKCE flow for better security
  },
  realtime: {
    params: {
      eventsPerSecond: 10 // Limit events for egress optimization
    }
  }
})

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