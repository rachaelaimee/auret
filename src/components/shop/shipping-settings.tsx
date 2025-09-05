'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Shop, updateShop } from '@/lib/firestore'
import { DEFAULT_SHIPPING_RATES } from '@/lib/shipping'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { Truck, Package, Globe, Save, Info } from 'lucide-react'

const shippingSettingsSchema = z.object({
  domesticEnabled: z.boolean(),
  domesticRate: z.number().min(0, 'Rate must be positive'),
  domesticFreeThreshold: z.number().min(0, 'Threshold must be positive').optional(),
  internationalEnabled: z.boolean(),
  internationalRate: z.number().min(0, 'Rate must be positive'),
  internationalFreeThreshold: z.number().min(0, 'Threshold must be positive').optional(),
})

type ShippingSettingsFormData = z.infer<typeof shippingSettingsSchema>

interface ShippingSettingsProps {
  shop: Shop
  onUpdate?: () => void
}

export function ShippingSettings({ shop, onUpdate }: ShippingSettingsProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Get current shipping rates or use defaults
  const currentRates = shop.shippingRates || DEFAULT_SHIPPING_RATES

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors }
  } = useForm<ShippingSettingsFormData>({
    resolver: zodResolver(shippingSettingsSchema),
    defaultValues: {
      domesticEnabled: currentRates.domestic.enabled,
      domesticRate: currentRates.domestic.rate / 100, // Convert from cents to pounds
      domesticFreeThreshold: currentRates.domestic.freeThreshold ? currentRates.domestic.freeThreshold / 100 : undefined,
      internationalEnabled: currentRates.international.enabled,
      internationalRate: currentRates.international.rate / 100,
      internationalFreeThreshold: currentRates.international.freeThreshold ? currentRates.international.freeThreshold / 100 : undefined,
    }
  })

  const watchDomesticEnabled = watch('domesticEnabled')
  const watchInternationalEnabled = watch('internationalEnabled')

  const onSubmit = async (data: ShippingSettingsFormData) => {
    setIsSubmitting(true)
    setError(null)
    setSuccess(null)

    try {
      const shippingRates = {
        domestic: {
          enabled: data.domesticEnabled,
          rate: Math.round(data.domesticRate * 100), // Convert to cents
          freeThreshold: data.domesticFreeThreshold ? Math.round(data.domesticFreeThreshold * 100) : undefined,
        },
        international: {
          enabled: data.internationalEnabled,
          rate: Math.round(data.internationalRate * 100),
          freeThreshold: data.internationalFreeThreshold ? Math.round(data.internationalFreeThreshold * 100) : undefined,
        }
      }

      await updateShop(shop.id, { shippingRates })
      setSuccess('Shipping settings updated successfully!')
      onUpdate?.()

    } catch (err: any) {
      console.error('Error updating shipping settings:', err)
      setError(err.message || 'Failed to update shipping settings')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Truck className="h-5 w-5" />
          Shipping Settings
        </CardTitle>
        <CardDescription>
          Configure your shipping rates and policies for physical products
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert>
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Digital products are always free to deliver. These settings only apply to physical items.
            </AlertDescription>
          </Alert>

          {/* Domestic Shipping */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-blue-600" />
              <h3 className="text-lg font-semibold">Domestic Shipping (UK)</h3>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="domesticEnabled"
                {...register('domesticEnabled')}
              />
              <Label htmlFor="domesticEnabled">
                Enable domestic shipping within the UK
              </Label>
            </div>

            {watchDomesticEnabled && (
              <div className="ml-6 space-y-4 p-4 bg-slate-50 rounded-lg">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="domesticRate">Shipping Rate (£)</Label>
                    <Input
                      id="domesticRate"
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="5.00"
                      {...register('domesticRate', { valueAsNumber: true })}
                    />
                    {errors.domesticRate && (
                      <p className="text-sm text-red-600 mt-1">{errors.domesticRate.message}</p>
                    )}
                  </div>
                  
                  <div>
                    <Label htmlFor="domesticFreeThreshold">Free Shipping Over (£) <span className="text-sm text-slate-500">(optional)</span></Label>
                    <Input
                      id="domesticFreeThreshold"
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="50.00"
                      {...register('domesticFreeThreshold', { valueAsNumber: true })}
                    />
                    {errors.domesticFreeThreshold && (
                      <p className="text-sm text-red-600 mt-1">{errors.domesticFreeThreshold.message}</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          <Separator />

          {/* International Shipping */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-green-600" />
              <h3 className="text-lg font-semibold">International Shipping</h3>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="internationalEnabled"
                {...register('internationalEnabled')}
              />
              <Label htmlFor="internationalEnabled">
                Enable international shipping worldwide
              </Label>
            </div>

            {watchInternationalEnabled && (
              <div className="ml-6 space-y-4 p-4 bg-slate-50 rounded-lg">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="internationalRate">Shipping Rate (£)</Label>
                    <Input
                      id="internationalRate"
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="10.00"
                      {...register('internationalRate', { valueAsNumber: true })}
                    />
                    {errors.internationalRate && (
                      <p className="text-sm text-red-600 mt-1">{errors.internationalRate.message}</p>
                    )}
                  </div>
                  
                  <div>
                    <Label htmlFor="internationalFreeThreshold">Free Shipping Over (£) <span className="text-sm text-slate-500">(optional)</span></Label>
                    <Input
                      id="internationalFreeThreshold"
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="100.00"
                      {...register('internationalFreeThreshold', { valueAsNumber: true })}
                    />
                    {errors.internationalFreeThreshold && (
                      <p className="text-sm text-red-600 mt-1">{errors.internationalFreeThreshold.message}</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="pt-4">
            <Button type="submit" disabled={isSubmitting} className="flex items-center gap-2">
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Save Shipping Settings
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

function Loader2(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 12a9 9 0 11-6.219-8.56" />
    </svg>
  )
}
