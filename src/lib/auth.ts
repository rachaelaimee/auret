import { auth } from './firebase'
import { onAuthStateChanged, User } from 'firebase/auth'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'

// Server-side auth helpers
export const getUser = async (): Promise<User | null> => {
  // For server-side rendering, we'll check for a session cookie
  // This is a simplified approach - in production you might want to use Firebase Admin SDK
  const cookieStore = cookies()
  const sessionCookie = cookieStore.get('session')
  
  if (!sessionCookie) {
    return null
  }

  // In a real app, you'd verify the session cookie with Firebase Admin SDK
  // For now, we'll return null and handle auth client-side
  return null
}

export const requireAuth = async () => {
  const user = await getUser()
  if (!user) {
    redirect('/auth/signin')
  }
  return user
}

export const requireNoAuth = async () => {
  const user = await getUser()
  if (user) {
    redirect('/dashboard')
  }
}

// Client-side auth helpers
export const getCurrentUser = (): Promise<User | null> => {
  return new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe()
      resolve(user)
    })
  })
}

export const getUserRole = async (userId: string): Promise<string> => {
  // In a real app, you'd fetch this from Firestore
  // For now, return default role
  return 'buyer'
}

export const requireRole = async (requiredRole: 'admin' | 'seller') => {
  const user = await getCurrentUser()
  if (!user) {
    redirect('/auth/signin')
  }
  
  const role = await getUserRole(user.uid)
  
  if (requiredRole === 'admin' && role !== 'admin') {
    redirect('/dashboard')
  }
  
  if (requiredRole === 'seller' && role !== 'seller' && role !== 'admin') {
    redirect('/dashboard')
  }
  
  return { user, role }
}