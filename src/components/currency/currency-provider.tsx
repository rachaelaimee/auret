'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { Currency, getUserCurrency, setUserCurrency, detectUserCurrency } from '@/lib/currency'

interface CurrencyContextType {
  currency: Currency
  setCurrency: (currency: Currency) => void
  isLoading: boolean
}

const CurrencyContext = createContext<CurrencyContextType>({
  currency: 'USD',
  setCurrency: () => {},
  isLoading: true
})

export const useCurrency = () => {
  const context = useContext(CurrencyContext)
  if (!context) {
    throw new Error('useCurrency must be used within a CurrencyProvider')
  }
  return context
}

interface CurrencyProviderProps {
  children: ReactNode
}

export function CurrencyProvider({ children }: CurrencyProviderProps) {
  const [currency, setCurrencyState] = useState<Currency>('USD')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Initialize currency on client side
    const initializeCurrency = async () => {
      try {
        const userCurrency = getUserCurrency()
        setCurrencyState(userCurrency)
      } catch (error) {
        console.warn('Failed to initialize currency:', error)
        setCurrencyState('USD')
      } finally {
        setIsLoading(false)
      }
    }

    initializeCurrency()
  }, [])

  const setCurrency = (newCurrency: Currency) => {
    setCurrencyState(newCurrency)
    setUserCurrency(newCurrency)
  }

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, isLoading }}>
      {children}
    </CurrencyContext.Provider>
  )
}
