"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { supabase } from "@/lib/supabase"

export default function AdminLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!supabase) return

    setLoading(true)
    setError("")

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (authError) {
        setError(authError.message)
        setLoading(false)
        return
      }

      if (data.user) {
        // Check if user has admin role
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single()

        if (profileError || !profile) {
          setError('Profile not found. Please contact support.')
          setLoading(false)
          return
        }

        if (profile.role !== 'admin') {
          setError('Access denied. Admin privileges required.')
          await supabase.auth.signOut()
          setLoading(false)
          return
        }

        // Redirect to admin dashboard
        router.push('/admin/dashboard')
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.')
      setLoading(false)
    }
  }

  return (
    <main className="relative">
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
      <section className="max-w-md mx-auto space-y-4 sm:space-y-6 px-4">
        <div className="text-center space-y-2 text-slate-900">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Admin Login</h1>
          <p className="text-slate-700 text-xs sm:text-sm">Access the administration panel</p>
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
                placeholder="admin@example.com"
                className="w-full rounded-md border border-black/20 bg-white/70 p-2 sm:p-2 outline-none focus:ring-2 focus:ring-amber-400/50 text-sm sm:text-base min-h-[44px]"
                required
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
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              aria-label="Sign in to admin panel"
              className="w-full inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 font-semibold text-slate-900 bg-gradient-to-r from-yellow-400 to-amber-500 shadow hover:brightness-105 focus:outline-none focus:ring-2 focus:ring-white/30 disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] text-sm sm:text-base transition-all duration-250"
            >
              {loading ? "Signing in…" : "Sign In"}
            </button>
          </form>

          {error && (
            <div className="mt-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-800">
              <p className="text-sm font-medium" role="status">{error}</p>
            </div>
          )}
        </div>

        <p className="text-center text-xs sm:text-sm">
          <Link href="/" className="text-slate-600 hover:text-slate-900 underline underline-offset-2 inline-flex items-center min-h-[44px] transition-colors">← Back to shopping</Link>
        </p>
      </section>
    </main>
  )
}

