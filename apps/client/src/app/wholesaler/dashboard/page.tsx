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
  salesOrders: number;
  totalRevenue: number;
  totalSpending: number;
}

export default function WholesalerDashboard() {
  const router = useRouter();
  const { user, profile, loading: authLoading } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    myProducts: 0,
    activeProducts: 0,
    purchaseOrders: 0,
    salesOrders: 0,
    totalRevenue: 0,
    totalSpending: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading) {
      if (!user || profile?.role !== "wholesaler") {
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
      // Fetch my products count
      const { count: productsCount } = await supabase
        .from("listings")
        .select("*", { count: "exact", head: true })
        .eq("seller_id", user.id)
        .eq("target_role", "retailer");

      const { count: activeProductsCount } = await supabase
        .from("listings")
        .select("*", { count: "exact", head: true })
        .eq("seller_id", user.id)
        .eq("target_role", "retailer")
        .gt("stock_quantity", 0);

      // Fetch purchase orders (as buyer from importers)
      const { count: purchaseOrdersCount } = await supabase
        .from("orders_b2b")
        .select("*", { count: "exact", head: true })
        .eq("buyer_id", user.id);

      // Fetch sales orders (as seller to retailers)
      const { count: salesOrdersCount } = await supabase
        .from("orders_b2b")
        .select("*", { count: "exact", head: true })
        .eq("seller_id", user.id);

      // Calculate total revenue (sales)
      const { data: completedSalesOrders } = await supabase
        .from("orders_b2b")
        .select("total_price")
        .eq("seller_id", user.id)
        .eq("status", "completed");

      const { data: shippedSalesOrders } = await supabase
        .from("orders_b2b")
        .select("total_price")
        .eq("seller_id", user.id)
        .eq("status", "shipped");

      const { data: deliveredSalesOrders } = await supabase
        .from("orders_b2b")
        .select("total_price")
        .eq("seller_id", user.id)
        .eq("status", "delivered");

      const allSalesOrders = [...(completedSalesOrders || []), ...(shippedSalesOrders || []), ...(deliveredSalesOrders || [])];
      const totalRevenue = allSalesOrders.reduce((sum, order) => sum + Number(order.total_price), 0) || 0;

      // Calculate total spending (purchases)
      const { data: completedPurchaseOrders } = await supabase
        .from("orders_b2b")
        .select("total_price")
        .eq("buyer_id", user.id)
        .eq("status", "completed");

      const { data: shippedPurchaseOrders } = await supabase
        .from("orders_b2b")
        .select("total_price")
        .eq("buyer_id", user.id)
        .eq("status", "shipped");

      const { data: deliveredPurchaseOrders } = await supabase
        .from("orders_b2b")
        .select("total_price")
        .eq("buyer_id", user.id)
        .eq("status", "delivered");

      const allPurchaseOrders = [...(completedPurchaseOrders || []), ...(shippedPurchaseOrders || []), ...(deliveredPurchaseOrders || [])];
      const totalSpending = allPurchaseOrders.reduce((sum, order) => sum + Number(order.total_price), 0) || 0;

      setStats({
        myProducts: productsCount || 0,
        activeProducts: activeProductsCount || 0,
        purchaseOrders: purchaseOrdersCount || 0,
        salesOrders: salesOrdersCount || 0,
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
          <h1 className="text-3xl font-bold text-gray-900">Wholesaler Dashboard</h1>
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
              <p className="text-sm text-gray-600 mt-1">From Importers</p>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div>
              <p className="text-gray-500 text-sm">Sales Orders</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats.salesOrders}</p>
              <p className="text-sm text-gray-600 mt-1">To Retailers</p>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div>
              <p className="text-gray-500 text-sm">Total Revenue</p>
              <p className="text-3xl font-bold text-green-600 mt-2">
                {formatDZD(stats.totalRevenue)}
              </p>
              <p className="text-sm text-gray-600 mt-1">Sales to retailers</p>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div>
              <p className="text-gray-500 text-sm">Total Spending</p>
              <p className="text-3xl font-bold text-orange-600 mt-2">
                {formatDZD(stats.totalSpending)}
              </p>
              <p className="text-sm text-gray-600 mt-1">Purchases from importers</p>
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
                href="/wholesaler/buy"
                className="flex items-center justify-center bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition"
              >
                Browse Importer Offers
              </Link>
              <Link
                href="/wholesaler/orders/purchases"
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
                href="/wholesaler/sell/create"
                className="flex items-center justify-center bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
              >
                Create New Product
              </Link>
              <Link
                href="/wholesaler/sell"
                className="flex items-center justify-center bg-gray-100 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-200 transition"
              >
                View My Products
              </Link>
              <Link
                href="/wholesaler/orders/sales"
                className="flex items-center justify-center bg-gray-100 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-200 transition"
              >
                My Sales Orders
              </Link>
            </div>
          </div>
        </div>

        {/* Info Section */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">Wholesaler Portal</h3>
          <p className="text-blue-800">
            As a wholesaler, you can purchase bulk offers from importers and create products to sell to retailers.
            You act as the middle tier, sourcing from importers and distributing to retailers.
          </p>
        </div>
      </div>
    </div>
  );
}
