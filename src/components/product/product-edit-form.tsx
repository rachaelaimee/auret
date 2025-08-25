'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { updateProduct } from '@/lib/firestore'
import { uploadImage, validateImageFile } from '@/lib/storage'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Upload, X, Save, Plus, Grip } from 'lucide-react'

const productEditSchema = z.object({
  title: z.string()
    .min(1, 'Product title is required')
    .max(255, 'Title must be less than 255 characters'),
  description: z.string()
    .min(10, 'Description must be at least 10 characters')
    .max(2000, 'Description must be less than 2000 characters'),
  price: z.string()
    .min(1, 'Price is required')
    .refine((val) => {
      const num = parseFloat(val)
      return !isNaN(num) && num > 0
    }, 'Price must be a valid positive number'),
  type: z.enum(['digital', 'physical'], {
    required_error: 'Product type is required'
  }),
  status: z.enum(['draft', 'active'], {
    required_error: 'Product status is required'
  }),
  inventory: z.string().optional(),
  sku: z.string().optional(),
  weight: z.string().optional(),
  dimensions: z.object({
    length: z.string().optional(),
    width: z.string().optional(),
    height: z.string().optional()
  }).optional(),
  tags: z.string().optional()
})

type ProductEditFormData = z.infer<typeof productEditSchema>

// Types (matching the server-side data)
interface Product {
  id: string
  shopId: string
  title: string
  description: string
  priceCents: number
  type: 'digital' | 'physical'
  status: 'draft' | 'active'
  photos: {
    id: string
    url: string
    alt?: string
    order: number
  }[]
  inventory?: number
  sku?: string
  weight?: number
  dimensions?: {
    length: number
    width: number
    height: number
  }
  tags?: string[]
  createdAt: Date
  updatedAt: Date
}

interface Shop {
  id: string
  handle: string
  name: string
}

interface ProductEditFormProps {
  product: Product
  shop: Shop
}

interface PhotoState {
  id: string
  url: string
  alt?: string
  order: number
  isNew?: boolean
  file?: File
  isDeleted?: boolean
}

