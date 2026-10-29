'use client'

import { useState, useEffect } from 'react'
import {
  Sparkles, X, Check, Rocket, ArrowRight, ExternalLink
} from 'lucide-react'
import Link from 'next/link'

export const OPEN_WHATS_NEW_EVENT = 'open-greekhost-whats-new'

export function triggerWhatsNewModal() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(OPEN_WHATS_NEW_EVENT))
  }
}

export default function WhatsNewModal() {
  const [isOpen, setIsOpen] = useState(false)
  const [showBanner, setShowBanner] = useState(false)
  const [activeTab, setActiveTab] = useState<'released' | 'upcoming'>('released')

  useEffect(() => {
    // 1. Check if user has seen v3.0 update
    try {
      const hasSeenModal = localStorage.getItem('greekhost_update_v3_seen')
      const hasDismissedBanner = localStorage.getItem('greekhost_banner_v3_dismissed')

      if (!hasSeenModal) {
        // Auto pop-up for anyone opening the app after 800ms
        const timer = setTimeout(() => {
          setIsOpen(true)
        }, 800)
        return () => clearTimeout(timer)
      } else if (!hasDismissedBanner) {
        setShowBanner(true)
      }
    } catch (e) {
      // localStorage fallback
    }

    // 2. Listen to manual trigger events
    const handleOpen = () => setIsOpen(true)
    window.addEventListener(OPEN_WHATS_NEW_EVENT, handleOpen)
    return () => window.removeEventListener(OPEN_WHATS_NEW_EVENT, handleOpen)
  }, [])

  const handleClose = () => {
    setIsOpen(false)
    try {
      localStorage.setItem('greekhost_update_v3_seen', 'true')
    } catch (e) {}
  }

  const handleDismissBanner = () => {
    setShowBanner(false)
    try {
      localStorage.setItem('greekhost_banner_v3_dismissed', 'true')
    } catch (e) {}
  }

  return (
    <>
      {/* Top Announcement Banner on Dashboard */}
      {showBanner && !isOpen && (
        <div className="mb-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-900 text-white rounded-2xl p-3 sm:p-3.5 shadow-md border border-indigo-500/30 flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-500 to-indigo-600 border border-white/20 text-white flex items-center justify-center text-lg shrink-0 shadow-sm">
              🚀
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs sm:text-sm font-extrabold text-white">
                  Νέα Αναβάθμιση GreekHost v3.0 Live!
                </span>
                <span className="bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                  ΝΕΟ
                </span>
                <span className="text-[10px] text-indigo-300 hidden md:inline">
                  Powered by UpLogic
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-indigo-200 truncate mt-0.5">
                Ενεργοποιήθηκαν οι Απευθείας Κρατήσεις χωρίς προμήθειες (Direct Booking Mini-Site) & Realtime Channel Sync.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setIsOpen(true)}
              className="bg-white hover:bg-blue-50 text-indigo-950 font-bold px-3 py-1.5 rounded-xl text-xs transition-all shadow-xs flex items-center gap-1.5 shrink-0"
            >
              <Sparkles size={13} className="text-amber-500" />
              <span>Τι άλλαξε</span>
            </button>
            <button
              onClick={handleDismissBanner}
              className="text-white/60 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors"
              aria-label="Κλείσιμο"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Modal Popup */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4"
          onClick={handleClose}
        >
          <div
            className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-7 space-y-5 shadow-2xl animate-in zoom-in-95 duration-200 border border-gray-100 max-h-[92vh] overflow-y-auto relative"
            onClick={e => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={handleClose}
              className="absolute top-5 right-5 text-gray-400 hover:text-gray-600 p-1.5 rounded-full hover:bg-gray-100 transition-colors"
            >
              <X size={18} />
            </button>

            {/* Header */}
            <div className="flex items-center gap-3.5 pr-8">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 text-white flex items-center justify-center font-black text-2xl shadow-lg shadow-indigo-500/25 shrink-0">
                🚀
              </div>
              <div>
                <div className="inline-flex items-center gap-1.5 bg-blue-50 border border-blue-200 text-blue-700 px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider mb-0.5">
                  <span>GreekHost v3.0 · Powered by UpLogic</span>
                </div>
                <h3 className="font-extrabold text-gray-900 text-lg sm:text-xl">
                  Τι Νέο Υπάρχει & Επόμενες Αναβαθμίσεις
                </h3>
              </div>
            </div>

            {/* Tabs */}
            <div className="grid grid-cols-2 gap-2 bg-gray-100 p-1.5 rounded-2xl border border-gray-200">
              <button
                onClick={() => setActiveTab('released')}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  activeTab === 'released'
                    ? 'bg-white text-blue-700 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Sparkles size={13} className="text-amber-500" />
                <span>🎉 Νέες Λειτουργίες (v3.0 Live)</span>
              </button>
              <button
                onClick={() => setActiveTab('upcoming')}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  activeTab === 'upcoming'
                    ? 'bg-white text-purple-700 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Rocket size={13} className="text-purple-600" />
                <span>🔮 Επόμενα (v3.5 Roadmap)</span>
              </button>
            </div>

            {/* TAB 1: NEWLY RELEASED (v3.0) */}
            {activeTab === 'released' && (
              <div className="space-y-3.5 animate-in fade-in duration-150">
                {/* Feature 1: Direct Booking Mini-Site */}
                <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-2xl p-4 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 font-bold text-gray-900 text-xs">
                      <span className="p-1.5 bg-purple-200 text-purple-800 rounded-lg text-sm">🌐</span>
                      <span>Direct Booking Mini-Site & Engine (0% Προμήθειες!)</span>
                    </div>
                    <span className="text-[10px] bg-emerald-600 text-white font-extrabold px-2 py-0.5 rounded-md">
                      ΝΕΟ · Live
                    </span>
                  </div>
                  <p className="text-xs text-gray-700 leading-relaxed pl-8">
                    Κάθε ακίνητο απέκτησε <strong>δική του ιστοσελίδα απευθείας κρατήσεων (`/stay/[id]`)</strong> με έλεγχο διαθεσιμότητας σε πραγματικό χρόνο, επιλογή πληρωμής με Κάρτα ή IRIS και εξοικονόμηση 15-20% από τις προμήθειες του Airbnb!
                  </p>
                </div>

                {/* Feature 2: 2-Way Channel Manager */}
                <div className="bg-gray-50 border border-gray-200/80 rounded-2xl p-4 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 font-bold text-gray-900 text-xs">
                      <span className="p-1.5 bg-emerald-100 text-emerald-700 rounded-lg text-sm">⚡</span>
                      <span>2-Way Channel Manager & Realtime Auto-Sync</span>
                    </div>
                    <span className="text-[10px] bg-emerald-50 text-emerald-700 font-bold border border-emerald-200 px-2 py-0.5 rounded-md">
                      Live
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 leading-relaxed pl-8">
                    Συνεχής αυτόματος συγχρονισμός iCal για μηδενικά double-bookings, αυτόματη ανίχνευση νέων κρατήσεων/ακυρώσεων και υποδομή διασύνδεσης καναλιών.
                  </p>
                </div>

                {/* Feature 3: Digital Guidebook + Perks + QR */}
                <div className="bg-gray-50 border border-gray-200/80 rounded-2xl p-4 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 font-bold text-gray-900 text-xs">
                      <span className="p-1.5 bg-indigo-100 text-indigo-700 rounded-lg text-sm">📱</span>
                      <span>Δίγλωσσο Digital Guidebook + Perks + Εκτύπωση QR</span>
                    </div>
                    <span className="text-[10px] bg-indigo-50 text-indigo-700 font-bold border border-indigo-200 px-2 py-0.5 rounded-md">
                      Live
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 leading-relaxed pl-8">
                    Ψηφιακός οδηγός σε <strong>🇬🇷 Ελληνικά & 🇬🇧 English</strong>, καρτέλα ταξιδιωτικών προνομίων (ενοικιάσεις αυτοκινήτων, ακτοπλοϊκά, μουσεία) και εκτυπώσιμη κάρτα stand με QR Code!
                  </p>
                </div>

                {/* Feature 4: Cleaning Hub & Guest Messaging */}
                <div className="bg-gray-50 border border-gray-200/80 rounded-2xl p-4 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 font-bold text-gray-900 text-xs">
                      <span className="p-1.5 bg-teal-100 text-teal-700 rounded-lg text-sm">🧹</span>
                      <span>Cleaning Hub & Αυτόματοι Κανόνες Μηνυμάτων WhatsApp</span>
                    </div>
                    <span className="text-[10px] bg-teal-50 text-teal-700 font-bold border border-teal-200 px-2 py-0.5 rounded-md">
                      Live
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 leading-relaxed pl-8">
                    Μηνιαίο πρόγραμμα καθαριστριών με Same-Day Turnaround alerts και προγραμματισμένοι κανόνες επικοινωνίας επισκεπτών.
                  </p>
                </div>
              </div>
            )}

            {/* TAB 2: UPCOMING ROADMAP (v3.5) */}
            {activeTab === 'upcoming' && (
              <div className="space-y-3.5 animate-in fade-in duration-150">
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 font-extrabold text-blue-950 text-xs">
                      <span className="p-1.5 bg-blue-200 text-blue-800 rounded-lg text-sm">🤖</span>
                      <span>AI Smart Pricing & Dynamic Rate Optimizer</span>
                    </div>
                    <span className="text-[10px] bg-blue-600 text-white font-extrabold px-2 py-0.5 rounded-md uppercase tracking-wider">
                      v3.5
                    </span>
                  </div>
                  <p className="text-xs text-gray-700 leading-relaxed pl-8">
                    Αυτόματες προτάσεις τιμών ανά ημέρα βάσει ζήτησης περιοχής, πληρότητας και εποχικότητας για αύξηση εσόδων έως +25%.
                  </p>
                </div>

                <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-2xl p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 font-extrabold text-emerald-950 text-xs">
                      <span className="p-1.5 bg-emerald-200 text-emerald-800 rounded-lg text-sm">🔐</span>
                      <span>Smart Lock Automated PIN Generator</span>
                    </div>
                    <span className="text-[10px] bg-emerald-600 text-white font-extrabold px-2 py-0.5 rounded-md uppercase tracking-wider">
                      v3.5
                    </span>
                  </div>
                  <p className="text-xs text-gray-700 leading-relaxed pl-8">
                    Σύνδεση με έξυπνες κλειδαριές (Nuki, Yale, TTLock) για αυτόματη δημιουργία μοναδικού κωδικού PIN ανά κράτηση.
                  </p>
                </div>

                <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-2xl p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 font-extrabold text-purple-950 text-xs">
                      <span className="p-1.5 bg-purple-200 text-purple-800 rounded-lg text-sm">💬</span>
                      <span>Unified In-App Chat Inbox</span>
                    </div>
                    <span className="text-[10px] bg-purple-600 text-white font-extrabold px-2 py-0.5 rounded-md uppercase tracking-wider">
                      v3.5
                    </span>
                  </div>
                  <p className="text-xs text-gray-700 leading-relaxed pl-8">
                    Ενιαίο inbox για διαχείριση όλων των μηνυμάτων επισκεπτών με γρήγορες απαντήσεις (Quick Replies) και ιστορικό επικοινωνίας.
                  </p>
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="pt-2 border-t border-gray-100 flex items-center justify-between gap-3">
              <span className="text-[11px] text-gray-400 font-medium">
                GreekHost Platform · Engineered & Powered by{' '}
                <a
                  href="https://uplogic.gr"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-indigo-600 hover:underline font-extrabold"
                >
                  UpLogic
                </a>
              </span>
              <button
                onClick={handleClose}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-5 rounded-xl text-xs transition-colors shadow-sm"
              >
                Το Κατάλαβα 👍
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

/**
 * Sidebar button that dispatches the open event
 */
export function WhatsNewSidebarButton() {
  const [hasNewBadge, setHasNewBadge] = useState(false)

  useEffect(() => {
    try {
      const seen = localStorage.getItem('greekhost_update_v3_seen')
      if (!seen) setHasNewBadge(true)
    } catch (e) {}
  }, [])

  const handleClick = () => {
    setHasNewBadge(false)
    triggerWhatsNewModal()
  }

  return (
    <button
      onClick={handleClick}
      className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold text-indigo-700 bg-indigo-50/80 hover:bg-indigo-100/80 transition-all border border-indigo-200/60 shadow-2xs group relative"
    >
      <div className="flex items-center gap-2">
        <Sparkles size={14} className="text-amber-500 group-hover:rotate-12 transition-transform" />
        <span>✨ Τι Νέο Υπάρχει</span>
      </div>
      <div className="flex items-center gap-1.5">
        {hasNewBadge && (
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
        )}
        <span className="bg-indigo-600 text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded-md uppercase tracking-wider">
          v3.0
        </span>
      </div>
    </button>
  )
}
