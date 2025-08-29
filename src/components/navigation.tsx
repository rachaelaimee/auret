'use client'

import { User } from 'firebase/auth'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { logOut } from '@/lib/auth-client'
import { Button } from '@/components/ui/button'
import { CurrencySelector } from '@/components/currency/currency-selector'
import { CartIcon } from '@/components/cart/cart-icon'

interface NavigationProps {
  user: User | null
}

export function Navigation({ user }: NavigationProps) {
  const router = useRouter()

  const handleSignOut = async () => {
    await logOut()
    router.push('/')
    router.refresh()
  }

  return (
    <header className="border-b bg-white/80 backdrop-blur">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold text-slate-900">
            Auret
          </Link>
          <nav className="hidden md:flex items-center space-x-6">
            <Link href="/browse" className="text-slate-600 hover:text-slate-900">
              Browse
            </Link>
            <Link href="/forum" className="text-slate-600 hover:text-slate-900">
              Forum
            </Link>
            <Link href="/sell" className="text-slate-600 hover:text-slate-900">
              Start Selling
            </Link>
            <div className="flex items-center space-x-4">
              <CurrencySelector variant="compact" />
              <CartIcon />
              
              {user ? (
                <>
                  <Link href="/dashboard" className="text-slate-600 hover:text-slate-900">
                    Dashboard
                  </Link>
                  <Link href="/profile" className="text-slate-600 hover:text-slate-900">
                    Profile
                  </Link>
                  <span className="text-sm text-slate-600">
                    {user.displayName || user.email}
                  </span>
                  <Button variant="outline" size="sm" onClick={handleSignOut}>
                    Sign Out
                  </Button>
                </>
              ) : (
                <>
                  <Link href="/auth/signin" className="text-slate-600 hover:text-slate-900">
                    Sign In
                  </Link>
                  <Link href="/auth/signup">
                    <Button size="sm">Sign Up</Button>
                  </Link>
                </>
              )}
            </div>
          </nav>
        </div>
      </div>
    </header>
  )
}
