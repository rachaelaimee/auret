import { NextRequest, NextResponse } from 'next/server'
import { getRecentOrdersAdmin } from '@/lib/firestore-admin'

export async function GET(request: NextRequest) {
  try {
    // Get recent orders from Firestore using Admin SDK
    const recentOrders = await getRecentOrdersAdmin(10)
    
    // Convert Date objects to strings for JSON serialization
    const formattedOrders = recentOrders.map(order => ({
      id: order.id,
      buyerId: order.buyerId,
      totalCents: order.totalCents,
      currency: order.currency,
      status: order.status,
      stripePaymentIntentId: order.stripePaymentIntentId,
      itemCount: order.items.length,
      createdAt: order.createdAt instanceof Date ? order.createdAt.toISOString() : order.createdAt,
    }))

    return NextResponse.json({
      message: 'Recent orders in Firestore (using Firebase Admin SDK)',
      orders: formattedOrders,
      count: formattedOrders.length
    })

  } catch (error: any) {
    console.error('Error fetching debug orders:', error)
    return NextResponse.json(
      { error: 'Failed to fetch debug orders', details: error.message },
      { status: 500 }
    )
  }
}
