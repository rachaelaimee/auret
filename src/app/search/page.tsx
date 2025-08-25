import { Suspense } from 'react'
import { AuthProvider } from '@/components/auth/auth-provider'
import { SearchPage } from '@/components/search/search-page'
import { Loader2 } from 'lucide-react'

export const metadata = {
  title: 'Search Products - Auret',
  description: 'Discover amazing handmade and digital products from creators on Auret'
}

function SearchPageFallback() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400 mx-auto mb-4" />
        <p className="text-slate-600">Loading search...</p>
      </div>
    </div>
  )
}

export default function Search() {
  return (
    <AuthProvider>
      <Suspense fallback={<SearchPageFallback />}>
        <SearchPage />
      </Suspense>
    </AuthProvider>
  )
}