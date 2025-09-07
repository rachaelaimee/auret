import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createOrderAdmin } from '@/lib/firestore-admin'
import { processOrderCompletion } from '@/lib/order-processing'

// Initialize Stripe with your secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16',
})

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || ''

export async function POST(request: NextRequest) {
  console.log('🔔 === STRIPE WEBHOOK CALLED ===')
  console.log('Request method:', request.method)
  console.log('Request URL:', request.url)
  
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')
  
  console.log('Body length:', body.length)
  console.log('Signature present:', !!signature)
  console.log('Webhook secret configured:', !!webhookSecret)

  if (!signature) {
    console.error('❌ No Stripe signature found')
    return NextResponse.json(
      { error: 'No signature found' },
      { status: 400 }
    )
  }

  let event: Stripe.Event

  try {
    // Verify webhook signature
    console.log('🔐 Verifying webhook signature...')
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    console.log('✅ Webhook signature verified')
    console.log('Event type:', event.type)
    console.log('Event ID:', event.id)
  } catch (err: any) {
    console.error('❌ Webhook signature verification failed:', err.message)
    return NextResponse.json(
      { error: `Webhook signature verification failed: ${err.message}` },
      { status: 400 }
    )
  }

  // Log the webhook event
  console.log(`🔔 Received Stripe webhook: ${event.type}`)

  try {
    // Log the webhook event (removed database tracking for now)
    console.log(`Processing Stripe webhook: ${event.type}`)

    // Handle the event
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent)
        break

      case 'payment_intent.payment_failed':
        await handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent)
        break

      case 'payment_intent.canceled':
        await handlePaymentIntentCanceled(event.data.object as Stripe.PaymentIntent)
        break

      case 'payment_intent.requires_action':
        await handlePaymentIntentRequiresAction(event.data.object as Stripe.PaymentIntent)
        break

      case 'payment_intent.created':
        // Just log for now - don't create orders on creation, wait for success
        console.log('Payment intent created:', event.data.object.id)
        break

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })

  } catch (error: any) {
    console.error('Error processing webhook:', error)

    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}

async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  console.log('💰 === PROCESSING SUCCESSFUL PAYMENT ===')
  console.log('Payment Intent ID:', paymentIntent.id)
  console.log('Amount:', paymentIntent.amount)
  console.log('Currency:', paymentIntent.currency)
  
  console.log('📋 Payment Intent Metadata:', JSON.stringify(paymentIntent.metadata, null, 2))

  try {
    // Extract order data from metadata
    const orderItemsData = JSON.parse(paymentIntent.metadata.orderItems || '[]')
    const customerEmail = paymentIntent.metadata.customerEmail
    const shippingAddress = JSON.parse(paymentIntent.metadata.shippingAddress || '{}')
    
    console.log('📦 Order Items Data:', orderItemsData)
    console.log('📧 Customer Email:', customerEmail)
    console.log('🏠 Shipping Address:', shippingAddress)

    if (!orderItemsData.length) {
      console.error('❌ No order items found in payment intent metadata')
      throw new Error('No order items found in payment intent metadata')
    }

    // Find customer by email (assuming you have user lookup logic)
    // For now, we'll need to extract the user ID from the payment intent metadata
    // This should be added when creating the payment intent
    const userId = paymentIntent.metadata.userId
    console.log('👤 User ID from metadata:', userId)
    
    if (!userId) {
      console.error('❌ User ID not found in payment intent metadata')
      throw new Error('User ID not found in payment intent metadata')
    }

    // Group items by shop since each order belongs to one shop
    const itemsByShop = orderItemsData.reduce((groups: any, item: any) => {
      const shopId = item.shopId || 'default-shop'
      if (!groups[shopId]) {
        groups[shopId] = []
      }
      groups[shopId].push(item)
      return groups
    }, {})

    // Create separate orders for each shop
    const createdOrders = []
    for (const [shopId, shopItems] of Object.entries(itemsByShop)) {
      const items = shopItems as any[]
      const shopTotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
      
      // Create order in Firestore using Admin SDK
      const order = await createOrderAdmin({
        buyerId: userId,
        totalCents: Math.round(shopTotal * 100), // Convert to cents
        currency: paymentIntent.currency.toUpperCase(),
        status: 'paid',
        stripePaymentIntentId: paymentIntent.id,
        shippingAddress: shippingAddress,
        items: items.map((item: any) => ({
          id: `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          productId: item.productId,
          title: item.title,
          type: item.type,
          quantity: item.quantity,
          unitPriceCents: Math.round(item.price * 100), // Convert to cents
          shopId: item.shopId,
          shopName: item.shopName || 'Unknown Shop',
          shopHandle: item.shopHandle || '',
          variantId: item.variantId || undefined,
        }))
      })

      createdOrders.push(order)
    }

    console.log('Orders created successfully:', createdOrders.map(o => o.id).join(', '))

    // Process order completion tasks for each order
    for (const order of createdOrders) {
      try {
        await processOrderCompletion(order.id, userId, customerEmail)
      } catch (error: any) {
        console.error(`Error processing completion for order ${order.id}:`, error)
        // Continue with other orders even if one fails
      }
    }

  } catch (error: any) {
    console.error('Error creating order from successful payment:', error)
    throw error
  }
}

async function handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent) {
  console.log('Processing failed payment:', paymentIntent.id)

  try {
    // For now, just log the failure
    // In a complete implementation, you'd query Firestore for orders with this payment intent ID
    // and update their status to 'failed'
    console.log('Payment failed for payment intent:', paymentIntent.id)

    // TODO: Query Firestore for orders with this stripe payment intent ID
    // TODO: Update order status to 'failed' 
    // TODO: Send payment failure notification email
    // TODO: Log failure reason for analytics

  } catch (error: any) {
    console.error('Error handling failed payment:', error)
    throw error
  }
}

async function handlePaymentIntentCanceled(paymentIntent: Stripe.PaymentIntent) {
  console.log('Processing canceled payment:', paymentIntent.id)

  try {
    // For now, just log the cancellation
    console.log('Payment canceled for payment intent:', paymentIntent.id)

    // TODO: Query Firestore for orders with this stripe payment intent ID
    // TODO: Update order status to 'canceled'

  } catch (error: any) {
    console.error('Error handling canceled payment:', error)
    throw error
  }
}

async function handlePaymentIntentRequiresAction(paymentIntent: Stripe.PaymentIntent) {
  console.log('Processing payment requiring action:', paymentIntent.id)

  try {
    // For now, just log the action required
    console.log('Payment requires action for payment intent:', paymentIntent.id)

    // TODO: Query Firestore for orders with this stripe payment intent ID
    // TODO: Update order status to 'pending'
    // TODO: Send email to customer about required action

  } catch (error: any) {
    console.error('Error handling payment requiring action:', error)
    throw error
  }
}
