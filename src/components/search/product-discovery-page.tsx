'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { Navigation } from '@/components/navigation'
import { useAuth } from '@/components/auth/auth-provider'
import { getAllActiveProducts, searchProducts, getShopById } from '@/lib/firestore'
import { ProductCard } from '@/components/product/product-card-simple'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Search, Filter, Loader2 } from 'lucide-react'

export function ProductDiscoveryPage() {
  const { user } = useAuth()
  const searchParams = useSearchParams()
  const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '')
  const [products, setProducts] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedType, setSelectedType] = useState<'all' | 'physical' | 'digital'>('all')

  useEffect(() => {
    loadProducts()
  }, [searchTerm, selectedType])

  const loadProducts = async () => {
    setIsLoading(true)
    try {
      let fetchedProducts

      if (searchTerm.trim()) {
        // Search for products
        fetchedProducts = await searchProducts(searchTerm.trim(), 50)
      } else {
        // Get all products
        fetchedProducts = await getAllActiveProducts(50)
      }

      // Filter by type if selected
      if (selectedType !== 'all') {
        fetchedProducts = fetchedProducts.filter(product => product.type === selectedType)
      }

      // Get shop info for each product
      const productsWithShops = await Promise.all(
        fetchedProducts.map(async (product) => {
          const shop = await getShopById(product.shopId)
          return {
            ...product,
            shop: shop ? {
              handle: shop.handle,
              name: shop.name,
              logoUrl: shop.logoUrl
            } : null
          }
        })
      )

      setProducts(productsWithShops.filter(p => p.shop))
    } catch (error) {
      console.error('Error loading products:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    loadProducts()
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      <Navigation user={user} />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-900 mb-2">
              {searchTerm ? `Search Results for "${searchTerm}"` : 'Discover Amazing Products'}
            </h1>
            <p className="text-slate-600">
              Find incredible handmade and digital products from talented creators
            </p>
          </div>

          {/* Search and Filters */}
          <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
            {/* Search Bar */}
            <form onSubmit={handleSearch} className="flex gap-4 mb-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                <Input
                  type="text"
                  placeholder="Search for amazing products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  'Search'
                )}
              </Button>
            </form>

            {/* Type Filters */}
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-slate-500" />
              <span className="text-sm text-slate-600 mr-2">Filter by type:</span>
              
              <button
                onClick={() => setSelectedType('all')}
                className={`px-3 py-1 rounded-full text-sm transition-colors ${
                  selectedType === 'all'
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                All Products
              </button>
              <button
                onClick={() => setSelectedType('physical')}
                className={`px-3 py-1 rounded-full text-sm transition-colors ${
                  selectedType === 'physical'
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Physical Items
              </button>
              <button
                onClick={() => setSelectedType('digital')}
                className={`px-3 py-1 rounded-full text-sm transition-colors ${
                  selectedType === 'digital'
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Digital Downloads
              </button>
            </div>
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="flex justify-center py-12">
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin text-slate-400 mx-auto mb-4" />
                <p className="text-slate-600">Finding amazing products...</p>
              </div>
            </div>
          )}

          {/* Results */}
          {!isLoading && (
            <>
              {/* Results Count */}
              <div className="mb-6">
                <p className="text-slate-600">
                  Found {products.length} amazing {products.length === 1 ? 'product' : 'products'}
                </p>
              </div>

              {/* Products Grid */}
              {products.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {products.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      shop={product.shop}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="text-slate-400 mb-4">
                    <Search className="h-12 w-12 mx-auto mb-4" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">
                    No products found
                  </h3>
                  <p className="text-slate-600 mb-4">
                    {searchTerm 
                      ? `No products match "${searchTerm}". Try different keywords or browse all products.`
                      : 'No products are currently available. Check back soon for amazing new items!'
                    }
                  </p>
                  {searchTerm && (
                    <Button 
                      variant="outline"
                      onClick={() => {
                        setSearchTerm('')
                        setSelectedType('all')
                      }}
                    >
                      Browse All Products
                    </Button>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  )
}
