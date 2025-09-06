import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'Cart debug endpoint',
    note: 'Check your browser console on the checkout page for cart data',
    instructions: [
      '1. Go to your checkout page',
      '2. Open browser developer tools (F12)',  
      '3. Look for console.log messages showing cart items',
      '4. Check if shopId, shopName, shopHandle are populated'
    ]
  })
}
