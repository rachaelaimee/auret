'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Loader2, RefreshCw, CheckCircle } from 'lucide-react'
import { SUPPORTED_CURRENCIES, Currency } from '@/lib/currency'
import { updateProduct } from '@/lib/firestore'

interface Product {
  id: string
  title: string
  priceCents: number
  currency?: string
}

interface CurrencyMigrationToolProps {
  products: Product[]
  onUpdate: () => void
}

export function CurrencyMigrationTool({ products, onUpdate }: CurrencyMigrationToolProps) {
  const [selectedCurrency, setSelectedCurrency] = useState<Currency>('GBP')
  const [isUpdating, setIsUpdating] = useState(false)
  const [success, setSuccess] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Find products without currency (old products)
  const productsNeedingUpdate = products.filter(p => !p.currency)
  
  if (productsNeedingUpdate.length === 0) {
    return null // No products need updating
  }

  const handleUpdateCurrencies = async () => {
    setIsUpdating(true)
    setError(null)
    setSuccess(null)

    try {
      // Update all products without currency to the selected currency
      const updatePromises = productsNeedingUpdate.map(product => 
        updateProduct(product.id, { currency: selectedCurrency })
      )
      
      await Promise.all(updatePromises)
      
      setSuccess(`✅ Updated ${productsNeedingUpdate.length} products to ${selectedCurrency}`)
      onUpdate() // Refresh the products list
    } catch (err: any) {
      console.error('Error updating product currencies:', err)
      setError('Failed to update product currencies. Please try again.')
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <Card className="mb-6 border-amber-200 bg-amber-50">
      <CardHeader>
        <div className="flex items-center gap-2">
          <RefreshCw className="h-5 w-5 text-amber-600" />
          <CardTitle className="text-amber-900">Currency Migration Needed</CardTitle>
        </div>
        <CardDescription className="text-amber-700">
          You have {productsNeedingUpdate.length} products that were created before currency support was added.
          They're currently stored as USD but need to be updated to reflect their actual currency.
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {success && (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-700">{success}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-4">
          <div>
            <h4 className="font-medium text-amber-900 mb-2">Products needing currency update:</h4>
            <div className="flex flex-wrap gap-2">
              {productsNeedingUpdate.slice(0, 5).map(product => (
                <Badge key={product.id} variant="outline" className="text-amber-700 border-amber-300">
                  {product.title}
                </Badge>
              ))}
              {productsNeedingUpdate.length > 5 && (
                <Badge variant="outline" className="text-amber-700 border-amber-300">
                  +{productsNeedingUpdate.length - 5} more
                </Badge>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex-1">
              <label className="text-sm font-medium text-amber-900">
                What currency are these products actually in?
              </label>
              <Select 
                value={selectedCurrency} 
                onValueChange={(value: Currency) => setSelectedCurrency(value)}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(SUPPORTED_CURRENCIES).map((currencyInfo) => (
                    <SelectItem key={currencyInfo.code} value={currencyInfo.code}>
                      <div className="flex items-center gap-2">
                        <span>{currencyInfo.flag}</span>
                        <span>{currencyInfo.code}</span>
                        <span className="text-slate-500">({currencyInfo.symbol})</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button 
              onClick={handleUpdateCurrencies}
              disabled={isUpdating}
              className="bg-amber-600 hover:bg-amber-700"
            >
              {isUpdating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Update {productsNeedingUpdate.length} Products
                </>
              )}
            </Button>
          </div>
        </div>

        <div className="text-xs text-amber-700 bg-amber-100 p-3 rounded">
          <strong>Important:</strong> This will only update the currency field. If your prices need to be changed 
          (e.g., from $10 to £8), you'll need to edit each product individually to set the correct price amounts.
        </div>
      </CardContent>
    </Card>
  )
}
