'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  Wifi, Key, MapPin, Clock, Copy, Check, MessageSquare, Phone, Shield,
  Coffee, Utensils, ShoppingCart, Pill, Train, Sparkles, ExternalLink, HelpCircle, ChevronRight
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

  const [property, setProperty] = useState<Property | null>(null)
  const [loading, setLoading] = useState(true)
  const [copiedWifi, setCopiedWifi] = useState(false)
  const [copiedLock, setCopiedLock] = useState(false)
  const [activeTab, setActiveTab] = useState<'access' | 'house' | 'local'>('access')

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
          <p className="text-gray-400 text-sm font-medium">Φόρτωση ψηφιακού οδηγού...</p>
        </div>
      </div>
    )
  }

  if (!property) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-6 text-center">
        <div className="max-w-md space-y-4">
          <span className="text-4xl">🏡</span>
          <h1 className="text-xl font-bold">Ο οδηγός δεν βρέθηκε</h1>
          <p className="text-xs text-gray-400">Παρακαλούμε ελέγξτε τον σύνδεσμο που λάβατε από τον οικοδεσπότη σας.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans pb-16">
      {/* Mobile-first Hero Header */}
      <div className="relative bg-gradient-to-b from-blue-900 via-indigo-950 to-slate-950 px-6 pt-10 pb-8 rounded-b-[36px] shadow-2xl border-b border-blue-500/20">
        <div className="max-w-md mx-auto space-y-3">
          <div className="inline-flex items-center gap-1.5 bg-white/10 backdrop-blur border border-white/15 px-3 py-1 rounded-full text-xs font-semibold text-blue-200">
            <span>✨ Digital Welcome Guide</span>
          </div>

          <h1 className="text-3xl font-black tracking-tight text-white flex items-center gap-2">
            <span>{property.name}</span>
          </h1>

          {property.address && (
            <p className="text-xs text-blue-200/80 flex items-center gap-1.5">
              <MapPin size={13} className="text-blue-400 shrink-0" />
              <span>{property.address}</span>
            </p>
          )}

          {/* Quick Maps Button */}
          {property.address && (
            <button
              onClick={openGoogleMaps}
              className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition-all shadow-md shadow-blue-600/30 pt-2"
            >
              <MapPin size={13} />
              <span>📍 Οδηγίες Google Maps</span>
            </button>
          )}
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 mt-6 space-y-5">
        {/* TAB SELECTOR */}
        <div className="grid grid-cols-3 gap-1.5 bg-slate-900 p-1.5 rounded-2xl border border-slate-800">
          <button
            onClick={() => setActiveTab('access')}
            className={`py-2 px-2 rounded-xl text-xs font-bold transition-all text-center ${
              activeTab === 'access'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            🔑 Πρόσβαση
          </button>
          <button
            onClick={() => setActiveTab('house')}
            className={`py-2 px-2 rounded-xl text-xs font-bold transition-all text-center ${
              activeTab === 'house'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            🏡 Σπίτι & Κανόνες
          </button>
          <button
            onClick={() => setActiveTab('local')}
            className={`py-2 px-2 rounded-xl text-xs font-bold transition-all text-center ${
              activeTab === 'local'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            ☕ Τοπικός Οδηγός
          </button>
        </div>

        {/* TAB 1: ACCESS & WI-FI */}
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
                    <h3 className="font-extrabold text-white text-sm">Σύνδεση Wi-Fi</h3>
                    <p className="text-[11px] text-slate-400">Υψηλής ταχύτητας Internet</p>
                  </div>
                </div>
              </div>

              <div className="bg-slate-950/80 rounded-2xl p-3.5 border border-slate-800/80 space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Δίκτυο (SSID):</span>
                  <strong className="text-white font-mono">{property.wifi_name || 'Δεν ορίστηκε'}</strong>
                </div>

                <div className="flex justify-between items-center border-t border-slate-800/60 pt-2">
                  <span className="text-slate-400">Κωδικός:</span>
                  <strong className="text-teal-400 font-mono font-bold">{property.wifi_password || 'Δεν ορίστηκε'}</strong>
                </div>
              </div>

              {property.wifi_password && (
                <button
                  onClick={copyWifi}
                  className="w-full flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-500 text-white font-bold py-2.5 rounded-xl text-xs transition-colors shadow-sm"
                >
                  {copiedWifi ? <Check size={14} className="stroke-[3]" /> : <Copy size={14} />}
                  <span>{copiedWifi ? 'Αντιγράφηκε στο πρόχειρο!' : 'Αντιγραφή Κωδικού Wi-Fi'}</span>
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
                  <h3 className="font-extrabold text-white text-sm">Check-in & Κλειδοθήκη</h3>
                  <p className="text-[11px] text-slate-400">Αυτοματοποιημένη είσοδος (Self Check-in)</p>
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
                  <span className="text-[11px] font-bold text-indigo-200 uppercase tracking-wider block">Κωδικός Lockbox / Εισόδου</span>
                  <div className="text-2xl font-black tracking-widest text-indigo-400 font-mono">
                    {property.lockbox_code}
                  </div>
                  <button
                    onClick={copyLockbox}
                    className="text-[11px] text-indigo-300 font-bold hover:underline inline-flex items-center gap-1 pt-1"
                  >
                    {copiedLock ? <Check size={11} /> : <Copy size={11} />}
                    <span>{copiedLock ? 'Αντιγράφηκε!' : 'Αντιγραφή Κωδικού'}</span>
                  </button>
                </div>
              )}

              {property.directions && (
                <div className="bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800 text-xs text-slate-300 space-y-1">
                  <strong className="text-white block font-bold">🧭 Οδηγίες Πρόσβασης:</strong>
                  <p className="leading-relaxed">{property.directions}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: HOUSE MANUAL & RULES */}
        {activeTab === 'house' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            {/* House Appliances */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4 text-xs">
              <h3 className="font-extrabold text-white text-sm flex items-center gap-2">
                <span>⚡</span>
                <span>Οδηγίες Συσκευών</span>
              </h3>

              <div className="space-y-3">
                <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 space-y-1">
                  <strong className="text-blue-400 block font-bold">🚿 Ζεστό Νερό / Θερμοσίφωνας:</strong>
                  <p className="text-slate-300 leading-relaxed">
                    Το ζεστό νερό είναι πάντα διαθέσιμο αυτόματα (ή ανάψτε τον διακόπτη στον πίνακα για 15 λεπτά).
                  </p>
                </div>

                <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 space-y-1">
                  <strong className="text-blue-400 block font-bold">❄️ Κλιματισμός (A/C):</strong>
                  <p className="text-slate-300 leading-relaxed">
                    Παρακαλούμε κλείνετε τα κλιματιστικά όταν βρίσκεστε εκτός καταλύματος για προστασία του περιβάλλοντος.
                  </p>
                </div>

                <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 space-y-1">
                  <strong className="text-blue-400 block font-bold">🗑️ Απορρίμματα:</strong>
                  <p className="text-slate-300 leading-relaxed">
                    Οι κάδοι απορριμμάτων βρίσκονται ακριβώς έξω από την κύρια είσοδο του κτιρίου.
                  </p>
                </div>
              </div>
            </div>

            {/* House Rules */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-3 text-xs">
              <h3 className="font-extrabold text-white text-sm flex items-center gap-2">
                <span>📜</span>
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
                  <span><strong>Απαγορεύονται τα πάρτι</strong> και οι συγκεντρώσεις χωρίς έγκριση.</span>
                </li>
              </ul>
            </div>
          </div>
        )}

        {/* TAB 3: LOCAL GUIDE */}
        {activeTab === 'local' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-3.5 text-xs">
              <h3 className="font-extrabold text-white text-sm flex items-center gap-2">
                <span>📍</span>
                <span>Προτάσεις Περιοχής (Local Recommendations)</span>
              </h3>

              <div className="space-y-2.5">
                <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                    <Coffee size={16} />
                  </div>
                  <div>
                    <strong className="text-white block font-bold">Καφές & Πρωινό</strong>
                    <p className="text-slate-400 text-[11px]">Υπέροχος specialty καφές και φρέσκα σνακ σε κοντινή απόσταση.</p>
                  </div>
                </div>

                <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-red-500/20 text-red-400 flex items-center justify-center shrink-0">
                    <Utensils size={16} />
                  </div>
                  <div>
                    <strong className="text-white block font-bold">Ελληνική Ταβέρνα & Εστιατόριο</strong>
                    <p className="text-slate-400 text-[11px]">Παραδοσιακά ελληνικά πιάτα, φρέσκα ψητά και τοπικές γεύσεις.</p>
                  </div>
                </div>

                <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                    <ShoppingCart size={16} />
                  </div>
                  <div>
                    <strong className="text-white block font-bold">Supermarket & Mini Market</strong>
                    <p className="text-slate-400 text-[11px]">Για όλα τα καθημερινά σας ψώνια, νερά και τρόφιμα στα 200μ.</p>
                  </div>
                </div>

                <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
                    <Train size={16} />
                  </div>
                  <div>
                    <strong className="text-white block font-bold">Μετρό & Συγκοινωνία</strong>
                    <p className="text-slate-400 text-[11px]">Εύκολη πρόσβαση στο κέντρο της Αθήνας (Σύνταγμα, Ακρόπολη).</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer: Emergency Host Contact */}
        <div className="bg-gradient-to-r from-blue-900/40 to-indigo-900/40 border border-blue-500/30 rounded-3xl p-5 text-center space-y-2">
          <span className="text-lg">🌿</span>
          <h4 className="font-extrabold text-white text-sm">Χρειάζεστε βοήθεια;</h4>
          <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
            Είμαστε πάντα στη διάθεσή σας για οποιαδήποτε ερώτηση ή πληροφορία.
          </p>
        </div>
      </div>
    </div>
  )
}
