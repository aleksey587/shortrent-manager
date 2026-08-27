'use client'

import { useState } from 'react'
import {
  Wifi, Key, MapPin, Clock, Copy, Check, MessageSquare, Phone, Shield,
  Coffee, Utensils, ShoppingCart, Pill, Train, Sparkles, ExternalLink,
  Car, Compass, Ticket, Globe, Tag, Star, ChevronRight
} from 'lucide-react'

export default function GuidebookPreviewPage() {
  const [copiedWifi, setCopiedWifi] = useState(false)
  const [copiedLock, setCopiedLock] = useState(false)
  const [activeTab, setActiveTab] = useState<'access' | 'local' | 'perks' | 'house'>('perks')

  const copyWifi = () => {
    navigator.clipboard.writeText('GreekHost2026!')
    setCopiedWifi(true)
    setTimeout(() => setCopiedWifi(false), 2000)
  }

  const copyLockbox = () => {
    navigator.clipboard.writeText('3592')
    setCopiedLock(true)
    setTimeout(() => setCopiedLock(false), 2000)
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans pb-20 selection:bg-blue-500 selection:text-white">
      {/* Top Banner with Property Details */}
      <div className="relative bg-gradient-to-b from-blue-900 via-indigo-950 to-slate-950 px-4 pt-10 pb-8 text-center border-b border-slate-800">
        <div className="max-w-md mx-auto space-y-3">
          <div className="inline-flex items-center gap-1.5 bg-blue-500/20 border border-blue-400/30 text-blue-300 px-3 py-1 rounded-full text-xs font-extrabold tracking-wide uppercase">
            <Sparkles size={13} className="text-amber-400" />
            <span>GreekHost Digital Guest Guide</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            Callisto — Luxury Rooftop Suite
          </h1>
          <p className="text-xs text-slate-300 flex items-center justify-center gap-1">
            <MapPin size={13} className="text-red-400 shrink-0" />
            <span>Parasiou 28, Athens 104 40</span>
          </p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="max-w-md mx-auto px-4 mt-4">
        <div className="grid grid-cols-4 bg-slate-900/90 p-1.5 rounded-2xl border border-slate-800 text-xs font-bold shadow-lg">
          <button
            onClick={() => setActiveTab('perks')}
            className={`py-2 px-1 rounded-xl transition-all flex flex-col items-center gap-1 text-[11px] ${
              activeTab === 'perks'
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Tag size={14} className={activeTab === 'perks' ? 'text-amber-300' : ''} />
            <span>Προνόμια</span>
          </button>
          <button
            onClick={() => setActiveTab('access')}
            className={`py-2 px-1 rounded-xl transition-all flex flex-col items-center gap-1 text-[11px] ${
              activeTab === 'access'
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Key size={14} />
            <span>Πρόσβαση</span>
          </button>
          <button
            onClick={() => setActiveTab('local')}
            className={`py-2 px-1 rounded-xl transition-all flex flex-col items-center gap-1 text-[11px] ${
              activeTab === 'local'
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Compass size={14} />
            <span>Περιοχή</span>
          </button>
          <button
            onClick={() => setActiveTab('house')}
            className={`py-2 px-1 rounded-xl transition-all flex flex-col items-center gap-1 text-[11px] ${
              activeTab === 'house'
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Shield size={14} />
            <span>Κανόνες</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-md mx-auto px-4 mt-6 space-y-5">
        {/* TAB 1: PARTNER PERKS & AFFILIATE SERVICES */}
        {activeTab === 'perks' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            {/* Header intro */}
            <div className="bg-gradient-to-r from-amber-500/10 via-indigo-500/10 to-blue-500/10 border border-amber-500/20 rounded-3xl p-4.5">
              <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider mb-1">
                <Star size={14} className="fill-amber-400" />
                <span>Guest Partner Offers & Perks</span>
              </div>
              <h2 className="text-base font-extrabold text-white">
                Αποκλειστικές Ταξιδιωτικές Υπηρεσίες για Επισκέπτες
              </h2>
              <p className="text-xs text-slate-300 mt-1">
                Επιλεγμένες προτάσεις και ειδικές εκπτώσεις από επίσημους συνεργάτες μας για τη διαμονή σας στην Αθήνα.
              </p>
            </div>

            {/* Offer 1: Car Rental & Airport Transfers */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-xl hover:border-slate-700 transition-all space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
                    <Car size={22} />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h3 className="font-extrabold text-white text-sm">Ενοικίαση Αυτοκινήτου & Μεταφορές</h3>
                    </div>
                    <p className="text-[11px] text-slate-400">Rentalcars · DiscoverCars · Airport Transfers</p>
                  </div>
                </div>
                <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-extrabold px-2 py-0.5 rounded-full shrink-0">
                  Έως -20%
                </span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Συγκρίνετε άμεσα τιμές από όλες τις αξιόπιστες εταιρείες ενοικίασης στο αεροδρόμιο ή στο κέντρο της Αθήνας.
              </p>
              <button
                type="button"
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors shadow-md shadow-blue-600/20"
              >
                <span>Αναζήτηση Αυτοκινήτου</span>
                <ExternalLink size={13} />
              </button>
            </div>

            {/* Offer 2: Ferry Tickets & Island Tours */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-xl hover:border-slate-700 transition-all space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-teal-500/20 text-teal-400 flex items-center justify-center shrink-0">
                    <Compass size={22} />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-white text-sm">Ακτοπλοϊκά Εισιτήρια & Ημερήσιες Εκδρομές</h3>
                    <p className="text-[11px] text-slate-400">Ferryhopper · Ύδρα, Πόρος, Αίγινα, Μύκονος</p>
                  </div>
                </div>
                <span className="bg-teal-500/20 text-teal-300 border border-teal-500/30 text-[10px] font-extrabold px-2 py-0.5 rounded-full shrink-0">
                  Direct Book
                </span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Κλείστε online εισιτήρια πλοίων από Πειραιά ή Ραφήνα για όλα τα ελληνικά νησιά χωρίς επιπλέον χρεώσεις.
              </p>
              <button
                type="button"
                className="w-full bg-teal-600 hover:bg-teal-500 text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors shadow-md shadow-teal-600/20"
              >
                <span>Κράτηση Ακτοπλοϊκών</span>
                <ExternalLink size={13} />
              </button>
            </div>

            {/* Offer 3: Skip-the-Line Museum & Acropolis Tickets */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-xl hover:border-slate-700 transition-all space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                    <Ticket size={22} />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-white text-sm">Εισιτήρια Ακρόπολης & Μουσείων</h3>
                    <p className="text-[11px] text-slate-400">Skip-the-Line · GetYourGuide · Tiqets</p>
                  </div>
                </div>
                <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-extrabold px-2 py-0.5 rounded-full shrink-0">
                  Fast Pass
                </span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Αποφύγετε τις ουρές στα ταμεία με επίσημα ψηφιακά εισιτήρια για την Ακρόπολη, το Μουσείο Ακρόπολης και ξεναγήσεις.
              </p>
              <button
                type="button"
                className="w-full bg-amber-600 hover:bg-amber-500 text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors shadow-md shadow-amber-600/20"
              >
                <span>Εισιτήρια Χωρίς Αναμονή</span>
                <ExternalLink size={13} />
              </button>
            </div>

            {/* Offer 4: eSIM & Travel Internet */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-xl hover:border-slate-700 transition-all space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-purple-500/20 text-purple-400 flex items-center justify-center shrink-0">
                    <Globe size={22} />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-white text-sm">eSIM Ελλάδα & Ευρώπη (Mobile Data)</h3>
                    <p className="text-[11px] text-slate-400">Airalo · Holafly · Άμεση ενεργοποίηση</p>
                  </div>
                </div>
                <span className="bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[10px] font-extrabold px-2 py-0.5 rounded-full shrink-0">
                  4G/5G
                </span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Γρήγορο internet στο κινητό σας χωρίς να αλλάξετε φυσική κάρτα SIM ή να πληρώνετε ακριβό roaming.
              </p>
              <button
                type="button"
                className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors shadow-md shadow-purple-600/20"
              >
                <span>Απόκτηση eSIM</span>
                <ExternalLink size={13} />
              </button>
            </div>
          </div>
        )}

        {/* TAB 2: ACCESS & WIFI */}
        {activeTab === 'access' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            {/* Wi-Fi Card */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-teal-500/20 text-teal-400 flex items-center justify-center font-bold">
                    <Wifi size={20} />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-white text-sm">Ασύρματο Δίκτυο (Wi-Fi)</h3>
                    <p className="text-[11px] text-slate-400">Υψηλής ταχύτητας VDSL / Fiber</p>
                  </div>
                </div>
                <span className="bg-teal-500/10 text-teal-400 border border-teal-500/20 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  Δωρεάν
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 flex items-center justify-between">
                  <span className="text-slate-400 font-medium">Όνομα Δικτύου (SSID):</span>
                  <strong className="text-white font-mono">Callisto_Guest_WiFi</strong>
                </div>
                <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 flex items-center justify-between">
                  <span className="text-slate-400 font-medium">Κωδικός (Password):</span>
                  <strong className="text-white font-mono">GreekHost2026!</strong>
                </div>
              </div>

              <button
                onClick={copyWifi}
                className="w-full flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-500 text-white font-bold py-2.5 rounded-xl text-xs transition-colors shadow-sm"
              >
                {copiedWifi ? <Check size={14} className="stroke-[3]" /> : <Copy size={14} />}
                <span>{copiedWifi ? 'Αντιγράφηκε στο πρόχειρο!' : 'Αντιγραφή Κωδικού Wi-Fi'}</span>
              </button>
            </div>

            {/* Lockbox Card */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold">
                  <Key size={20} />
                </div>
                <div>
                  <h3 className="font-extrabold text-white text-sm">Check-in & Κλειδοθήκη</h3>
                  <p className="text-[11px] text-slate-400">Αυτοματοποιημένη είσοδος (Self Check-in)</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-center text-xs">
                <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Check-in</span>
                  <strong className="text-sm font-extrabold text-white">15:00</strong>
                </div>
                <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Check-out</span>
                  <strong className="text-sm font-extrabold text-white">11:00</strong>
                </div>
              </div>

              <div className="bg-gradient-to-r from-indigo-950/80 to-blue-950/80 border border-indigo-500/30 rounded-2xl p-4 text-center space-y-1">
                <span className="text-[11px] font-bold text-indigo-200 uppercase tracking-wider block">Κωδικός Lockbox</span>
                <div className="text-2xl font-black tracking-widest text-indigo-400 font-mono">
                  3592
                </div>
                <button
                  onClick={copyLockbox}
                  className="text-[11px] text-indigo-300 font-bold hover:underline inline-flex items-center gap-1 pt-1"
                >
                  {copiedLock ? <Check size={11} /> : <Copy size={11} />}
                  <span>{copiedLock ? 'Αντιγράφηκε!' : 'Αντιγραφή Κωδικού'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: LOCAL GUIDE */}
        {activeTab === 'local' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-3.5 text-xs">
              <h3 className="font-extrabold text-white text-sm flex items-center gap-2">
                <Compass size={16} className="text-blue-400" />
                <span>Προτάσεις Περιοχής (Local Guide)</span>
              </h3>

              <div className="space-y-2.5">
                <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                    <Coffee size={16} />
                  </div>
                  <div>
                    <strong className="text-white block font-bold">Καφές & Πρωινό</strong>
                    <p className="text-slate-400 text-[11px]">Specialty καφές και φρέσκα σνακ στα 150 μέτρα.</p>
                  </div>
                </div>

                <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-red-500/20 text-red-400 flex items-center justify-center shrink-0">
                    <Utensils size={16} />
                  </div>
                  <div>
                    <strong className="text-white block font-bold">Ελληνική Ταβέρνα</strong>
                    <p className="text-slate-400 text-[11px]">Παραδοσιακά ελληνικά πιάτα και φρέσκα ψητά.</p>
                  </div>
                </div>

                <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
                    <Train size={16} />
                  </div>
                  <div>
                    <strong className="text-white block font-bold">Σταθμός Μετρό</strong>
                    <p className="text-slate-400 text-[11px]">5 λεπτά με τα πόδια για απευθείας σύνδεση με το κέντρο.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: HOUSE RULES */}
        {activeTab === 'house' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-3 text-xs">
              <h3 className="font-extrabold text-white text-sm flex items-center gap-2">
                <Shield size={16} className="text-blue-400" />
                <span>Κανόνες Σπιτιού (House Rules)</span>
              </h3>

              <ul className="space-y-2 text-slate-300">
                <li className="flex items-start gap-2">
                  <span>🤫</span>
                  <span><strong>Ώρες κοινής ησυχίας:</strong> 15:00 - 17:30 & 23:00 - 07:00.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span>🚭</span>
                  <span><strong>Απαγορεύεται το κάπνισμα</strong> στους εσωτερικούς χώρους.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span>🎉</span>
                  <span><strong>Απαγορεύονται τα πάρτι</strong> και οι συγκεντρώσεις.</span>
                </li>
              </ul>
            </div>
          </div>
        )}

        {/* Footer info */}
        <div className="bg-gradient-to-r from-blue-900/30 to-indigo-900/30 border border-blue-500/20 rounded-3xl p-5 text-center space-y-2">
          <h4 className="font-extrabold text-white text-sm">GreekHost Guest Experience</h4>
          <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
            Powered by GreekHost SaaS Platform · Όλα τα δικαιώματα διατηρούνται.
          </p>
        </div>
      </div>
    </div>
  )
}
