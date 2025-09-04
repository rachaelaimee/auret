import { db } from '@/lib/db'
import { downloads, orderItems, orders } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import crypto from 'crypto'
import { emailService } from './email'
import { getUserProfile } from './firestore'

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
 * Send order confirmation email
 */
export async function sendOrderConfirmationEmail(orderId: string, customerEmail: string) {
  try {
    // Get the full order details
    const [order] = await db
      .select()
      .from(orders)
      .where(eq(orders.id, orderId))

    if (!order) {
      throw new Error(`Order ${orderId} not found`)
    }

    // Get order items
    const items = await db
      .select({
        id: orderItems.id,
        title: orderItems.title,
        quantity: orderItems.quantity,
        unitPriceCents: orderItems.unitPriceCents,
        type: orderItems.type,
      })
      .from(orderItems)
      .where(eq(orderItems.orderId, orderId))

    // Get download URLs for digital items
    const itemsWithDownloads = await Promise.all(
      items.map(async (item) => {
        if (item.type === 'digital') {
          const [download] = await db
            .select({ token: downloads.token })
            .from(downloads)
            .where(eq(downloads.orderItemId, item.id))
          
          return {
            ...item,
            downloadUrl: download ? `https://auret.shop/api/download/${download.token}` : undefined
          }
        }
        return item
      })
    )

    // Get customer name from user profile if available
    let customerName: string | undefined
    try {
      if (order.buyerId) {
        const profile = await getUserProfile(order.buyerId)
        customerName = profile?.name
      }
    } catch (error) {
      console.log('Could not fetch customer profile for name')
    }

    const orderData = {
      id: order.id,
      totalCents: order.totalCents,
      currency: order.currency,
      status: order.status,
      createdAt: order.createdAt,
      customerEmail,
      customerName,
      items: itemsWithDownloads,
      shippingAddress: order.shippingAddress ? JSON.parse(order.shippingAddress) : undefined,
    }

    await emailService.sendOrderConfirmation(orderData)
    console.log(`Order confirmation email sent to ${customerEmail} for order ${orderId}`)

  } catch (error: any) {
    console.error('Error sending order confirmation email:', error)
    // Don't throw - email failures shouldn't break order processing
  }
}

/**
 * Notify sellers about new orders
 */
export async function notifySellersOfNewOrder(orderId: string) {
  try {
    // Get the full order details
    const [order] = await db
      .select()
      .from(orders)
      .where(eq(orders.id, orderId))

    if (!order) {
      throw new Error(`Order ${orderId} not found`)
    }

    // Get order items to find which shops are involved
    const items = await db
      .select({
        id: orderItems.id,
        title: orderItems.title,
        quantity: orderItems.quantity,
        unitPriceCents: orderItems.unitPriceCents,
        type: orderItems.type,
        shopId: orderItems.shopId,
      })
      .from(orderItems)
      .where(eq(orderItems.orderId, orderId))

    // Group items by shop
    const itemsByShop = items.reduce((acc, item) => {
      if (!acc[item.shopId]) {
        acc[item.shopId] = []
      }
      acc[item.shopId].push(item)
      return acc
    }, {} as Record<string, typeof items>)

    // Get customer name from user profile if available
    let customerName: string | undefined
    try {
      if (order.buyerId) {
        const profile = await getUserProfile(order.buyerId)
        customerName = profile?.name
      }
    } catch (error) {
      console.log('Could not fetch customer profile for name')
    }

    // Send notification to each shop owner
    for (const [shopId, shopItems] of Object.entries(itemsByShop)) {
      try {
        // Get shop details from Firestore
        const { getShopById } = await import('./firestore')
        const shop = await getShopById(shopId)
        
        if (!shop || !shop.ownerEmail) {
          console.error(`Shop ${shopId} not found or missing owner email`)
          continue
        }

        // Get shop owner profile for name
        let ownerName: string | undefined
        try {
          const ownerProfile = await getUserProfile(shop.ownerId)
          ownerName = ownerProfile?.name
        } catch (error) {
          console.log('Could not fetch shop owner profile for name')
        }

        // Calculate total for this shop's items
        const shopTotal = shopItems.reduce((sum, item) => sum + (item.unitPriceCents * item.quantity), 0)

        const orderData = {
          id: order.id,
          totalCents: shopTotal,
          currency: order.currency,
          status: order.status,
          createdAt: order.createdAt,
          customerEmail: order.customerEmail || '',
          customerName,
          items: shopItems,
          shippingAddress: order.shippingAddress ? JSON.parse(order.shippingAddress) : undefined,
        }

        const shopData = {
          id: shop.id,
          name: shop.name,
          handle: shop.handle,
          ownerEmail: shop.ownerEmail,
          ownerName,
        }

        await emailService.sendSellerNotification(orderData, shopData)
        console.log(`Seller notification sent to ${shop.ownerEmail} for shop ${shop.name}`)

      } catch (error: any) {
        console.error(`Error sending notification for shop ${shopId}:`, error)
        // Continue with other shops even if one fails
      }
    }

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

