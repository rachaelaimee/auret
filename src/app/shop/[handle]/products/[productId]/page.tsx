import { notFound } from 'next/navigation'
import { getProduct, getShopByHandle } from '@/lib/firestore'
import { AuthProvider } from '@/components/auth/auth-provider'
import { ProductPage } from '@/components/product/product-page'

interface ProductPageProps {
  params: {
    handle: string
    productId: string
  }
}

export async function generateMetadata({ params }: ProductPageProps) {
  const [product, shop] = await Promise.all([
    getProduct(params.productId),
    getShopByHandle(params.handle)
  ])

  if (!product || !shop) {
    return {
      title: 'Product Not Found | Auret'
    }
  }

  return {
    title: `${product.title} - ${shop.name} | Auret`,
    description: product.description || `${product.title} from ${shop.name} on Auret`
  }
}

export default async function Product({ params }: ProductPageProps) {
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
      <ProductPage product={productWithDates} shop={shopWithDates} />
    </AuthProvider>
  )
}
