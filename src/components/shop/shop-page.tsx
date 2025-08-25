'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useUserProfile } from '@/hooks/use-user-profile'
import { useShopProducts } from '@/hooks/use-shop-products'
import { Navigation } from '@/components/navigation'
import { ProductCard } from '@/components/product/product-card'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Shop } from '@/lib/firestore'

// Shop with converted dates for client component
type ShopWithDates = Omit<Shop, 'createdAt' | 'updatedAt'> & {
  createdAt: Date
  updatedAt: Date
}
import { Store, MapPin, Calendar, Settings, Plus } from 'lucide-react'

interface ShopPageProps {
  shop: ShopWithDates
}

export function ShopPage({ shop }: ShopPageProps) {
  const { user, profile } = useUserProfile()
  const { products, loading: productsLoading } = useShopProducts(shop.id, !user || user.uid !== shop.ownerId)
  const [isOwner, setIsOwner] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setIsOwner(user?.uid === shop.ownerId)
    setMounted(true)
  }, [user, shop.ownerId])

  // Format date consistently to avoid hydration issues
  const formatDate = (date: Date) => {
    if (!mounted) return 'Loading...' // Prevent hydration mismatch
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      <Navigation user={user} />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Shop Header */}
          <div className="bg-white rounded-lg shadow-sm border p-8 mb-8">
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center space-x-4">
                <div className="h-16 w-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <Store className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-slate-900 mb-1">{shop.name}</h1>
                  <p className="text-slate-600">@{shop.handle}</p>
                  <div className="flex items-center gap-4 mt-2 text-sm text-slate-500">
                    {shop.country && (
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {shop.country}
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      Joined {formatDate(shop.createdAt)}
                    </div>
                  </div>
                </div>
              </div>
              
              {isOwner && (
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/shop/${shop.handle}/settings`}>
                      <Settings className="h-4 w-4 mr-2" />
                      Settings
                    </Link>
                  </Button>
                  <Button size="sm" asChild>
                    <Link href={`/shop/${shop.handle}/products/new`}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Product
                    </Link>
                  </Button>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 mb-4">
              <Badge variant={shop.status === 'active' ? 'default' : 'secondary'}>
                {shop.status}
              </Badge>
              <Badge variant="outline">
                {shop.currency}
              </Badge>
            </div>

            {shop.bio && (
              <p className="text-slate-700 leading-relaxed">{shop.bio}</p>
            )}
          </div>

          {/* Shop Content */}
          <div className="grid gap-8 md:grid-cols-3">
            {/* Main Content */}
            <div className="md:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Products</CardTitle>
                  <CardDescription>
                    {isOwner ? 'Manage your products' : `Products from ${shop.name}`}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {productsLoading ? (
                    <div className="text-center py-12">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900 mx-auto mb-4"></div>
                      <p className="text-slate-600">Loading products...</p>
                    </div>
                  ) : products.length === 0 ? (
                    isOwner ? (
                      <div className="text-center py-12">
                        <Store className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-slate-900 mb-2">No products yet</h3>
                        <p className="text-slate-600 mb-4">Start selling by adding your first product.</p>
                        <Button asChild>
                          <Link href={`/shop/${shop.handle}/products/new`}>
                            <Plus className="h-4 w-4 mr-2" />
                            Add Your First Product
                          </Link>
                        </Button>
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <Store className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-slate-900 mb-2">No products available</h3>
                        <p className="text-slate-600">This shop hasn't added any products yet.</p>
                      </div>
                    )
                  ) : (
                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                      {products.map((product) => (
                        <ProductCard 
                          key={product.id} 
                          product={product} 
                          shop={shop}
                          showManagement={isOwner}
                        />
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Shop Info</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-medium text-slate-900 mb-1">Shop Handle</h4>
                    <p className="text-sm text-slate-600">@{shop.handle}</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-slate-900 mb-1">Currency</h4>
                    <p className="text-sm text-slate-600">{shop.currency}</p>
                  </div>
                  {shop.country && (
                    <div>
                      <h4 className="font-medium text-slate-900 mb-1">Location</h4>
                      <p className="text-sm text-slate-600">{shop.country}</p>
                    </div>
                  )}
                  <div>
                    <h4 className="font-medium text-slate-900 mb-1">Member Since</h4>
                    <p className="text-sm text-slate-600">
                      {formatDate(shop.createdAt)}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {shop.policy && (shop.policy.shipping || shop.policy.returns) && (
                <Card>
                  <CardHeader>
                    <CardTitle>Policies</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {shop.policy.shipping && (
                      <div>
                        <h4 className="font-medium text-slate-900 mb-1">Shipping</h4>
                        <p className="text-sm text-slate-600">{shop.policy.shipping}</p>
                      </div>
                    )}
                    {shop.policy.returns && (
                      <div>
                        <h4 className="font-medium text-slate-900 mb-1">Returns</h4>
                        <p className="text-sm text-slate-600">{shop.policy.returns}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
