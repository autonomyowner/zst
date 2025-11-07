import { supabase } from './supabase'
import type { Profile, UserRole } from '../types/database'

/**
 * Get the current authenticated user's profile
 */
export async function getCurrentUserProfile(): Promise<Profile | null> {
  if (!supabase) return null

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (error || !profile) return null
  return profile as Profile
}

/**
 * Check if the current user has a specific role
 */
export async function hasRole(role: UserRole): Promise<boolean> {
  const profile = await getCurrentUserProfile()
  return profile?.role === role
}

/**
 * Check if the current user is an admin
 */
export async function isAdmin(): Promise<boolean> {
  return hasRole('admin')
}

/**
 * Get the current authenticated user
 */
export async function getCurrentUser() {
  if (!supabase) return null
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

/**
 * Sign out the current user
 */
export async function signOut() {
  if (!supabase) return
  await supabase.auth.signOut()
}

