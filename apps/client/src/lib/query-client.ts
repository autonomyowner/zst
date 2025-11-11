// TanStack Query client configuration for optimal performance

import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Cache data for 5 minutes
      staleTime: 5 * 60 * 1000,
      // Keep unused data in cache for 10 minutes
      gcTime: 10 * 60 * 1000,
      // Retry failed requests once
      retry: 1,
      // Refetch on window focus for fresh data
      refetchOnWindowFocus: true,
      // Refetch on reconnect
      refetchOnReconnect: true,
      // Don't refetch on mount if data is fresh
      refetchOnMount: false,
    },
    mutations: {
      // Retry failed mutations once
      retry: 1,
    },
  },
})

// Query keys for consistent caching
export const queryKeys = {
  // Auth
  auth: ['auth'] as const,
  profile: (userId: string) => ['profile', userId] as const,

  // Listings
  listings: {
    all: ['listings'] as const,
    byRole: (targetRole: string) => ['listings', 'role', targetRole] as const,
    byId: (id: number) => ['listings', id] as const,
    bySeller: (sellerId: string) => ['listings', 'seller', sellerId] as const,
  },

  // Products
  products: {
    all: ['products'] as const,
    byId: (id: number) => ['products', id] as const,
    byCategory: (categoryId: number) => ['products', 'category', categoryId] as const,
  },

  // Orders
  orders: {
    b2c: {
      all: ['orders', 'b2c'] as const,
      byUser: (userId: string) => ['orders', 'b2c', 'user', userId] as const,
      bySeller: (sellerId: string) => ['orders', 'b2c', 'seller', sellerId] as const,
      byId: (id: number) => ['orders', 'b2c', id] as const,
    },
    b2b: {
      all: ['orders', 'b2b'] as const,
      byBuyer: (buyerId: string) => ['orders', 'b2b', 'buyer', buyerId] as const,
      bySeller: (sellerId: string) => ['orders', 'b2b', 'seller', sellerId] as const,
      byId: (id: number) => ['orders', 'b2b', id] as const,
    },
  },

  // Categories
  categories: {
    all: ['categories'] as const,
    byId: (id: number) => ['categories', id] as const,
  },

  // Admin
  admin: {
    users: ['admin', 'users'] as const,
    allOrders: ['admin', 'orders'] as const,
    allListings: ['admin', 'listings'] as const,
  },
}
