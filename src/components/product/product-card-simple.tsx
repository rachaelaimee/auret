'use client'

import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { useCurrency } from '@/components/currency/currency-provider'
import { convertAndFormatPrice } from '@/lib/currency'

interface ProductCardProps {
  product: {
    id: string
    title: string
    priceCents: number
    currency?: string // Optional for backward compatibility
    photos: {
      id: string
      url: string
      alt?: string
      order: number
    }[]
    type: 'digital' | 'physical'
  }
  shop: {
    handle: string
    name: string
    logoUrl?: string
  }
}

export function ProductCard({ product, shop }: ProductCardProps) {
  const { currency } = useCurrency()
  const primaryPhoto = product.photos.find(photo => photo.order === 0) || product.photos[0]
  
  // Smart currency handling: use product's currency if available, otherwise assume USD for old products
  const productCurrency = product.currency || 'USD'
  const displayPrice = productCurrency === currency 
    ? product.priceCents // Same currency, no conversion needed
    : convertAndFormatPrice(product.priceCents, currency) // Convert from product currency to display currency

  return (
    <Link 
      href={`/shop/${shop.handle}/products/${product.id}`}
      className="group block bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden"
    >
      {/* Product Image */}
      <div className="aspect-square bg-slate-100 relative overflow-hidden">
        {primaryPhoto && !primaryPhoto.url.startsWith('blob:') ? (
          <img
            src={primaryPhoto.url}
            alt={primaryPhoto.alt || product.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
            onError={(e) => {
              console.warn('Failed to load image:', primaryPhoto.url)
              e.currentTarget.style.display = 'none'
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-400">
            {primaryPhoto?.url.startsWith('blob:') ? 'Image Loading...' : 'No Image'}
          </div>
        )}
        
        {/* Product Type Badge */}
        <div className="absolute top-2 right-2">
          <Badge variant={product.type === 'digital' ? 'default' : 'secondary'}>
            {product.type === 'digital' ? 'Digital' : 'Physical'}
          </Badge>
        </div>
      </div>

      {/* Product Info */}
      <div className="p-4">
        <h3 className="font-semibold text-slate-900 group-hover:text-slate-700 transition-colors line-clamp-2 mb-2">
          {product.title}
        </h3>
        
        <div className="flex items-center justify-between">
          <span className="text-lg font-bold text-slate-900">
            {typeof displayPrice === 'string' ? displayPrice : convertAndFormatPrice(displayPrice, currency)}
          </span>
          
          {/* Shop Info */}
          <div className="flex items-center gap-2">
            {shop.logoUrl ? (
              <img
                src={shop.logoUrl}
                alt={`${shop.name} logo`}
                className="w-5 h-5 rounded object-cover"
              />
            ) : (
              <div className="w-5 h-5 rounded bg-gradient-to-br from-blue-500 to-purple-600"></div>
            )}
            <span className="text-sm text-slate-600 truncate max-w-[80px]">
              {shop.name}
            </span>
          </div>
        </div>
      </div>
    </Link>
  )
}
