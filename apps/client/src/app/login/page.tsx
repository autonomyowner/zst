"use client"

import { Suspense, useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { supabase, supabaseConfigured } from "../../lib/supabase"
import { useAuth } from "@/contexts/OptimizedAuthContext"
import AuthLoadingSpinner from "@/components/AuthLoadingSpinner"

function LoginBody() {
  const router = useRouter()
  const params = useSearchParams()
  const { user, loading: authLoading } = useAuth()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [status, setStatus] = useState<string>("")
  const [submitting, setSubmitting] = useState(false)
  const [showResendOption, setShowResendOption] = useState(false)

  // Redirect if already logged in
  useEffect(() => {
    if (!authLoading && user) {
      const redirect = params.get("redirect") || "/"
      router.replace(redirect)
    }
  }, [user, authLoading, router, params])

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Prevent submission if already logged in
    if (user) {
      setStatus("You're already logged in! Redirecting...")
      const redirect = params.get("redirect") || "/"
      router.replace(redirect)
      return
    }

    if (!supabase) return
    setSubmitting(true)
    setStatus("Logging in…")
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    
    setSubmitting(false)
    
    if (error) {
      // Provide more helpful error messages
      if (error.message.includes("Invalid login credentials") || error.message.includes("Invalid")) {
        setStatus("❌ Invalid email or password. If you just signed up, please verify your email first by clicking the link sent to your inbox.")
        setShowResendOption(true)
      } else if (error.message.includes("Email not confirmed")) {
        setStatus("⚠️ Please verify your email address before logging in. Check your inbox for the confirmation link.")
        setShowResendOption(true)
      } else {
        setStatus(`Error: ${error.message}`)
      }
    } else if (data.session) {
      setStatus("✅ Success! Redirecting...")
      const redirect = params.get("redirect") || "/"
      // Wait a moment for auth context to update, then navigate
      await new Promise(resolve => setTimeout(resolve, 300))
      router.push(redirect)
      router.refresh() // Refresh to update auth context and clear cache
    }
  }

  const handleOAuth = async (provider: "google" | "github") => {
    // Prevent OAuth if already logged in
    if (user) {
      const redirect = params.get("redirect") || "/"
      router.replace(redirect)
      return
    }
    
    if (!supabase) return
    setSubmitting(true)
    setStatus(`Redirecting to ${provider}…`)
    const { error } = await supabase.auth.signInWithOAuth({ provider })
    if (error) {
      setStatus(`Error: ${error.message}`)
      setSubmitting(false)
    }
  }

  const handleResendVerification = async () => {
    if (!supabase || !email) {
      setStatus("❌ Please enter your email address first")
      return
    }
    setStatus("Sending verification email...")
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: email,
    })
    if (error) {
      setStatus(`❌ Error: ${error.message}`)
    } else {
      setStatus("✅ Verification email sent! Please check your inbox and spam folder.")
      setShowResendOption(false)
    }
  }

  if (!supabaseConfigured) {
    return (
      <div className="p-6 text-sm text-red-600">Supabase is not configured. Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.</div>
    )
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
      <section className="max-w-md mx-auto space-y-4 sm:space-y-6 px-4">
        <div className="text-center space-y-2 text-slate-900">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Welcome back</h1>
          <p className="text-slate-700 text-xs sm:text-sm">Log in with your email and password or continue with your favorite provider.</p>
        </div>

        <div className="rounded-xl border-2 border-black/10 bg-white/80 backdrop-blur-sm p-6 sm:p-8 text-slate-900 shadow-lg">
          <form onSubmit={handleEmailLogin} className="space-y-4" aria-label="Login form">
            <div>
              <label htmlFor="email" className="block text-sm font-semibold mb-2 text-gray-900">Email</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-lg border-2 border-gray-300 bg-white p-3 outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 text-base transition-all duration-200 min-h-[44px]"
                required
                aria-required="true"
                aria-describedby="email-description"
              />
              <p id="email-description" className="sr-only">Enter your email address</p>
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-semibold mb-2 text-gray-900">Password</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full rounded-lg border-2 border-gray-300 bg-white p-3 outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 text-base transition-all duration-200 min-h-[44px]"
                required
                aria-required="true"
                aria-describedby="password-description"
              />
              <p id="password-description" className="sr-only">Enter your password</p>
            </div>
            <button
              type="submit"
              disabled={submitting || authLoading}
              aria-label="Log in with email and password"
              className="w-full inline-flex items-center justify-center gap-2 rounded-lg px-6 py-3 font-bold text-black bg-gradient-to-r from-yellow-400 to-amber-500 shadow-md hover:shadow-lg hover:from-yellow-300 hover:to-amber-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed min-h-[48px] text-base transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
            >
              {submitting ? "Logging in…" : "Log in"}
            </button>
          </form>

          <div className="my-4 flex items-center gap-3 text-slate-600">
            <div className="h-px flex-1 bg-black/10" />
            <span className="text-xs">or</span>
            <div className="h-px flex-1 bg-black/10" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => handleOAuth("google")}
              disabled={submitting || authLoading || !!user}
              aria-label="Continue with Google"
              className="rounded-lg border-2 border-gray-300 bg-white px-4 py-3 text-sm font-medium hover:bg-gray-50 hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] transition-all duration-200 shadow-sm hover:shadow-md"
            >
              Google
            </button>
            <button
              onClick={() => handleOAuth("github")}
              disabled={submitting || authLoading || !!user}
              aria-label="Continue with GitHub"
              className="rounded-lg border-2 border-gray-300 bg-white px-4 py-3 text-sm font-medium hover:bg-gray-50 hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] transition-all duration-200 shadow-sm hover:shadow-md"
            >
              GitHub
            </button>
          </div>

          {status && (
            <div className={`mt-4 p-3 rounded-lg ${
              status.includes("✅") || status.includes("Success")
                ? "bg-green-50 border border-green-200 text-green-800" 
                : status.includes("❌") || status.includes("Invalid")
                ? "bg-red-50 border border-red-200 text-red-800"
                : status.includes("⚠️") || status.includes("verify")
                ? "bg-yellow-50 border border-yellow-200 text-yellow-800"
                : "bg-blue-50 border border-blue-200 text-blue-800"
            }`}>
              <p className="text-sm font-medium" role="status">{status}</p>
              {status.includes("verify your email") && (
                <div className="mt-2 space-y-1">
                  <p className="text-xs">
                    📧 You need to verify your email before logging in. Check your inbox for the confirmation link.
                  </p>
                  <p className="text-xs">
                    💡 Didn&apos;t receive it? Check your spam folder or try signing up again.
                  </p>
                </div>
              )}
              {showResendOption && (
                <button
                  onClick={handleResendVerification}
                  type="button"
                  className="mt-2 text-xs underline underline-offset-2 hover:text-blue-600"
                >
                  Resend verification email
                </button>
              )}
            </div>
          )}
        </div>

        <p className="text-center text-xs sm:text-sm text-slate-800">
          New here? <a href="/signup" className="underline underline-offset-4 min-h-[44px] inline-flex items-center">Create an account</a>
        </p>
      </section>
    </main>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="p-6 text-sm opacity-70">Loading…</div>}>
      <LoginBody />
    </Suspense>
  )
}


