'use client'

import { useState } from 'react'
import { useCart } from './cart-provider'
import { Button } from '@/components/ui/button'
import { ShoppingCart, Plus, Check, Loader2 } from 'lucide-react'
import { Currency } from '@/lib/currency'

interface AddToCartButtonProps {
  product: {
    id: string
    title: string
    priceCents: number
    currency?: Currency
    photos: Array<{ url: string; alt?: string }>
    type: 'digital' | 'physical'
  }
  shop: {
    id: string
    name: string
    handle: string
  }
  variant?: 'default' | 'icon' | 'compact'
  disabled?: boolean
  className?: string
}

export function AddToCartButton({ 
  product, 
  shop, 
  variant = 'default',
  disabled = false,
  className = ''
}: AddToCartButtonProps) {
  const { addItem, setIsOpen } = useCart()
  const [isAdding, setIsAdding] = useState(false)
  const [justAdded, setJustAdded] = useState(false)

  const handleAddToCart = async () => {
    if (disabled || isAdding) return

    setIsAdding(true)
    
    try {
      const cartItem = {
        id: `${product.id}-${Date.now()}`, // Unique ID for cart item
        productId: product.id,
        title: product.title,
        price: product.priceCents,
        currency: (product.currency as Currency) || 'USD',
        image: product.photos[0]?.url,
        shopId: shop.id,
        shopName: shop.name,
        shopHandle: shop.handle,
        type: product.type
      }

      addItem(cartItem)
      
      // Show success state
      setJustAdded(true)
      setTimeout(() => setJustAdded(false), 2000)
      
      // Open cart drawer after a short delay
      setTimeout(() => setIsOpen(true), 500)
      
    } catch (error) {
      console.error('Error adding item to cart:', error)
    } finally {
      setIsAdding(false)
    }
  }

  // Icon variant - just the cart icon
  if (variant === 'icon') {
    return (
      <Button
        size="sm"
        variant="outline"
        onClick={handleAddToCart}
        disabled={disabled || isAdding}
        className={`${className} ${justAdded ? 'bg-green-50 border-green-200' : ''}`}
        title="Add to cart"
      >
        {isAdding ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : justAdded ? (
          <Check className="h-4 w-4 text-green-600" />
        ) : (
          <ShoppingCart className="h-4 w-4" />
        )}
      </Button>
    )
  }

  // Compact variant - smaller button
  if (variant === 'compact') {
    return (
      <Button
        size="sm"
        onClick={handleAddToCart}
        disabled={disabled || isAdding}
        className={`${className} ${justAdded ? 'bg-green-600 hover:bg-green-700' : ''}`}
      >
        {isAdding ? (
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        ) : justAdded ? (
          <Check className="h-4 w-4 mr-2" />
        ) : (
          <Plus className="h-4 w-4 mr-2" />
        )}
        {justAdded ? 'Added!' : 'Add to Cart'}
      </Button>
    )
  }

  // Default variant - full button
  return (
    <Button
      size="lg"
      onClick={handleAddToCart}
      disabled={disabled || isAdding}
      className={`${className} ${justAdded ? 'bg-green-600 hover:bg-green-700' : ''}`}
    >
      {isAdding ? (
        <>
          <Loader2 className="h-5 w-5 mr-2 animate-spin" />
          Adding to Cart...
        </>
      ) : justAdded ? (
        <>
          <Check className="h-5 w-5 mr-2" />
          Added to Cart!
        </>
      ) : (
        <>
          <ShoppingCart className="h-5 w-5 mr-2" />
          Add to Cart
        </>
      )}
    </Button>
  )
}
