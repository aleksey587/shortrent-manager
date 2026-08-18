'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  LayoutDashboard,
  Home,
  Calendar,
  BookOpen,
  FileText,
  Sparkles,
  LogOut,
  Menu,
  X,
} from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Επισκόπηση' },
  { href: '/dashboard/properties', icon: Home, label: 'Ακίνητα' },
  { href: '/dashboard/calendar', icon: Calendar, label: 'Ημερολόγιο' },
  { href: '/dashboard/bookings', icon: BookOpen, label: 'Κρατήσεις' },
  { href: '/dashboard/aade', icon: FileText, label: 'Φορολογικό & ΑΑΔΕ' },
  { href: '/dashboard/pricing', icon: Sparkles, label: 'Συνδρομές & Πλάνα' },
]

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const NavLinks = () => (
    <>
      <div className="flex items-center gap-3 px-4 py-5 border-b border-gray-100">
        <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center text-lg shadow">
          🏠
        </div>
        <div>
          <div className="font-bold text-gray-900 text-base leading-tight">GreekHost</div>
          <div className="text-[11px] text-blue-600 font-medium">Bnb & Tax Manager</div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map(({ href, icon: Icon, label }) => (
          <Link
            key={href}
            href={href}
            onClick={() => setMobileOpen(false)}
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
              (href === '/dashboard' ? pathname === href : pathname.startsWith(href))
                ? 'bg-blue-50 text-blue-700 font-semibold'
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
            )}
          >
            <Icon size={18} className={href === '/dashboard/pricing' ? 'text-amber-500' : ''} />
            <span>{label}</span>
          </Link>
        ))}
      </nav>

      <div className="px-3 pb-4 space-y-2">
        {/* Upgrade pill box */}
        <Link
          href="/dashboard/pricing"
          className="block bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200/80 rounded-2xl p-3 text-center transition-transform hover:scale-[1.02]"
        >
          <div className="flex items-center justify-center gap-1 text-xs font-bold text-blue-900">
            <Sparkles size={13} className="text-amber-500" />
            <span>Αναβάθμιση σε Pro</span>
          </div>
          <p className="text-[11px] text-blue-700 mt-0.5">Από 4,08 € / μήνα</p>
        </Link>

        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-500 hover:bg-red-50 hover:text-red-600 w-full transition-all"
        >
          <LogOut size={18} />
          Αποσύνδεση
        </button>
      </div>
    </>
  )

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:flex-col w-60 min-h-screen bg-white border-r border-gray-200">
        <NavLinks />
      </aside>

      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="text-xl">🏠</span>
          <span className="font-semibold text-gray-900 text-sm">ShortRent Manager</span>
        </div>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-1.5 rounded-lg hover:bg-gray-100"
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/30"
          onClick={() => setMobileOpen(false)}
        >
          <aside
            className="absolute top-0 left-0 h-full w-64 bg-white flex flex-col shadow-xl"
            onClick={e => e.stopPropagation()}
          >
            <NavLinks />
          </aside>
        </div>
      )}
    </>
  )
}
