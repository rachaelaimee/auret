'use client'

import { useState } from 'react'
import { useCurrency } from './currency-provider'
import { SUPPORTED_CURRENCIES, Currency } from '@/lib/currency'
import { Button } from '@/components/ui/button'
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu'
import { ChevronDown, Globe } from 'lucide-react'

interface CurrencySelectorProps {
  variant?: 'default' | 'compact'
  className?: string
}

export function CurrencySelector({ variant = 'default', className = '' }: CurrencySelectorProps) {
  const { currency, setCurrency, isLoading } = useCurrency()
  const [isOpen, setIsOpen] = useState(false)

  if (isLoading) {
    return (
      <Button variant="ghost" size="sm" disabled className={className}>
        <Globe className="h-4 w-4" />
        {variant === 'default' && <span className="ml-2">Loading...</span>}
      </Button>
    )
  }

  const currentCurrency = SUPPORTED_CURRENCIES[currency]

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className={`${className} ${variant === 'compact' ? 'px-2' : 'px-3'}`}
        >
          <span className="text-sm">{currentCurrency.flag}</span>
          {variant === 'default' && (
            <>
              <span className="ml-2 font-medium">{currentCurrency.code}</span>
              <ChevronDown className="ml-1 h-3 w-3" />
            </>
          )}
          {variant === 'compact' && (
            <ChevronDown className="ml-1 h-3 w-3" />
          )}
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="min-w-[200px]">
        {Object.values(SUPPORTED_CURRENCIES).map((currencyInfo) => (
          <DropdownMenuItem
            key={currencyInfo.code}
            onClick={() => {
              setCurrency(currencyInfo.code)
              setIsOpen(false)
            }}
            className={`flex items-center justify-between cursor-pointer ${
              currencyInfo.code === currency ? 'bg-slate-100' : ''
            }`}
          >
            <div className="flex items-center">
              <span className="text-base mr-3">{currencyInfo.flag}</span>
              <div>
                <div className="font-medium">{currencyInfo.code}</div>
                <div className="text-xs text-slate-500">{currencyInfo.name}</div>
              </div>
            </div>
            {currencyInfo.code === currency && (
              <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
            )}
          </DropdownMenuItem>
        ))}
        
        <div className="border-t mt-2 pt-2 px-2">
          <div className="text-xs text-slate-500 text-center">
            Prices converted automatically
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
