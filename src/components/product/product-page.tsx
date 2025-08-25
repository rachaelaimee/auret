'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useUserProfile } from '@/hooks/use-user-profile'
import { Navigation } from '@/components/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  ArrowLeft, 
  Edit, 
  ShoppingCart, 
  Package, 
  Download, 
  MapPin, 
  Store,
  Calendar,
  Tag,
  Ruler,
  Weight,
  Hash
} from 'lucide-react'
import { DeleteProductDialog } from './delete-product-dialog'

// Types (matching the server-side data with Date objects)
interface Product {
  id: string
  shopId: string
  title: string
  description: string
  priceCents: number
  type: 'digital' | 'physical'
  status: 'draft' | 'active'
  photos: {
    id: string
    url: string
    alt?: string
    order: number
  }[]
  variants?: {
    id: string
    name: string
    options: Record<string, string>
    priceCents: number
    inventory?: number
    sku?: string
  }[]
  categories?: string[]
  tags?: string[]
  inventory?: number
  sku?: string
  weight?: number
  dimensions?: {
    length: number
    width: number
    height: number
  }
  digitalFiles?: {
    name: string
    url: string
    size: number
  }[]
  createdAt: Date
  updatedAt: Date
}

interface Shop {
  id: string
  name: string
  handle: string
  bio?: string
  ownerId: string
  country: string
  currency: string
  status: 'active' | 'inactive'
  createdAt: Date
  updatedAt: Date
}

interface ProductPageProps {
  product: Product
  shop: Shop
}

