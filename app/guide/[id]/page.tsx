'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  Wifi, Key, MapPin, Clock, Copy, Check, MessageSquare, Phone, Shield,
  Coffee, Utensils, ShoppingCart, Pill, Train, Sparkles, ExternalLink,
  Car, Compass, Ticket, Globe, Tag, Star
} from 'lucide-react'

interface Property {
  id: string
  name: string
  address: string | null
  color: string
  description?: string | null
  wifi_name?: string | null
  wifi_password?: string | null
  lockbox_code?: string | null
  check_in_time?: string | null
  check_out_time?: string | null
  directions?: string | null
  house_rules?: string | null
}

export default function PublicGuestGuidebook() {
  const params = useParams()
  const propertyId = params?.id as string
  const supabase = createClient()

  const [lang, setLang] = useState<'el' | 'en'>('el')
  const [property, setProperty] = useState<Property | null>(null)
  const [loading, setLoading] = useState(true)
  const [copiedWifi, setCopiedWifi] = useState(false)
  const [copiedLock, setCopiedLock] = useState(false)
  const [activeTab, setActiveTab] = useState<'access' | 'perks' | 'local' | 'house'>('access')

  const isEn = lang === 'en'

  useEffect(() => {
    if (propertyId) {
      fetchProperty()
    }
  }, [propertyId])

  async function fetchProperty() {
    setLoading(true)
    const { data } = await supabase
      .from('properties')
      .select('*')
      .eq('id', propertyId)
      .single()

    if (data) {
      setProperty(data)
    }
    setLoading(false)
  }

  const copyWifi = () => {
    if (property?.wifi_password) {
      navigator.clipboard.writeText(property.wifi_password)
      setCopiedWifi(true)
      setTimeout(() => setCopiedWifi(false), 2000)
    }
  }

  const copyLockbox = () => {
    if (property?.lockbox_code) {
      navigator.clipboard.writeText(property.lockbox_code)
      setCopiedLock(true)
      setTimeout(() => setCopiedLock(false), 2000)
    }
  }

  const openGoogleMaps = () => {
    if (property?.address) {
      window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(property.address)}`, '_blank')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-gray-400 text-sm font-medium">Loading Digital Guest Guide...</p>
        </div>
      </div>
    )
  }

  if (!property) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-6 text-center">
        <div className="max-w-md space-y-4">
          <span className="text-4xl">🏡</span>
          <h1 className="text-xl font-bold">Ο οδηγός δεν βρέθηκε / Guide not found</h1>
          <p className="text-xs text-gray-400">Παρακαλούμε ελέγξτε τον σύνδεσμο που λάβατε από τον οικοδεσπότη σας.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans pb-20 selection:bg-blue-500 selection:text-white">
      {/* Top Language Bar */}
      <div className="bg-slate-900 border-b border-slate-800 px-4 py-2 flex items-center justify-between text-xs max-w-md mx-auto">
        <div className="flex items-center gap-1.5 text-blue-400 font-bold">
          <Sparkles size={13} className="text-amber-400" />
          <span>GreekHost Guest App</span>
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

      {/* Hero Header */}
      <div className="relative bg-gradient-to-b from-blue-900 via-indigo-950 to-slate-950 px-4 pt-8 pb-7 text-center border-b border-slate-800">
        <div className="max-w-md mx-auto space-y-3">
          <div className="inline-flex items-center gap-1.5 bg-blue-500/20 border border-blue-400/30 text-blue-300 px-3 py-1 rounded-full text-xs font-extrabold tracking-wide uppercase">
            <span>{isEn ? 'Digital Guest Guide' : 'Ψηφιακός Οδηγός Διαμονής'}</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            {property.name}
          </h1>

          {property.address && (
            <button
              onClick={openGoogleMaps}
              className="inline-flex items-center gap-1.5 text-xs text-slate-300 hover:text-white bg-slate-900/70 border border-slate-700/80 px-3.5 py-1.5 rounded-xl transition-all"
            >
              <MapPin size={13} className="text-red-400 shrink-0" />
              <span>{property.address}</span>
              <ExternalLink size={11} className="text-slate-400 ml-0.5" />
            </button>
          )}
        </div>
      </div>

      {/* Navigation Tabs (4 Tabs) */}
      <div className="max-w-md mx-auto px-4 mt-4">
        <div className="grid grid-cols-4 bg-slate-900/90 p-1.5 rounded-2xl border border-slate-800 text-xs font-bold shadow-lg">
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
            onClick={() => setActiveTab('perks')}
            className={`py-2.5 px-1 rounded-xl transition-all flex flex-col items-center gap-1 text-[11px] ${
              activeTab === 'perks'
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Tag size={15} className={activeTab === 'perks' ? 'text-amber-300' : 'text-amber-400'} />
            <span>{isEn ? 'Perks' : 'Προνόμια'}</span>
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
            <span>{isEn ? 'Local' : 'Περιοχή'}</span>
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

      {/* Main Content */}
      <div className="max-w-md mx-auto px-4 mt-6 space-y-5">
        {/* TAB 1: ACCESS & WIFI */}
        {activeTab === 'access' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            {/* Wi-Fi Card */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-3.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-teal-500/20 text-teal-400 flex items-center justify-center font-bold">
                    <Wifi size={20} />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-white text-sm">
                      {isEn ? 'Wi-Fi Internet' : 'Σύνδεση Wi-Fi'}
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      {isEn ? 'High-speed wireless network' : 'Δωρεάν ασύρματο δίκτυο'}
                    </p>
                  </div>
                </div>
                <span className="bg-teal-500/10 text-teal-400 border border-teal-500/20 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  {isEn ? 'Free' : 'Δωρεάν'}
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 flex items-center justify-between">
                  <span className="text-slate-400 font-medium">{isEn ? 'Network (SSID):' : 'Όνομα Δικτύου:'}</span>
                  <strong className="text-white font-mono">{property.wifi_name || 'Guest_WiFi'}</strong>
                </div>
                <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 flex items-center justify-between">
                  <span className="text-slate-400 font-medium">{isEn ? 'Password:' : 'Κωδικός:'}</span>
                  <strong className="text-white font-mono">{property.wifi_password || '—'}</strong>
                </div>
              </div>

              {property.wifi_password && (
                <button
                  onClick={copyWifi}
                  className="w-full flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-500 text-white font-bold py-2.5 rounded-xl text-xs transition-colors shadow-sm"
                >
                  {copiedWifi ? <Check size={14} className="stroke-[3]" /> : <Copy size={14} />}
                  <span>
                    {copiedWifi
                      ? (isEn ? 'Copied to clipboard!' : 'Αντιγράφηκε στο πρόχειρο!')
                      : (isEn ? 'Copy Wi-Fi Password' : 'Αντιγραφή Κωδικού Wi-Fi')}
                  </span>
                </button>
              )}
            </div>

            {/* Lockbox & Check-in Card */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-3.5">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold">
                  <Key size={20} />
                </div>
                <div>
                  <h3 className="font-extrabold text-white text-sm">
                    {isEn ? 'Check-in & Key Lockbox' : 'Check-in & Κλειδοθήκη'}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    {isEn ? 'Automated Self Check-in' : 'Αυτοματοποιημένη είσοδος (Self Check-in)'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-center text-xs">
                <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Check-in</span>
                  <strong className="text-sm font-extrabold text-white">{property.check_in_time || '15:00'}</strong>
                </div>
                <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Check-out</span>
                  <strong className="text-sm font-extrabold text-white">{property.check_out_time || '11:00'}</strong>
                </div>
              </div>

              {property.lockbox_code && (
                <div className="bg-gradient-to-r from-indigo-950/80 to-blue-950/80 border border-indigo-500/30 rounded-2xl p-4 text-center space-y-1">
                  <span className="text-[11px] font-bold text-indigo-200 uppercase tracking-wider block">
                    {isEn ? 'Lockbox / Entry Code' : 'Κωδικός Lockbox / Εισόδου'}
                  </span>
                  <div className="text-2xl font-black tracking-widest text-indigo-400 font-mono">
                    {property.lockbox_code}
                  </div>
                  <button
                    onClick={copyLockbox}
                    className="text-[11px] text-indigo-300 font-bold hover:underline inline-flex items-center gap-1 pt-1"
                  >
                    {copiedLock ? <Check size={11} /> : <Copy size={11} />}
                    <span>
                      {copiedLock
                        ? (isEn ? 'Copied!' : 'Αντιγράφηκε!')
                        : (isEn ? 'Copy Code' : 'Αντιγραφή Κωδικού')}
                    </span>
                  </button>
                </div>
              )}

              {property.directions && (
                <div className="bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800 text-xs text-slate-300 space-y-1">
                  <strong className="text-white block font-bold">
                    {isEn ? '🧭 Access Instructions:' : '🧭 Οδηγίες Πρόσβασης:'}
                  </strong>
                  <p className="leading-relaxed">{property.directions}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: PARTNER PERKS & AFFILIATE SERVICES */}
        {activeTab === 'perks' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="bg-gradient-to-r from-amber-500/10 via-indigo-500/10 to-blue-500/10 border border-amber-500/20 rounded-3xl p-4.5">
              <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider mb-1">
                <Star size={14} className="fill-amber-400" />
                <span>{isEn ? 'Exclusive Guest Perks' : 'Προνόμια Επισκεπτών'}</span>
              </div>
              <h2 className="text-base font-extrabold text-white">
                {isEn ? 'Recommended Travel Services & Discounts' : 'Επιλεγμένες Ταξιδιωτικές Υπηρεσίες & Εκπτώσεις'}
              </h2>
              <p className="text-xs text-slate-300 mt-1">
                {isEn
                  ? 'Book online with our official travel partners for the best rates during your stay.'
                  : 'Κάντε κράτηση online μέσω των επίσημων συνεργατών μας με τις καλύτερες τιμές για τη διαμονή σας.'}
              </p>
            </div>

            {/* Offer 1: Car Rental */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
                    <Car size={22} />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-white text-sm">
                      {isEn ? 'Car Rental & Airport Transfers' : 'Ενοικίαση Αυτοκινήτου & Μεταφορές'}
                    </h3>
                    <p className="text-[11px] text-slate-400">Rentalcars · DiscoverCars · Airport Pickup</p>
                  </div>
                </div>
                <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-extrabold px-2 py-0.5 rounded-full shrink-0">
                  {isEn ? 'Up to -20%' : 'Έως -20%'}
                </span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                {isEn
                  ? 'Compare car rental deals with free cancellation at the airport or city center.'
                  : 'Συγκρίνετε τιμές ενοικίασης αυτοκινήτου με δωρεάν ακύρωση στο αεροδρόμιο ή στο κέντρο.'}
              </p>
              <a
                href="https://www.rentalcars.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors shadow-md"
              >
                <span>{isEn ? 'Search Rental Cars' : 'Αναζήτηση Αυτοκινήτου'}</span>
                <ExternalLink size={13} />
              </a>
            </div>

            {/* Offer 2: Ferry Tickets */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-teal-500/20 text-teal-400 flex items-center justify-center shrink-0">
                    <Compass size={22} />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-white text-sm">
                      {isEn ? 'Ferry Tickets & Island Day Trips' : 'Ακτοπλοϊκά Εισιτήρια & Εκδρομές'}
                    </h3>
                    <p className="text-[11px] text-slate-400">Ferryhopper · Greek Islands</p>
                  </div>
                </div>
                <span className="bg-teal-500/20 text-teal-300 border border-teal-500/30 text-[10px] font-extrabold px-2 py-0.5 rounded-full shrink-0">
                  Direct Book
                </span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                {isEn
                  ? 'Book ferry tickets to all Greek islands with instant e-tickets and no hidden fees.'
                  : 'Κλείστε ακτοπλοϊκά εισιτήρια για όλα τα ελληνικά νησιά με άμεσο e-ticket.'}
              </p>
              <a
                href="https://www.ferryhopper.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full bg-teal-600 hover:bg-teal-500 text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors shadow-md"
              >
                <span>{isEn ? 'Book Ferry Tickets' : 'Κράτηση Ακτοπλοϊκών'}</span>
                <ExternalLink size={13} />
              </a>
            </div>

            {/* Offer 3: Museum & Tours */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                    <Ticket size={22} />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-white text-sm">
                      {isEn ? 'Acropolis & Museum Fast-Track Tickets' : 'Εισιτήρια Ακρόπολης & Ξεναγήσεις'}
                    </h3>
                    <p className="text-[11px] text-slate-400">Skip-the-Line · Guided Tours</p>
                  </div>
                </div>
                <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-extrabold px-2 py-0.5 rounded-full shrink-0">
                  Fast Pass
                </span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                {isEn
                  ? 'Skip the ticket lines at the Acropolis, Acropolis Museum and top attractions.'
                  : 'Αποφύγετε τις ουρές στα ταμεία για Ακρόπολη, Μουσείο Ακρόπολης και αρχαιολογικούς χώρους.'}
              </p>
              <a
                href="https://www.getyourguide.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full bg-amber-600 hover:bg-amber-500 text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors shadow-md"
              >
                <span>{isEn ? 'Get Fast-Pass Tickets' : 'Εισιτήρια Χωρίς Αναμονή'}</span>
                <ExternalLink size={13} />
              </a>
            </div>
          </div>
        )}

        {/* TAB 3: LOCAL GUIDE */}
        {activeTab === 'local' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-3.5 text-xs">
              <h3 className="font-extrabold text-white text-sm flex items-center gap-2">
                <span>📍</span>
                <span>{isEn ? 'Local Area Recommendations' : 'Προτάσεις Περιοχής'}</span>
              </h3>

              <div className="space-y-2.5">
                <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                    <Coffee size={16} />
                  </div>
                  <div>
                    <strong className="text-white block font-bold">
                      {isEn ? 'Coffee & Breakfast' : 'Καφές & Πρωινό'}
                    </strong>
                    <p className="text-slate-400 text-[11px]">
                      {isEn ? 'Great specialty coffee and fresh bakery snacks nearby.' : 'Υπέροχος specialty καφές και φρέσκα σνακ σε κοντινή απόσταση.'}
                    </p>
                  </div>
                </div>

                <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-red-500/20 text-red-400 flex items-center justify-center shrink-0">
                    <Utensils size={16} />
                  </div>
                  <div>
                    <strong className="text-white block font-bold">
                      {isEn ? 'Traditional Greek Taverna' : 'Ελληνική Ταβέρνα & Εστιατόριο'}
                    </strong>
                    <p className="text-slate-400 text-[11px]">
                      {isEn ? 'Authentic Greek dishes, fresh salads and local flavors.' : 'Παραδοσιακά ελληνικά πιάτα, φρέσκα ψητά και τοπικές γεύσεις.'}
                    </p>
                  </div>
                </div>

                <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                    <ShoppingCart size={16} />
                  </div>
                  <div>
                    <strong className="text-white block font-bold">Supermarket & Mini Market</strong>
                    <p className="text-slate-400 text-[11px]">
                      {isEn ? 'For daily groceries, bottled water and essentials within 200m.' : 'Για όλα τα καθημερινά σας ψώνια, νερά και τρόφιμα στα 200μ.'}
                    </p>
                  </div>
                </div>

                <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
                    <Train size={16} />
                  </div>
                  <div>
                    <strong className="text-white block font-bold">
                      {isEn ? 'Metro & Public Transit' : 'Μετρό & Συγκοινωνία'}
                    </strong>
                    <p className="text-slate-400 text-[11px]">
                      {isEn ? 'Easy access to the city center, Syntagma and Acropolis.' : 'Εύκολη πρόσβαση στο κέντρο της Αθήνας (Σύνταγμα, Ακρόπολη).'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: HOUSE MANUAL & RULES */}
        {activeTab === 'house' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4 text-xs">
              <h3 className="font-extrabold text-white text-sm flex items-center gap-2">
                <span>⚡</span>
                <span>{isEn ? 'Appliance Instructions' : 'Οδηγίες Συσκευών'}</span>
              </h3>

              <div className="space-y-3">
                <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 space-y-1">
                  <strong className="text-blue-400 block font-bold">
                    {isEn ? '🚿 Hot Water:' : '🚿 Ζεστό Νερό / Θερμοσίφωνας:'}
                  </strong>
                  <p className="text-slate-300 leading-relaxed">
                    {isEn
                      ? 'Hot water is available 24/7 automatically (or switch on the water heater on the main panel for 15 mins).'
                      : 'Το ζεστό νερό είναι πάντα διαθέσιμο αυτόματα (ή ανάψτε τον διακόπτη στον πίνακα για 15 λεπτά).'}
                  </p>
                </div>

                <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 space-y-1">
                  <strong className="text-blue-400 block font-bold">
                    {isEn ? '❄️ Air Conditioning (A/C):' : '❄️ Κλιματισμός (A/C):'}
                  </strong>
                  <p className="text-slate-300 leading-relaxed">
                    {isEn
                      ? 'Please turn off A/C units when leaving the apartment to conserve energy.'
                      : 'Παρακαλούμε κλείνετε τα κλιματιστικά όταν βρίσκεστε εκτός καταλύματος για προστασία του περιβάλλοντος.'}
                  </p>
                </div>

                <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 space-y-1">
                  <strong className="text-blue-400 block font-bold">
                    {isEn ? '🗑️ Waste Disposal:' : '🗑️ Απορρίμματα:'}
                  </strong>
                  <p className="text-slate-300 leading-relaxed">
                    {isEn
                      ? 'Waste and recycling bins are located right outside the main building entrance.'
                      : 'Οι κάδοι απορριμμάτων βρίσκονται ακριβώς έξω από την κύρια είσοδο του κτιρίου.'}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-3 text-xs">
              <h3 className="font-extrabold text-white text-sm flex items-center gap-2">
                <span>📜</span>
                <span>{isEn ? 'House Rules' : 'Κανόνες Σπιτιού (House Rules)'}</span>
              </h3>

              {property.house_rules ? (
                <p className="text-slate-300 leading-relaxed whitespace-pre-line">{property.house_rules}</p>
              ) : (
                <ul className="space-y-2 text-slate-300">
                  <li className="flex items-start gap-2">
                    <span>🤫</span>
                    <span>
                      <strong>{isEn ? 'Quiet hours:' : 'Ώρες κοινής ησυχίας:'}</strong> 15:00 - 17:30 & 23:00 - 07:00.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span>🚭</span>
                    <span>
                      <strong>{isEn ? 'No smoking' : 'Απαγορεύεται το κάπνισμα'}</strong> {isEn ? 'inside the apartment.' : 'στους εσωτερικούς χώρους.'}
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span>🎉</span>
                    <span>
                      <strong>{isEn ? 'No parties' : 'Απαγορεύονται τα πάρτι'}</strong> {isEn ? 'or events.' : 'και οι συγκεντρώσεις χωρίς έγκριση.'}
                    </span>
                  </li>
                </ul>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="bg-gradient-to-r from-blue-900/40 to-indigo-900/40 border border-blue-500/30 rounded-3xl p-5 text-center space-y-2">
          <span className="text-lg">🌿</span>
          <h4 className="font-extrabold text-white text-sm">
            {isEn ? 'Need anything during your stay?' : 'Χρειάζεστε βοήθεια;'}
          </h4>
          <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
            {isEn
              ? 'Feel free to message your host anytime through the booking platform.'
              : 'Είμαστε πάντα στη διάθεσή σας για οποιαδήποτε ερώτηση ή πληροφορία.'}
          </p>
        </div>
      </div>
    </div>
  )
}
