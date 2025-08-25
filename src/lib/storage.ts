import { upload } from '@vercel/blob/client'
import { v4 as uuidv4 } from 'uuid'

export interface UploadResult {
  url: string
  path: string
}

/**
 * Upload an image file to Vercel Blob Storage using client upload
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
    // Use Vercel's client upload which handles the token automatically
    const blob = await upload(filePath, file, {
      access: 'public',
      handleUploadUrl: '/api/upload',
    })
    
    return {
      url: blob.url,
      path: filePath
    }
  } catch (error) {
    console.error('Error uploading image:', error)
    
    // Provide helpful error messages
    if (error instanceof Error) {
      throw new Error(`Upload failed: ${error.message}`)
    }
    
    throw new Error('Failed to upload image. Please try again.')
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
