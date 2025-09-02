import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { db } from '@/lib/db'
import { webhooks, orders, orderItems, users } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { processOrderCompletion } from '@/lib/order-processing'

// Initialize Stripe with your secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-06-20',
})

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || ''

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')

  if (!signature) {
    console.error('No Stripe signature found')
    return NextResponse.json(
      { error: 'No signature found' },
      { status: 400 }
    )
  }

  let event: Stripe.Event

  try {
    // Verify webhook signature
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message)
    return NextResponse.json(
      { error: `Webhook signature verification failed: ${err.message}` },
      { status: 400 }
    )
  }

  // Log the webhook event
  console.log(`Received Stripe webhook: ${event.type}`)

  try {
    // Store webhook in database for tracking
    await db.insert(webhooks).values({
      provider: 'stripe',
      eventType: event.type,
      payload: event as any,
      status: 'pending',
      attempts: 1,
      lastAttemptAt: new Date(),
    })

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

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    // Update webhook status to processed
    await db
      .update(webhooks)
      .set({
        status: 'processed',
        processedAt: new Date(),
      })
      .where(eq(webhooks.payload, event as any))

    return NextResponse.json({ received: true })

  } catch (error: any) {
    console.error('Error processing webhook:', error)

    // Update webhook status to failed
    try {
      await db
        .update(webhooks)
        .set({
          status: 'failed',
          error: error.message,
          lastAttemptAt: new Date(),
        })
        .where(eq(webhooks.payload, event as any))
    } catch (dbError) {
      console.error('Error updating webhook status:', dbError)
    }

    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}

async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  console.log('Processing successful payment:', paymentIntent.id)

  try {
    // Extract order data from metadata
    const orderItemsData = JSON.parse(paymentIntent.metadata.orderItems || '[]')
    const customerEmail = paymentIntent.metadata.customerEmail
    const shippingAddress = JSON.parse(paymentIntent.metadata.shippingAddress || '{}')

    if (!orderItemsData.length) {
      throw new Error('No order items found in payment intent metadata')
    }

    // Find customer by email (assuming you have user lookup logic)
    // For now, we'll need to extract the user ID from the payment intent metadata
    // This should be added when creating the payment intent
    const userId = paymentIntent.metadata.userId
    if (!userId) {
      throw new Error('User ID not found in payment intent metadata')
    }

    // Group items by shop since each order belongs to one shop
    const itemsByShop = orderItemsData.reduce((groups: any, item: any) => {
      if (!groups[item.shopId]) {
        groups[item.shopId] = []
      }
      groups[item.shopId].push(item)
      return groups
    }, {})

    // Create separate orders for each shop
    const createdOrders = []
    for (const [shopId, shopItems] of Object.entries(itemsByShop)) {
      const items = shopItems as any[]
      const shopTotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
      
      const [order] = await db
        .insert(orders)
        .values({
          buyerId: userId,
          shopId: shopId,
          totalCents: Math.round(shopTotal * 100), // Convert to cents
          currency: paymentIntent.currency.toUpperCase(),
          status: 'confirmed',
          stripePaymentIntentId: paymentIntent.id,
          shippingAddress: shippingAddress,
        })
        .returning()

      // Create order items for this shop
      const orderItemsToInsert = items.map((item: any) => ({
        orderId: order.id,
        productId: item.productId,
        variantId: item.variantId || null,
        titleSnapshot: item.title,
        unitPriceCents: Math.round(item.price * 100), // Convert to cents
        qty: item.quantity,
        type: item.type,
      }))

      await db.insert(orderItems).values(orderItemsToInsert)
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
    // Check if order exists and update status
    const existingOrders = await db
      .select()
      .from(orders)
      .where(eq(orders.stripePaymentIntentId, paymentIntent.id))
      .limit(1)

    if (existingOrders.length > 0) {
      await db
        .update(orders)
        .set({
          status: 'payment_failed',
        })
        .where(eq(orders.stripePaymentIntentId, paymentIntent.id))

      console.log('Updated order status to payment_failed for:', paymentIntent.id)
    }

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
    // Check if order exists and update status
    const existingOrders = await db
      .select()
      .from(orders)
      .where(eq(orders.stripePaymentIntentId, paymentIntent.id))
      .limit(1)

    if (existingOrders.length > 0) {
      await db
        .update(orders)
        .set({
          status: 'canceled',
        })
        .where(eq(orders.stripePaymentIntentId, paymentIntent.id))

      console.log('Updated order status to canceled for:', paymentIntent.id)
    }

  } catch (error: any) {
    console.error('Error handling canceled payment:', error)
    throw error
  }
}

async function handlePaymentIntentRequiresAction(paymentIntent: Stripe.PaymentIntent) {
  console.log('Processing payment requiring action:', paymentIntent.id)

  try {
    // Check if order exists and update status
    const existingOrders = await db
      .select()
      .from(orders)
      .where(eq(orders.stripePaymentIntentId, paymentIntent.id))
      .limit(1)

    if (existingOrders.length > 0) {
      await db
        .update(orders)
        .set({
          status: 'pending_payment',
        })
        .where(eq(orders.stripePaymentIntentId, paymentIntent.id))

      console.log('Updated order status to requires_action for:', paymentIntent.id)
    }

    // TODO: Send email to customer about required action

  } catch (error: any) {
    console.error('Error handling payment requiring action:', error)
    throw error
  }
}
