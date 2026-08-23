'use client'

import { useState } from 'react'
import {
  Sparkles, X, Gift, Check, ArrowRight, Zap, Globe, MessageSquare,
  SprayCan, Calendar, Smartphone, FileText, ChevronRight, Rocket
} from 'lucide-react'
import Link from 'next/link'

export default function WhatsNewModal() {
  const [isOpen, setIsOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'released' | 'upcoming'>('released')

  return (
    <>
      {/* Trigger Button in Sidebar */}
      <button
        onClick={() => setIsOpen(true)}
        className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold text-indigo-700 bg-indigo-50/80 hover:bg-indigo-100/80 transition-all border border-indigo-200/60 shadow-2xs group"
      >
        <div className="flex items-center gap-2">
          <Sparkles size={14} className="text-amber-500 group-hover:rotate-12 transition-transform" />
          <span>✨ Τι Νέο Υπάρχει</span>
        </div>
        <span className="bg-indigo-600 text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded-md uppercase tracking-wider">
          v2.5
        </span>
      </button>

      {/* Modal Popup */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4"
          onClick={() => setIsOpen(false)}
        >
          <div
            className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-7 space-y-5 shadow-2xl animate-in zoom-in-95 duration-150 border border-gray-100 max-h-[92vh] overflow-y-auto relative"
            onClick={e => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-5 right-5 text-gray-400 hover:text-gray-600 p-1.5 rounded-full hover:bg-gray-100 transition-colors"
            >
              <X size={18} />
            </button>

            {/* Header */}
            <div className="flex items-center gap-3 pr-8">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 text-white flex items-center justify-center font-black text-xl shadow-lg shadow-indigo-500/20 shrink-0">
                🚀
              </div>
              <div>
                <div className="inline-flex items-center gap-1.5 bg-blue-50 border border-blue-200 text-blue-700 px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider mb-0.5">
                  <span>GreekHost Changelog & Roadmap</span>
                </div>
                <h3 className="font-extrabold text-gray-900 text-lg">Τι Νέο Υπάρχει & Επόμενες Αναβαθμίσεις</h3>
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
                <span>🎉 Νέες Λειτουργίες (v2.5)</span>
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
                <span>🔮 Έρχεται Σύντομα (v3.0)</span>
              </button>
            </div>

            {/* TAB 1: NEWLY RELEASED (v2.5) */}
            {activeTab === 'released' && (
              <div className="space-y-3.5 animate-in fade-in duration-150">
                {/* Feature 1: Cleaning Hub */}
                <div className="bg-gray-50 border border-gray-200/80 rounded-2xl p-4 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 font-bold text-gray-900 text-xs">
                      <span className="p-1.5 bg-teal-100 text-teal-700 rounded-lg text-sm">🧹</span>
                      <span>Διαχείριση & Πρόγραμμα Καθαριστριών (Cleaning Hub)</span>
                    </div>
                    <span className="text-[10px] bg-teal-50 text-teal-700 font-bold border border-teal-200 px-2 py-0.5 rounded-md">
                      Live
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 leading-relaxed pl-8">
                    Αυτόματος προγραμματισμός καθαρισμών σε κάθε check-out, ειδοποιήσεις <strong>Same-Day Turnaround (⚠️)</strong> και αποστολή ολόκληρου του μηνιαίου προγράμματος στο WhatsApp με 1 κλικ!
                  </p>
                </div>

                {/* Feature 2: Guest Messaging */}
                <div className="bg-gray-50 border border-gray-200/80 rounded-2xl p-4 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 font-bold text-gray-900 text-xs">
                      <span className="p-1.5 bg-blue-100 text-blue-700 rounded-lg text-sm">📬</span>
                      <span>Αυτόματα Μηνύματα Επισκεπτών & Custom Templates</span>
                    </div>
                    <span className="text-[10px] bg-blue-50 text-blue-700 font-bold border border-blue-200 px-2 py-0.5 rounded-md">
                      Live
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 leading-relaxed pl-8">
                    5 έτοιμα στάδια επικοινωνίας σε <strong>🇬🇷 Ελληνικά & 🇬🇧 English</strong>, έξυπνη αντικατάσταση μεταβλητών (όνομα, Wi-Fi, lockbox) και δυνατότητα δημιουργίας δικών σας προτύπων.
                  </p>
                </div>

                {/* Feature 3: Digital Guidebook */}
                <div className="bg-gray-50 border border-gray-200/80 rounded-2xl p-4 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 font-bold text-gray-900 text-xs">
                      <span className="p-1.5 bg-indigo-100 text-indigo-700 rounded-lg text-sm">📱</span>
                      <span>Digital Guest Guidebook (Mobile Web App)</span>
                    </div>
                    <span className="text-[10px] bg-indigo-50 text-indigo-700 font-bold border border-indigo-200 px-2 py-0.5 rounded-md">
                      Live
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 leading-relaxed pl-8">
                    Ένας πανέμορφος ψηφιακός οδηγός για το κινητό του επισκέπτη (κωδικός Wi-Fi με 1-click copy, οδηγίες A/C/θερμοσίφωνα, χάρτης Google Maps και τοπικές προτάσεις).
                  </p>
                </div>

                {/* Feature 4: Timeline Calendar */}
                <div className="bg-gray-50 border border-gray-200/80 rounded-2xl p-4 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 font-bold text-gray-900 text-xs">
                      <span className="p-1.5 bg-purple-100 text-purple-700 rounded-lg text-sm">📅</span>
                      <span>Multi-Property Timeline Ημερολόγιο</span>
                    </div>
                    <span className="text-[10px] bg-purple-50 text-purple-700 font-bold border border-purple-200 px-2 py-0.5 rounded-md">
                      Live
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 leading-relaxed pl-8">
                    Οριζόντιο Timeline για ταυτόχρονη προβολή όλων των ακινήτων cross-platform (Airbnb, Booking.com, VRBO) όπως στα μεγάλα διεθνή PMS.
                  </p>
                </div>
              </div>
            )}

            {/* TAB 2: UPCOMING MAJOR UPDATE (v3.0) */}
            {activeTab === 'upcoming' && (
              <div className="space-y-3.5 animate-in fade-in duration-150">
                {/* Upcoming Feature 1: Direct Booking Mini-Site */}
                <div className="bg-gradient-to-r from-purple-50 via-indigo-50 to-blue-50 border border-purple-200 rounded-2xl p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 font-extrabold text-purple-950 text-xs">
                      <span className="p-1.5 bg-purple-200 text-purple-800 rounded-lg text-sm">🌐</span>
                      <span>Direct Booking Mini-Site & Engine (Χωρίς Προμήθειες!)</span>
                    </div>
                    <span className="text-[10px] bg-purple-600 text-white font-extrabold px-2 py-0.5 rounded-md uppercase tracking-wider">
                      Σύντομα
                    </span>
                  </div>
                  <p className="text-xs text-gray-700 leading-relaxed pl-8">
                    Κάθε ακίνητο αποκτά <strong>δική του προσωπική ιστοσελίδα απευθείας κρατήσεων</strong>. Οι επισκέπτες κάνουν κράτηση απευθείας με κάρτα (Stripe) ή IRIS, <strong>γλιτώνοντας το 15-20% των προμηθειών του Airbnb</strong>!
                  </p>
                </div>

                {/* Upcoming Feature 2: Direct In-App Messaging */}
                <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-2xl p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 font-extrabold text-blue-950 text-xs">
                      <span className="p-1.5 bg-blue-200 text-blue-800 rounded-lg text-sm">💬</span>
                      <span>Unified In-App Chat Inbox</span>
                    </div>
                    <span className="text-[10px] bg-blue-600 text-white font-extrabold px-2 py-0.5 rounded-md uppercase tracking-wider">
                      Σύντομα
                    </span>
                  </div>
                  <p className="text-xs text-gray-700 leading-relaxed pl-8">
                    Ενιαίο panel συνομιλιών για να διαβάζετε και να απαντάτε στα μηνύματα των επισκεπτών από όλες τις πλατφόρμες απευθείας μέσα από το GreekHost.
                  </p>
                </div>

                {/* Upcoming Feature 3: Realtime 2-Way Channel API */}
                <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-2xl p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 font-extrabold text-emerald-950 text-xs">
                      <span className="p-1.5 bg-emerald-200 text-emerald-800 rounded-lg text-sm">⚡</span>
                      <span>2-Way Realtime Channel Sync</span>
                    </div>
                    <span className="text-[10px] bg-emerald-600 text-white font-extrabold px-2 py-0.5 rounded-md uppercase tracking-wider">
                      Σύντομα
                    </span>
                  </div>
                  <p className="text-xs text-gray-700 leading-relaxed pl-8">
                    Αυτόματη αλλαγή τιμών και διαθεσιμότητας σε πραγματικό χρόνο απευθείας στα portals (Airbnb, Booking.com, VRBO) μέσα σε 2 δευτερόλεπτα.
                  </p>
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
              <span className="text-[11px] text-gray-400 font-medium">GreekHost Platform 2026</span>
              <button
                onClick={() => setIsOpen(false)}
                className="bg-gray-900 hover:bg-black text-white font-bold py-2 px-4 rounded-xl text-xs transition-colors"
              >
                Κλείσιμο
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
