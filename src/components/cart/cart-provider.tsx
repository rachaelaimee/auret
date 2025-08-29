'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { Currency } from '@/lib/currency'

export interface CartItem {
  id: string
  productId: string
  title: string
  price: number // In cents
  currency: Currency
  quantity: number
  image?: string
  shopId: string
  shopName: string
  shopHandle: string
  type: 'digital' | 'physical'
  // Optional variant info (for future use)
  variant?: {
    id: string
    name: string
    value: string
  }
}

interface CartContextType {
  items: CartItem[]
  totalItems: number
  totalPrice: number // In cents, in mixed currencies
  addItem: (item: Omit<CartItem, 'quantity'>) => void
  removeItem: (itemId: string) => void
  updateQuantity: (itemId: string, quantity: number) => void
  clearCart: () => void
  isOpen: boolean
  setIsOpen: (open: boolean) => void
}

const CartContext = createContext<CartContextType | null>(null)

export const useCart = () => {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}

interface CartProviderProps {
  children: ReactNode
}

const CART_STORAGE_KEY = 'auret-cart'

export function CartProvider({ children }: CartProviderProps) {
  const [items, setItems] = useState<CartItem[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [isHydrated, setIsHydrated] = useState(false)

  // Load cart from localStorage on mount
  useEffect(() => {
    try {
      const savedCart = localStorage.getItem(CART_STORAGE_KEY)
      if (savedCart) {
        const parsedCart = JSON.parse(savedCart)
        setItems(Array.isArray(parsedCart) ? parsedCart : [])
      }
    } catch (error) {
      console.warn('Failed to load cart from localStorage:', error)
    } finally {
      setIsHydrated(true)
    }
  }, [])

  // Save cart to localStorage whenever items change
  useEffect(() => {
    if (isHydrated) {
      try {
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items))
      } catch (error) {
        console.warn('Failed to save cart to localStorage:', error)
      }
    }
  }, [items, isHydrated])

  const addItem = (newItem: Omit<CartItem, 'quantity'>) => {
    setItems(currentItems => {
      // Check if item already exists (same product and variant)
      const existingItemIndex = currentItems.findIndex(
        item => item.productId === newItem.productId && 
                 item.variant?.id === newItem.variant?.id
      )

      if (existingItemIndex >= 0) {
        // Update quantity of existing item
        const updatedItems = [...currentItems]
        updatedItems[existingItemIndex] = {
          ...updatedItems[existingItemIndex],
          quantity: updatedItems[existingItemIndex].quantity + 1
        }
        return updatedItems
      } else {
        // Add new item
        return [...currentItems, { ...newItem, quantity: 1 }]
      }
    })
  }

  const removeItem = (itemId: string) => {
    setItems(currentItems => currentItems.filter(item => item.id !== itemId))
  }

  const updateQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(itemId)
      return
    }

    setItems(currentItems =>
      currentItems.map(item =>
        item.id === itemId ? { ...item, quantity } : item
      )
    )
  }

  const clearCart = () => {
    setItems([])
  }

  // Calculate totals
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0)
  
  // Note: This is a simplified total calculation
  // In a real app, you'd want to group by currency and show separate totals
  const totalPrice = items.reduce((sum, item) => sum + (item.price * item.quantity), 0)

  const value: CartContextType = {
    items,
    totalItems,
    totalPrice,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    isOpen,
    setIsOpen
  }

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  )
}
