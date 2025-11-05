"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase, supabaseConfigured } from "../../../lib/supabase"

export default function AuthCallbackPage() {
  const router = useRouter()
  const [status, setStatus] = useState<string>("Finishing sign-in…")

  useEffect(() => {
    let active = true
    const run = async () => {
      try {
        if (!supabaseConfigured || !supabase) {
          setStatus("Supabase is not configured.")
          return
        }
        // Force refresh session before exchanging code
        await supabase.auth.getSession()
        const { error } = await supabase.auth.exchangeCodeForSession(window.location.href)
        if (!active) return
        if (error) {
          setStatus(`Auth error: ${error.message}`)
          return
        }
        // Force a session refresh to ensure state is updated
        await supabase.auth.getSession()
        // Optional: support redirect query param
        const url = new URL(window.location.href)
        const redirect = url.searchParams.get("redirect") || "/rooms"
        setStatus("Successfully authenticated! Redirecting...")
        // Use window.location for hard navigation to clear cache
        setTimeout(() => {
          window.location.href = redirect
        }, 500)
      } catch (err) {
        setStatus("Unexpected error during auth callback.")
      }
    }
    run()
    return () => { active = false }
  }, [router])

  return (
    <main className="p-6 text-sm text-slate-800">
      {status}
    </main>
  )
}


