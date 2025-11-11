"use client"

import { useAuth } from '@/contexts/OptimizedAuthContext'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function BannedPage() {
  const { profile, signOut } = useAuth()
  const router = useRouter()

  useEffect(() => {
    // If user is not banned, redirect to home
    if (profile && !profile.is_banned) {
      router.push('/')
    }
  }, [profile, router])

  const handleSignOut = async () => {
    await signOut()
    router.push('/')
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
      <div className="max-w-md rounded-lg bg-white p-8 shadow-lg">
        <div className="mb-4 flex items-center justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
            <svg
              className="h-8 w-8 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
        </div>

        <h2 className="mb-4 text-center text-2xl font-bold text-red-600">
          Account Suspended
        </h2>

        <p className="mb-6 text-center text-gray-700">
          Your account has been suspended by an administrator. You no longer have access to the
          platform.
        </p>

        <div className="space-y-3">
          <p className="text-sm text-gray-600">
            If you believe this is a mistake, please contact our support team at:
          </p>
          <a
            href="mailto:support@zst.com"
            className="block text-center text-blue-600 hover:underline"
          >
            support@zst.com
          </a>

          <button
            onClick={handleSignOut}
            className="w-full rounded bg-gray-600 px-4 py-2 text-white hover:bg-gray-700"
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>
  )
}
