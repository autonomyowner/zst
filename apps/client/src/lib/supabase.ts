import { createClient, SupabaseClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

export const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
export const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
export const supabaseConfigured = Boolean(supabaseUrl && supabaseAnon)

// Generate cache-busting timestamp for queries
export function getCacheBustingTimestamp(): string {
  return `_t=${Date.now()}`
}

// Helper to ensure fresh queries by adding cache-busting headers
export function getFreshHeaders(): Record<string, string> {
  return {
    'Cache-Control': 'no-cache, no-store, must-revalidate, proxy-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
    'X-Request-Time': Date.now().toString(),
  }
}

export const supabase: SupabaseClient<Database> | null = supabaseConfigured
  ? createClient<Database>(supabaseUrl as string, supabaseAnon as string, {
      auth: { 
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storage: typeof window !== 'undefined' ? window.localStorage : undefined,
        storageKey: 'zst-auth-token',
        // Force refresh session on initialization
        flowType: 'pkce',
      },
      global: {
        // Add cache busting headers to ensure fresh requests
        // Supabase will merge these with its required headers (apikey, etc.)
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
          'X-Request-Time': Date.now().toString(),
        },
      },
      db: {
        schema: 'public',
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
    },
    global: {
      // Add cache busting headers - Supabase will merge with required headers
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    },
  })
}

