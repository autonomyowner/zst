import { supabase } from './supabase'

/**
 * Upload a product image to Supabase Storage
 * @param file - The image file to upload
 * @param userId - The user ID for organizing files
 * @returns Promise resolving to the public URL of the uploaded image
 */
export async function uploadProductImage(
  file: File,
  userId: string
): Promise<string> {
  if (!supabase) {
    throw new Error('Supabase client not configured')
  }

  // Validate file type
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
  if (!validTypes.includes(file.type)) {
    throw new Error('Invalid file type. Please upload a JPEG, PNG, WebP, or GIF image.')
  }

  // Validate file size (max 5MB)
  const maxSize = 5 * 1024 * 1024 // 5MB in bytes
  if (file.size > maxSize) {
    throw new Error('File size too large. Please upload an image smaller than 5MB.')
  }

  // Generate unique filename
  const timestamp = Date.now()
  const randomString = Math.random().toString(36).substring(2, 15)
  const fileExtension = file.name.split('.').pop() || 'jpg'
  const fileName = `${userId}/${timestamp}-${randomString}.${fileExtension}`

  // Upload to Supabase Storage
  const { data, error } = await supabase.storage
    .from('product_images')
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false,
    })

  if (error) {
    console.error('Error uploading image:', error)
    
    // Provide helpful error message for missing bucket
    if (error.message?.includes('Bucket not found') || error.message?.includes('bucket') || error.statusCode === 400) {
      throw new Error(
        'Storage bucket not found. Please create the "product_images" bucket in Supabase Storage. ' +
        'See STORAGE_SETUP.md for instructions.'
      )
    }
    
    throw new Error(`Failed to upload image: ${error.message}`)
  }

  // Get public URL
  const { data: urlData } = supabase.storage
    .from('product_images')
    .getPublicUrl(data.path)

  if (!urlData?.publicUrl) {
    throw new Error('Failed to get public URL for uploaded image')
  }

  return urlData.publicUrl
}

/**
 * Delete a product image from Supabase Storage
 * @param imageUrl - The public URL of the image to delete
 */
export async function deleteProductImage(imageUrl: string): Promise<void> {
  if (!supabase) {
    throw new Error('Supabase client not configured')
  }

  try {
    // Extract the file path from the URL
    const url = new URL(imageUrl)
    const pathParts = url.pathname.split('/')
    const bucketIndex = pathParts.findIndex(part => part === 'product_images')
    
    if (bucketIndex === -1) {
      throw new Error('Invalid image URL')
    }

    const filePath = pathParts.slice(bucketIndex + 1).join('/')

    // Delete from storage
    const { error } = await supabase.storage
      .from('product_images')
      .remove([filePath])

    if (error) {
      console.error('Error deleting image:', error)
      // Don't throw - deletion is not critical if it fails
    }
  } catch (error) {
    console.error('Error deleting image:', error)
    // Don't throw - deletion is not critical if it fails
  }
}

