"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/contexts/AuthContext"
import AuthLoadingSpinner from "@/components/AuthLoadingSpinner"

export default function BusinessLoginPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")

  // Redirect if already logged in
  useEffect(() => {
    if (!authLoading && user) {
      router.replace("/business/dashboard")
    }
  }, [user, authLoading, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Prevent submission if already logged in
    if (user) {
      router.replace("/business/dashboard")
      return
    }

    if (!supabase) return

    setSubmitting(true)
    setError("")

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (authError) {
        setError(authError.message)
        setSubmitting(false)
        return
      }

      if (data.user) {
        // Check if user has a profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single()

        // If profile doesn't exist, create it with default values
        if (!profile) {
          // Wait a moment in case profile is being created
          await new Promise(resolve => setTimeout(resolve, 500))
          
          // Try fetching again
          const { data: retryProfile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', data.user.id)
            .single()
          
          if (retryProfile) {
            profile = retryProfile
          } else {
            // Still no profile, create it
            const { data: newProfile, error: createError } = await supabase
              .from('profiles')
              .insert({
                id: data.user.id,
                email: data.user.email || '',
                business_name: null,
                role: 'retailer',
              })
              .select()
              .single()

            if (createError) {
              console.error('Error creating profile:', createError)
              // Try one more time with a longer wait
              await new Promise(resolve => setTimeout(resolve, 1000))
              const { data: finalProfile } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', data.user.id)
                .single()
              
              if (!finalProfile) {
                setError('Profile not found. The account was created but profile setup failed. Please try refreshing the page or contact support.')
                setSubmitting(false)
                return
              }
              profile = finalProfile
            } else if (newProfile) {
              profile = newProfile
            } else {
              setError('Profile not found. Please contact support.')
              setSubmitting(false)
              return
            }
          }
        }

        // Wait a moment for auth context to update
        await new Promise(resolve => setTimeout(resolve, 300))
        
        // Redirect to dashboard
        router.push('/business/dashboard')
        router.refresh() // Refresh to update auth context
      }
    } catch {
      setError('An unexpected error occurred. Please try again.')
      setSubmitting(false)
    }
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
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-2 sm:px-4 py-4 sm:py-8">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-4 sm:p-6 md:p-8">
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-black mb-2">Business Login</h1>
          <p className="text-sm sm:text-base text-gray-600">Sign in to access your business portal</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-xs sm:text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              id="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent text-sm sm:text-base min-h-[44px]"
              placeholder="your@email.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              type="password"
              id="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent text-sm sm:text-base min-h-[44px]"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={submitting || authLoading}
            className="w-full bg-black text-white font-bold py-3 px-4 rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base min-h-[44px]"
          >
            {submitting ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="mt-4 sm:mt-6 text-center">
          <p className="text-xs sm:text-sm text-gray-600">
            Don&apos;t have an account?{' '}
            <Link href="/business/signup" className="text-black font-medium hover:underline min-h-[44px] inline-flex items-center">
              Sign up
            </Link>
          </p>
        </div>

        <div className="mt-3 sm:mt-4 text-center">
          <Link href="/" className="text-xs sm:text-sm text-gray-600 hover:text-black min-h-[44px] inline-flex items-center">
            ← Back to Shopping
          </Link>
        </div>
      </div>
    </div>
  )
}

