'use client'

import { useState, useEffect } from 'react'
import Link from "next/link";
import { Navigation } from "@/components/navigation";
import { useAuth } from "@/components/auth/auth-provider";
import { getFeaturedProducts, getShopById } from '@/lib/firestore'
import { ProductCard } from '@/components/product/product-card-simple'

export function HomePage() {
  const { user } = useAuth();
  const [featuredProducts, setFeaturedProducts] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadFeaturedProducts() {
      try {
        const products = await getFeaturedProducts(8) // Get 8 featured products
        
        // Get shop info for each product
        const productsWithShops = await Promise.all(
          products.map(async (product) => {
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
        
        setFeaturedProducts(productsWithShops.filter(p => p.shop))
      } catch (error) {
        console.error('Error loading featured products:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadFeaturedProducts()
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      <Navigation user={user} />

      {/* Hero Section */}
      <main className="container mx-auto px-4 py-16">
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="text-5xl font-bold text-slate-900 mb-6">
            Creator-First Marketplace
          </h1>
          <p className="text-xl text-slate-600 mb-8">
            A marketplace for handmade and original-design goods plus digital craft assets. 
            Lower fees, no forced ads, predictable payouts, and a built-in community forum.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Link 
              href="/search"
              className="bg-slate-900 text-white px-8 py-3 rounded-lg hover:bg-slate-800 transition-colors"
            >
              Start Shopping
            </Link>
            <Link 
              href="/sell"
              className="border border-slate-300 text-slate-900 px-8 py-3 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Start Selling
            </Link>
          </div>

          {/* Featured Products */}
          {!isLoading && featuredProducts.length > 0 && (
            <div className="mt-16">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-3xl font-bold text-slate-900">Featured Products</h2>
                <Link 
                  href="/search"
                  className="text-slate-600 hover:text-slate-900 transition-colors"
                >
                  View All →
                </Link>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {featuredProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    shop={product.shop}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Features */}
          <div className="grid md:grid-cols-3 gap-8 mt-16">
            <div className="text-center">
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <h3 className="text-lg font-semibold mb-2">Lower Fees</h3>
                <p className="text-slate-600">
                  3.5% for physical goods, 4.5% for digital. No listing fees or forced ads.
                </p>
              </div>
            </div>
            <div className="text-center">
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <h3 className="text-lg font-semibold mb-2">Predictable Payouts</h3>
                <p className="text-slate-600">
                  T+2 payouts with no blanket reserves on digital goods.
                </p>
              </div>
            </div>
            <div className="text-center">
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <h3 className="text-lg font-semibold mb-2">Built-in Community</h3>
                <p className="text-slate-600">
                  Share techniques and build trust with our integrated forum.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t bg-white mt-16">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center text-slate-600">
            <p>&copy; 2024 Auret. A creator-first marketplace.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
