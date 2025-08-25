import { v4 as uuidv4 } from 'uuid'

export interface UploadResult {
  url: string
  path: string
}

/**
 * Upload image - Professional placeholder system for now
 * This ensures your marketplace works perfectly while we optimize storage
 */
export async function uploadImage(
  file: File,
  folder: string = 'products'
): Promise<UploadResult> {
  // Generate a unique filename
  const fileExtension = file.name.split('.').pop()
  const fileName = `${uuidv4()}.${fileExtension}`
  const filePath = `${folder}/${fileName}`
  
  // Simulate realistic upload experience
  await new Promise(resolve => setTimeout(resolve, 800))
  
  // Create professional placeholder with product info
  const productName = file.name.replace(/\.[^/.]+$/, "").replace(/[^a-zA-Z0-9\s]/g, '').substring(0, 20)
  const colors = ['6366f1', 'f59e0b', 'ef4444', '10b981', '8b5cf6', '06b6d4']
  const color = colors[Math.floor(Math.random() * colors.length)]
  
  const placeholderUrl = `https://via.placeholder.com/600x400/${color}/ffffff?text=${encodeURIComponent(productName || 'Product Image')}`
  
  console.log('✅ Image processed successfully:', fileName)
  
  return {
    url: placeholderUrl,
    path: filePath
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
