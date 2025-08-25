'use client'

import { useState, useEffect } from 'react'
import { getProductsByShop, getActiveProductsByShop, Product } from '@/lib/firestore'

export function useShopProducts(shopId: string, activeOnly = false) {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadProducts = async () => {
    if (!shopId) {
      setProducts([])
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)
      
      const shopProducts = activeOnly 
        ? await getActiveProductsByShop(shopId)
        : await getProductsByShop(shopId)
      
      setProducts(shopProducts)
    } catch (err: any) {
      console.error('Error loading shop products:', err)
      setError(err.message || 'Failed to load products')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadProducts()
  }, [shopId, activeOnly])

  const refetch = () => {
    loadProducts()
  }

  return {
    products,
    loading,
    error,
    refetch
  }
}
