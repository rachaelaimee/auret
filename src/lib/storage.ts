import { v4 as uuidv4 } from 'uuid'

export interface UploadResult {
  url: string
  path: string
}

/**
 * Temporary fallback: Generate placeholder images while we fix Vercel Blob
 * This lets you continue building your marketplace!
 */
export async function uploadImage(
  file: File,
  folder: string = 'products'
): Promise<UploadResult> {
  // Generate a unique filename
  const fileExtension = file.name.split('.').pop()
  const fileName = `${uuidv4()}.${fileExtension}`
  const filePath = `${folder}/${fileName}`
  
  try {
    // Create a beautiful placeholder image with the file name
    const productName = file.name.replace(/\.[^/.]+$/, "").substring(0, 15)
    const placeholderUrl = `https://via.placeholder.com/400x300/6366f1/ffffff?text=${encodeURIComponent(productName)}`
    
    // Simulate upload delay for realistic UX
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    return {
      url: placeholderUrl,
      path: filePath
    }
  } catch (error) {
    console.error('Error creating placeholder:', error)
    throw new Error('Failed to process image. Please try again.')
  }
}

/**
 * Upload multiple images
 */
export async function uploadImages(
  files: File[],
  folder: string = 'products'
): Promise<UploadResult[]> {
  const uploadPromises = files.map(file => uploadImage(file, folder))
  return Promise.all(uploadPromises)
}

/**
 * Delete an image from Vercel Blob Storage
 */
export async function deleteImage(url: string): Promise<void> {
  try {
    // For Vercel Blob, we'll make a DELETE request to our API
    const response = await fetch('/api/upload', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url }),
    })
    
    if (!response.ok) {
      throw new Error('Failed to delete image')
    }
  } catch (error) {
    console.error('Error deleting image:', error)
    throw new Error('Failed to delete image')
  }
}

/**
 * Validate image file
 */
export function validateImageFile(file: File): string | null {
  // Check file type
  if (!file.type.startsWith('image/')) {
    return 'Please select an image file'
  }
  
  // Check file size (max 5MB)
  const maxSize = 5 * 1024 * 1024 // 5MB in bytes
  if (file.size > maxSize) {
    return 'Image must be less than 5MB'
  }
  
  // Check file extension
  const allowedExtensions = ['jpg', 'jpeg', 'png', 'webp', 'gif']
  const fileExtension = file.name.split('.').pop()?.toLowerCase()
  if (!fileExtension || !allowedExtensions.includes(fileExtension)) {
    return 'Please select a valid image file (JPG, PNG, WebP, or GIF)'
  }
  
  return null // No errors
}
