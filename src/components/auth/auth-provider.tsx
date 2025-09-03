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
    let isMounted = true

    const unsubscribe = onAuthChange((user) => {
      if (isMounted) {
        setUser(user)
        setLoading(false)
      }
    })

    // Also handle initial auth state check
    const checkInitialAuth = async () => {
      // Give Firebase a moment to restore auth state from persistence
      await new Promise(resolve => setTimeout(resolve, 100))
      if (isMounted) {
        // Trigger auth state check if still needed
        setLoading(false)
      }
    }

    checkInitialAuth()

    return () => {
      isMounted = false
      unsubscribe()
    }
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  )
}