export function ProductPage({ product, shop }: ProductPageProps) {
  const { user, profile } = useUserProfile()
  const [isOwner, setIsOwner] = useState(false)
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setIsOwner(user?.uid === shop.ownerId)
    setMounted(true)
  }, [user, shop.ownerId])

  const formatPrice = (priceCents: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: shop.currency || 'USD',
    }).format(priceCents / 100)
  }

  const formatDate = (date: Date) => {
    if (!mounted) return 'Loading...'
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const mainImage = product.photos[selectedImageIndex]
  const isDigital = product.type === 'digital'
  const isInStock = !product.inventory || product.inventory > 0
  const isLowStock = product.inventory && product.inventory <= 5

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      <Navigation user={user} />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Breadcrumb */}
          <div className="flex items-center space-x-2 text-sm text-slate-600 mb-6">
            <Link href={`/shop/${shop.handle}`} className="hover:text-slate-900 flex items-center">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to {shop.name}
            </Link>
          </div>

          {/* Owner Actions */}
          {isOwner && (
            <div className="mb-6">
              <Alert>
                <AlertDescription className="flex items-center justify-between">
                  <span>You are viewing your product as the owner.</span>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" asChild>
                      <Link href={`/shop/${shop.handle}/products/${product.id}/edit`}>
                        <Edit className="h-4 w-4 mr-1" />
                        Edit Product
                      </Link>
                    </Button>
                    <DeleteProductDialog
                      productId={product.id}
                      productTitle={product.title}
                      shopHandle={shop.handle}
                    />
                  </div>
                </AlertDescription>
              </Alert>
            </div>
          )}

          {/* Draft Status */}
          {product.status === 'draft' && (
            <div className="mb-6">
              <Alert variant="destructive">
                <AlertDescription>
                  This product is in draft mode and not visible to customers.
                </AlertDescription>
              </Alert>
            </div>
          )}

          <div className="grid gap-8 lg:grid-cols-2">
            {/* Product Images */}
            <div className="space-y-4">
              {/* Main Image */}
              <div className="aspect-square rounded-lg overflow-hidden bg-slate-100">
                {mainImage ? (
                  <img
                    src={mainImage.url}
                    alt={mainImage.alt || product.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Package className="h-16 w-16 text-slate-400" />
                  </div>
                )}
              </div>

              {/* Thumbnail Gallery */}
              {product.photos.length > 1 && (
                <div className="grid grid-cols-4 gap-2">
                  {product.photos.map((photo, index) => (
                    <button
                      key={photo.id}
                      onClick={() => setSelectedImageIndex(index)}
                      className={`aspect-square rounded-lg overflow-hidden bg-slate-100 border-2 transition-colors ${
                        index === selectedImageIndex
                          ? 'border-blue-500'
                          : 'border-transparent hover:border-slate-300'
                      }`}
                    >
                      <img
                        src={photo.url}
                        alt={photo.alt || `${product.title} ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Product Info */}
            <div className="space-y-6">
              {/* Title and Price */}
              <div>
                <div className="flex items-start justify-between mb-2">
                  <h1 className="text-3xl font-bold text-slate-900">{product.title}</h1>
                  <div className="flex gap-2">
                    <Badge variant={isDigital ? "secondary" : "outline"}>
                      {isDigital ? (
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
                    <Badge variant={product.status === 'active' ? "default" : "secondary"}>
                      {product.status}
                    </Badge>
                  </div>
                </div>
                <div className="text-3xl font-bold text-slate-900 mb-4">
                  {formatPrice(product.priceCents)}
                </div>
              </div>

              {/* Stock Status */}
              {!isDigital && product.inventory !== undefined && (
                <div className="flex items-center gap-2">
                  {isInStock ? (
                    <>
                      <div className="h-2 w-2 bg-green-500 rounded-full" />
                      <span className="text-sm text-slate-600">
                        {isLowStock ? `Only ${product.inventory} left` : 'In stock'}
                      </span>
                    </>
                  ) : (
                    <>
                      <div className="h-2 w-2 bg-red-500 rounded-full" />
                      <span className="text-sm text-slate-600">Out of stock</span>
                    </>
                  )}
                </div>
              )}

              {/* Description */}
              <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">Description</h3>
                <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">
                  {product.description}
                </p>
              </div>

              {/* Tags */}
              {product.tags && product.tags.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {product.tags.map((tag, index) => (
                      <Badge key={index} variant="outline">
                        <Tag className="h-3 w-3 mr-1" />
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Product Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Product Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {product.sku && (
                    <div className="flex items-center justify-between">
                      <span className="flex items-center text-sm text-slate-600">
                        <Hash className="h-4 w-4 mr-2" />
                        SKU
                      </span>
                      <span className="text-sm font-medium">{product.sku}</span>
                    </div>
                  )}
                  
                  {product.weight && (
                    <div className="flex items-center justify-between">
                      <span className="flex items-center text-sm text-slate-600">
                        <Weight className="h-4 w-4 mr-2" />
                        Weight
                      </span>
                      <span className="text-sm font-medium">{product.weight}g</span>
                    </div>
                  )}

                  {product.dimensions && (
                    <div className="flex items-center justify-between">
                      <span className="flex items-center text-sm text-slate-600">
                        <Ruler className="h-4 w-4 mr-2" />
                        Dimensions
                      </span>
                      <span className="text-sm font-medium">
                        {product.dimensions.length} × {product.dimensions.width} × {product.dimensions.height} cm
                      </span>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <span className="flex items-center text-sm text-slate-600">
                      <Calendar className="h-4 w-4 mr-2" />
                      Added
                    </span>
                    <span className="text-sm font-medium">{formatDate(product.createdAt)}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Shop Info */}
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center space-x-3">
                    <div className="h-12 w-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                      <Store className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h4 className="font-medium text-slate-900">{shop.name}</h4>
                      <p className="text-sm text-slate-600 flex items-center">
                        <MapPin className="h-3 w-3 mr-1" />
                        {shop.country}
                      </p>
                    </div>
                    <div className="flex-1" />
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/shop/${shop.handle}`}>
                        Visit Shop
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Add to Cart / Purchase Actions */}
              {!isOwner && product.status === 'active' && (
                <div className="space-y-3">
                  <Button 
                    size="lg" 
                    className="w-full"
                    disabled={!isInStock && !isDigital}
                  >
                    <ShoppingCart className="h-5 w-5 mr-2" />
                    {isDigital ? 'Purchase & Download' : 'Add to Cart'}
                  </Button>
                  
                  {!isDigital && !isInStock && (
                    <p className="text-sm text-center text-slate-500">
                      This item is currently out of stock
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
