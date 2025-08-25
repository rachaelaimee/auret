import { Metadata } from 'next'
import { AuthProvider } from '@/components/auth/auth-provider'
import { DashboardPage as DashboardPageComponent } from '@/components/dashboard/dashboard-page'

export const metadata: Metadata = {
  title: 'Dashboard | Auret',
  description: 'Your creator dashboard',
}

export default function DashboardPage() {
  return (
    <AuthProvider>
      <DashboardPageComponent />
    </AuthProvider>
  )
}
