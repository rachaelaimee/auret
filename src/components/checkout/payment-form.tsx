'use client'

import { useState } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { convertAndFormatPrice } from '@/lib/currency'
import { useCurrency } from '@/components/currency/currency-provider'
import { useAuth } from '@/components/auth/auth-provider'
import { CreditCard, Lock, Loader2, AlertCircle } from 'lucide-react'
import type { ShippingFormData } from './shipping-form'

// Initialize Stripe (you'll need to add your publishable key)
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '')

interface PaymentFormProps {
  orderData: {
    items: Array<{
      id: string
      productId: string
      title: string
      price: number
      currency: string
      quantity: number
      shopId: string
      shopName: string
      type: 'digital' | 'physical'
    }>
    subtotal: number
    currency: string
    shipping?: number
    tax?: number
    total: number
  }
  shippingData: ShippingFormData
  onPaymentSuccess: (paymentIntentId: string) => void
  onPaymentError: (error: string) => void
}

// Card Element styles
const cardElementOptions = {
  style: {
    base: {
      fontSize: '16px',
      color: '#424770',
      '::placeholder': {
        color: '#aab7c4',
      },
      fontFamily: 'system-ui, -apple-system, sans-serif',
    },
    invalid: {
      color: '#9e2146',
    },
  },
  hidePostalCode: true, // We collect this in shipping form
}

// Payment form component that uses Stripe hooks
function PaymentFormContent({ 
  orderData, 
  shippingData, 
  onPaymentSuccess, 
  onPaymentError 
}: PaymentFormProps) {
  const { currency: displayCurrency } = useCurrency()
  const { user } = useAuth()
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const stripe = useStripe()
  const elements = useElements()

  const handlePayment = async () => {
    if (!stripe || !elements) {
      setError('Stripe has not loaded yet. Please try again.')
      return
    }

    const cardElement = elements.getElement(CardElement)
    if (!cardElement) {
      setError('Card element not found. Please refresh and try again.')
      return
    }

    setIsProcessing(true)
    setError(null)

    try {
      // Create payment intent on the server
      const response = await fetch('/api/create-payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderData,
          shippingData,
          currency: orderData.currency,
          userId: user?.uid
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to create payment intent')
      }

      const { clientSecret, paymentIntentId } = await response.json()

      // Confirm payment with Stripe
      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
          billing_details: {
            name: `${shippingData.billingFirstName || shippingData.shippingFirstName} ${shippingData.billingLastName || shippingData.shippingLastName}`,
            email: shippingData.shippingEmail,
            address: {
              line1: shippingData.billingAddress1 || shippingData.shippingAddress1,
              line2: shippingData.billingAddress2 || shippingData.shippingAddress2,
              city: shippingData.billingCity || shippingData.shippingCity,
              state: shippingData.billingState || shippingData.shippingState,
              postal_code: shippingData.billingPostalCode || shippingData.shippingPostalCode,
              country: shippingData.billingCountry || shippingData.shippingCountry,
            }
          }
        }
      })

      if (stripeError) {
        throw new Error(stripeError.message || 'Payment failed')
      }

      if (paymentIntent?.status === 'succeeded') {
        onPaymentSuccess(paymentIntentId)
      } else {
        throw new Error('Payment was not successful')
      }

    } catch (err: any) {
      console.error('Payment error:', err)
      setError(err.message || 'Payment failed. Please try again.')
      onPaymentError(err.message || 'Payment failed')
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Order Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Order Summary</CardTitle>
          <CardDescription>
            Review your order before payment
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Items */}
          <div className="space-y-2">
            {orderData.items.map((item) => (
              <div key={item.id} className="flex justify-between items-center">
                <div className="flex-1">
                  <span className="font-medium">{item.title}</span>
                  <Badge variant="outline" className="ml-2 text-xs">
                    {item.type}
                  </Badge>
                  <div className="text-sm text-slate-500">
                    Qty: {item.quantity} × {convertAndFormatPrice(item.price, displayCurrency)}
                  </div>
                </div>
                <span className="font-medium">
                  {convertAndFormatPrice(item.price * item.quantity, displayCurrency)}
                </span>
              </div>
            ))}
          </div>

          <div className="border-t pt-4 space-y-2">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>{convertAndFormatPrice(orderData.subtotal, displayCurrency)}</span>
            </div>
            
            {orderData.shipping && (
              <div className="flex justify-between">
                <span>Shipping:</span>
                <span>{convertAndFormatPrice(orderData.shipping, displayCurrency)}</span>
              </div>
            )}
            
            {orderData.tax && (
              <div className="flex justify-between">
                <span>Tax:</span>
                <span>{convertAndFormatPrice(orderData.tax, displayCurrency)}</span>
              </div>
            )}
            
            <div className="flex justify-between text-lg font-semibold border-t pt-2">
              <span>Total:</span>
              <span>{convertAndFormatPrice(orderData.total, displayCurrency)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment Method */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Payment Method
          </CardTitle>
          <CardDescription>
            Secure payment processing by Stripe
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Card Input */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Card Details
              </label>
              <div className="border border-slate-300 rounded-md p-3 bg-white">
                <CardElement options={cardElementOptions} />
              </div>
            </div>
          </div>

          {/* Shipping Address Summary */}
          <div className="bg-slate-50 p-4 rounded-lg">
            <h4 className="font-medium mb-2">Shipping to:</h4>
            <div className="text-sm text-slate-600">
              <p>{shippingData.shippingFirstName} {shippingData.shippingLastName}</p>
              <p>{shippingData.shippingAddress1}</p>
              {shippingData.shippingAddress2 && <p>{shippingData.shippingAddress2}</p>}
              <p>{shippingData.shippingCity}, {shippingData.shippingState} {shippingData.shippingPostalCode}</p>
              <p>{shippingData.shippingCountry}</p>
            </div>
          </div>

          {/* Payment Button */}
          <Button
            size="lg"
            className="w-full"
            onClick={handlePayment}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Processing Payment...
              </>
            ) : (
              <>
                <Lock className="h-5 w-5 mr-2" />
                Pay {convertAndFormatPrice(orderData.total, displayCurrency)}
              </>
            )}
          </Button>

          <div className="text-xs text-slate-500 text-center space-y-1">
            <div className="flex items-center justify-center gap-1">
              <Lock className="h-3 w-3" />
              Secured by 256-bit SSL encryption
            </div>
            <div>Powered by Stripe</div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Main PaymentForm component with Elements provider
export function PaymentForm(props: PaymentFormProps) {
  return (
    <Elements stripe={stripePromise} options={{
      appearance: {
        theme: 'stripe',
        variables: {
          colorPrimary: '#0f172a', // slate-900
        },
      },
    }}>
      <PaymentFormContent {...props} />
    </Elements>
  )
}

