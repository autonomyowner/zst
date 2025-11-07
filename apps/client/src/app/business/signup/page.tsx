"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/contexts/AuthContext"
import AuthLoadingSpinner from "@/components/AuthLoadingSpinner"
import type { UserRole } from "@/types/database"

export default function BusinessSignupPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    business_name: "",
    role: "retailer" as UserRole,
  })
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
      // Create auth user - Supabase might require email confirmation
      // If email confirmation is disabled, user will be automatically signed in
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            business_name: formData.business_name,
            role: formData.role,
          },
          emailRedirectTo: typeof window !== 'undefined' ? `${window.location.origin}/business/dashboard` : undefined,
        }
      })

      if (authError) {
        setError(authError.message)
        setSubmitting(false)
        return
      }

      if (!authData.user) {
        setError('Failed to create user account')
        setSubmitting(false)
        return
      }

      // Check if email confirmation is required
      if (authData.user && !authData.session) {
        // Email confirmation required - user needs to confirm email first
        setError('Account created! Please check your email to confirm your account, then log in.')
        setSubmitting(false)
        return
      }

      // Wait for the trigger to create the profile
      await new Promise(resolve => setTimeout(resolve, 2000))

      // Verify session is established
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      const { data: { user: currentUser }, error: userError } = await supabase.auth.getUser()
      
      if (!session || !currentUser || currentUser.id !== authData.user.id) {
        console.error('Session not established:', { sessionError, userError, hasSession: !!session, hasUser: !!currentUser })
        // If no session, user needs to confirm email or login
        if (authData.user) {
          setError('Account created! Please check your email to confirm your account, then log in.')
        } else {
          setError('Account created but session setup failed. Please try logging in.')
        }
        setSubmitting(false)
        return
      }

      console.log('Session established:', { userId: currentUser.id })

      // Retry logic: Try multiple times to ensure profile is created/updated
      let profileSuccess = false
      let lastError = null

      for (let attempt = 0; attempt < 3; attempt++) {
        // Verify we have a valid session on each attempt
        const { data: { session: currentSession } } = await supabase.auth.getSession()
        const { data: { user: currentUser } } = await supabase.auth.getUser()
        
        if (!currentSession || !currentUser || currentUser.id !== authData.user.id) {
          console.warn(`Session check failed (attempt ${attempt + 1}/3)`)
          if (attempt < 2) {
            await new Promise(resolve => setTimeout(resolve, 1000))
            continue
          } else {
            lastError = new Error('Session not established')
            break
          }
        }

        // Check if profile exists
        // Use a simpler query to avoid 500 errors
        const { data: existingProfile, error: checkError } = await supabase
          .from('profiles')
          .select('id, email')
          .eq('id', authData.user.id)
          .maybeSingle() // Use maybeSingle instead of single to avoid errors

        // Profile exists if we got data and no error
        const profileExists = !!existingProfile && !checkError
        
        // Log check result for debugging
        if (checkError && checkError.code !== 'PGRST116') {
          console.error('Error checking profile:', checkError)
        }

        if (profileExists) {
          // Profile exists, try to update it
          const { data: updateData, error: updateError } = await supabase
            .from('profiles')
            .update({
              email: formData.email,
              business_name: formData.business_name,
              role: formData.role,
            })
            .eq('id', authData.user.id)
            .select()

          if (!updateError && updateData && updateData.length > 0) {
            profileSuccess = true
            break
          }
          lastError = updateError || new Error('Update returned no data')
          const sessionInfo = await supabase.auth.getSession()
          console.error(`Update attempt ${attempt + 1} failed:`, {
            error: updateError,
            errorDetails: updateError ? {
              message: updateError.message,
              code: updateError.code,
              details: updateError.details,
              hint: updateError.hint,
            } : null,
            data: updateData,
            userId: authData.user.id,
            session: sessionInfo.data?.session,
            hasSession: !!sessionInfo.data?.session,
          })
        } else {
          // Profile doesn't exist, try to insert it
          const { data: insertData, error: insertError } = await supabase
            .from('profiles')
            .insert({
              id: authData.user.id,
              email: formData.email,
              business_name: formData.business_name,
              role: formData.role,
            })
            .select()

          if (!insertError && insertData && insertData.length > 0) {
            profileSuccess = true
            break
          }
          lastError = insertError || new Error('Insert returned no data')
          const sessionInfo = await supabase.auth.getSession()
          console.error(`Insert attempt ${attempt + 1} failed:`, {
            error: insertError,
            errorDetails: insertError ? {
              message: insertError.message,
              code: insertError.code,
              details: insertError.details,
              hint: insertError.hint,
            } : null,
            data: insertData,
            userId: authData.user.id,
            session: sessionInfo.data?.session,
            hasSession: !!sessionInfo.data?.session,
          })
        }

        // Wait before retry
        if (attempt < 2) {
          await new Promise(resolve => setTimeout(resolve, 1000))
        }
      }

      if (!profileSuccess) {
        const errorDetails = lastError ? {
          message: lastError.message,
          code: lastError.code,
          details: lastError.details,
          hint: lastError.hint,
          toString: String(lastError),
        } : 'No error object returned'
        
        console.error('Profile setup failed after retries:', {
          error: lastError,
          errorDetails,
          userId: authData.user.id,
        })
        
        // Check if we can at least read the profile (even if update failed)
        const { data: finalProfile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', authData.user.id)
          .single()
        
        if (finalProfile) {
          console.log('Profile exists but update failed. User can update manually.')
        } else {
          console.error('Profile does not exist and could not be created.')
        }
        
        // Still redirect - user can update profile in dashboard
        // Don't show alert to avoid interrupting the flow
      }

      // Redirect to dashboard
      router.push('/business/dashboard')
    } catch (err) {
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
          <h1 className="text-2xl sm:text-3xl font-bold text-black mb-2">Business Sign Up</h1>
          <p className="text-sm sm:text-base text-gray-600">Create your business account</p>
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
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
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
              minLength={6}
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent text-sm sm:text-base min-h-[44px]"
              placeholder="••••••••"
            />
          </div>

          <div>
            <label htmlFor="business_name" className="block text-sm font-medium text-gray-700 mb-1">
              Business Name
            </label>
            <input
              type="text"
              id="business_name"
              required
              value={formData.business_name}
              onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}
              className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent text-sm sm:text-base min-h-[44px]"
              placeholder="Your Business Name"
            />
          </div>

          <div>
            <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
              Business Type
            </label>
            <select
              id="role"
              required
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
              className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent text-sm sm:text-base min-h-[44px]"
            >
              <option value="retailer">Retailer</option>
              <option value="wholesaler">Wholesaler</option>
              <option value="importer">Importer</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Select your business type to access the appropriate marketplace
            </p>
          </div>

          <button
            type="submit"
            disabled={submitting || authLoading}
            className="w-full bg-black text-white font-bold py-3 px-4 rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base min-h-[44px]"
          >
            {submitting ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <div className="mt-4 sm:mt-6 text-center">
          <p className="text-xs sm:text-sm text-gray-600">
            Already have an account?{' '}
            <Link href="/business/login" className="text-black font-medium hover:underline min-h-[44px] inline-flex items-center">
              Sign in
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

