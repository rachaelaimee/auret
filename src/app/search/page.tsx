import { Suspense } from 'react'
import { AuthProvider } from '@/components/auth/auth-provider'
import { ProductDiscoveryPage } from '@/components/search/product-discovery-page'
import { Loader2 } from 'lucide-react'

export const metadata = {
  title: 'Search Products - Auret Marketplace',
  description: 'Discover amazing handmade and digital products from creators on Auret marketplace'
}

function SearchLoadingFallback() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400 mx-auto mb-4" />
        <p className="text-slate-600">Loading search...</p>
      </div>
    </div>
  )
}

export default function SearchProducts() {
  return (
    <AuthProvider>
      <Suspense fallback={<SearchLoadingFallback />}>
        <ProductDiscoveryPage />
      </Suspense>
    </AuthProvider>
  )
}
