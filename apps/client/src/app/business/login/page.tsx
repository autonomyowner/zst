"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/contexts/OptimizedAuthContext"

export default function BusinessLoginPage() {
  const router = useRouter()
  const { user, profile, loading: authLoading } = useAuth()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")

  // Redirect if already logged in
  useEffect(() => {
    if (!authLoading && user && profile) {
      router.replace("/business/dashboard")
    }
  }, [user, profile, authLoading, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!supabase) return

    setSubmitting(true)
    setError("")

    try {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (authError) {
        setError(authError.message)
        setSubmitting(false)
        return
      }

      // Wait for auth context to update
      await new Promise(resolve => setTimeout(resolve, 1000))

      // Fallback: manually redirect if auth context hasn't updated yet
      // (The useEffect above should handle this automatically)
      const { data: { user: currentUser } } = await supabase.auth.getUser()
      if (currentUser) {
        router.replace("/business/dashboard")
      } else {
        setError('Login successful but profile loading failed. Please try again.')
        setSubmitting(false)
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.')
      setSubmitting(false)
    }
  }

  // Show nothing while checking auth and redirecting
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  // If logged in, show redirect message
  if (user && profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
          <p className="text-gray-600">Redirecting to dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <main className="relative min-h-screen">
      <div
        aria-hidden
        className="fixed inset-0 -z-10"
        style={{
          backgroundColor: '#fff8dc',
          backgroundImage: 'radial-gradient(rgba(201,162,39,0.6) 1px, transparent 1px)',
          backgroundSize: '36px 36px',
          backgroundPosition: '0 0',
        }}
      />
      <section className="max-w-md mx-auto space-y-4 sm:space-y-6 px-4 pt-8 pb-12">
        <div className="text-center space-y-2 text-slate-900">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Business Login</h1>
          <p className="text-slate-700 text-xs sm:text-sm">Access your business portal and manage your listings</p>
        </div>

        <div className="rounded-xl border border-black/10 bg-white/70 backdrop-blur p-4 sm:p-6 text-slate-900">
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-1">Email</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@business.com"
                className="w-full rounded-md border border-black/20 bg-white/70 p-2 sm:p-2 outline-none focus:ring-2 focus:ring-amber-400/50 text-sm sm:text-base min-h-[44px]"
                required
                disabled={submitting}
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-1">Password</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full rounded-md border border-black/20 bg-white/70 p-2 sm:p-2 outline-none focus:ring-2 focus:ring-amber-400/50 text-sm sm:text-base min-h-[44px]"
                required
                disabled={submitting}
              />
            </div>
            <button
              type="submit"
              disabled={submitting}
              aria-label="Sign in to business account"
              className="w-full inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 font-semibold text-slate-900 bg-gradient-to-r from-yellow-400 to-amber-500 shadow hover:brightness-105 focus:outline-none focus:ring-2 focus:ring-white/30 disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] text-sm sm:text-base transition-all duration-250"
            >
              {submitting ? "Signing in…" : "Sign In"}
            </button>
          </form>

          {error && (
            <div className="mt-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-800">
              <p className="text-sm font-medium" role="status">{error}</p>
            </div>
          )}
        </div>

        <div className="text-center space-y-2">
          <p className="text-xs sm:text-sm text-slate-800">
            New to our platform? <Link href="/business/signup" className="underline underline-offset-4 min-h-[44px] inline-flex items-center hover:text-slate-600 transition-colors">Create a business account</Link>
          </p>
          <p className="text-xs sm:text-sm">
            <Link href="/" className="text-slate-600 hover:text-slate-900 underline underline-offset-2 inline-flex items-center min-h-[44px] transition-colors">← Back to shopping</Link>
          </p>
        </div>
      </section>
    </main>
  )
}
