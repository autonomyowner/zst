"use client"

import { Suspense, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase, supabaseConfigured } from "../../lib/supabase"
import { useSearchParams } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"
import AuthLoadingSpinner from "@/components/AuthLoadingSpinner"

function SignupPageInner() {
  const router = useRouter()
  const params = useSearchParams()
  const { user, loading: authLoading } = useAuth()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [status, setStatus] = useState<string>("")
  const [submitting, setSubmitting] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<string>("")

  // Redirect if already logged in
  useEffect(() => {
    if (!authLoading && user) {
      router.replace("/rooms")
    }
  }, [user, authLoading, router])

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Prevent submission if already logged in
    if (user) {
      setStatus("You're already logged in! Redirecting...")
      router.replace("/rooms")
      return
    }

    if (!supabase) return
    setSubmitting(true)
    setStatus("Creating account…")
    
    const { data, error } = await supabase.auth.signUp({ 
      email, 
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        data: {
          email: email,
          full_name: email.split('@')[0], // Use email prefix as default name
        }
      }
    })
    
    if (error) {
      setStatus(`Error: ${error.message}`)
      setSubmitting(false)
      return
    }
    
    // Create user profile in database
    if (data.user) {
      try {
        const { error: profileError } = await supabase
          .from('users')
          .insert({
            id: data.user.id,
            email: email,
            full_name: email.split('@')[0],
            onboarded: false
          })
        
        if (profileError) {
          console.log('Profile creation note:', profileError.message)
          // Don't show error to user as the account was created successfully
        }
      } catch (err) {
        console.log('Profile creation note:', err)
      }
    }
    
    // Check if email confirmation is required
    if (data.user && !data.session) {
      setStatus("✅ Account created! Please check your email to verify your account before logging in.")
      setSubmitting(false)
    } else if (data.session) {
      // Auto-login successful (email confirmation disabled)
      setStatus("✅ Account created! Redirecting...")
      setTimeout(() => router.replace("/rooms"), 1500)
    }
  }

  if (!supabaseConfigured) {
    return <div className="p-6 text-sm text-red-600">Supabase is not configured. Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.</div>
  }

  // Show loading while checking auth state
  if (authLoading) {
    return <AuthLoadingSpinner message="Checking session…" />
  }

  // Don't show form if already logged in (will redirect)
  if (user) {
    return <AuthLoadingSpinner message="You're already logged in! Redirecting..." />
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
      <section className="max-w-xl mx-auto space-y-4 sm:space-y-6 px-4">
        <div className="text-center space-y-2 text-slate-900">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Create your TRAVoices account</h1>
          <p className="text-slate-700 text-xs sm:text-sm">Start with a plan now or choose later. You can upgrade anytime.</p>
        </div>

        {/* Plan quick-select (optional via query) */}
        <div className="rounded-xl border border-black/10 bg-white/70 backdrop-blur p-3 sm:p-4 text-slate-900">
          <div className="text-xs uppercase tracking-wide text-slate-600 mb-2">Choose a starting plan</div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {[
              { id: 'creator', label: 'Creator', note: '$7/mo' },
              { id: 'pro', label: 'Pro', note: '$29/mo' },
              { id: 'team', label: 'Team', note: '$79/mo' },
            ].map((p) => (
              <button
                key={p.id}
                onClick={() => setSelectedPlan(p.id)}
                aria-pressed={selectedPlan === p.id}
                className={`rounded-md border px-2 sm:px-3 py-2 text-xs sm:text-sm min-h-[44px] ${selectedPlan === p.id ? 'border-amber-500 bg-white shadow' : 'border-black/15 bg-white/60 hover:bg-white/80'}`}
              >
                <span className="font-semibold">{p.label}</span>
                <span className="ml-1 sm:ml-2 text-xs text-slate-600">{p.note}</span>
              </button>
            ))}
          </div>
          {selectedPlan && (
            <p className="mt-2 text-xs text-slate-700">Selected: <span className="font-medium">{selectedPlan}</span>. You can change this later.</p>
          )}
        </div>

        <div className="rounded-xl border border-black/10 bg-white/70 backdrop-blur p-4 sm:p-6 text-slate-900">
          <form onSubmit={handleSignup} className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="email">Email</label>
              <input 
                id="email" 
                type="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                placeholder="you@example.com"
                className="w-full rounded-md border border-black/20 bg-white/70 p-2 outline-none focus:ring-2 focus:ring-amber-400/50 text-sm sm:text-base min-h-[44px]" 
                required 
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="password">Password</label>
              <input 
                id="password" 
                type="password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                placeholder="At least 6 characters"
                minLength={6}
                className="w-full rounded-md border border-black/20 bg-white/70 p-2 outline-none focus:ring-2 focus:ring-amber-400/50 text-sm sm:text-base min-h-[44px]" 
                required 
              />
              <p className="mt-1 text-xs text-slate-600">Must be at least 6 characters</p>
            </div>
            <button
              type="submit"
              disabled={submitting || authLoading}
              aria-label="Create account"
              className="w-full inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 font-semibold text-slate-900 bg-gradient-to-r from-yellow-400 to-amber-500 shadow hover:brightness-105 focus:outline-none focus:ring-2 focus:ring-white/30 disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] text-sm sm:text-base"
            >
              {submitting ? "Creating account…" : "Sign up"}
            </button>
          </form>
          
          {status && (
            <div className={`mt-4 p-3 rounded-lg ${
              status.includes("✅") 
                ? "bg-green-50 border border-green-200 text-green-800" 
                : status.includes("❌") || status.includes("Error")
                ? "bg-red-50 border border-red-200 text-red-800"
                : "bg-blue-50 border border-blue-200 text-blue-800"
            }`}>
              <p className="text-xs sm:text-sm font-medium" role="status">{status}</p>
              {status.includes("check your email") && (
                <p className="mt-2 text-xs">
                  📧 Check your inbox and click the verification link to complete your registration.
                </p>
              )}
            </div>
          )}
        </div>

        <p className="text-center text-xs sm:text-sm text-slate-800">
          Already have an account? <a href="/login" className="underline underline-offset-4 min-h-[44px] inline-flex items-center">Log in</a>
        </p>
      </section>
    </main>
  )
}

export default function SignupPage() {
  return (
    <Suspense fallback={<div className="p-6 text-sm opacity-70">Loading…</div>}>
      <SignupPageInner />
    </Suspense>
  )
}


