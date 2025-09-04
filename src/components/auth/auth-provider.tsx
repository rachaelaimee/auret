'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { User } from 'firebase/auth'
import { onAuthChange } from '@/lib/auth-client'

interface AuthContextType {
  user: User | null
  loading: boolean
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
})

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    console.log('AuthProvider: Setting up auth listener')
    
    const unsubscribe = onAuthChange((user) => {
      console.log('AuthProvider: Auth state changed', { 
        user: user ? { uid: user.uid, email: user.email } : null,
        loading 
      })
      
      setUser(user)
      setLoading(false)
    })

    return () => {
      console.log('AuthProvider: Cleaning up auth listener')
      unsubscribe()
    }
  }, [])

  console.log('AuthProvider: Rendering', { 
    user: user ? { uid: user.uid, email: user.email } : null, 
    loading 
  })

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  )
}
