import { notFound } from 'next/navigation'
import { getProduct, getShopByHandle } from '@/lib/firestore'
import { AuthProvider } from '@/components/auth/auth-provider'
import { ProductEditPage } from '@/components/product/product-edit-page'

interface ProductEditPageProps {
  params: {
    handle: string
    productId: string
  }
}

export async function generateMetadata({ params }: ProductEditPageProps) {
  const [product, shop] = await Promise.all([
    getProduct(params.productId),
    getShopByHandle(params.handle)
  ])
  
  if (!product || !shop || product.shopId !== shop.id) {
    return {
      title: 'Product Not Found - Auret'
    }
  }

  return {
    title: `Edit ${product.title} - ${shop.name} - Auret`,
    description: `Edit ${product.title} in ${shop.name} on Auret`
  }
}

export default async function ProductEdit({ params }: ProductEditPageProps) {
  const [product, shop] = await Promise.all([
    getProduct(params.productId),
    getShopByHandle(params.handle)
  ])

  if (!product || !shop || product.shopId !== shop.id) {
    notFound()
  }

  // Convert Firebase Timestamps to regular dates for client component
  const productWithDates = {
    ...product,
    createdAt: product.createdAt.toDate(),
    updatedAt: product.updatedAt.toDate()
  }

  const shopWithDates = {
    ...shop,
    createdAt: shop.createdAt.toDate(),
    updatedAt: shop.updatedAt.toDate()
  }

  return (
    <AuthProvider>
      <ProductEditPage product={productWithDates} shop={shopWithDates} />
    </AuthProvider>
  )
}
