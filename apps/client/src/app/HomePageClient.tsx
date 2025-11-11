"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import Link from "next/link"
import Image from "next/image"
import { useAuth } from "@/contexts/OptimizedAuthContext"
import { formatDZD } from "@/lib/utils/currency"
import type { ListingWithProduct, Category } from "@/types/database"

interface HomePageClientProps {
  initialListings: ListingWithProduct[]
  initialCategories: Category[]
}

export default function HomePageClient({ initialListings, initialCategories }: HomePageClientProps) {
  const { user } = useAuth()
  const [listings, setListings] = useState<ListingWithProduct[]>(initialListings)
  const [categories] = useState<Category[]>(initialCategories)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Update listings when initialListings prop changes (from server revalidation)
  useEffect(() => {
    setListings(initialListings)
  }, [initialListings])

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
    <main className="space-section-sm page-transition">
      {/* Hero Section */}
      <section className="py-6 sm:py-8 md:py-12 mt-4 sm:mt-6">
        <div className="bg-gradient-to-br from-black via-gray-900 to-black text-white px-4 sm:px-6 py-10 sm:py-12 md:py-16 rounded-xl sm:rounded-2xl mx-1 shadow-xl">
          <div className="max-w-none mx-auto px-1 sm:px-2">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 md:gap-10 items-center">
              {/* Left Side - Value Proposition */}
              <div className="lg:col-span-2 space-y-4 sm:space-y-6 text-center lg:text-left animate-fade-in">
                <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
                  Quality Products,<br />
                  <span className="text-yellow-400">Trusted Suppliers</span>
                </h1>
                <p className="text-base sm:text-lg md:text-xl text-gray-300 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
                  Find everything you need for your business from verified global suppliers. 
                  Enjoy secure transactions and reliable delivery.
                </p>
                
                {/* Search Bar */}
                <form onSubmit={handleSearch} className="flex items-center bg-white rounded-lg p-1.5 sm:p-2 w-full max-w-2xl mx-auto lg:mx-0 shadow-lg" aria-label="Search products">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-400 ml-3 sm:ml-4 flex-shrink-0" aria-hidden="true">
                    <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                  </svg>
                  <input 
                    type="text" 
                    placeholder="Search for any product or brand"
                    className="flex-1 px-3 sm:px-4 py-2 sm:py-2.5 text-black placeholder-gray-500 outline-none text-sm sm:text-base"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    aria-label="Search input"
                  />
                  <button 
                    type="submit" 
                    className="bg-yellow-400 text-black p-2 sm:p-2.5 rounded-md hover:bg-yellow-300 transition-all duration-200 hover:scale-105 active:scale-95 min-h-[44px] min-w-[44px] flex items-center justify-center flex-shrink-0 shadow-md"
                    aria-label="Submit search"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                      <path d="M5 12h14m-7-7l7 7-7 7"/>
                    </svg>
                  </button>
                </form>
              </div>

              {/* Right Side - Product Grid */}
              <div className="lg:col-span-1 grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 md:gap-5 relative overflow-hidden">
                {listings.slice(0, 6).map((listing, index) => (
                  <Link 
                    key={listing.id} 
                    href={`/product/${listing.id}`}
                    className="block animate-scale-in"
                    style={{ animationDelay: `${index * 100}ms` }}
                    aria-label={`View ${listing.product.name}`}
                  >
                    <div 
                      className="relative rounded-lg h-24 sm:h-28 md:h-36 cursor-pointer hover:shadow-xl transition-all duration-300 overflow-hidden group"
                      style={{
                        backgroundImage: listing.product.image_url ? `url(${listing.product.image_url})` : 'none',
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        backgroundColor: listing.product.image_url ? 'transparent' : '#e5e7eb'
                      }}
                    >
                      {!listing.product.image_url && (
                        <div className="w-full h-full flex items-center justify-center">
                          <div className="w-10 h-10 bg-gray-300 rounded"></div>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300"></div>
                      <div className="absolute bottom-0 left-0 right-0 glass-overlay p-2 sm:p-3">
                        <p className="text-sm sm:text-base font-bold text-white drop-shadow-lg">
                          {formatDZD(listing.price)}
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
      <section className="py-6 sm:py-8 md:py-10 bg-white space-section-sm">
        <div className="px-2 sm:px-4">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-black mb-6 sm:mb-8">Categories</h2>
          <div className="flex gap-3 sm:gap-4 mb-6 sm:mb-8 overflow-x-auto pb-3 scrollbar-hide -mx-2 sm:mx-0 px-2 sm:px-0">
            <button
              onClick={() => setSelectedCategoryId(null)}
              className={`px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg font-semibold transition-all duration-200 whitespace-nowrap min-h-[44px] flex items-center shadow-sm ${
                selectedCategoryId === null
                  ? 'bg-black text-white shadow-md hover:shadow-lg transform hover:scale-105'
                  : 'bg-gray-100 text-black hover:bg-gray-200 hover:shadow-md'
              }`}
              aria-label="Show all products"
            >
              All Products
            </button>
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategoryId(category.id)}
                className={`px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg font-semibold transition-all duration-200 whitespace-nowrap min-h-[44px] flex items-center shadow-sm ${
                  selectedCategoryId === category.id
                    ? 'bg-black text-white shadow-md hover:shadow-lg transform hover:scale-105'
                    : 'bg-gray-100 text-black hover:bg-gray-200 hover:shadow-md'
                }`}
                aria-label={`Filter by ${category.name}`}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Product Grid Section */}
      <section className="py-6 sm:py-8 md:py-10 bg-white space-section-sm">
        <div className="px-2 sm:px-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 sm:mb-8 gap-3">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-black">
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
                className="text-sm sm:text-base text-gray-600 hover:text-black min-h-[44px] self-start sm:self-auto font-medium underline underline-offset-2 transition-colors"
                aria-label="Clear all filters"
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
            <div className="empty-state">
              <svg
                className="empty-state-icon mx-auto text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <h3 className="empty-state-title">
                {searchQuery ? 'No products found matching your search.' : 'No products available at the moment.'}
              </h3>
              {searchQuery && (
                <button
                  onClick={() => {
                    setSearchQuery("")
                    setSelectedCategoryId(null)
                  }}
                  className="text-sm sm:text-base text-yellow-600 hover:text-yellow-700 font-medium underline underline-offset-2 mt-2 min-h-[44px] transition-colors"
                  aria-label="Clear search and filters"
                >
                  Clear search and filters
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 md:gap-5">
              {filteredListings.map((listing, index) => (
                <Link
                  key={listing.id}
                  href={`/product/${listing.id}`}
                  className="relative rounded-xl overflow-hidden hover:shadow-xl transition-all duration-300 aspect-square group animate-scale-in"
                  style={{ 
                    animationDelay: `${index * 50}ms`,
                    backgroundImage: listing.product.image_url ? `url(${listing.product.image_url})` : 'none',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundColor: listing.product.image_url ? 'transparent' : '#f3f4f6'
                  }}
                  aria-label={`View ${listing.product.name} - ${formatDZD(listing.price)}`}
                >
                  {!listing.product.image_url && (
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="w-16 h-16 bg-gray-200 rounded-lg"></div>
                    </div>
                  )}
                  {/* Stock badge */}
                  {listing.stock_quantity < 10 && listing.stock_quantity > 0 && (
                    <div className="absolute top-2 right-2 badge badge-warning">
                      Low Stock
                    </div>
                  )}
                  {listing.stock_quantity === 0 && (
                    <div className="absolute top-2 right-2 badge badge-error">
                      Out of Stock
                    </div>
                  )}
                  {/* Overlay gradient */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="absolute bottom-0 left-0 right-0 glass-overlay p-3 sm:p-4">
                    <h3 className="text-sm sm:text-base font-semibold text-white drop-shadow-lg line-clamp-2 mb-2">
                      {listing.product.name}
                    </h3>
                    <p className="text-lg sm:text-xl md:text-2xl font-bold text-yellow-400 drop-shadow-lg mb-2">
                      {formatDZD(listing.price)}
                    </p>
                    {listing.stock_quantity > 0 && (
                      <p className="text-xs sm:text-sm text-white/90 drop-shadow-md">
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







