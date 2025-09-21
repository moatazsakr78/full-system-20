'use client'

import { useState, useCallback } from 'react'
import { supabase } from '../supabase/client'
import { uploadProductVideo, deleteProductVideo, createProductVideosBucket } from '../supabase/storage'

export interface ProductVideo {
  id: string
  product_id: string
  video_url: string
  video_name: string | null
  video_size: number | null
  duration: number | null
  thumbnail_url: string | null
  sort_order: number
  created_at: string
  updated_at: string
}

export interface CreateProductVideoData {
  product_id: string
  video_url: string
  video_name?: string
  video_size?: number
  duration?: number
  thumbnail_url?: string
  sort_order?: number
}

export interface UploadVideoResult {
  success: boolean
  video?: ProductVideo
  error?: string
}

export const useProductVideos = () => {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [uploadProgress, setUploadProgress] = useState<{[key: string]: number}>({})

  // Initialize bucket (call this once when the app starts)
  const initializeBucket = useCallback(async () => {
    try {
      await createProductVideosBucket()
    } catch (error) {
      console.log('Bucket already exists or error:', error)
    }
  }, [])

  // Get all videos for a product
  const getProductVideos = useCallback(async (productId: string): Promise<ProductVideo[]> => {
    try {
      setIsLoading(true)
      setError(null)

      const { data, error } = await supabase
        .from('product_videos' as any)
        .select('*')
        .eq('product_id', productId)
        .order('sort_order', { ascending: true })

      if (error) {
        throw error
      }

      return (data as unknown as ProductVideo[]) || []
    } catch (error: any) {
      console.error('Error fetching product videos:', error)
      setError(error.message)
      return []
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Upload and save a video with progress tracking
  const uploadVideo = useCallback(async (
    productId: string,
    videoFile: File,
    videoName?: string,
    onProgress?: (progress: number) => void
  ): Promise<UploadVideoResult> => {
    try {
      setIsLoading(true)
      setError(null)

      // If progress callback provided, start progress simulation
      let progressInterval: NodeJS.Timeout | null = null
      if (onProgress) {
        let currentProgress = 0
        progressInterval = setInterval(() => {
          currentProgress += Math.random() * 10 + 5 // 5-15% increments
          if (currentProgress < 90) {
            onProgress(Math.min(90, currentProgress))
          }
        }, 200)
      }

      // Upload video to storage
      const { data: uploadData, error: uploadError } = await uploadProductVideo(videoFile, productId)

      if (uploadError || !uploadData) {
        if (progressInterval) clearInterval(progressInterval)
        return {
          success: false,
          error: uploadError?.message || 'فشل في رفع الفيديو'
        }
      }

      // Update progress to 95%
      if (onProgress) {
        onProgress(95)
      }

      // Get next sort order
      const { data: existingVideos } = await supabase
        .from('product_videos' as any)
        .select('sort_order')
        .eq('product_id', productId)
        .order('sort_order', { ascending: false })
        .limit(1)

      const nextSortOrder = existingVideos && existingVideos.length > 0
        ? ((existingVideos as unknown as ProductVideo[])[0].sort_order || 0) + 1
        : 0

      // Save video info to database
      const videoData: CreateProductVideoData = {
        product_id: productId,
        video_url: uploadData.publicUrl,
        video_name: videoName || videoFile.name,
        video_size: videoFile.size,
        sort_order: nextSortOrder
      }

      const { data: dbData, error: dbError } = await supabase
        .from('product_videos' as any)
        .insert(videoData)
        .select()
        .single()

      if (dbError) {
        // If database save fails, try to clean up uploaded file
        await deleteProductVideo(uploadData.publicUrl)
        if (progressInterval) clearInterval(progressInterval)
        throw dbError
      }

      // Complete progress
      if (progressInterval) {
        clearInterval(progressInterval)
      }
      if (onProgress) {
        onProgress(100)
      }

      return {
        success: true,
        video: dbData as unknown as ProductVideo
      }
    } catch (error: any) {
      console.error('Error uploading video:', error)
      setError(error.message)
      return {
        success: false,
        error: error.message
      }
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Delete a video
  const deleteVideo = useCallback(async (videoId: string): Promise<boolean> => {
    try {
      setIsLoading(true)
      setError(null)

      // Get video info first
      const { data: video, error: fetchError } = await supabase
        .from('product_videos' as any)
        .select('*')
        .eq('id', videoId)
        .single()

      if (fetchError || !video) {
        throw new Error('فيديو غير موجود')
      }

      // Delete from storage
      const { error: storageError } = await deleteProductVideo((video as unknown as ProductVideo).video_url)
      if (storageError) {
        console.warn('Storage deletion failed:', storageError)
        // Continue with database deletion even if storage fails
      }

      // Delete from database
      const { error: dbError } = await supabase
        .from('product_videos' as any)
        .delete()
        .eq('id', videoId)

      if (dbError) {
        throw dbError
      }

      return true
    } catch (error: any) {
      console.error('Error deleting video:', error)
      setError(error.message)
      return false
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Update video info (name, sort order, etc.)
  const updateVideo = useCallback(async (
    videoId: string,
    updates: Partial<Omit<ProductVideo, 'id' | 'product_id' | 'created_at' | 'updated_at'>>
  ): Promise<boolean> => {
    try {
      setIsLoading(true)
      setError(null)

      const { error } = await supabase
        .from('product_videos' as any)
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', videoId)

      if (error) {
        throw error
      }

      return true
    } catch (error: any) {
      console.error('Error updating video:', error)
      setError(error.message)
      return false
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Reorder videos
  const reorderVideos = useCallback(async (
    productId: string,
    videoIds: string[]
  ): Promise<boolean> => {
    try {
      setIsLoading(true)
      setError(null)

      // Update sort order for each video
      const updates = videoIds.map((videoId, index) =>
        supabase
          .from('product_videos' as any)
          .update({
            sort_order: index,
            updated_at: new Date().toISOString()
          })
          .eq('id', videoId)
          .eq('product_id', productId)
      )

      const results = await Promise.all(updates)
      const hasError = results.some(result => result.error)

      if (hasError) {
        throw new Error('فشل في إعادة ترتيب بعض الفيديوهات')
      }

      return true
    } catch (error: any) {
      console.error('Error reordering videos:', error)
      setError(error.message)
      return false
    } finally {
      setIsLoading(false)
    }
  }, [])

  return {
    // State
    isLoading,
    error,
    uploadProgress,

    // Functions
    initializeBucket,
    getProductVideos,
    uploadVideo,
    deleteVideo,
    updateVideo,
    reorderVideos
  }
}