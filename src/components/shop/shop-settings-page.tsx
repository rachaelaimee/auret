'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useUserProfile } from '@/hooks/use-user-profile'
import { Navigation } from '@/components/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Save } from 'lucide-react'
import { Shop } from '@/lib/firestore'
import { ShopSettingsForm } from '@/components/shop/shop-settings-form'
import { ShippingSettings } from '@/components/shop/shipping-settings'
import { ShippingTiers } from '@/components/shop/shipping-tiers'

interface ShopSettingsPageProps {
  shop: Shop & {
    createdAt: Date
    updatedAt: Date
  }
}

export function ShopSettingsPage({ shop }: ShopSettingsPageProps) {
  const { user } = useUserProfile()
  const router = useRouter()

  // Check if user is the shop owner
  const isOwner = user?.uid === shop.ownerId

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Please sign in</h1>
          <p className="text-slate-600 mb-4">You need to be signed in to access shop settings.</p>
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
          <p className="text-slate-600 mb-4">You don't have permission to access these settings.</p>
          <Button asChild>
            <Link href={`/shop/${shop.handle}`}>Back to Shop</Link>
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
              <span>Settings</span>
            </nav>
          </div>

          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 mb-2">Shop Settings</h1>
              <p className="text-slate-600">
                Manage your shop's information, appearance, and preferences.
              </p>
            </div>
            <Button variant="outline" asChild>
              <Link href={`/shop/${shop.handle}`}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Shop
              </Link>
            </Button>
          </div>

          {/* Settings Forms */}
          <div className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle>Shop Information</CardTitle>
                <CardDescription>
                  Update your shop's basic information, logo, and description.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ShopSettingsForm shop={shop} />
              </CardContent>
            </Card>

            <ShippingSettings shop={shop} />
            
            <ShippingTiers shop={shop} />
          </div>
        </div>
      </main>
    </div>
  )
}
