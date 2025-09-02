import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

// Initialize Stripe with your secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-06-20',
})

export async function POST(request: NextRequest) {
  try {
    const { orderData, shippingData, currency, userId } = await request.json()

    // Calculate the total amount in cents (Stripe requires amounts in smallest currency unit)
    const amount = Math.round(orderData.total * 100)

    // Create a PaymentIntent with Stripe
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: currency.toLowerCase(),
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        // Store order information in metadata
        userId: userId || '',
        orderItems: JSON.stringify(orderData.items.map((item: any) => ({
          productId: item.productId,
          title: item.title,
          quantity: item.quantity,
          price: item.price,
          shopId: item.shopId,
          type: item.type,
          variantId: item.variantId || null
        }))),
        customerEmail: shippingData.shippingEmail,
        shippingAddress: JSON.stringify({
          name: `${shippingData.shippingFirstName} ${shippingData.shippingLastName}`,
          line1: shippingData.shippingAddress1,
          line2: shippingData.shippingAddress2 || '',
          city: shippingData.shippingCity,
          state: shippingData.shippingState,
          postal_code: shippingData.shippingPostalCode,
          country: shippingData.shippingCountry,
        }),
      },
    })

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    })
  } catch (error: any) {
    console.error('Error creating payment intent:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

