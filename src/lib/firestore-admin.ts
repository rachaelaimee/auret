import { adminDb } from './firebase-admin'
import { Order, OrderItem } from './firestore'

// Server-side Firestore functions using Firebase Admin SDK

// Create a new order (server-side)
export async function createOrderAdmin(orderData: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>) {
  const ordersRef = adminDb.collection('orders')
  const now = new Date()
  
  const order = {
    ...orderData,
    createdAt: now,
    updatedAt: now
  }
  
  const docRef = await ordersRef.add(order)
  return { id: docRef.id, ...order }
}

// Get orders for a user (server-side)
export async function getUserOrdersAdmin(userId: string): Promise<Order[]> {
  const ordersRef = adminDb.collection('orders')
  const querySnapshot = await ordersRef
    .where('buyerId', '==', userId)
    .orderBy('createdAt', 'desc')
    .get()
  
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt,
    updatedAt: doc.data().updatedAt,
  })) as Order[]
}

// Get a specific order (server-side)
export async function getOrderAdmin(orderId: string): Promise<Order | null> {
  const orderRef = adminDb.collection('orders').doc(orderId)
  const orderSnap = await orderRef.get()
  
  if (orderSnap.exists) {
    return { 
      id: orderSnap.id, 
      ...orderSnap.data(),
      createdAt: orderSnap.data()?.createdAt,
      updatedAt: orderSnap.data()?.updatedAt,
    } as Order
  }
  
  return null
}

// Update order status (server-side)
export async function updateOrderStatusAdmin(orderId: string, status: Order['status']) {
  const orderRef = adminDb.collection('orders').doc(orderId)
  await orderRef.update({
    status,
    updatedAt: new Date()
  })
}

// Get orders for a shop (server-side)
export async function getShopOrdersAdmin(shopId: string): Promise<Order[]> {
  const ordersRef = adminDb.collection('orders')
  const querySnapshot = await ordersRef.get()
  
  // Filter orders that contain items from this shop
  const allOrders = querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as Order[]
  
  const shopOrders = allOrders
    .filter(order => order.items.some(item => item.shopId === shopId))
    .sort((a, b) => {
      const aTime = a.createdAt instanceof Date ? a.createdAt.getTime() : 0
      const bTime = b.createdAt instanceof Date ? b.createdAt.getTime() : 0
      return bTime - aTime
    })
  
  return shopOrders
}

// Get recent orders for debugging (server-side)
export async function getRecentOrdersAdmin(limit: number = 10): Promise<Order[]> {
  const ordersRef = adminDb.collection('orders')
  const querySnapshot = await ordersRef
    .orderBy('createdAt', 'desc')
    .limit(limit)
    .get()
  
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt,
    updatedAt: doc.data().updatedAt,
  })) as Order[]
}

// Find orders by Stripe Payment Intent ID (for webhooks)
export async function getOrderByStripePaymentIntentAdmin(paymentIntentId: string): Promise<Order[]> {
  const ordersRef = adminDb.collection('orders')
  const querySnapshot = await ordersRef
    .where('stripePaymentIntentId', '==', paymentIntentId)
    .get()
  
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt,
    updatedAt: doc.data().updatedAt,
  })) as Order[]
}
