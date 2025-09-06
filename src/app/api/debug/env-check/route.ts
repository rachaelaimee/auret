import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    return NextResponse.json({
      hasFirebaseProjectId: !!process.env.FIREBASE_PROJECT_ID,
      firebaseProjectId: process.env.FIREBASE_PROJECT_ID || 'Not set',
      hasFirebasePrivateKey: !!process.env.FIREBASE_PRIVATE_KEY,
      privateKeyLength: process.env.FIREBASE_PRIVATE_KEY?.length || 0,
      privateKeyStart: process.env.FIREBASE_PRIVATE_KEY?.substring(0, 30) || 'Not set',
      hasFirebaseClientEmail: !!process.env.FIREBASE_CLIENT_EMAIL,
      firebaseClientEmail: process.env.FIREBASE_CLIENT_EMAIL || 'Not set',
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to check environment variables', details: error.message },
      { status: 500 }
    )
  }
}
