'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Shop, updateShop } from '@/lib/firestore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { 
  Package, 
  Plus, 
  Trash2, 
  Edit3, 
  Save, 
  X, 
  Info,
  Ruler,
  Weight
} from 'lucide-react'

const shippingTierSchema = z.object({
  name: z.string().min(1, 'Name is required').max(50, 'Name must be less than 50 characters'),
  description: z.string().max(200, 'Description must be less than 200 characters').optional(),
  domesticRate: z.number().min(0, 'Rate must be positive'),
  internationalRate: z.number().min(0, 'Rate must be positive'),
  enabled: z.boolean(),
  maxWeight: z.number().min(0).optional(),
  maxLength: z.number().min(0).optional(),
  maxWidth: z.number().min(0).optional(),
  maxHeight: z.number().min(0).optional(),
})

type ShippingTierFormData = z.infer<typeof shippingTierSchema>

interface ShippingTier {
  id: string
  name: string
  description?: string
  domesticRate: number
  internationalRate: number
  enabled: boolean
  maxWeight?: number
  maxDimensions?: {
    length: number
    width: number
    height: number
  }
}

interface ShippingTiersProps {
  shop: Shop
  onUpdate?: () => void
}

const DEFAULT_TIERS: Omit<ShippingTier, 'id'>[] = [
  {
    name: 'Prints & Documents',
    description: 'Flat items, prints, documents, and cards',
    domesticRate: 200, // £2
    internationalRate: 400, // £4
    enabled: true,
    maxWeight: 100, // 100g
    maxDimensions: { length: 30, width: 21, height: 2 } // A4 size, 2cm thick
  },
  {
    name: 'Small Parcels',
    description: 'Small items that fit in a padded envelope',
    domesticRate: 500, // £5
    internationalRate: 800, // £8
    enabled: true,
    maxWeight: 500, // 500g
    maxDimensions: { length: 35, width: 25, height: 5 }
  },
  {
    name: 'Standard Parcels',
    description: 'Regular sized packages and boxes',
    domesticRate: 800, // £8
    internationalRate: 1500, // £15
    enabled: true,
    maxWeight: 2000, // 2kg
    maxDimensions: { length: 45, width: 35, height: 20 }
  }
]

