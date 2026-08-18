'use client'

import { useState, useEffect } from 'react'
import { Download, Sparkles, X } from 'lucide-react'
import InstallAppModal from '@/components/InstallAppModal'

export default function MobileInstallBanner() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    // Check if running standalone already
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone

    const isDismissed = localStorage.getItem('greekhost_install_banner_dismissed')

    if (!isStandalone && !isDismissed) {
      // Show banner after 2 seconds on mobile
      const timer = setTimeout(() => setShow(true), 1500)
      return () => clearTimeout(timer)
    }
  }, [])

  const handleDismiss = () => {
    setShow(false)
    localStorage.setItem('greekhost_install_banner_dismissed', 'true')
  }

  if (!show) return null

  return (
    <div className="lg:hidden mb-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl p-3.5 shadow-md flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-4 duration-300">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-10 h-10 rounded-xl bg-white/10 text-xl flex items-center justify-center shrink-0 shadow-inner">
          🏠
        </div>
        <div className="min-w-0">
          <div className="text-xs font-bold truncate">Εγκατάσταση GreekHost στο κινητό</div>
          <div className="text-[10px] text-blue-100 truncate">Άμεση πρόσβαση με 1 κλικ χωρίς App Store</div>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <InstallAppModal
          triggerClassName="bg-white text-blue-700 font-bold px-3 py-1.5 rounded-xl text-xs shadow-xs hover:bg-blue-50 transition-all flex items-center gap-1"
        />
        <button
          onClick={handleDismiss}
          className="text-white/70 hover:text-white p-1 rounded-lg hover:bg-white/10"
          aria-label="Κλείσιμο"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  )
}
