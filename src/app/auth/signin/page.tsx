import { Metadata } from 'next'
import Link from 'next/link'
import { SignInForm } from '@/components/auth/signin-form'

export const metadata: Metadata = {
  title: 'Sign In | Auret',
  description: 'Sign in to your Auret account',
}

export default function SignInPage() {

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-lg shadow-sm border p-8">
          <div className="text-center mb-8">
            <Link href="/" className="text-2xl font-bold text-slate-900">
              Auret
            </Link>
            <h1 className="text-xl font-semibold text-slate-900 mt-4">
              Welcome back
            </h1>
            <p className="text-slate-600 mt-2">
              Sign in to your creator account
            </p>
          </div>

          <SignInForm />

          <div className="mt-8 text-center text-sm">
            <span className="text-slate-600">Don't have an account? </span>
            <Link 
              href="/auth/signup" 
              className="text-slate-900 font-medium hover:underline"
            >
              Sign up
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
