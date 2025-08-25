'use client'

import { User } from 'firebase/auth'
import { useRouter } from 'next/navigation'
import { logOut } from '@/lib/auth-client'
import { useUserProfile } from '@/hooks/use-user-profile'
import { useUserShops } from '@/hooks/use-user-shops'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { Store } from 'lucide-react'

interface DashboardContentProps {
  user: User
}

export function DashboardContent({ user }: DashboardContentProps) {
  const router = useRouter()
  const { profile } = useUserProfile()
  const { shops, loading: shopsLoading } = useUserShops()

  const handleSignOut = async () => {
    await logOut()
    router.push('/')
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      <header className="border-b bg-white/80 backdrop-blur">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-2xl font-bold text-slate-900">
              Auret
            </Link>
            <div className="flex items-center space-x-4">
              <span className="text-slate-600">Welcome, {user.displayName || user.email}</span>
              <Button variant="outline" onClick={handleSignOut}>
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-slate-600 mt-2">Manage your creator account and listings</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Your Profile</CardTitle>
              <CardDescription>
                Manage your account settings and profile information
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <p><strong>Email:</strong> {user.email}</p>
                <p><strong>Name:</strong> {profile?.name || user.displayName || 'Not set'}</p>
                <p><strong>Role:</strong> {profile?.role || 'buyer'}</p>
                {profile?.bio && (
                  <p><strong>Bio:</strong> {profile.bio}</p>
                )}
              </div>
              <Link href="/profile">
                <Button className="mt-4" variant="outline">
                  Edit Profile
                </Button>
              </Link>
            </CardContent>
          </Card>

{profile?.role === 'seller' ? (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Your Shops</CardTitle>
                  <CardDescription>
                    Manage your shops and view performance
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {shopsLoading ? (
                    <p className="text-sm text-slate-600">Loading shops...</p>
                  ) : shops.length === 0 ? (
                    <div className="text-center py-6">
                      <Store className="h-8 w-8 text-slate-400 mx-auto mb-3" />
                      <p className="text-sm text-slate-600 mb-3">No shops yet</p>
                      <Link href="/sell/shop/create">
                        <Button size="sm">Create Your First Shop</Button>
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {shops.map((shop) => (
                        <div key={shop.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center space-x-3">
                            <div className="h-10 w-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                              <Store className="h-5 w-5 text-white" />
                            </div>
                            <div>
                              <h4 className="font-medium text-slate-900">{shop.name}</h4>
                              <p className="text-sm text-slate-600">@{shop.handle}</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge variant={shop.status === 'active' ? 'default' : 'secondary'}>
                              {shop.status}
                            </Badge>
                            <Link href={`/shop/${shop.handle}`}>
                              <Button size="sm" variant="outline">View</Button>
                            </Link>
                          </div>
                        </div>
                      ))}
                      <div className="flex gap-2 pt-2">
                        <Link href="/sell/shop/create">
                          <Button size="sm">Create Another Shop</Button>
                        </Link>
                        <Link href="/sell/onboard">
                          <Button size="sm" variant="outline">Seller Guide</Button>
                        </Link>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Start Selling</CardTitle>
                <CardDescription>
                  Create your shop and start listing products
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-600 mb-4">
                  Ready to join the creator-first marketplace? Set up your shop and start selling your handmade goods and digital assets.
                </p>
                <Link href="/sell">
                  <Button>Create Shop</Button>
                </Link>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Browse Products</CardTitle>
              <CardDescription>
                Discover amazing products from other creators
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-600 mb-4">
                Explore the marketplace and find unique handmade items and digital craft assets.
              </p>
              <Link href="/browse">
                <Button variant="outline">Browse Products</Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Community Forum</CardTitle>
              <CardDescription>
                Connect with other creators and share knowledge
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-600 mb-4">
                Join discussions, share techniques, and build relationships with fellow creators.
              </p>
              <Link href="/forum">
                <Button variant="outline">Visit Forum</Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Your Orders</CardTitle>
              <CardDescription>
                Track your purchases and downloads
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-600 mb-4">
                View your order history, track shipments, and access digital downloads.
              </p>
              <Link href="/orders">
                <Button variant="outline">View Orders</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
