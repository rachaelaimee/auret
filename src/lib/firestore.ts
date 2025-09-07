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
  shippingRates?: {
    domestic: {
      enabled: boolean
      rate: number // in cents
      freeThreshold?: number // free shipping over this amount in cents
    }
    international: {
      enabled: boolean
      rate: number // in cents
      freeThreshold?: number
    }
  }
  shippingTiers?: {
    id: string
    name: string // e.g., "Prints", "Small Parcels", "Large Items"
    description?: string // e.g., "Documents, prints, and flat items"
    domesticRate: number // in cents
    internationalRate: number // in cents
    enabled: boolean
    maxWeight?: number // in grams (optional)
    maxDimensions?: { // in cm (optional)
      length: number
      width: number
      height: number
    }
  }[]
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
  shippingTierId?: string // which shipping tier this product uses
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

// Tutorial Types and Functions
export interface Tutorial {
  id: string
  authorId: string
  authorName: string
  shopId?: string // Optional - links to author's shop
  shopHandle?: string
  title: string
  description: string
  content: string // Rich text/markdown content
  category: string // e.g., 'knitting', 'woodworking', 'jewelry'
  tags: string[]
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  estimatedTime: string // e.g., '2 hours', '1 day'
  materials: string[] // List of materials needed
  tools: string[] // List of tools needed
  images: {
    id: string
    url: string
    alt?: string
    order: number
  }[]
  status: 'draft' | 'published'
  likes: number
  views: number
  createdAt: Timestamp
  updatedAt: Timestamp
}

export interface TutorialComment {
  id: string
  tutorialId: string
  authorId: string
  authorName: string
  content: string
  parentId?: string // For nested replies
  likes: number
  createdAt: Timestamp
  updatedAt: Timestamp
}

// Order Types and Functions
export interface OrderItem {
  id: string
  productId: string
  title: string
  type: 'digital' | 'physical'
  quantity: number
  unitPriceCents: number
  shopId: string
  shopName: string
  shopHandle: string
  variantId?: string
}

export interface Order {
  id: string
  buyerId: string
  totalCents: number
  currency: string
  status: 'pending' | 'paid' | 'fulfilled' | 'completed' | 'refunded' | 'disputed'
  items: OrderItem[]
  shippingAddress?: {
    name: string
    line1: string
    line2?: string
    city: string
    state: string
    postal_code: string
    country: string
  }
  stripePaymentIntentId?: string
  createdAt: Timestamp
  updatedAt: Timestamp
}

// Create a new order
export async function createOrder(orderData: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>) {
  const ordersRef = collection(db, 'orders')
  const now = serverTimestamp()
  
  const order = {
    ...orderData,
    createdAt: now,
    updatedAt: now
  }
  
  const docRef = await addDoc(ordersRef, order)
  return { id: docRef.id, ...order }
}

// Get orders for a user (buyer)
export async function getUserOrders(userId: string): Promise<Order[]> {
  const ordersRef = collection(db, 'orders')
  const q = query(
    ordersRef,
    where('buyerId', '==', userId),
    orderBy('createdAt', 'desc')
  )
  const querySnapshot = await getDocs(q)
  
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as Order[]
}

// Tutorial Functions

// Create a new tutorial
export async function createTutorial(tutorialData: Omit<Tutorial, 'id' | 'createdAt' | 'updatedAt' | 'likes' | 'views'>) {
  const tutorial = {
    ...tutorialData,
    likes: 0,
    views: 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }

  const docRef = await addDoc(collection(db, 'tutorials'), tutorial)
  return { id: docRef.id, ...tutorial }
}

// Get all published tutorials
export async function getPublishedTutorials(limitCount?: number): Promise<Tutorial[]> {
  try {
    const tutorialsRef = collection(db, 'tutorials')
    const q = limitCount 
      ? query(tutorialsRef, where('status', '==', 'published'), orderBy('createdAt', 'desc'), limit(limitCount))
      : query(tutorialsRef, where('status', '==', 'published'), orderBy('createdAt', 'desc'))
    
    const querySnapshot = await getDocs(q)
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Tutorial[]
  } catch (error: any) {
    // If collection doesn't exist yet, return empty array
    if (error.code === 'failed-precondition' || error.code === 'not-found') {
      console.log('Tutorials collection does not exist yet, returning empty array')
      return []
    }
    throw error
  }
}

// Get tutorials by category
export async function getTutorialsByCategory(category: string): Promise<Tutorial[]> {
  const tutorialsRef = collection(db, 'tutorials')
  const q = query(
    tutorialsRef, 
    where('status', '==', 'published'),
    where('category', '==', category),
    orderBy('createdAt', 'desc')
  )
  const querySnapshot = await getDocs(q)
  
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as Tutorial[]
}

// Get tutorials by author
export async function getTutorialsByAuthor(authorId: string): Promise<Tutorial[]> {
  const tutorialsRef = collection(db, 'tutorials')
  const q = query(
    tutorialsRef,
    where('authorId', '==', authorId),
    orderBy('createdAt', 'desc')
  )
  const querySnapshot = await getDocs(q)
  
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as Tutorial[]
}

// Get a specific tutorial
export async function getTutorial(tutorialId: string): Promise<Tutorial | null> {
  const tutorialRef = doc(db, 'tutorials', tutorialId)
  const tutorialSnap = await getDoc(tutorialRef)
  
  if (tutorialSnap.exists()) {
    // Increment view count
    await updateDoc(tutorialRef, {
      views: (tutorialSnap.data().views || 0) + 1
    })
    
    return { id: tutorialSnap.id, ...tutorialSnap.data() } as Tutorial
  }
  
  return null
}

// Update tutorial
export async function updateTutorial(tutorialId: string, updates: Partial<Tutorial>) {
  const tutorialRef = doc(db, 'tutorials', tutorialId)
  await updateDoc(tutorialRef, {
    ...updates,
    updatedAt: serverTimestamp(),
  })
}

// Delete tutorial
export async function deleteTutorial(tutorialId: string) {
  const tutorialRef = doc(db, 'tutorials', tutorialId)
  await deleteDoc(tutorialRef)
}

// Get a specific order
export async function getOrder(orderId: string): Promise<Order | null> {
  const orderRef = doc(db, 'orders', orderId)
  const orderSnap = await getDoc(orderRef)
  
  if (orderSnap.exists()) {
    return { id: orderSnap.id, ...orderSnap.data() } as Order
  }
  
  return null
}

// Update order status
export async function updateOrderStatus(orderId: string, status: Order['status']) {
  const orderRef = doc(db, 'orders', orderId)
  await updateDoc(orderRef, {
    status,
    updatedAt: serverTimestamp()
  })
}

// Get orders for a shop (seller)
export async function getShopOrders(shopId: string): Promise<Order[]> {
  const ordersRef = collection(db, 'orders')
  const querySnapshot = await getDocs(ordersRef)
  
  // Filter orders that contain items from this shop
  const shopOrders = querySnapshot.docs
    .map(doc => ({ id: doc.id, ...doc.data() } as Order))
    .filter(order => order.items.some(item => item.shopId === shopId))
    .sort((a, b) => b.createdAt.seconds - a.createdAt.seconds)
  
  return shopOrders
}
