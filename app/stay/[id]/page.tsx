'use client'

import { useState, useEffect, useMemo } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  MapPin, Calendar, Users, Wifi, ShieldCheck, Sparkles, CheckCircle2,
  Clock, Euro, MessageSquare, Phone, Mail, Star, ChevronRight, Lock, Globe
} from 'lucide-react'
import { format, differenceInDays, addDays, parseISO } from 'date-fns'
import { el } from 'date-fns/locale'

interface Property {
  id: string
  name: string
  address: string | null
  color: string
  description?: string | null
  cleaning_fee?: number | null
  check_in_time?: string | null
  check_out_time?: string | null
  house_rules?: string | null
}

interface BookingRange {
  check_in: string
  check_out: string
}

interface MonthlyRate {
  year: number
  month: number
  price_per_night: number
}

export default function DirectBookingMiniSite() {
  const params = useParams()
  const propertyId = params?.id as string
  const supabase = createClient()

  const [lang, setLang] = useState<'el' | 'en'>('el')
  const [property, setProperty] = useState<Property | null>(null)
  const [bookedDates, setBookedDates] = useState<BookingRange[]>([])
  const [monthlyRates, setMonthlyRates] = useState<MonthlyRate[]>([])
  const [loading, setLoading] = useState(true)

  // Booking form state
  const todayStr = format(new Date(), 'yyyy-MM-dd')
  const defaultOutStr = format(addDays(new Date(), 3), 'yyyy-MM-dd')

  const [checkIn, setCheckIn] = useState(todayStr)
  const [checkOut, setCheckOut] = useState(defaultOutStr)
  const [guests, setGuests] = useState('2')
  const [guestName, setGuestName] = useState('')
  const [guestEmail, setGuestEmail] = useState('')
  const [guestPhone, setGuestPhone] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'iris'>('card')
  const [submitting, setSubmitting] = useState(false)
  const [bookingConfirmed, setBookingConfirmed] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const isEn = lang === 'en'

  useEffect(() => {
    if (propertyId) {
      fetchPropertyData()
    }
  }, [propertyId])

  async function fetchPropertyData() {
    setLoading(true)
    const [{ data: prop }, { data: books }, { data: rates }] = await Promise.all([
      supabase.from('properties').select('*').eq('id', propertyId).single(),
      supabase.from('bookings').select('check_in, check_out').eq('property_id', propertyId),
      supabase.from('monthly_rates').select('year, month, price_per_night').eq('property_id', propertyId),
    ])

    if (prop) setProperty(prop)
    if (books) setBookedDates(books)
    if (rates) setMonthlyRates(rates)
    setLoading(false)
  }

  // Check if selected dates overlap with existing bookings
  const isAvailable = useMemo(() => {
    if (!checkIn || !checkOut || checkOut <= checkIn) return false
    return !bookedDates.some(b => checkIn < b.check_out && checkOut > b.check_in)
  }, [checkIn, checkOut, bookedDates])

  // Calculate price
  const pricing = useMemo(() => {
    if (!checkIn || !checkOut || checkOut <= checkIn) {
      return { nights: 0, ratePerNight: 85, accommodation: 0, cleaning: 0, total: 0, airbnbSavings: 0 }
    }
    const nights = Math.max(1, differenceInDays(parseISO(checkOut), parseISO(checkIn)))
    const d = parseISO(checkIn)
    const year = d.getFullYear()
    const month = d.getMonth() + 1

    const foundRate = monthlyRates.find(r => r.year === year && r.month === month)
      || monthlyRates.find(r => r.month === month)

    let ratePerNight = foundRate ? Number(foundRate.price_per_night) : 85
    if (!foundRate) {
      if (month >= 6 && month <= 9) ratePerNight = 120
      else if (month === 4 || month === 5 || month === 10) ratePerNight = 85
      else ratePerNight = 70
    }

    const cleaning = property?.cleaning_fee ? Number(property.cleaning_fee) : 30
    const accommodation = nights * ratePerNight
    const total = accommodation + cleaning
    const airbnbSavings = Math.round(total * 0.17) // ~17% OTA fee saved

    return { nights, ratePerNight, accommodation, cleaning, total, airbnbSavings }
  }, [checkIn, checkOut, monthlyRates, property])

  const handleDirectBooking = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!property || !isAvailable) return
    setSubmitting(true)
    setErrorMsg(null)

    try {
      // 1. Insert direct booking into bookings table so calendar blocks immediately
      const { error } = await supabase.from('bookings').insert({
        property_id: property.id,
        platform: 'manual',
        source: 'manual',
        guest_name: `${guestName} (Direct · ${guestPhone})`,
        check_in: checkIn,
        check_out: checkOut,
        price_per_night: pricing.ratePerNight,
        cleaning_fee: pricing.cleaning,
        total_price: pricing.total,
        notes: `Direct Booking (${paymentMethod.toUpperCase()}) | Email: ${guestEmail} | Tel: ${guestPhone} | Guests: ${guests}`,
      })

      if (error) throw error

      // 2. Also notify support/admin inbox
      await fetch('/api/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderEmail: guestEmail,
          subject: `🌐 Νέα Απευθείας Κράτηση (Direct Booking) — ${property.name}`,
          message: `Ακίνητο: ${property.name}\nΕπισκέπτης: ${guestName}\nΤηλέφωνο: ${guestPhone}\nEmail: ${guestEmail}\nCheck-in: ${checkIn}\nCheck-out: ${checkOut} (${pricing.nights} διανυκτερεύσεις)\nΣύνολο: €${pricing.total} (${paymentMethod.toUpperCase()})`,
        }),
      }).catch(() => {})

      setBookingConfirmed(true)
      fetchPropertyData()
    } catch (err: any) {
      setErrorMsg(err.message || 'Σφάλμα κατά την καταχώρηση της κράτησης.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!property) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-6 text-center">
        <div className="space-y-3">
          <span className="text-4xl">🏡</span>
          <h1 className="text-xl font-bold">Property Not Found</h1>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans pb-16">
      {/* Top Bar */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-sm shadow">🏠</span>
            <div>
              <span className="font-extrabold text-white text-sm block leading-none">{property.name}</span>
              <span className="text-[10px] text-emerald-400 font-bold">✓ Direct Booking · 0% Commission</span>
            </div>
          </div>

          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => setLang('el')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all ${!isEn ? 'bg-blue-600 text-white' : 'text-slate-400'}`}
            >
              🇬🇷 ΕΛ
            </button>
            <button
              onClick={() => setLang('en')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all ${isEn ? 'bg-blue-600 text-white' : 'text-slate-400'}`}
            >
              🇬🇧 EN
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="bg-gradient-to-b from-blue-950/60 via-indigo-950/40 to-slate-950 border-b border-slate-800/80 py-10 px-4">
        <div className="max-w-5xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-1.5 bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 px-3 py-1 rounded-full text-xs font-extrabold">
            <Sparkles size={13} />
            <span>
              {isEn
                ? 'Official Direct Booking Page — Best Price Guaranteed (Save 17% vs Airbnb)'
                : 'Επίσημη Σελίδα Απευθείας Κρατήσεων — Εγγύηση Καλύτερης Τιμής (-17% από Airbnb)'}
            </span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
            {property.name}
          </h1>

          {property.address && (
            <p className="text-sm text-slate-300 flex items-center gap-1.5">
              <MapPin size={16} className="text-red-400 shrink-0" />
              <span>{property.address}</span>
            </p>
          )}

          <div className="flex flex-wrap gap-3 pt-2 text-xs text-slate-300">
            <span className="bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl flex items-center gap-1.5">
              <Wifi size={14} className="text-teal-400" /> Fast Free Wi-Fi
            </span>
            <span className="bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl flex items-center gap-1.5">
              <Clock size={14} className="text-blue-400" /> Check-in: {property.check_in_time || '15:00'} · Check-out: {property.check_out_time || '11:00'}
            </span>
            <span className="bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl flex items-center gap-1.5">
              <ShieldCheck size={14} className="text-emerald-400" /> Instant Calendar Confirmation
            </span>
          </div>
        </div>
      </div>

      {/* Main Grid: Property Info + Booking Engine */}
      <div className="max-w-5xl mx-auto px-4 mt-8 grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Left Column: Description & Benefits */}
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 space-y-4">
            <h2 className="text-lg font-extrabold text-white">
              {isEn ? 'Why Book Directly With Us?' : 'Γιατί να κάνετε Απευθείας Κράτηση εδώ;'}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-1">
                <strong className="text-emerald-400 block font-bold">💰 0% Προμήθειες Πλατφόρμας</strong>
                <p className="text-slate-400">
                  {isEn
                    ? 'Skip the 15-20% Airbnb & Booking service fees by booking directly with the host.'
                    : 'Γλιτώστε το 15-20% των προμηθειών Airbnb & Booking κάνοντας κράτηση απευθείας στον ιδιοκτήτη.'}
                </p>
              </div>
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-1">
                <strong className="text-blue-400 block font-bold">⚡ Ζωντανή Διαθεσιμότητα</strong>
                <p className="text-slate-400">
                  {isEn
                    ? 'Real-time calendar synced with our central reservation system.'
                    : 'Το ημερολόγιο είναι συνδεδεμένο σε πραγματικό χρόνο με τις κρατήσεις του καταλύματος.'}
                </p>
              </div>
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-1">
                <strong className="text-amber-400 block font-bold">💳 Πληρωμή με Κάρτα ή IRIS</strong>
                <p className="text-slate-400">
                  {isEn
                    ? 'Flexible and secure payment options directly via Stripe or IRIS Instant Transfer.'
                    : 'Ευέλικτη και ασφαλής εξόφληση μέσω τραπεζικής κάρτας ή άμεσης μεταφοράς IRIS.'}
                </p>
              </div>
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-1">
                <strong className="text-purple-400 block font-bold">📱 Δωρεάν Ψηφιακός Οδηγός</strong>
                <p className="text-slate-400">
                  {isEn
                    ? 'Receive instant access to our mobile guest guidebook & local partner discounts.'
                    : 'Λαμβάνετε άμεσα τον ψηφιακό οδηγό διαμονής στο κινητό σας με εκπτώσεις συνεργατών.'}
                </p>
              </div>
            </div>
          </div>

          {property.house_rules && (
            <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 space-y-2">
              <h3 className="font-extrabold text-white text-base">
                {isEn ? 'House Rules & Information' : 'Κανόνες Σπιτιού & Πληροφορίες'}
              </h3>
              <p className="text-xs text-slate-300 whitespace-pre-line leading-relaxed">
                {property.house_rules}
              </p>
            </div>
          )}
        </div>

        {/* Right Column: Live Direct Booking Widget */}
        <div className="lg:col-span-2">
          <div className="bg-slate-900 border border-blue-500/30 rounded-3xl p-6 shadow-2xl space-y-5 sticky top-20">
            <div className="flex items-baseline justify-between border-b border-slate-800 pb-4">
              <div>
                <span className="text-2xl font-black text-white">€{pricing.ratePerNight}</span>
                <span className="text-xs text-slate-400"> {isEn ? '/ night' : '/ βράδυ'}</span>
              </div>
              {pricing.airbnbSavings > 0 && (
                <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[11px] font-extrabold px-2.5 py-1 rounded-full">
                  {isEn ? `Save €${pricing.airbnbSavings}` : `Κέρδος €${pricing.airbnbSavings}`}
                </span>
              )}
            </div>

            {bookingConfirmed ? (
              <div className="bg-emerald-950/60 border border-emerald-500/40 rounded-2xl p-5 text-center space-y-3 animate-in zoom-in-95">
                <CheckCircle2 size={36} className="text-emerald-400 mx-auto" />
                <h3 className="font-extrabold text-white text-base">
                  {isEn ? 'Direct Booking Confirmed!' : 'Η Κράτησή σας Καταχωρήθηκε!'}
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {isEn
                    ? `Your dates (${checkIn} to ${checkOut}) have been reserved on the calendar. The host will contact you shortly.`
                    : `Οι ημερομηνίες σας (${checkIn} έως ${checkOut}) δεσμεύτηκαν στο ημερολόγιο! Θα λάβετε άμεσα οδηγίες στο email/τηλέφωνό σας.`}
                </p>
                <button
                  onClick={() => setBookingConfirmed(false)}
                  className="text-xs font-bold text-emerald-400 underline"
                >
                  {isEn ? 'Make another booking' : 'Νέα κράτηση'}
                </button>
              </div>
            ) : (
              <form onSubmit={handleDirectBooking} className="space-y-4 text-xs">
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 mb-1">CHECK-IN</label>
                    <input
                      type="date"
                      min={todayStr}
                      value={checkIn}
                      onChange={e => setCheckIn(e.target.value)}
                      required
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white font-bold focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 mb-1">CHECK-OUT</label>
                    <input
                      type="date"
                      min={checkIn || todayStr}
                      value={checkOut}
                      onChange={e => setCheckOut(e.target.value)}
                      required
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white font-bold focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                {/* Live Availability Badge */}
                <div className={`p-3 rounded-xl border text-center font-bold ${
                  isAvailable
                    ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300'
                    : 'bg-red-950/40 border-red-500/30 text-red-300'
                }`}>
                  {isAvailable
                    ? (isEn ? `✓ Dates Available (${pricing.nights} nights)` : `✓ Διαθέσιμες Ημερομηνίες (${pricing.nights} βράδια)`)
                    : (isEn ? '✗ Selected dates are unavailable' : '✗ Οι επιλεγμένες ημερομηνίες είναι κλεισμένες')}
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">
                    {isEn ? 'Full Name' : 'Ονοματεπώνυμο'}
                  </label>
                  <input
                    type="text"
                    value={guestName}
                    onChange={e => setGuestName(e.target.value)}
                    placeholder={isEn ? 'John Doe' : 'π.χ. Γιώργος Παπαδόπουλος'}
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 mb-1">Email</label>
                    <input
                      type="email"
                      value={guestEmail}
                      onChange={e => setGuestEmail(e.target.value)}
                      placeholder="name@email.com"
                      required
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 mb-1">
                      {isEn ? 'Phone / WhatsApp' : 'Τηλέφωνο'}
                    </label>
                    <input
                      type="tel"
                      value={guestPhone}
                      onChange={e => setGuestPhone(e.target.value)}
                      placeholder="+30 69..."
                      required
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                {/* Payment Method Selector */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1.5">
                    {isEn ? 'Preferred Payment Method' : 'Τρόπος Πληρωμής'}
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('card')}
                      className={`py-2.5 px-3 rounded-xl font-bold border text-center transition-all ${
                        paymentMethod === 'card'
                          ? 'bg-blue-600/20 border-blue-500 text-white'
                          : 'bg-slate-950 border-slate-800 text-slate-400'
                      }`}
                    >
                      💳 Card / Stripe
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('iris')}
                      className={`py-2.5 px-3 rounded-xl font-bold border text-center transition-all ${
                        paymentMethod === 'iris'
                          ? 'bg-blue-600/20 border-blue-500 text-white'
                          : 'bg-slate-950 border-slate-800 text-slate-400'
                      }`}
                    >
                      🏦 IRIS / Bank
                    </button>
                  </div>
                </div>

                {/* Price Breakdown */}
                {pricing.nights > 0 && (
                  <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-2">
                    <div className="flex justify-between text-slate-400">
                      <span>€{pricing.ratePerNight} × {pricing.nights} {isEn ? 'nights' : 'βράδια'}</span>
                      <span className="text-white font-bold">€{pricing.accommodation}</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>{isEn ? 'Cleaning fee' : 'Κόστος καθαρισμού'}</span>
                      <span className="text-white font-bold">€{pricing.cleaning}</span>
                    </div>
                    <div className="flex justify-between text-emerald-400 font-bold">
                      <span>{isEn ? 'Direct Booking Fee' : 'Προμήθεια Πλατφόρμας'}</span>
                      <span>€0 (Δωρεάν)</span>
                    </div>
                    <div className="border-t border-slate-800 pt-2 flex justify-between text-sm font-black text-white">
                      <span>{isEn ? 'Total' : 'Σύνολο'}</span>
                      <span>€{pricing.total}</span>
                    </div>
                  </div>
                )}

                {errorMsg && (
                  <p className="text-xs text-red-400 font-bold">{errorMsg}</p>
                )}

                <button
                  type="submit"
                  disabled={!isAvailable || submitting}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold py-3.5 rounded-2xl text-xs shadow-lg shadow-blue-600/25 transition-all disabled:opacity-40"
                >
                  {submitting
                    ? (isEn ? 'Reserving...' : 'Καταχώρηση Κράτησης...')
                    : (isEn ? `Book Direct Now (€${pricing.total})` : `Άμεση Κράτηση Χωρίς Προμήθεια (€${pricing.total})`)}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* Footer with UpLogic Branding */}
      <footer className="max-w-5xl mx-auto px-4 mt-14 pt-6 border-t border-slate-900 text-center text-xs text-slate-500">
        <p>
          Direct Booking Engine by <strong>GreekHost</strong> · Engineered & Powered by{' '}
          <a
            href="https://uplogic.gr"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 hover:underline font-extrabold"
          >
            UpLogic
          </a>
        </p>
      </footer>
    </div>
  )
}
