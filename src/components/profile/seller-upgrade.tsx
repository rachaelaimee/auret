'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { UserProfile, upgradeToSeller } from '@/lib/firestore'
import { useUserProfile } from '@/hooks/use-user-profile'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Store, TrendingUp, Users, Shield } from 'lucide-react'

interface SellerUpgradeProps {
  profile: UserProfile
}

export function SellerUpgrade({ profile }: SellerUpgradeProps) {
  const { updateProfile } = useUserProfile()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleUpgrade = async () => {
    setIsLoading(true)
    setError(null)

    try {
      await upgradeToSeller(profile.id)
      await updateProfile({ role: 'seller' })
      
      // Redirect to seller onboarding
      router.push('/sell/onboard')
    } catch (err) {
      console.error('Error upgrading to seller:', err)
      setError('Failed to upgrade account. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="border-blue-200 bg-blue-50/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Store className="h-5 w-5 text-blue-600" />
          Become a Seller
        </CardTitle>
        <CardDescription>
          Start selling your handmade goods and digital assets on Auret
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid gap-4">
          <div className="flex items-start gap-3">
            <TrendingUp className="h-5 w-5 text-green-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-slate-900">Lower Fees</h4>
              <p className="text-sm text-slate-600">
                Only 3.5% for physical goods, 4.5% for digital. No listing fees.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Users className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-slate-900">Built-in Community</h4>
              <p className="text-sm text-slate-600">
                Connect with creators and share techniques in our forum.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Shield className="h-5 w-5 text-purple-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-slate-900">Predictable Payouts</h4>
              <p className="text-sm text-slate-600">
                T+2 payouts with no blanket reserves on digital goods.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border">
          <h4 className="font-medium text-slate-900 mb-2">Perfect for:</h4>
          <ul className="text-sm text-slate-600 space-y-1">
            <li>• Handmade jewelry, clothing, and accessories</li>
            <li>• Digital patterns for sewing, cosplay, and crafts</li>
            <li>• 3D printing files and STL models</li>
            <li>• Printables, presets, and digital templates</li>
          </ul>
        </div>

        <Button 
          onClick={handleUpgrade} 
          disabled={isLoading}
          className="w-full"
          size="lg"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Upgrading Account...
            </>
          ) : (
            <>
              <Store className="mr-2 h-4 w-4" />
              Upgrade to Seller Account
            </>
          )}
        </Button>

        <p className="text-xs text-slate-500 text-center">
          You can always switch back to a buyer account later
        </p>
      </CardContent>
    </Card>
  )
}
