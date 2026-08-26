'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { CalendarDays, ChevronDown, ChevronUp, Save, Euro, RefreshCw, Zap, Sparkles, Wand2, Lock } from 'lucide-react'
import { isProUser } from '@/lib/permissions'
import ProFeatureModal from '@/components/ui/ProFeatureModal'

const MONTHS = [
  { key: 1, label: 'Ιανουάριος' },
  { key: 2, label: 'Φεβρουάριος' },
  { key: 3, label: 'Μάρτιος' },
  { key: 4, label: 'Απρίλιος' },
  { key: 5, label: 'Μάιος' },
  { key: 6, label: 'Ιούνιος' },
  { key: 7, label: 'Ιούλιος' },
  { key: 8, label: 'Αύγουστος' },
  { key: 9, label: 'Σεπτέμβριος' },
  { key: 10, label: 'Οκτώβριος' },
  { key: 11, label: 'Νοέμβριος' },
  { key: 12, label: 'Δεκέμβριος' },
]

interface Props {
  propertyId: string
  propertyName: string
  initialCleaningFee?: number | null
  userEmail?: string | null
  onPropertyUpdated?: () => void
}

export default function MonthlyPricingPanel({ propertyId, propertyName, initialCleaningFee, userEmail: initialEmail, onPropertyUpdated }: Props) {
  const supabase = createClient()
  const [userEmail, setUserEmail] = useState<string | null>(initialEmail ?? null)
  const [open, setOpen] = useState(false)
  const [year, setYear] = useState(new Date().getFullYear())
  const [rates, setRates] = useState<Record<number, string>>({})
  const [cleaningFee, setCleaningFee] = useState<string>(initialCleaningFee ? String(initialCleaningFee) : '')
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(false)
  const [applying, setApplying] = useState(false)
  const [applyResult, setApplyResult] = useState<string | null>(null)
  const [syncingChannex, setSyncingChannex] = useState(false)
  const [channexResult, setChannexResult] = useState<string | null>(null)
  const [showProModal, setShowProModal] = useState(false)
  const [showQuickFill, setShowQuickFill] = useState(false)
  const [quickHigh, setQuickHigh] = useState('120')
  const [quickMid, setQuickMid] = useState('85')
  const [quickLow, setQuickLow] = useState('70')

  useEffect(() => {
    if (initialEmail) {
      setUserEmail(initialEmail)
    } else {
      supabase.auth.getUser().then(({ data: { user } }) => {
        if (user?.email) setUserEmail(user.email)
      })
    }
  }, [initialEmail])

  useEffect(() => {
    if (initialCleaningFee !== undefined) {
      setCleaningFee(initialCleaningFee ? String(initialCleaningFee) : '')
    }
  }, [initialCleaningFee])

  useEffect(() => {
    if (open) loadData()
  }, [open, year])

  async function loadData() {
    setLoading(true)
    const [{ data: ratesData }, { data: propData }] = await Promise.all([
      supabase
        .from('monthly_rates')
        .select('*')
        .eq('property_id', propertyId)
        .eq('year', year),
      supabase
        .from('properties')
        .select('cleaning_fee')
        .eq('id', propertyId)
        .single()
    ])

    const map: Record<number, string> = {}
    for (const r of ratesData ?? []) {
      map[r.month] = String(r.price_per_night)
    }
    setRates(map)
    if (propData?.cleaning_fee != null) {
      setCleaningFee(String(propData.cleaning_fee))
    }
    setLoading(false)
  }

  function applyQuickFill() {
    const newRates: Record<number, string> = { ...rates }
    // High: Jun-Sep (6-9)
    for (let m = 6; m <= 9; m++) newRates[m] = quickHigh
    // Mid: Apr, May, Oct (4, 5, 10)
    newRates[4] = quickMid
    newRates[5] = quickMid
    newRates[10] = quickMid
    // Low: Nov-Mar (1, 2, 3, 11, 12)
    newRates[1] = quickLow
    newRates[2] = quickLow
    newRates[3] = quickLow
    newRates[11] = quickLow
    newRates[12] = quickLow

    setRates(newRates)
    setShowQuickFill(false)
  }

  async function saveAll(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setSaved(false)
    const { data: { user } } = await supabase.auth.getUser()
    let userId = user?.id
    if (!userId) {
      const { data: pData } = await supabase.from('properties').select('user_id').eq('id', propertyId).single()
      userId = pData?.user_id || '00000000-0000-0000-0000-000000000000'
    }

    // 1. Update cleaning fee on property
    const cleanNum = cleaningFee ? parseFloat(cleaningFee) : 0
    const { error: propErr } = await supabase
      .from('properties')
      .update({ cleaning_fee: isNaN(cleanNum) ? 0 : cleanNum })
      .eq('id', propertyId)

    if (propErr) {
      setSaving(false)
      alert('⚠️ Σφάλμα αποθήκευσης καθαριότητας: ' + propErr.message + '\n\nΠαρακαλώ εκτελέστε το SQL migration στο Supabase SQL Editor.')
      return
    }

    // 2. Upsert each month that has a value
    for (const [monthStr, priceStr] of Object.entries(rates)) {
      const month = Number(monthStr)
      const price = parseFloat(priceStr)
      if (!priceStr || isNaN(price) || price <= 0) continue

      await supabase
        .from('monthly_rates')
        .upsert(
          {
            property_id: propertyId,
            user_id: userId,
            year,
            month,
            price_per_night: price,
          },
          { onConflict: 'property_id,year,month' }
        )
    }

    setSaving(false)
    setSaved(true)
    onPropertyUpdated?.()
    setTimeout(() => setSaved(false), 2500)
  }

  async function applyToBookings(overwrite: boolean) {
    setApplying(true)
    setApplyResult(null)
    try {
      const res = await fetch('/api/recalculate-pricing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ propertyId, overwriteExisting: overwrite }),
      })
      const data = await res.json()
      if (data.success) {
        setApplyResult(`✅ Ενημερώθηκαν ${data.updated} κρατήσεις!`)
        onPropertyUpdated?.()
      } else {
        setApplyResult(`❌ Σφάλμα: ${data.error}`)
      }
    } catch {
      setApplyResult('❌ Σφάλμα σύνδεσης.')
    }
    setApplying(false)
    setTimeout(() => setApplyResult(null), 5000)
  }

  const [bookingMarkup, setBookingMarkup] = useState(false)

  async function syncToChannex(targetPlatform: 'all' | 'airbnb' | 'booking' = 'all') {
    if (!isProUser(userEmail)) {
      setShowProModal(true)
      return
    }
    setSyncingChannex(true)
    setChannexResult(null)
    try {
      const res = await fetch('/api/channex/sync-rates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          propertyId,
          propertyName,
          year,
          rates,
          targetPlatform,
          markup: (targetPlatform === 'booking' && bookingMarkup) ? 15 : 0
        }),
      })
      const data = await res.json()
      if (data.success) {
        setChannexResult(`⚡ ${data.message}`)
      } else {
        setChannexResult(`❌ Σφάλμα: ${data.error}`)
      }
    } catch {
      setChannexResult('❌ Σφάλμα σύνδεσης με το Channex API.')
    }
    setSyncingChannex(false)
    setTimeout(() => setChannexResult(null), 6000)
  }

  const currentMonth = new Date().getMonth() + 1

  return (
    <div className="border-t border-gray-100">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-6 py-3.5 text-left hover:bg-gray-50/70 transition-colors group"
      >
        <div className="flex items-center gap-2.5">
          <CalendarDays size={16} className="text-amber-500" />
          <span className="text-sm font-semibold text-gray-700">
            Τιμές ανά Μήνα & Τέλος Καθαριότητας
          </span>
        </div>
        <div className="flex items-center gap-2">
          {cleaningFee && parseFloat(cleaningFee) > 0 && (
            <span className="text-[10px] text-teal-700 font-bold bg-teal-50 border border-teal-200 px-2 py-0.5 rounded-full">
              Καθαριότητα: €{cleaningFee}
            </span>
          )}
          <span className="text-[10px] text-amber-600 font-semibold bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
            ΤΙΜΟΛΟΓΗΣΗ
          </span>
          {open ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
        </div>
      </button>

      {open && (
        <div className="px-6 pb-6 pt-1">
          {loading ? (
            <div className="py-8 text-center text-xs text-gray-400 flex items-center justify-center gap-2">
              <RefreshCw className="animate-spin" size={14} /> Φόρτωση τιμών...
            </div>
          ) : (
            <form onSubmit={saveAll} className="space-y-4">
              {/* Cleaning Fee Header Section */}
              <div className="bg-gradient-to-r from-teal-50/70 to-emerald-50/70 border border-teal-200/80 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-1.5 font-bold text-xs text-teal-900">
                    <Euro size={14} className="text-teal-600" />
                    <span>Πάγιο Τέλος Καθαριότητας (€ ανά κράτηση)</span>
                  </div>
                  <p className="text-[11px] text-teal-700 mt-0.5">
                    Χρεώνεται <strong>1 φορά ανά κράτηση</strong> (όχι ανά νύχτα). Αφαιρείται από το καθαρό μίσθωμα κατά τον υπολογισμό κερδοφορίας.
                  </p>
                </div>
                <div className="relative w-36 shrink-0">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-teal-600 text-sm font-bold">€</span>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    placeholder="π.χ. 50"
                    value={cleaningFee}
                    onChange={e => setCleaningFee(e.target.value)}
                    className="w-full pl-7 pr-3 py-2 text-sm font-bold text-gray-900 bg-white border border-teal-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 shadow-xs"
                  />
                </div>
              </div>

              {/* Instructions banner */}
              <div className="bg-amber-50/70 border border-amber-200/70 rounded-2xl p-3.5 text-xs text-amber-900 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold flex items-center gap-1">
                    💡 Πώς ορίζονται οι τιμές:
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowQuickFill(!showQuickFill)}
                    className="text-[11px] font-bold text-amber-700 hover:text-amber-900 bg-amber-100/80 px-2.5 py-1 rounded-lg flex items-center gap-1 hover:bg-amber-200/80 transition-colors"
                  >
                    <Wand2 size={12} />
                    {showQuickFill ? 'Κλείσιμο Αυτόματης Συμπλήρωσης' : 'Μαζική Συμπλήρωση Τιμών'}
                  </button>
                </div>
                <p className="text-[11px] text-amber-800 leading-relaxed">
                  Συμπληρώστε την <strong>καθαρή τιμή ανά διανυκτέρευση (€/νύχτα)</strong> για κάθε μήνα. Το σύνολο κάθε κράτησης υπολογίζεται αυτόματα: <em>(Νύχτες × Τιμή Μήνα) + Τέλος Καθαριότητας</em>.
                </p>
              </div>

              {/* Quick Fill Tool Drawer */}
              {showQuickFill && (
                <div className="bg-white border border-amber-300 rounded-2xl p-4 shadow-sm space-y-3 animate-in fade-in duration-200">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-gray-900">
                    <Sparkles size={14} className="text-amber-500" />
                    <span>Μαζικός Ορισμός Τιμών ανά Εποχή</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                        ☀️ Υψηλή Σεζόν (Ιουν–Σεπ)
                      </label>
                      <div className="relative">
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-bold">€</span>
                        <input
                          type="number"
                          value={quickHigh}
                          onChange={e => setQuickHigh(e.target.value)}
                          className="w-full pl-6 pr-2 py-1.5 text-xs font-bold border border-gray-200 rounded-lg"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                        🌸 Μεσαία Σεζόν (Απρ, Μαΐ, Οκτ)
                      </label>
                      <div className="relative">
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-bold">€</span>
                        <input
                          type="number"
                          value={quickMid}
                          onChange={e => setQuickMid(e.target.value)}
                          className="w-full pl-6 pr-2 py-1.5 text-xs font-bold border border-gray-200 rounded-lg"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                        ❄️ Χαμηλή Σεζόν (Νοε–Μαρ)
                      </label>
                      <div className="relative">
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-bold">€</span>
                        <input
                          type="number"
                          value={quickLow}
                          onChange={e => setQuickLow(e.target.value)}
                          className="w-full pl-6 pr-2 py-1.5 text-xs font-bold border border-gray-200 rounded-lg"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setShowQuickFill(false)}
                      className="px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-100 rounded-lg"
                    >
                      Ακύρωση
                    </button>
                    <button
                      type="button"
                      onClick={applyQuickFill}
                      className="px-4 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-lg shadow-xs transition-colors"
                    >
                      Εφαρμογή στους 12 Μήνες
                    </button>
                  </div>
                </div>
              )}

              {/* Year Navigation */}
              <div className="flex items-center justify-between py-1">
                <button
                  type="button"
                  onClick={() => setYear(y => y - 1)}
                  className="text-xs text-gray-500 hover:text-gray-900 font-semibold px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                >
                  ‹ {year - 1}
                </button>
                <span className="text-base font-extrabold text-gray-900 tracking-tight">
                  {year}
                </span>
                <button
                  type="button"
                  onClick={() => setYear(y => y + 1)}
                  className="text-xs text-gray-500 hover:text-gray-900 font-semibold px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                >
                  {year + 1} ›
                </button>
              </div>

              {/* 12 Month Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
                {MONTHS.map(({ key, label }) => {
                  const isCurrent = key === currentMonth && year === new Date().getFullYear()
                  return (
                    <div
                      key={key}
                      className={`p-3 rounded-2xl border transition-all ${
                        isCurrent
                          ? 'border-blue-300 bg-blue-50/50 shadow-xs'
                          : 'border-gray-200 bg-white hover:border-gray-300'
                      }`}
                    >
                      <label className="block text-xs font-bold text-gray-700 mb-1.5">
                        {label}
                        {isCurrent && (
                          <span className="text-[10px] text-blue-600 font-semibold ml-1">
                            (τρέχων)
                          </span>
                        )}
                      </label>
                      <div className="relative">
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-bold">
                          €
                        </span>
                        <input
                          type="number"
                          step="1"
                          min="0"
                          placeholder="—"
                          value={rates[key] ?? ''}
                          onChange={e => setRates(r => ({ ...r, [key]: e.target.value }))}
                          className="w-full pl-6 pr-2 py-1.5 text-sm font-bold text-gray-900 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Save Button */}
              <div className="pt-2 flex items-center gap-3 flex-wrap">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-600 text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-sm transition-all disabled:opacity-50"
                >
                  <Save size={14} />
                  {saving ? 'Αποθήκευση...' : `Αποθήκευση Τιμών & Καθαριότητας (${year})`}
                </button>
                {saved && (
                  <span className="text-xs font-bold text-emerald-600 animate-in fade-in duration-300">
                    ✅ Αποθηκεύτηκε επιτυχώς!
                  </span>
                )}
              </div>

              {/* Apply to existing bookings */}
              <div className="mt-3 p-4 bg-blue-50 border border-blue-200 rounded-2xl space-y-2.5">
                <p className="text-xs font-bold text-blue-900">
                  ⚡ Εφαρμογή στις Υπάρχουσες Κρατήσεις
                </p>
                <p className="text-[11px] text-blue-700 leading-relaxed">
                  Εφάρμοσε τις μηνιαίες τιμές και το τέλος καθαριότητας στις κρατήσεις που ήρθαν από iCal / Airbnb / Booking.
                </p>
                <div className="flex gap-2 flex-wrap">
                  <button
                    type="button"
                    disabled={applying}
                    onClick={() => applyToBookings(false)}
                    className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-2 rounded-xl text-xs font-bold shadow-sm transition-all disabled:opacity-50"
                  >
                    {applying ? <RefreshCw size={13} className="animate-spin" /> : <Zap size={13} />}
                    {applying ? 'Εφαρμογή...' : 'Εφαρμογή σε κενές κρατήσεις'}
                  </button>
                  <button
                    type="button"
                    disabled={applying}
                    onClick={() => {
                      if (confirm('Θα επαναϋπολογιστούν ΟΛΕΣ οι κρατήσεις αυτού του ακινήτου βάσει των νέων τιμών & καθαριότητας. Συνεχίζετε;')) {
                        applyToBookings(true)
                      }
                    }}
                    className="flex items-center gap-1.5 bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 px-3.5 py-2 rounded-xl text-xs font-bold transition-all disabled:opacity-50"
                  >
                    <RefreshCw size={13} />
                    Αντικατάσταση & Επανυπολογισμός ΟΛΩΝ
                  </button>
                </div>
                {applyResult && (
                  <p className="text-xs font-bold text-blue-900 animate-in fade-in duration-300">
                    {applyResult}
                  </p>
                )}
              </div>

              {/* Channex 2-Way Direct Channel Sync */}
              <div className="mt-3 p-4 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-xs font-extrabold text-emerald-950">
                      ⚡ 2-Way Channel Manager Sync (Channex API)
                    </span>
                  </div>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 font-extrabold px-2 py-0.5 rounded-md border border-emerald-200">
                    API Connected
                  </span>
                </div>

                <p className="text-[11px] text-emerald-800 leading-relaxed">
                  Επιλέξτε αν θέλετε να στείλετε τις τιμές σε <strong>συγκεκριμένη πλατφόρμα ξεχωριστά</strong> ή σε <strong>όλα τα κανάλια ταυτόχρονα</strong>:
                </p>

                {/* Booking.com Markup Checkbox */}
                <label className="flex items-center gap-2 text-xs font-semibold text-gray-700 cursor-pointer select-none bg-white/80 p-2 rounded-xl border border-emerald-200/80">
                  <input
                    type="checkbox"
                    checked={bookingMarkup}
                    onChange={e => setBookingMarkup(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span>
                    📈 Αυτόματη προσαρμογή <strong>+15% στο Booking.com</strong> (για κάλυψη προμήθειας Booking)
                  </span>
                </label>

                {/* Platform Sync Action Buttons */}
                <div className="flex gap-2 flex-wrap items-center pt-1">
                  {/* Airbnb only */}
                  <button
                    type="button"
                    disabled={syncingChannex}
                    onClick={() => syncToChannex('airbnb')}
                    className="flex items-center gap-1.5 bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 text-white px-3.5 py-2 rounded-xl text-xs font-bold shadow-xs transition-all disabled:opacity-50 active:scale-95"
                    title="Αποστολή τιμών αποκλειστικά στο Airbnb"
                  >
                    {syncingChannex ? <RefreshCw size={13} className="animate-spin" /> : <span>🔴</span>}
                    <span>Μόνο σε Airbnb</span>
                  </button>

                  {/* Booking.com only */}
                  <button
                    type="button"
                    disabled={syncingChannex}
                    onClick={() => syncToChannex('booking')}
                    className="flex items-center gap-1.5 bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white px-3.5 py-2 rounded-xl text-xs font-bold shadow-xs transition-all disabled:opacity-50 active:scale-95"
                    title="Αποστολή τιμών αποκλειστικά στο Booking.com"
                  >
                    {syncingChannex ? <RefreshCw size={13} className="animate-spin" /> : <span>🔵</span>}
                    <span>Μόνο σε Booking.com</span>
                  </button>

                  {/* All Channels */}
                  <button
                    type="button"
                    disabled={syncingChannex}
                    onClick={() => syncToChannex('all')}
                    className="flex items-center gap-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white px-4 py-2 rounded-xl text-xs font-extrabold shadow-sm transition-all disabled:opacity-50 active:scale-95"
                    title="Ταυτόχρονη αποστολή σε όλα τα κανάλια"
                  >
                    {syncingChannex ? <RefreshCw size={13} className="animate-spin" /> : <Zap size={13} />}
                    <span>⚡ Αποστολή σε Όλα (All Channels)</span>
                  </button>
                </div>

                {channexResult && (
                  <p className="text-xs font-bold text-emerald-900 bg-white/90 p-2.5 rounded-xl border border-emerald-200 animate-in fade-in duration-300">
                    {channexResult}
                  </p>
                )}
              </div>
            </form>
          )}
        </div>
      )}

      {/* Pro Upgrade Modal */}
      <ProFeatureModal
        isOpen={showProModal}
        onClose={() => setShowProModal(false)}
        featureTitle="2-Way Channel Manager Sync (Pro / Business)"
        featureDescription="Αναβαθμίστε στο πακέτο Pro για να στέλνετε απευθείας τις τιμές και τις διαθεσιμότητές σας στο Airbnb & Booking.com σε πραγματικό χρόνο!"
      />
    </div>
  )
}
