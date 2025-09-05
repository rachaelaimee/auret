'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { updateShop, Shop } from '@/lib/firestore'
import { uploadImage, validateImageFile } from '@/lib/storage'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Upload, X, Save } from 'lucide-react'

const shopSettingsSchema = z.object({
  name: z.string()
    .min(2, 'Shop name must be at least 2 characters')
    .max(50, 'Shop name must be less than 50 characters'),
  bio: z.string()
    .max(500, 'Bio must be less than 500 characters')
    .optional(),
  country: z.string()
    .min(2, 'Please select your country')
})

type ShopSettingsFormData = z.infer<typeof shopSettingsSchema>

interface ShopSettingsFormProps {
  shop: Shop & {
    createdAt: Date
    updatedAt: Date
  }
}

export function ShopSettingsForm({ shop }: ShopSettingsFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(() => {
    // Only use shop.logoUrl if it's a valid HTTP(S) URL, not a blob URL
    const logoUrl = shop.logoUrl
    if (logoUrl && (logoUrl.startsWith('http://') || logoUrl.startsWith('https://'))) {
      return logoUrl
    }
    return null
  })
  const [isUploadingLogo, setIsUploadingLogo] = useState(false)
  const [logoChanged, setLogoChanged] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<ShopSettingsFormData>({
    resolver: zodResolver(shopSettingsSchema),
    defaultValues: {
      name: shop.name,
      bio: shop.bio || '',
      country: shop.country || ''
    }
  })

  // Clean up blob URLs when component unmounts
  useEffect(() => {
    return () => {
      if (logoPreview && logoPreview.startsWith('blob:')) {
        URL.revokeObjectURL(logoPreview)
      }
    }
  }, [logoPreview])

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const validationError = validateImageFile(file)
    if (validationError) {
      setError(validationError)
      return
    }

    setLogoFile(file)
    setLogoPreview(URL.createObjectURL(file))
    setLogoChanged(true)
    setError(null)
  }

  const removeLogo = () => {
    setLogoFile(null)
    if (logoPreview && logoPreview.startsWith('blob:')) {
      URL.revokeObjectURL(logoPreview)
    }
    setLogoPreview(null)
    setLogoChanged(true)
  }

  const onSubmit = async (data: ShopSettingsFormData) => {
    setIsSubmitting(true)
    setError(null)
    setSuccess(null)

    try {
      let logoUrl = shop.logoUrl

      // Upload new logo if changed
      if (logoChanged) {
        if (logoFile) {
          setIsUploadingLogo(true)
          try {
            const result = await uploadImage(logoFile, 'shop-logos')
            logoUrl = result.url
          } catch (uploadError) {
            console.error('Error uploading logo:', uploadError)
            setError('Failed to upload logo. Please try again.')
            setIsSubmitting(false)
            setIsUploadingLogo(false)
            return
          } finally {
            setIsUploadingLogo(false)
          }
        } else {
          // Logo was removed
          logoUrl = undefined
        }
      }

      // Update shop
      await updateShop(shop.id, {
        name: data.name,
        bio: data.bio || '',
        logoUrl,
        country: data.country
      })

      setSuccess('Shop settings updated successfully!')
      
      // Refresh the page after a short delay to show the updated data
      setTimeout(() => {
        router.refresh()
      }, 1000)

    } catch (err: any) {
      console.error('Error updating shop:', err)
      setError(err.message || 'Failed to update shop settings. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

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

      {/* Shop Logo */}
      <div className="space-y-2">
        <Label>Shop Logo</Label>
        <div className="flex items-center gap-4">
          {logoPreview ? (
            <div className="relative">
              <img
                src={logoPreview}
                alt="Shop logo preview"
                className="h-20 w-20 object-cover rounded-lg border border-slate-300"
              />
              <button
                type="button"
                onClick={removeLogo}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ) : (
            <div className="h-20 w-20 border-2 border-dashed border-slate-300 rounded-lg flex items-center justify-center bg-slate-50">
              <Upload className="h-6 w-6 text-slate-400" />
            </div>
          )}
          
          <div className="flex-1">
            <input
              type="file"
              id="logo-upload"
              accept="image/*"
              onChange={handleLogoUpload}
              className="hidden"
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => document.getElementById('logo-upload')?.click()}
              disabled={isUploadingLogo}
            >
              {isUploadingLogo ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  {logoPreview ? 'Change Logo' : 'Upload Logo'}
                </>
              )}
            </Button>
            <p className="text-xs text-slate-500 mt-1">
              Optional. JPG, PNG, WebP or GIF. Max 5MB.
            </p>
          </div>
        </div>
      </div>

      {/* Shop Name */}
      <div className="space-y-2">
        <Label htmlFor="name">Shop Name *</Label>
        <Input
          id="name"
          {...register('name')}
          placeholder="My Awesome Shop"
        />
        {errors.name && (
          <p className="text-sm text-red-600">{errors.name.message}</p>
        )}
      </div>

      {/* Shop Bio */}
      <div className="space-y-2">
        <Label htmlFor="bio">Shop Bio</Label>
        <Textarea
          id="bio"
          {...register('bio')}
          placeholder="Tell customers about your shop, your story, and what makes your products special..."
          rows={4}
        />
        {errors.bio && (
          <p className="text-sm text-red-600">{errors.bio.message}</p>
        )}
        <p className="text-xs text-slate-500">
          A compelling bio helps customers connect with your brand.
        </p>
      </div>

      {/* Country */}
      <div className="space-y-2">
        <Label htmlFor="country">Country *</Label>
        <select
          id="country"
          {...register('country')}
          className="flex h-10 w-full rounded-md border border-slate-300 bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <option value="">Select your country</option>
          <option value="US">United States</option>
          <option value="CA">Canada</option>
          <option value="GB">United Kingdom</option>
          <option value="AU">Australia</option>
          <option value="DE">Germany</option>
          <option value="FR">France</option>
          <option value="IT">Italy</option>
          <option value="ES">Spain</option>
          <option value="NL">Netherlands</option>
          <option value="SE">Sweden</option>
          <option value="NO">Norway</option>
          <option value="DK">Denmark</option>
          <option value="FI">Finland</option>
          <option value="JP">Japan</option>
          <option value="KR">South Korea</option>
          <option value="SG">Singapore</option>
          <option value="NZ">New Zealand</option>
        </select>
        {errors.country && (
          <p className="text-sm text-red-600">{errors.country.message}</p>
        )}
      </div>

      {/* Submit Button */}
      <div className="flex justify-end pt-4">
        <Button
          type="submit"
          disabled={isSubmitting}
          className="min-w-[120px]"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </>
          )}
        </Button>
      </div>
    </form>
  )
}
