'use client'

import { useCart } from './cart-provider'
import { useCurrency } from '@/components/currency/currency-provider'
import { convertAndFormatPrice } from '@/lib/currency'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { X, Plus, Minus, ShoppingBag, Trash2 } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

export function CartDrawer() {
  const { items, totalItems, isOpen, setIsOpen, updateQuantity, removeItem, clearCart } = useCart()
  const { currency } = useCurrency()

  // Group items by currency for better display
  const itemsByCurrency = items.reduce((groups, item) => {
    const curr = item.currency
    if (!groups[curr]) groups[curr] = []
    groups[curr].push(item)
    return groups
  }, {} as Record<string, typeof items>)

  // Calculate totals by currency
  const totalsByCurrency = Object.entries(itemsByCurrency).map(([curr, currencyItems]) => ({
    currency: curr,
    total: currencyItems.reduce((sum, item) => sum + (item.price * item.quantity), 0),
    count: currencyItems.reduce((sum, item) => sum + item.quantity, 0)
  }))

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 z-40 transition-opacity"
        onClick={() => setIsOpen(false)}
      />
      
      {/* Cart Drawer */}
      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl z-50 transform transition-transform">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b">
            <div className="flex items-center gap-2">
              <ShoppingBag className="h-5 w-5" />
              <h2 className="text-lg font-semibold">
                Shopping Cart ({totalItems})
              </h2>
            </div>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setIsOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Cart Items */}
          <div className="flex-1 overflow-y-auto p-6">
            {items.length === 0 ? (
              <div className="text-center py-12">
                <ShoppingBag className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-900 mb-2">Your cart is empty</h3>
                <p className="text-slate-500 mb-6">Add some amazing products to get started!</p>
                <Button onClick={() => setIsOpen(false)}>
                  Continue Shopping
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {items.map((item) => (
                  <div key={item.id} className="flex gap-4 p-4 bg-slate-50 rounded-lg">
                    {/* Product Image */}
                    <div className="relative w-16 h-16 rounded-md overflow-hidden bg-slate-200 flex-shrink-0">
                      {item.image ? (
                        <Image
                          src={item.image}
                          alt={item.title}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ShoppingBag className="h-6 w-6 text-slate-400" />
                        </div>
                      )}
                    </div>

                    {/* Product Info */}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-slate-900 truncate">{item.title}</h4>
                      <p className="text-sm text-slate-500">by {item.shopName}</p>
                      
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant={item.type === 'digital' ? 'default' : 'secondary'} className="text-xs">
                          {item.type === 'digital' ? 'Digital' : 'Physical'}
                        </Badge>
                        <span className="text-sm font-medium">
                          {convertAndFormatPrice(item.price, currency)}
                        </span>
                      </div>

                      {/* Quantity Controls */}
                      <div className="flex items-center justify-between mt-3">
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="h-8 w-8 p-0"
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-8 text-center text-sm font-medium">
                            {item.quantity}
                          </span>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="h-8 w-8 p-0"
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>

                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => removeItem(item.id)}
                          className="text-red-500 hover:text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {items.length > 0 && (
            <div className="border-t p-6 space-y-4">
              {/* Totals by Currency */}
              <div className="space-y-2">
                {totalsByCurrency.map(({ currency: curr, total, count }) => (
                  <div key={curr} className="flex justify-between items-center">
                    <span className="text-sm text-slate-600">
                      Subtotal ({count} items in {curr}):
                    </span>
                    <span className="font-semibold">
                      {convertAndFormatPrice(total, currency)}
                    </span>
                  </div>
                ))}
              </div>

              {totalsByCurrency.length > 1 && (
                <p className="text-xs text-slate-500 text-center">
                  Multi-currency orders will be processed separately
                </p>
              )}

              {/* Action Buttons */}
              <div className="space-y-2">
                <Link href="/checkout" onClick={() => setIsOpen(false)} className="block">
                  <Button size="lg" className="w-full">
                    Proceed to Checkout
                  </Button>
                </Link>
                
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setIsOpen(false)}
                    className="flex-1"
                  >
                    Continue Shopping
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={clearCart}
                    className="text-red-500 hover:text-red-600 hover:bg-red-50"
                  >
                    Clear Cart
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
