'use client'

import Link from 'next/link'
import { AuthProvider, useAuth } from '@/components/auth/auth-provider'
import { Navigation } from '@/components/navigation'

function ForumPageContent() {
  const { user } = useAuth()
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      <Navigation user={user} />
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Curia Corner</h1>
        <p className="text-slate-600 mb-8">A vibrant community where makers share knowledge, connect with customers, and grow together.</p>
      
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Link href="/forum/tutorials" className="block">
          <div className="bg-white rounded-lg shadow-md p-6 border border-slate-200 hover:shadow-lg hover:border-slate-300 transition-all cursor-pointer">
            <h3 className="text-xl font-semibold mb-3 text-slate-900">📚 Tutorials & Guides</h3>
            <p className="text-slate-600 mb-4">Share your expertise and learn new techniques from fellow makers.</p>
            <div className="text-blue-600 hover:text-blue-700 font-medium">
              Explore Tutorials →
            </div>
          </div>
        </Link>
        
        <div className="bg-white rounded-lg shadow-md p-6 border border-slate-200 opacity-75">
          <h3 className="text-xl font-semibold mb-3 text-slate-900">💬 Community Discussions</h3>
          <p className="text-slate-600 mb-4">Connect with other makers, share tips, and get advice.</p>
          <p className="text-sm text-slate-500">Coming soon...</p>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6 border border-slate-200 opacity-75">
          <h3 className="text-xl font-semibold mb-3 text-slate-900">📊 Market Research</h3>
          <p className="text-slate-600 mb-4">Run polls to see what your customers want next.</p>
          <p className="text-sm text-slate-500">Coming soon...</p>
        </div>
      </div>
    </div>
    </div>
  );
}

export default function ForumPage() {
  return (
    <AuthProvider>
      <ForumPageContent />
    </AuthProvider>
  )
}