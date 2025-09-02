import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { downloads, orderItems, products } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'

export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const { token } = params
    const userAgent = request.headers.get('user-agent') || ''
    const clientIP = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown'

    // Find the download record
    const downloadRecord = await db
      .select({
        download: downloads,
        orderItem: orderItems,
        product: products,
      })
      .from(downloads)
      .innerJoin(orderItems, eq(downloads.orderItemId, orderItems.id))
      .innerJoin(products, eq(orderItems.productId, products.id))
      .where(eq(downloads.token, token))
      .limit(1)

    if (!downloadRecord.length) {
      return NextResponse.json(
        { error: 'Invalid download token' },
        { status: 404 }
      )
    }

    const { download, orderItem, product } = downloadRecord[0]

    // Check if token has expired
    if (new Date() > download.expiresAt) {
      return NextResponse.json(
        { error: 'Download token has expired' },
        { status: 410 }
      )
    }

    // Check if max attempts exceeded
    if (download.attempts >= download.maxAttempts) {
      return NextResponse.json(
        { error: 'Maximum download attempts exceeded' },
        { status: 429 }
      )
    }

    // Update download record
    await db
      .update(downloads)
      .set({
        attempts: download.attempts + 1,
        lastAccessAt: new Date(),
        ipAddress: clientIP,
        userAgent: userAgent,
      })
      .where(eq(downloads.id, download.id))

    // For now, return download info
    // In a real implementation, you'd stream the file from storage
    return NextResponse.json({
      success: true,
      product: {
        id: product.id,
        title: product.title,
        // downloadUrl: product.digitalFileUrl, // Add this field to products schema
      },
      download: {
        token: download.token,
        attemptsRemaining: download.maxAttempts - (download.attempts + 1),
        expiresAt: download.expiresAt,
      },
      message: 'Download ready. In production, this would stream the actual file.',
    })

  } catch (error: any) {
    console.error('Download error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

