"use client"

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { useAuth } from '@/contexts/OptimizedAuthContext'

export default function Header() {
  const pathname = usePathname()
  const { user, profile, signOut } = useAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const isB2BPage = pathname?.startsWith('/business')
  const isAdminPage = pathname?.startsWith('/admin')
  const isImporterPage = pathname?.startsWith('/importer')
  const isWholesalerPage = pathname?.startsWith('/wholesaler')
  const isRetailerPage = pathname?.startsWith('/retailer')
  const isPublicPage = !isB2BPage && !isAdminPage && !isImporterPage && !isWholesalerPage && !isRetailerPage

  // Show header on all pages (including business login/signup)

  // Admin Header
  if (isAdminPage && user && profile?.role === 'admin') {
    return (
      <div className="w-full bg-gray-800 text-white border-b border-gray-700 sticky top-0 z-50">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <Link href="/admin/dashboard" className="flex items-center">
              <Image
                src="/logo.png"
                alt="ZST Admin"
                width={120}
                height={120}
                className="object-contain invert w-16 h-16 md:w-24 md:h-24"
              />
              <span className="ml-2 text-base md:text-xl font-bold hidden sm:inline">Admin Panel</span>
            </Link>
            <div className="flex items-center gap-2 md:gap-4">
              <span className="text-xs md:text-sm text-gray-300 hidden md:inline">Admin: {profile.email}</span>
              <Link
                href="/admin/dashboard"
                className="hidden md:inline-block px-4 py-2 text-white hover:text-gray-300 font-medium min-h-[44px] flex items-center"
              >
                Dashboard
              </Link>
              <button
                onClick={async () => {
                  await signOut()
                  window.location.href = '/admin/login'
                }}
                className="hidden md:inline-block px-4 py-2 border border-gray-600 text-white font-medium rounded-lg hover:bg-gray-700 min-h-[44px]"
              >
                Sign Out
              </button>
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 text-white hover:bg-gray-700 rounded-lg min-h-[44px] min-w-[44px] flex items-center justify-center"
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                )}
              </button>
            </div>
          </div>
          {mobileMenuOpen && (
            <div className="md:hidden mt-4 pb-4 border-t border-gray-700 pt-4 space-y-3">
              <div className="text-sm text-gray-300 px-2">{profile.email}</div>
              <Link
                href="/admin/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-4 py-3 text-white hover:bg-gray-700 rounded-lg font-medium min-h-[44px] flex items-center"
              >
                Dashboard
              </Link>
              <button
                onClick={async () => {
                  await signOut()
                  window.location.href = '/admin/login'
                  setMobileMenuOpen(false)
                }}
                className="w-full text-left px-4 py-3 border border-gray-600 text-white font-medium rounded-lg hover:bg-gray-700 min-h-[44px]"
              >
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    )
  }

  // Business Portal Header for importer/wholesaler/retailer pages
  if ((isImporterPage || isWholesalerPage || isRetailerPage) && user && profile) {
    return (
      <div className="w-full bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <Link href={isImporterPage ? "/importer/dashboard" : isWholesalerPage ? "/wholesaler/dashboard" : "/retailer/dashboard"} className="flex items-center" onClick={() => setMobileMenuOpen(false)}>
              <Image
                src="/logo.png"
                alt="ZST Logo"
                width={120}
                height={120}
                className="object-contain w-16 h-16 md:w-24 md:h-24"
              />
            </Link>
            <div className="flex items-center gap-2 md:gap-4">
              {profile && (
                <span className="text-xs md:text-sm text-gray-600 hidden md:inline">
                  {profile.business_name || profile.email}
                </span>
              )}
              <Link
                href="/"
                className="hidden md:inline-block px-4 py-2 text-black hover:text-gray-600 font-medium min-h-[44px] flex items-center"
              >
                Shopping
              </Link>
              <button
                onClick={async () => {
                  await signOut()
                  window.location.href = '/login'
                }}
                className="hidden md:inline-block px-4 py-2 border border-gray-300 text-black font-medium rounded-lg hover:bg-gray-50 min-h-[44px]"
              >
                Sign Out
              </button>
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 text-black hover:bg-gray-100 rounded-lg min-h-[44px] min-w-[44px] flex items-center justify-center"
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? (
                  <span>✕</span>
                ) : (
                  <span>☰</span>
                )}
              </button>
            </div>
          </div>
          {mobileMenuOpen && (
            <div className="md:hidden mt-4 pb-4 border-t border-gray-200 pt-4 space-y-3">
              {profile && (
                <div className="text-sm text-gray-600 px-2">{profile.business_name || profile.email}</div>
              )}
              <Link
                href="/"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-4 py-3 text-black hover:bg-gray-50 rounded-lg font-medium min-h-[44px] flex items-center"
              >
                Shopping
              </Link>
              <button
                onClick={async () => {
                  await signOut()
                  window.location.href = '/login'
                  setMobileMenuOpen(false)
                }}
                className="w-full text-left px-4 py-3 border border-gray-300 text-black font-medium rounded-lg hover:bg-gray-50 min-h-[44px]"
              >
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    )
  }

  // B2B Header
  if (isB2BPage) {
    return (
      <div className="w-full bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <Link href="/business/dashboard" className="flex items-center" onClick={() => setMobileMenuOpen(false)}>
              <Image 
                src="/logo.png" 
                alt="ZST Logo" 
                width={120} 
                height={120}
                className="object-contain w-16 h-16 md:w-24 md:h-24"
              />
            </Link>
            <div className="flex items-center gap-2 md:gap-4">
              {profile && (
                <span className="text-xs md:text-sm text-gray-600 hidden md:inline">
                  {profile.business_name || profile.email}
                </span>
              )}
              <Link
                href="/business/my-listings"
                className="hidden md:inline-block px-4 py-2 text-black hover:text-gray-600 font-medium min-h-[44px] flex items-center"
              >
                My Listings
              </Link>
              <Link
                href="/"
                className="hidden md:inline-block px-4 py-2 text-black hover:text-gray-600 font-medium min-h-[44px] flex items-center"
              >
                Shopping
              </Link>
              <button
                onClick={async () => {
                  await signOut()
                  window.location.href = '/business/login'
                }}
                className="hidden md:inline-block px-4 py-2 border border-gray-300 text-black font-medium rounded-lg hover:bg-gray-50 min-h-[44px]"
              >
                Sign Out
              </button>
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 text-black hover:bg-gray-100 rounded-lg min-h-[44px] min-w-[44px] flex items-center justify-center"
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                )}
              </button>
            </div>
          </div>
          {mobileMenuOpen && (
            <div className="md:hidden mt-4 pb-4 border-t border-gray-200 pt-4 space-y-3">
              {profile && (
                <div className="text-sm text-gray-600 px-2">{profile.business_name || profile.email}</div>
              )}
              <Link
                href="/business/my-listings"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-4 py-3 text-black hover:bg-gray-50 rounded-lg font-medium min-h-[44px] flex items-center"
              >
                My Listings
              </Link>
              <Link
                href="/"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-4 py-3 text-black hover:bg-gray-50 rounded-lg font-medium min-h-[44px] flex items-center"
              >
                Shopping
              </Link>
              <button
                onClick={async () => {
                  await signOut()
                  window.location.href = '/business/login'
                  setMobileMenuOpen(false)
                }}
                className="w-full text-left px-4 py-3 border border-gray-300 text-black font-medium rounded-lg hover:bg-gray-50 min-h-[44px]"
              >
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    )
  }

  // Public B2C Header
  return (
    <div className="w-full bg-white border-b border-gray-200 sticky top-0 z-50">
      {/* Top Bar - Yellow background */}
      <div className="bg-yellow-400 px-4 py-2">
        <div className="flex items-center justify-between text-xs sm:text-sm">
          <Link href="/" className="text-black hover:text-gray-700 font-medium min-h-[44px] flex items-center">
            For Shopping
          </Link>
          <Link href="/business/login" className="text-black hover:text-gray-700 font-medium min-h-[44px] flex items-center">
            For Business
          </Link>
        </div>
      </div>

      {/* Main Header - White background */}
      <div className="px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center" onClick={() => setMobileMenuOpen(false)}>
            <Image 
              src="/logo.png" 
              alt="ZST Logo" 
              width={120} 
              height={120}
              className="object-contain w-16 h-16 md:w-24 md:h-24 lg:w-30 lg:h-30"
            />
          </Link>

          {/* Center Navigation - Desktop */}
          <div className="hidden md:flex items-center justify-center flex-1">
            <Link 
              href="/services" 
              className="text-black hover:text-gray-600 font-medium min-h-[44px] flex items-center px-4"
            >
              Services
            </Link>
          </div>

          {/* Right Side Utilities - Desktop */}
          <div className="hidden md:flex items-center gap-4 lg:gap-6">
            {/* Sell Product Link */}
            {user ? (
              <Link href="/business/dashboard" className="text-black hover:text-gray-600 font-medium min-h-[44px] flex items-center">
                Business Dashboard
              </Link>
            ) : (
              <Link href="/business/login" className="text-black hover:text-gray-600 font-medium min-h-[44px] flex items-center">
                Sell your product
              </Link>
            )}

            {/* Auth Buttons */}
            {user ? (
              <div className="flex items-center gap-3">
                {profile && (
                  <span className="text-sm text-gray-600">
                    {profile.business_name || profile.email}
                  </span>
                )}
                {/* Show My Orders for normal users */}
                {profile?.role === 'normal_user' && (
                  <Link
                    href="/my-orders"
                    className="px-4 py-2 text-black hover:text-gray-600 font-medium min-h-[44px] flex items-center"
                  >
                    My Orders
                  </Link>
                )}
                <button
                  onClick={async () => {
                    await signOut()
                    window.location.href = '/'
                  }}
                  className="px-4 py-2 border border-black text-black font-medium hover:bg-gray-50 transition-colors rounded-lg min-h-[44px]"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link 
                  href={pathname?.startsWith('/ar') ? "/ar/signup" : "/business/signup"} 
                  className="px-4 py-2 bg-black text-white font-medium hover:bg-gray-800 transition-colors rounded-lg min-h-[44px] flex items-center"
                >
                  Sign up
                </Link>
                <Link 
                  href={pathname?.startsWith('/ar') ? "/ar/login" : "/business/login"} 
                  className="px-4 py-2 border border-black text-black font-medium hover:bg-gray-50 transition-colors rounded-lg min-h-[44px] flex items-center"
                >
                  Log in
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-black hover:bg-gray-100 rounded-lg min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-4 pb-4 border-t border-gray-200 pt-4 space-y-3">
            <Link
              href="/services"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-4 py-3 text-black hover:bg-gray-50 rounded-lg font-medium min-h-[44px] flex items-center"
            >
              Services
            </Link>
            {user ? (
              <>
                {profile && (
                  <div className="text-sm text-gray-600 px-2">{profile.business_name || profile.email}</div>
                )}
                {/* Show My Orders for normal users */}
                {profile?.role === 'normal_user' && (
                  <Link
                    href="/my-orders"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-4 py-3 text-black hover:bg-gray-50 rounded-lg font-medium min-h-[44px] flex items-center"
                  >
                    My Orders
                  </Link>
                )}
                {/* Show Business Dashboard for business users */}
                {(profile?.role === 'importer' || profile?.role === 'wholesaler' || profile?.role === 'retailer') && (
                  <Link
                    href="/business/dashboard"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-4 py-3 text-black hover:bg-gray-50 rounded-lg font-medium min-h-[44px] flex items-center"
                  >
                    Business Dashboard
                  </Link>
                )}
                <button
                  onClick={async () => {
                    await signOut()
                    window.location.href = '/'
                    setMobileMenuOpen(false)
                  }}
                  className="w-full text-left px-4 py-3 border border-black text-black font-medium rounded-lg hover:bg-gray-50 min-h-[44px]"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/business/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-4 py-3 text-black hover:bg-gray-50 rounded-lg font-medium min-h-[44px] flex items-center"
                >
                  Sell your product
                </Link>
                <Link
                  href={pathname?.startsWith('/ar') ? "/ar/signup" : "/business/signup"}
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-4 py-3 bg-black text-white font-medium rounded-lg hover:bg-gray-800 min-h-[44px] flex items-center justify-center"
                >
                  Sign up
                </Link>
                <Link
                  href={pathname?.startsWith('/ar') ? "/ar/login" : "/business/login"}
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-4 py-3 border border-black text-black font-medium rounded-lg hover:bg-gray-50 min-h-[44px] flex items-center justify-center"
                >
                  Log in
                </Link>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}


