import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import MobileInstallBanner from '@/components/MobileInstallBanner'
import AutoSyncManager from '@/components/AutoSyncManager'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const [{ data: { user } }, cookieStore] = await Promise.all([
    supabase.auth.getUser(),
    cookies(),
  ])
  const magicUser = cookieStore.get('greekhost_magic_user')?.value

  if (!user && !magicUser) redirect('/login')

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 lg:ml-0 pt-16 lg:pt-0 pb-24 lg:pb-8 overflow-auto min-h-screen">
        <div className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 py-4 sm:py-6">
          <AutoSyncManager />
          <MobileInstallBanner />
          {children}
        </div>
      </main>
    </div>
  )
}
