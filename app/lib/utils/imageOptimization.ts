// Image optimization utilities for products page
// Provides intelligent loading strategies and fallbacks

export interface ImageLoadingConfig {
  priority: boolean
  quality: number
  sizes: string
  placeholder: 'blur' | 'empty'
}

export interface ProductImageConfig extends ImageLoadingConfig {
  fallbackSrc?: string
  preloadNext?: boolean
}

// Image quality settings based on usage
export const IMAGE_QUALITY = {
  thumbnail: 60,  // Small thumbnails
  grid: 75,      // Grid view images
  modal: 85,     // Modal/detail view images
  hero: 90       // Important hero images
} as const

// Responsive sizes configurations
export const RESPONSIVE_SIZES = {
  thumbnail: '(max-width: 768px) 25vw, 10vw',
  gridSmall: '(max-width: 768px) 50vw, (max-width: 1200px) 25vw, 20vw',
  gridLarge: '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw',
  modal: '(max-width: 768px) 100vw, (max-width: 1200px) 60vw, 40vw',
  full: '100vw'
} as const

// Default placeholder image (base64 encoded)
export const DEFAULT_PRODUCT_PLACEHOLDER = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgZmlsbD0iIzJCMzU0NCIvPgogIDx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMjAiIGZpbGw9IiM2QjcyODAiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj7Yp9mE2YXZhtiq2KzYp9iqPC90ZXh0Pgo8L3N2Zz4='

/**
 * Get optimized image configuration for different product contexts
 */
export function getProductImageConfig(
  context: 'grid' | 'modal' | 'thumbnail' | 'hero',
  index = 0
): ProductImageConfig {
  switch (context) {
    case 'grid':
      return {
        priority: index < 6, // Prioritize first 6 items in grid
        quality: IMAGE_QUALITY.grid,
        sizes: RESPONSIVE_SIZES.gridSmall,
        placeholder: 'blur',
        preloadNext: index < 3
      }
    
    case 'modal':
      return {
        priority: true,
        quality: IMAGE_QUALITY.modal,
        sizes: RESPONSIVE_SIZES.modal,
        placeholder: 'blur'
      }
    
    case 'thumbnail':
      return {
        priority: false,
        quality: IMAGE_QUALITY.thumbnail,
        sizes: RESPONSIVE_SIZES.thumbnail,
        placeholder: 'blur'
      }
    
    case 'hero':
      return {
        priority: true,
        quality: IMAGE_QUALITY.hero,
        sizes: RESPONSIVE_SIZES.full,
        placeholder: 'blur'
      }
    
    default:
      return {
        priority: false,
        quality: IMAGE_QUALITY.grid,
        sizes: RESPONSIVE_SIZES.gridSmall,
        placeholder: 'blur'
      }
  }
}

/**
 * Check if image URL is from Supabase storage
 */
export function isSupabaseImage(src: string | null | undefined): boolean {
  if (!src) return false
  return src.includes('supabase.co') && src.includes('/storage/v1/object/public/')
}

/**
 * Check if image URL is external and might need special handling
 */
export function isExternalImage(src: string | null | undefined): boolean {
  if (!src) return false
  return src.startsWith('http') && !isSupabaseImage(src)
}

/**
 * Generate fallback image URL for product categories
 */
export function getProductFallbackImage(productName?: string): string {
  // Return a generated placeholder based on product name or generic
  const encodedName = encodeURIComponent(productName || 'منتج')
  return `data:image/svg+xml;charset=UTF-8,%3Csvg width='400' height='300' xmlns='http://www.w3.org/2000/svg'%3E%3Crect width='400' height='300' fill='%232B3544'/%3E%3Ctext x='50%25' y='50%25' font-family='Arial' font-size='16' fill='%236B7280' text-anchor='middle' dy='.3em'%3E${encodedName}%3C/text%3E%3C/svg%3E`
}

/**
 * Preload critical images for better performance
 */
export function preloadImage(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve()
    img.onerror = reject
    img.src = src
  })
}

/**
 * Preload multiple product images with priority
 */
export async function preloadProductImages(
  products: Array<{ main_image_url?: string | null }>,
  limit = 3
): Promise<void> {
  const imagesToPreload = products
    .slice(0, limit)
    .map(p => p.main_image_url)
    .filter((src): src is string => !!src)

  const preloadPromises = imagesToPreload.map(src => 
    preloadImage(src).catch(() => {
      // Silently ignore preload errors
      console.warn(`Failed to preload image: ${src}`)
    })
  )

  await Promise.all(preloadPromises)
}

/**
 * Get optimized image dimensions based on container and screen size
 */
export function getOptimizedDimensions(
  containerWidth: number,
  containerHeight: number,
  devicePixelRatio = typeof window !== 'undefined' ? window.devicePixelRatio : 1
): { width: number; height: number } {
  // Account for high-DPI screens but cap at 2x for reasonable file sizes
  const ratio = Math.min(devicePixelRatio, 2)
  
  return {
    width: Math.round(containerWidth * ratio),
    height: Math.round(containerHeight * ratio)
  }
}

/**
 * Image loading priorities for different page contexts
 */
export const LOADING_PRIORITIES = {
  // Above the fold - highest priority
  HERO: { priority: true, loading: 'eager' as const },
  FIRST_ROW: { priority: true, loading: 'eager' as const },
  
  // Visible but not critical
  VISIBLE: { priority: false, loading: 'lazy' as const },
  
  // Background/secondary images
  BACKGROUND: { priority: false, loading: 'lazy' as const },
  
  // Modal/popup images (loaded on demand)
  MODAL: { priority: true, loading: 'eager' as const }
} as const

/**
 * Detect if image should be loaded eagerly based on position
 */
export function shouldLoadEagerly(index: number, context: 'grid' | 'list' = 'grid'): boolean {
  if (context === 'grid') {
    return index < 6 // First 2 rows of 3 columns
  }
  return index < 3 // First 3 items in list
}

/**
 * Generate srcSet for responsive images
 */
export function generateSrcSet(baseSrc: string, widths: number[]): string {
  if (!isSupabaseImage(baseSrc)) {
    return baseSrc // External images can't be resized
  }
  
  // For Supabase images, we can add transformation parameters
  return widths
    .map(width => `${baseSrc}?width=${width}&quality=80 ${width}w`)
    .join(', ')
}

/**
 * Calculate optimal image sizes for different breakpoints
 */
export function calculateImageSizes(context: 'grid' | 'modal' | 'thumbnail'): string {
  switch (context) {
    case 'grid':
      return '(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw'
    case 'modal':
      return '(max-width: 640px) 100vw, (max-width: 1024px) 80vw, 60vw'
    case 'thumbnail':
      return '(max-width: 640px) 20vw, 10vw'
    default:
      return '100vw'
  }
}