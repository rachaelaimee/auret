import { initializeApp, getApps, cert } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import { getAuth } from 'firebase-admin/auth'

// Initialize Firebase Admin SDK
let app: any

if (getApps().length === 0) {
  // Initialize with individual environment variables
  if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL) {
    try {
      const privateKey = process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
      
      // Debug: Log the first and last few characters to verify format
      console.log('Private key starts with:', privateKey.substring(0, 30))
      console.log('Private key ends with:', privateKey.substring(privateKey.length - 30))
      console.log('Private key length:', privateKey.length)
      
      app = initializeApp({
        credential: cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          privateKey: privateKey,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        }),
        projectId: process.env.FIREBASE_PROJECT_ID,
      })
      
      console.log('Firebase Admin initialized successfully')
    } catch (error) {
      console.error('Error initializing Firebase Admin:', error)
      throw new Error(`Firebase Admin SDK initialization failed: ${error}`)
    }
  } else {
    throw new Error('Firebase Admin SDK credentials not configured. Please set FIREBASE_PROJECT_ID, FIREBASE_PRIVATE_KEY, and FIREBASE_CLIENT_EMAIL.')
  }
} else {
  app = getApps()[0]
}

// Export Firebase Admin services
export const adminDb = getFirestore(app)
export const adminAuth = getAuth(app)
export { app as adminApp }

// Helper function to verify Firebase ID tokens
export async function verifyIdToken(idToken: string) {
  try {
    const decodedToken = await adminAuth.verifyIdToken(idToken)
    return decodedToken
  } catch (error) {
    console.error('Error verifying ID token:', error)
    throw new Error('Invalid ID token')
  }
}
