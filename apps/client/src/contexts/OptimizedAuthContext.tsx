"use client"

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { Profile } from '@/types/database'
import type { User } from '@supabase/supabase-js'

interface AuthContextType {
  user: User | null
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

// Local storage keys
const USER_STORAGE_KEY = 'zst-cached-user'
const PROFILE_STORAGE_KEY = 'zst-cached-profile'

export function OptimizedAuthProvider({ children }: { children: ReactNode }) {
  // Always start with null to match server-side rendering
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [hydrated, setHydrated] = useState(false)

  // Cache user and profile to localStorage
  const cacheUserData = useCallback((user: User | null, profile: Profile | null) => {
    if (typeof window === 'undefined') return

    try {
      if (user) {
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user))
      } else {
        localStorage.removeItem(USER_STORAGE_KEY)
      }

      if (profile) {
        localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile))
      } else {
        localStorage.removeItem(PROFILE_STORAGE_KEY)
      }
    } catch (error) {
      console.error('Error caching user data:', error)
    }
  }, [])

  const refreshProfile = useCallback(async () => {
    if (!supabase) return

    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser()

      if (!currentUser) {
        setProfile(null)
        cacheUserData(null, null)
        return
      }

      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', currentUser.id)
        .single()

      if (error) {
        console.error('Error fetching profile:', error)
        setProfile(null)
        return
      }

      const newProfile = profileData as Profile
      setProfile(newProfile)
      cacheUserData(currentUser, newProfile)
    } catch (error) {
      console.error('Error refreshing profile:', error)
      setProfile(null)
    }
  }, [cacheUserData])

  const signOut = useCallback(async () => {
    if (supabase) {
      await supabase.auth.signOut()
      setUser(null)
      setProfile(null)
      cacheUserData(null, null)
    }
  }, [cacheUserData])

  // Hydrate from localStorage after mount (client-only)
  useEffect(() => {
    if (typeof window === 'undefined') return

    try {
      const cachedUser = localStorage.getItem(USER_STORAGE_KEY)
      const cachedProfile = localStorage.getItem(PROFILE_STORAGE_KEY)

      if (cachedUser) setUser(JSON.parse(cachedUser))
      if (cachedProfile) setProfile(JSON.parse(cachedProfile))
    } catch (error) {
      console.error('Error hydrating from cache:', error)
    } finally {
      setHydrated(true)
    }
  }, [])

  useEffect(() => {
    if (!supabase) {
      setLoading(false)
      return
    }

    let mounted = true

    // Initial auth check (fast, uses cached session)
    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()

        if (!mounted) return

        if (session?.user) {
          setUser(session.user)

          // Fetch profile in background
          const { data: profileData } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single()

          if (mounted && profileData) {
            const newProfile = profileData as Profile
            setProfile(newProfile)
            cacheUserData(session.user, newProfile)
          }
        } else {
          setUser(null)
          setProfile(null)
          cacheUserData(null, null)
        }
      } catch (error) {
        console.error('Error initializing auth:', error)
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    initAuth()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return

        const newUser = session?.user ?? null
        setUser(newUser)

        if (newUser) {
          // Fetch profile
          const { data: profileData } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', newUser.id)
            .single()

          if (mounted && profileData) {
            const newProfile = profileData as Profile
            setProfile(newProfile)
            cacheUserData(newUser, newProfile)
          }
        } else {
          setProfile(null)
          cacheUserData(null, null)
        }

        if (mounted) {
          setLoading(false)
        }
      }
    )

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [cacheUserData])

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
    throw new Error('useAuth must be used within an OptimizedAuthProvider')
  }
  return context
}
