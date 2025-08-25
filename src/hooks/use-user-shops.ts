'use client'

import { useState, useEffect } from 'react'
import { getShopsByOwner, Shop } from '@/lib/firestore'
import { useUserProfile } from './use-user-profile'

export function useUserShops() {
  const { user, profile } = useUserProfile()
  const [shops, setShops] = useState<Shop[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadShops = async () => {
    if (!user || profile?.role !== 'seller') {
      setShops([])
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)
      const userShops = await getShopsByOwner(user.uid)
      setShops(userShops)
    } catch (err: any) {
      console.error('Error loading user shops:', err)
      setError(err.message || 'Failed to load shops')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadShops()
  }, [user, profile])

  const refetch = () => {
    loadShops()
  }

  return {
    shops,
    loading,
    error,
    refetch
  }
}
