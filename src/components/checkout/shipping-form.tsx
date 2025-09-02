'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Truck, MapPin } from 'lucide-react'

const shippingSchema = z.object({
  // Shipping Address
  shippingFirstName: z.string().min(1, 'First name is required'),
  shippingLastName: z.string().min(1, 'Last name is required'),
  shippingEmail: z.string().email('Valid email is required'),
  shippingPhone: z.string().min(10, 'Valid phone number is required'),
  shippingAddress1: z.string().min(1, 'Address is required'),
  shippingAddress2: z.string().optional(),
  shippingCity: z.string().min(1, 'City is required'),
  shippingState: z.string().min(1, 'State/Province is required'),
  shippingPostalCode: z.string().min(1, 'Postal code is required'),
  shippingCountry: z.string().min(1, 'Country is required'),
  
  // Billing Address (optional if same as shipping)
  billingIsSame: z.boolean().default(true),
  billingFirstName: z.string().optional(),
  billingLastName: z.string().optional(),
  billingAddress1: z.string().optional(),
  billingAddress2: z.string().optional(),
  billingCity: z.string().optional(),
  billingState: z.string().optional(),
  billingPostalCode: z.string().optional(),
  billingCountry: z.string().optional(),
})

export type ShippingFormData = z.infer<typeof shippingSchema>

interface ShippingFormProps {
  onSubmit: (data: ShippingFormData) => void
  defaultValues?: Partial<ShippingFormData>
  isLoading?: boolean
}

// Common countries list
const COUNTRIES = [
  { code: 'US', name: 'United States' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'CA', name: 'Canada' },
  { code: 'AU', name: 'Australia' },
  { code: 'DE', name: 'Germany' },
  { code: 'FR', name: 'France' },
  { code: 'IT', name: 'Italy' },
  { code: 'ES', name: 'Spain' },
  { code: 'NL', name: 'Netherlands' },
  { code: 'BE', name: 'Belgium' },
  { code: 'CH', name: 'Switzerland' },
  { code: 'AT', name: 'Austria' },
  { code: 'SE', name: 'Sweden' },
  { code: 'NO', name: 'Norway' },
  { code: 'DK', name: 'Denmark' },
  { code: 'FI', name: 'Finland' },
]

