'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createProduct } from '@/lib/firestore'
import { uploadImages, validateImageFile } from '@/lib/storage'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, Upload, X, Plus } from 'lucide-react'

// Shop type (simplified for form use)
type Shop = {
  id: string
  handle: string
  name: string
  ownerId: string
}

const productCreateSchema = z.object({
  title: z.string()
    .min(3, 'Product title must be at least 3 characters')
    .max(100, 'Product title must be less than 100 characters'),
  description: z.string()
    .min(10, 'Description must be at least 10 characters')
    .max(2000, 'Description must be less than 2000 characters'),
  price: z.string()
    .refine((val) => !isNaN(Number(val)) && Number(val) > 0, 'Price must be a valid positive number'),
  type: z.enum(['digital', 'physical']),
  status: z.enum(['draft', 'active']),
  inventory: z.string().optional(),
  sku: z.string().max(50, 'SKU must be less than 50 characters').optional(),
  weight: z.string().optional(),
  tags: z.string().optional(),
  // Dimensions (for physical products)
  length: z.string().optional(),
  width: z.string().optional(),
  height: z.string().optional(),
})

type ProductCreateFormData = z.infer<typeof productCreateSchema>

interface ProductCreateFormProps {
  shop: Shop
}

export function ProductCreateForm({ shop }: ProductCreateFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [photos, setPhotos] = useState<{ id: string; url: string; alt?: string; path?: string }[]>([])
  const [photoUploading, setPhotoUploading] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    setValue
  } = useForm<ProductCreateFormData>({
    resolver: zodResolver(productCreateSchema),
    defaultValues: {
      type: 'physical',
      status: 'draft'
    }
  })

  const watchedType = watch('type')

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return

    setPhotoUploading(true)
    setError(null)
    
    try {
      const fileArray = Array.from(files)
      
      // Validate each file
      for (const file of fileArray) {
        const validationError = validateImageFile(file)
        if (validationError) {
          setError(validationError)
          return
        }
      }
      
      // Check total photo limit
      if (photos.length + fileArray.length > 10) {
        setError('Maximum 10 photos allowed per product')
        return
      }
      
      // Upload images to Firebase Storage
      const uploadResults = await uploadImages(fileArray, `products/${shop.id}`)
      
      // Add uploaded photos to state
      const newPhotos = uploadResults.map((result, index) => ({
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        url: result.url,
        path: result.path,
        alt: fileArray[index].name
      }))
      
      setPhotos(prev => [...prev, ...newPhotos])
    } catch (err: any) {
      console.error('Error uploading photos:', err)
      setError(err.message || 'Failed to upload photos. Please try again.')
    } finally {
      setPhotoUploading(false)
      // Reset the input
      event.target.value = ''
    }
  }

  const removePhoto = (photoId: string) => {
    setPhotos(prev => prev.filter(photo => photo.id !== photoId))
  }

  const onSubmit = async (data: ProductCreateFormData) => {
    if (photos.length === 0) {
      setError('Please add at least one product photo')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const priceCents = Math.round(Number(data.price) * 100)
      
      // Build product data, filtering out undefined values
      const productData: any = {
        shopId: shop.id,
        title: data.title,
        description: data.description,
        priceCents,
        type: data.type,
        status: data.status,
        photos: photos.map((photo, index) => ({
          id: photo.id,
          url: photo.url,
          alt: photo.alt || data.title,
          order: index
        })),
        tags: data.tags ? data.tags.split(',').map(tag => tag.trim()).filter(Boolean) : [],
        categories: [], // We'll add category selection later
      }

      // Add optional fields only if they have values
      if (data.inventory && Number(data.inventory) > 0) {
        productData.inventory = Number(data.inventory)
      }
      
      if (data.sku && data.sku.trim()) {
        productData.sku = data.sku.trim()
      }
      
      if (data.weight && Number(data.weight) > 0) {
        productData.weight = Number(data.weight)
      }
      
      if (data.length || data.width || data.height) {
        const dimensions: any = {}
        if (data.length && Number(data.length) > 0) dimensions.length = Number(data.length)
        if (data.width && Number(data.width) > 0) dimensions.width = Number(data.width)
        if (data.height && Number(data.height) > 0) dimensions.height = Number(data.height)
        
        if (Object.keys(dimensions).length > 0) {
          productData.dimensions = dimensions
        }
      }

      const product = await createProduct(productData)
      
      // Redirect to the product page or back to shop
      router.push(`/shop/${shop.handle}`)
    } catch (err: any) {
      console.error('Error creating product:', err)
      setError(err.message || 'Failed to create product. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Basic Information */}
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Basic Information</h3>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <Label htmlFor="title">Product Title *</Label>
            <Input
              id="title"
              {...register('title')}
              placeholder="Handmade Ceramic Mug - Blue Glaze"
            />
            {errors.title && (
              <p className="text-sm text-red-600 mt-1">{errors.title.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="price">Price ($) *</Label>
            <Input
              id="price"
              type="number"
              step="0.01"
              min="0"
              {...register('price')}
              placeholder="29.99"
            />
            {errors.price && (
              <p className="text-sm text-red-600 mt-1">{errors.price.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="type">Product Type *</Label>
            <select
              id="type"
              {...register('type')}
              className="flex h-10 w-full rounded-md border border-slate-300 bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="physical">Physical Product</option>
              <option value="digital">Digital Product</option>
            </select>
          </div>
        </div>

        <div>
          <Label htmlFor="description">Description *</Label>
          <Textarea
            id="description"
            {...register('description')}
            placeholder="Describe your product in detail. Include materials, dimensions, care instructions, and what makes it special..."
            rows={6}
          />
          {errors.description && (
            <p className="text-sm text-red-600 mt-1">{errors.description.message}</p>
          )}
        </div>
      </div>

      {/* Photos */}
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-slate-900 mb-2">Product Photos</h3>
          <p className="text-sm text-slate-600 mb-4">Add up to 10 photos. First photo will be your main image.</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
          {photos.map((photo, index) => (
            <div key={photo.id} className="relative group">
              <img
                src={photo.url}
                alt={photo.alt}
                className="w-full h-32 object-cover rounded-lg border"
              />
              {index === 0 && (
                <div className="absolute top-2 left-2 bg-blue-600 text-white text-xs px-2 py-1 rounded">
                  Main
                </div>
              )}
              <button
                type="button"
                onClick={() => removePhoto(photo.id)}
                className="absolute top-2 right-2 bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
          
          {photos.length < 10 && (
            <label className="border-2 border-dashed border-slate-300 rounded-lg p-4 h-32 flex flex-col items-center justify-center cursor-pointer hover:border-slate-400 transition-colors">
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handlePhotoUpload}
                className="hidden"
                disabled={photoUploading}
              />
              {photoUploading ? (
                <>
                  <Loader2 className="h-6 w-6 animate-spin text-slate-400 mb-2" />
                  <span className="text-sm text-slate-600">Uploading...</span>
                </>
              ) : (
                <>
                  <Upload className="h-6 w-6 text-slate-400 mb-2" />
                  <span className="text-sm text-slate-600">
                    Add Photos ({photos.length}/10)
                  </span>
                  <span className="text-xs text-slate-400">
                    JPG, PNG, WebP (max 5MB each)
                  </span>
                </>
              )}
            </label>
          )}
        </div>
      </div>

      {/* Inventory & Details */}
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Inventory & Details</h3>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <Label htmlFor="inventory">Inventory Count</Label>
            <Input
              id="inventory"
              type="number"
              min="0"
              {...register('inventory')}
              placeholder="10"
            />
            <p className="text-xs text-slate-500 mt-1">Leave empty for unlimited</p>
          </div>

          <div>
            <Label htmlFor="sku">SKU (Optional)</Label>
            <Input
              id="sku"
              {...register('sku')}
              placeholder="MUG-BLUE-001"
            />
          </div>

          <div>
            <Label htmlFor="status">Status</Label>
            <select
              id="status"
              {...register('status')}
              className="flex h-10 w-full rounded-md border border-slate-300 bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="draft">Draft</option>
              <option value="active">Active</option>
            </select>
          </div>
        </div>

        {/* Physical Product Fields */}
        {watchedType === 'physical' && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Shipping Information</CardTitle>
              <CardDescription>Required for physical products</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-4">
                <div>
                  <Label htmlFor="weight">Weight (oz)</Label>
                  <Input
                    id="weight"
                    type="number"
                    step="0.1"
                    min="0"
                    {...register('weight')}
                    placeholder="8.5"
                  />
                </div>

                <div>
                  <Label htmlFor="length">Length (in)</Label>
                  <Input
                    id="length"
                    type="number"
                    step="0.1"
                    min="0"
                    {...register('length')}
                    placeholder="4.0"
                  />
                </div>

                <div>
                  <Label htmlFor="width">Width (in)</Label>
                  <Input
                    id="width"
                    type="number"
                    step="0.1"
                    min="0"
                    {...register('width')}
                    placeholder="4.0"
                  />
                </div>

                <div>
                  <Label htmlFor="height">Height (in)</Label>
                  <Input
                    id="height"
                    type="number"
                    step="0.1"
                    min="0"
                    {...register('height')}
                    placeholder="4.5"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div>
          <Label htmlFor="tags">Tags (Optional)</Label>
          <Input
            id="tags"
            {...register('tags')}
            placeholder="ceramic, handmade, kitchen, blue, mug"
          />
          <p className="text-xs text-slate-500 mt-1">Separate tags with commas</p>
        </div>
      </div>

      {/* Submit */}
      <div className="flex gap-4 pt-6 border-t">
        <Button
          type="submit"
          disabled={isSubmitting || photoUploading}
          className="flex-1 sm:flex-none"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating Product...
            </>
          ) : (
            'Create Product'
          )}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
        >
          Cancel
        </Button>
      </div>
    </form>
  )
}
