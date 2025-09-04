'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Navigation } from '@/components/navigation'
import { useAuth } from '@/components/auth/auth-provider'
import { getUserShop, getProductsByShop, updateProduct, Product, Shop } from '@/lib/firestore'
import { Button } from '@/components/ui/button'
import { ProductCard } from '@/components/product/product-card-simple'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { CurrencyMigrationTool } from './currency-migration-tool'
import { 
  Store, 
  Plus, 
  Package, 
  Eye, 
  EyeOff, 
  Edit, 
  Loader2,
  ShoppingBag,
  TrendingUp,
  DollarSign
} from 'lucide-react'
import Image from 'next/image'

// Using imported types from firestore

export function SellerDashboard() {
  const { user } = useAuth()
  const router = useRouter()
  const [shop, setShop] = useState<Shop | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isUpdating, setIsUpdating] = useState<string | null>(null)

  const loadSellerData = useCallback(async () => {
    if (!user) return
    
    setIsLoading(true)
    try {
      // Get user's shop
      const userShop = await getUserShop(user.uid)
      setShop(userShop)

      // If shop exists, get products
      if (userShop) {
        const shopProducts = await getProductsByShop(userShop.id)
        // Sort by createdAt descending on client side to avoid index requirement
        const sortedProducts = shopProducts.sort((a, b) => {
          const aTime = a.createdAt?.toMillis?.() || 0
          const bTime = b.createdAt?.toMillis?.() || 0
          return bTime - aTime
        })
        setProducts(sortedProducts)
      }
    } catch (error) {
      console.error('Error loading seller data:', error)
    } finally {
      setIsLoading(false)
    }
  }, [user])

  useEffect(() => {
    if (user) {
      loadSellerData()
    }
  }, [user])

  const toggleProductStatus = async (productId: string, currentStatus: string) => {
    setIsUpdating(productId)
    try {
      const newStatus = currentStatus === 'draft' ? 'active' : 'draft'
      await updateProduct(productId, { status: newStatus })
      
      // Update local state
      setProducts(products.map(p => 
        p.id === productId ? { ...p, status: newStatus as 'draft' | 'active' } : p
      ))
    } catch (error) {
      console.error('Error updating product status:', error)
    } finally {
      setIsUpdating(null)
    }
  }

  const draftProducts = products.filter(p => p.status === 'draft')
  const activeProducts = products.filter(p => p.status === 'active')

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
        <Navigation user={null} />
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-3xl font-bold text-slate-900 mb-4">Start Selling on Auret</h1>
          <p className="text-slate-600 mb-8">Please sign in to access your seller dashboard</p>
          <Button onClick={() => router.push('/auth/signin')}>
            Sign In to Continue
          </Button>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
        <Navigation user={user} />
        <div className="container mx-auto px-4 py-16 text-center">
          <Loader2 className="h-8 w-8 animate-spin text-slate-400 mx-auto mb-4" />
          <p className="text-slate-600">Loading your seller dashboard...</p>
        </div>
      </div>
    )
  }

  // No shop - show shop creation
  if (!shop) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
        <Navigation user={user} />
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-2xl mx-auto text-center">
            <Store className="h-16 w-16 text-slate-400 mx-auto mb-6" />
            <h1 className="text-3xl font-bold text-slate-900 mb-4">
              Start Your Shop on Auret
            </h1>
            <p className="text-lg text-slate-600 mb-8">
              Create your shop to start selling amazing products to customers around the world
            </p>
            
            <div className="bg-white rounded-lg shadow-sm border p-8 mb-8">
              <h2 className="text-xl font-semibold mb-4">What you&apos;ll get:</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                <div className="flex items-start gap-3">
                  <ShoppingBag className="h-5 w-5 text-green-500 mt-1" />
                  <div>
                    <h3 className="font-medium">Your Own Storefront</h3>
                    <p className="text-sm text-slate-600">Customizable shop page with your branding</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Package className="h-5 w-5 text-blue-500 mt-1" />
                  <div>
                    <h3 className="font-medium">Product Management</h3>
                    <p className="text-sm text-slate-600">Easy tools to add and manage your products</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <TrendingUp className="h-5 w-5 text-purple-500 mt-1" />
                  <div>
                    <h3 className="font-medium">Sales Analytics</h3>
                    <p className="text-sm text-slate-600">Track your performance and growth</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <DollarSign className="h-5 w-5 text-green-500 mt-1" />
                  <div>
                    <h3 className="font-medium">Secure Payments</h3>
                    <p className="text-sm text-slate-600">Get paid safely through Stripe</p>
                  </div>
                </div>
              </div>
            </div>

            <Button 
              size="lg" 
              onClick={() => router.push('/sell/shop/create')}
              className="mb-4"
            >
              <Store className="h-5 w-5 mr-2" />
              Create Your Shop
            </Button>
            
            <p className="text-sm text-slate-500">
              Already have a shop? <button className="text-blue-600 hover:underline" onClick={loadSellerData}>Refresh</button>
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Has shop - show product management
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      <Navigation user={user} />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Shop Header */}
          <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {shop.logoUrl && (
                  <div className="relative h-12 w-12 rounded-full overflow-hidden">
                    <Image 
                      src={shop.logoUrl} 
                      alt={shop.name} 
                      fill
                      sizes="48px"
                      className="object-cover"
                    />
                  </div>
                )}
                <div>
                  <h1 className="text-2xl font-bold text-slate-900">{shop.name}</h1>
                  <p className="text-slate-600">@{shop.handle}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => router.push(`/shop/${shop.handle}`)}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  View Shop
                </Button>
                <Button onClick={() => router.push(`/shop/${shop.handle}/products/new`)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Product
                </Button>
              </div>
            </div>
          </div>

          {/* Currency Migration Tool */}
          <CurrencyMigrationTool 
            products={products} 
            onUpdate={loadSellerData}
          />

          {/* Products Management */}
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="p-6 border-b">
              <h2 className="text-xl font-semibold mb-2">Product Management</h2>
              <p className="text-slate-600">Manage your products and publish drafts to make them visible in the marketplace</p>
            </div>

            <Tabs defaultValue="all" className="p-6">
              <TabsList className="mb-6">
                <TabsTrigger value="all">
                  All Products ({products.length})
                </TabsTrigger>
                <TabsTrigger value="draft">
                  Drafts ({draftProducts.length})
                </TabsTrigger>
                <TabsTrigger value="active">
                  Published ({activeProducts.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="all">
                <ProductList 
                  products={products} 
                  onToggleStatus={toggleProductStatus}
                  isUpdating={isUpdating}
                  shopHandle={shop.handle}
                />
              </TabsContent>
              
              <TabsContent value="draft">
                <ProductList 
                  products={draftProducts} 
                  onToggleStatus={toggleProductStatus}
                  isUpdating={isUpdating}
                  shopHandle={shop.handle}
                />
              </TabsContent>
              
              <TabsContent value="active">
                <ProductList 
                  products={activeProducts} 
                  onToggleStatus={toggleProductStatus}
                  isUpdating={isUpdating}
                  shopHandle={shop.handle}
                />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  )
}

function ProductList({ 
  products, 
  onToggleStatus, 
  isUpdating, 
  shopHandle 
}: { 
  products: Product[]
  onToggleStatus: (id: string, status: string) => void
  isUpdating: string | null
  shopHandle: string
}) {
  const router = useRouter()

  if (products.length === 0) {
    return (
      <div className="text-center py-12">
        <Package className="h-12 w-12 text-slate-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-slate-900 mb-2">No products yet</h3>
        <p className="text-slate-600 mb-4">Start by creating your first product</p>
        <Button onClick={() => router.push(`/shop/${shopHandle}/products/new`)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Product
        </Button>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {products.map((product) => (
        <div key={product.id} className="relative">
          <ProductCard 
            product={product}
            shop={{ handle: shopHandle, name: '', logoUrl: '' }}
          />
          
          {/* Status overlay */}
          <div className="absolute top-2 right-2 flex gap-2">
            <Badge variant={product.status === 'active' ? 'default' : 'secondary'}>
              {product.status === 'active' ? 'Published' : 'Draft'}
            </Badge>
          </div>

          {/* Action buttons */}
          <div className="absolute bottom-2 right-2 flex gap-1">
            <Button
              size="sm"
              variant="outline"
              onClick={() => router.push(`/shop/${shopHandle}/products/${product.id}/edit`)}
              className="bg-white/90 backdrop-blur-sm"
            >
              <Edit className="h-3 w-3" />
            </Button>
            
            <Button
              size="sm"
              variant={product.status === 'active' ? 'destructive' : 'default'}
              onClick={() => onToggleStatus(product.id, product.status)}
              disabled={isUpdating === product.id}
              className="bg-white/90 backdrop-blur-sm"
            >
              {isUpdating === product.id ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : product.status === 'active' ? (
                <EyeOff className="h-3 w-3" />
              ) : (
                <Eye className="h-3 w-3" />
              )}
            </Button>
          </div>
        </div>
      ))}
    </div>
  )
}
