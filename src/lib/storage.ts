import { v4 as uuidv4 } from 'uuid'

export interface UploadResult {
  url: string
  path: string
}

/**
 * Upload image to Vercel Blob Storage - REAL IMAGES
 * Using server-side API route for proper token handling
 */
export async function uploadImage(
  file: File,
  folder: string = 'products'
): Promise<UploadResult> {
  // Generate a unique filename
  const fileExtension = file.name.split('.').pop()
  const fileName = `${uuidv4()}.${fileExtension}`
  const filePath = `${folder}/${fileName}`
  
  console.log('🔄 Starting real image upload:', file.name, 'Size:', file.size, 'bytes')
  
  try {
    // Create FormData for server-side upload
    const formData = new FormData()
    formData.append('file', file)
    formData.append('filename', filePath)
    
    console.log('📤 Uploading to server API...')
    
    // Upload via our server-side API route
    const response = await fetch('/api/blob-upload', {
      method: 'POST',
      body: formData,
    })
    
    console.log('📥 Server response:', response.status, response.statusText)
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ Upload failed:', errorText)
      throw new Error(`Upload failed: ${response.status} - ${errorText}`)
    }
    
    const result = await response.json()
    console.log('✅ Upload successful:', result.url)
    
    return {
      url: result.url,
      path: filePath
    }
  } catch (error) {
    console.error('💥 Upload error:', error)
    throw new Error(`Failed to upload image: ${error instanceof Error ? error.message : 'Unknown error'}`)
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
// Force deployment Mon Aug 25 10:17:52 BST 2025
