// Optimized hooks for orders with caching and real-time updates

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { queryKeys } from '@/lib/query-client'
import type { OrderB2CWithItems, OrderB2BWithItems, OrderB2C, OrderStatusB2C } from '@/types/database'
import { useEffect } from 'react'

/**
 * Fetch B2C orders for current user (normal users see their own orders)
 */
export function useMyB2COrders(userId: string | null) {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: queryKeys.orders.b2c.byUser(userId!),
    queryFn: async (): Promise<OrderB2CWithItems[]> => {
      if (!supabase || !userId) return []

      const { data, error } = await supabase
        .from('orders_b2c')
        .select(`
          *,
          items:order_items_b2c(
            *,
            listing:listings(
              *,
              product:products(*)
            )
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) throw error
      return (data || []) as OrderB2CWithItems[]
    },
    enabled: !!userId,
    staleTime: 1 * 60 * 1000, // 1 minute
  })

  // Real-time subscription for order updates
  useEffect(() => {
    if (!supabase || !userId) return

    const channel = supabase
      .channel(`orders_b2c:user:${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders_b2c',
          filter: `user_id=eq.${userId}`,
        },
        () => {
          queryClient.invalidateQueries({
            queryKey: queryKeys.orders.b2c.byUser(userId),
          })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId, queryClient])

  return query
}

/**
 * Fetch B2C orders for seller (retailers see orders for their listings)
 */
export function useSellerB2COrders(sellerId: string | null) {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: queryKeys.orders.b2c.bySeller(sellerId!),
    queryFn: async (): Promise<OrderB2CWithItems[]> => {
      if (!supabase || !sellerId) return []

      try {
        // Step 1: Get all listing IDs for this seller
        const { data: listings, error: listingsError } = await supabase
          .from('listings')
          .select('id')
          .eq('seller_id', sellerId)

        if (listingsError) throw listingsError

        const listingIds = (listings || []).map(l => l.id)
        if (!Array.isArray(listingIds) || listingIds.length === 0) return []

        // Step 2: Get all order items for these listing IDs
        const { data: orderItems, error: itemsError } = await supabase
          .from('order_items_b2c')
          .select('order_id')
          .in('listing_id', listingIds)

        if (itemsError) {
          console.error('Error fetching order items:', itemsError)
          return []
        }

        // Step 3: Extract unique order IDs
        const orderIds = [...new Set((orderItems || []).map(item => item.order_id))]

        if (!Array.isArray(orderIds) || orderIds.length === 0) return []

        // Step 4: Fetch complete orders with all details
        const { data: orders, error: ordersError } = await supabase
          .from('orders_b2c')
          .select(`
            *,
            items:order_items_b2c(
              *,
              listing:listings(
                *,
                product:products(*)
              )
            )
          `)
          .in('id', orderIds)
          .order('created_at', { ascending: false })

        if (ordersError) throw ordersError

        // Step 5: Filter items to only show seller's items
        const filteredOrders = (orders || [])
          .map(order => ({
            ...order,
            items: (order.items || []).filter(item => listingIds.includes(item.listing_id))
          }))
          .filter(order => order.items && order.items.length > 0)

        return filteredOrders as OrderB2CWithItems[]
      } catch (error) {
        console.error('Error fetching seller orders:', error)
        throw error
      }
    },
    enabled: !!sellerId,
    staleTime: 1 * 60 * 1000,
  })

  // Real-time subscription
  useEffect(() => {
    if (!supabase || !sellerId) return

    const channel = supabase
      .channel(`orders_b2c:seller:${sellerId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders_b2c',
        },
        () => {
          queryClient.invalidateQueries({
            queryKey: queryKeys.orders.b2c.bySeller(sellerId),
          })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [sellerId, queryClient])

  return query
}

/**
 * Create B2C order (COD checkout)
 */
export function useCreateB2COrder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (order: Omit<OrderB2C, 'id' | 'created_at' | 'updated_at'>) => {
      if (!supabase) throw new Error('Supabase client not initialized')

      const { data, error } = await supabase
        .from('orders_b2c')
        .insert(order)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: (_, variables) => {
      // Invalidate user's orders
      if (variables.user_id) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.orders.b2c.byUser(variables.user_id),
        })
      }
    },
  })
}

/**
 * Update B2C order status (for retailers)
 */
export function useUpdateB2COrderStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      orderId,
      status,
    }: {
      orderId: number
      status: OrderStatusB2C
    }) => {
      if (!supabase) throw new Error('Supabase client not initialized')

      const { data, error } = await supabase
        .from('orders_b2c')
        .update({ status })
        .eq('id', orderId)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      // Invalidate all B2C order queries
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.b2c.all })
    },
  })
}

/**
 * Fetch B2B orders as buyer
 */
export function useMyB2BPurchases(buyerId: string | null) {
  return useQuery({
    queryKey: queryKeys.orders.b2b.byBuyer(buyerId!),
    queryFn: async (): Promise<OrderB2BWithItems[]> => {
      if (!supabase || !buyerId) return []

      const { data, error } = await supabase
        .from('orders_b2b')
        .select(`
          *,
          items:order_items_b2b(
            *,
            listing:listings(
              *,
              product:products(*)
            )
          ),
          seller:profiles!orders_b2b_seller_id_fkey(*)
        `)
        .eq('buyer_id', buyerId)
        .order('created_at', { ascending: false })

      if (error) throw error
      return (data || []) as OrderB2BWithItems[]
    },
    enabled: !!buyerId,
    staleTime: 1 * 60 * 1000,
  })
}

/**
 * Fetch B2B orders as seller
 */
export function useMyB2BSales(sellerId: string | null) {
  return useQuery({
    queryKey: queryKeys.orders.b2b.bySeller(sellerId!),
    queryFn: async (): Promise<OrderB2BWithItems[]> => {
      if (!supabase || !sellerId) return []

      const { data, error } = await supabase
        .from('orders_b2b')
        .select(`
          *,
          items:order_items_b2b(
            *,
            listing:listings(
              *,
              product:products(*)
            )
          ),
          buyer:profiles!orders_b2b_buyer_id_fkey(*)
        `)
        .eq('seller_id', sellerId)
        .order('created_at', { ascending: false })

      if (error) throw error
      return (data || []) as OrderB2BWithItems[]
    },
    enabled: !!sellerId,
    staleTime: 1 * 60 * 1000,
  })
}

/**
 * Create B2B order
 */
export function useCreateB2BOrder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (order: {
      buyer_id: string
      seller_id: string
      total_price: number
      items: Array<{
        listing_id: number
        quantity: number
        price_at_purchase: number
      }>
    }) => {
      if (!supabase) throw new Error('Supabase client not initialized')

      // Create order
      const { data: orderData, error: orderError } = await supabase
        .from('orders_b2b')
        .insert({
          buyer_id: order.buyer_id,
          seller_id: order.seller_id,
          total_price: order.total_price,
          status: 'pending',
        })
        .select()
        .single()

      if (orderError) throw orderError

      // Create order items
      const items = order.items.map((item) => ({
        order_id: orderData.id,
        ...item,
      }))

      const { error: itemsError } = await supabase
        .from('order_items_b2b')
        .insert(items)

      if (itemsError) throw itemsError

      return orderData
    },
    onSuccess: (_, variables) => {
      // Invalidate buyer's and seller's order queries
      queryClient.invalidateQueries({
        queryKey: queryKeys.orders.b2b.byBuyer(variables.buyer_id),
      })
      queryClient.invalidateQueries({
        queryKey: queryKeys.orders.b2b.bySeller(variables.seller_id),
      })
    },
  })
}
