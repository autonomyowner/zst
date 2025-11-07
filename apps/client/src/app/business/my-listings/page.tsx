"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/contexts/AuthContext"
import { uploadProductImage } from "@/lib/storage"
import type { ListingWithProduct, Product, Category, TargetRole } from "@/types/database"

// Force dynamic rendering to prevent caching
export const dynamic = 'force-dynamic'

export default function MyListingsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, profile, loading: authLoading } = useAuth()
  const [listings, setListings] = useState<ListingWithProduct[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(searchParams.get('create') === 'true')
  const [editingListing, setEditingListing] = useState<ListingWithProduct | null>(null)
  const [uploadingImage, setUploadingImage] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [formData, setFormData] = useState({
    productName: '',
    productDescription: '',
    categoryId: '',
    price: '',
    stock_quantity: '',
  })

  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [imageError, setImageError] = useState<string | null>(null)

  useEffect(() => {
    if (!authLoading) {
      if (!user || !profile) {
        router.push('/business/login')
        return
      }
      Promise.all([
        fetchListings(),
        fetchCategories(),
      ])
    }
  }, [user, profile, authLoading, router])

  const fetchListings = async () => {
    if (!supabase || !profile) return

    try {
      const { data, error } = await supabase
        .from('listings')
        .select(`
          *,
          product:products(*, category:categories(*))
        `)
        .eq('seller_id', profile.id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching listings:', error)
        return
      }

      setListings((data || []) as ListingWithProduct[])
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchCategories = async () => {
    if (!supabase) return

    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name')

      if (error) {
        console.error('Error fetching categories:', error)
        return
      }

      setCategories(data || [])
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setImageError(null)

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
    if (!validTypes.includes(file.type)) {
      setImageError('Invalid file type. Please upload a JPEG, PNG, WebP, or GIF image.')
      return
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      setImageError('File size too large. Please upload an image smaller than 5MB.')
      return
    }

    setImageFile(file)

    // Create preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setImagePreview(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const removeImage = () => {
    setImageFile(null)
    setImagePreview(null)
    setImageError(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const getTargetRoleForUser = (userRole: string): TargetRole => {
    switch (userRole) {
      case 'retailer':
        return 'customer'
      case 'wholesaler':
        return 'retailer'
      case 'importer':
        return 'wholesaler'
      default:
        return 'customer'
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!supabase || !profile || !user) return

    // Validate required fields
    if (!formData.productName.trim()) {
      alert('Please enter a product name.')
      return
    }

    if (!formData.categoryId || formData.categoryId === '') {
      alert('Please select a category.')
      return
    }

    if (!formData.price || parseFloat(formData.price) <= 0) {
      alert('Please enter a valid price.')
      return
    }

    if (!formData.stock_quantity || parseInt(formData.stock_quantity) < 0) {
      alert('Please enter a valid stock quantity.')
      return
    }

    // Validate image for new listings
    if (!editingListing && !imageFile && !imagePreview) {
      alert('Please upload a product image.')
      return
    }

    try {
      setUploadingImage(true)
      let imageUrl: string | null = null

      // Upload new image if provided
      if (imageFile) {
        try {
          imageUrl = await uploadProductImage(imageFile, user.id)
        } catch (uploadError: any) {
          alert(uploadError.message || 'Failed to upload image. Please try again.')
          setUploadingImage(false)
          return
        }
      } else if (editingListing && imagePreview && !imagePreview.startsWith('data:')) {
        // If editing and imagePreview is a URL (not a data URL), use it
        imageUrl = imagePreview
      } else if (editingListing && editingListing.product?.image_url) {
        // If editing and no new image selected, use existing product image
        imageUrl = editingListing.product.image_url
      }

      const targetRole = getTargetRoleForUser(profile.role)

      if (editingListing) {
        // Update existing product
        const productUpdateData: any = {
          name: formData.productName.trim(),
          description: formData.productDescription.trim() || null,
          category_id: parseInt(formData.categoryId),
        }

        // Update image_url if we have a valid URL (either new upload or existing)
        if (imageUrl) {
          productUpdateData.image_url = imageUrl
        }

        const { error: productError } = await supabase
          .from('products')
          .update(productUpdateData)
          .eq('id', editingListing.product_id)

        if (productError) {
          console.error('Error updating product:', productError)
          alert('Failed to update product. Please try again.')
          setUploadingImage(false)
          return
        }

        // Update listing - ensure target_role matches user's role (cannot be changed)
        const currentTargetRole = getTargetRoleForUser(profile.role)
        const { error: listingError } = await supabase
          .from('listings')
          .update({
            price: parseFloat(formData.price),
            stock_quantity: parseInt(formData.stock_quantity),
            target_role: currentTargetRole, // Ensure target_role is correct for user's role
          })
          .eq('id', editingListing.id)

        if (listingError) {
          console.error('Error updating listing:', listingError)
          alert('Failed to update listing. Please try again.')
          setUploadingImage(false)
          return
        }
      } else {
        // Create new product
        const { data: newProduct, error: productError } = await supabase
          .from('products')
          .insert({
            name: formData.productName.trim(),
            description: formData.productDescription.trim() || null,
            image_url: imageUrl,
            category_id: parseInt(formData.categoryId),
          })
          .select()
          .single()

        if (productError || !newProduct) {
          console.error('Error creating product:', productError)
          alert('Failed to create product. Please try again.')
          setUploadingImage(false)
          return
        }

        // Create new listing
        const { error: listingError } = await supabase
          .from('listings')
          .insert({
            product_id: newProduct.id,
            seller_id: profile.id,
            price: parseFloat(formData.price),
            stock_quantity: parseInt(formData.stock_quantity),
            target_role: targetRole,
          })

        if (listingError) {
          console.error('Error creating listing:', listingError)
          alert('Failed to create listing. Please try again.')
          setUploadingImage(false)
          return
        }
      }

      // Reset form and refresh
      setFormData({ productName: '', productDescription: '', categoryId: '', price: '', stock_quantity: '' })
      setImageFile(null)
      setImagePreview(null)
      setImageError(null)
      setShowCreateForm(false)
      setEditingListing(null)
      setUploadingImage(false)
      await fetchListings()
      
      // Show success message
      if (editingListing) {
        alert('Listing updated successfully!')
      } else {
        alert('Listing created successfully!')
      }
    } catch (error) {
      console.error('Error:', error)
      alert('An error occurred. Please try again.')
      setUploadingImage(false)
    }
  }

  const handleEdit = (listing: ListingWithProduct) => {
    setEditingListing(listing)
    setFormData({
      productName: listing.product.name,
      productDescription: listing.product.description || '',
      categoryId: listing.product.category_id?.toString() || '',
      price: listing.price.toString(),
      stock_quantity: listing.stock_quantity.toString(),
    })
    // Set existing image preview
    if (listing.product.image_url) {
      setImagePreview(listing.product.image_url)
    } else {
      setImagePreview(null)
    }
    setImageFile(null)
    setImageError(null)
    setShowCreateForm(true)
  }

  const handleDelete = async (listingId: number) => {
    if (!supabase) return
    if (!confirm('Are you sure you want to delete this listing?')) return

    try {
      const { error } = await supabase
        .from('listings')
        .delete()
        .eq('id', listingId)

      if (error) {
        console.error('Error deleting listing:', error)
        alert('Failed to delete listing. Please try again.')
        return
      }

      await fetchListings()
    } catch (error) {
      console.error('Error:', error)
      alert('An error occurred. Please try again.')
    }
  }

  const cancelForm = () => {
    setFormData({ productName: '', productDescription: '', categoryId: '', price: '', stock_quantity: '' })
    setImageFile(null)
    setImagePreview(null)
    setImageError(null)
    setShowCreateForm(false)
    setEditingListing(null)
  }

  if (authLoading || loading) {
    return (
      <div className="max-w-7xl mx-auto px-2 sm:px-4 py-4 sm:py-8">
        <div className="animate-pulse">
          <div className="h-6 sm:h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
        </div>
      </div>
    )
  }

  if (!profile) {
    return null
  }

  return (
    <div className="max-w-7xl mx-auto px-2 sm:px-4 py-4 sm:py-6 md:py-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 md:mb-8 gap-3">
        <h1 className="text-2xl sm:text-3xl font-bold text-black">My Listings</h1>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 w-full sm:w-auto">
          {!showCreateForm && (
            <button
              onClick={() => setShowCreateForm(true)}
              className="px-3 sm:px-4 py-2 bg-yellow-400 text-black font-medium rounded-lg hover:bg-yellow-300 transition-colors text-sm sm:text-base min-h-[44px]"
            >
              Create Listing
            </button>
          )}
          <Link
            href="/business/dashboard"
            className="px-3 sm:px-4 py-2 border border-gray-300 text-black font-medium rounded-lg hover:bg-gray-50 transition-colors text-sm sm:text-base min-h-[44px] flex items-center justify-center"
          >
            Dashboard
          </Link>
        </div>
      </div>

      {showCreateForm && (
        <div className="bg-gray-50 rounded-lg p-4 sm:p-6 mb-4 sm:mb-6 md:mb-8">
          <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">
            {editingListing ? 'Edit Listing' : 'Create New Listing'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
            <div>
              <label htmlFor="productName" className="block text-sm font-medium text-gray-700 mb-1">
                Product Name *
              </label>
              <input
                type="text"
                id="productName"
                required
                value={formData.productName}
                onChange={(e) => setFormData({ ...formData, productName: e.target.value })}
                className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent text-sm sm:text-base"
                placeholder="Enter product name"
              />
            </div>

            <div>
              <label htmlFor="productDescription" className="block text-sm font-medium text-gray-700 mb-1">
                Product Description (Optional)
              </label>
              <textarea
                id="productDescription"
                value={formData.productDescription}
                onChange={(e) => setFormData({ ...formData, productDescription: e.target.value })}
                rows={3}
                className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent text-sm sm:text-base resize-none"
                placeholder="Describe your product..."
              />
            </div>

            <div>
              <label htmlFor="categoryId" className="block text-sm font-medium text-gray-700 mb-1">
                Category *
              </label>
              <select
                id="categoryId"
                required
                value={formData.categoryId}
                onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent text-sm sm:text-base min-h-[44px]"
              >
                <option value="">Select a category</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="productImage" className="block text-sm font-medium text-gray-700 mb-1">
                Product Image *
                {!editingListing && <span className="text-red-500 ml-1">(Required)</span>}
                {editingListing && <span className="text-gray-500 ml-1 text-xs">(Optional - leave empty to keep current image)</span>}
              </label>
              <input
                ref={fileInputRef}
                type="file"
                id="productImage"
                accept="image/*"
                onChange={handleImageChange}
                className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent text-sm sm:text-base min-h-[44px]"
                disabled={uploadingImage}
              />
              {imageError && (
                <p className="text-xs sm:text-sm text-red-600 mt-1">{imageError}</p>
              )}
              {imagePreview && (
                <div className="mt-3 sm:mt-4 relative">
                  <div className="relative w-full h-40 sm:h-48 rounded-lg overflow-hidden border border-gray-300">
                    <Image
                      src={imagePreview}
                      alt="Product preview"
                      fill
                      className="object-cover"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={removeImage}
                    className="mt-2 px-3 sm:px-4 py-2 bg-red-600 text-white text-xs sm:text-sm rounded-lg hover:bg-red-700 transition-colors min-h-[44px] w-full sm:w-auto"
                    disabled={uploadingImage}
                  >
                    Remove Image
                  </button>
                </div>
              )}
              {uploadingImage && (
                <p className="text-xs sm:text-sm text-blue-600 mt-2">Uploading image...</p>
              )}
            </div>

            <div>
              <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">
                Price ($) *
              </label>
              <input
                type="number"
                id="price"
                required
                min="0"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent text-sm sm:text-base min-h-[44px]"
                placeholder="0.00"
              />
            </div>

            <div>
              <label htmlFor="stock_quantity" className="block text-sm font-medium text-gray-700 mb-1">
                Stock Quantity *
              </label>
              <input
                type="number"
                id="stock_quantity"
                required
                min="0"
                value={formData.stock_quantity}
                onChange={(e) => setFormData({ ...formData, stock_quantity: e.target.value })}
                className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent text-sm sm:text-base min-h-[44px]"
                placeholder="0"
              />
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-xs sm:text-sm text-blue-800">
                <strong>Target Role:</strong> {getTargetRoleForUser(profile.role)}
                <br />
                {profile.role === 'retailer' && 'Your listings will be visible to customers'}
                {profile.role === 'wholesaler' && 'Your listings will be visible to retailers'}
                {profile.role === 'importer' && 'Your listings will be visible to wholesalers'}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <button
                type="submit"
                disabled={uploadingImage}
                className="flex-1 sm:flex-none px-4 sm:px-6 py-2 bg-black text-white font-medium rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base min-h-[44px]"
              >
                {uploadingImage ? 'Uploading...' : editingListing ? 'Update Listing' : 'Create Listing'}
              </button>
              <button
                type="button"
                onClick={cancelForm}
                disabled={uploadingImage}
                className="flex-1 sm:flex-none px-4 sm:px-6 py-2 border border-gray-300 text-black font-medium rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base min-h-[44px]"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {listings.length === 0 ? (
        <div className="text-center py-8 sm:py-12 bg-gray-50 rounded-lg p-4 sm:p-6">
          <p className="text-gray-500 text-base sm:text-lg mb-4">You don't have any listings yet.</p>
          <button
            onClick={() => setShowCreateForm(true)}
            className="px-4 sm:px-6 py-3 bg-yellow-400 text-black font-medium rounded-lg hover:bg-yellow-300 transition-colors text-sm sm:text-base min-h-[44px]"
          >
            Create Your First Listing
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {listings.map((listing) => (
            <div
              key={listing.id}
              className="bg-white border border-gray-200 rounded-lg p-3 sm:p-4 hover:shadow-lg transition-shadow"
            >
              {listing.product.image_url ? (
                <Image
                  src={listing.product.image_url}
                  alt={listing.product.name}
                  width={300}
                  height={300}
                  className="w-full h-40 sm:h-48 object-cover rounded-lg mb-3 sm:mb-4"
                />
              ) : (
                <div className="w-full h-40 sm:h-48 bg-gray-200 rounded-lg mb-3 sm:mb-4 flex items-center justify-center">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-300 rounded"></div>
                </div>
              )}
              <h3 className="font-semibold text-base sm:text-lg mb-2 line-clamp-2">{listing.product.name}</h3>
              <p className="text-xl sm:text-2xl font-bold text-black mb-2">
                ${listing.price.toFixed(2)}
              </p>
              <p className="text-xs sm:text-sm text-gray-600 mb-2">
                Stock: {listing.stock_quantity}
              </p>
              <p className="text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4 capitalize">
                Target: {listing.target_role}
              </p>
              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  onClick={() => handleEdit(listing)}
                  className="flex-1 px-3 sm:px-4 py-2 bg-yellow-400 text-black font-medium rounded-lg hover:bg-yellow-300 transition-colors text-sm sm:text-base min-h-[44px]"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(listing.id)}
                  className="flex-1 px-3 sm:px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors text-sm sm:text-base min-h-[44px]"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

