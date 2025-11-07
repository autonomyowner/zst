"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import Link from "next/link"
import Image from "next/image"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/contexts/AuthContext"
import type { ListingWithProduct, Category } from "@/types/database"

// Force dynamic rendering to prevent caching
export const dynamic = 'force-dynamic'

export default function LandingPage() {
  const { user, profile, loading: authLoading } = useAuth()
  const [listings, setListings] = useState<ListingWithProduct[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const lastFetchTimeRef = useRef(0) // Track last fetch time for focus/visibility refetching

  // Memoize fetch functions to prevent unnecessary re-renders
  const fetchListings = useCallback(async (retries = 3) => {
    if (!supabase) return
    
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        setLoading(true)
        setError(null) // Clear previous errors
        
        // Determine target_role based on user's role
        // Non-authenticated users (customers) see only 'customer' listings
        // Authenticated business users should be redirected to business dashboard
        // But if they're on the main page, we'll still only show customer listings
        const targetRole: 'customer' | 'retailer' | 'wholesaler' = 'customer'
        
        // Force fresh query with cache-busting
        const { data, error: supabaseError } = await supabase
          .from('listings')
          .select(`
            *,
            product:products(*, category:categories(*))
          `)
          .eq('target_role', targetRole) // Always 'customer' for main page
          .gt('stock_quantity', 0)
          .order('created_at', { ascending: false })
          .limit(100)

        if (supabaseError) {
          // Retry on error unless it's the last attempt
          if (attempt < retries) {
            console.warn(`Listings fetch attempt ${attempt} failed, retrying...`, supabaseError)
            await new Promise(resolve => setTimeout(resolve, 1000 * attempt))
            continue
          }
          console.error('Error fetching listings:', supabaseError)
          setError(`Failed to load products: ${supabaseError.message}`)
          setLoading(false)
          return
        }

        // Additional client-side filtering to ensure hierarchy compliance
        // Filter out any listings that don't match the expected target_role
        const filteredData = (data || []).filter((listing: ListingWithProduct) => {
          // Only show 'customer' listings on the main page
          // This ensures that even if RLS policies are bypassed, we maintain hierarchy
          return listing.target_role === 'customer'
        })

        setListings(filteredData as ListingWithProduct[])
        setLoading(false)
        return // Success, exit retry loop
      } catch (err: unknown) {
        if (attempt < retries) {
          console.warn(`Listings fetch attempt ${attempt} failed, retrying...`, err)
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt))
          continue
        }
        const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred while loading products.'
        console.error('Error:', err)
        setError(errorMessage)
        setLoading(false)
      }
    }
  }, [user]) // Refetch when auth state changes

  const fetchCategories = useCallback(async (retries = 3) => {
    if (!supabase) return

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        // Force fresh query with cache-busting
        const { data, error: supabaseError } = await supabase
          .from('categories')
          .select('*')
          .order('name')

        if (supabaseError) {
          if (attempt < retries) {
            console.warn(`Categories fetch attempt ${attempt} failed, retrying...`, supabaseError)
            await new Promise(resolve => setTimeout(resolve, 1000 * attempt))
            continue
          }
          console.error('Error fetching categories:', supabaseError)
          setError(`Failed to load categories: ${supabaseError.message}`)
          return
        }

        setCategories(data || [])
        return // Success, exit retry loop
      } catch (err: unknown) {
        if (attempt < retries) {
          console.warn(`Categories fetch attempt ${attempt} failed, retrying...`, err)
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt))
          continue
        }
        const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred while loading categories.'
        console.error('Error:', err)
        setError(errorMessage)
      }
    }
  }, [user]) // Refetch when auth state changes

  // Refetch data when auth state changes or when auth loading completes
  useEffect(() => {
    if (!authLoading) {
      fetchListings()
      fetchCategories()
      lastFetchTimeRef.current = Date.now() // Track initial fetch time
    }
  }, [authLoading, user, fetchListings, fetchCategories])

  // Refetch data when page becomes visible or window gains focus
  useEffect(() => {
    const REFETCH_INTERVAL = 30000 // Refetch if more than 30 seconds since last fetch
    let visibilityTimeout: NodeJS.Timeout | null = null

    const shouldRefetch = () => {
      const now = Date.now()
      // Only refetch if it's been more than 30 seconds since last fetch
      return (now - lastFetchTimeRef.current) > REFETCH_INTERVAL
    }

    const handleRefetch = () => {
      if (!authLoading && shouldRefetch()) {
        // Clear any pending timeout
        if (visibilityTimeout) {
          clearTimeout(visibilityTimeout)
        }
        // Debounce rapid visibility/focus changes
        visibilityTimeout = setTimeout(() => {
          fetchListings(2) // Use fewer retries for visibility refresh
          fetchCategories(2)
          lastFetchTimeRef.current = Date.now()
        }, 500)
      }
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        handleRefetch()
      }
    }

    const handleFocus = () => {
      handleRefetch()
    }

    // Listen for visibility changes (tab switching)
    document.addEventListener('visibilitychange', handleVisibilityChange)
    // Listen for window focus (browser tab/window focus)
    window.addEventListener('focus', handleFocus)

    return () => {
      if (visibilityTimeout) {
        clearTimeout(visibilityTimeout)
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('focus', handleFocus)
    }
  }, [authLoading, fetchListings, fetchCategories])


  const filteredListings = listings.filter(listing => {
    // Filter by category
    if (selectedCategoryId !== null) {
      if (listing.product.category_id !== selectedCategoryId) {
        return false
      }
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      const matchesSearch = listing.product.name.toLowerCase().includes(query) ||
                           listing.product.description?.toLowerCase().includes(query)
      if (!matchesSearch) {
        return false
      }
    }

    return true
  })

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    // Search is handled by filteredListings
  }

  return (
    <main className="space-y-2 sm:space-y-4">
      {/* Hero Section */}
      <section className="py-4 sm:py-6 md:py-8 mt-2 sm:mt-4">
        <div className="bg-black text-white px-4 sm:px-6 py-8 sm:py-10 md:py-12 rounded-xl sm:rounded-2xl mx-1">
          <div className="max-w-none mx-auto px-1 sm:px-2">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8 items-center">
              {/* Left Side - Value Proposition */}
              <div className="lg:col-span-2 space-y-3 sm:space-y-4 text-center lg:text-left">
                <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold leading-tight">
                  Quality Products,<br />
                  Trusted Suppliers
                </h1>
                <p className="text-sm sm:text-base md:text-base lg:text-lg text-gray-300 max-w-lg mx-auto lg:mx-0">
                  Find everything you need for your business from verified global suppliers. 
                  Enjoy secure transactions and reliable delivery.
                </p>
                
                {/* Search Bar */}
                <form onSubmit={handleSearch} className="flex items-center bg-white rounded-lg p-1 sm:p-1.5 w-full max-w-lg mx-auto lg:mx-0">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-400 ml-2 sm:ml-2 flex-shrink-0">
                    <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                  </svg>
                  <input 
                    type="text" 
                    placeholder="Search for any product or brand"
                    className="flex-1 px-2 sm:px-2 py-1.5 sm:py-1.5 text-black placeholder-gray-500 outline-none text-xs sm:text-sm"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <button type="submit" className="bg-yellow-400 text-black p-1.5 sm:p-1.5 rounded-md hover:bg-yellow-300 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center flex-shrink-0">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M5 12h14m-7-7l7 7-7 7"/>
                    </svg>
                  </button>
                </form>
              </div>

              {/* Right Side - Product Grid */}
              <div className="lg:col-span-1 grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3 md:gap-4 relative overflow-hidden">
                {listings.slice(0, 6).map((listing, index) => (
                  <Link key={listing.id} href={`/product/${listing.id}`} className="block">
                    <div 
                      className="relative rounded-lg h-20 sm:h-24 md:h-32 cursor-pointer hover:shadow-lg transition-shadow overflow-hidden"
                      style={{
                        backgroundImage: listing.product.image_url ? `url(${listing.product.image_url})` : 'none',
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        backgroundColor: listing.product.image_url ? 'transparent' : '#e5e7eb'
                      }}
                    >
                      {!listing.product.image_url && (
                        <div className="w-full h-full flex items-center justify-center">
                          <div className="w-8 h-8 bg-gray-300 rounded"></div>
                        </div>
                      )}
                      <div className="absolute bottom-0 left-0 right-0 glass-overlay p-1.5 sm:p-2">
                        <p className="text-xs sm:text-sm font-bold text-white drop-shadow-md">
                          ${listing.price.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-4 sm:py-6 bg-white">
        <div className="px-2 sm:px-4">
          <h2 className="text-xl sm:text-2xl font-bold text-black mb-3 sm:mb-4">Categories</h2>
          <div className="flex gap-2 sm:gap-3 mb-4 sm:mb-6 overflow-x-auto pb-2 scrollbar-hide -mx-2 sm:mx-0 px-2 sm:px-0">
            <button
              onClick={() => setSelectedCategoryId(null)}
              className={`px-3 sm:px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap min-h-[44px] flex items-center ${
                selectedCategoryId === null
                  ? 'bg-black text-white'
                  : 'bg-gray-100 text-black hover:bg-gray-200'
              }`}
            >
              All Products
            </button>
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategoryId(category.id)}
                className={`px-3 sm:px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap min-h-[44px] flex items-center ${
                  selectedCategoryId === category.id
                    ? 'bg-black text-white'
                    : 'bg-gray-100 text-black hover:bg-gray-200'
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Product Grid Section */}
      <section className="py-4 sm:py-6 bg-white">
        <div className="px-2 sm:px-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3 sm:mb-4 gap-2">
            <h2 className="text-xl sm:text-2xl font-bold text-black">
              {selectedCategoryId !== null
                ? categories.find(c => c.id === selectedCategoryId)?.name || 'Products'
                : searchQuery
                ? `Search Results for "${searchQuery}"`
                : 'All Products'}
            </h2>
            {(searchQuery || selectedCategoryId !== null) && (
              <button
                onClick={() => {
                  setSearchQuery("")
                  setSelectedCategoryId(null)
                }}
                className="text-sm text-gray-600 hover:text-black min-h-[44px] self-start sm:self-auto"
              >
                Clear filters
              </button>
            )}
          </div>

          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3">
              {Array.from({ length: 10 }, (_, i) => (
                <div key={i} className="bg-gray-100 border border-gray-200 rounded-lg p-2 sm:p-3 animate-pulse">
                  <div className="aspect-square bg-gray-200 rounded-lg mb-2"></div>
                  <div className="h-3 sm:h-4 bg-gray-200 rounded mb-1"></div>
                  <div className="h-3 sm:h-4 bg-gray-200 rounded w-2/3"></div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-8 sm:py-12 bg-red-50 border border-red-200 text-red-800 rounded-lg p-4">
              <p className="text-base sm:text-lg font-medium">Error: {error}</p>
              <p className="text-xs sm:text-sm text-red-700 mt-2">Please try again later.</p>
            </div>
          ) : filteredListings.length === 0 ? (
            <div className="text-center py-8 sm:py-12 bg-gray-50 border border-gray-200 rounded-lg p-4 sm:p-8">
              <svg
                className="mx-auto h-12 w-12 sm:h-16 sm:w-16 text-gray-400 mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <p className="text-gray-700 text-base sm:text-xl font-semibold mb-2">
                {searchQuery ? 'No products found matching your search.' : 'No products available at the moment.'}
              </p>
              {searchQuery && (
                <button
                  onClick={() => {
                    setSearchQuery("")
                    setSelectedCategoryId(null)
                  }}
                  className="text-sm text-blue-600 hover:underline mt-2 min-h-[44px]"
                >
                  Clear search and filters
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3">
              {filteredListings.map((listing) => (
                <Link
                  key={listing.id}
                  href={`/product/${listing.id}`}
                  className="relative rounded-lg overflow-hidden hover:shadow-lg transition-shadow aspect-square"
                  style={{
                    backgroundImage: listing.product.image_url ? `url(${listing.product.image_url})` : 'none',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundColor: listing.product.image_url ? 'transparent' : '#f3f4f6'
                  }}
                >
                  {!listing.product.image_url && (
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="w-12 h-12 bg-gray-200 rounded"></div>
                    </div>
                  )}
                  <div className="absolute bottom-0 left-0 right-0 glass-overlay p-2 sm:p-3">
                    <h3 className="text-xs sm:text-sm font-medium text-white drop-shadow-md line-clamp-2 mb-1">
                      {listing.product.name}
                    </h3>
                    <p className="text-base sm:text-lg font-bold text-white drop-shadow-md mb-1">
                      ${listing.price.toFixed(2)}
                    </p>
                    {listing.product.description && (
                      <p className="text-xs text-white/90 drop-shadow-md line-clamp-2 mb-1">
                        {listing.product.description}
                      </p>
                    )}
                    {listing.stock_quantity > 0 && (
                      <p className="text-xs text-white/80 drop-shadow-md">
                        {listing.stock_quantity} in stock
                      </p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  )
}
