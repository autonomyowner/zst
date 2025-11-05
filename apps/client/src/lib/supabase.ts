import { createClient, SupabaseClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

export const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
export const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
export const supabaseConfigured = Boolean(supabaseUrl && supabaseAnon)

export const supabase: SupabaseClient<Database> | null = supabaseConfigured
  ? createClient<Database>(supabaseUrl as string, supabaseAnon as string, {
      auth: { 
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storage: typeof window !== 'undefined' ? window.localStorage : undefined,
        storageKey: 'zst-auth-token',
      },
      global: {
        // Add cache busting headers to ensure fresh requests
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
      },
    })
  : null

// Server-side Supabase client (for use in API routes)
export function createServerClient() {
  if (!supabaseUrl || !supabaseAnon) {
    throw new Error('Missing Supabase environment variables')
  }
  return createClient<Database>(supabaseUrl, supabaseAnon, {
    auth: {
      persistSession: false,
    }
  })
}

