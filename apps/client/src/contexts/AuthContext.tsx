"use client"

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { supabase } from '@/lib/supabase'
import { getCurrentUserProfile } from '@/lib/auth'
import type { Profile } from '@/types/database'

interface AuthContextType {
  user: any | null
  profile: Profile | null
  loading: boolean
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  signOut: async () => {},
  refreshProfile: async () => {},
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<any | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  const refreshProfile = async () => {
    try {
      if (!supabase) return
      
      // Force fresh user check with cache busting
      const { data: { user: currentUser }, error: userError } = await supabase.auth.getUser()
      
      if (userError || !currentUser) {
        setProfile(null)
        return
      }

      // Get fresh profile data
      const userProfile = await getCurrentUserProfile()
      setProfile(userProfile)
    } catch (error) {
      console.error('Error refreshing profile:', error)
      setProfile(null)
    }
  }

  const signOut = async () => {
    if (supabase) {
      await supabase.auth.signOut()
      setUser(null)
      setProfile(null)
    }
  }

  // Function to refresh auth state with retry logic
  const refreshAuthState = async (retries = 3): Promise<void> => {
    if (!supabase) return

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        // Force refresh session first to ensure we have the latest token
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError && attempt < retries) {
          console.warn(`Auth refresh attempt ${attempt} failed, retrying...`, sessionError)
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt))
          continue
        }

        // Use getUser() for more reliable auth state (checks both session and token)
        const { data: { user: currentUser }, error: userError } = await supabase.auth.getUser()
        
        if (userError && attempt < retries) {
          console.warn(`Auth getUser attempt ${attempt} failed, retrying...`, userError)
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt))
          continue
        }

        if (userError || !currentUser) {
          // No user or error - clear state
          setUser(null)
          setProfile(null)
          setLoading(false)
          return
        }

        // Set user immediately for instant UI update
        setUser(currentUser)
        
        // Then fetch profile asynchronously
        try {
          const userProfile = await getCurrentUserProfile()
          setProfile(userProfile)
        } catch (profileError) {
          console.error('Error fetching profile:', profileError)
          setProfile(null)
        }
        
        setLoading(false)
        return // Success, exit retry loop
      } catch (error) {
        console.error(`Error refreshing auth state (attempt ${attempt}):`, error)
        if (attempt === retries) {
          // Final attempt failed, clear state
          setUser(null)
          setProfile(null)
          setLoading(false)
        }
      }
    }
  }

  useEffect(() => {
    if (!supabase) {
      setLoading(false)
      return
    }

    let mounted = true
    let visibilityTimeout: NodeJS.Timeout | null = null

    // Initial auth state load
    refreshAuthState()

    // Listen for auth state changes - this fires immediately on auth events
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session?.user?.id)
      
      if (!mounted) return
      
      // Update user state immediately for instant UI response
      const newUser = session?.user ?? null
      setUser(newUser)
      
      if (newUser) {
        // User logged in - refresh profile
        try {
          const userProfile = await getCurrentUserProfile()
          if (mounted) {
            setProfile(userProfile)
          }
        } catch (error) {
          console.error('Error refreshing profile after auth change:', error)
          if (mounted) {
            setProfile(null)
          }
        }
      } else {
        // User logged out - clear profile immediately
        setProfile(null)
      }
      
      if (mounted) {
        setLoading(false)
      }
    })

    // Refresh auth state when page becomes visible or gains focus
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && mounted) {
        // Clear any pending timeout
        if (visibilityTimeout) {
          clearTimeout(visibilityTimeout)
        }
        // Refresh auth state after a short delay to avoid rapid refreshes
        visibilityTimeout = setTimeout(() => {
          if (mounted) {
            refreshAuthState(1) // Use fewer retries for visibility refresh
          }
        }, 500)
      }
    }

    const handleFocus = () => {
      if (mounted) {
        // Clear any pending timeout
        if (visibilityTimeout) {
          clearTimeout(visibilityTimeout)
        }
        // Refresh auth state when window gains focus
        visibilityTimeout = setTimeout(() => {
          if (mounted) {
            refreshAuthState(1) // Use fewer retries for focus refresh
          }
        }, 500)
      }
    }

    // Add event listeners for visibility and focus
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', handleVisibilityChange)
      window.addEventListener('focus', handleFocus)
    }

    return () => {
      mounted = false
      subscription.unsubscribe()
      if (visibilityTimeout) {
        clearTimeout(visibilityTimeout)
      }
      if (typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', handleVisibilityChange)
        window.removeEventListener('focus', handleFocus)
      }
    }
  }, [])

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

