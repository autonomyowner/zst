"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/OptimizedAuthContext";
import { supabase } from "@/lib/supabase";
import { formatDZD } from "@/lib/utils/currency";
import AuthLoadingSpinner from "@/components/AuthLoadingSpinner";
import Image from "next/image";
import type { ListingWithProduct } from "@/types/database";

export default function WholesalerBuy() {
  const router = useRouter();
  const { user, profile, loading: authLoading } = useAuth();
  const [offers, setOffers] = useState<ListingWithProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState<Map<number, number>>(new Map());

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

      fetchOffers();
    }
  }, [user, profile, authLoading, router]);

  const fetchOffers = async () => {
    if (!supabase) return;
    try {
      const { data, error } = await supabase
        .from("listings")
        .select(`
          *,
          product:products(*)
        `)
        .eq("target_role", "wholesaler")
        .eq("is_bulk_offer", true)
        .gt("stock_quantity", 0)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setOffers(data || []);
    } catch (error) {
      console.error("Error fetching offers:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = (offerId: number, minQty: number) => {
    const newCart = new Map(cart);
    newCart.set(offerId, minQty);
    setCart(newCart);
  };

  const handleUpdateQuantity = (offerId: number, quantity: number) => {
    const newCart = new Map(cart);
    if (quantity <= 0) {
      newCart.delete(offerId);
    } else {
      newCart.set(offerId, quantity);
    }
    setCart(newCart);
  };

  const handleCheckout = async () => {
    if (cart.size === 0) {
      alert("Please add items to your cart");
      return;
    }

    if (!supabase) {
      alert("Supabase client not initialized");
      return;
    }

    try {
      // Group cart items by seller
      const itemsBySeller = new Map<string, Array<{ listingId: number; quantity: number; price: number }>>();

      for (const [listingId, quantity] of cart.entries()) {
        const offer = offers.find(o => o.id === listingId);
        if (!offer) continue;

        if (!itemsBySeller.has(offer.seller_id)) {
          itemsBySeller.set(offer.seller_id, []);
        }

        itemsBySeller.get(offer.seller_id)!.push({
          listingId,
          quantity,
          price: Number(offer.price),
        });
      }

      // Create separate order for each seller
      for (const [sellerId, items] of itemsBySeller.entries()) {
        const totalPrice = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

        // Create order
        const { data: order, error: orderError } = await supabase
          .from("orders_b2b")
          .insert({
            buyer_id: user?.id,
            seller_id: sellerId,
            total_price: totalPrice,
            status: "pending",
          })
          .select()
          .single();

        if (orderError) throw orderError;

        // Create order items
        const orderItems = items.map(item => ({
          order_id: order.id,
          listing_id: item.listingId,
          quantity: item.quantity,
          price_at_purchase: item.price,
        }));

        const { error: itemsError } = await supabase
          .from("order_items_b2b")
          .insert(orderItems);

        if (itemsError) throw itemsError;

        // Update stock
        for (const item of items) {
          await supabase.rpc("decrement_stock", {
            listing_id: item.listingId,
            quantity: item.quantity,
          });
        }
      }

      alert("Orders placed successfully!");
      setCart(new Map());
      router.push("/wholesaler/orders/purchases");
    } catch (error) {
      console.error("Error placing order:", error);
      alert("Failed to place order. Please try again.");
    }
  };

  const cartTotal = Array.from(cart.entries()).reduce((sum, [listingId, quantity]) => {
    const offer = offers.find(o => o.id === listingId);
    return sum + (offer ? Number(offer.price) * quantity : 0);
  }, 0);

  if (authLoading || loading) {
    return <AuthLoadingSpinner />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Browse Importer Offers</h1>
            <p className="text-gray-600 mt-2">Purchase bulk offers from importers</p>
          </div>
          {cart.size > 0 && (
            <div className="bg-white rounded-lg shadow p-4">
              <p className="text-sm text-gray-600">Cart Total</p>
              <p className="text-2xl font-bold text-gray-900">{formatDZD(cartTotal)}</p>
              <button
                onClick={handleCheckout}
                className="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition mt-2"
              >
                Checkout ({cart.size})
              </button>
            </div>
          )}
        </div>

        {/* Offers Grid */}
        {offers.length === 0 ? (
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
                d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
              />
            </svg>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No offers available</h3>
            <p className="text-gray-600">Check back later for bulk offers from importers</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {offers.map((offer) => (
              <div key={offer.id} className="bg-white rounded-lg shadow overflow-hidden">
                {/* Image */}
                <div className="relative h-48 bg-gray-200">
                  {offer.product?.image_url ? (
                    <Image
                      src={offer.product.image_url}
                      alt={offer.product.name || "Product"}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <svg
                        className="w-16 h-16 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {offer.product?.name || "Unnamed Product"}
                  </h3>
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                    {offer.product?.description || "No description"}
                  </p>

                  {/* Stats */}
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Price:</span>
                      <span className="font-semibold text-gray-900">{formatDZD(Number(offer.price))}/unit</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Stock:</span>
                      <span className="font-semibold text-green-600">{offer.stock_quantity} units</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Min Order:</span>
                      <span className="font-semibold text-gray-900">{offer.min_order_quantity || 1} units</span>
                    </div>
                  </div>

                  {/* Cart Controls */}
                  {cart.has(offer.id) ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleUpdateQuantity(offer.id, cart.get(offer.id)! - 1)}
                          className="bg-gray-200 text-gray-700 px-3 py-1 rounded hover:bg-gray-300 transition"
                        >
                          -
                        </button>
                        <input
                          type="number"
                          value={cart.get(offer.id)}
                          onChange={(e) => handleUpdateQuantity(offer.id, parseInt(e.target.value) || 0)}
                          min={offer.min_order_quantity || 1}
                          max={offer.stock_quantity}
                          className="flex-1 text-center border border-gray-300 rounded px-2 py-1"
                        />
                        <button
                          onClick={() => handleUpdateQuantity(offer.id, cart.get(offer.id)! + 1)}
                          className="bg-gray-200 text-gray-700 px-3 py-1 rounded hover:bg-gray-300 transition"
                        >
                          +
                        </button>
                      </div>
                      <button
                        onClick={() => handleUpdateQuantity(offer.id, 0)}
                        className="w-full bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition text-sm"
                      >
                        Remove from Cart
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleAddToCart(offer.id, offer.min_order_quantity || 1)}
                      className="w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
                    >
                      Add to Cart
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
