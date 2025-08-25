import { notFound } from 'next/navigation'
import { getShopByHandle } from '@/lib/firestore'
import { AuthProvider } from '@/components/auth/auth-provider'
import { ShopSettingsPage } from '@/components/shop/shop-settings-page'

interface ShopSettingsPageProps {
  params: {
    handle: string
  }
}

export async function generateMetadata({ params }: ShopSettingsPageProps) {
  const shop = await getShopByHandle(params.handle)
  
  if (!shop) {
    return {
      title: 'Shop Not Found - Auret'
    }
  }

  return {
    title: `${shop.name} Settings - Auret`,
    description: `Manage settings for ${shop.name} on Auret`
  }
}

export default async function ShopSettings({ params }: ShopSettingsPageProps) {
  const shop = await getShopByHandle(params.handle)

  if (!shop) {
    notFound()
  }

  // Convert Firebase Timestamps to regular dates for client component
  const shopWithDates = {
    ...shop,
    createdAt: shop.createdAt.toDate(),
    updatedAt: shop.updatedAt.toDate()
  }

  return (
    <AuthProvider>
      <ShopSettingsPage shop={shopWithDates} />
    </AuthProvider>
  )
}
