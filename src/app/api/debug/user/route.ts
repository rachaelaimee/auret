import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    // Get Firebase ID token from Authorization header
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 })
    }

    const idToken = authHeader.split('Bearer ')[1]
    
    // Decode the token payload (base64 decode)
    let payload: any
    try {
      payload = JSON.parse(atob(idToken.split('.')[1]))
    } catch (error) {
      return NextResponse.json({ error: 'Invalid token format' }, { status: 401 })
    }

    return NextResponse.json({
      message: 'Current user info from token',
      userId: payload.user_id || payload.sub,
      email: payload.email,
      payload: payload
    })

  } catch (error: any) {
    console.error('Error debugging user:', error)
    return NextResponse.json(
      { error: 'Failed to debug user', details: error.message },
      { status: 500 }
    )
  }
}
