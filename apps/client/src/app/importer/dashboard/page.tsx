"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/OptimizedAuthContext";
import { supabase } from "@/lib/supabase";
import { formatDZD } from "@/lib/utils/currency";
import AuthLoadingSpinner from "@/components/AuthLoadingSpinner";
import Link from "next/link";

interface DashboardStats {
  totalOffers: number;
  activeOffers: number;
  totalOrders: number;
  pendingOrders: number;
  totalRevenue: number;
}

export default function ImporterDashboard() {
  const router = useRouter();
  const { user, profile, loading: authLoading } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalOffers: 0,
    activeOffers: 0,
    totalOrders: 0,
    pendingOrders: 0,
    totalRevenue: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading) {
      if (!user || profile?.role !== "importer") {
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
      // Fetch offers count
      const { count: totalOffersCount } = await supabase
        .from("listings")
        .select("*", { count: "exact", head: true })
        .eq("seller_id", user.id)
        .eq("is_bulk_offer", true);

      const { count: activeOffersCount } = await supabase
        .from("listings")
        .select("*", { count: "exact", head: true })
        .eq("seller_id", user.id)
        .eq("is_bulk_offer", true)
        .gt("stock_quantity", 0);

      // Fetch orders count
      const { count: totalOrdersCount } = await supabase
        .from("orders_b2b")
        .select("*", { count: "exact", head: true })
        .eq("seller_id", user.id);

      const { count: pendingOrdersCount } = await supabase
        .from("orders_b2b")
        .select("*", { count: "exact", head: true })
        .eq("seller_id", user.id)
        .eq("status", "pending");

      // Calculate total revenue
      const { data: completedOrders } = await supabase
        .from("orders_b2b")
        .select("total_price")
        .eq("seller_id", user.id)
        .eq("status", "completed");

      const { data: shippedOrders } = await supabase
        .from("orders_b2b")
        .select("total_price")
        .eq("seller_id", user.id)
        .eq("status", "shipped");

      const { data: deliveredOrders } = await supabase
        .from("orders_b2b")
        .select("total_price")
        .eq("seller_id", user.id)
        .eq("status", "delivered");

      const allOrders = [...(completedOrders || []), ...(shippedOrders || []), ...(deliveredOrders || [])];
      const totalRevenue = allOrders.reduce((sum, order) => sum + Number(order.total_price), 0) || 0;

      setStats({
        totalOffers: totalOffersCount || 0,
        activeOffers: activeOffersCount || 0,
        totalOrders: totalOrdersCount || 0,
        pendingOrders: pendingOrdersCount || 0,
        totalRevenue,
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
          <h1 className="text-3xl font-bold text-gray-900">Importer Dashboard</h1>
          <p className="text-gray-600 mt-2">
            Welcome back, {profile?.business_name || user?.email}
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div>
              <p className="text-gray-500 text-sm">Total Offers</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalOffers}</p>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div>
              <p className="text-gray-500 text-sm">Active Offers</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats.activeOffers}</p>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div>
              <p className="text-gray-500 text-sm">Total Orders</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalOrders}</p>
              <p className="text-sm text-yellow-600 mt-1">{stats.pendingOrders} pending</p>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div>
              <p className="text-gray-500 text-sm">Total Revenue</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {formatDZD(stats.totalRevenue)}
              </p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              href="/importer/offers/create"
              className="flex items-center justify-center bg-blue-600 text-white px-6 py-4 rounded-lg hover:bg-blue-700 transition"
            >
              Create New Offer
            </Link>

            <Link
              href="/importer/offers"
              className="flex items-center justify-center bg-gray-100 text-gray-700 px-6 py-4 rounded-lg hover:bg-gray-200 transition"
            >
              View All Offers
            </Link>

            <Link
              href="/importer/orders"
              className="flex items-center justify-center bg-gray-100 text-gray-700 px-6 py-4 rounded-lg hover:bg-gray-200 transition"
            >
              Manage Orders
            </Link>
          </div>
        </div>

        {/* Info Section */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">Importer Portal</h3>
          <p className="text-blue-800">
            As an importer, you can create bulk offers for wholesalers. Your offers are exclusively visible to
            wholesalers in the marketplace. Set competitive prices and minimum order quantities to attract
            wholesale buyers.
          </p>
        </div>
      </div>
    </div>
  );
}
