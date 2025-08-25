import { handleUpload, type HandleUploadBody } from '@vercel/blob/client'
import { del } from '@vercel/blob'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        // Here you can add authentication/authorization logic
        // For now, we'll allow all uploads
        return {
          allowedContentTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
          tokenPayload: JSON.stringify({
            // Optional: add user ID or other metadata
            uploadedBy: 'user',
          }),
        }
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        // This runs after successful upload
        console.log('Upload completed:', blob.url)
        
        try {
          const payload = JSON.parse(tokenPayload || '{}')
          // Here you could save the blob info to your database
          // await saveImageToDatabase(blob.url, payload.uploadedBy)
        } catch (error) {
          console.error('Error processing upload completion:', error)
        }
      },
    })

    return NextResponse.json(jsonResponse)
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { error: 'Upload failed' },
      { status: 400 }
    )
  }
}

export async function DELETE(request: NextRequest): Promise<NextResponse> {
  try {
    const { url } = await request.json()
    
    if (!url) {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      )
    }

    await del(url)
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete error:', error)
    return NextResponse.json(
      { error: 'Delete failed' },
      { status: 400 }
    )
  }
}
