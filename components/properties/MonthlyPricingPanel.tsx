'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { CalendarDays, ChevronDown, ChevronUp, Save, Euro, RefreshCw, Zap } from 'lucide-react'

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
}

interface MonthlyRate {
  id?: string
  month: number
  year: number
  price_per_night: number
}

export default function MonthlyPricingPanel({ propertyId, propertyName }: Props) {
  const supabase = createClient()
  const [open, setOpen] = useState(false)
  const [year, setYear] = useState(new Date().getFullYear())
  const [rates, setRates] = useState<Record<number, string>>({})
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(false)
  const [applying, setApplying] = useState(false)
  const [applyResult, setApplyResult] = useState<string | null>(null)

  useEffect(() => {
    if (open) loadRates()
  }, [open, year])

  async function loadRates() {
    setLoading(true)
    const { data } = await supabase
      .from('monthly_rates')
      .select('*')
      .eq('property_id', propertyId)
      .eq('year', year)

    const map: Record<number, string> = {}
    for (const r of data ?? []) {
      map[r.month] = String(r.price_per_night)
    }
    setRates(map)
    setLoading(false)
  }

  async function saveRates(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setSaved(false)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setSaving(false); return }

    // Upsert each month that has a value
    for (const [monthStr, priceStr] of Object.entries(rates)) {
      const month = Number(monthStr)
      const price = parseFloat(priceStr)
      if (!priceStr || isNaN(price) || price <= 0) continue

      await supabase
        .from('monthly_rates')
        .upsert(
          {
            property_id: propertyId,
            user_id: user.id,
            year,
            month,
            price_per_night: price,
          },
          { onConflict: 'property_id,year,month' }
        )
    }

    setSaving(false)
    setSaved(true)
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
      } else {
        setApplyResult(`❌ Σφάλμα: ${data.error}`)
      }
    } catch {
      setApplyResult('❌ Σφάλμα σύνδεσης.')
    }
    setApplying(false)
    setTimeout(() => setApplyResult(null), 5000)
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
            Τιμές ανά Μήνα (Χρέωση / Νύχτα)
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-amber-600 font-semibold bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
            ΤΙΜΟΛΟΓΗΣΗ
          </span>
          {open ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
        </div>
      </button>

      {open && (
        <div className="px-6 pb-5">
          {/* Year selector */}
          <div className="flex items-center gap-2 mb-4">
            <button
              type="button"
              onClick={() => setYear(y => y - 1)}
              className="px-3 py-1 text-xs font-bold bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              ‹ {year - 1}
            </button>
            <span className="text-sm font-extrabold text-gray-900 flex-1 text-center">{year}</span>
            <button
              type="button"
              onClick={() => setYear(y => y + 1)}
              className="px-3 py-1 text-xs font-bold bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              {year + 1} ›
            </button>
          </div>

          {loading ? (
            <div className="text-xs text-gray-400 py-4 text-center">Φόρτωση τιμών...</div>
          ) : (
            <form onSubmit={saveRates} className="space-y-2">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {MONTHS.map(({ key, label }) => {
                  const isCurrent = key === currentMonth && year === new Date().getFullYear()
                  return (
                    <div
                      key={key}
                      className={`rounded-xl border p-2.5 transition-colors ${
                        isCurrent ? 'border-blue-300 bg-blue-50/50' : 'border-gray-200 bg-gray-50/50'
                      }`}
                    >
                      <label className={`block text-[10px] font-bold mb-1.5 ${isCurrent ? 'text-blue-700' : 'text-gray-500'}`}>
                        {label} {isCurrent && '(τρέχων)'}
                      </label>
                      <div className="relative">
                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400">
                          <Euro size={11} />
                        </span>
                        <input
                          type="number"
                          min="0"
                          step="0.5"
                          placeholder="—"
                          value={rates[key] ?? ''}
                          onChange={e => setRates(r => ({ ...r, [key]: e.target.value }))}
                          className="w-full pl-5 pr-1.5 py-1.5 text-sm font-semibold text-gray-900 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  )
                })}
              </div>

              <div className="pt-2 flex items-center gap-3 flex-wrap">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-sm transition-all disabled:opacity-50"
                >
                  <Save size={13} />
                  {saving ? 'Αποθήκευση...' : `Αποθήκευση Τιμών ${year}`}
                </button>
                {saved && (
                  <span className="text-xs font-semibold text-emerald-600 animate-in fade-in duration-300">
                    ✅ Αποθηκεύτηκε!
                  </span>
                )}
              </div>

              {/* Apply to existing bookings */}
              <div className="mt-3 p-3.5 bg-blue-50 border border-blue-200 rounded-2xl space-y-2.5">
                <p className="text-xs font-bold text-blue-900">
                  ⚡ Εφαρμογή στις Υπάρχουσες Κρατήσεις
                </p>
                <p className="text-[10px] text-blue-700 leading-relaxed">
                  Εφάρμοσε τις τιμές ανά μήνα σε κρατήσεις που ήρθαν από iCal/Airbnb και δεν έχουν ποσό.
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
                      if (confirm('Θα αντικατασταθούν ΟΛΕΣ οι υπάρχουσες τιμές. Συνεχίζεις;')) {
                        applyToBookings(true)
                      }
                    }}
                    className="flex items-center gap-1.5 bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 px-3.5 py-2 rounded-xl text-xs font-bold transition-all disabled:opacity-50"
                  >
                    <RefreshCw size={13} />
                    Αντικατάσταση ΟΛΩΝ
                  </button>
                </div>
                {applyResult && (
                  <p className="text-xs font-semibold text-blue-900 animate-in fade-in duration-300">
                    {applyResult}
                  </p>
                )}
              </div>

              <p className="text-[10px] text-gray-400 leading-relaxed pt-1">
                💡 Όταν προσθέτεις χειροκίνητη κράτηση, η τιμή ανά νύχτα θα προτείνεται αυτόματα βάσει του μήνα.
              </p>
            </form>

          )}
        </div>
      )}
    </div>
  )
}
