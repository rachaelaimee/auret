import { Metadata } from 'next'
import { AuthProvider } from '@/components/auth/auth-provider'
import { ProfilePage as ProfilePageComponent } from '@/components/profile/profile-page'

export const metadata: Metadata = {
  title: 'Profile Settings | Auret',
  description: 'Manage your profile and account settings',
}

export default function ProfilePage() {
  return (
    <AuthProvider>
      <ProfilePageComponent />
    </AuthProvider>
  )
}
