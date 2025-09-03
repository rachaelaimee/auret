import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc,
  collection,
  query,
  where,
  getDocs,
  addDoc,
  orderBy,
  limit,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore'
import { db } from './firebase'

// User Profile Types
export interface UserProfile {
  id: string
  email: string
  name: string
  displayName?: string
  bio?: string
  location?: string
  avatarUrl?: string
  role: 'buyer' | 'seller' | 'admin'
  emailVerified: boolean
  createdAt: Timestamp
  updatedAt: Timestamp
  links?: { url: string; label: string }[]
}

export interface Shop {
  id: string
  ownerId: string
  handle: string
  name: string
  bio?: string
  bannerUrl?: string
  logoUrl?: string
  country?: string
  currency: string
  status: 'active' | 'suspended'
  stripeAccountId?: string
  stripeOnboardingComplete: boolean
  createdAt: Timestamp
  updatedAt: Timestamp
  policy?: {
    shipping?: string
    returns?: string
    privacy?: string
  }
}

export interface ProductPhoto {
  id: string
  url: string
  alt?: string
  order: number
}

export interface ProductVariant {
  id: string
  name: string
  options: Record<string, string> // e.g., { "Size": "Large", "Color": "Blue" }
  priceCents: number
  inventory?: number
  sku?: string
}

export interface Product {
  id: string
  shopId: string
  title: string
  description: string
  priceCents: number
  type: 'digital' | 'physical'
  status: 'draft' | 'active'
  photos: ProductPhoto[]
  variants?: ProductVariant[]
  categories?: string[]
  tags?: string[]
  inventory?: number
  sku?: string
  weight?: number // for shipping calculations
  dimensions?: {
    length: number
    width: number
    height: number
  }
  digitalFiles?: {
    name: string
    url: string
    size: number
  }[]
  createdAt: Timestamp
  updatedAt: Timestamp
}

// User Profile Functions
export async function createUserProfile(userId: string, userData: Partial<UserProfile>) {
  const userRef = doc(db, 'users', userId)
  const now = serverTimestamp()
  
  // Filter out undefined values to prevent Firestore errors
  const profileData: any = {
    email: userData.email || '',
    name: userData.name || '',
    role: userData.role || 'buyer',
    emailVerified: userData.emailVerified || false,
    createdAt: now,
    updatedAt: now,
    links: userData.links || []
  }
  
  // Only add optional fields if they have values
  if (userData.displayName) profileData.displayName = userData.displayName
  if (userData.bio) profileData.bio = userData.bio
  if (userData.location) profileData.location = userData.location
  if (userData.avatarUrl) profileData.avatarUrl = userData.avatarUrl
  
  await setDoc(userRef, profileData)
  return { id: userId, ...profileData }
}

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const userRef = doc(db, 'users', userId)
  const userSnap = await getDoc(userRef)
  
  if (userSnap.exists()) {
    return { id: userSnap.id, ...userSnap.data() } as UserProfile
  }
  
  return null
}

export async function updateUserProfile(userId: string, updates: Partial<UserProfile>) {
  const userRef = doc(db, 'users', userId)
  
  // Filter out undefined values
  const updateData: any = {
    updatedAt: serverTimestamp()
  }
  
  // Only add fields that are not undefined
  Object.keys(updates).forEach(key => {
    const value = updates[key as keyof UserProfile]
    if (value !== undefined) {
      updateData[key] = value
    }
  })
  
  await updateDoc(userRef, updateData)
}

export async function upgradeToSeller(userId: string) {
  await updateUserProfile(userId, { role: 'seller' })
}

// Shop Functions
export async function createShop(shopData: Omit<Shop, 'id' | 'createdAt' | 'updatedAt'>) {
  const shopsRef = collection(db, 'shops')
  const now = serverTimestamp()
  
  const shop = {
    ...shopData,
    createdAt: now,
    updatedAt: now
  }
  
  const docRef = await addDoc(shopsRef, shop)
  return { id: docRef.id, ...shop }
}

export async function getShopByHandle(handle: string): Promise<Shop | null> {
  const shopsRef = collection(db, 'shops')
  const q = query(shopsRef, where('handle', '==', handle))
  const querySnapshot = await getDocs(q)
  
  if (!querySnapshot.empty) {
    const doc = querySnapshot.docs[0]
    return { id: doc.id, ...doc.data() } as Shop
  }
  
  return null
}

export async function getShopById(shopId: string): Promise<Shop | null> {
  const shopRef = doc(db, 'shops', shopId)
  const shopDoc = await getDoc(shopRef)
  
  if (shopDoc.exists()) {
    return { id: shopDoc.id, ...shopDoc.data() } as Shop
  }
  
  return null
}

