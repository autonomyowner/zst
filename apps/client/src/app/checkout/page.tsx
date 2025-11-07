"use client"

import { useState, useEffect, useCallback } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import Image from "next/image"
import { supabase } from "@/lib/supabase"
import type { ListingWithProduct } from "@/types/database"

// Force dynamic rendering to prevent caching
export const dynamic = 'force-dynamic'

export default function CheckoutPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const listingId = searchParams.get('listing')
  const quantityParam = searchParams.get('quantity')
  
  const [listing, setListing] = useState<ListingWithProduct | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [orderPlaced, setOrderPlaced] = useState(false)
  const [orderId, setOrderId] = useState<number | null>(null)
  
  const [formData, setFormData] = useState({
    customer_name: '',
    customer_address: '',
    customer_phone: '',
  })

  const quantity = quantityParam ? parseInt(quantityParam) : 1

  const fetchListing = useCallback(async () => {
    if (!supabase || !listingId) return

    try {
      setLoading(true)
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
        console.error('Error fetching listing:', error)
        router.push('/')
        return
      }

      setListing(data as ListingWithProduct)
    } catch (error) {
      console.error('Error:', error)
      router.push('/')
    } finally {
      setLoading(false)
    }
  }, [listingId, router])

  useEffect(() => {
    if (listingId) {
      fetchListing()
    } else {
      router.push('/')
    }
  }, [listingId, fetchListing, router])

  const getErrorMessage = (error: unknown): string => {
    if (!error) return 'Unknown error occurred'
    if (typeof error === 'string') return error
    if (error && typeof error === 'object') {
      const err = error as Record<string, unknown>
      if (err.message && typeof err.message === 'string') return err.message
      if (err.error_description && typeof err.error_description === 'string') return err.error_description
      if (err.details && typeof err.details === 'string') return err.details
      if (err.hint && typeof err.hint === 'string') return err.hint
      // Try to stringify if it's an object
      try {
        const errorStr = JSON.stringify(error)
        if (errorStr !== '{}') return errorStr
      } catch {
        // Ignore JSON stringify errors
      }
    }
    return 'Failed to place order. Please try again.'
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!supabase || !listing) return

    setSubmitting(true)

    try {
      // Validate stock availability
      if (listing.stock_quantity < quantity) {
        alert(`Sorry, only ${listing.stock_quantity} items available in stock.`)
        setSubmitting(false)
        return
      }

      // Create B2C order
      const { data: order, error: orderError } = await supabase
        .from('orders_b2c')
        .insert({
          customer_name: formData.customer_name,
          customer_address: formData.customer_address,
          customer_phone: formData.customer_phone,
          status: 'pending',
        })
        .select()
        .single()

      if (orderError) {
        const errorMsg = getErrorMessage(orderError)
        console.error('Error creating order:', {
          message: orderError.message,
          details: orderError.details,
          hint: orderError.hint,
          code: orderError.code,
          fullError: orderError
        })
        alert(`Failed to place order: ${errorMsg}`)
        setSubmitting(false)
        return
      }

      if (!order || !order.id) {
        console.error('Order created but no ID returned:', order)
        alert('Failed to place order: Order was not created properly.')
        setSubmitting(false)
        return
      }

      // Create order item
      const { error: itemError } = await supabase
        .from('order_items_b2c')
        .insert({
          order_id: order.id,
          listing_id: listing.id,
          quantity: quantity,
          price_at_purchase: listing.price,
        })

      if (itemError) {
        const errorMsg = getErrorMessage(itemError)
        console.error('Error creating order item:', {
          message: itemError.message,
          details: itemError.details,
          hint: itemError.hint,
          code: itemError.code,
          fullError: itemError
        })
        alert(`Failed to place order: ${errorMsg}`)
        setSubmitting(false)
        return
      }

      // Update stock quantity
      const { error: updateError } = await supabase
        .from('listings')
        .update({
          stock_quantity: listing.stock_quantity - quantity,
        })
        .eq('id', listing.id)

      if (updateError) {
        console.error('Error updating stock:', {
          message: updateError.message,
          details: updateError.details,
          hint: updateError.hint,
          code: updateError.code,
          fullError: updateError
        })
        // Don't fail the order if stock update fails, but log it
      }

      setOrderId(order.id)
      setOrderPlaced(true)
    } catch (error) {
      const errorMsg = getErrorMessage(error)
      console.error('Unexpected error:', error)
      alert(`Failed to place order: ${errorMsg}`)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-2 sm:px-4 py-4 sm:py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-6 sm:h-8 bg-gray-200 rounded w-1/2"></div>
          <div className="h-48 sm:h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  if (!listing) {
    return (
      <div className="max-w-2xl mx-auto px-2 sm:px-4 py-4 sm:py-8 text-center">
        <h1 className="text-xl sm:text-2xl font-bold mb-4">Product Not Found</h1>
        <button
          onClick={() => router.push('/')}
          className="text-blue-600 hover:underline min-h-[44px]"
        >
          Return to Home
        </button>
      </div>
    )
  }

  if (orderPlaced) {
    return (
      <div className="max-w-2xl mx-auto px-2 sm:px-4 py-4 sm:py-8">
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 sm:p-6 md:p-8 text-center">
          <div className="mb-4">
            <svg
              className="mx-auto h-12 w-12 sm:h-16 sm:w-16 text-green-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-green-800 mb-2">
            Thank You! Your Order is Confirmed
          </h1>
          <p className="text-base sm:text-lg text-gray-700 mb-4">
            Order ID: #{orderId}
          </p>
          <p className="text-sm sm:text-base text-gray-600 mb-6">
            We&apos;ve received your order and will process it shortly. You&apos;ll be contacted for delivery via Cash on Delivery.
          </p>
          <button
            onClick={() => router.push('/')}
            className="bg-black text-white font-medium py-3 px-6 rounded-lg hover:bg-gray-800 transition-colors min-h-[44px] w-full sm:w-auto"
          >
            Continue Shopping
          </button>
        </div>
      </div>
    )
  }

  const totalPrice = listing.price * quantity

  return (
    <div className="max-w-4xl mx-auto px-2 sm:px-4 py-4 sm:py-6 md:py-8">
      <h1 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6 md:mb-8">Checkout</h1>

      <div className="grid md:grid-cols-2 gap-4 sm:gap-6 md:gap-8">
        {/* Order Summary */}
        <div className="bg-gray-50 rounded-lg p-4 sm:p-6 h-fit order-2 md:order-1">
          <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">Order Summary</h2>
          <div className="space-y-4 mb-4 sm:mb-6">
            <div className="flex items-center gap-3 sm:gap-4">
              {listing.product.image_url && (
                <Image
                  src={listing.product.image_url}
                  alt={listing.product.name}
                  width={80}
                  height={80}
                  className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded flex-shrink-0"
                />
              )}
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-sm sm:text-base truncate">{listing.product.name}</h3>
                <p className="text-xs sm:text-sm text-gray-600">Quantity: {quantity}</p>
                <p className="text-base sm:text-lg font-bold">${listing.price.toFixed(2)}</p>
              </div>
            </div>
          </div>
          <div className="border-t pt-4">
            <div className="flex justify-between text-base sm:text-lg font-bold">
              <span>Total:</span>
              <span>${totalPrice.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Checkout Form */}
        <div className="order-1 md:order-2">
          <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">Delivery Information</h2>
          <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
            <div>
              <label htmlFor="customer_name" className="block text-sm font-medium text-gray-700 mb-1">
                Full Name *
              </label>
              <input
                type="text"
                id="customer_name"
                required
                value={formData.customer_name}
                onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent text-sm sm:text-base"
                placeholder="John Doe"
              />
            </div>

            <div>
              <label htmlFor="customer_phone" className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number *
              </label>
              <input
                type="tel"
                id="customer_phone"
                required
                value={formData.customer_phone}
                onChange={(e) => setFormData({ ...formData, customer_phone: e.target.value })}
                className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent text-sm sm:text-base"
                placeholder="+1234567890"
              />
            </div>

            <div>
              <label htmlFor="customer_address" className="block text-sm font-medium text-gray-700 mb-1">
                Full Address *
              </label>
              <textarea
                id="customer_address"
                required
                rows={4}
                value={formData.customer_address}
                onChange={(e) => setFormData({ ...formData, customer_address: e.target.value })}
                className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent text-sm sm:text-base resize-none"
                placeholder="Street address, City, State, ZIP code"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-yellow-400 text-black font-bold py-3 sm:py-4 px-4 sm:px-6 rounded-lg hover:bg-yellow-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base min-h-[44px]"
            >
              {submitting ? 'Placing Order...' : 'Place Order (Cash on Delivery)'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

