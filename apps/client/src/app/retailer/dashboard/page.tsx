"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/OptimizedAuthContext";
import { supabase } from "@/lib/supabase";
import { formatDZD } from "@/lib/utils/currency";
import AuthLoadingSpinner from "@/components/AuthLoadingSpinner";
import Link from "next/link";

interface DashboardStats {
  myProducts: number;
  activeProducts: number;
  purchaseOrders: number;
  customerOrders: number;
  totalRevenue: number;
  totalSpending: number;
}

export default function RetailerDashboard() {
  const router = useRouter();
  const { user, profile, loading: authLoading } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    myProducts: 0,
    activeProducts: 0,
    purchaseOrders: 0,
    customerOrders: 0,
    totalRevenue: 0,
    totalSpending: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading) {
      if (!user || profile?.role !== "retailer") {
        router.push("/login");
        return;
      }

      if (profile?.is_banned) {
        router.push("/banned");
        return;
      }

      fetchDashboardStats();
    }
  }, [user, profile, authLoading, router]);

  const fetchDashboardStats = async () => {
    if (!user?.id || !supabase) {
      setLoading(false); // Ensure loading is set to false even if we can't fetch stats
      return;
    }

    try {
      // Fetch my products count (selling to customers)
      const { count: productsCount } = await supabase
        .from("listings")
        .select("*", { count: "exact", head: true })
        .eq("seller_id", user.id)
        .eq("target_role", "customer");

      const { count: activeProductsCount } = await supabase
        .from("listings")
        .select("*", { count: "exact", head: true })
        .eq("seller_id", user.id)
        .eq("target_role", "customer")
        .gt("stock_quantity", 0);

      // Fetch B2B purchase orders (as buyer from wholesalers)
      const { count: purchaseOrdersCount } = await supabase
        .from("orders_b2b")
        .select("*", { count: "exact", head: true })
        .eq("buyer_id", user.id);

      // Get my listings
      const { data: myListings } = await supabase
        .from("listings")
        .select("id")
        .eq("seller_id", user.id);

      const listingIds = myListings?.map(l => l.id) || [];

      let customerOrdersCount = 0;
      let totalRevenue = 0;
      let totalSpending = 0;

      if (listingIds.length > 0) {
        // Get order item IDs for my listings
        const { data: myOrderItems } = await supabase
          .from("order_items_b2c")
          .select("order_id")
          .eq("listing_id", listingIds[0]); // Start with first listing

        // For additional listings, we need to combine results
        let allOrderIds = myOrderItems?.map(item => item.order_id) || [];

        if (listingIds.length > 1) {
          for (let i = 1; i < listingIds.length; i++) {
            const { data: items } = await supabase
              .from("order_items_b2c")
              .select("order_id")
              .eq("listing_id", listingIds[i]);
            allOrderIds = [...allOrderIds, ...(items?.map(item => item.order_id) || [])];
          }
        }

        // Remove duplicates
        const uniqueOrderIds = [...new Set(allOrderIds)];
        customerOrdersCount = uniqueOrderIds.length;

        // Calculate total revenue from delivered B2C orders
        const { data: deliveredOrderItems } = await supabase
          .from("order_items_b2c")
          .select(`
            price_at_purchase,
            quantity,
            order:orders_b2c!inner(status)
          `)
          .eq("listing_id", listingIds[0])
          .eq("order.status", "delivered");

        let revenueItems = deliveredOrderItems || [];

        if (listingIds.length > 1) {
          for (let i = 1; i < listingIds.length; i++) {
            const { data: items } = await supabase
              .from("order_items_b2c")
              .select(`
                price_at_purchase,
                quantity,
                order:orders_b2c!inner(status)
              `)
              .eq("listing_id", listingIds[i])
              .eq("order.status", "delivered");
            revenueItems = [...revenueItems, ...(items || [])];
          }
        }

        totalRevenue = revenueItems.reduce((sum, item: any) =>
          sum + (Number(item.price_at_purchase) * item.quantity), 0) || 0;

        // Calculate total spending (B2B purchases from wholesalers)
        const { data: completedOrders } = await supabase
          .from("orders_b2b")
          .select("total_price")
          .eq("buyer_id", user.id)
          .eq("status", "completed");

        const { data: shippedOrders } = await supabase
          .from("orders_b2b")
          .select("total_price")
          .eq("buyer_id", user.id)
          .eq("status", "shipped");

        const { data: deliveredOrders } = await supabase
          .from("orders_b2b")
          .select("total_price")
          .eq("buyer_id", user.id)
          .eq("status", "delivered");

        const allPurchaseOrders = [
          ...(completedOrders || []),
          ...(shippedOrders || []),
          ...(deliveredOrders || [])
        ];

        totalSpending = allPurchaseOrders.reduce((sum, order) => sum + Number(order.total_price), 0) || 0;
      }

      setStats({
        myProducts: productsCount || 0,
        activeProducts: activeProductsCount || 0,
        purchaseOrders: purchaseOrdersCount || 0,
        customerOrders: customerOrdersCount,
        totalRevenue,
        totalSpending,
      });
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loading) {
    return <AuthLoadingSpinner />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Retailer Dashboard</h1>
          <p className="text-gray-600 mt-2">
            Welcome back, {profile?.business_name || user?.email}
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div>
              <p className="text-gray-500 text-sm">My Products</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats.myProducts}</p>
              <p className="text-sm text-green-600 mt-1">{stats.activeProducts} active</p>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div>
              <p className="text-gray-500 text-sm">Purchase Orders</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats.purchaseOrders}</p>
              <p className="text-sm text-gray-600 mt-1">From Wholesalers</p>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div>
              <p className="text-gray-500 text-sm">Customer Orders</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats.customerOrders}</p>
              <p className="text-sm text-gray-600 mt-1">COD Orders</p>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div>
              <p className="text-gray-500 text-sm">Total Revenue</p>
              <p className="text-3xl font-bold text-green-600 mt-2">
                {formatDZD(stats.totalRevenue)}
              </p>
              <p className="text-sm text-gray-600 mt-1">Sales to customers</p>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div>
              <p className="text-gray-500 text-sm">Total Spending</p>
              <p className="text-3xl font-bold text-orange-600 mt-2">
                {formatDZD(stats.totalSpending)}
              </p>
              <p className="text-sm text-gray-600 mt-1">Purchases from wholesalers</p>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div>
              <p className="text-gray-500 text-sm">Net Profit</p>
              <p className={`text-3xl font-bold mt-2 ${stats.totalRevenue - stats.totalSpending >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatDZD(stats.totalRevenue - stats.totalSpending)}
              </p>
              <p className="text-sm text-gray-600 mt-1">Revenue - Spending</p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Buying Section */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Buying</h2>
            <div className="space-y-3">
              <Link
                href="/retailer/buy"
                className="flex items-center justify-center bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition"
              >
                Browse Wholesaler Products
              </Link>
              <Link
                href="/retailer/orders/purchases"
                className="flex items-center justify-center bg-gray-100 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-200 transition"
              >
                My Purchase Orders
              </Link>
            </div>
          </div>

          {/* Selling Section */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Selling</h2>
            <div className="space-y-3">
              <Link
                href="/business/my-listings?create=true"
                className="flex items-center justify-center bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
              >
                Create New Product
              </Link>
              <Link
                href="/business/my-listings"
                className="flex items-center justify-center bg-gray-100 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-200 transition"
              >
                View My Products
              </Link>
            </div>
          </div>
        </div>

        {/* Info Section */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">Retailer Portal</h3>
          <p className="text-blue-800">
            As a retailer, you purchase products from wholesalers and sell them to end customers.
            Manage your inventory, fulfill COD orders, and grow your retail business.
          </p>
        </div>
      </div>
    </div>
  );
}
