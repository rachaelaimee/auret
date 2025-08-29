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
import { convertAndFormatPrice } from '@/lib/currency'
import { 
  ShoppingBag, 
  CreditCard, 
  Truck, 
  Mail, 
  AlertCircle,
  ArrowLeft,
  Lock
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

export function CheckoutPage() {
  const { items, totalItems, clearCart } = useCart()
  const { currency } = useCurrency()
  const { user } = useAuth()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)

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

  // Redirect if cart is empty
  if (mounted && items.length === 0) {
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      <Navigation user={user} />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
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

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Order Summary - Left Side */}
            <div className="lg:col-span-2 space-y-6">
              {ordersByCurrency.map((order, orderIndex) => (
                <Card key={order.currency}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <ShoppingBag className="h-5 w-5" />
                      Order {orderIndex + 1} - {order.currency} ({order.itemCount} items)
                    </CardTitle>
                    <CardDescription>
                      Items from {Object.keys(order.shops).length} shop{Object.keys(order.shops).length !== 1 ? 's' : ''}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {order.items.map((item) => (
                        <div key={item.id} className="flex gap-4 p-4 bg-slate-50 rounded-lg">
                          {/* Product Image */}
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

                          {/* Product Info */}
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

                          {/* Price */}
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
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Payment Summary - Right Side */}
            <div className="space-y-6">
              {/* Order Totals */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Order Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {ordersByCurrency.map((order, index) => (
                    <div key={order.currency}>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-slate-600">
                          Subtotal ({order.currency}):
                        </span>
                        <span className="font-medium">
                          {convertAndFormatPrice(order.subtotal, currency)}
                        </span>
                      </div>
                      
                      {/* Shipping placeholder */}
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-slate-600">Shipping:</span>
                        <span className="text-sm text-slate-500">Calculated at next step</span>
                      </div>
                      
                      {index < ordersByCurrency.length - 1 && (
                        <Separator className="my-2" />
                      )}
                    </div>
                  ))}
                  
                  <Separator />
                  
                  <div className="flex justify-between items-center text-lg font-semibold">
                    <span>Total:</span>
                    <span>
                      {ordersByCurrency.length === 1 
                        ? convertAndFormatPrice(ordersByCurrency[0].subtotal, currency)
                        : 'Multiple currencies'
                      }
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Shipping Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Truck className="h-5 w-5" />
                    Shipping & Billing
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-slate-600 mb-4">
                    Complete your shipping and payment information to continue.
                  </p>
                  <Button size="lg" className="w-full" disabled>
                    <Lock className="h-4 w-4 mr-2" />
                    Continue to Payment
                  </Button>
                  <p className="text-xs text-slate-500 mt-2 text-center">
                    Secure checkout powered by Stripe
                  </p>
                </CardContent>
              </Card>

              {/* Security Notice */}
              <div className="text-xs text-slate-500 text-center">
                <Lock className="h-3 w-3 inline mr-1" />
                Your payment information is encrypted and secure
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
