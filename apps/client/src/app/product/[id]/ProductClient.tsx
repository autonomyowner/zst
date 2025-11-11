"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { formatDZD } from "@/lib/utils/currency"
import type { ListingWithProduct } from "@/types/database"

interface ProductClientProps {
  listing: ListingWithProduct
}

export default function ProductClient({ listing }: ProductClientProps) {
  const router = useRouter()
  const [quantity, setQuantity] = useState(1)

  const handleOrderNow = () => {
    if (listing) {
      router.push(`/checkout?listing=${listing.id}&quantity=${quantity}`)
    }
  }

  const maxQuantity = Math.min(listing.stock_quantity, 10)

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 md:py-10 page-transition">
      <div className="grid md:grid-cols-2 gap-6 sm:gap-8 md:gap-10">
        {/* Product Image */}
        <div className="aspect-square bg-gray-100 rounded-xl overflow-hidden shadow-lg group">
          {listing.product.image_url ? (
            <Image
              src={listing.product.image_url}
              alt={listing.product.name}
              width={600}
              height={600}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div className="w-32 h-32 sm:w-40 sm:h-40 bg-gray-300 rounded-lg"></div>
            </div>
          )}
        </div>

        {/* Product Details */}
        <div className="space-y-6 sm:space-y-8">
          <div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-black mb-3">
              {listing.product.name}
            </h1>
            {listing.product.category && (
              <div className="flex items-center gap-3 mb-4">
                <span className="text-sm text-gray-600">Category:</span>
                <span className="badge badge-accent">{listing.product.category.name}</span>
              </div>
            )}
          </div>

          <div className="bg-gray-50 rounded-xl p-4 sm:p-6 border border-gray-200">
            <div className="flex items-baseline gap-3 mb-3">
              <p className="text-4xl sm:text-5xl font-bold text-black">
                {formatDZD(listing.price)}
              </p>
            </div>
            <div className="flex items-center gap-3">
              {listing.stock_quantity > 0 ? (
                <>
                  <span className="badge badge-success">In Stock</span>
                  <p className="text-sm text-gray-600">
                    {listing.stock_quantity} available
                  </p>
                </>
              ) : (
                <span className="badge badge-error">Out of Stock</span>
              )}
            </div>
          </div>

          {listing.product.description && (
            <div className="prose max-w-none">
              <h2 className="text-xl sm:text-2xl font-semibold mb-3">Description</h2>
              <p className="text-base sm:text-lg text-gray-700 leading-relaxed">
                {listing.product.description}
              </p>
            </div>
          )}

          {listing.stock_quantity > 0 && (
            <div className="space-y-6 bg-white rounded-xl p-4 sm:p-6 border border-gray-200 shadow-sm">
              <div>
                <label className="block text-base font-semibold text-gray-900 mb-3">
                  Quantity
                </label>
                <div className="flex items-center gap-4 flex-wrap">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1}
                    className="w-12 h-12 border-2 border-gray-300 rounded-lg flex items-center justify-center hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] min-w-[44px] transition-all duration-200 hover:scale-105 active:scale-95 font-semibold text-lg"
                    aria-label="Decrease quantity"
                  >
                    -
                  </button>
                  <span className="text-xl font-bold w-16 text-center min-h-[44px] flex items-center justify-center">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity(Math.min(maxQuantity, quantity + 1))}
                    disabled={quantity >= maxQuantity}
                    className="w-12 h-12 border-2 border-gray-300 rounded-lg flex items-center justify-center hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] min-w-[44px] transition-all duration-200 hover:scale-105 active:scale-95 font-semibold text-lg"
                    aria-label="Increase quantity"
                  >
                    +
                  </button>
                  <span className="text-sm text-gray-600 min-h-[44px] flex items-center">
                    Max: {maxQuantity}
                  </span>
                </div>
              </div>

              <button
                onClick={handleOrderNow}
                className="w-full bg-gradient-to-r from-yellow-400 to-amber-500 text-black font-bold py-4 px-6 rounded-xl hover:from-yellow-300 hover:to-amber-400 transition-all duration-200 text-lg shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98] min-h-[56px]"
                aria-label={`Order ${quantity} ${listing.product.name} for ${formatDZD(listing.price * quantity)}`}
              >
                Order Now (Cash on Delivery) - {formatDZD(listing.price * quantity)}
              </button>
            </div>
          )}

          {listing.stock_quantity === 0 && (
            <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 sm:p-6">
              <p className="text-base sm:text-lg text-red-800 font-semibold">
                This product is currently out of stock.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}







