'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useUserProfile } from '@/hooks/use-user-profile'
import { Navigation } from '@/components/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Save } from 'lucide-react'
import { ProductEditForm } from './product-edit-form'

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
  ownerId: string
  handle: string
  name: string
  bio?: string
  logoUrl?: string
  country?: string
  currency: string
  status: 'active' | 'suspended'
  createdAt: Date
  updatedAt: Date
}

interface ProductEditPageProps {
  product: Product
  shop: Shop
}

export function ProductEditPage({ product, shop }: ProductEditPageProps) {
  const { user } = useUserProfile()
  const router = useRouter()

  // Check if user is the shop owner
  const isOwner = user?.uid === shop.ownerId

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Please sign in</h1>
          <p className="text-slate-600 mb-4">You need to be signed in to edit products.</p>
          <Button asChild>
            <Link href="/auth/signin">Sign In</Link>
          </Button>
        </div>
      </div>
    )
  }

  if (!isOwner) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Access Denied</h1>
          <p className="text-slate-600 mb-4">You don't have permission to edit this product.</p>
          <Button asChild>
            <Link href={`/shop/${shop.handle}/products/${product.id}`}>Back to Product</Link>
          </Button>
        </div>
      </div>
    )
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
              <Link href={`/shop/${shop.handle}/products/${product.id}`} className="hover:text-slate-900">{product.title}</Link>
              <span className="mx-2">→</span>
              <span>Edit</span>
            </nav>
          </div>

          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 mb-2">Edit Product</h1>
              <p className="text-slate-600">
                Update your product details, photos, and settings.
              </p>
            </div>
            <Button variant="outline" asChild>
              <Link href={`/shop/${shop.handle}/products/${product.id}`}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Product
              </Link>
            </Button>
          </div>

          {/* Edit Form */}
          <Card>
            <CardHeader>
              <CardTitle>Product Details</CardTitle>
              <CardDescription>
                Update your product information, photos, and settings.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ProductEditForm product={product} shop={shop} />
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
