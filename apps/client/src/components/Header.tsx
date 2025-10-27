"use client"

import Link from 'next/link'

export default function Header() {
  return (
    <div className="w-full bg-white border-b border-gray-200 sticky top-0 z-50">
      {/* Top Bar - Yellow background */}
      <div className="bg-yellow-400 px-4 py-2">
        <div className="flex items-center justify-between text-sm">
          <Link href="#" className="text-black hover:text-gray-700 font-medium">
            For Shopping
          </Link>
          <Link href="#" className="text-black hover:text-gray-700 font-medium">
            For Business
          </Link>
        </div>
      </div>

      {/* Main Header - White background */}
      <div className="px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl font-bold text-black">ZST</span>
            <div className="w-px h-6 bg-gray-400"></div>
            <span className="text-lg text-black">ecom.</span>
          </Link>

          {/* Right Side Utilities */}
          <div className="flex items-center gap-6">
            {/* Wishlist Icon */}
            <button className="p-2 hover:bg-gray-100 rounded-md transition-colors">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-black">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
              </svg>
            </button>

            {/* Cart Icon */}
            <button className="p-2 hover:bg-gray-100 rounded-md transition-colors">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-black">
                <path d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m0 0h9"/>
              </svg>
            </button>

            {/* Help Center Link */}
            <Link href="#" className="text-black hover:text-gray-600 font-medium">
              Help Center
            </Link>

            {/* Sell Product Link */}
            <Link href="#" className="text-black hover:text-gray-600 font-medium">
              Sell your product
            </Link>

            {/* Auth Buttons */}
            <div className="flex items-center gap-3">
              <Link 
                href="/signup" 
                className="px-4 py-2 bg-black text-white font-medium hover:bg-gray-800 transition-colors rounded-lg"
              >
                Sign up
              </Link>
              <Link 
                href="/login" 
                className="px-4 py-2 border border-black text-black font-medium hover:bg-gray-50 transition-colors rounded-lg"
              >
                Log in
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}


