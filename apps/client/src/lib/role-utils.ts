// Role-based utility functions for 5-tier hierarchy

import type { UserRole, TargetRole } from '@/types/database'

/**
 * 5-Tier Hierarchy:
 * Tier 0: Admin - Full platform control
 * Tier 1: Importer - Sells bulk "Offers" to Wholesalers
 * Tier 2: Wholesaler - Buys from Importers, sells "Products" to Retailers
 * Tier 3: Retailer - Buys from Wholesalers, sells "Products" to Customers
 * Tier 4: Normal User - Buys from Retailers as end consumer
 */

export const ROLE_HIERARCHY: Record<UserRole, number> = {
  admin: 0,
  importer: 1,
  wholesaler: 2,
  retailer: 3,
  normal_user: 4,
}

/**
 * Get the target role for listings created by a given user role
 * This enforces the strict downstream flow of products
 */
export function getTargetRoleForSeller(sellerRole: UserRole): TargetRole | null {
  switch (sellerRole) {
    case 'importer':
      return 'wholesaler' // Importers sell to Wholesalers
    case 'wholesaler':
      return 'retailer' // Wholesalers sell to Retailers
    case 'retailer':
      return 'customer' // Retailers sell to Customers (Normal Users)
    case 'admin':
      return 'customer' // Admins can create test listings for customers
    case 'normal_user':
      return null // Normal users cannot create listings
    default:
      return null
  }
}

/**
 * Get the target role to query for a buyer
 * This determines what listings a user can see/purchase
 */
export function getTargetRoleForBuyer(buyerRole: UserRole): TargetRole | null {
  switch (buyerRole) {
    case 'wholesaler':
      return 'wholesaler' // Wholesalers buy from Importers (target_role='wholesaler')
    case 'retailer':
      return 'retailer' // Retailers buy from Wholesalers (target_role='retailer')
    case 'normal_user':
      return 'customer' // Normal Users buy from Retailers (target_role='customer')
    case 'admin':
      return 'customer' // Admins can browse public marketplace
    case 'importer':
      return 'customer' // Importers can browse public marketplace as shoppers
    default:
      return null
  }
}

/**
 * Check if a user role can create listings
 */
export function canCreateListings(role: UserRole): boolean {
  return ['admin', 'importer', 'wholesaler', 'retailer'].includes(role)
}

/**
 * Check if a user role can place B2B orders
 */
export function canPlaceB2BOrders(role: UserRole): boolean {
  return ['importer', 'wholesaler', 'retailer'].includes(role)
}

/**
 * Check if a user role can place B2C orders
 */
export function canPlaceB2COrders(role: UserRole): boolean {
  return role === 'normal_user'
}

/**
 * Check if a user role should use bulk offers (Importer-specific)
 */
export function shouldUseBulkOffers(role: UserRole): boolean {
  return role === 'importer'
}

/**
 * Get the portal route prefix for a given role
 */
export function getPortalRoute(role: UserRole): string {
  switch (role) {
    case 'admin':
      return '/admin'
    case 'importer':
      return '/importer'
    case 'wholesaler':
      return '/wholesaler'
    case 'retailer':
      return '/retailer'
    case 'normal_user':
      return '/' // Public marketplace
    default:
      return '/'
  }
}

/**
 * Get the dashboard route for a given role
 */
export function getDashboardRoute(role: UserRole): string {
  switch (role) {
    case 'admin':
      return '/admin/dashboard'
    case 'importer':
      return '/importer/dashboard'
    case 'wholesaler':
      return '/wholesaler/dashboard'
    case 'retailer':
      return '/retailer/dashboard'
    case 'normal_user':
      return '/my-orders' // Normal users see their order history
    default:
      return '/'
  }
}

/**
 * Get human-readable role name
 */
export function getRoleDisplayName(role: UserRole): string {
  switch (role) {
    case 'admin':
      return 'Administrator'
    case 'importer':
      return 'Importer'
    case 'wholesaler':
      return 'Wholesaler'
    case 'retailer':
      return 'Retailer'
    case 'normal_user':
      return 'Customer'
    default:
      return 'User'
  }
}

/**
 * Check if role A can view role B's profile/data
 * Admins can view all, users can view themselves and downstream tiers
 */
export function canViewRole(viewerRole: UserRole, targetRole: UserRole): boolean {
  if (viewerRole === 'admin') return true
  if (viewerRole === targetRole) return true

  const viewerTier = ROLE_HIERARCHY[viewerRole]
  const targetTier = ROLE_HIERARCHY[targetRole]

  // Can only view roles at same or lower tier (higher number)
  return viewerTier <= targetTier
}

/**
 * Get available buyer roles for a seller
 * Used in admin interfaces to show who can see a listing
 */
export function getAvailableBuyerRoles(sellerRole: UserRole): UserRole[] {
  const targetRole = getTargetRoleForSeller(sellerRole)
  if (!targetRole) return []

  switch (targetRole) {
    case 'wholesaler':
      return ['wholesaler']
    case 'retailer':
      return ['retailer']
    case 'customer':
      return ['normal_user']
    default:
      return []
  }
}
