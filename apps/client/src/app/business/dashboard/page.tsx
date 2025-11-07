"use client"

import React, { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/contexts/AuthContext"
import type { ListingWithProduct, OrderB2CWithItems, OrderB2BWithItems } from "@/types/database"
import Sidebar from "@/components/business/Sidebar"
import TopHeader from "@/components/business/TopHeader"
import GetStarted from "@/components/business/GetStarted"
import OverviewDashboard from "@/components/business/OverviewDashboard"

// Force dynamic rendering to prevent caching
export const dynamic = 'force-dynamic'

interface Statistics {
  totalListings: number
  totalOrders: number
  pendingOrders: number
  totalRevenue: number
  lowStockAlerts: number
  recentOrders7Days: number
}

export default function BusinessDashboardPage() {
  const router = useRouter()
  const { user, profile, loading: authLoading } = useAuth()
  const [listings, setListings] = useState<ListingWithProduct[]>([])
  const [b2cOrders, setB2cOrders] = useState<OrderB2CWithItems[]>([])
  const [b2bOrders, setB2bOrders] = useState<OrderB2BWithItems[]>([])
  const [statistics, setStatistics] = useState<Statistics>({
    totalListings: 0,
    totalOrders: 0,
    pendingOrders: 0,
    totalRevenue: 0,
    lowStockAlerts: 0,
    recentOrders7Days: 0,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [balance, setBalance] = useState<number>(0)
  const [dueAmount, setDueAmount] = useState<number>(0)

  useEffect(() => {
    if (!authLoading) {
      if (!user || !profile) {
        router.push('/business/login')
        return
      }
      if (profile.role !== 'retailer' && profile.role !== 'wholesaler' && profile.role !== 'importer') {
        return
      }
      // Initialize balance and due amount from profile
      if (profile.balance !== undefined) {
        setBalance(profile.balance)
      }
      if (profile.due_amount !== undefined) {
        setDueAmount(profile.due_amount)
      }
      fetchDashboardData()
    }
  }, [user, profile, authLoading, router, fetchDashboardData])

  const fetchDashboardData = useCallback(async () => {
    if (!supabase || !profile) return

    try {
      setLoading(true)
      setError(null)

      // Fetch listings
      const { data: listingsData, error: listingsError } = await supabase
        .from('listings')
        .select(`
          *,
          product:products(*, category:categories(*))
        `)
        .eq('seller_id', profile.id)
        .order('created_at', { ascending: false })

      if (listingsError) {
        console.error('Error fetching listings:', listingsError)
        throw new Error('Failed to fetch listings')
      }

      const fetchedListings = (listingsData || []) as ListingWithProduct[]
      setListings(fetchedListings)

      // Fetch B2C orders where seller's listings are involved
      const { data: b2cOrdersData, error: b2cError } = await supabase
        .from('orders_b2c')
        .select(`
          *,
          items:order_items_b2c(
            *,
            listing:listings(
              *,
              product:products(*, category:categories(*))
            )
          )
        `)
        .order('created_at', { ascending: false })
        .limit(15)

      let sellerB2cOrders: OrderB2CWithItems[] = []
      if (b2cError) {
        console.error('Error fetching B2C orders:', b2cError)
      } else {
        // Filter orders that contain seller's listings
        sellerB2cOrders = (b2cOrdersData || []).filter((order: OrderB2CWithItems) =>
          order.items?.some((item) => item.listing?.seller_id === profile.id)
        ) as OrderB2CWithItems[]
        setB2cOrders(sellerB2cOrders)
      }

      // Fetch B2B orders where seller is the seller
      const { data: b2bOrdersData, error: b2bError } = await supabase
        .from('orders_b2b')
        .select(`
          *,
          items:order_items_b2b(
            *,
            listing:listings(
              *,
              product:products(*, category:categories(*))
            )
          ),
          buyer:profiles!orders_b2b_buyer_id_fkey(*)
        `)
        .eq('seller_id', profile.id)
        .order('created_at', { ascending: false })
        .limit(15)

      const sellerB2bOrders: OrderB2BWithItems[] = b2bError ? [] : ((b2bOrdersData || []) as OrderB2BWithItems[])
      if (!b2bError) {
        setB2bOrders(sellerB2bOrders)
      } else {
        console.error('Error fetching B2B orders:', b2bError)
      }

      // Fetch balance and due amount from profile
      if (profile.balance !== undefined) {
        setBalance(profile.balance)
      }
      if (profile.due_amount !== undefined) {
        setDueAmount(profile.due_amount)
      }

      // Calculate statistics
      calculateStatistics(fetchedListings, sellerB2cOrders, sellerB2bOrders)
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load dashboard data'
      console.error('Error fetching dashboard data:', err)
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [profile])

  const calculateStatistics = (
    listings: ListingWithProduct[],
    b2cOrders: OrderB2CWithItems[],
    b2bOrders: OrderB2BWithItems[]
  ) => {
    const totalListings = listings.length
    const totalOrders = b2cOrders.length + b2bOrders.length
    
    const pendingB2C = b2cOrders.filter(o => o.status === 'pending').length
    const pendingB2B = b2bOrders.filter(o => o.status === 'pending').length
    const pendingOrders = pendingB2C + pendingB2B

    // Calculate revenue from completed orders
    const completedB2C = b2cOrders
      .filter(o => o.status === 'delivered')
      .reduce((sum, order) => {
        const orderTotal = order.items?.reduce((itemSum, item) => 
          itemSum + (item.price_at_purchase * item.quantity), 0) || 0
        return sum + orderTotal
      }, 0)

    const completedB2B = b2bOrders
      .filter(o => o.status === 'completed')
      .reduce((sum, order) => sum + order.total_price, 0)

    const totalRevenue = completedB2C + completedB2B

    const lowStockAlerts = listings.filter(l => l.stock_quantity < 10).length

    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    
    const recentB2C = b2cOrders.filter(o => new Date(o.created_at) >= sevenDaysAgo).length
    const recentB2B = b2bOrders.filter(o => new Date(o.created_at) >= sevenDaysAgo).length
    const recentOrders7Days = recentB2C + recentB2B

    setStatistics({
      totalListings,
      totalOrders,
      pendingOrders,
      totalRevenue,
      lowStockAlerts,
      recentOrders7Days,
    })
  }

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'shipped':
      case 'paid':
        return 'bg-blue-100 text-blue-800'
      case 'delivered':
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const lowStockListings = listings.filter(l => l.stock_quantity < 10)

  // Combine and sort all orders by date
  const allOrders = [
    ...b2cOrders.map(order => ({ ...order, type: 'B2C' as const })),
    ...b2bOrders.map(order => ({ ...order, type: 'B2B' as const })),
  ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 15)

  const handleReset = () => {
    // Reset any filters/metrics state and refresh data
    fetchDashboardData()
  }

  const handleActivateStore = () => {
    // Navigate to add balance page or show modal
    router.push('/business/store?action=activate')
  }

  if (authLoading || loading) {
    return (
      <>
        <Sidebar balance={balance} dueAmount={dueAmount} />
        <div className="lg:ml-64 pt-16 min-h-screen">
          <div className="max-w-7xl mx-auto px-2 sm:px-4 py-4 sm:py-8">
            <div className="animate-pulse space-y-6">
              <div className="h-6 sm:h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="h-20 sm:h-24 bg-gray-200 rounded-lg"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </>
    )
  }

  if (!user || !profile || (profile.role !== 'retailer' && profile.role !== 'wholesaler' && profile.role !== 'importer')) {
    return (
      <>
        <Sidebar balance={balance} dueAmount={dueAmount} />
        <div className="lg:ml-64 pt-16 min-h-screen">
          <div className="max-w-7xl mx-auto px-2 sm:px-4 py-4 sm:py-8 text-center">
            <h1 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6">Access Denied</h1>
            <p className="text-sm sm:text-base text-gray-700">You do not have permission to view this page.</p>
          </div>
        </div>
      </>
    )
  }

  if (error) {
    return (
      <>
        <Sidebar balance={balance} dueAmount={dueAmount} />
        <div className="lg:ml-64 pt-16 min-h-screen">
          <div className="max-w-7xl mx-auto px-2 sm:px-4 py-4 sm:py-8">
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 sm:p-4 mb-6">
              <p className="text-sm sm:text-base text-red-800">{error}</p>
              <button
                onClick={fetchDashboardData}
                className="mt-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors min-h-[44px]"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <Sidebar balance={balance} dueAmount={dueAmount} />
      <TopHeader onReset={handleReset} />
      <div className="lg:ml-64 pt-16 min-h-screen">
        <div className="max-w-7xl mx-auto px-2 sm:px-4 py-4 sm:py-6 md:py-8">
          {/* Welcome Section */}
          <div className="mb-6">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2">
              Welcome back {profile.business_name || profile.email?.split('@')[0] || 'User'},
            </h1>
          </div>

          {/* Get Started Section */}
          <GetStarted
            balance={balance}
            hasProducts={listings.length > 0}
            onActivateStore={handleActivateStore}
          />

          {/* Overview Dashboard */}
          <OverviewDashboard b2cOrders={b2cOrders} b2bOrders={b2bOrders} />

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-4 sm:mb-6 md:mb-8">
        <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-gray-600 mb-1">Total Listings</p>
              <p className="text-2xl sm:text-3xl font-bold text-black">{statistics.totalListings}</p>
            </div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-gray-600 mb-1">Total Orders</p>
              <p className="text-2xl sm:text-3xl font-bold text-black">{statistics.totalOrders}</p>
            </div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-gray-600 mb-1">Pending Orders</p>
              <p className="text-2xl sm:text-3xl font-bold text-black">{statistics.pendingOrders}</p>
            </div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-yellow-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-gray-600 mb-1">Total Revenue</p>
              <p className="text-2xl sm:text-3xl font-bold text-black">${statistics.totalRevenue.toFixed(2)}</p>
            </div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-gray-600 mb-1">Low Stock Alerts</p>
              <p className="text-2xl sm:text-3xl font-bold text-black">{statistics.lowStockAlerts}</p>
            </div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-gray-600 mb-1">Orders (7 Days)</p>
              <p className="text-2xl sm:text-3xl font-bold text-black">{statistics.recentOrders7Days}</p>
            </div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6 mb-4 sm:mb-6 md:mb-8">
        <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <Link
            href="/business/my-listings?create=true"
            className="flex items-center gap-2 sm:gap-3 p-3 sm:p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors min-h-[44px]"
          >
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-yellow-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <div className="min-w-0">
              <p className="font-medium text-black text-sm sm:text-base">Create Listing</p>
              <p className="text-xs sm:text-sm text-gray-600">Add a new product</p>
            </div>
          </Link>

          <Link
            href="/business/my-listings"
            className="flex items-center gap-2 sm:gap-3 p-3 sm:p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors min-h-[44px]"
          >
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
            </div>
            <div className="min-w-0">
              <p className="font-medium text-black text-sm sm:text-base">View All Listings</p>
              <p className="text-xs sm:text-sm text-gray-600">Manage your products</p>
            </div>
          </Link>

          <div className="flex items-center gap-2 sm:gap-3 p-3 sm:p-4 border border-gray-200 rounded-lg opacity-50 cursor-not-allowed min-h-[44px]">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <div className="min-w-0">
              <p className="font-medium text-gray-400 text-sm sm:text-base">View All Orders</p>
              <p className="text-xs sm:text-sm text-gray-400">Coming soon</p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 p-3 sm:p-4 border border-gray-200 rounded-lg opacity-50 cursor-not-allowed min-h-[44px]">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div className="min-w-0">
              <p className="font-medium text-gray-400 text-sm sm:text-base">Update Profile</p>
              <p className="text-xs sm:text-sm text-gray-400">Coming soon</p>
            </div>
          </div>
        </div>
      </div>

      {/* Low Stock Alerts */}
      {lowStockListings.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 sm:p-6 mb-4 sm:mb-6 md:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3 sm:mb-4 gap-2">
            <h2 className="text-lg sm:text-xl font-semibold text-red-900">Low Stock Alerts</h2>
            <span className="px-2 sm:px-3 py-1 bg-red-200 text-red-800 rounded-full text-xs sm:text-sm font-medium self-start sm:self-auto">
              {lowStockListings.length} {lowStockListings.length === 1 ? 'item' : 'items'}
            </span>
          </div>
          <div className="space-y-2 sm:space-y-3">
            {lowStockListings.slice(0, 5).map((listing) => (
              <div
                key={listing.id}
                className="flex flex-col sm:flex-row sm:items-center sm:justify-between bg-white rounded-lg p-3 sm:p-4 border border-red-200 gap-3"
              >
                <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
                  {listing.product.image_url ? (
                    <div className="relative w-12 h-12 sm:w-16 sm:h-16 rounded-lg overflow-hidden flex-shrink-0">
                      <Image
                        src={listing.product.image_url}
                        alt={listing.product.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-200 rounded-lg flex-shrink-0"></div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-black text-sm sm:text-base truncate">{listing.product.name}</p>
                    <p className="text-xs sm:text-sm text-gray-600">
                      Current stock: <span className="font-semibold text-red-600">{listing.stock_quantity}</span>
                    </p>
                  </div>
                </div>
                <Link
                  href="/business/my-listings"
                  className="px-3 sm:px-4 py-2 bg-yellow-400 text-black font-medium rounded-lg hover:bg-yellow-300 transition-colors text-xs sm:text-sm min-h-[44px] flex items-center justify-center sm:justify-start"
                >
                  Restock
                </Link>
              </div>
            ))}
            {lowStockListings.length > 5 && (
              <Link
                href="/business/my-listings"
                className="block text-center text-xs sm:text-sm text-red-700 hover:text-red-900 font-medium mt-2 min-h-[44px] flex items-center justify-center"
              >
                View all {lowStockListings.length} low stock items →
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Recent Orders */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3 sm:mb-4 gap-2">
          <h2 className="text-lg sm:text-xl font-semibold">Recent Orders</h2>
          {allOrders.length > 0 && (
            <span className="text-xs sm:text-sm text-gray-600">
              Showing {allOrders.length} {allOrders.length === 1 ? 'order' : 'orders'}
            </span>
          )}
        </div>

        {allOrders.length === 0 ? (
          <div className="text-center py-8 sm:py-12">
            <svg className="w-12 h-12 sm:w-16 sm:h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
            <p className="text-gray-500 text-base sm:text-lg mb-2">No orders yet</p>
            <p className="text-gray-400 text-xs sm:text-sm">Orders will appear here once customers start purchasing your products.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {allOrders.map((order) => {
              const orderTotal = order.type === 'B2C'
                ? (order as OrderB2CWithItems).items?.reduce((sum, item) => sum + (item.price_at_purchase * item.quantity), 0) || 0
                : (order as OrderB2BWithItems).total_price
              
              const b2cOrder = order.type === 'B2C' ? (order as OrderB2CWithItems) : null
              const b2bOrder = order.type === 'B2B' ? (order as OrderB2BWithItems) : null
              const orderItems = order.type === 'B2C' 
                ? (order as OrderB2CWithItems).items || []
                : (order as OrderB2BWithItems).items || []

              return (
                <div key={`${order.type}-${order.id}`} className="border border-gray-200 rounded-lg overflow-hidden">
                  {/* Order Header */}
                  <div className="bg-gray-50 px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
                      <div className="flex items-center gap-3 sm:gap-4">
                        <div>
                          <h3 className="text-base sm:text-lg font-semibold text-gray-900">
                            Order #{order.id}
                          </h3>
                          <p className="text-xs sm:text-sm text-gray-600 mt-1">
                            {formatDate(order.created_at)}
                          </p>
                        </div>
                        <span className={`px-2 sm:px-3 py-1 rounded text-xs font-medium ${
                          order.type === 'B2C' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                        }`}>
                          {order.type}
                        </span>
                        <span className={`px-2 sm:px-3 py-1 rounded text-xs font-medium capitalize ${getStatusBadgeColor(order.status)}`}>
                          {order.status}
                        </span>
                      </div>
                      <div className="text-right">
                        <p className="text-xs sm:text-sm text-gray-600">Total Amount</p>
                        <p className="text-lg sm:text-xl font-bold text-black">${orderTotal.toFixed(2)}</p>
                      </div>
                    </div>
                  </div>

                  {/* Client Information */}
                  <div className="px-4 sm:px-6 py-3 sm:py-4 bg-white border-b border-gray-200">
                    <h4 className="text-sm sm:text-base font-semibold text-gray-900 mb-2 sm:mb-3">Client Information</h4>
                    {order.type === 'B2C' && b2cOrder ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 text-sm">
                        <div>
                          <span className="font-medium text-gray-700">Name:</span>
                          <span className="ml-2 text-gray-900">{b2cOrder.customer_name}</span>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Phone:</span>
                          <span className="ml-2 text-gray-900">{b2cOrder.customer_phone}</span>
                        </div>
                        <div className="sm:col-span-2">
                          <span className="font-medium text-gray-700">Address:</span>
                          <span className="ml-2 text-gray-900">{b2cOrder.customer_address}</span>
                        </div>
                      </div>
                    ) : b2bOrder ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 text-sm">
                        <div>
                          <span className="font-medium text-gray-700">Business:</span>
                          <span className="ml-2 text-gray-900">{b2bOrder.buyer?.business_name || 'N/A'}</span>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Email:</span>
                          <span className="ml-2 text-gray-900">{b2bOrder.buyer?.email || 'N/A'}</span>
                        </div>
                      </div>
                    ) : null}
                  </div>

                  {/* Order Items */}
                  <div className="px-4 sm:px-6 py-3 sm:py-4 bg-white">
                    <h4 className="text-sm sm:text-base font-semibold text-gray-900 mb-3 sm:mb-4">Products</h4>
                    {orderItems.length === 0 ? (
                      <p className="text-sm text-gray-500">No items found</p>
                    ) : (
                      <div className="space-y-3">
                        {orderItems.map((item) => {
                          const listing = item.listing
                          const product = listing?.product
                          return (
                            <div key={item.id} className="flex items-start gap-3 sm:gap-4 p-3 bg-gray-50 rounded-lg">
                              {product?.image_url && (
                                <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden flex-shrink-0">
                                  <Image
                                    src={product.image_url}
                                    alt={product.name}
                                    fill
                                    className="object-cover"
                                  />
                                </div>
                              )}
                              {!product?.image_url && (
                                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-200 rounded-lg flex-shrink-0"></div>
                              )}
                              <div className="flex-1 min-w-0">
                                <h5 className="font-medium text-sm sm:text-base text-gray-900 mb-1">
                                  {product?.name || 'Unknown Product'}
                                </h5>
                                <div className="flex flex-wrap gap-2 sm:gap-4 text-xs sm:text-sm text-gray-600">
                                  <span>
                                    <span className="font-medium">Quantity:</span> {item.quantity}
                                  </span>
                                  <span>
                                    <span className="font-medium">Price:</span> ${item.price_at_purchase.toFixed(2)}
                                  </span>
                                  <span>
                                    <span className="font-medium">Subtotal:</span> ${(item.price_at_purchase * item.quantity).toFixed(2)}
                                  </span>
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
        </div>
      </div>
    </>
  )
}
