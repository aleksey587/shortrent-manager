'use client'

import { useState } from 'react'
import {
  Sparkles, X, Check, Rocket
} from 'lucide-react'

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
          v3.0
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
                  <span>GreekHost v3.0 · Powered by UpLogic</span>
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
                    Κάθε ακίνητο απέκτησε <strong>δική του ιστοσελίδα απευθείας κρατήσεων (`/stay/[id]`)</strong> με έλεγχο διαθεσιμότητας σε πραγματικό χρόνο και επιλογή πληρωμής Κάρτας ή IRIS!
                  </p>
                </div>

                {/* Feature 2: 2-Way Channel Manager */}
                <div className="bg-gray-50 border border-gray-200/80 rounded-2xl p-4 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 font-bold text-gray-900 text-xs">
                      <span className="p-1.5 bg-emerald-100 text-emerald-700 rounded-lg text-sm">⚡</span>
                      <span>2-Way Channel Manager & Συνεχής Auto-Sync</span>
                    </div>
                    <span className="text-[10px] bg-emerald-50 text-emerald-700 font-bold border border-emerald-200 px-2 py-0.5 rounded-md">
                      Live
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 leading-relaxed pl-8">
                    Άμεση αποστολή τιμών σε Airbnb & Booking.com μέσω Channex API, συνεχής αυτόματος συγχρονισμός iCal κάθε 3 λεπτά και αυτόματη ανίχνευση ακυρώσεων.
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
                    Ψηφιακός οδηγός σε <strong>🇬🇷 Ελληνικά & 🇬🇧 English</strong>, καρτέλα ταξιδιωτικών προνομίων (ενοικιάσεις αυτοκινήτων, ακτοπλοϊκά, μουσεία) και εκτυπώσιμη κάρτα A4 με QR Code!
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
              </div>
            )}

            {/* Footer */}
            <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
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
