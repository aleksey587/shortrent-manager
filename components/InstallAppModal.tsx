'use client'

import { useState, useEffect } from 'react'
import { Download, Smartphone, Apple, Sparkles, X, CheckCircle2, ArrowRight } from 'lucide-react'

export default function InstallAppModal({ triggerClassName }: { triggerClassName?: string }) {
  const [open, setOpen] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [isStandalone, setIsStandalone] = useState(false)
  const [isIOS, setIsIOS] = useState(false)

  useEffect(() => {
    // Check if already installed / running in standalone mode
    if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone) {
      setIsStandalone(true)
    }

    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase()
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent)
    setIsIOS(isIosDevice)

    // Capture standard PWA install event for Android/Chrome/Edge
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstall)
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall)
  }, [])

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      if (outcome === 'accepted') {
        setDeferredPrompt(null)
        setOpen(false)
      }
    } else {
      setOpen(true)
    }
  }

  if (isStandalone) {
    return null // Already installed and running inside app
  }

  return (
    <>
      {/* Trigger Button in Sidebar or Banner */}
      <button
        onClick={() => setOpen(true)}
        className={
          triggerClassName ||
          'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-blue-700 bg-blue-50/80 hover:bg-blue-100/80 w-full transition-all border border-blue-200/60 shadow-2xs'
        }
      >
        <div className="w-6 h-6 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0">
          <Download size={14} />
        </div>
        <div className="text-left flex-1">
          <div className="text-xs font-bold leading-tight">Λήψη Εφαρμογής</div>
          <div className="text-[10px] text-blue-600 font-normal">Android & iOS</div>
        </div>
      </button>

      {/* Modal Guide */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div
            className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl border border-gray-100 space-y-5 animate-in zoom-in-95 duration-200"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center text-2xl shadow-md">
                  🏠
                </div>
                <div>
                  <h3 className="font-extrabold text-gray-900 text-lg">Εγκατάσταση GreekHost</h3>
                  <p className="text-xs text-gray-500">Χωρίς Play Store ή App Store — 100% Δωρεάν</p>
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1.5 rounded-xl hover:bg-gray-100"
              >
                <X size={18} />
              </button>
            </div>

            {/* Direct 1-Click Install for Android/Chrome */}
            {deferredPrompt && (
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl p-4 space-y-2 shadow-md">
                <div className="flex items-center gap-2 text-sm font-bold">
                  <Sparkles size={16} />
                  <span>Άμεση Εγκατάσταση με 1 Κλικ!</span>
                </div>
                <p className="text-xs text-blue-100 leading-relaxed">
                  Η συσκευή σας υποστηρίζει άμεση εγκατάσταση στην αρχική οθόνη.
                </p>
                <button
                  onClick={handleInstallClick}
                  className="w-full py-2.5 bg-white text-blue-700 font-bold rounded-xl text-xs hover:bg-blue-50 transition-all shadow-sm flex items-center justify-center gap-2 mt-1"
                >
                  <Download size={14} />
                  <span>Εγκατάσταση Τώρα</span>
                </button>
              </div>
            )}

            {/* Step-by-Step for Android & iOS */}
            <div className="space-y-3 pt-1">
              {/* Android Tab */}
              <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4 space-y-2">
                <div className="flex items-center gap-2 font-bold text-gray-900 text-xs">
                  <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs">
                    🤖
                  </div>
                  <span>Για κινητά Android (Chrome / Browser):</span>
                </div>
                <ol className="text-xs text-gray-600 space-y-1.5 pl-6 list-decimal leading-relaxed">
                  <li>
                    Πατήστε τις <strong>3 τελείες (⋮)</strong> πάνω δεξιά στον Chrome.
                  </li>
                  <li>
                    Επιλέξτε <strong>«Εγκατάσταση εφαρμογής»</strong> (ή «Προσθήκη στην αρχική οθόνη»).
                  </li>
                  <li>
                    Πατήστε <strong>«Εγκατάσταση»</strong>.
                  </li>
                </ol>
              </div>

              {/* iOS Tab */}
              <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4 space-y-2">
                <div className="flex items-center gap-2 font-bold text-gray-900 text-xs">
                  <div className="w-5 h-5 rounded-full bg-slate-200 text-slate-800 flex items-center justify-center text-xs">
                    🍏
                  </div>
                  <span>Για iPhone & iPad (Safari):</span>
                </div>
                <ol className="text-xs text-gray-600 space-y-1.5 pl-6 list-decimal leading-relaxed">
                  <li>
                    Πατήστε το κουμπί <strong>Κοινοποίησης (Share 📤)</strong> κάτω στο Safari.
                  </li>
                  <li>
                    Κυλήστε λίγο κάτω και πατήστε <strong>«Προσθήκη στην οθόνη Αφετηρίας» (➕)</strong>.
                  </li>
                  <li>
                    Πατήστε <strong>«Προσθήκη»</strong> πάνω δεξιά.
                  </li>
                </ol>
              </div>
            </div>

            {/* Feature Perks */}
            <div className="grid grid-cols-2 gap-2 text-[11px] text-gray-500 pt-1">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 size={13} className="text-emerald-600 shrink-0" />
                <span>Πλήρης οθόνη (χωρίς browser)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 size={13} className="text-emerald-600 shrink-0" />
                <span>Αστραπιαία ταχύτητα</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 size={13} className="text-emerald-600 shrink-0" />
                <span>Αυτόματες ενημερώσεις</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 size={13} className="text-emerald-600 shrink-0" />
                <span>0 MB χώρος στη μνήμη</span>
              </div>
            </div>

            <button
              onClick={() => setOpen(false)}
              className="w-full py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl text-xs transition-all"
            >
              Κατάλαβα
            </button>
          </div>
        </div>
      )}
    </>
  )
}
