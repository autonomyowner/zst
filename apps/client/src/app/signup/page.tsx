"use client"

import { Suspense, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase, supabaseConfigured } from "../../lib/supabase"
import { useSearchParams } from "next/navigation"

function SignupPageInner() {
  const router = useRouter()
  const params = useSearchParams()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [status, setStatus] = useState<string>("")
  const [loading, setLoading] = useState(true)
  const [selectedPlan, setSelectedPlan] = useState<string>("")

  useEffect(() => {
    let mounted = true
    supabase?.auth.getSession().then(({ data }) => {
      if (!mounted) return
      if (data.session) {
        // User is already logged in, redirect them
        setStatus("You're already logged in! Redirecting...")
        setTimeout(() => router.replace("/rooms"), 1000)
      } else {
        setLoading(false)
      }
    })
    return () => { mounted = false }
  }, [router])

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!supabase) return
    setStatus("Creating account…")
    const { error } = await supabase.auth.signUp({ email, password })
    setStatus(error ? `Error: ${error.message}` : "Check your email to confirm your account.")
  }

  if (!supabaseConfigured) {
    return <div className="p-6 text-sm text-red-600">Supabase is not configured. Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.</div>
  }
  if (loading) {
    return (
      <main className="relative min-h-screen flex items-center justify-center">
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
        <div className="rounded-xl border border-black/10 bg-white/70 backdrop-blur p-6 text-slate-900">
          <p className="text-sm opacity-70">{status || "Checking session…"}</p>
        </div>
      </main>
    )
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
      <section className="max-w-xl mx-auto space-y-6">
        <div className="text-center space-y-2 text-slate-900">
          <h1 className="text-3xl font-extrabold tracking-tight">Create your TRAVoices account</h1>
          <p className="text-slate-700 text-sm">Start with a plan now or choose later. You can upgrade anytime.</p>
        </div>

        {/* Plan quick-select (optional via query) */}
        <div className="rounded-xl border border-black/10 bg-white/70 backdrop-blur p-4 text-slate-900">
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
                className={`rounded-md border px-3 py-2 text-sm ${selectedPlan === p.id ? 'border-amber-500 bg-white shadow' : 'border-black/15 bg-white/60 hover:bg-white/80'}`}
              >
                <span className="font-semibold">{p.label}</span>
                <span className="ml-2 text-xs text-slate-600">{p.note}</span>
              </button>
            ))}
          </div>
          {selectedPlan && (
            <p className="mt-2 text-xs text-slate-700">Selected: <span className="font-medium">{selectedPlan}</span>. You can change this later.</p>
          )}
        </div>

        <div className="rounded-xl border border-black/10 bg-white/70 backdrop-blur p-6 text-slate-900">
          <form onSubmit={handleSignup} className="space-y-3">
            <label className="block text-sm font-medium" htmlFor="email">Email</label>
            <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-md border border-black/20 bg-white/70 p-2 outline-none focus:ring-2 focus:ring-amber-400/50" required />
            <label className="block text-sm font-medium" htmlFor="password">Password</label>
            <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full rounded-md border border-black/20 bg-white/70 p-2 outline-none focus:ring-2 focus:ring-amber-400/50" required />
            <button
              aria-label="Create account"
              className="w-full inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 font-semibold text-slate-900 bg-gradient-to-r from-yellow-400 to-amber-500 shadow hover:brightness-105 focus:outline-none focus:ring-2 focus:ring-white/30"
            >
              Sign up
            </button>
          </form>
          {status && <p className="mt-3 text-sm text-slate-700" role="status">{status}</p>}
        </div>

        <p className="text-center text-sm text-slate-800">
          Already have an account? <a href="/login" className="underline underline-offset-4">Log in</a>
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


