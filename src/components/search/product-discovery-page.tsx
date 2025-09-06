'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { Navigation } from '@/components/navigation'
import { useAuth } from '@/components/auth/auth-provider'
import { getAllActiveProducts, searchProducts, getShopById } from '@/lib/firestore'
import { ProductCard } from '@/components/product/product-card-simple'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Search, Filter, Loader2, SlidersHorizontal, ArrowUpDown } from 'lucide-react'

export function ProductDiscoveryPage() {
  const { user } = useAuth()
  const searchParams = useSearchParams()
  const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '')
  const [products, setProducts] = useState<any[]>([])
  const [filteredProducts, setFilteredProducts] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedType, setSelectedType] = useState<'all' | 'physical' | 'digital'>('all')
  const [sortBy, setSortBy] = useState<'newest' | 'price-low' | 'price-high' | 'popular'>('newest')
  const [priceRange, setPriceRange] = useState<'all' | 'under-25' | '25-100' | '100-500' | 'over-500'>('all')

  useEffect(() => {
    loadProducts()
  }, [searchTerm, selectedType])

  // Apply filters and sorting when products or filters change
  useEffect(() => {
    let filtered = [...products]

    // Apply price range filter
    if (priceRange !== 'all') {
      filtered = filtered.filter(product => {
        const price = product.price || 0
        switch (priceRange) {
          case 'under-25': return price < 25
          case '25-100': return price >= 25 && price <= 100
          case '100-500': return price >= 100 && price <= 500
          case 'over-500': return price > 500
          default: return true
        }
      })
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'price-low': return (a.price || 0) - (b.price || 0)
        case 'price-high': return (b.price || 0) - (a.price || 0)
        case 'popular': return (b.views || 0) - (a.views || 0)
        case 'newest':
        default:
          return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
      }
    })

    setFilteredProducts(filtered)
  }, [products, priceRange, sortBy])

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
              id: shop.id,  // ✅ Include shop ID for cart functionality
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
            <form onSubmit={handleSearch} className="flex gap-4 mb-6">
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

            {/* Filters Row 1: Product Type */}
            <div className="flex items-center gap-2 mb-4">
              <Filter className="h-4 w-4 text-slate-500" />
              <span className="text-sm text-slate-600 mr-2">Product type:</span>
              
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

            {/* Filters Row 2: Price and Sorting */}
            <div className="flex flex-wrap items-center gap-4">
              {/* Price Range Filter */}
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="h-4 w-4 text-slate-500" />
                <span className="text-sm text-slate-600">Price:</span>
                <Select value={priceRange} onValueChange={(value: any) => setPriceRange(value)}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Prices</SelectItem>
                    <SelectItem value="under-25">Under $25</SelectItem>
                    <SelectItem value="25-100">$25 - $100</SelectItem>
                    <SelectItem value="100-500">$100 - $500</SelectItem>
                    <SelectItem value="over-500">Over $500</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Sort By */}
              <div className="flex items-center gap-2">
                <ArrowUpDown className="h-4 w-4 text-slate-500" />
                <span className="text-sm text-slate-600">Sort by:</span>
                <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                  <SelectTrigger className="w-36">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Newest First</SelectItem>
                    <SelectItem value="price-low">Price: Low to High</SelectItem>
                    <SelectItem value="price-high">Price: High to Low</SelectItem>
                    <SelectItem value="popular">Most Popular</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Clear Filters */}
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  setPriceRange('all')
                  setSortBy('newest')
                  setSelectedType('all')
                  setSearchTerm('')
                }}
                className="ml-auto"
              >
                Clear All Filters
              </Button>
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
              <div className="mb-6 flex justify-between items-center">
                <p className="text-slate-600">
                  Showing {filteredProducts.length} of {products.length} amazing {products.length === 1 ? 'product' : 'products'}
                </p>
                {filteredProducts.length !== products.length && (
                  <p className="text-sm text-slate-500">
                    {products.length - filteredProducts.length} products filtered out
                  </p>
                )}
              </div>

              {/* Products Grid */}
              {filteredProducts.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {filteredProducts.map((product) => (
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
                    {products.length > 0 ? 'No products match your filters' : 'No products found'}
                  </h3>
                  <p className="text-slate-600 mb-4">
                    {products.length > 0 
                      ? 'Try adjusting your filters or search terms to see more products.'
                      : searchTerm 
                        ? `No products match "${searchTerm}". Try different keywords or browse all products.`
                        : 'No products are currently available. Check back soon for amazing new items!'
                    }
                  </p>
                  {(searchTerm || selectedType !== 'all' || priceRange !== 'all' || sortBy !== 'newest') && (
                    <Button 
                      variant="outline"
                      onClick={() => {
                        setSearchTerm('')
                        setSelectedType('all')
                        setPriceRange('all')
                        setSortBy('newest')
                      }}
                    >
                      Clear All Filters
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
