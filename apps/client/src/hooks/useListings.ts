// Optimized hooks for fetching listings with caching and real-time updates

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { queryKeys } from '@/lib/query-client'
import type { ListingWithProduct, Listing, TargetRole } from '@/types/database'
import { useEffect } from 'react'

/**
 * Fetch all listings visible to current user (based on RLS)
 * Automatically cached and refetched on window focus
 */
export function useListings() {
  return useQuery({
    queryKey: queryKeys.listings.all,
    queryFn: async (): Promise<ListingWithProduct[]> => {
      if (!supabase) throw new Error('Supabase client not initialized')

      const { data, error } = await supabase
        .from('listings')
        .select(`
          *,
          product:products(*)
        `)
        .order('created_at', { ascending: false })

      if (error) throw error
      return (data || []) as ListingWithProduct[]
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}

/**
 * Fetch listings by target role with real-time subscriptions
 */
export function useListingsByRole(targetRole: TargetRole | null) {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: queryKeys.listings.byRole(targetRole || 'customer'),
    queryFn: async (): Promise<ListingWithProduct[]> => {
      if (!supabase || !targetRole) return []

      const { data, error } = await supabase
        .from('listings')
        .select(`
          *,
          product:products(*)
        `)
        .eq('target_role', targetRole)
        .order('created_at', { ascending: false })

      if (error) throw error
      return (data || []) as ListingWithProduct[]
    },
    enabled: !!targetRole,
    staleTime: 2 * 60 * 1000,
  })

  // Real-time subscription to listings changes
  useEffect(() => {
    if (!supabase || !targetRole) return

    const channel = supabase
      .channel(`listings:${targetRole}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'listings',
          filter: `target_role=eq.${targetRole}`,
        },
        () => {
          // Invalidate and refetch when listings change
          queryClient.invalidateQueries({
            queryKey: queryKeys.listings.byRole(targetRole),
          })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [targetRole, queryClient])

  return query
}

/**
 * Fetch single listing by ID
 */
export function useListing(id: number | null) {
  return useQuery({
    queryKey: queryKeys.listings.byId(id!),
    queryFn: async (): Promise<ListingWithProduct | null> => {
      if (!supabase || !id) return null

      const { data, error } = await supabase
        .from('listings')
        .select(`
          *,
          product:products(*)
        `)
        .eq('id', id)
        .single()

      if (error) throw error
      return data as ListingWithProduct
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

/**
 * Fetch listings by seller ID
 */
export function useMyListings(sellerId: string | null) {
  return useQuery({
    queryKey: queryKeys.listings.bySeller(sellerId!),
    queryFn: async (): Promise<ListingWithProduct[]> => {
      if (!supabase || !sellerId) return []

      const { data, error } = await supabase
        .from('listings')
        .select(`
          *,
          product:products(*)
        `)
        .eq('seller_id', sellerId)
        .order('created_at', { ascending: false })

      if (error) throw error
      return (data || []) as ListingWithProduct[]
    },
    enabled: !!sellerId,
    staleTime: 2 * 60 * 1000,
  })
}

/**
 * Create new listing (optimistic update)
 */
export function useCreateListing() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (listing: Omit<Listing, 'id' | 'created_at' | 'updated_at'>) => {
      if (!supabase) throw new Error('Supabase client not initialized')

      const { data, error } = await supabase
        .from('listings')
        .insert(listing)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      // Invalidate all listing queries to refetch
      queryClient.invalidateQueries({ queryKey: queryKeys.listings.all })
    },
  })
}

/**
 * Update listing (optimistic update)
 */
export function useUpdateListing() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: number
      updates: Partial<Listing>
    }) => {
      if (!supabase) throw new Error('Supabase client not initialized')

      const { data, error } = await supabase
        .from('listings')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onMutate: async ({ id, updates }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.listings.byId(id) })

      // Snapshot previous value
      const previousListing = queryClient.getQueryData(queryKeys.listings.byId(id))

      // Optimistically update
      queryClient.setQueryData(queryKeys.listings.byId(id), (old: any) => ({
        ...old,
        ...updates,
      }))

      return { previousListing }
    },
    onError: (_err, { id }, context) => {
      // Rollback on error
      if (context?.previousListing) {
        queryClient.setQueryData(queryKeys.listings.byId(id), context.previousListing)
      }
    },
    onSuccess: () => {
      // Invalidate queries to refetch
      queryClient.invalidateQueries({ queryKey: queryKeys.listings.all })
    },
  })
}

/**
 * Delete listing
 */
export function useDeleteListing() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: number) => {
      if (!supabase) throw new Error('Supabase client not initialized')

      const { error } = await supabase.from('listings').delete().eq('id', id)

      if (error) throw error
      return id
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.listings.all })
    },
  })
}
