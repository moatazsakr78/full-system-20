import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhuYWxmdWFneXZqanh1ZnRkeHJsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDQzNjI0NSwiZXhwIjoyMDY2MDEyMjQ1fQ.AceLkpY_ynX6sEm8WF4G8oXP3MdifOzd581LcvL_VbM'

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error('Missing Supabase environment variables')
}

// Service role client for storage operations
export const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

export const uploadCategoryImage = async (file: File): Promise<string> => {
  try {
    // Generate unique filename
    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
    const filePath = `categories/${fileName}`

    // Upload file to bucket
    const { data, error } = await supabaseAdmin.storage
      .from('category-pos-images')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (error) {
      throw error
    }

    // Get public URL
    const { data: { publicUrl } } = supabaseAdmin.storage
      .from('category-pos-images')
      .getPublicUrl(filePath)

    return publicUrl
  } catch (error) {
    console.error('Error uploading image:', error)
    throw error
  }
}

export const deleteCategoryImage = async (imageUrl: string): Promise<void> => {
  try {
    // Extract file path from URL
    const urlParts = imageUrl.split('/')
    const fileName = urlParts[urlParts.length - 1]
    const filePath = `categories/${fileName}`

    const { error } = await supabaseAdmin.storage
      .from('category-pos-images')
      .remove([filePath])

    if (error) {
      throw error
    }
  } catch (error) {
    console.error('Error deleting image:', error)
    throw error
  }
}

// Storage bucket names for products
export const PRODUCT_STORAGE_BUCKETS = {
  MAIN_PRODUCTS: 'main-products-pos-images',
  SUB_PRODUCTS: 'sub-products-pos-images', 
  VARIANT_PRODUCTS: 'variant-products-pos-images'
} as const

// Upload product image to storage bucket
export const uploadProductImage = async (
  file: File, 
  bucket: keyof typeof PRODUCT_STORAGE_BUCKETS,
  path?: string
): Promise<{ data: { path: string } | null; error: Error | null }> => {
  try {
    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
    const filePath = path ? `${path}/${fileName}` : fileName

    const { data, error } = await supabaseAdmin.storage
      .from(PRODUCT_STORAGE_BUCKETS[bucket])
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (error) {
      console.error('Storage upload error:', error)
      return { data: null, error }
    }

    return { data, error: null }
  } catch (error) {
    console.error('Upload error:', error)
    return { data: null, error: error as Error }
  }
}

// Get public URL for uploaded product image
export const getProductImageUrl = (bucket: keyof typeof PRODUCT_STORAGE_BUCKETS, path: string): string => {
  const { data } = supabaseAdmin.storage
    .from(PRODUCT_STORAGE_BUCKETS[bucket])
    .getPublicUrl(path)
  
  return data.publicUrl
}

// Delete product image from storage
export const deleteProductImage = async (
  bucket: keyof typeof PRODUCT_STORAGE_BUCKETS,
  path: string
): Promise<{ error: Error | null }> => {
  try {
    const { error } = await supabaseAdmin.storage
      .from(PRODUCT_STORAGE_BUCKETS[bucket])
      .remove([path])

    return { error }
  } catch (error) {
    console.error('Delete error:', error)
    return { error: error as Error }
  }
}