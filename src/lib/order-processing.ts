import { db } from '@/lib/db'
import { downloads, orderItems, orders } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import crypto from 'crypto'

/**
 * Create download tokens for digital products in an order
 */
export async function createDigitalDownloads(orderId: string, buyerId: string) {
  try {
    // Get all digital items in this order
    const digitalItems = await db
      .select({
        orderItemId: orderItems.id,
        productId: orderItems.productId,
        type: orderItems.type,
      })
      .from(orderItems)
      .where(
        and(
          eq(orderItems.orderId, orderId),
          eq(orderItems.type, 'digital')
        )
      )

    if (digitalItems.length === 0) {
      console.log('No digital items found for order:', orderId)
      return
    }

    // Create download tokens for each digital item
    const downloadTokens = []
    for (const item of digitalItems) {
      const token = crypto.randomBytes(32).toString('hex')
      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + 30) // 30 days expiry

      const [download] = await db
        .insert(downloads)
        .values({
          orderItemId: item.orderItemId,
          buyerId: buyerId,
          token: token,
          expiresAt: expiresAt,
          maxAttempts: 5,
          attempts: 0,
        })
        .returning()

      downloadTokens.push({
        orderItemId: item.orderItemId,
        productId: item.productId,
        token: token,
        downloadUrl: `/api/download/${token}`,
        expiresAt: expiresAt,
      })
    }

    console.log(`Created ${downloadTokens.length} download tokens for order ${orderId}`)
    return downloadTokens

  } catch (error: any) {
    console.error('Error creating digital downloads:', error)
    throw error
  }
}

/**
 * Send order confirmation email (placeholder)
 */
export async function sendOrderConfirmationEmail(orderId: string, customerEmail: string) {
  try {
    // TODO: Implement email sending with Resend
    console.log(`TODO: Send order confirmation email to ${customerEmail} for order ${orderId}`)
    
    // This would integrate with your email service (Resend)
    // const emailData = {
    //   to: customerEmail,
    //   subject: 'Order Confirmation',
    //   template: 'order-confirmation',
    //   data: { orderId, ... }
    // }
    // await sendEmail(emailData)

  } catch (error: any) {
    console.error('Error sending order confirmation email:', error)
    // Don't throw - email failures shouldn't break order processing
  }
}

/**
 * Notify sellers about new orders (placeholder)
 */
export async function notifySellersOfNewOrder(orderId: string) {
  try {
    // TODO: Implement seller notifications
    console.log(`TODO: Notify sellers about new order ${orderId}`)
    
    // This could:
    // 1. Send email notifications to shop owners
    // 2. Create in-app notifications
    // 3. Send webhook to seller systems
    // 4. Update dashboard counters

  } catch (error: any) {
    console.error('Error notifying sellers:', error)
    // Don't throw - notification failures shouldn't break order processing
  }
}

/**
 * Process order completion tasks
 */
export async function processOrderCompletion(orderId: string, buyerId: string, customerEmail: string) {
  try {
    // Create digital downloads
    const downloadTokens = await createDigitalDownloads(orderId, buyerId)
    
    // Send confirmation email
    await sendOrderConfirmationEmail(orderId, customerEmail)
    
    // Notify sellers
    await notifySellersOfNewOrder(orderId)
    
    return {
      success: true,
      downloadTokens,
    }

  } catch (error: any) {
    console.error('Error processing order completion:', error)
    throw error
  }
}

