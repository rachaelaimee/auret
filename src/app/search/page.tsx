import { AuthProvider } from '@/components/auth/auth-provider'
import { SearchPage } from '@/components/search/search-page'

export const metadata = {
  title: 'Search Products - Auret',
  description: 'Discover amazing handmade and digital products from creators on Auret'
}

export default function Search() {
  return (
    <AuthProvider>
      <SearchPage />
    </AuthProvider>
  )
}