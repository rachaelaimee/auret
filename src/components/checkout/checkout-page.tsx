'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useCart } from '@/components/cart/cart-provider'
import { useCurrency } from '@/components/currency/currency-provider'
import { useAuth } from '@/components/auth/auth-provider'
import { Navigation } from '@/components/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ShippingForm, ShippingFormData } from './shipping-form'
import { PaymentForm } from './payment-form'
import { convertAndFormatPrice } from '@/lib/currency'
import { ShippingCalculator } from '@/lib/shipping'
import { getShopById } from '@/lib/firestore'
import { 
  ShoppingBag, 
  CreditCard, 
  Truck, 
  Mail, 
  AlertCircle,
  ArrowLeft,
  Lock,
  CheckCircle
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

type CheckoutStep = 'review' | 'shipping' | 'payment' | 'success'

export function CheckoutPage() {
  const { items, totalItems, clearCart } = useCart()
  const { currency } = useCurrency()
  const { user } = useAuth()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [currentStep, setCurrentStep] = useState<CheckoutStep>('review')
  const [shippingData, setShippingData] = useState<ShippingFormData | null>(null)
  const [orderConfirmation, setOrderConfirmation] = useState<string | null>(null)
  const [shippingCalculations, setShippingCalculations] = useState<any[]>([])
  const [isCalculatingShipping, setIsCalculatingShipping] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Group items by currency for separate checkout
  const itemsByCurrency = items.reduce((groups, item) => {
    const curr = item.currency
    if (!groups[curr]) groups[curr] = []
    groups[curr].push(item)
    return groups
  }, {} as Record<string, typeof items>)

  // Calculate totals by currency
  const ordersByCurrency = Object.entries(itemsByCurrency).map(([curr, currencyItems]) => ({
    currency: curr,
    items: currencyItems,
    subtotal: currencyItems.reduce((sum, item) => sum + (item.price * item.quantity), 0),
    itemCount: currencyItems.reduce((sum, item) => sum + item.quantity, 0),
    // Group by shop for shipping calculation
    shops: currencyItems.reduce((shops, item) => {
      if (!shops[item.shopId]) {
        shops[item.shopId] = {
          id: item.shopId,
          name: item.shopName,
          handle: item.shopHandle,
          items: []
        }
      }
      shops[item.shopId].items.push(item)
      return shops
    }, {} as Record<string, any>)
  }))

  // Calculate shipping when shipping data is available
  const calculateShipping = async (shippingFormData: ShippingFormData) => {
    if (!currentOrder) return []

    setIsCalculatingShipping(true)
    try {
      // Get shop information for shipping calculation
      const shopPromises = Object.keys(currentOrder.shops).map(shopId => getShopById(shopId))
      const shops = await Promise.all(shopPromises)
      const shopsMap = shops.reduce((acc, shop) => {
        if (shop) acc[shop.id] = shop
        return acc
      }, {} as Record<string, any>)

      // Group items by shop for shipping calculation
      const itemsByShop = currentOrder.items.reduce((acc, item) => {
        if (!acc[item.shopId]) acc[item.shopId] = []
        acc[item.shopId].push({
          id: item.id,
          productId: item.productId,
          price: item.price / 100, // Convert from cents to currency units
          quantity: item.quantity,
          type: item.type
        })
        return acc
      }, {} as Record<string, any>)

      // Calculate shipping costs
      const shippingAddress = {
        country: shippingFormData.shippingCountry,
        state: shippingFormData.shippingState,
        city: shippingFormData.shippingCity,
        postal_code: shippingFormData.shippingPostalCode
      }

      const calculations = ShippingCalculator.calculateShipping(
        itemsByShop,
        shopsMap,
        shippingAddress,
        currentOrder.currency
      )

      console.log('🚚 === SHIPPING CALCULATION DEBUG ===')
      console.log('Items by shop:', itemsByShop)
      console.log('Shops map:', shopsMap)
      console.log('Shipping address:', shippingAddress)
      console.log('Currency:', currentOrder.currency)
      console.log('Shipping calculations:', calculations)

      setShippingCalculations(calculations)
      return calculations
    } catch (error) {
      console.error('Error calculating shipping:', error)
      return []
    } finally {
      setIsCalculatingShipping(false)
    }
  }

  // Step handlers
  const handleShippingSubmit = async (data: ShippingFormData) => {
    setShippingData(data)
    await calculateShipping(data)
    setCurrentStep('payment')
  }

  const handlePaymentSuccess = (paymentIntentId: string) => {
    console.log('=== CHECKOUT SUCCESS ===')
    console.log('Payment Intent ID received:', paymentIntentId)
    console.log('Setting order confirmation and moving to success step')
    
    setOrderConfirmation(paymentIntentId)
    setCurrentStep('success')
    clearCart() // Clear cart after successful payment
    
    console.log('✅ Checkout success flow completed')
  }

  const handlePaymentError = (error: string) => {
    console.error('Payment error:', error)
    // Stay on payment step to retry
  }

  // Get current order data (for now, just use the first currency)
  const currentOrder = ordersByCurrency[0]

  // Debug: Log cart items to see shop data
  useEffect(() => {
    if (mounted && items.length > 0) {
      console.log('=== CART DEBUG ===')
      console.log('Cart items:', JSON.stringify(items, null, 2))
      console.log('Current order:', JSON.stringify(currentOrder, null, 2))
      console.log('=================')
    }
  }, [mounted, items, currentOrder])

  // Redirect if cart is empty (but not if we're showing success page)
  if (mounted && items.length === 0 && currentStep !== 'success') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
        <Navigation user={user} />
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-md mx-auto text-center">
            <ShoppingBag className="h-16 w-16 text-slate-400 mx-auto mb-6" />
            <h1 className="text-2xl font-bold text-slate-900 mb-4">Your cart is empty</h1>
            <p className="text-slate-600 mb-8">Add some amazing products to get started!</p>
            <Link href="/browse">
              <Button size="lg">
                Continue Shopping
              </Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // Require authentication
  if (mounted && !user) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
        <Navigation user={user} />
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-md mx-auto text-center">
            <Lock className="h-16 w-16 text-slate-400 mx-auto mb-6" />
            <h1 className="text-2xl font-bold text-slate-900 mb-4">Sign in to checkout</h1>
            <p className="text-slate-600 mb-8">You need to be signed in to complete your purchase</p>
            <div className="space-y-4">
              <Link href="/auth/signin?redirect=/checkout">
                <Button size="lg" className="w-full">
                  Sign In
                </Button>
              </Link>
              <Link href="/auth/signup?redirect=/checkout">
                <Button variant="outline" size="lg" className="w-full">
                  Create Account
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!mounted) {
    return null // Prevent hydration mismatch
  }

  // Step indicator
  const steps = [
    { key: 'review', label: 'Review', icon: ShoppingBag },
    { key: 'shipping', label: 'Shipping', icon: Truck },
    { key: 'payment', label: 'Payment', icon: CreditCard },
    { key: 'success', label: 'Complete', icon: CheckCircle }
  ]

  const currentStepIndex = steps.findIndex(step => step.key === currentStep)

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      <Navigation user={user} />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <Link href="/browse">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Continue Shopping
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Checkout</h1>
              <p className="text-slate-600">{totalItems} items in your cart</p>
            </div>
          </div>

          {/* Step Indicator */}
          <div className="mb-8">
            <div className="flex items-center justify-center">
              {steps.map((step, index) => {
                const StepIcon = step.icon
                const isActive = index === currentStepIndex
                const isCompleted = index < currentStepIndex
                
                return (
                  <div key={step.key} className="flex items-center">
                    <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                      isActive 
                        ? 'bg-blue-600 border-blue-600 text-white' 
                        : isCompleted
                          ? 'bg-green-600 border-green-600 text-white'
                          : 'border-slate-300 text-slate-400'
                    }`}>
                      <StepIcon className="h-5 w-5" />
                    </div>
                    <span className={`ml-2 text-sm font-medium ${
                      isActive ? 'text-blue-600' : isCompleted ? 'text-green-600' : 'text-slate-400'
                    }`}>
                      {step.label}
                    </span>
                    {index < steps.length - 1 && (
                      <div className={`w-16 h-0.5 mx-4 ${
                        isCompleted ? 'bg-green-600' : 'bg-slate-300'
                      }`} />
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Multi-currency notice */}
          {ordersByCurrency.length > 1 && (
            <Alert className="mb-8">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Your cart contains items in multiple currencies ({ordersByCurrency.map(o => o.currency).join(', ')}). 
                These will be processed as separate orders.
              </AlertDescription>
            </Alert>
          )}

          {/* Step Content */}
          {currentStep === 'review' && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Review Your Order</CardTitle>
                  <CardDescription>
                    Make sure everything looks correct before proceeding
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {items.map((item) => (
                      <div key={item.id} className="flex gap-4 p-4 bg-slate-50 rounded-lg">
                        <div className="relative w-16 h-16 rounded-md overflow-hidden bg-slate-200 flex-shrink-0">
                          {item.image ? (
                            <Image
                              src={item.image}
                              alt={item.title}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <ShoppingBag className="h-6 w-6 text-slate-400" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-slate-900">{item.title}</h4>
                          <p className="text-sm text-slate-500">by {item.shopName}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant={item.type === 'digital' ? 'default' : 'secondary'} className="text-xs">
                              {item.type === 'digital' ? 'Digital' : 'Physical'}
                            </Badge>
                            <span className="text-sm">Qty: {item.quantity}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">
                            {convertAndFormatPrice(item.price * item.quantity, currency)}
                          </div>
                          <div className="text-sm text-slate-500">
                            {convertAndFormatPrice(item.price, currency)} each
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-6 pt-4 border-t">
                    <div className="flex justify-between text-lg font-semibold">
                      <span>Total:</span>
                      <span>{convertAndFormatPrice(currentOrder?.subtotal || 0, currency)}</span>
                    </div>
                  </div>
                  <Button 
                    size="lg" 
                    className="w-full mt-6"
                    onClick={() => setCurrentStep('shipping')}
                  >
                    Continue to Shipping
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}

          {currentStep === 'shipping' && (
            <ShippingForm 
              onSubmit={handleShippingSubmit}
              defaultValues={shippingData || undefined}
            />
          )}

          {currentStep === 'payment' && currentOrder && shippingData && (
            <PaymentForm
              orderData={{
                items: currentOrder.items,
                subtotal: currentOrder.subtotal,
                shipping: shippingCalculations.reduce((sum, calc) => sum + (calc.shippingCost || 0), 0),
                currency: currentOrder.currency,
                total: currentOrder.subtotal + shippingCalculations.reduce((sum, calc) => sum + (calc.shippingCost || 0), 0),
              }}
              shippingData={shippingData}
              onPaymentSuccess={handlePaymentSuccess}
              onPaymentError={handlePaymentError}
            />
          )}

          {currentStep === 'success' && (
            <Card>
              <CardContent className="text-center py-12">
                {console.log('🎯 SUCCESS PAGE RENDERING - Current Step:', currentStep, 'Order Confirmation:', orderConfirmation)}
                <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-6" />
                <h2 className="text-2xl font-bold text-slate-900 mb-4">Order Confirmed!</h2>
                <p className="text-slate-600 mb-6">
                  Thank you for your purchase. Your order has been successfully processed.
                </p>
                {orderConfirmation && (
                  <p className="text-sm text-slate-500 mb-6">
                    Order ID: {orderConfirmation}
                  </p>
                )}
                <div className="space-y-4">
                  <Button size="lg" onClick={() => router.push('/browse')}>
                    Continue Shopping
                  </Button>
                  <Button variant="outline" onClick={() => router.push('/orders')}>
                    View Your Orders
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
