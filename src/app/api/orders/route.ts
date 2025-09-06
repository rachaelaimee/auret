import { NextRequest, NextResponse } from 'next/server'
import { verifyIdToken } from '@/lib/firebase-admin'
import { getUserOrdersAdmin } from '@/lib/firestore-admin'

export async function GET(request: NextRequest) {
  try {
    // Get Firebase ID token from Authorization header
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized - No token provided' }, { status: 401 })
    }

    const idToken = authHeader.split('Bearer ')[1]
    
    // Verify the Firebase ID token using Admin SDK
    let decodedToken
    try {
      decodedToken = await verifyIdToken(idToken)
    } catch (error) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 })
    }

    const userId = decodedToken.uid

    // Fetch user's orders from Firestore using Admin SDK
    const userOrders = await getUserOrdersAdmin(userId)
    
    // Convert Date objects to strings for JSON serialization
    const formattedOrders = userOrders.map(order => ({
      ...order,
      createdAt: order.createdAt instanceof Date ? order.createdAt.toISOString() : order.createdAt,
      updatedAt: order.updatedAt instanceof Date ? order.updatedAt.toISOString() : order.updatedAt,
    }))

    return NextResponse.json({ orders: formattedOrders })

  } catch (error: any) {
    console.error('Error fetching user orders:', error)
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    )
  }
}
