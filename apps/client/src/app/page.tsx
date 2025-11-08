import { createServerComponentClient } from '@/lib/supabase-server'
import type { ListingWithProduct, Category } from '@/types/database'
import HomePageClient from './HomePageClient'

// Revalidate every 5 minutes (300 seconds)
export const revalidate = 300

async function getListings(): Promise<ListingWithProduct[]> {
  try {
    const supabase = await createServerComponentClient()
    
    const { data, error } = await supabase
      .from('listings')
      .select(`
        *,
        product:products(*, category:categories(*))
      `)
      .eq('target_role', 'customer')
      .gt('stock_quantity', 0)
      .order('created_at', { ascending: false })
      .limit(100)

    if (error) {
      console.error('Error fetching listings:', error)
      return []
    }

    // Filter to ensure only customer listings
    const filteredData = (data || []).filter((listing: ListingWithProduct) => {
      return listing.target_role === 'customer'
    })

    return filteredData as ListingWithProduct[]
  } catch (error) {
    console.error('Error in getListings:', error)
    return []
  }
}

async function getCategories(): Promise<Category[]> {
  try {
    const supabase = await createServerComponentClient()
    
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('name')

    if (error) {
      console.error('Error fetching categories:', error)
      return []
    }

    return (data || []) as Category[]
  } catch (error) {
    console.error('Error in getCategories:', error)
    return []
  }
}

export default async function LandingPage() {
  const [listings, categories] = await Promise.all([
    getListings(),
    getCategories(),
  ])

  return (
    <HomePageClient 
      initialListings={listings}
      initialCategories={categories}
    />
  )
}
