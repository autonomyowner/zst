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
        const { error } = await supabase.auth.exchangeCodeForSession(window.location.href)
        if (!active) return
        if (error) {
          setStatus(`Auth error: ${error.message}`)
          return
        }
        // Optional: support redirect query param
        const url = new URL(window.location.href)
        const redirect = url.searchParams.get("redirect") || "/rooms"
        setStatus("Successfully authenticated! Redirecting...")
        setTimeout(() => router.replace(redirect), 500)
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


