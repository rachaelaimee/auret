import { NextRequest, NextResponse } from 'next/server'

// Simple debug endpoint to check environment variables
export async function GET(request: NextRequest) {
  // Only allow this in development or with a secret key
  const authHeader = request.headers.get('authorization')
  if (authHeader !== 'Bearer debug-auret-2024') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  return NextResponse.json({
    environment: process.env.NODE_ENV,
    hasStripeSecret: !!process.env.STRIPE_SECRET_KEY,
    hasStripeWebhookSecret: !!process.env.STRIPE_WEBHOOK_SECRET,
    hasResendKey: !!process.env.RESEND_API_KEY,
    hasDatabaseUrl: !!process.env.DATABASE_URL,
    stripeSecretPrefix: process.env.STRIPE_SECRET_KEY?.substring(0, 8) + '...',
    webhookSecretPrefix: process.env.STRIPE_WEBHOOK_SECRET?.substring(0, 8) + '...',
    resendKeyPrefix: process.env.RESEND_API_KEY?.substring(0, 8) + '...',
  })
}
