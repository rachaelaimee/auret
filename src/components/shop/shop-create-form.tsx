'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useUserProfile } from '@/hooks/use-user-profile'
import { createShop, isHandleAvailable } from '@/lib/firestore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, CheckCircle, XCircle } from 'lucide-react'

const shopCreateSchema = z.object({
  handle: z.string()
    .min(3, 'Handle must be at least 3 characters')
    .max(30, 'Handle must be less than 30 characters')
    .regex(/^[a-z0-9-]+$/, 'Handle can only contain lowercase letters, numbers, and hyphens')
    .regex(/^[a-z0-9]/, 'Handle must start with a letter or number')
    .regex(/[a-z0-9]$/, 'Handle must end with a letter or number'),
  name: z.string()
    .min(2, 'Shop name must be at least 2 characters')
    .max(50, 'Shop name must be less than 50 characters'),
  bio: z.string()
    .max(500, 'Bio must be less than 500 characters')
    .optional(),
  country: z.string()
    .min(2, 'Please select your country')
})

type ShopCreateFormData = z.infer<typeof shopCreateSchema>

export function ShopCreateForm() {
  const { user } = useUserProfile()
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [handleStatus, setHandleStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle')

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    setError: setFormError,
    clearErrors
  } = useForm<ShopCreateFormData>({
    resolver: zodResolver(shopCreateSchema)
  })

  const watchedHandle = watch('handle')

  // Check handle availability with debouncing
  const checkHandleAvailability = async (handle: string) => {
    if (!handle || handle.length < 3) {
      setHandleStatus('idle')
      return
    }

    // Basic validation first
    const handleRegex = /^[a-z0-9-]+$/
    if (!handleRegex.test(handle)) {
      setHandleStatus('idle')
      return
    }

    setHandleStatus('checking')
    
    try {
      const available = await isHandleAvailable(handle)
      setHandleStatus(available ? 'available' : 'taken')
      
      if (!available) {
        setFormError('handle', {
          type: 'manual',
          message: 'This handle is already taken'
        })
      } else {
        clearErrors('handle')
      }
    } catch (error) {
      console.error('Error checking handle availability:', error)
      setHandleStatus('idle')
    }
  }

  // Debounce handle checking
  useState(() => {
    const timeoutId = setTimeout(() => {
      if (watchedHandle) {
        checkHandleAvailability(watchedHandle)
      }
    }, 500)

    return () => clearTimeout(timeoutId)
  })

  const onSubmit = async (data: ShopCreateFormData) => {
    if (!user) return

    setIsSubmitting(true)
    setError(null)

    try {
      // Final handle availability check
      const available = await isHandleAvailable(data.handle)
      if (!available) {
        setFormError('handle', {
          type: 'manual',
          message: 'This handle is already taken'
        })
        setIsSubmitting(false)
        return
      }

      // Create the shop
      const shop = await createShop({
        ownerId: user.uid,
        handle: data.handle,
        name: data.name,
        bio: data.bio || '',
        country: data.country,
        currency: 'USD', // Default to USD for now
        status: 'active',
        stripeOnboardingComplete: false
      })

      // Redirect to the new shop
      router.push(`/shop/${shop.handle}`)
    } catch (err: any) {
      console.error('Error creating shop:', err)
      setError(err.message || 'Failed to create shop. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const getHandleStatusIcon = () => {
    switch (handleStatus) {
      case 'checking':
        return <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
      case 'available':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'taken':
        return <XCircle className="h-4 w-4 text-red-500" />
      default:
        return null
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Shop Handle */}
      <div className="space-y-2">
        <Label htmlFor="handle">Shop Handle *</Label>
        <div className="relative">
          <div className="flex">
            <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-slate-300 bg-slate-50 text-slate-500 text-sm">
              auret.com/shop/
            </span>
            <Input
              id="handle"
              {...register('handle')}
              className="rounded-l-none"
              placeholder="my-awesome-shop"
              onChange={(e) => {
                const value = e.target.value.toLowerCase()
                e.target.value = value
                register('handle').onChange(e)
              }}
            />
          </div>
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            {getHandleStatusIcon()}
          </div>
        </div>
        {errors.handle && (
          <p className="text-sm text-red-600">{errors.handle.message}</p>
        )}
        <p className="text-xs text-slate-500">
          Choose a unique handle for your shop URL. Use only lowercase letters, numbers, and hyphens.
        </p>
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
          <option value="SG">Singapore</option>
          <option value="NZ">New Zealand</option>
        </select>
        {errors.country && (
          <p className="text-sm text-red-600">{errors.country.message}</p>
        )}
        <p className="text-xs text-slate-500">
          This helps with payment processing and shipping calculations.
        </p>
      </div>

      {/* Submit Button */}
      <div className="flex gap-3 pt-4">
        <Button
          type="submit"
          disabled={isSubmitting || handleStatus === 'checking' || handleStatus === 'taken'}
          className="flex-1"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating Shop...
            </>
          ) : (
            'Create Shop'
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