export function ProductEditForm({ product, shop }: ProductEditFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isUploadingPhotos, setIsUploadingPhotos] = useState(false)
  
  // Photo management state
  const [photos, setPhotos] = useState<PhotoState[]>(
    product.photos.map(photo => ({ ...photo }))
  )

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch
  } = useForm<ProductEditFormData>({
    resolver: zodResolver(productEditSchema),
    defaultValues: {
      title: product.title,
      description: product.description,
      price: (product.priceCents / 100).toString(),
      type: product.type,
      status: product.status,
      inventory: product.inventory?.toString() || '',
      sku: product.sku || '',
      weight: product.weight?.toString() || '',
      dimensions: {
        length: product.dimensions?.length?.toString() || '',
        width: product.dimensions?.width?.toString() || '',
        height: product.dimensions?.height?.toString() || ''
      },
      tags: product.tags?.join(', ') || ''
    }
  })

  const watchedType = watch('type')

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    setError(null)

    // Validate files
    for (const file of files) {
      const validationError = validateImageFile(file)
      if (validationError) {
        setError(validationError)
        return
      }
    }

    // Add new photos to state with preview URLs
    const newPhotos: PhotoState[] = files.map((file, index) => ({
      id: `new-${Date.now()}-${index}`,
      url: URL.createObjectURL(file),
      order: photos.length + index,
      isNew: true,
      file
    }))

    setPhotos(prev => [...prev, ...newPhotos])
  }

  const removePhoto = (photoId: string) => {
    setPhotos(prev => 
      prev.map(photo => 
        photo.id === photoId 
          ? { ...photo, isDeleted: true }
          : photo
      ).filter(photo => !photo.isNew || !photo.isDeleted)
    )
  }

  const reorderPhotos = (dragIndex: number, hoverIndex: number) => {
    setPhotos(prev => {
      const dragPhoto = prev[dragIndex]
      const newPhotos = [...prev]
      newPhotos.splice(dragIndex, 1)
      newPhotos.splice(hoverIndex, 0, dragPhoto)
      
      // Update order
      return newPhotos.map((photo, index) => ({
        ...photo,
        order: index
      }))
    })
  }

  const onSubmit = async (data: ProductEditFormData) => {
    setIsSubmitting(true)
    setError(null)
    setSuccess(null)

    try {
      // Upload new photos
      const newPhotosToUpload = photos.filter(photo => photo.isNew && photo.file && !photo.isDeleted)
      let uploadedPhotos: { id: string; url: string; alt?: string; order: number }[] = []

      if (newPhotosToUpload.length > 0) {
        setIsUploadingPhotos(true)
        try {
          const uploadPromises = newPhotosToUpload.map(async (photo, index) => {
            const result = await uploadImage(photo.file!, `products/${product.shopId}`)
            return {
              id: `photo-${Date.now()}-${index}`,
              url: result.url,
              order: photo.order
            }
          })
          
          uploadedPhotos = await Promise.all(uploadPromises)
        } catch (uploadError) {
          console.error('Error uploading photos:', uploadError)
          setError('Failed to upload photos. Please try again.')
          return
        } finally {
          setIsUploadingPhotos(false)
        }
      }

      // Prepare final photos array
      const existingPhotos = photos
        .filter(photo => !photo.isNew && !photo.isDeleted)
        .map(photo => ({
          id: photo.id,
          url: photo.url,
          alt: photo.alt,
          order: photo.order
        }))

      const finalPhotos = [...existingPhotos, ...uploadedPhotos]
        .sort((a, b) => a.order - b.order)
        .map((photo, index) => ({ ...photo, order: index }))

      // Prepare product data
      const productData: any = {
        title: data.title,
        description: data.description,
        priceCents: Math.round(parseFloat(data.price) * 100),
        type: data.type,
        status: data.status,
        photos: finalPhotos
      }

      // Add optional fields only if they have values
      if (data.inventory && data.inventory.trim() !== '') {
        const inventory = parseInt(data.inventory)
        if (!isNaN(inventory) && inventory >= 0) {
          productData.inventory = inventory
        }
      }

      if (data.sku && data.sku.trim() !== '') {
        productData.sku = data.sku.trim()
      }

      if (data.weight && data.weight.trim() !== '') {
        const weight = parseFloat(data.weight)
        if (!isNaN(weight) && weight > 0) {
          productData.weight = weight
        }
      }

      if (data.dimensions && (data.dimensions.length || data.dimensions.width || data.dimensions.height)) {
        const dimensions: any = {}
        if (data.dimensions.length && data.dimensions.length.trim() !== '') {
          const length = parseFloat(data.dimensions.length)
          if (!isNaN(length) && length > 0) dimensions.length = length
        }
        if (data.dimensions.width && data.dimensions.width.trim() !== '') {
          const width = parseFloat(data.dimensions.width)
          if (!isNaN(width) && width > 0) dimensions.width = width
        }
        if (data.dimensions.height && data.dimensions.height.trim() !== '') {
          const height = parseFloat(data.dimensions.height)
          if (!isNaN(height) && height > 0) dimensions.height = height
        }
        if (Object.keys(dimensions).length > 0) {
          productData.dimensions = dimensions
        }
      }

      if (data.tags && data.tags.trim() !== '') {
        productData.tags = data.tags
          .split(',')
          .map(tag => tag.trim())
          .filter(tag => tag.length > 0)
      }

      // Update product
      await updateProduct(product.id, productData)

      setSuccess('Product updated successfully!')
      
      // Redirect after a short delay
      setTimeout(() => {
        router.push(`/shop/${shop.handle}/products/${product.id}`)
      }, 1500)

    } catch (err: any) {
      console.error('Error updating product:', err)
      setError(err.message || 'Failed to update product. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const visiblePhotos = photos.filter(photo => !photo.isDeleted)

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert>
          <AlertDescription className="text-green-700">{success}</AlertDescription>
        </Alert>
      )}

      {/* Product Photos */}
      <div className="space-y-4">
        <Label>Product Photos</Label>
        
        {/* Existing Photos Grid */}
        {visiblePhotos.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {visiblePhotos.map((photo, index) => (
              <div key={photo.id} className="relative group">
                <img
                  src={photo.url}
                  alt={photo.alt || `Product photo ${index + 1}`}
                  className="w-full h-32 object-cover rounded-lg border border-slate-300"
                />
                <button
                  type="button"
                  onClick={() => removePhoto(photo.id)}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-3 w-3" />
                </button>
                <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                  {index + 1}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Upload New Photos */}
        <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center hover:border-slate-400 transition-colors">
          <input
            type="file"
            id="photo-upload"
            multiple
            accept="image/*"
            onChange={handlePhotoUpload}
            className="hidden"
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => document.getElementById('photo-upload')?.click()}
            disabled={isUploadingPhotos}
            className="mb-2"
          >
            {isUploadingPhotos ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Plus className="h-4 w-4 mr-2" />
                Add Photos
              </>
            )}
          </Button>
          <p className="text-sm text-slate-500">
            Upload JPG, PNG, WebP or GIF. Max 5MB each. You can upload multiple photos.
          </p>
          <p className="text-xs text-slate-400 mt-1">
            Current photos: {visiblePhotos.length}
          </p>
        </div>
      </div>

      {/* Product Title */}
      <div className="space-y-2">
        <Label htmlFor="title">Product Title *</Label>
        <Input
          id="title"
          {...register('title')}
          placeholder="Amazing handmade necklace"
        />
        {errors.title && (
          <p className="text-sm text-red-600">{errors.title.message}</p>
        )}
      </div>

      {/* Product Description */}
      <div className="space-y-2">
        <Label htmlFor="description">Description *</Label>
        <Textarea
          id="description"
          {...register('description')}
          placeholder="Describe your product in detail..."
          rows={6}
        />
        {errors.description && (
          <p className="text-sm text-red-600">{errors.description.message}</p>
        )}
      </div>

      {/* Price */}
      <div className="space-y-2">
        <Label htmlFor="price">Price (USD) *</Label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500">$</span>
          <Input
            id="price"
            type="number"
            step="0.01"
            min="0"
            {...register('price')}
            className="pl-8"
            placeholder="29.99"
          />
        </div>
        {errors.price && (
          <p className="text-sm text-red-600">{errors.price.message}</p>
        )}
      </div>

      {/* Product Type */}
      <div className="space-y-2">
        <Label>Product Type *</Label>
        <div className="flex gap-4">
          <div className="flex items-center space-x-2">
            <input
              type="radio"
              id="type-physical"
              {...register('type')}
              value="physical"
              className="w-4 h-4"
            />
            <Label htmlFor="type-physical">Physical Product</Label>
          </div>
          <div className="flex items-center space-x-2">
            <input
              type="radio"
              id="type-digital"
              {...register('type')}
              value="digital"
              className="w-4 h-4"
            />
            <Label htmlFor="type-digital">Digital Product</Label>
          </div>
        </div>
        {errors.type && (
          <p className="text-sm text-red-600">{errors.type.message}</p>
        )}
      </div>

      {/* Product Status */}
      <div className="space-y-2">
        <Label>Status *</Label>
        <div className="flex gap-4">
          <div className="flex items-center space-x-2">
            <input
              type="radio"
              id="status-draft"
              {...register('status')}
              value="draft"
              className="w-4 h-4"
            />
            <Label htmlFor="status-draft">Draft</Label>
          </div>
          <div className="flex items-center space-x-2">
            <input
              type="radio"
              id="status-active"
              {...register('status')}
              value="active"
              className="w-4 h-4"
            />
            <Label htmlFor="status-active">Active</Label>
          </div>
        </div>
        {errors.status && (
          <p className="text-sm text-red-600">{errors.status.message}</p>
        )}
      </div>

      {/* Physical Product Fields */}
      {watchedType === 'physical' && (
        <>
          {/* Inventory */}
          <div className="space-y-2">
            <Label htmlFor="inventory">Inventory (Stock Quantity)</Label>
            <Input
              id="inventory"
              type="number"
              min="0"
              {...register('inventory')}
              placeholder="10"
            />
            <p className="text-xs text-slate-500">
              Leave empty for unlimited stock
            </p>
          </div>

          {/* SKU */}
          <div className="space-y-2">
            <Label htmlFor="sku">SKU (Stock Keeping Unit)</Label>
            <Input
              id="sku"
              {...register('sku')}
              placeholder="NECKLACE-001"
            />
          </div>

          {/* Weight */}
          <div className="space-y-2">
            <Label htmlFor="weight">Weight (oz)</Label>
            <Input
              id="weight"
              type="number"
              step="0.1"
              min="0"
              {...register('weight')}
              placeholder="2.5"
            />
          </div>

          {/* Dimensions */}
          <div className="space-y-2">
            <Label>Dimensions (inches)</Label>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <Input
                  type="number"
                  step="0.1"
                  min="0"
                  {...register('dimensions.length')}
                  placeholder="Length"
                />
              </div>
              <div>
                <Input
                  type="number"
                  step="0.1"
                  min="0"
                  {...register('dimensions.width')}
                  placeholder="Width"
                />
              </div>
              <div>
                <Input
                  type="number"
                  step="0.1"
                  min="0"
                  {...register('dimensions.height')}
                  placeholder="Height"
                />
              </div>
            </div>
          </div>
        </>
      )}

      {/* Tags */}
      <div className="space-y-2">
        <Label htmlFor="tags">Tags</Label>
        <Input
          id="tags"
          {...register('tags')}
          placeholder="handmade, jewelry, necklace, gift"
        />
        <p className="text-xs text-slate-500">
          Separate tags with commas to help customers find your product
        </p>
      </div>

      {/* Submit Button */}
      <div className="flex justify-end pt-4">
        <Button
          type="submit"
          disabled={isSubmitting}
          className="min-w-[140px]"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Updating...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Update Product
            </>
          )}
        </Button>
      </div>
    </form>
  )
}
