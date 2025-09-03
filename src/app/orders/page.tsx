import { Metadata } from 'next'
import { AuthProvider } from '@/components/auth/auth-provider'
import { OrdersPage as OrdersPageComponent } from '@/components/orders/orders-page'

export const metadata: Metadata = {
  title: 'Your Orders | Auret',
  description: 'View your order history and track purchases',
}

export default function OrdersPage() {
  return (
    <AuthProvider>
      <OrdersPageComponent />
    </AuthProvider>
  )
}
