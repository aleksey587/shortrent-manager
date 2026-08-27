'use client'

import { useState } from 'react'
import {
  Wifi, Key, MapPin, Clock, Copy, Check, MessageSquare, Phone, Shield,
  Coffee, Utensils, ShoppingCart, Pill, Train, Sparkles, ExternalLink,
  Car, Compass, Ticket, Globe, Tag, Star, ChevronRight, Languages
} from 'lucide-react'

export default function GuidebookPreviewPage() {
  const [lang, setLang] = useState<'el' | 'en'>('el')
  const [copiedWifi, setCopiedWifi] = useState(false)
  const [copiedLock, setCopiedLock] = useState(false)
  const [activeTab, setActiveTab] = useState<'perks' | 'access' | 'local' | 'house'>('perks')

  const copyWifi = () => {
    navigator.clipboard.writeText('Athens2026!')
    setCopiedWifi(true)
    setTimeout(() => setCopiedWifi(false), 2000)
  }

  const copyLockbox = () => {
    navigator.clipboard.writeText('1234')
    setCopiedLock(true)
    setTimeout(() => setCopiedLock(false), 2000)
  }

  const isEn = lang === 'en'

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans pb-20 selection:bg-blue-500 selection:text-white">
      {/* Top Language & Demo Bar */}
      <div className="bg-slate-900 border-b border-slate-800 px-4 py-2 flex items-center justify-between text-xs max-w-md mx-auto">
        <div className="flex items-center gap-1.5 text-amber-400 font-bold">
          <Sparkles size={13} />
          <span>Interactive Live Demo</span>
        </div>
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setLang('el')}
            className={`px-2 py-0.5 rounded-lg font-bold transition-all ${!isEn ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
          >
            🇬🇷 ΕΛ
          </button>
          <button
            onClick={() => setLang('en')}
            className={`px-2 py-0.5 rounded-lg font-bold transition-all ${isEn ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
          >
            🇬🇧 EN
          </button>
        </div>
      </div>

      {/* Top Banner with Property Details */}
      <div className="relative bg-gradient-to-b from-blue-900 via-indigo-950 to-slate-950 px-4 pt-8 pb-8 text-center border-b border-slate-800">
        <div className="max-w-md mx-auto space-y-2.5">
          <div className="inline-flex items-center gap-1.5 bg-blue-500/20 border border-blue-400/30 text-blue-300 px-3 py-1 rounded-full text-xs font-extrabold tracking-wide uppercase">
            <span>GreekHost Digital Guest Guide</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            {isEn ? 'Acropolis View Luxury Suite' : 'Acropolis View Luxury Suite'}
          </h1>
          <p className="text-xs text-slate-300 flex items-center justify-center gap-1">
            <MapPin size={13} className="text-red-400 shrink-0" />
            <span>Ermou 45, Syntagma · Athens 105 63</span>
          </p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="max-w-md mx-auto px-4 mt-4">
        <div className="grid grid-cols-4 bg-slate-900/90 p-1.5 rounded-2xl border border-slate-800 text-xs font-bold shadow-lg">
          <button
            onClick={() => setActiveTab('perks')}
            className={`py-2.5 px-1 rounded-xl transition-all flex flex-col items-center gap-1 text-[11px] ${
              activeTab === 'perks'
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Tag size={15} className={activeTab === 'perks' ? 'text-amber-300' : ''} />
            <span>{isEn ? 'Perks' : 'Προνόμια'}</span>
          </button>
          <button
            onClick={() => setActiveTab('access')}
            className={`py-2.5 px-1 rounded-xl transition-all flex flex-col items-center gap-1 text-[11px] ${
              activeTab === 'access'
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Key size={15} />
            <span>{isEn ? 'Access' : 'Πρόσβαση'}</span>
          </button>
          <button
            onClick={() => setActiveTab('local')}
            className={`py-2.5 px-1 rounded-xl transition-all flex flex-col items-center gap-1 text-[11px] ${
              activeTab === 'local'
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Compass size={15} />
            <span>{isEn ? 'Guide' : 'Περιοχή'}</span>
          </button>
          <button
            onClick={() => setActiveTab('house')}
            className={`py-2.5 px-1 rounded-xl transition-all flex flex-col items-center gap-1 text-[11px] ${
              activeTab === 'house'
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Shield size={15} />
            <span>{isEn ? 'Rules' : 'Κανόνες'}</span>
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
                <span>{isEn ? 'Exclusive Guest Perks & Partner Offers' : 'Guest Partner Offers & Perks'}</span>
              </div>
              <h2 className="text-base font-extrabold text-white">
                {isEn ? 'Selected Travel Services for Your Stay' : 'Αποκλειστικές Ταξιδιωτικές Υπηρεσίες για Επισκέπτες'}
              </h2>
              <p className="text-xs text-slate-300 mt-1">
                {isEn
                  ? 'Handpicked recommendations & special discounts from our official partners for your stay in Athens.'
                  : 'Επιλεγμένες προτάσεις και ειδικές εκπτώσεις από επίσημους συνεργάτες μας για τη διαμονή σας στην Αθήνα.'}
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
                    <h3 className="font-extrabold text-white text-sm">
                      {isEn ? 'Car Rental & Airport Transfers' : 'Ενοικίαση Αυτοκινήτου & Μεταφορές'}
                    </h3>
                    <p className="text-[11px] text-slate-400">Rentalcars · DiscoverCars · Airport Transfers</p>
                  </div>
                </div>
                <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-extrabold px-2 py-0.5 rounded-full shrink-0">
                  {isEn ? 'Up to -20%' : 'Έως -20%'}
                </span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                {isEn
                  ? 'Compare deals from top car rental companies with free cancellation at Athens Airport and city center.'
                  : 'Συγκρίνετε άμεσα τιμές από όλες τις αξιόπιστες εταιρείες ενοικίασης στο αεροδρόμιο ή στο κέντρο της Αθήνας.'}
              </p>
              <button
                type="button"
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors shadow-md shadow-blue-600/20"
              >
                <span>{isEn ? 'Search Rental Cars' : 'Αναζήτηση Αυτοκινήτου'}</span>
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
                    <h3 className="font-extrabold text-white text-sm">
                      {isEn ? 'Ferry Tickets & Greek Island Day Trips' : 'Ακτοπλοϊκά Εισιτήρια & Ημερήσιες Εκδρομές'}
                    </h3>
                    <p className="text-[11px] text-slate-400">Ferryhopper · Hydra, Poros, Aegina, Mykonos</p>
                  </div>
                </div>
                <span className="bg-teal-500/20 text-teal-300 border border-teal-500/30 text-[10px] font-extrabold px-2 py-0.5 rounded-full shrink-0">
                  Direct Book
                </span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                {isEn
                  ? 'Book ferry tickets to all Greek islands with e-ticket support and live route tracking.'
                  : 'Κλείστε online εισιτήρια πλοίων από Πειραιά ή Ραφήνα για όλα τα ελληνικά νησιά χωρίς επιπλέον χρεώσεις.'}
              </p>
              <button
                type="button"
                className="w-full bg-teal-600 hover:bg-teal-500 text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors shadow-md shadow-teal-600/20"
              >
                <span>{isEn ? 'Book Ferry Tickets' : 'Κράτηση Ακτοπλοϊκών'}</span>
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
                    <h3 className="font-extrabold text-white text-sm">
                      {isEn ? 'Acropolis & Museum Skip-the-Line Tickets' : 'Εισιτήρια Ακρόπολης & Μουσείων'}
                    </h3>
                    <p className="text-[11px] text-slate-400">Skip-the-Line · GetYourGuide · Tiqets</p>
                  </div>
                </div>
                <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-extrabold px-2 py-0.5 rounded-full shrink-0">
                  Fast Pass
                </span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                {isEn
                  ? 'Save hours of waiting with digital fast-track entry to Acropolis, Acropolis Museum and audio guides.'
                  : 'Αποφύγετε τις ουρές στα ταμεία με επίσημα ψηφιακά εισιτήρια για την Ακρόπολη, το Μουσείο Ακρόπολης και ξεναγήσεις.'}
              </p>
              <button
                type="button"
                className="w-full bg-amber-600 hover:bg-amber-500 text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors shadow-md shadow-amber-600/20"
              >
                <span>{isEn ? 'Get Fast-Pass Tickets' : 'Εισιτήρια Χωρίς Αναμονή'}</span>
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
                    <h3 className="font-extrabold text-white text-sm">
                      {isEn ? 'eSIM Greece & Europe (Mobile Data)' : 'eSIM Ελλάδα & Ευρώπη (Mobile Data)'}
                    </h3>
                    <p className="text-[11px] text-slate-400">Airalo · Holafly · Instant activation</p>
                  </div>
                </div>
                <span className="bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[10px] font-extrabold px-2 py-0.5 rounded-full shrink-0">
                  4G/5G
                </span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                {isEn
                  ? 'High-speed mobile data without changing your physical SIM card or paying high roaming fees.'
                  : 'Γρήγορο internet στο κινητό σας χωρίς να αλλάξετε φυσική κάρτα SIM ή να πληρώνετε ακριβό roaming.'}
              </p>
              <button
                type="button"
                className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors shadow-md shadow-purple-600/20"
              >
                <span>{isEn ? 'Get Travel eSIM' : 'Απόκτηση eSIM'}</span>
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
                    <h3 className="font-extrabold text-white text-sm">
                      {isEn ? 'High-Speed Wi-Fi' : 'Ασύρματο Δίκτυο (Wi-Fi)'}
                    </h3>
                    <p className="text-[11px] text-slate-400">Fiber 100 Mbps</p>
                  </div>
                </div>
                <span className="bg-teal-500/10 text-teal-400 border border-teal-500/20 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  {isEn ? 'Free' : 'Δωρεάν'}
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 flex items-center justify-between">
                  <span className="text-slate-400 font-medium">SSID:</span>
                  <strong className="text-white font-mono">Acropolis_Guest_WiFi</strong>
                </div>
                <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 flex items-center justify-between">
                  <span className="text-slate-400 font-medium">Password:</span>
                  <strong className="text-white font-mono">Athens2026!</strong>
                </div>
              </div>

              <button
                onClick={copyWifi}
                className="w-full flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-500 text-white font-bold py-2.5 rounded-xl text-xs transition-colors shadow-sm"
              >
                {copiedWifi ? <Check size={14} className="stroke-[3]" /> : <Copy size={14} />}
                <span>{copiedWifi ? (isEn ? 'Copied to clipboard!' : 'Αντιγράφηκε!') : (isEn ? 'Copy Wi-Fi Password' : 'Αντιγραφή Κωδικού Wi-Fi')}</span>
              </button>
            </div>

            {/* Lockbox Card */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold">
                  <Key size={20} />
                </div>
                <div>
                  <h3 className="font-extrabold text-white text-sm">
                    {isEn ? 'Self Check-in & Lockbox' : 'Check-in & Κλειδοθήκη'}
                  </h3>
                  <p className="text-[11px] text-slate-400">Keyless 24/7 Access</p>
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
                <span className="text-[11px] font-bold text-indigo-200 uppercase tracking-wider block">
                  {isEn ? 'Lockbox Code' : 'Κωδικός Lockbox'}
                </span>
                <div className="text-2xl font-black tracking-widest text-indigo-400 font-mono">
                  1234
                </div>
                <button
                  onClick={copyLockbox}
                  className="text-[11px] text-indigo-300 font-bold hover:underline inline-flex items-center gap-1 pt-1"
                >
                  {copiedLock ? <Check size={11} /> : <Copy size={11} />}
                  <span>{copiedLock ? (isEn ? 'Copied!' : 'Αντιγράφηκε!') : (isEn ? 'Copy Code' : 'Αντιγραφή Κωδικού')}</span>
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
                <span>{isEn ? 'Local Neighborhood Guide' : 'Προτάσεις Περιοχής (Local Guide)'}</span>
              </h3>

              <div className="space-y-2.5">
                <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                    <Coffee size={16} />
                  </div>
                  <div>
                    <strong className="text-white block font-bold">
                      {isEn ? 'Specialty Coffee & Breakfast' : 'Καφές & Πρωινό'}
                    </strong>
                    <p className="text-slate-400 text-[11px]">
                      {isEn ? 'Top rated specialty coffee & fresh pastries 150m away.' : 'Specialty καφές και φρέσκα σνακ στα 150 μέτρα.'}
                    </p>
                  </div>
                </div>

                <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-red-500/20 text-red-400 flex items-center justify-center shrink-0">
                    <Utensils size={16} />
                  </div>
                  <div>
                    <strong className="text-white block font-bold">
                      {isEn ? 'Traditional Greek Taverna' : 'Ελληνική Ταβέρνα'}
                    </strong>
                    <p className="text-slate-400 text-[11px]">
                      {isEn ? 'Authentic Greek cuisine, fresh seafood & grill in Plaka.' : 'Παραδοσιακά ελληνικά πιάτα και φρέσκα ψητά.'}
                    </p>
                  </div>
                </div>

                <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
                    <Train size={16} />
                  </div>
                  <div>
                    <strong className="text-white block font-bold">
                      {isEn ? 'Metro & Transit' : 'Σταθμός Μετρό'}
                    </strong>
                    <p className="text-slate-400 text-[11px]">
                      {isEn ? 'Direct Syntagma & Monastiraki metro connections.' : '5 λεπτά με τα πόδια για απευθείας σύνδεση με το κέντρο.'}
                    </p>
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
                <span>{isEn ? 'House Rules' : 'Κανόνες Σπιτιού (House Rules)'}</span>
              </h3>

              <ul className="space-y-2 text-slate-300">
                <li className="flex items-start gap-2">
                  <span>🤫</span>
                  <span><strong>{isEn ? 'Quiet Hours:' : 'Ώρες κοινής ησυχίας:'}</strong> 15:00 - 17:30 & 23:00 - 07:00.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span>🚭</span>
                  <span><strong>{isEn ? 'No Smoking' : 'Απαγορεύεται το κάπνισμα'}</strong> {isEn ? 'indoors.' : 'στους εσωτερικούς χώρους.'}</span>
                </li>
                <li className="flex items-start gap-2">
                  <span>🎉</span>
                  <span><strong>{isEn ? 'No Parties' : 'Απαγορεύονται τα πάρτι'}</strong> {isEn ? 'or unauthorized events.' : 'και οι συγκεντρώσεις.'}</span>
                </li>
              </ul>
            </div>
          </div>
        )}

        {/* Footer info */}
        <div className="bg-gradient-to-r from-blue-900/30 to-indigo-900/30 border border-blue-500/20 rounded-3xl p-5 text-center space-y-2">
          <h4 className="font-extrabold text-white text-sm">GreekHost Guest Experience</h4>
          <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
            Powered by GreekHost SaaS Platform · All rights reserved.
          </p>
        </div>
      </div>
    </div>
  )
}
