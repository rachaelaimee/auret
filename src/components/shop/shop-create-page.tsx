'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useUserProfile } from '@/hooks/use-user-profile'
import { Navigation } from '@/components/navigation'
import { ShopCreateForm } from './shop-create-form'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export function ShopCreatePage() {
  const { profile, loading, user } = useUserProfile()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/signin')
    }
    if (!loading && profile?.role !== 'seller') {
      router.push('/profile') // Redirect to upgrade to seller
    }
  }, [user, profile, loading, router])

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

  if (!user || !profile || profile.role !== 'seller') {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      <Navigation user={user} />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Breadcrumb */}
          <div className="mb-6">
            <nav className="text-sm text-slate-600">
              <Link href="/dashboard" className="hover:text-slate-900">Dashboard</Link>
              <span className="mx-2">→</span>
              <span>Create Shop</span>
            </nav>
          </div>

          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Create Your Shop</h1>
            <p className="text-slate-600">
              Set up your shop to start selling your amazing products on Auret.
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Shop Details</CardTitle>
              <CardDescription>
                Choose your shop handle, name, and customize your shop's appearance.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ShopCreateForm />
            </CardContent>
          </Card>

          {/* Tips Card */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-lg">💡 Tips for Success</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <h4 className="font-semibold text-sm">Choose a memorable handle</h4>
                <p className="text-sm text-slate-600">Your handle will be part of your shop URL and should be easy to remember and type.</p>
              </div>
              <div>
                <h4 className="font-semibold text-sm">Write a compelling shop name</h4>
                <p className="text-sm text-slate-600">Your shop name appears prominently and should reflect your brand.</p>
              </div>
              <div>
                <h4 className="font-semibold text-sm">Add a detailed bio</h4>
                <p className="text-sm text-slate-600">Tell customers about your story, your process, and what makes your products special.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
