import { Metadata } from 'next'
import { AuthProvider } from '@/components/auth/auth-provider'
import { SellerOnboardingPage } from '@/components/seller/seller-onboarding-page'

export const metadata: Metadata = {
  title: 'Seller Onboarding | Auret',
  description: 'Set up your seller account and create your first shop',
}

export default function SellerOnboarding() {
  return (
    <AuthProvider>
      <SellerOnboardingPage />
    </AuthProvider>
  )
}
