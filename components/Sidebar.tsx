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
  Inbox,
  X,
  MessageSquare,
  SprayCan,
  Smartphone,
  Globe,
} from 'lucide-react'
import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import SupportModal from '@/components/SupportModal'
import InstallAppModal from '@/components/InstallAppModal'
import WhatsNewModal from '@/components/WhatsNewModal'
import ThemeCustomizerModal from '@/components/ThemeCustomizerModal'
import { isSuperAdmin, getUserSubscription, isProUser, getUserTier } from '@/lib/permissions'
import { useLanguage } from '@/lib/languageContext'

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const { language, setLanguage, t } = useLanguage()

  const navItems = [
    { href: '/dashboard', icon: LayoutDashboard, label: t('nav.dashboard', 'Επισκόπηση'), shortLabel: language === 'en' ? 'Overview' : 'Αρχική' },
    { href: '/dashboard/properties', icon: Home, label: t('nav.properties', 'Ακίνητα'), shortLabel: language === 'en' ? 'Props' : 'Ακίνητα' },
    { href: '/dashboard/calendar', icon: Calendar, label: t('nav.calendar', 'Ημερολόγιο'), shortLabel: language === 'en' ? 'Calendar' : 'Ημερολόγιο' },
    { href: '/dashboard/bookings', icon: BookOpen, label: t('nav.bookings', 'Κρατήσεις'), shortLabel: language === 'en' ? 'Bookings' : 'Κρατήσεις' },
    { href: '/dashboard/cleaning', icon: SprayCan, label: t('nav.cleaning', 'Καθαρισμός & Tasks'), shortLabel: language === 'en' ? 'Cleaning' : 'Καθαρισμός' },
    { href: '/dashboard/guest-messages', icon: MessageSquare, label: t('nav.messages', 'Μηνύματα Επισκεπτών'), shortLabel: language === 'en' ? 'Messages' : 'Μηνύματα' },
    { href: '/dashboard/guidebook', icon: Smartphone, label: t('nav.guidebook', 'Ψηφιακός Οδηγός'), shortLabel: language === 'en' ? 'Guide' : 'Οδηγός' },
    { href: '/dashboard/aade', icon: FileText, label: t('nav.aade', 'Φορολογικό & ΑΑΔΕ'), shortLabel: language === 'en' ? 'Taxes' : 'ΑΑΔΕ' },
    { href: '/dashboard/pricing', icon: Sparkles, label: t('nav.pricing', 'Συνδρομές & Πλάνα'), shortLabel: 'Pro' },
  ]

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user?.email) setUserEmail(user.email)
    })
  }, [])

  const isSuper = isSuperAdmin(userEmail)
  const isPro = isProUser(userEmail)
  const subInfo = getUserSubscription(userEmail)
  const tier = getUserTier(userEmail)

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const NavLinks = () => (
    <>
      <div className="flex items-center justify-between px-4 py-5 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center text-lg shadow">
            🏠
          </div>
          <div>
            <div className="font-bold text-gray-900 text-base leading-tight">GreekHost</div>
            <div className="text-[11px] font-medium flex items-center gap-1">
              {isSuper ? (
                <span className="text-amber-600 font-bold flex items-center gap-0.5">
                  👑 Super Admin
                </span>
              ) : tier === 'pro' ? (
                <span className="text-purple-600 font-bold flex items-center gap-0.5">
                  ⭐ Pro Member
                </span>
              ) : (
                <span className="text-blue-600">Bnb & Tax Manager</span>
              )}
            </div>
          </div>
        </div>

        {/* Theme Customizer & Language Switcher Group in Sidebar Header */}
        <div className="flex items-center gap-1.5">
          <ThemeCustomizerModal />

          <div className="flex items-center bg-gray-100 dark:bg-gray-800 p-1 rounded-xl border border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setLanguage('el')}
              className={`px-1.5 py-0.5 rounded-lg text-[10px] font-bold transition-all ${
                language === 'el' ? 'bg-white dark:bg-gray-700 text-blue-700 dark:text-blue-300 shadow-2xs' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900'
              }`}
              title="Ελληνικά"
            >
              🇬🇷
            </button>
            <button
              onClick={() => setLanguage('en')}
              className={`px-1.5 py-0.5 rounded-lg text-[10px] font-bold transition-all ${
                language === 'en' ? 'bg-white dark:bg-gray-700 text-blue-700 dark:text-blue-300 shadow-2xs' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900'
              }`}
              title="English (US)"
            >
              🇺🇸
            </button>
          </div>
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
        {/* Upgrade pill box / Active Pro / Super Admin Badge */}
        {isSuper ? (
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-300 rounded-2xl p-3 text-center shadow-xs">
            <div className="flex items-center justify-center gap-1 text-xs font-bold text-amber-900">
              <span>👑 Super Admin</span>
            </div>
            <p className="text-[11px] text-amber-800 mt-0.5 font-medium">
              {language === 'en' ? 'All features unlocked' : 'Όλες οι λειτουργίες ξεκλείδωτες'}
            </p>
          </div>
        ) : isPro ? (
          <div className="bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-200 rounded-2xl p-3 text-center shadow-xs">
            <div className="flex items-center justify-center gap-1 text-xs font-bold text-purple-900">
              <Sparkles size={13} className="text-purple-600" />
              <span>{language === 'en' ? 'Pro Plan Active' : 'Πλάνο Pro Ενεργό'}</span>
            </div>
            <p className="text-[10px] text-purple-700 mt-0.5 font-medium">
              {subInfo ? subInfo.label : (language === 'en' ? 'Up to 3 properties' : 'Έως 3 Ακίνητα & WhatsApp')}
            </p>
          </div>
        ) : (
          <Link
            href="/dashboard/pricing"
            onClick={() => setMobileOpen(false)}
            className="block bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200/80 rounded-2xl p-3 text-center transition-transform hover:scale-[1.02]"
          >
            <div className="flex items-center justify-center gap-1 text-xs font-bold text-blue-900">
              <Sparkles size={13} className="text-amber-500" />
              <span>{language === 'en' ? 'Upgrade to Pro' : 'Αναβάθμιση σε Pro'}</span>
            </div>
            <p className="text-[11px] text-blue-700 mt-0.5">
              {language === 'en' ? 'From €4.08 / mo' : 'Από 4,08 € / μήνα'}
            </p>
          </Link>
        )}

        {/* What's New & Upcoming Roadmap Modal */}
        <WhatsNewModal />

        {/* Install App Trigger Button */}
        <InstallAppModal />

        {/* Support & Contact Modal */}
        <SupportModal />

        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-gray-500 hover:bg-red-50 hover:text-red-600 w-full transition-all"
        >
          <LogOut size={18} />
          {t('nav.logout', 'Αποσύνδεση')}
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
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur border-b border-gray-200 flex items-center justify-between px-4 py-3 shadow-xs">
        <Link href="/dashboard" className="flex items-center gap-2">
          <span className="text-xl">🏠</span>
          <span className="font-bold text-gray-900 text-base">GreekHost</span>
        </Link>
        <div className="flex items-center gap-1.5">
          {/* Theme Switcher in Mobile Topbar */}
          <ThemeCustomizerModal />

          {/* Language Switcher in Mobile Topbar */}
          <div className="flex items-center bg-gray-100 dark:bg-gray-800 p-1 rounded-xl border border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setLanguage('el')}
              className={`px-1.5 py-0.5 rounded-lg text-[10px] font-bold ${
                language === 'el' ? 'bg-white dark:bg-gray-700 text-blue-700 dark:text-blue-300 shadow-2xs' : 'text-gray-500'
              }`}
            >
              🇬🇷
            </button>
            <button
              onClick={() => setLanguage('en')}
              className={`px-1.5 py-0.5 rounded-lg text-[10px] font-bold ${
                language === 'en' ? 'bg-white dark:bg-gray-700 text-blue-700 dark:text-blue-300 shadow-2xs' : 'text-gray-500'
              }`}
            >
              🇺🇸
            </button>
          </div>

          <Link
            href="/dashboard/pricing"
            className="bg-amber-100 text-amber-900 text-[11px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1"
          >
            <Sparkles size={12} className="text-amber-600" />
            <span>Pro</span>
          </Link>

          {/* Mobile Direct Logout Button */}
          <button
            onClick={handleLogout}
            className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 hover:text-red-700 transition-colors"
            title="Αποσύνδεση"
            aria-label="Αποσύνδεση"
          >
            <LogOut size={18} />
          </button>

          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-700"
            aria-label="Μενού"
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-50 bg-black/40 backdrop-blur-xs transition-opacity"
          onClick={() => setMobileOpen(false)}
        >
          <aside
            className="absolute top-0 left-0 h-full w-72 max-w-[85vw] bg-white flex flex-col shadow-2xl z-50 animate-in slide-in-from-left duration-200 overflow-y-auto pb-12"
            onClick={e => e.stopPropagation()}
          >
            <NavLinks />
          </aside>
        </div>
      )}

      {/* Mobile Bottom Navigation Bar (Thumb Friendly) */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur border-t border-gray-200 dark:border-slate-800 flex items-center justify-around px-1 py-1.5 shadow-lg safe-area-inset-bottom">
        {/* 1. Dashboard */}
        <Link
          href="/dashboard"
          className={cn(
            'flex flex-col items-center justify-center py-1 px-1.5 rounded-xl transition-all text-center min-w-[52px]',
            pathname === '/dashboard'
              ? 'text-blue-600 dark:text-blue-400 font-bold'
              : 'text-gray-500 hover:text-gray-900 dark:text-gray-400'
          )}
        >
          <LayoutDashboard size={19} className={pathname === '/dashboard' ? 'stroke-[2.5]' : 'stroke-[1.8]'} />
          <span className="text-[10px] mt-0.5 leading-tight">{language === 'en' ? 'Home' : 'Αρχική'}</span>
        </Link>

        {/* 2. Calendar */}
        <Link
          href="/dashboard/calendar"
          className={cn(
            'flex flex-col items-center justify-center py-1 px-1.5 rounded-xl transition-all text-center min-w-[52px]',
            pathname.startsWith('/dashboard/calendar')
              ? 'text-blue-600 dark:text-blue-400 font-bold'
              : 'text-gray-500 hover:text-gray-900 dark:text-gray-400'
          )}
        >
          <Calendar size={19} className={pathname.startsWith('/dashboard/calendar') ? 'stroke-[2.5]' : 'stroke-[1.8]'} />
          <span className="text-[10px] mt-0.5 leading-tight">{language === 'en' ? 'Calendar' : 'Ημερολόγιο'}</span>
        </Link>

        {/* 3. Bookings */}
        <Link
          href="/dashboard/bookings"
          className={cn(
            'flex flex-col items-center justify-center py-1 px-1.5 rounded-xl transition-all text-center min-w-[52px]',
            pathname.startsWith('/dashboard/bookings')
              ? 'text-blue-600 dark:text-blue-400 font-bold'
              : 'text-gray-500 hover:text-gray-900 dark:text-gray-400'
          )}
        >
          <BookOpen size={19} className={pathname.startsWith('/dashboard/bookings') ? 'stroke-[2.5]' : 'stroke-[1.8]'} />
          <span className="text-[10px] mt-0.5 leading-tight">{language === 'en' ? 'Bookings' : 'Κρατήσεις'}</span>
        </Link>

        {/* 4. Messages (Crucial for host on mobile!) */}
        <Link
          href="/dashboard/guest-messages"
          className={cn(
            'flex flex-col items-center justify-center py-1 px-1.5 rounded-xl transition-all text-center min-w-[52px]',
            pathname.startsWith('/dashboard/guest-messages')
              ? 'text-blue-600 dark:text-blue-400 font-bold'
              : 'text-gray-500 hover:text-gray-900 dark:text-gray-400'
          )}
        >
          <MessageSquare size={19} className={pathname.startsWith('/dashboard/guest-messages') ? 'stroke-[2.5]' : 'stroke-[1.8]'} />
          <span className="text-[10px] mt-0.5 leading-tight">{language === 'en' ? 'Messages' : 'Μηνύματα'}</span>
        </Link>

        {/* 5. Menu Drawer Trigger */}
        <button
          onClick={() => setMobileOpen(true)}
          className={cn(
            'flex flex-col items-center justify-center py-1 px-1.5 rounded-xl transition-all text-center min-w-[52px]',
            mobileOpen
              ? 'text-blue-600 dark:text-blue-400 font-bold'
              : 'text-gray-500 hover:text-gray-900 dark:text-gray-400'
          )}
          aria-label="Όλα τα μενού"
        >
          <Menu size={19} className="stroke-[2]" />
          <span className="text-[10px] mt-0.5 leading-tight">{language === 'en' ? 'More' : 'Μενού'}</span>
        </button>
      </div>
    </>
  )
}