export function ShippingTiers({ shop, onUpdate }: ShippingTiersProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [editingTier, setEditingTier] = useState<string | null>(null)
  const [isAddingTier, setIsAddingTier] = useState(false)

  const currentTiers = shop.shippingTiers || []

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm<ShippingTierFormData>({
    resolver: zodResolver(shippingTierSchema),
  })

  const formatPrice = (cents: number) => `£${(cents / 100).toFixed(2)}`

  const generateId = () => `tier_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

  const addDefaultTiers = async () => {
    const newTiers = DEFAULT_TIERS.map(tier => ({
      ...tier,
      id: generateId()
    }))

    await updateShopTiers([...currentTiers, ...newTiers])
  }

  const updateShopTiers = async (newTiers: ShippingTier[]) => {
    setIsSubmitting(true)
    setError(null)
    setSuccess(null)

    try {
      await updateShop(shop.id, { shippingTiers: newTiers })
      setSuccess('Shipping tiers updated successfully!')
      onUpdate?.()
    } catch (err: any) {
      console.error('Error updating shipping tiers:', err)
      setError(err.message || 'Failed to update shipping tiers')
    } finally {
      setIsSubmitting(false)
    }
  }

  const onSubmit = async (data: ShippingTierFormData) => {
    const tierData: ShippingTier = {
      id: editingTier || generateId(),
      name: data.name,
      description: data.description,
      domesticRate: Math.round(data.domesticRate * 100),
      internationalRate: Math.round(data.internationalRate * 100),
      enabled: data.enabled,
      maxWeight: data.maxWeight,
      maxDimensions: (data.maxLength && data.maxWidth && data.maxHeight) ? {
        length: data.maxLength,
        width: data.maxWidth,
        height: data.maxHeight
      } : undefined
    }

    let newTiers: ShippingTier[]
    if (editingTier) {
      // Update existing tier
      newTiers = currentTiers.map(tier => 
        tier.id === editingTier ? tierData : tier
      )
    } else {
      // Add new tier
      newTiers = [...currentTiers, tierData]
    }

    await updateShopTiers(newTiers)
    
    setEditingTier(null)
    setIsAddingTier(false)
    reset()
  }

  const deleteTier = async (tierId: string) => {
    const newTiers = currentTiers.filter(tier => tier.id !== tierId)
    await updateShopTiers(newTiers)
  }

  const startEditing = (tier: ShippingTier) => {
    setEditingTier(tier.id)
    setIsAddingTier(false)
    reset({
      name: tier.name,
      description: tier.description || '',
      domesticRate: tier.domesticRate / 100,
      internationalRate: tier.internationalRate / 100,
      enabled: tier.enabled,
      maxWeight: tier.maxWeight,
      maxLength: tier.maxDimensions?.length,
      maxWidth: tier.maxDimensions?.width,
      maxHeight: tier.maxDimensions?.height,
    })
  }

  const startAdding = () => {
    setIsAddingTier(true)
    setEditingTier(null)
    reset({
      name: '',
      description: '',
      domesticRate: 5,
      internationalRate: 10,
      enabled: true,
    })
  }

  const cancelEditing = () => {
    setEditingTier(null)
    setIsAddingTier(false)
    reset()
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          Custom Shipping Tiers
        </CardTitle>
        <CardDescription>
          Create custom shipping categories based on item size, weight, or type
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
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
            Shipping tiers let you set different rates based on item characteristics. 
            When creating products, you can assign them to specific tiers.
          </AlertDescription>
        </Alert>

        {/* Current Tiers */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Current Shipping Tiers</h3>
            <div className="flex gap-2">
              {currentTiers.length === 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={addDefaultTiers}
                  disabled={isSubmitting}
                >
                  Add Default Tiers
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={startAdding}
                disabled={isSubmitting || isAddingTier}
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Tier
              </Button>
            </div>
          </div>

          {currentTiers.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <Package className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No shipping tiers configured yet</p>
              <p className="text-sm">Add default tiers or create your own custom ones</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {currentTiers.map((tier) => (
                <div key={tier.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-medium">{tier.name}</h4>
                        <Badge variant={tier.enabled ? 'default' : 'secondary'}>
                          {tier.enabled ? 'Active' : 'Disabled'}
                        </Badge>
                      </div>
                      
                      {tier.description && (
                        <p className="text-sm text-slate-600 mb-3">{tier.description}</p>
                      )}
                      
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-slate-500">UK:</span> {formatPrice(tier.domesticRate)}
                        </div>
                        <div>
                          <span className="text-slate-500">International:</span> {formatPrice(tier.internationalRate)}
                        </div>
                      </div>

                      {(tier.maxWeight || tier.maxDimensions) && (
                        <div className="mt-3 flex gap-4 text-xs text-slate-500">
                          {tier.maxWeight && (
                            <div className="flex items-center gap-1">
                              <Weight className="h-3 w-3" />
                              Max {tier.maxWeight}g
                            </div>
                          )}
                          {tier.maxDimensions && (
                            <div className="flex items-center gap-1">
                              <Ruler className="h-3 w-3" />
                              Max {tier.maxDimensions.length}×{tier.maxDimensions.width}×{tier.maxDimensions.height}cm
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => startEditing(tier)}
                        disabled={isSubmitting}
                      >
                        <Edit3 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteTier(tier.id)}
                        disabled={isSubmitting}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Add/Edit Form */}
        {(isAddingTier || editingTier) && (
          <div className="border-t pt-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">
                {editingTier ? 'Edit Shipping Tier' : 'Add New Shipping Tier'}
              </h3>
              <Button variant="ghost" size="sm" onClick={cancelEditing}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Tier Name *</Label>
                  <Input
                    id="name"
                    placeholder="e.g., Small Parcels"
                    {...register('name')}
                  />
                  {errors.name && (
                    <p className="text-sm text-red-600 mt-1">{errors.name.message}</p>
                  )}
                </div>
                
                <div className="flex items-center space-x-2 pt-8">
                  <Checkbox id="enabled" {...register('enabled')} />
                  <Label htmlFor="enabled">Enable this tier</Label>
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="What types of items use this shipping tier?"
                  {...register('description')}
                />
                {errors.description && (
                  <p className="text-sm text-red-600 mt-1">{errors.description.message}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="domesticRate">UK Rate (£) *</Label>
                  <Input
                    id="domesticRate"
                    type="number"
                    step="0.01"
                    min="0"
                    {...register('domesticRate', { valueAsNumber: true })}
                  />
                  {errors.domesticRate && (
                    <p className="text-sm text-red-600 mt-1">{errors.domesticRate.message}</p>
                  )}
                </div>
                
                <div>
                  <Label htmlFor="internationalRate">International Rate (£) *</Label>
                  <Input
                    id="internationalRate"
                    type="number"
                    step="0.01"
                    min="0"
                    {...register('internationalRate', { valueAsNumber: true })}
                  />
                  {errors.internationalRate && (
                    <p className="text-sm text-red-600 mt-1">{errors.internationalRate.message}</p>
                  )}
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="font-medium text-slate-700">Limits (Optional)</h4>
                
                <div>
                  <Label htmlFor="maxWeight">Maximum Weight (grams)</Label>
                  <Input
                    id="maxWeight"
                    type="number"
                    min="0"
                    placeholder="e.g., 500"
                    {...register('maxWeight', { valueAsNumber: true })}
                  />
                </div>

                <div>
                  <Label>Maximum Dimensions (cm)</Label>
                  <div className="grid grid-cols-3 gap-2 mt-1">
                    <Input
                      placeholder="Length"
                      type="number"
                      min="0"
                      {...register('maxLength', { valueAsNumber: true })}
                    />
                    <Input
                      placeholder="Width"
                      type="number"
                      min="0"
                      {...register('maxWidth', { valueAsNumber: true })}
                    />
                    <Input
                      placeholder="Height"
                      type="number"
                      min="0"
                      {...register('maxHeight', { valueAsNumber: true })}
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      {editingTier ? 'Update Tier' : 'Add Tier'}
                    </>
                  )}
                </Button>
                <Button type="button" variant="outline" onClick={cancelEditing}>
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
