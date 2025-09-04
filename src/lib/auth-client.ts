import { auth } from './firebase'
import { 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User,
  updateProfile
} from 'firebase/auth'

export { auth }

// Auth functions
export const signIn = async (email: string, password: string) => {
  return await signInWithEmailAndPassword(auth, email, password)
}

export const signUp = async (email: string, password: string, displayName?: string) => {
  const result = await createUserWithEmailAndPassword(auth, email, password)
  
  if (displayName && result.user) {
    await updateProfile(result.user, { displayName })
  }
  
  return result
}

export const logOut = async () => {
  return await signOut(auth)
}

export const onAuthChange = (callback: (user: User | null) => void) => {
  console.log('Auth-client: Setting up onAuthStateChanged listener')
  
  return onAuthStateChanged(auth, (user) => {
    console.log('Auth-client: onAuthStateChanged fired', { 
      user: user ? { uid: user.uid, email: user.email } : null,
      currentUser: auth.currentUser ? { uid: auth.currentUser.uid, email: auth.currentUser.email } : null
    })
    
    // Handle token refresh errors gracefully
    if (user) {
      user.getIdToken(true).catch((error) => {
        console.warn('Auth-client: Token refresh failed, but user is still authenticated:', error)
        // Don't sign out the user for token refresh failures
      })
    }
    callback(user)
  })
}