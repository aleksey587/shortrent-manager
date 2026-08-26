'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, Trash2, RefreshCw, BookOpen, Search, Download, Edit2, X, Moon } from 'lucide-react'
import { format } from 'date-fns'
import { el } from 'date-fns/locale'
import ShareBookingModal from '@/components/bookings/ShareBookingModal'
import ImportCsvModal from '@/components/bookings/ImportCsvModal'
import { isSuperAdmin, isProUser as checkIsProUser } from '@/lib/permissions'

const PLATFORM_LABELS: Record<string, string> = {
  airbnb: 'Airbnb',
  booking: 'Booking.com',
  vrbo: 'VRBO',
  manual: 'Χειροκίνητη',
  other: 'Άλλη',
}
const PLATFORM_COLORS: Record<string, string> = {
  airbnb: 'bg-red-100 text-red-700',
  booking: 'bg-blue-100 text-blue-700',
  vrbo: 'bg-teal-100 text-teal-700',
  manual: 'bg-gray-100 text-gray-600',
  other: 'bg-gray-100 text-gray-600',
}

interface Booking {
  id: string
  property_id: string
  guest_name: string | null
  check_in: string
  check_out: string
  nights: number
  price_per_night: number | null
  cleaning_fee: number | null
  total_price: number | null
  platform: string
  notes: string | null
  source: string
}

interface Property {
  id: string
  name: string
  color: string
  ama_number?: string | null
  cleaning_fee?: number | null
}

const EMPTY_FORM = {
  property_id: '',
  guest_name: '',
  check_in: '',
  check_out: '',
  price_per_night: '',
  cleaning_fee: '',
  total_price: '',
  platform: 'manual',
  notes: '',
}

