import { NextRequest, NextResponse } from 'next/server'
import { put } from '@vercel/blob'

export async function POST(request: NextRequest) {
  console.log('🔄 Blob upload API called')
  
  try {
    // Parse form data
    const formData = await request.formData()
    const file = formData.get('file') as File
    const filename = formData.get('filename') as string

    if (!file) {
      console.error('❌ No file provided in request')
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    console.log('📁 File details:', {
      name: file.name,
      size: file.size,
      type: file.type,
      filename: filename
    })

    // Check for Blob token
    const token = process.env.BLOB_READ_WRITE_TOKEN
    if (!token) {
      console.error('❌ BLOB_READ_WRITE_TOKEN not found in environment')
      console.log('🔍 Available env vars:', Object.keys(process.env).filter(key => key.includes('BLOB')))
      return NextResponse.json(
        { error: 'Storage not configured - missing BLOB_READ_WRITE_TOKEN' },
        { status: 500 }
      )
    }

    console.log('✅ Token found, length:', token.length)
    console.log('🔄 Uploading to Vercel Blob...')
    
    // Upload to Vercel Blob
    const blob = await put(filename, file, {
      access: 'public',
      token: token,
    })

    console.log('✅ Blob upload successful:', blob.url)

    return NextResponse.json({
      url: blob.url,
      pathname: blob.pathname,
      size: blob.size,
    })
    
  } catch (error) {
    console.error('💥 Blob upload error:', error)
    
    // Detailed error logging
    if (error instanceof Error) {
      console.error('Error name:', error.name)
      console.error('Error message:', error.message)
      console.error('Error stack:', error.stack)
    }
    
    return NextResponse.json(
      { 
        error: `Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: error instanceof Error ? error.stack : 'No stack trace available'
      },
      { status: 500 }
    )
  }
}
