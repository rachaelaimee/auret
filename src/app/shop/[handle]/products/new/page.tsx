import { notFound } from 'next/navigation'
import { getShopByHandle } from '@/lib/firestore'
import { AuthProvider } from '@/components/auth/auth-provider'
import { ProductCreatePage } from '@/components/product/product-create-page'

interface ProductCreatePageProps {
  params: {
    handle: string
  }
}

export async function generateMetadata({ params }: ProductCreatePageProps) {
  const shop = await getShopByHandle(params.handle)
  
  if (!shop) {
    return {
      title: 'Shop Not Found | Auret'
    }
  }

  return {
    title: `Add Product - ${shop.name} | Auret`,
    description: `Add a new product to ${shop.name} on Auret`
  }
}

export default async function ProductCreate({ params }: ProductCreatePageProps) {
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
      <ProductCreatePage shop={shopWithDates} />
    </AuthProvider>
  )
}
