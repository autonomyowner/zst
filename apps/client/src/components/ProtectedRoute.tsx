"use client"

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/OptimizedAuthContext'
import AuthLoadingSpinner from '@/components/AuthLoadingSpinner'
import type { UserRole } from '@/types/database'
import { getDashboardRoute } from '@/lib/role-utils'

interface ProtectedRouteProps {
  children: React.ReactNode
  allowedRoles?: UserRole[] // If not specified, any authenticated user is allowed
  requireAuth?: boolean // Default true
  redirectTo?: string // Custom redirect path
}

/**
 * ProtectedRoute component - Restricts access based on user role
 *
 * Usage:
 * <ProtectedRoute allowedRoles={['admin']}>
 *   <AdminDashboard />
 * </ProtectedRoute>
 */
export function ProtectedRoute({
  children,
  allowedRoles,
  requireAuth = true,
  redirectTo,
}: ProtectedRouteProps) {
  const { user, profile, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (loading) return

    // Check authentication requirement
    if (requireAuth && !user) {
      router.push(redirectTo || '/login')
      return
    }

    // Check if user is banned
    if (profile?.is_banned) {
      router.push('/banned')
      return
    }

    // Check role authorization
    if (allowedRoles && profile && !allowedRoles.includes(profile.role)) {
      // Redirect to user's appropriate dashboard based on role
      const dashboardRoute = getDashboardRoute(profile.role)
      router.push(redirectTo || dashboardRoute)
      return
    }
  }, [user, profile, loading, allowedRoles, requireAuth, redirectTo, router])

  // Show loading spinner while checking auth
  if (loading) {
    return <AuthLoadingSpinner />
  }

  // User is banned
  if (profile?.is_banned) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100">
        <div className="max-w-md rounded-lg bg-white p-8 shadow-lg">
          <h2 className="mb-4 text-2xl font-bold text-red-600">Account Suspended</h2>
          <p className="text-gray-700">
            Your account has been suspended. Please contact support for more information.
          </p>
        </div>
      </div>
    )
  }

  // Not authenticated when auth is required
  if (requireAuth && !user) {
    return <AuthLoadingSpinner />
  }

  // Not authorized for this role
  if (allowedRoles && profile && !allowedRoles.includes(profile.role)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100">
        <div className="max-w-md rounded-lg bg-white p-8 shadow-lg">
          <h2 className="mb-4 text-2xl font-bold text-red-600">Access Denied</h2>
          <p className="text-gray-700">
            You do not have permission to access this page.
          </p>
          <button
            onClick={() => router.push(getDashboardRoute(profile.role))}
            className="mt-4 rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    )
  }

  // User is authenticated and authorized
  return <>{children}</>
}
