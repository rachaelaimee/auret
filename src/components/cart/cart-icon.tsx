'use client'

import { useCart } from './cart-provider'
import { Button } from '@/components/ui/button'
import { ShoppingCart } from 'lucide-react'

interface CartIconProps {
  className?: string
}

export function CartIcon({ className = '' }: CartIconProps) {
  const { totalItems, setIsOpen } = useCart()

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => setIsOpen(true)}
      className={`relative ${className}`}
    >
      <ShoppingCart className="h-5 w-5" />
      {totalItems > 0 && (
        <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center min-w-[20px]">
          {totalItems > 99 ? '99+' : totalItems}
        </span>
      )}
    </Button>
  )
}
