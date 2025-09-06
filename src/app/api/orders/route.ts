import { NextRequest, NextResponse } from 'next/server'
import { verifyIdToken } from '@/lib/firebase-admin'
import { getUserOrdersAdmin } from '@/lib/firestore-admin'

export async function GET(request: NextRequest) {
  try {
    console.log('=== ORDERS API DEBUG ===')
    
    // Get Firebase ID token from Authorization header
    const authHeader = request.headers.get('authorization')
    console.log('Auth header present:', !!authHeader)
    console.log('Auth header format valid:', authHeader?.startsWith('Bearer '))
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('❌ No valid auth header')
      return NextResponse.json({ error: 'Unauthorized - No token provided' }, { status: 401 })
    }

    const idToken = authHeader.split('Bearer ')[1]
    console.log('Token extracted, length:', idToken.length)
    
    // Verify the Firebase ID token using Admin SDK
    let decodedToken
    try {
      console.log('🔐 Attempting to verify Firebase token...')
      decodedToken = await verifyIdToken(idToken)
      console.log('✅ Token verified successfully for user:', decodedToken.uid)
    } catch (error: any) {
      console.error('❌ Token verification failed:', error.message)
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 })
    }

    const userId = decodedToken.uid
    console.log('🔍 Fetching orders for user:', userId)

    // Fetch user's orders from Firestore using Admin SDK
    try {
      const userOrders = await getUserOrdersAdmin(userId)
      console.log('📦 Found orders:', userOrders.length)
      
      // Convert Date objects to strings for JSON serialization
      const formattedOrders = userOrders.map(order => ({
        ...order,
        createdAt: order.createdAt instanceof Date ? order.createdAt.toISOString() : order.createdAt,
        updatedAt: order.updatedAt instanceof Date ? order.updatedAt.toISOString() : order.updatedAt,
      }))

      console.log('✅ Orders API successful')
      return NextResponse.json({ orders: formattedOrders })
      
    } catch (firestoreError: any) {
      console.error('❌ Firestore error:', firestoreError)
      throw firestoreError
    }

  } catch (error: any) {
    console.error('❌ Orders API error:', error.message)
    console.error('❌ Full error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch orders', details: error.message },
      { status: 500 }
    )
  }
}
