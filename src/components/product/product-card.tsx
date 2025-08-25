'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Product } from '@/lib/firestore'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Edit, Eye, MoreVertical, Package, Download } from 'lucide-react'
import { DeleteProductDialog } from './delete-product-dialog'

// Shop type (simplified)
type Shop = {
  id: string
  handle: string
  name: string
}

// Product with converted dates for client component
type ProductWithDates = Omit<Product, 'createdAt' | 'updatedAt'> & {
  createdAt: Date
  updatedAt: Date
}

interface ProductCardProps {
  product: ProductWithDates | Product
  shop: Shop
  showManagement?: boolean
}

export function ProductCard({ product, shop, showManagement = false }: ProductCardProps) {
  const [imageError, setImageError] = useState(false)
  
  const formatPrice = (priceCents: number) => {
    return (priceCents / 100).toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD'
    })
  }

  const mainPhoto = product.photos[0]

  return (
    <Card className="group hover:shadow-lg transition-shadow duration-200">
      <CardHeader className="p-0">
        <div className="relative aspect-square overflow-hidden rounded-t-lg">
          {mainPhoto && !imageError ? (
            <img
              src={mainPhoto.url}
              alt={mainPhoto.alt || product.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="w-full h-full bg-slate-100 flex items-center justify-center">
              <Package className="h-12 w-12 text-slate-400" />
            </div>
          )}
          
          {/* Type Badge */}
          <div className="absolute top-2 left-2">
            <Badge variant="secondary" className="text-xs">
              {product.type === 'digital' ? (
                <>
                  <Download className="h-3 w-3 mr-1" />
                  Digital
                </>
              ) : (
                <>
                  <Package className="h-3 w-3 mr-1" />
                  Physical
                </>
              )}
            </Badge>
          </div>

          {/* Status Badge (for owners) */}
          {showManagement && (
            <div className="absolute top-2 right-2">
              <Badge variant={product.status === 'active' ? 'default' : 'secondary'}>
                {product.status}
              </Badge>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-4">
        <div className="space-y-2">
          <h3 className="font-semibold text-slate-900 line-clamp-2 group-hover:text-blue-600 transition-colors">
            {product.title}
          </h3>
          
          <p className="text-slate-600 text-sm line-clamp-2">
            {product.description}
          </p>
          
          <div className="flex items-center justify-between">
            <span className="text-lg font-bold text-slate-900">
              {formatPrice(product.priceCents)}
            </span>
            
            {product.inventory !== undefined && product.inventory <= 5 && product.inventory > 0 && (
              <Badge variant="outline" className="text-xs">
                {product.inventory} left
              </Badge>
            )}
            
            {product.inventory === 0 && (
              <Badge variant="secondary" className="text-xs">
                Sold out
              </Badge>
            )}
          </div>

          {/* Tags */}
          {product.tags && product.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {product.tags.slice(0, 3).map((tag, index) => (
                <span
                  key={index}
                  className="inline-block bg-slate-100 text-slate-600 text-xs px-2 py-1 rounded"
                >
                  {tag}
                </span>
              ))}
              {product.tags.length > 3 && (
                <span className="inline-block bg-slate-100 text-slate-600 text-xs px-2 py-1 rounded">
                  +{product.tags.length - 3} more
                </span>
              )}
            </div>
          )}
        </div>
      </CardContent>

      <CardFooter className="p-4 pt-0">
        <div className="flex gap-2 w-full">
          {showManagement ? (
            <>
              <Button size="sm" variant="outline" className="flex-1" asChild>
                <Link href={`/shop/${shop.handle}/products/${product.id}`}>
                  <Eye className="h-4 w-4 mr-2" />
                  View
                </Link>
              </Button>
              <Button size="sm" className="flex-1" asChild>
                <Link href={`/shop/${shop.handle}/products/${product.id}/edit`}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Link>
              </Button>
              <DeleteProductDialog
                productId={product.id}
                productTitle={product.title}
                shopHandle={shop.handle}
                onDeleted={() => window.location.reload()}
              />
            </>
          ) : (
            <Button size="sm" className="w-full" asChild>
              <Link href={`/shop/${shop.handle}/products/${product.id}`}>
                View Details
              </Link>
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  )
}
