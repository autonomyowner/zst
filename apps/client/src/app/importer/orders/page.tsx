"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/OptimizedAuthContext";
import { supabase } from "@/lib/supabase";
import { formatDZD } from "@/lib/utils/currency";
import AuthLoadingSpinner from "@/components/AuthLoadingSpinner";
import type { OrderB2BWithDetails } from "@/types/database";

interface OrderWithBuyer extends OrderB2BWithDetails {
  buyer_profile?: {
    business_name: string | null;
    email: string | null;
  };
}

export default function ImporterOrders() {
  const router = useRouter();
  const { user, profile, loading: authLoading } = useAuth();
  const [orders, setOrders] = useState<OrderWithBuyer[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");

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

      fetchOrders();
    }
  }, [user, profile, authLoading, router, filter]);

  const fetchOrders = async () => {
    if (!supabase) return;
    try {
      let query = supabase
        .from("orders_b2b")
        .select(`
          *,
          order_items_b2b (
            *,
            listing:listings (
              *,
              product:products (*)
            )
          )
        `)
        .eq("seller_id", user?.id)
        .order("created_at", { ascending: false });

      if (filter !== "all") {
        query = query.eq("status", filter);
      }

      const { data: ordersData, error } = await query;

      if (error) throw error;

      // Fetch buyer profiles
      const buyerIds = [...new Set(ordersData?.map(order => order.buyer_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, business_name, email")
        .in("id", buyerIds);

      const ordersWithBuyers = ordersData?.map(order => ({
        ...order,
        buyer_profile: profiles?.find(p => p.id === order.buyer_id),
      }));

      setOrders(ordersWithBuyers || []);
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (orderId: number, newStatus: string) => {
    try {
      const { error } = await supabase
        .from("orders_b2b")
        .update({ status: newStatus })
        .eq("id", orderId);

      if (error) throw error;

      // Refresh orders
      fetchOrders();
      alert("Order status updated successfully!");
    } catch (error) {
      console.error("Error updating order status:", error);
      alert("Failed to update order status");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "confirmed":
        return "bg-blue-100 text-blue-800";
      case "shipped":
        return "bg-purple-100 text-purple-800";
      case "delivered":
        return "bg-green-100 text-green-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
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
          <h1 className="text-3xl font-bold text-gray-900">Orders from Wholesalers</h1>
          <p className="text-gray-600 mt-2">Manage orders received from wholesalers</p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFilter("all")}
              className={`px-4 py-2 rounded-lg transition ${
                filter === "all"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              All Orders
            </button>
            <button
              onClick={() => setFilter("pending")}
              className={`px-4 py-2 rounded-lg transition ${
                filter === "pending"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Pending
            </button>
            <button
              onClick={() => setFilter("confirmed")}
              className={`px-4 py-2 rounded-lg transition ${
                filter === "confirmed"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Confirmed
            </button>
            <button
              onClick={() => setFilter("shipped")}
              className={`px-4 py-2 rounded-lg transition ${
                filter === "shipped"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Shipped
            </button>
            <button
              onClick={() => setFilter("delivered")}
              className={`px-4 py-2 rounded-lg transition ${
                filter === "delivered"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Delivered
            </button>
          </div>
        </div>

        {/* Orders List */}
        {orders.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <svg
              className="w-16 h-16 text-gray-400 mx-auto mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No orders found</h3>
            <p className="text-gray-600">
              {filter === "all"
                ? "You haven't received any orders yet"
                : `No ${filter} orders found`}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <div key={order.id} className="bg-white rounded-lg shadow p-6">
                {/* Order Header */}
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      Order #{order.id}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {new Date(order.created_at).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      Buyer: {order.buyer_profile?.business_name || order.buyer_profile?.email || "Unknown"}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                    {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                  </span>
                </div>

                {/* Order Items */}
                <div className="border-t border-gray-200 pt-4 mb-4">
                  <h4 className="font-medium text-gray-900 mb-3">Items</h4>
                  <div className="space-y-2">
                    {order.order_items_b2b?.map((item: any) => (
                      <div key={item.id} className="flex justify-between text-sm">
                        <span className="text-gray-700">
                          {item.listing?.product?.name || "Unknown Product"} x {item.quantity}
                        </span>
                        <span className="font-medium text-gray-900">
                          {formatDZD(Number(item.price_at_purchase) * item.quantity)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Order Total */}
                <div className="border-t border-gray-200 pt-4 mb-4">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold text-gray-900">Total</span>
                    <span className="text-lg font-bold text-gray-900">
                      {formatDZD(Number(order.total_price))}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                {order.status !== "delivered" && order.status !== "cancelled" && (
                  <div className="border-t border-gray-200 pt-4">
                    <div className="flex gap-2">
                      {order.status === "pending" && (
                        <button
                          onClick={() => handleStatusUpdate(order.id, "confirmed")}
                          className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition text-sm"
                        >
                          Confirm Order
                        </button>
                      )}
                      {order.status === "confirmed" && (
                        <button
                          onClick={() => handleStatusUpdate(order.id, "shipped")}
                          className="flex-1 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition text-sm"
                        >
                          Mark as Shipped
                        </button>
                      )}
                      {order.status === "shipped" && (
                        <button
                          onClick={() => handleStatusUpdate(order.id, "delivered")}
                          className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition text-sm"
                        >
                          Mark as Delivered
                        </button>
                      )}
                      {(order.status === "pending" || order.status === "confirmed") && (
                        <button
                          onClick={() => handleStatusUpdate(order.id, "cancelled")}
                          className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition text-sm"
                        >
                          Cancel Order
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
