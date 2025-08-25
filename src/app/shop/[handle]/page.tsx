import { notFound } from 'next/navigation'
import { getShopByHandle } from '@/lib/firestore'
import { AuthProvider } from '@/components/auth/auth-provider'
import { ShopPage } from '@/components/shop/shop-page'

interface ShopPageProps {
  params: {
    handle: string
  }
}

export async function generateMetadata({ params }: ShopPageProps) {
  const shop = await getShopByHandle(params.handle)
  
  if (!shop) {
    return {
      title: 'Shop Not Found | Auret'
    }
  }

  return {
    title: `${shop.name} | Auret`,
    description: shop.bio || `Shop ${shop.name} on Auret - handmade and digital products`
  }
}

export default async function Shop({ params }: ShopPageProps) {
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
      <ShopPage shop={shopWithDates} />
    </AuthProvider>
  )
}
