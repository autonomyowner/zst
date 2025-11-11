"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { supabase } from "@/lib/supabase"
import { formatDZD } from "@/lib/utils/currency"
import { isAdmin } from "@/lib/auth"
import type { OrderB2C, OrderB2B, OrderB2CWithItems, OrderB2BWithItems } from "@/types/database"

// Force dynamic rendering to prevent caching
export const dynamic = 'force-dynamic'

export default function AdminOrdersPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'b2c' | 'b2b'>('b2c')
  const [b2cOrders, setB2cOrders] = useState<OrderB2CWithItems[]>([])
  const [b2bOrders, setB2bOrders] = useState<OrderB2BWithItems[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkAuthAndLoadOrders()
  }, [activeTab])

  const checkAuthAndLoadOrders = async () => {
    const admin = await isAdmin()
    if (!admin) {
      router.push('/admin/login')
      return
    }
    await fetchOrders()
  }

  const fetchOrders = async () => {
    if (!supabase) return
    setLoading(true)

    if (activeTab === 'b2c') {
      const { data } = await supabase
        .from('orders_b2c')
        .select(`
          *,
          items:order_items_b2c(*, listing:listings(*, product:products(*)))
        `)
        .order('created_at', { ascending: false })
      setB2cOrders((data || []) as OrderB2CWithItems[])
    } else {
      const { data } = await supabase
        .from('orders_b2b')
        .select(`
          *,
          items:order_items_b2b(*, listing:listings(*, product:products(*))),
          buyer:profiles!buyer_id(*),
          seller:profiles!seller_id(*)
        `)
        .order('created_at', { ascending: false })
      setB2bOrders((data || []) as OrderB2BWithItems[])
    }
    setLoading(false)
  }

  const updateOrderStatus = async (orderId: number, status: string, type: 'b2c' | 'b2b') => {
    if (!supabase) return
    const table = type === 'b2c' ? 'orders_b2c' : 'orders_b2b'
    await supabase.from(table).update({ status }).eq('id', orderId)
    await fetchOrders()
  }

  return (
    <div className="max-w-7xl mx-auto px-2 sm:px-4 py-4 sm:py-6 md:py-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 md:mb-8 gap-3">
        <h1 className="text-2xl sm:text-3xl font-bold">Manage Orders</h1>
        <Link href="/admin/dashboard" className="px-3 sm:px-4 py-2 border rounded-lg text-sm sm:text-base min-h-[44px] flex items-center justify-center sm:justify-start">Back</Link>
      </div>

      <div className="flex gap-2 sm:gap-4 mb-4 sm:mb-6 border-b">
        <button
          onClick={() => setActiveTab('b2c')}
          className={`px-3 sm:px-4 py-2 text-sm sm:text-base min-h-[44px] ${activeTab === 'b2c' ? 'border-b-2 border-black font-semibold' : ''}`}
        >
          B2C Orders
        </button>
        <button
          onClick={() => setActiveTab('b2b')}
          className={`px-3 sm:px-4 py-2 text-sm sm:text-base min-h-[44px] ${activeTab === 'b2b' ? 'border-b-2 border-black font-semibold' : ''}`}
        >
          B2B Orders
        </button>
      </div>

      {loading ? (
        <div className="text-sm sm:text-base">Loading...</div>
      ) : activeTab === 'b2c' ? (
        <div className="space-y-3 sm:space-y-4">
          {b2cOrders.map((order) => (
            <div key={order.id} className="bg-white border rounded-lg p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-3 sm:mb-4 gap-3">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-base sm:text-lg mb-1">Order #{order.id}</h3>
                  <p className="text-xs sm:text-sm text-gray-600">{order.customer_name}</p>
                  <p className="text-xs sm:text-sm text-gray-600">{order.customer_phone}</p>
                  <p className="text-xs sm:text-sm text-gray-600 break-words">{order.customer_address}</p>
                </div>
                <div className="flex items-center gap-3">
                  <select
                    value={order.status}
                    onChange={(e) => updateOrderStatus(order.id, e.target.value, 'b2c')}
                    className="px-3 py-2 border rounded-lg text-sm sm:text-base min-h-[44px] w-full sm:w-auto"
                  >
                    <option value="pending">Pending</option>
                    <option value="shipped">Shipped</option>
                    <option value="delivered">Delivered</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                {order.items?.map((item) => (
                  <div key={item.id} className="flex justify-between text-xs sm:text-sm">
                    <span className="flex-1 min-w-0 pr-2">{item.listing?.product?.name} x {item.quantity}</span>
                    <span className="flex-shrink-0">{formatDZD(item.price_at_purchase)}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-3 sm:space-y-4">
          {b2bOrders.map((order) => (
            <div key={order.id} className="bg-white border rounded-lg p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-3 sm:mb-4 gap-3">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-base sm:text-lg mb-1">Order #{order.id}</h3>
                  <p className="text-xs sm:text-sm text-gray-600">Buyer: {order.buyer?.business_name || order.buyer?.email}</p>
                  <p className="text-xs sm:text-sm text-gray-600">Seller: {order.seller?.business_name || order.seller?.email}</p>
                  <p className="text-xs sm:text-sm font-semibold">Total: {formatDZD(order.total_price)}</p>
                </div>
                <div className="flex items-center gap-3">
                  <select
                    value={order.status}
                    onChange={(e) => updateOrderStatus(order.id, e.target.value, 'b2b')}
                    className="px-3 py-2 border rounded-lg text-sm sm:text-base min-h-[44px] w-full sm:w-auto"
                  >
                    <option value="pending">Pending</option>
                    <option value="paid">Paid</option>
                    <option value="shipped">Shipped</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                {order.items?.map((item) => (
                  <div key={item.id} className="flex justify-between text-xs sm:text-sm">
                    <span className="flex-1 min-w-0 pr-2">{item.listing?.product?.name} x {item.quantity}</span>
                    <span className="flex-shrink-0">{formatDZD(item.price_at_purchase)}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