export async function getShopsByOwner(ownerId: string): Promise<Shop[]> {
  const shopsRef = collection(db, 'shops')
  const q = query(shopsRef, where('ownerId', '==', ownerId))
  const querySnapshot = await getDocs(q)
  
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as Shop[]
}

export async function updateShop(shopId: string, updates: Partial<Shop>) {
  const shopRef = doc(db, 'shops', shopId)
  const updateData = {
    ...updates,
    updatedAt: serverTimestamp()
  }
  
  await updateDoc(shopRef, updateData)
}

// Check if handle is available
export async function isHandleAvailable(handle: string): Promise<boolean> {
  const shop = await getShopByHandle(handle)
  return shop === null
}

// Product Functions
export async function createProduct(productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) {
  const productsRef = collection(db, 'products')
  const now = serverTimestamp()
  
  const product = {
    ...productData,
    createdAt: now,
    updatedAt: now
  }
  
  const docRef = await addDoc(productsRef, product)
  return { id: docRef.id, ...product }
}

export async function getProduct(productId: string): Promise<Product | null> {
  const productRef = doc(db, 'products', productId)
  const productSnap = await getDoc(productRef)
  
  if (productSnap.exists()) {
    return { id: productSnap.id, ...productSnap.data() } as Product
  }
  
  return null
}

export async function getProductsByShop(shopId: string): Promise<Product[]> {
  const productsRef = collection(db, 'products')
  const q = query(productsRef, where('shopId', '==', shopId))
  const querySnapshot = await getDocs(q)
  
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as Product[]
}

export async function updateProduct(productId: string, updates: Partial<Product>) {
  const productRef = doc(db, 'products', productId)
  
  // Filter out undefined values to prevent Firestore errors
  const cleanedUpdates = Object.fromEntries(
    Object.entries(updates).filter(([_, value]) => value !== undefined)
  )
  
  const updateData = {
    ...cleanedUpdates,
    updatedAt: serverTimestamp()
  }
  
  await updateDoc(productRef, updateData)
}

export async function deleteProduct(productId: string) {
  const productRef = doc(db, 'products', productId)
  await deleteDoc(productRef)
}

export async function getActiveProductsByShop(shopId: string): Promise<Product[]> {
  const productsRef = collection(db, 'products')
  const q = query(
    productsRef, 
    where('shopId', '==', shopId),
    where('status', '==', 'active')
  )
  const querySnapshot = await getDocs(q)
  
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as Product[]
}

// Get all active products for discovery
export async function getAllActiveProducts(limitCount?: number): Promise<Product[]> {
  const productsRef = collection(db, 'products')
  let q = query(
    productsRef,
    where('status', '==', 'active'),
    orderBy('createdAt', 'desc')
  )
  
  if (limitCount) {
    q = query(q, limit(limitCount))
  }
  
  const querySnapshot = await getDocs(q)
  
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as Product[]
}

// Search products by title and tags
export async function searchProducts(searchTerm: string, limitCount: number = 20): Promise<Product[]> {
  const productsRef = collection(db, 'products')
  const searchTermLower = searchTerm.toLowerCase()
  
  // Get all active products and filter client-side
  // Note: Firestore doesn't have full-text search, so we do basic filtering
  const q = query(
    productsRef,
    where('status', '==', 'active'),
    orderBy('createdAt', 'desc')
  )
  
  const querySnapshot = await getDocs(q)
  
  const allProducts = querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as Product[]
  
  // Filter products that match the search term
  const filteredProducts = allProducts.filter(product => {
    const titleMatch = product.title.toLowerCase().includes(searchTermLower)
    const tagMatch = product.tags?.some(tag => 
      tag.toLowerCase().includes(searchTermLower)
    ) || false
    
    return titleMatch || tagMatch
  })
  
  return filteredProducts.slice(0, limitCount)
}

// Get featured products (for homepage)
export async function getFeaturedProducts(limitCount: number = 12): Promise<Product[]> {
  // For now, just get recent active products
  // Later we can add a "featured" field to products
  return getAllActiveProducts(limitCount)
}

// Get user's shop
export async function getUserShop(userId: string): Promise<Shop | null> {
  const shopsRef = collection(db, 'shops')
  const q = query(shopsRef, where('ownerId', '==', userId))
  const querySnapshot = await getDocs(q)
  
  if (querySnapshot.empty) {
    return null
  }
  
  const shopDoc = querySnapshot.docs[0]
  return {
    id: shopDoc.id,
    ...shopDoc.data()
  } as Shop
}

// Get all products for a shop (including drafts)
export async function getShopProducts(shopId: string): Promise<Product[]> {
  const productsRef = collection(db, 'products')
  const q = query(
    productsRef,
    where('shopId', '==', shopId),
    orderBy('createdAt', 'desc')
  )
  const querySnapshot = await getDocs(q)
  
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as Product[]
}