export function ShippingForm({ onSubmit, defaultValues, isLoading = false }: ShippingFormProps) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors }
  } = useForm<ShippingFormData>({
    resolver: zodResolver(shippingSchema),
    defaultValues: {
      billingIsSame: true,
      shippingCountry: 'GB', // Default to UK
      ...defaultValues
    }
  })

  const billingIsSame = watch('billingIsSame')

  const handleFormSubmit = (data: ShippingFormData) => {
    // If billing is same as shipping, copy shipping data to billing
    if (data.billingIsSame) {
      data.billingFirstName = data.shippingFirstName
      data.billingLastName = data.shippingLastName
      data.billingAddress1 = data.shippingAddress1
      data.billingAddress2 = data.shippingAddress2
      data.billingCity = data.shippingCity
      data.billingState = data.shippingState
      data.billingPostalCode = data.shippingPostalCode
      data.billingCountry = data.shippingCountry
    }
    
    onSubmit(data)
  }

  return (
    <div className="space-y-6">
      {/* Shipping Address */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5" />
            Shipping Address
          </CardTitle>
          <CardDescription>
            Where should we send your order?
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Name */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="shippingFirstName">First Name *</Label>
              <Input
                id="shippingFirstName"
                {...register('shippingFirstName')}
                placeholder="John"
              />
              {errors.shippingFirstName && (
                <p className="text-sm text-red-600 mt-1">{errors.shippingFirstName.message}</p>
              )}
            </div>
            <div>
              <Label htmlFor="shippingLastName">Last Name *</Label>
              <Input
                id="shippingLastName"
                {...register('shippingLastName')}
                placeholder="Doe"
              />
              {errors.shippingLastName && (
                <p className="text-sm text-red-600 mt-1">{errors.shippingLastName.message}</p>
              )}
            </div>
          </div>

          {/* Contact */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="shippingEmail">Email *</Label>
              <Input
                id="shippingEmail"
                type="email"
                {...register('shippingEmail')}
                placeholder="john@example.com"
              />
              {errors.shippingEmail && (
                <p className="text-sm text-red-600 mt-1">{errors.shippingEmail.message}</p>
              )}
            </div>
            <div>
              <Label htmlFor="shippingPhone">Phone *</Label>
              <Input
                id="shippingPhone"
                type="tel"
                {...register('shippingPhone')}
                placeholder="+44 7123 456789"
              />
              {errors.shippingPhone && (
                <p className="text-sm text-red-600 mt-1">{errors.shippingPhone.message}</p>
              )}
            </div>
          </div>

          {/* Address */}
          <div>
            <Label htmlFor="shippingAddress1">Address Line 1 *</Label>
            <Input
              id="shippingAddress1"
              {...register('shippingAddress1')}
              placeholder="123 Main Street"
            />
            {errors.shippingAddress1 && (
              <p className="text-sm text-red-600 mt-1">{errors.shippingAddress1.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="shippingAddress2">Address Line 2</Label>
            <Input
              id="shippingAddress2"
              {...register('shippingAddress2')}
              placeholder="Apartment, suite, etc. (optional)"
            />
          </div>

          {/* City, State, Postal Code */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="shippingCity">City *</Label>
              <Input
                id="shippingCity"
                {...register('shippingCity')}
                placeholder="London"
              />
              {errors.shippingCity && (
                <p className="text-sm text-red-600 mt-1">{errors.shippingCity.message}</p>
              )}
            </div>
            <div>
              <Label htmlFor="shippingState">State/Province *</Label>
              <Input
                id="shippingState"
                {...register('shippingState')}
                placeholder="England"
              />
              {errors.shippingState && (
                <p className="text-sm text-red-600 mt-1">{errors.shippingState.message}</p>
              )}
            </div>
            <div>
              <Label htmlFor="shippingPostalCode">Postal Code *</Label>
              <Input
                id="shippingPostalCode"
                {...register('shippingPostalCode')}
                placeholder="SW1A 1AA"
              />
              {errors.shippingPostalCode && (
                <p className="text-sm text-red-600 mt-1">{errors.shippingPostalCode.message}</p>
              )}
            </div>
          </div>

          {/* Country */}
          <div>
            <Label htmlFor="shippingCountry">Country *</Label>
            <Select 
              value={watch('shippingCountry')} 
              onValueChange={(value) => setValue('shippingCountry', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select country" />
              </SelectTrigger>
              <SelectContent>
                {COUNTRIES.map((country) => (
                  <SelectItem key={country.code} value={country.code}>
                    {country.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.shippingCountry && (
              <p className="text-sm text-red-600 mt-1">{errors.shippingCountry.message}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Billing Address */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Billing Address
          </CardTitle>
          <CardDescription>
            Where should we send the invoice?
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Same as Shipping Checkbox */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="billingIsSame"
              checked={billingIsSame}
              onCheckedChange={(checked) => setValue('billingIsSame', checked as boolean)}
            />
            <Label htmlFor="billingIsSame" className="text-sm font-normal">
              Billing address is the same as shipping address
            </Label>
          </div>

          {/* Billing Fields (only show if different from shipping) */}
          {!billingIsSame && (
            <div className="space-y-4 pt-4 border-t">
              {/* Name */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="billingFirstName">First Name *</Label>
                  <Input
                    id="billingFirstName"
                    {...register('billingFirstName')}
                    placeholder="John"
                  />
                  {errors.billingFirstName && (
                    <p className="text-sm text-red-600 mt-1">{errors.billingFirstName.message}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="billingLastName">Last Name *</Label>
                  <Input
                    id="billingLastName"
                    {...register('billingLastName')}
                    placeholder="Doe"
                  />
                  {errors.billingLastName && (
                    <p className="text-sm text-red-600 mt-1">{errors.billingLastName.message}</p>
                  )}
                </div>
              </div>

              {/* Address */}
              <div>
                <Label htmlFor="billingAddress1">Address Line 1 *</Label>
                <Input
                  id="billingAddress1"
                  {...register('billingAddress1')}
                  placeholder="123 Main Street"
                />
                {errors.billingAddress1 && (
                  <p className="text-sm text-red-600 mt-1">{errors.billingAddress1.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="billingAddress2">Address Line 2</Label>
                <Input
                  id="billingAddress2"
                  {...register('billingAddress2')}
                  placeholder="Apartment, suite, etc. (optional)"
                />
              </div>

              {/* City, State, Postal Code */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="billingCity">City *</Label>
                  <Input
                    id="billingCity"
                    {...register('billingCity')}
                    placeholder="London"
                  />
                  {errors.billingCity && (
                    <p className="text-sm text-red-600 mt-1">{errors.billingCity.message}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="billingState">State/Province *</Label>
                  <Input
                    id="billingState"
                    {...register('billingState')}
                    placeholder="England"
                  />
                  {errors.billingState && (
                    <p className="text-sm text-red-600 mt-1">{errors.billingState.message}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="billingPostalCode">Postal Code *</Label>
                  <Input
                    id="billingPostalCode"
                    {...register('billingPostalCode')}
                    placeholder="SW1A 1AA"
                  />
                  {errors.billingPostalCode && (
                    <p className="text-sm text-red-600 mt-1">{errors.billingPostalCode.message}</p>
                  )}
                </div>
              </div>

              {/* Country */}
              <div>
                <Label htmlFor="billingCountry">Country *</Label>
                <Select 
                  value={watch('billingCountry')} 
                  onValueChange={(value) => setValue('billingCountry', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select country" />
                  </SelectTrigger>
                  <SelectContent>
                    {COUNTRIES.map((country) => (
                      <SelectItem key={country.code} value={country.code}>
                        {country.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.billingCountry && (
                  <p className="text-sm text-red-600 mt-1">{errors.billingCountry.message}</p>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Submit Button */}
      <Button 
        size="lg" 
        className="w-full" 
        onClick={handleSubmit(handleFormSubmit)}
        disabled={isLoading}
      >
        {isLoading ? 'Processing...' : 'Continue to Payment'}
      </Button>
    </div>
  )
}

