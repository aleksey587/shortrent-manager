'use client'

import { Sparkles, Lock, Check, X, ArrowRight } from 'lucide-react'
import Link from 'next/link'

interface Props {
  isOpen: boolean
  onClose: () => void
  featureTitle?: string
  featureDescription?: string
}

export default function ProFeatureModal({
  isOpen,
  onClose,
  featureTitle = 'Αυτή η λειτουργία ανήκει στο πακέτο Pro',
  featureDescription = 'Ξεκλειδώστε προηγμένους αυτοματισμούς, προσαρμοσμένα πρότυπα μηνυμάτων, μηνιαία dispatch καθαρισμών και απεριόριστες δυνατότητες.'
}: Props) {
  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full space-y-5 shadow-2xl animate-in zoom-in-95 duration-150 border border-gray-100 relative"
        onClick={e => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-gray-400 hover:text-gray-600 font-bold p-1 rounded-full hover:bg-gray-100 transition-colors"
        >
          <X size={18} />
        </button>

        {/* Hero Icon */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center font-black text-xl shadow-lg shadow-purple-500/20">
            <Sparkles size={22} className="text-amber-300" />
          </div>
          <div>
            <div className="inline-flex items-center gap-1 bg-purple-50 border border-purple-200 text-purple-700 px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider">
              ⭐ Pro Member Exclusive
            </div>
            <h3 className="font-extrabold text-gray-900 text-base sm:text-lg mt-0.5">{featureTitle}</h3>
          </div>
        </div>

        <p className="text-xs text-gray-600 leading-relaxed">
          {featureDescription}
        </p>

        {/* Benefits list */}
        <div className="bg-purple-50/50 border border-purple-100 rounded-2xl p-4 space-y-2 text-xs text-gray-700">
          <div className="font-bold text-purple-950 text-xs mb-1">Τι περιλαμβάνει το Pro:</div>
          <div className="flex items-center gap-2">
            <Check size={14} className="text-emerald-600 stroke-[3] shrink-0" />
            <span>Δημιουργία & Επεξεργασία δικών σας Προτύπων Μηνυμάτων</span>
          </div>
          <div className="flex items-center gap-2">
            <Check size={14} className="text-emerald-600 stroke-[3] shrink-0" />
            <span>Μηνιαία Προγράμματα & Αυτοματισμοί WhatsApp για Καθαρίστριες</span>
          </div>
          <div className="flex items-center gap-2">
            <Check size={14} className="text-emerald-600 stroke-[3] shrink-0" />
            <span>Multi-Property Timeline Ημερολόγιο (Cross-Platform)</span>
          </div>
          <div className="flex items-center gap-2">
            <Check size={14} className="text-emerald-600 stroke-[3] shrink-0" />
            <span>Αυτόματη Αποστολή στοιχείων ΑΑΔΕ στον Λογιστή με 1 κλικ</span>
          </div>
        </div>

        {/* Action buttons */}
        <div className="space-y-2 pt-1">
          <Link
            href="/dashboard/pricing"
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-extrabold py-3.5 px-4 rounded-2xl text-xs transition-all shadow-md shadow-purple-500/25"
          >
            <span>Αναβάθμιση σε Pro (από 4,08€/μήνα)</span>
            <ArrowRight size={14} />
          </Link>

          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 text-xs text-gray-400 hover:text-gray-600 font-semibold transition-colors text-center"
          >
            Ίσως αργότερα
          </button>
        </div>
      </div>
    </div>
  )
}
