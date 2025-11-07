"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { supabase } from "@/lib/supabase"
import type { ListingWithProduct } from "@/types/database"

// Force dynamic rendering to prevent caching
export const dynamic = 'force-dynamic'

export default function ProductDetailPage() {
  const params = useParams()
  const router = useRouter()
  const listingId = params.id as string
  const [listing, setListing] = useState<ListingWithProduct | null>(null)
  const [loading, setLoading] = useState(true)
  const [quantity, setQuantity] = useState(1)

  useEffect(() => {
    if (listingId) {
      fetchListing()
    }
  }, [listingId])

  const fetchListing = async (retries = 3) => {
    if (!supabase || !listingId) return

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        setLoading(true)
        
        // Force fresh query with cache-busting
        const { data, error } = await supabase
          .from('listings')
          .select(`
            *,
            product:products(*, category:categories(*))
          `)
          .eq('id', listingId)
          .eq('target_role', 'customer')
          .single()

        if (error) {
          if (attempt < retries) {
            console.warn(`Listing fetch attempt ${attempt} failed, retrying...`, error)
            await new Promise(resolve => setTimeout(resolve, 1000 * attempt))
            continue
          }
          console.error('Error fetching listing:', error)
          setLoading(false)
          return
        }

        setListing(data as ListingWithProduct)
        setLoading(false)
        return // Success, exit retry loop
      } catch (err: any) {
        if (attempt < retries) {
          console.warn(`Listing fetch attempt ${attempt} failed, retrying...`, err)
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt))
          continue
        }
        console.error('Error:', err)
        setLoading(false)
      }
    }
  }

  const handleOrderNow = () => {
    if (listing) {
      router.push(`/checkout?listing=${listing.id}&quantity=${quantity}`)
    }
  }

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-2 sm:px-4 py-4 sm:py-8">
        <div className="animate-pulse">
          <div className="grid md:grid-cols-2 gap-4 sm:gap-8">
            <div className="aspect-square bg-gray-200 rounded-lg"></div>
            <div className="space-y-4">
              <div className="h-6 sm:h-8 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              <div className="h-6 bg-gray-200 rounded w-1/4"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!listing) {
    return (
      <div className="max-w-6xl mx-auto px-2 sm:px-4 py-4 sm:py-8 text-center">
        <h1 className="text-xl sm:text-2xl font-bold mb-4">Product Not Found</h1>
        <Link href="/" className="text-blue-600 hover:underline min-h-[44px] inline-flex items-center">
          Return to Home
        </Link>
      </div>
    )
  }

  const maxQuantity = Math.min(listing.stock_quantity, 10)

  return (
    <div className="max-w-6xl mx-auto px-2 sm:px-4 py-4 sm:py-6 md:py-8">
      <div className="grid md:grid-cols-2 gap-4 sm:gap-6 md:gap-8">
        {/* Product Image */}
        <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
          {listing.product.image_url ? (
            <Image
              src={listing.product.image_url}
              alt={listing.product.name}
              width={600}
              height={600}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div className="w-24 h-24 sm:w-32 sm:h-32 bg-gray-300 rounded"></div>
            </div>
          )}
        </div>

        {/* Product Details */}
        <div className="space-y-4 sm:space-y-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-black mb-2">
              {listing.product.name}
            </h1>
            {listing.product.category && (
              <p className="text-gray-600 text-xs sm:text-sm">
                Category: {listing.product.category.name}
              </p>
            )}
          </div>

          <div>
            <p className="text-3xl sm:text-4xl font-bold text-black mb-2">
              ${listing.price.toFixed(2)}
            </p>
            <p className="text-xs sm:text-sm text-gray-600">
              {listing.stock_quantity > 0 
                ? `${listing.stock_quantity} in stock`
                : 'Out of stock'}
            </p>
          </div>

          {listing.product.description && (
            <div>
              <h2 className="text-lg sm:text-xl font-semibold mb-2">Description</h2>
              <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
                {listing.product.description}
              </p>
            </div>
          )}

          {listing.stock_quantity > 0 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quantity
                </label>
                <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1}
                    className="w-12 h-12 sm:w-10 sm:h-10 border border-gray-300 rounded-md flex items-center justify-center hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] min-w-[44px]"
                  >
                    -
                  </button>
                  <span className="text-base sm:text-lg font-medium w-12 text-center min-h-[44px] flex items-center justify-center">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity(Math.min(maxQuantity, quantity + 1))}
                    disabled={quantity >= maxQuantity}
                    className="w-12 h-12 sm:w-10 sm:h-10 border border-gray-300 rounded-md flex items-center justify-center hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] min-w-[44px]"
                  >
                    +
                  </button>
                  <span className="text-xs sm:text-sm text-gray-600 min-h-[44px] flex items-center">
                    Max: {maxQuantity}
                  </span>
                </div>
              </div>

              <button
                onClick={handleOrderNow}
                className="w-full bg-yellow-400 text-black font-bold py-3 sm:py-4 px-4 sm:px-6 rounded-lg hover:bg-yellow-300 transition-colors text-base sm:text-lg min-h-[44px]"
              >
                Order Now (Cash on Delivery)
              </button>
            </div>
          )}

          {listing.stock_quantity === 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 sm:p-4">
              <p className="text-sm sm:text-base text-red-800 font-medium">
                This product is currently out of stock.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

