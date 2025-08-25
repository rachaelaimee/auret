'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useUserProfile } from '@/hooks/use-user-profile'
import { Navigation } from '@/components/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle, Store, CreditCard, Package } from 'lucide-react'
import Link from 'next/link'

export function SellerOnboardingPage() {
  const { profile, loading, user } = useUserProfile()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/signin')
    }
    // Allow access to onboarding for both sellers and buyers who want to learn
    // if (!loading && profile?.role !== 'seller') {
    //   router.push('/profile')
    // }
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

  if (!user || !profile) {
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
              <span>Seller Guide</span>
            </nav>
          </div>
          <div className="text-center mb-12">
            <div className="flex justify-center mb-6">
              <div className="bg-green-100 p-4 rounded-full">
                <CheckCircle className="h-12 w-12 text-green-600" />
              </div>
            </div>
            <h1 className="text-4xl font-bold text-slate-900 mb-4">
              {profile.role === 'seller' ? 'Seller Resources & Guide 🎉' : 'Welcome to Auret Sellers! 🎉'}
            </h1>
            <p className="text-xl text-slate-600">
              {profile.role === 'seller' 
                ? 'Everything you need to succeed as a seller on Auret. Bookmark this page for future reference!'
                : "You're now a seller! Let's get you set up to start selling your amazing creations."
              }
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3 mb-12">
            <Card className="text-center">
              <CardHeader>
                <div className="flex justify-center mb-4">
                  <Store className="h-8 w-8 text-blue-600" />
                </div>
                <CardTitle>1. Create Your Shop</CardTitle>
                <CardDescription>
                  Set up your shop with a unique handle, branding, and policies
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/sell/shop/create">
                  <Button className="w-full">Create Shop</Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <div className="flex justify-center mb-4">
                  <Package className="h-8 w-8 text-purple-600" />
                </div>
                <CardTitle>2. List Products</CardTitle>
                <CardDescription>
                  Add your handmade goods and digital assets to your shop
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full" disabled>
                  Coming Next
                </Button>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <div className="flex justify-center mb-4">
                  <CreditCard className="h-8 w-8 text-green-600" />
                </div>
                <CardTitle>3. Set Up Payments</CardTitle>
                <CardDescription>
                  Connect Stripe to receive payouts from your sales
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full" disabled>
                  Coming Soon
                </Button>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-blue-50 border-blue-200">
            <CardHeader>
              <CardTitle className="text-blue-900">Seller Resources</CardTitle>
              <CardDescription className="text-blue-700">
                Everything you need to succeed on Auret
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <h4 className="font-medium text-blue-900 mb-2">Getting Started</h4>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• Photography tips for your products</li>
                    <li>• Writing compelling product descriptions</li>
                    <li>• Pricing strategies for makers</li>
                    <li>• Understanding Auret fees</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium text-blue-900 mb-2">Community</h4>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• Join the Sellers Forum</li>
                    <li>• Share your craft techniques</li>
                    <li>• Connect with other creators</li>
                    <li>• Get feedback on your work</li>
                  </ul>
                </div>
              </div>
              <div className="pt-4 border-t border-blue-200">
                <Link href="/forum">
                  <Button variant="outline" className="border-blue-300 text-blue-700 hover:bg-blue-100">
                    Visit Community Forum
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
