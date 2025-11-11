"use client"

import React, { useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useAuth } from "@/contexts/OptimizedAuthContext"
import { useMyListings } from "@/hooks/useListings"
import { useSellerB2COrders } from "@/hooks/useOrders"
import { formatDZD } from "@/lib/utils/currency"
import Sidebar from "@/components/business/Sidebar"
import TopHeader from "@/components/business/TopHeader"
import GetStarted from "@/components/business/GetStarted"
import OverviewDashboard from "@/components/business/OverviewDashboard"
import { DashboardSkeleton } from "@/components/Skeletons"

export default function BusinessDashboardPage() {
  const router = useRouter()
  const { user, profile, loading: authLoading } = useAuth()

  // Fetch data using optimized hooks (auto-cached!)
  const { data: listings = [], isLoading: listingsLoading } = useMyListings(profile?.id || null)
  const { data: b2cOrders = [], isLoading: ordersLoading } = useSellerB2COrders(profile?.id || null)

  const loading = listingsLoading || ordersLoading

  // Redirect if not authenticated or redirect to role-specific dashboard
  useEffect(() => {
    if (!authLoading && (!user || !profile)) {
      router.push('/business/login')
      return
    }

    // Redirect to role-specific dashboards
    if (profile) {
      if (profile.is_banned) {
        router.push('/banned')
        return
      }

      switch (profile.role) {
        case 'importer':
          router.push('/importer/dashboard')
          return
        case 'wholesaler':
          router.push('/wholesaler/dashboard')
          return
        case 'retailer':
          router.push('/retailer/dashboard')
          return
        case 'admin':
          // Admins have full access to business dashboard
          break
        default:
          // normal_user should not access business dashboard
          break
      }
    }
  }, [user, profile, authLoading, router])

  // Calculate statistics
  const statistics = React.useMemo(() => {
    const totalListings = listings.length
    const totalOrders = b2cOrders.length
    const pendingOrders = b2cOrders.filter(o => o.status === 'pending').length

    const totalRevenue = b2cOrders
      .filter(o => o.status === 'delivered')
      .reduce((sum, order) => {
        const orderTotal = order.items?.reduce((itemSum, item) =>
          itemSum + (item.price_at_purchase * item.quantity), 0) || 0
        return sum + orderTotal
      }, 0)

    const lowStockAlerts = listings.filter(l => l.stock_quantity < 10).length

    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    const recentOrders7Days = b2cOrders.filter(o =>
      new Date(o.created_at) >= sevenDaysAgo
    ).length

    return {
      totalListings,
      totalOrders,
      pendingOrders,
      totalRevenue,
      lowStockAlerts,
      recentOrders7Days,
    }
  }, [listings, b2cOrders])

  const balance = profile?.balance || 0
  const dueAmount = profile?.due_amount || 0

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

  const allOrders = b2cOrders
    .slice()
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 15)

  const handleActivateStore = () => {
    router.push('/business/store?action=activate')
  }

  // Show loading while auth is loading or user not ready
  if (authLoading || !user || !profile) {
    return (
      <>
        <Sidebar balance={balance} dueAmount={dueAmount} />
        <div className="lg:ml-64 pt-16 min-h-screen">
          <div className="max-w-7xl mx-auto px-2 sm:px-4 py-4 sm:py-8">
            <DashboardSkeleton />
          </div>
        </div>
      </>
    )
  }

  // Check authorization - Note: admins should have already been redirected by useEffect above
  // This check is just a safety net for unexpected roles
  const validBusinessRoles = ['retailer', 'wholesaler', 'importer', 'admin']
  if (!validBusinessRoles.includes(profile.role)) {
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

  // Show loading skeleton while data is loading
  if (loading) {
    return (
      <>
        <Sidebar balance={balance} dueAmount={dueAmount} />
        <TopHeader onReset={() => {}} />
        <div className="lg:ml-64 pt-16 min-h-screen">
          <div className="max-w-7xl mx-auto px-2 sm:px-4 py-4 sm:py-8">
            <DashboardSkeleton />
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <Sidebar balance={balance} dueAmount={dueAmount} />
      <TopHeader onReset={() => window.location.reload()} />
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
          <OverviewDashboard b2cOrders={b2cOrders} b2bOrders={[]} />

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
                  <p className="text-2xl sm:text-3xl font-bold text-black">{formatDZD(statistics.totalRevenue)}</p>
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
                  const orderTotal = order.items?.reduce((sum, item) =>
                    sum + (item.price_at_purchase * item.quantity), 0) || 0

                  return (
                    <div key={order.id} className="border border-gray-200 rounded-lg overflow-hidden">
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
                            <span className={`px-2 sm:px-3 py-1 rounded text-xs font-medium capitalize ${getStatusBadgeColor(order.status)}`}>
                              {order.status}
                            </span>
                          </div>
                          <div className="text-right">
                            <p className="text-xs sm:text-sm text-gray-600">Total Amount</p>
                            <p className="text-lg sm:text-xl font-bold text-black">{formatDZD(orderTotal)}</p>
                          </div>
                        </div>
                      </div>

                      {/* Client Information */}
                      <div className="px-4 sm:px-6 py-3 sm:py-4 bg-white border-b border-gray-200">
                        <h4 className="text-sm sm:text-base font-semibold text-gray-900 mb-2 sm:mb-3">Client Information</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 text-sm">
                          <div>
                            <span className="font-medium text-gray-700">Name:</span>
                            <span className="ml-2 text-gray-900">{order.customer_name}</span>
                          </div>
                          <div>
                            <span className="font-medium text-gray-700">Phone:</span>
                            <span className="ml-2 text-gray-900">{order.customer_phone}</span>
                          </div>
                          <div className="sm:col-span-2">
                            <span className="font-medium text-gray-700">Address:</span>
                            <span className="ml-2 text-gray-900">{order.customer_address}</span>
                          </div>
                        </div>
                      </div>

                      {/* Order Items */}
                      <div className="px-4 sm:px-6 py-3 sm:py-4 bg-white">
                        <h4 className="text-sm sm:text-base font-semibold text-gray-900 mb-3 sm:mb-4">Products</h4>
                        {(order.items || []).length === 0 ? (
                          <p className="text-sm text-gray-500">No items found</p>
                        ) : (
                          <div className="space-y-3">
                            {(order.items || []).map((item) => {
                              const listing = item.listing
                              const product = listing?.product
                              return (
                                <div key={item.id} className="flex items-start gap-3 sm:gap-4 p-3 bg-gray-50 rounded-lg">
                                  {product?.image_url ? (
                                    <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden flex-shrink-0">
                                      <Image
                                        src={product.image_url}
                                        alt={product.name}
                                        fill
                                        className="object-cover"
                                      />
                                    </div>
                                  ) : (
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
                                        <span className="font-medium">Price:</span> {formatDZD(item.price_at_purchase)}
                                      </span>
                                      <span>
                                        <span className="font-medium">Subtotal:</span> {formatDZD(item.price_at_purchase * item.quantity)}
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
