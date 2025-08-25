'use client'

import { useState, useEffect } from 'react'
import { User } from 'firebase/auth'
import { UserProfile, getUserProfile, createUserProfile, updateUserProfile } from '@/lib/firestore'
import { useAuth } from '@/components/auth/auth-provider'

export function useUserProfile() {
  const { user, loading: authLoading } = useAuth()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadProfile() {
      if (!user) {
        setProfile(null)
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        let userProfile = await getUserProfile(user.uid)
        
        // Create profile if it doesn't exist
        if (!userProfile) {
          userProfile = await createUserProfile(user.uid, {
            email: user.email || '',
            name: user.displayName || '',
            displayName: user.displayName || undefined,
            emailVerified: user.emailVerified,
            role: 'buyer'
          })
        }
        
        setProfile(userProfile)
        setError(null)
      } catch (err) {
        console.error('Error loading user profile:', err)
        setError('Failed to load profile')
      } finally {
        setLoading(false)
      }
    }

    if (!authLoading) {
      loadProfile()
    }
  }, [user, authLoading])

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user || !profile) return

    try {
      await updateUserProfile(user.uid, updates)
      setProfile({ ...profile, ...updates })
      setError(null)
    } catch (err) {
      console.error('Error updating profile:', err)
      setError('Failed to update profile')
      throw err
    }
  }

  return {
    profile,
    loading: loading || authLoading,
    error,
    updateProfile,
    user
  }
}
