'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useUserProfile } from '@/hooks/use-user-profile'
import { Navigation } from '@/components/navigation'
import { ProfileForm } from './profile-form'
import { SellerUpgrade } from './seller-upgrade'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export function ProfilePage() {
  const { profile, loading, user } = useUserProfile()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/signin')
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-slate-900"></div>
          <p className="mt-4 text-slate-600">Loading profile...</p>
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
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-900">Profile Settings</h1>
            <p className="text-slate-600 mt-2">Manage your account information and preferences</p>
          </div>

          <div className="grid gap-8 md:grid-cols-2">
            {/* Profile Information */}
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>
                  Update your personal information and how others see you on Auret
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ProfileForm profile={profile} />
              </CardContent>
            </Card>

            {/* Account & Role */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Account Details</CardTitle>
                  <CardDescription>
                    Your account information and current role
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-slate-700">Email</label>
                    <p className="text-slate-900">{profile.email}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700">Current Role</label>
                    <p className="text-slate-900 capitalize">{profile.role}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700">Member Since</label>
                    <p className="text-slate-900">
                      {profile.createdAt?.toDate?.()?.toLocaleDateString() || 'Recently'}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Seller Upgrade */}
              {profile.role === 'buyer' && (
                <SellerUpgrade profile={profile} />
              )}

              {/* Seller Dashboard Link */}
              {profile.role === 'seller' && (
                <Card>
                  <CardHeader>
                    <CardTitle>Seller Dashboard</CardTitle>
                    <CardDescription>
                      Manage your shops, products, and sales
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <a 
                      href="/sell" 
                      className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground shadow hover:bg-primary/90 h-9 px-4 py-2"
                    >
                      Go to Seller Dashboard
                    </a>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