export default function BookingsPage() {
  const supabase = createClient()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null)
  const [search, setSearch] = useState('')
  const [filterProperty, setFilterProperty] = useState('all')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [isProUser, setIsProUser] = useState(false)

  // Monthly rates cache: property_id -> year -> month -> price
  const [ratesCache, setRatesCache] = useState<Record<string, Record<number, Record<number, number>>>>({})

  const [form, setForm] = useState(EMPTY_FORM)
  const [isSyncingIcal, setIsSyncingIcal] = useState(false)
  const [syncStatusMsg, setSyncStatusMsg] = useState<string | null>(null)

  useEffect(() => { fetchData() }, [])

  async function fetchData() {
    setLoading(true)
    const [{ data: props }, { data: books }, { data: { user } }] = await Promise.all([
      supabase.from('properties').select('id, name, color, ama_number, cleaning_fee').order('created_at'),
      supabase.from('bookings').select('*').order('check_in', { ascending: true }),
      supabase.auth.getUser(),
    ])
    setProperties(props ?? [])
    setBookings(books ?? [])
    if (user && checkIsProUser(user.email)) setIsProUser(true)
    if (props && props.length > 0 && !form.property_id) {
      const firstProp = props[0]
      setForm(f => ({
        ...f,
        property_id: firstProp.id,
        cleaning_fee: firstProp.cleaning_fee ? String(firstProp.cleaning_fee) : '',
      }))
    }
    setLoading(false)
  }

  const handleSyncAll = async () => {
    setIsSyncingIcal(true)
    setSyncStatusMsg(null)
    try {
      const propIds = properties.map(p => p.id)
      let totalAdded = 0
      let totalUpdated = 0
      let totalCancelled = 0
      
      for (const pid of propIds) {
        const res = await fetch('/api/sync-ical', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ propertyId: pid }),
        })
        const data = await res.json()
        if (data.added) totalAdded += data.added
        if (data.updated) totalUpdated += data.updated
        if (data.cancelled) totalCancelled += data.cancelled
      }

      await fetchData()
      setSyncStatusMsg(`✅ Ο συγχρονισμός ολοκληρώθηκε! (${totalAdded} νέες, ${totalCancelled} ακυρωμένες)`)
      setTimeout(() => setSyncStatusMsg(null), 5000)
    } catch {
      setSyncStatusMsg('❌ Σφάλμα κατά τον συγχρονισμό iCal.')
      setTimeout(() => setSyncStatusMsg(null), 5000)
    }
    setIsSyncingIcal(false)
  }

  // Load monthly rates for a property when needed
  async function loadRatesForProperty(propertyId: string) {
    if (ratesCache[propertyId]) return ratesCache[propertyId]
    const { data } = await supabase
      .from('monthly_rates')
      .select('year, month, price_per_night')
      .eq('property_id', propertyId)
    const map: Record<number, Record<number, number>> = {}
    for (const r of data ?? []) {
      if (!map[r.year]) map[r.year] = {}
      map[r.year][r.month] = r.price_per_night
    }
    setRatesCache(c => ({ ...c, [propertyId]: map }))
    return map
  }

  function getSuggestedRate(rates: Record<number, Record<number, number>>, dateStr: string): number | null {
    if (!dateStr) return null
    const d = new Date(dateStr)
    const year = d.getFullYear()
    const month = d.getMonth() + 1
    if (rates[year]?.[month]) return rates[year][month]
    const years = Object.keys(rates).map(Number).sort((a, b) => Math.abs(a - year) - Math.abs(b - year))
    for (const y of years) {
      if (rates[y]?.[month]) return rates[y][month]
    }
    return null
  }

  // Auto-calculate total = nights × price_per_night + cleaning_fee
  useEffect(() => {
    const pricePerNight = parseFloat(form.price_per_night) || 0
    const cleaningFee = parseFloat(form.cleaning_fee) || 0
    if (pricePerNight > 0 && form.check_in && form.check_out) {
      const nights = Math.ceil(
        (new Date(form.check_out).getTime() - new Date(form.check_in).getTime()) / (1000 * 60 * 60 * 24)
      )
      if (nights > 0) {
        setForm(f => ({ ...f, total_price: (pricePerNight * nights + cleaningFee).toFixed(2) }))
      }
    }
  }, [form.price_per_night, form.cleaning_fee, form.check_in, form.check_out])

  // Auto-calc total for editing booking
  useEffect(() => {
    if (!editingBooking) return
    const pricePerNight = editingBooking.price_per_night ?? 0
    const cleaningFee = editingBooking.cleaning_fee ?? 0
    if (pricePerNight > 0 && editingBooking.check_in && editingBooking.check_out) {
      const nights = Math.ceil(
        (new Date(editingBooking.check_out).getTime() - new Date(editingBooking.check_in).getTime()) / (1000 * 60 * 60 * 24)
      )
      if (nights > 0) {
        setEditingBooking(b => b ? { ...b, total_price: parseFloat((pricePerNight * nights + cleaningFee).toFixed(2)) } : b)
      }
    }
  }, [editingBooking?.price_per_night, editingBooking?.cleaning_fee, editingBooking?.check_in, editingBooking?.check_out])

  // Auto-fill price AND cleaning_fee when check_in or property changes
  useEffect(() => {
    if (form.check_in && form.property_id && !form.price_per_night) {
      loadRatesForProperty(form.property_id).then(rates => {
        const rate = getSuggestedRate(rates, form.check_in)
        if (rate) setForm(f => ({ ...f, price_per_night: rate.toString() }))
      })
    }
    // Auto-fill cleaning fee from property default when property changes
    const prop = properties.find(p => p.id === form.property_id)
    if (prop?.cleaning_fee && !form.cleaning_fee) {
      setForm(f => ({ ...f, cleaning_fee: String(prop.cleaning_fee) }))
    }
  }, [form.check_in, form.property_id])

  // When property selector changes, immediately update cleaning fee
  useEffect(() => {
    if (!form.property_id) return
    const prop = properties.find(p => p.id === form.property_id)
    if (prop?.cleaning_fee != null) {
      setForm(f => ({ ...f, cleaning_fee: String(prop.cleaning_fee) }))
    }
  }, [form.property_id, properties])

  // Auto-fill price when editing and check_in changes
  useEffect(() => {
    if (editingBooking?.check_in && editingBooking?.property_id && !editingBooking?.price_per_night) {
      loadRatesForProperty(editingBooking.property_id).then(rates => {
        const rate = getSuggestedRate(rates, editingBooking.check_in)
        if (rate) setEditingBooking(b => b ? { ...b, price_per_night: rate } : b)
      })
    }
  }, [editingBooking?.check_in, editingBooking?.property_id])

  async function addBooking(e: React.FormEvent) {
    e.preventDefault()
    await supabase.from('bookings').insert({
      property_id: form.property_id,
      guest_name: form.guest_name || null,
      check_in: form.check_in,
      check_out: form.check_out,
      price_per_night: form.price_per_night ? parseFloat(form.price_per_night) : null,
      cleaning_fee: form.cleaning_fee ? parseFloat(form.cleaning_fee) : 0,
      total_price: form.total_price ? parseFloat(form.total_price) : null,
      platform: form.platform,
      notes: form.notes || null,
      source: 'manual',
    })
    setShowAdd(false)
    setForm(f => ({ ...EMPTY_FORM, property_id: f.property_id }))
    fetchData()
  }

  async function updateBooking(e: React.FormEvent) {
    e.preventDefault()
    if (!editingBooking) return
    await supabase.from('bookings').update({
      guest_name: editingBooking.guest_name || null,
      check_in: editingBooking.check_in,
      check_out: editingBooking.check_out,
      price_per_night: editingBooking.price_per_night,
      cleaning_fee: editingBooking.cleaning_fee ?? 0,
      total_price: editingBooking.total_price,
      platform: editingBooking.platform,
      notes: editingBooking.notes || null,
      property_id: editingBooking.property_id,
    }).eq('id', editingBooking.id)
    setEditingBooking(null)
    fetchData()
  }

  async function deleteBooking(id: string) {
    if (!confirm('Διαγραφή κράτησης;')) return
    await supabase.from('bookings').delete().eq('id', id)
    fetchData()
  }

  const filtered = bookings
    .filter(b => {
      if (filterProperty !== 'all' && b.property_id !== filterProperty) return false
      if (search) {
        const q = search.toLowerCase()
        return (
          b.guest_name?.toLowerCase().includes(q) ||
          b.platform.toLowerCase().includes(q)
        )
      }
      return true
    })
    .sort((a, b) => {
      const timeA = new Date(a.check_in).getTime()
      const timeB = new Date(b.check_in).getTime()
      return sortOrder === 'asc' ? timeA - timeB : timeB - timeA
    })

  const totalIncome = filtered.reduce((s, b) => s + (b.total_price ?? 0), 0)

  const exportToCsv = () => {
    if (filtered.length === 0) return
    const headers = ['Ακίνητο', 'Επισκέπτης', 'Check-in', 'Check-out', 'Νύχτες', 'Τιμή/Νύχτα (€)', 'Σύνολο (€)', 'Πλατφόρμα', 'Σημειώσεις']
    const rows = filtered.map(b => {
      const prop = properties.find(p => p.id === b.property_id)
      return [
        `"${prop?.name || '—'}"`,
        `"${b.guest_name || '—'}"`,
        `"${b.check_in}"`,
        `"${b.check_out}"`,
        `"${b.nights}"`,
        `"${b.price_per_night ? b.price_per_night.toFixed(2) : '0.00'}"`,
        `"${b.total_price ? b.total_price.toFixed(2) : '0.00'}"`,
        `"${b.platform}"`,
        `"${b.notes || ''}"`,
      ]
    })
    const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map(r => r.join(';'))].join('\r\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute('download', `GreekHost_Bookings_${format(new Date(), 'yyyy-MM-dd')}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Compute nights for form display
  const formNights = form.check_in && form.check_out
    ? Math.max(0, Math.ceil((new Date(form.check_out).getTime() - new Date(form.check_in).getTime()) / 86400000))
    : 0
  const editNights = editingBooking?.check_in && editingBooking?.check_out
    ? Math.max(0, Math.ceil((new Date(editingBooking.check_out).getTime() - new Date(editingBooking.check_in).getTime()) / 86400000))
    : 0

  if (loading) return (
    <div className="flex items-center justify-center h-64 text-gray-400">
      <RefreshCw className="animate-spin mr-2" size={20} /> Φόρτωση...
    </div>
  )

  const BookingFormFields = ({
    data,
    onChange,
    nights,
    isEdit = false,
  }: {
    data: any
    onChange: (key: string, value: string | number) => void
    nights: number
    isEdit?: boolean
  }) => (
    <div className="space-y-3">
      <div>
        <label className="block text-xs font-bold text-gray-700 mb-1.5">Ακίνητο *</label>
        <select
          required
          value={data.property_id}
          onChange={e => onChange('property_id', e.target.value)}
          className="w-full border border-gray-300 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </div>

      <div>
        <label className="block text-xs font-bold text-gray-700 mb-1.5">Πλατφόρμα</label>
        <div className="grid grid-cols-3 gap-1.5">
          {[
            { k: 'airbnb', l: 'Airbnb', c: 'bg-red-50 border-red-300 text-red-700' },
            { k: 'booking', l: 'Booking', c: 'bg-blue-50 border-blue-300 text-blue-700' },
            { k: 'vrbo', l: 'VRBO', c: 'bg-teal-50 border-teal-300 text-teal-700' },
            { k: 'manual', l: 'Χειροκίνητη', c: 'bg-gray-100 border-gray-300 text-gray-700' },
            { k: 'other', l: 'Άλλη', c: 'bg-gray-100 border-gray-300 text-gray-700' },
          ].map(pl => (
            <button
              key={pl.k}
              type="button"
              onClick={() => onChange('platform', pl.k)}
              className={`py-1.5 px-2 rounded-xl border text-[11px] font-bold transition-all ${
                data.platform === pl.k ? pl.c + ' ring-2 ring-offset-1 ring-blue-400' : 'bg-white border-gray-200 text-gray-500'
              }`}
            >
              {pl.l}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-xs font-bold text-gray-700 mb-1.5">Όνομα Επισκέπτη</label>
        <input
          value={data.guest_name ?? ''}
          onChange={e => onChange('guest_name', e.target.value)}
          className="w-full border border-gray-300 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Προαιρετικό"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1.5">Check-in *</label>
          <input
            required
            type="date"
            value={data.check_in}
            onChange={e => onChange('check_in', e.target.value)}
            className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1.5">Check-out *</label>
          <input
            required
            type="date"
            value={data.check_out}
            min={data.check_in || undefined}
            onChange={e => onChange('check_out', e.target.value)}
            className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Nights indicator */}
      {nights > 0 && (
        <div className="flex items-center gap-1.5 text-xs text-blue-700 bg-blue-50 border border-blue-200 rounded-xl px-3 py-2">
          <Moon size={13} />
          <span className="font-semibold">{nights} {nights === 1 ? 'νύχτα' : 'νύχτες'}</span>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1.5">Τιμή / Νύχτα (€)</label>
          <input
            type="number"
            step="0.5"
            min="0"
            value={typeof data.price_per_night === 'number' ? data.price_per_night : (data.price_per_night ?? '')}
            onChange={e => onChange('price_per_night', e.target.value)}
            className="w-full border border-gray-300 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Αυτόματα"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1.5">
            Καθαριότητα (€)
          </label>
          <input
            type="number"
            step="1"
            min="0"
            value={typeof data.cleaning_fee === 'number' ? data.cleaning_fee : (data.cleaning_fee ?? '')}
            onChange={e => onChange('cleaning_fee', e.target.value)}
            className="w-full border border-gray-300 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 bg-teal-50 border-teal-200 focus:outline-none focus:ring-2 focus:ring-teal-400"
            placeholder="0"
          />
        </div>
      </div>

      {/* Total breakdown */}
      {nights > 0 && (parseFloat(String(data.price_per_night)) > 0 || parseFloat(String(data.cleaning_fee)) > 0) && (
        <div className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 space-y-1.5 text-xs">
          <div className="flex justify-between text-gray-500">
            <span>{nights} νύχτες × €{parseFloat(String(data.price_per_night) || '0').toFixed(2)}</span>
            <span>€{(nights * (parseFloat(String(data.price_per_night) || '0'))).toFixed(2)}</span>
          </div>
          {parseFloat(String(data.cleaning_fee) || '0') > 0 && (
            <div className="flex justify-between text-teal-600">
              <span>Τέλος καθαριότητας</span>
              <span>€{parseFloat(String(data.cleaning_fee) || '0').toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-gray-900 border-t border-gray-200 pt-1.5">
            <span>Σύνολο</span>
            <span className="text-emerald-700">
              €{((nights * (parseFloat(String(data.price_per_night) || '0'))) + (parseFloat(String(data.cleaning_fee) || '0'))).toFixed(2)}
            </span>
          </div>
        </div>
      )}

      <div>
        <label className="block text-xs font-bold text-gray-700 mb-1.5">Σύνολο (€)</label>
        <input
          type="number"
          step="0.01"
          min="0"
          value={typeof data.total_price === 'number' ? data.total_price : (data.total_price ?? '')}
          onChange={e => onChange('total_price', e.target.value)}
          className="w-full border border-gray-300 rounded-xl px-3.5 py-2.5 text-sm font-bold text-emerald-700 bg-emerald-50 border-emerald-200 focus:outline-none focus:ring-2 focus:ring-emerald-400"
          placeholder="Αυτόματος"
        />
      </div>

      <div>
        <label className="block text-xs font-bold text-gray-700 mb-1.5">Σημειώσεις</label>
        <textarea
          value={data.notes ?? ''}
          rows={2}
          onChange={e => onChange('notes', e.target.value)}
          className="w-full border border-gray-300 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          placeholder="Προαιρετικές σημειώσεις..."
        />
      </div>
    </div>
  )

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Κρατήσεις</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            {filtered.length} κρατήσεις · Σύνολο εσόδων: <strong>€{totalIncome.toLocaleString('el-GR', { minimumFractionDigits: 2 })}</strong>
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleSyncAll}
            disabled={isSyncingIcal || properties.length === 0}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold rounded-xl shadow-md shadow-blue-500/20 active:scale-95 transition-all disabled:opacity-50"
            title="Άμεσος συγχρονισμός κρατήσεων από Booking.com & Airbnb iCal feeds"
          >
            <RefreshCw size={14} className={isSyncingIcal ? 'animate-spin' : ''} />
            <span>{isSyncingIcal ? 'Συγχρονισμός...' : 'Συγχρονισμός (iCal)'}</span>
          </button>
          {properties.length > 0 && (
            <ImportCsvModal properties={properties} onSuccess={fetchData} />
          )}
          <button
            onClick={exportToCsv}
            disabled={filtered.length === 0}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold rounded-xl transition-all disabled:opacity-40"
            title="Εξαγωγή σε Excel"
          >
            <Download size={14} />
            <span className="hidden sm:inline">Εξαγωγή CSV</span>
          </button>
          <button
            onClick={() => { setForm(f => ({ ...EMPTY_FORM, property_id: f.property_id || properties[0]?.id || '' })); setShowAdd(true) }}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-sm"
          >
            <Plus size={16} />
            <span>Νέα Κράτηση</span>
          </button>
        </div>
      </div>

      {syncStatusMsg && (
        <div className={`p-3.5 rounded-2xl text-xs font-bold border transition-all ${
          syncStatusMsg.startsWith('✅')
            ? 'bg-emerald-50 text-emerald-800 border-emerald-200 shadow-xs'
            : 'bg-red-50 text-red-800 border-red-200'
        }`}>
          {syncStatusMsg}
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Αναζήτηση επισκέπτη..."
            className="w-full border border-gray-200 rounded-xl pl-9 pr-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select
          value={filterProperty}
          onChange={e => setFilterProperty(e.target.value)}
          className="border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">Όλα τα ακίνητα</option>
          {properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>

        <button
          type="button"
          onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
          className="inline-flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-700 transition-colors shadow-2xs"
          title="Αλλαγή σειράς εμφάνισης (Πρόσφατες / Μελλοντικές)"
        >
          <span>📅 Σειρά:</span>
          <span className="text-blue-600">{sortOrder === 'asc' ? 'Πιο κοντινές πρώτα ↑' : 'Πιο μελλοντικές πρώτα ↓'}</span>
        </button>
      </div>

      {/* Add Booking Modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-extrabold text-gray-900">Νέα Κράτηση</h2>
                <p className="text-xs text-gray-400">Συμπληρώστε τα στοιχεία της κράτησης</p>
              </div>
              <button onClick={() => setShowAdd(false)} className="text-gray-400 hover:text-gray-600 p-1.5 rounded-xl hover:bg-gray-100">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={addBooking} className="space-y-4">
              <BookingFormFields
                data={form}
                onChange={(k, v) => setForm(f => ({ ...f, [k]: v }))}
                nights={formNights}
              />
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowAdd(false)}
                  className="flex-1 border border-gray-300 text-gray-700 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-50">
                  Ακύρωση
                </button>
                <button type="submit"
                  className="flex-1 bg-blue-600 text-white py-2.5 rounded-xl text-sm font-bold hover:bg-blue-700 shadow-sm">
                  Αποθήκευση
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Booking Modal */}
      {editingBooking && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-extrabold text-gray-900">Επεξεργασία Κράτησης</h2>
                <p className="text-xs text-gray-400">Ενημερώστε τα στοιχεία</p>
              </div>
              <button onClick={() => setEditingBooking(null)} className="text-gray-400 hover:text-gray-600 p-1.5 rounded-xl hover:bg-gray-100">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={updateBooking} className="space-y-4">
              <BookingFormFields
                data={editingBooking}
                onChange={(k, v) => setEditingBooking(b => b ? { ...b, [k]: v } : b)}
                nights={editNights}
                isEdit
              />
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setEditingBooking(null)}
                  className="flex-1 border border-gray-300 text-gray-700 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-50">
                  Ακύρωση
                </button>
                <button type="submit"
                  className="flex-1 bg-blue-600 text-white py-2.5 rounded-xl text-sm font-bold hover:bg-blue-700 shadow-sm">
                  Ενημέρωση
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bookings list */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-12 text-center">
          <BookOpen size={40} className="text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">Δεν υπάρχουν κρατήσεις</p>
          <p className="text-gray-400 text-sm mt-1">Προσθέστε χειροκίνητα ή κάντε sync από πλατφόρμα.</p>
        </div>
      ) : (
        <>
          {/* Mobile Card List */}
          <div className="md:hidden space-y-3">
            {filtered.map(booking => {
              const prop = properties.find(p => p.id === booking.property_id)
              return (
                <div key={booking.id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: prop?.color ?? '#3b82f6' }} />
                      <span className="font-bold text-gray-900 text-sm">{prop?.name ?? '—'}</span>
                    </div>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${PLATFORM_COLORS[booking.platform] ?? 'bg-gray-100 text-gray-600'}`}>
                      {PLATFORM_LABELS[booking.platform] ?? booking.platform}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs bg-gray-50/80 p-2.5 rounded-xl border border-gray-100">
                    <div>
                      <span className="text-gray-400 block text-[10px] uppercase font-bold">Επισκέπτης</span>
                      <span className="font-semibold text-gray-800">{booking.guest_name || '—'}</span>
                    </div>
                    <div>
                      <span className="text-gray-400 block text-[10px] uppercase font-bold">Σύνολο / Νύχτες</span>
                      <span className="font-bold text-emerald-700">
                        {booking.total_price ? `€${booking.total_price.toLocaleString('el-GR', { minimumFractionDigits: 2 })}` : '—'}
                        <span className="text-gray-500 font-normal text-[11px]"> ({booking.nights}ν · {booking.price_per_night ? `€${booking.price_per_night}/ν` : '—'})</span>
                      </span>
                    </div>
                    <div className="col-span-2 pt-1 border-t border-gray-200/60 flex items-center justify-between text-[11px] text-gray-600">
                      <span>{format(new Date(booking.check_in), 'd MMM yyyy', { locale: el })}</span>
                      <span>➔</span>
                      <span>{format(new Date(booking.check_out), 'd MMM yyyy', { locale: el })}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setEditingBooking(booking)}
                        className="text-gray-400 hover:text-blue-600 p-1.5 rounded-lg hover:bg-blue-50 transition-colors"
                        title="Επεξεργασία"
                      >
                        <Edit2 size={15} />
                      </button>
                      <button
                        onClick={() => deleteBooking(booking.id)}
                        className="text-gray-400 hover:text-red-500 p-1.5 rounded-lg hover:bg-red-50 transition-colors"
                        title="Διαγραφή"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                    <ShareBookingModal
                      isPro={isProUser}
                      booking={{
                        ...booking,
                        propertyName: prop?.name,
                        amaNumber: prop?.ama_number,
                        cleaning_fee: (booking.cleaning_fee && booking.cleaning_fee > 0) ? booking.cleaning_fee : (prop?.cleaning_fee ?? 0)
                      }}
                    />
                  </div>
                </div>
              )
            })}
          </div>

          {/* Desktop Table */}
          <div className="hidden md:block bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Ακίνητο</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Επισκέπτης</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      <button
                        type="button"
                        onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                        className="inline-flex items-center gap-1 text-gray-700 hover:text-blue-600 font-bold transition-colors"
                        title="Κλικ για αντιστροφή σειράς"
                      >
                        <span>Check-in</span>
                        <span className="text-blue-600 font-black">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                      </button>
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Check-out</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Νύχτες</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">€/Νύχτα</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Σύνολο</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Πλατφόρμα</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Ενέργειες</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filtered.map(booking => {
                    const prop = properties.find(p => p.id === booking.property_id)
                    return (
                      <tr key={booking.id} className="hover:bg-gray-50/70 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: prop?.color ?? '#3b82f6' }} />
                            <span className="font-medium text-gray-900 truncate max-w-32">{prop?.name ?? '—'}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-600">{booking.guest_name || '—'}</td>
                        <td className="px-4 py-3 text-gray-600">{format(new Date(booking.check_in), 'd MMM yyyy', { locale: el })}</td>
                        <td className="px-4 py-3 text-gray-600">{format(new Date(booking.check_out), 'd MMM yyyy', { locale: el })}</td>
                        <td className="px-4 py-3 text-gray-600">{booking.nights}</td>
                        <td className="px-4 py-3 text-gray-600">
                          {booking.price_per_night ? `€${booking.price_per_night.toLocaleString('el-GR', { minimumFractionDigits: 2 })}` : '—'}
                        </td>
                        <td className="px-4 py-3 font-bold text-gray-900">
                          {booking.total_price ? `€${booking.total_price.toLocaleString('el-GR', { minimumFractionDigits: 2 })}` : '—'}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${PLATFORM_COLORS[booking.platform] ?? 'bg-gray-100 text-gray-600'}`}>
                            {PLATFORM_LABELS[booking.platform] ?? booking.platform}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <ShareBookingModal
                              isPro={isProUser}
                              booking={{
                                ...booking,
                                propertyName: prop?.name,
                                amaNumber: prop?.ama_number,
                                cleaning_fee: (booking.cleaning_fee && booking.cleaning_fee > 0) ? booking.cleaning_fee : (prop?.cleaning_fee ?? 0)
                              }}
                            />
                            <button
                              onClick={() => setEditingBooking(booking)}
                              className="text-gray-300 hover:text-blue-600 p-1 rounded-lg hover:bg-blue-50 transition-colors"
                              title="Επεξεργασία"
                            >
                              <Edit2 size={15} />
                            </button>
                            <button
                              onClick={() => deleteBooking(booking.id)}
                              className="text-gray-300 hover:text-red-500 p-1 rounded-lg hover:bg-red-50 transition-colors"
                              title="Διαγραφή"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
