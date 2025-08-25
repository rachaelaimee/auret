'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useUserProfile } from '@/hooks/use-user-profile'
import { Navigation } from '@/components/navigation'
import { ProductCreateForm } from './product-create-form'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft } from 'lucide-react'

// Shop with converted dates for client component
type ShopWithDates = {
  id: string
  ownerId: string
  handle: string
  name: string
  bio?: string
  bannerUrl?: string
  logoUrl?: string
  country?: string
  currency: string
  status: 'active' | 'suspended'
  stripeAccountId?: string
  stripeOnboardingComplete: boolean
  createdAt: Date
  updatedAt: Date
  policy?: {
    shipping?: string
    returns?: string
    privacy?: string
  }
}

interface ProductCreatePageProps {
  shop: ShopWithDates
}

export function ProductCreatePage({ shop }: ProductCreatePageProps) {
  const { profile, loading, user } = useUserProfile()
  const router = useRouter()
  const [isOwner, setIsOwner] = useState(false)

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/signin')
    }
    if (!loading && profile?.role !== 'seller') {
      router.push('/profile') // Redirect to upgrade to seller
    }
    if (user) {
      setIsOwner(user.uid === shop.ownerId)
    }
  }, [user, profile, loading, router, shop.ownerId])

  useEffect(() => {
    if (!loading && user && profile?.role === 'seller' && !isOwner) {
      // Not the shop owner, redirect to the shop page
      router.push(`/shop/${shop.handle}`)
    }
  }, [isOwner, loading, user, profile, router, shop.handle])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-slate-900"></div>
          <p className="mt-4 text-slate-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user || !profile || profile.role !== 'seller' || !isOwner) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      <Navigation user={user} />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Breadcrumb */}
          <div className="mb-6">
            <nav className="text-sm text-slate-600">
              <Link href="/dashboard" className="hover:text-slate-900">Dashboard</Link>
              <span className="mx-2">→</span>
              <Link href={`/shop/${shop.handle}`} className="hover:text-slate-900">{shop.name}</Link>
              <span className="mx-2">→</span>
              <span>Add Product</span>
            </nav>
          </div>

          {/* Back Button */}
          <div className="mb-6">
            <Link 
              href={`/shop/${shop.handle}`}
              className="inline-flex items-center text-slate-600 hover:text-slate-900 transition-colors"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to {shop.name}
            </Link>
          </div>

          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Add New Product</h1>
            <p className="text-slate-600">
              Create a new product listing for your shop. You can always edit it later.
            </p>
          </div>

          <div className="grid gap-8 lg:grid-cols-3">
            {/* Main Form */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Product Details</CardTitle>
                  <CardDescription>
                    Fill in the information about your product
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ProductCreateForm shop={shop} />
                </CardContent>
              </Card>
            </div>

            {/* Tips Sidebar */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">💡 Product Tips</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-sm">Great Photos</h4>
                    <p className="text-sm text-slate-600">Use good lighting and multiple angles. First photo becomes your main image.</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm">Clear Titles</h4>
                    <p className="text-sm text-slate-600">Be descriptive and specific. Include key materials, colors, or sizes.</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm">Detailed Descriptions</h4>
                    <p className="text-sm text-slate-600">Explain materials, dimensions, care instructions, and your process.</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">📦 Product Types</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <h4 className="font-semibold text-sm">Physical Products</h4>
                    <p className="text-sm text-slate-600">Handmade items that need shipping. Include weight and dimensions.</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm">Digital Products</h4>
                    <p className="text-sm text-slate-600">Downloadable files like patterns, templates, or digital art.</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
