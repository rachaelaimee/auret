import { Metadata } from 'next'
import Link from 'next/link'
import { SignUpForm } from '@/components/auth/signup-form'

export const metadata: Metadata = {
  title: 'Sign Up | Auret',
  description: 'Create your Auret creator account',
}

export default function SignUpPage() {

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-lg shadow-sm border p-8">
          <div className="text-center mb-8">
            <Link href="/" className="text-2xl font-bold text-slate-900">
              Auret
            </Link>
            <h1 className="text-xl font-semibold text-slate-900 mt-4">
              Create your account
            </h1>
            <p className="text-slate-600 mt-2">
              Join the creator-first marketplace
            </p>
          </div>

          <SignUpForm />

          <div className="mt-8 text-center text-sm">
            <span className="text-slate-600">Already have an account? </span>
            <Link 
              href="/auth/signin" 
              className="text-slate-900 font-medium hover:underline"
            >
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
