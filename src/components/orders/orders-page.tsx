'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/auth/auth-provider'
import { Navigation } from '@/components/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Package, 
  Download, 
  Clock, 
  CheckCircle, 
  XCircle,
  Loader2,
  ShoppingBag,
  ArrowLeft
} from 'lucide-react'
import Link from 'next/link'

// Order data structure from API
interface Order {
  id: string
  totalCents: number
  currency: string
  status: 'pending' | 'paid' | 'fulfilled' | 'completed' | 'refunded' | 'disputed'
  createdAt: string
  items: {
    id: string
    title: string
    type: 'digital' | 'physical'
    quantity: number
    unitPriceCents: number
    productId: string
    shopName: string
    shopHandle: string
  }[]
  shippingAddress?: {
    name: string
    line1: string
    line2?: string
    city: string
    state: string
    postal_code: string
    country: string
  }
}

export function OrdersPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Don't redirect if auth is still loading
    if (authLoading) {
      return
    }
    
    if (!user) {
      router.push('/auth/signin?redirect=/orders')
      return
    }

    // Fetch user orders from API
    const loadOrders = async () => {
      try {
        setLoading(true)
        
        // Get Firebase ID token
        const idToken = await user.getIdToken()
        
        // Debug: Check user info
        console.log('Current user:', { uid: user.uid, email: user.email })
        
        // Debug: Check what the API returns for this user
        const debugResponse = await fetch('/api/debug/user', {
          headers: {
            'Authorization': `Bearer ${idToken}`,
          },
        })
        if (debugResponse.ok) {
          const debugData = await debugResponse.json()
          console.log('User debug info:', debugData)
        }
        
        const response = await fetch('/api/orders', {
          headers: {
            'Authorization': `Bearer ${idToken}`,
          },
        })
        
        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to fetch orders')
        }
        
        const data = await response.json()
        setOrders(data.orders || [])
      } catch (err: any) {
        setError(err.message || 'Failed to load orders')
      } finally {
        setLoading(false)
      }
    }

    loadOrders()
  }, [user, router, authLoading])

  const formatPrice = (cents: number, currency: string = 'GBP') => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: currency,
    }).format(cents / 100)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4" />
      case 'paid':
      case 'fulfilled':
      case 'completed':
        return <CheckCircle className="h-4 w-4" />
      case 'refunded':
      case 'disputed':
        return <XCircle className="h-4 w-4" />
      default:
        return <Package className="h-4 w-4" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'secondary'
      case 'paid':
      case 'fulfilled':
      case 'completed':
        return 'default'
      case 'refunded':
      case 'disputed':
        return 'destructive'
      default:
        return 'secondary'
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-slate-400 mx-auto mb-4" />
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null // Will redirect to signin
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      <Navigation user={user} />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <Link href="/dashboard">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Your Orders</h1>
              <p className="text-slate-600">Track your purchases and access downloads</p>
            </div>
          </div>

          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
              <span className="ml-2 text-slate-600">Loading your orders...</span>
            </div>
          ) : orders.length === 0 ? (
            // Empty state
            <Card>
              <CardContent className="text-center py-12">
                <ShoppingBag className="h-16 w-16 text-slate-400 mx-auto mb-6" />
                <h2 className="text-2xl font-bold text-slate-900 mb-4">No orders yet</h2>
                <p className="text-slate-600 mb-8 max-w-md mx-auto">
                  When you make your first purchase, your order history will appear here. 
                  You'll be able to track shipments and access digital downloads.
                </p>
                <div className="space-y-4">
                  <Link href="/browse">
                    <Button size="lg">
                      Start Shopping
                    </Button>
                  </Link>
                  <div className="text-sm text-slate-500">
                    <p>Looking for something specific?</p>
                    <Link href="/browse" className="text-blue-600 hover:underline">
                      Browse our marketplace
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            // Orders list
            <div className="space-y-6">
              {orders.map((order) => (
                <Card key={order.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg">Order #{order.id.slice(-8)}</CardTitle>
                        <CardDescription>
                          Placed on {new Date(order.createdAt).toLocaleDateString()}
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={getStatusColor(order.status)} className="flex items-center gap-1">
                          {getStatusIcon(order.status)}
                          {order.status}
                        </Badge>
                        <span className="text-lg font-semibold">
                          {formatPrice(order.totalCents, order.currency)}
                        </span>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* Order Items */}
                      <div className="space-y-2">
                        {order.items.map((item) => (
                          <div key={item.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                            <div className="flex items-center gap-3">
                              <div className="flex-shrink-0">
                                {item.type === 'digital' ? (
                                  <Download className="h-5 w-5 text-blue-600" />
                                ) : (
                                  <Package className="h-5 w-5 text-slate-600" />
                                )}
                              </div>
                              <div>
                                <h4 className="font-medium text-slate-900">{item.title}</h4>
                                <p className="text-sm text-slate-500">
                                  by {item.shopName} • {item.type === 'digital' ? 'Digital Product' : 'Physical Product'} • Qty: {item.quantity}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">
                                {formatPrice(item.unitPriceCents * item.quantity, order.currency)}
                              </span>
                              {item.type === 'digital' && (
                                <Button size="sm" variant="outline">
                                  <Download className="h-3 w-3 mr-1" />
                                  Download
                                </Button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Shipping Address */}
                      {order.shippingAddress && (
                        <div className="border-t pt-4">
                          <h4 className="font-medium text-slate-900 mb-2">Shipping Address</h4>
                          <div className="text-sm text-slate-600">
                            <p>{order.shippingAddress.name}</p>
                            <p>{order.shippingAddress.line1}</p>
                            {order.shippingAddress.line2 && <p>{order.shippingAddress.line2}</p>}
                            <p>
                              {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postal_code}
                            </p>
                            <p>{order.shippingAddress.country}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
