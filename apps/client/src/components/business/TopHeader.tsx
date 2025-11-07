"use client"

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'

interface TopHeaderProps {
  onReset?: () => void
}

export default function TopHeader({ onReset }: TopHeaderProps) {
  const { profile, signOut } = useAuth()
  const router = useRouter()
  const [profileMenuOpen, setProfileMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setProfileMenuOpen(false)
      }
    }

    if (profileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [profileMenuOpen])

  const handleReset = () => {
    if (onReset) {
      onReset()
    }
  }

  const handleSignOut = async () => {
    await signOut()
    router.push('/business/login')
  }

  return (
    <header className="fixed top-0 right-0 left-0 lg:left-64 bg-white border-b border-gray-200 z-30 h-16 flex items-center justify-between pl-16 lg:pl-4 pr-4 sm:pr-6">
      <div className="flex items-center gap-4">
        <button
          onClick={handleReset}
          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium min-h-[44px]"
        >
          Réinitialiser
        </button>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <span>Your plan</span>
          <Link
            href="/business/upgrade"
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            Upgrade now
          </Link>
        </div>

        {/* Profile Menu */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setProfileMenuOpen(!profileMenuOpen)}
            className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300 transition-colors min-h-[44px] min-w-[44px]"
            aria-label="Profile menu"
          >
            <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </button>

          {profileMenuOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-50">
              <div className="px-4 py-2 border-b border-gray-200">
                <p className="text-sm font-medium text-gray-900">{profile?.business_name || profile?.email}</p>
                <p className="text-xs text-gray-500">{profile?.email}</p>
              </div>
              <button
                onClick={() => {
                  router.push('/business/settings')
                  setProfileMenuOpen(false)
                }}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors min-h-[44px]"
              >
                Settings
              </button>
              <button
                onClick={handleSignOut}
                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors min-h-[44px]"
              >
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

