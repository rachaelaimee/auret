import { AuthProvider } from '@/components/auth/auth-provider'
import { ShopCreatePage } from '@/components/shop/shop-create-page'

export const metadata = {
  title: 'Create Shop | Auret',
  description: 'Create your shop on Auret and start selling your products'
}

export default function CreateShop() {
  return (
    <AuthProvider>
      <ShopCreatePage />
    </AuthProvider>
  )
}
