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
  const [initialized, setInitialized] = useState(false)

  useEffect(() => {
    let mounted = true
    
    const unsubscribe = onAuthChange((user) => {
      if (!mounted) return
      
      setUser(user)
      
      if (!initialized) {
        // Give Firebase a moment to restore auth state on first load
        setTimeout(() => {
          if (mounted) {
            setLoading(false)
            setInitialized(true)
          }
        }, 500)
      } else {
        setLoading(false)
      }
    })

    return () => {
      mounted = false
      unsubscribe()
    }
  }, [initialized])

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  )
}
