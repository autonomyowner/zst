import { notFound } from 'next/navigation'
import { createServerComponentClient } from '@/lib/supabase-server'
import type { ListingWithProduct } from '@/types/database'
import ProductClient from './ProductClient'

// Revalidate every hour (3600 seconds)
export const revalidate = 3600

async function getProduct(id: string): Promise<ListingWithProduct | null> {
  try {
    const supabase = await createServerComponentClient()
    
    const { data, error } = await supabase
      .from('listings')
      .select(`
        *,
        product:products(*, category:categories(*))
      `)
      .eq('id', id)
      .eq('target_role', 'customer')
      .single()

    if (error || !data) {
      return null
    }

    return data as ListingWithProduct
  } catch (error) {
    console.error('Error in getProduct:', error)
    return null
  }
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const listing = await getProduct(id)

  if (!listing) {
    notFound()
  }

  return <ProductClient listing={listing} />
}
