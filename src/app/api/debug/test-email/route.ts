import { NextRequest, NextResponse } from 'next/server'
import { emailService } from '@/lib/email'

export async function POST(request: NextRequest) {
  // Only allow this with a secret key
  const authHeader = request.headers.get('authorization')
  if (authHeader !== 'Bearer debug-auret-2024') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { email } = await request.json()
    
    if (!email) {
      return NextResponse.json({ error: 'Email address required' }, { status: 400 })
    }

    // Send a test order confirmation
    const testOrder = {
      id: 'test_order_123',
      totalCents: 100,
      currency: 'GBP',
      status: 'paid',
      createdAt: new Date(),
      customerEmail: email,
      customerName: 'Test Customer',
      items: [{
        id: 'test_item_1',
        title: 'Test Product',
        quantity: 1,
        unitPriceCents: 100,
        type: 'digital' as const,
        downloadUrl: 'https://www.auret.shop/test-download'
      }]
    }

    await emailService.sendOrderConfirmation(testOrder)
    
    return NextResponse.json({ 
      success: true, 
      message: `Test email sent to ${email}` 
    })
  } catch (error: any) {
    console.error('Test email error:', error)
    return NextResponse.json({ 
      error: error.message || 'Failed to send test email' 
    }, { status: 500 })
  }
}
