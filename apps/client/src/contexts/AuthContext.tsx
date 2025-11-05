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

  useEffect(() => {
    if (!supabase) {
      setLoading(false)
      return
    }

    let mounted = true

    // Force refresh session on mount to ensure fresh state
    const initializeAuth = async () => {
      try {
        // Get fresh session with cache busting
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (!mounted) return
        
        if (error) {
          console.error('Error getting session:', error)
          setUser(null)
          setProfile(null)
          setLoading(false)
          return
        }

        setUser(session?.user ?? null)
        
        if (session?.user) {
          // Refresh profile with fresh data
          await refreshProfile()
        } else {
          setProfile(null)
        }
        
        setLoading(false)
      } catch (error) {
        console.error('Error initializing auth:', error)
        if (mounted) {
          setUser(null)
          setProfile(null)
          setLoading(false)
        }
      }
    }

    initializeAuth()

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session?.user?.id)
      
      if (!mounted) return
      
      setUser(session?.user ?? null)
      
      if (session?.user) {
        // Refresh profile when user logs in
        await refreshProfile()
      } else {
        // Clear profile when user logs out
        setProfile(null)
      }
      
      setLoading(false)
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
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

