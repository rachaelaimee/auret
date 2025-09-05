import { Shop } from './firestore'

export interface ShippingAddress {
  country: string
  // Add other fields as needed
}

export interface CartItem {
  id: string
  shopId: string
  title: string
  price: number
  quantity: number
  type: 'digital' | 'physical'
}

export interface ShippingCalculation {
  shopId: string
  shopName: string
  subtotal: number // in cents
  shippingCost: number // in cents
  isFreeShipping: boolean
  shippingMethod: 'domestic' | 'international' | 'digital'
}

export class ShippingCalculator {
  // UK and common domestic countries for UK-based shops
  private static DOMESTIC_COUNTRIES = ['GB', 'UK', 'United Kingdom', 'England', 'Scotland', 'Wales', 'Northern Ireland']

  /**
   * Calculate shipping costs for cart items grouped by shop
   */
  static calculateShipping(
    cartItemsByShop: Record<string, CartItem[]>,
    shops: Record<string, Shop>,
    shippingAddress: ShippingAddress,
    baseCurrency: string = 'GBP'
  ): ShippingCalculation[] {
    const results: ShippingCalculation[] = []

    for (const [shopId, items] of Object.entries(cartItemsByShop)) {
      const shop = shops[shopId]
      if (!shop) continue

      // Calculate subtotal for this shop
      const subtotalCents = items.reduce((sum, item) => sum + (item.price * item.quantity * 100), 0)
      
      // Check if shop has any physical items
      const hasPhysicalItems = items.some(item => item.type === 'physical')
      
      if (!hasPhysicalItems) {
        // Digital-only orders have no shipping
        results.push({
          shopId,
          shopName: shop.name,
          subtotal: subtotalCents,
          shippingCost: 0,
          isFreeShipping: true,
          shippingMethod: 'digital'
        })
        continue
      }

      // Determine if domestic or international
      const isDomestic = this.isDomesticShipping(shippingAddress.country, shop.country || 'GB')
      const shippingMethod = isDomestic ? 'domestic' : 'international'

      // Get shipping rates from shop settings
      const shippingRates = shop.shippingRates
      if (!shippingRates) {
        // Default shipping rates if not configured
        const defaultRate = isDomestic ? 500 : 1000 // £5 domestic, £10 international
        results.push({
          shopId,
          shopName: shop.name,
          subtotal: subtotalCents,
          shippingCost: defaultRate,
          isFreeShipping: false,
          shippingMethod
        })
        continue
      }

      const rateConfig = isDomestic ? shippingRates.domestic : shippingRates.international

      if (!rateConfig.enabled) {
        // Shop doesn't ship to this region
        results.push({
          shopId,
          shopName: shop.name,
          subtotal: subtotalCents,
          shippingCost: -1, // Indicates shipping not available
          isFreeShipping: false,
          shippingMethod
        })
        continue
      }

      // Check for free shipping threshold
      const isFreeShipping = rateConfig.freeThreshold && subtotalCents >= rateConfig.freeThreshold
      const shippingCost = isFreeShipping ? 0 : rateConfig.rate

      results.push({
        shopId,
        shopName: shop.name,
        subtotal: subtotalCents,
        shippingCost,
        isFreeShipping,
        shippingMethod
      })
    }

    return results
  }

  /**
   * Check if shipping is domestic based on customer and shop countries
   */
  private static isDomesticShipping(customerCountry: string, shopCountry: string): boolean {
    // Normalize country codes
    const normalizeCountry = (country: string) => {
      const normalized = country.toUpperCase().trim()
      // Map common variations to standard codes
      if (this.DOMESTIC_COUNTRIES.some(domestic => 
        normalized.includes(domestic.toUpperCase()) || domestic.toUpperCase().includes(normalized)
      )) {
        return 'GB'
      }
      return normalized
    }

    return normalizeCountry(customerCountry) === normalizeCountry(shopCountry)
  }

  /**
   * Format shipping cost for display
   */
  static formatShippingCost(shippingCost: number, currency: string = 'GBP'): string {
    if (shippingCost === 0) return 'Free'
    if (shippingCost === -1) return 'Not available'
    
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: currency,
    }).format(shippingCost / 100)
  }

  /**
   * Get total order cost including shipping
   */
  static calculateOrderTotal(shippingCalculations: ShippingCalculation[]): {
    subtotal: number
    shipping: number
    total: number
    hasUnavailableShipping: boolean
  } {
    let subtotal = 0
    let shipping = 0
    let hasUnavailableShipping = false

    for (const calc of shippingCalculations) {
      subtotal += calc.subtotal
      if (calc.shippingCost === -1) {
        hasUnavailableShipping = true
      } else {
        shipping += calc.shippingCost
      }
    }

    return {
      subtotal,
      shipping,
      total: subtotal + shipping,
      hasUnavailableShipping
    }
  }
}

/**
 * Default shipping rates for new shops
 */
export const DEFAULT_SHIPPING_RATES = {
  domestic: {
    enabled: true,
    rate: 500, // £5
    freeThreshold: 5000, // Free over £50
  },
  international: {
    enabled: true,
    rate: 1000, // £10
    freeThreshold: 10000, // Free over £100
  }
}
