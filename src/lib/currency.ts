export type Currency = 'GBP' | 'USD' | 'EUR' | 'CAD' | 'AUD'

export interface CurrencyInfo {
  code: Currency
  symbol: string
  name: string
  flag: string
}

export const SUPPORTED_CURRENCIES: Record<Currency, CurrencyInfo> = {
  GBP: { code: 'GBP', symbol: '£', name: 'British Pound', flag: '🇬🇧' },
  USD: { code: 'USD', symbol: '$', name: 'US Dollar', flag: '🇺🇸' },
  EUR: { code: 'EUR', symbol: '€', name: 'Euro', flag: '🇪🇺' },
  CAD: { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar', flag: '🇨🇦' },
  AUD: { code: 'AUD', symbol: 'A$', name: 'Australian Dollar', flag: '🇦🇺' }
}

// Exchange rates (in practice, you'd fetch these from an API)
// Base currency is USD, so these are USD to other currency rates
const EXCHANGE_RATES: Record<Currency, number> = {
  USD: 1,
  GBP: 0.79,    // 1 USD = 0.79 GBP
  EUR: 0.92,    // 1 USD = 0.92 EUR
  CAD: 1.35,    // 1 USD = 1.35 CAD
  AUD: 1.52     // 1 USD = 1.52 AUD
}

// Detect user's currency based on their location/browser
export function detectUserCurrency(): Currency {
  if (typeof window === 'undefined') return 'USD'
  
  try {
    // Try to get currency from browser locale
    const locale = navigator.language || 'en-US'
    const region = locale.split('-')[1]?.toUpperCase()
    
    // Map regions to currencies
    const regionToCurrency: Record<string, Currency> = {
      'GB': 'GBP',
      'UK': 'GBP',
      'US': 'USD',
      'CA': 'CAD',
      'AU': 'AUD',
      'NZ': 'AUD', // Use AUD for New Zealand
      // EU countries
      'DE': 'EUR', 'FR': 'EUR', 'IT': 'EUR', 'ES': 'EUR',
      'NL': 'EUR', 'BE': 'EUR', 'AT': 'EUR', 'PT': 'EUR',
      'IE': 'EUR', 'FI': 'EUR', 'GR': 'EUR', 'LU': 'EUR'
    }
    
    if (region && regionToCurrency[region]) {
      return regionToCurrency[region]
    }
    
    // Try timezone-based detection as fallback
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone
    if (timezone.includes('London') || timezone.includes('Dublin')) return 'GBP'
    if (timezone.includes('Europe/')) return 'EUR'
    if (timezone.includes('America/Toronto') || timezone.includes('America/Vancouver')) return 'CAD'
    if (timezone.includes('Australia/') || timezone.includes('Pacific/Auckland')) return 'AUD'
    
  } catch (error) {
    console.warn('Failed to detect currency:', error)
  }
  
  return 'USD' // Default fallback
}

// Convert price from USD cents to target currency
export function convertPrice(usdCents: number, targetCurrency: Currency): number {
  if (targetCurrency === 'USD') return usdCents
  
  const usdAmount = usdCents / 100
  const rate = EXCHANGE_RATES[targetCurrency]
  const convertedAmount = usdAmount * rate
  
  // Convert back to cents/pence
  return Math.round(convertedAmount * 100)
}

// Format price in the specified currency
export function formatPrice(cents: number, currency: Currency): string {
  const currencyInfo = SUPPORTED_CURRENCIES[currency]
  const amount = cents / 100
  
  // Use Intl.NumberFormat for proper formatting
  try {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
      maximumFractionDigits: 2
    }).format(amount)
  } catch (error) {
    // Fallback formatting if Intl fails
    return `${currencyInfo.symbol}${amount.toFixed(2)}`
  }
}

// Convert and format price in one go
export function convertAndFormatPrice(usdCents: number, targetCurrency: Currency): string {
  const convertedCents = convertPrice(usdCents, targetCurrency)
  return formatPrice(convertedCents, targetCurrency)
}

// Get user's preferred currency from localStorage
export function getUserCurrency(): Currency {
  if (typeof window === 'undefined') return 'USD'
  
  try {
    const saved = localStorage.getItem('preferred-currency')
    if (saved && saved in SUPPORTED_CURRENCIES) {
      return saved as Currency
    }
  } catch (error) {
    console.warn('Failed to get saved currency:', error)
  }
  
  return detectUserCurrency()
}

// Save user's preferred currency
export function setUserCurrency(currency: Currency): void {
  if (typeof window === 'undefined') return
  
  try {
    localStorage.setItem('preferred-currency', currency)
  } catch (error) {
    console.warn('Failed to save currency preference:', error)
  }
}

// Real-world exchange rate API integration (for production)
export async function fetchExchangeRates(): Promise<Record<Currency, number>> {
  // In production, you'd call a real API like:
  // - https://api.exchangerate-api.com/v4/latest/USD
  // - https://api.fixer.io/latest?base=USD
  // - https://openexchangerates.org/api/latest.json
  
  try {
    // For now, return static rates
    // In production, uncomment and use real API:
    /*
    const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD')
    const data = await response.json()
    return {
      USD: 1,
      GBP: data.rates.GBP,
      EUR: data.rates.EUR,
      CAD: data.rates.CAD,
      AUD: data.rates.AUD
    }
    */
    
    return EXCHANGE_RATES
  } catch (error) {
    console.warn('Failed to fetch exchange rates, using static rates:', error)
    return EXCHANGE_RATES
  }
}
