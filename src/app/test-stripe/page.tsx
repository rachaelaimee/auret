'use client'

import { useState } from 'react'
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { loadStripe } from '@stripe/stripe-js'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CheckCircle, AlertCircle, CreditCard } from 'lucide-react'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '')

function StripeTestForm() {
  const [isProcessing, setIsProcessing] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const stripe = useStripe()
  const elements = useElements()

  const handleTestPayment = async () => {
    if (!stripe || !elements) {
      setError('Stripe has not loaded yet')
      return
    }

    const cardElement = elements.getElement(CardElement)
    if (!cardElement) {
      setError('Card element not found')
      return
    }

    setIsProcessing(true)
    setError(null)
    setSuccess(false)

    try {
      // Create a test payment intent
      const response = await fetch('/api/create-payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderData: {
            items: [{
              id: 'test-item',
              productId: 'test-product',
              title: 'Test Product',
              price: 10.00,
              currency: 'GBP',
              quantity: 1,
              shopId: 'test-shop',
              shopName: 'Test Shop',
              type: 'digital'
            }],
            subtotal: 10.00,
            currency: 'GBP',
            total: 10.00
          },
          shippingData: {
            shippingFirstName: 'Test',
            shippingLastName: 'User',
            shippingEmail: 'ivytenebrae1@gmail.com',
            shippingPhone: '07123456789',
            shippingAddress1: '123 Test Street',
            shippingCity: 'London',
            shippingState: 'England',
            shippingPostalCode: 'SW1A 1AA',
            shippingCountry: 'GB',
            billingIsSame: true
          },
          currency: 'GBP',
          userId: 'test-user-id'
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to create payment intent')
      }

      const { clientSecret } = await response.json()

      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
          billing_details: {
            name: 'Test User',
            email: 'ivytenebrae1@gmail.com',
          }
        }
      })

      if (stripeError) {
        throw new Error(stripeError.message || 'Payment failed')
      }

      if (paymentIntent?.status === 'succeeded') {
        setSuccess(true)
      } else {
        throw new Error('Payment was not successful')
      }

    } catch (err: any) {
      console.error('Payment error:', err)
      setError(err.message || 'Payment failed')
    } finally {
      setIsProcessing(false)
    }
  }

  if (success) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Stripe Test Successful!</h2>
          <p className="text-slate-600">Your Stripe integration is working correctly.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Test Stripe Integration
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Use test card: <strong>4242 4242 4242 4242</strong> with any future date and any 3-digit CVC.
          </AlertDescription>
        </Alert>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Test Card Details
          </label>
          <div className="border border-slate-300 rounded-md p-3 bg-white">
            <CardElement options={{
              style: {
                base: {
                  fontSize: '16px',
                  color: '#424770',
                  '::placeholder': {
                    color: '#aab7c4',
                  },
                },
              },
            }} />
          </div>
        </div>

        <Button
          onClick={handleTestPayment}
          disabled={!stripe || isProcessing}
          className="w-full"
        >
          {isProcessing ? 'Processing...' : 'Test Payment (£10.00)'}
        </Button>
      </CardContent>
    </Card>
  )
}

export default function StripeTestPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-md mx-auto">
          <h1 className="text-3xl font-bold text-center text-slate-900 mb-8">
            Stripe Integration Test
          </h1>
          
          <Elements stripe={stripePromise}>
            <StripeTestForm />
          </Elements>
        </div>
      </div>
    </div>
  )
}

