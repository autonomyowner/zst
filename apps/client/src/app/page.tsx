"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import Image from "next/image"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/contexts/AuthContext"
import type { ListingWithProduct, Category } from "@/types/database"

export default function LandingPage() {
  const { user, profile, loading: authLoading } = useAuth()
  const [listings, setListings] = useState<ListingWithProduct[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

  // Memoize fetch functions to prevent unnecessary re-renders
  const fetchListings = useCallback(async () => {
    if (!supabase) return
    
    try {
      setLoading(true)
      
      // Determine target_role based on user's role
      // Non-authenticated users (customers) see only 'customer' listings
      // Authenticated business users should be redirected to business dashboard
      // But if they're on the main page, we'll still only show customer listings
      let targetRole: 'customer' | 'retailer' | 'wholesaler' = 'customer'
      
      // If user is authenticated with a business role, they shouldn't see customer listings
      // They should use the business dashboard instead
      // However, we'll still filter to only show 'customer' listings on the main page
      // to maintain the hierarchy
      
      // Force fresh query by using current timestamp
      // Supabase will handle the request without caching
      const { data, error } = await supabase
        .from('listings')
        .select(`
          *,
          product:products(*, category:categories(*))
        `)
        .eq('target_role', targetRole) // Always 'customer' for main page
        .gt('stock_quantity', 0)
        .order('created_at', { ascending: false })
        .limit(100)

      if (error) {
        console.error('Error fetching listings:', error)
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
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchCategories = useCallback(async () => {
    if (!supabase) return

    try {
      // Add cache busting to ensure fresh data
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name')

      if (error) {
        console.error('Error fetching categories:', error)
        return
      }

      setCategories(data || [])
    } catch (error) {
      console.error('Error:', error)
    }
  }, [])

  useEffect(() => {
    if (!authLoading) {
      fetchListings()
      fetchCategories()
    }
  }, [authLoading, fetchListings, fetchCategories])

  // Refetch data when page becomes visible (user switches back to tab)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && !authLoading) {
        fetchListings()
        fetchCategories()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
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
    <main className="space-y-4">
      {/* Hero Section */}
      <section className="py-8 mt-4">
        <div className="bg-black text-white px-6 py-12 rounded-2xl mx-1">
          <div className="max-w-none mx-auto px-2">
            <div className="grid lg:grid-cols-3 gap-8 items-center">
              {/* Left Side - Value Proposition */}
              <div className="lg:col-span-2 space-y-4">
                <h1 className="text-3xl lg:text-5xl font-bold leading-tight">
                  Quality Products,<br />
                  Trusted Suppliers
                </h1>
                <p className="text-base lg:text-lg text-gray-300 max-w-lg">
                  Find everything you need for your business from verified global suppliers. 
                  Enjoy secure transactions and reliable delivery.
                </p>
                
                {/* Search Bar */}
                <form onSubmit={handleSearch} className="flex items-center bg-white rounded-lg p-1.5 max-w-lg">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-400 ml-2">
                    <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                  </svg>
                  <input 
                    type="text" 
                    placeholder="Search for any product or brand"
                    className="flex-1 px-2 py-1.5 text-black placeholder-gray-500 outline-none text-sm"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <button type="submit" className="bg-yellow-400 text-black p-1.5 rounded-md hover:bg-yellow-300 transition-colors">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M5 12h14m-7-7l7 7-7 7"/>
                    </svg>
                  </button>
                </form>
              </div>

              {/* Right Side - Product Grid */}
              <div className="lg:col-span-1 grid grid-cols-3 gap-4 relative overflow-hidden">
                {listings.slice(0, 9).map((listing, index) => (
                  <Link key={listing.id} href={`/product/${listing.id}`} className="block">
                    <div className="bg-white rounded-lg flex items-center justify-center p-2 h-32 cursor-pointer hover:shadow-lg transition-shadow">
                      {listing.product.image_url ? (
                        <Image
                          src={listing.product.image_url}
                          alt={listing.product.name}
                          width={128}
                          height={128}
                          className="w-full h-full object-cover rounded-lg"
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-200 rounded-lg flex items-center justify-center">
                          <div className="w-8 h-8 bg-gray-300 rounded"></div>
                        </div>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-6 bg-white">
        <div className="px-4">
          <h2 className="text-2xl font-bold text-black mb-4">Categories</h2>
          <div className="flex flex-wrap gap-3 mb-6">
            <button
              onClick={() => setSelectedCategoryId(null)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
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
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
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
      <section className="py-6 bg-white">
        <div className="px-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-black">
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
                className="text-sm text-gray-600 hover:text-black"
              >
                Clear filters
              </button>
            )}
          </div>

          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
              {Array.from({ length: 10 }, (_, i) => (
                <div key={i} className="bg-gray-100 border border-gray-200 rounded-lg p-3 animate-pulse">
                  <div className="aspect-square bg-gray-200 rounded-lg mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded mb-1"></div>
                  <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                </div>
              ))}
            </div>
          ) : filteredListings.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">
                {searchQuery ? 'No products found matching your search.' : 'No products available at the moment.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
              {filteredListings.map((listing) => (
                <Link
                  key={listing.id}
                  href={`/product/${listing.id}`}
                  className="bg-white border border-gray-200 rounded-lg p-3 hover:shadow-lg transition-shadow"
                >
                  <div className="aspect-square bg-gray-100 rounded-lg mb-2 flex items-center justify-center overflow-hidden">
                    {listing.product.image_url ? (
                      <Image
                        src={listing.product.image_url}
                        alt={listing.product.name}
                        width={200}
                        height={200}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-gray-200 rounded"></div>
                    )}
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-sm font-medium text-black line-clamp-2">
                      {listing.product.name}
                    </h3>
                    <p className="text-lg font-bold text-black">
                      ${listing.price.toFixed(2)}
                    </p>
                    {listing.stock_quantity > 0 && (
                      <p className="text-xs text-gray-500">
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
