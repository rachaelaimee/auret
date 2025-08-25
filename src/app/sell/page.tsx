import { Suspense } from 'react'
import { AuthProvider } from '@/components/auth/auth-provider'
import { SellerDashboard } from '@/components/seller/seller-dashboard'
import { Loader2 } from 'lucide-react'

export const metadata = {
  title: 'Sell on Auret - Seller Dashboard',
  description: 'Manage your shop, products, and start selling on Auret marketplace'
}

function SellerLoadingFallback() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400 mx-auto mb-4" />
        <p className="text-slate-600">Loading seller dashboard...</p>
      </div>
    </div>
  )
}

export default function SellPage() {
  return (
    <AuthProvider>
      <Suspense fallback={<SellerLoadingFallback />}>
        <SellerDashboard />
      </Suspense>
    </AuthProvider>
  )
}