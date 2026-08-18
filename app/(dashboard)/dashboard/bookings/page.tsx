'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, Trash2, RefreshCw, BookOpen, Search } from 'lucide-react'
import { format } from 'date-fns'
import { el } from 'date-fns/locale'
import ShareBookingModal from '@/components/bookings/ShareBookingModal'

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
}

export default function BookingsPage() {
  const supabase = createClient()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [search, setSearch] = useState('')
  const [filterProperty, setFilterProperty] = useState('all')

  const [form, setForm] = useState({
    property_id: '',
    guest_name: '',
    check_in: '',
    check_out: '',
    price_per_night: '',
    total_price: '',
    platform: 'manual',
    notes: '',
  })

  useEffect(() => { fetchData() }, [])

  async function fetchData() {
    setLoading(true)
    const [{ data: props }, { data: books }] = await Promise.all([
      supabase.from('properties').select('id, name, color, ama_number').order('created_at'),
      supabase.from('bookings').select('*').order('check_in', { ascending: false }),
    ])
    setProperties(props ?? [])
    setBookings(books ?? [])
    if (props && props.length > 0 && !form.property_id) {
      setForm(f => ({ ...f, property_id: props[0].id }))
    }
    setLoading(false)
  }

  // Auto-calculate total when price_per_night or dates change
  useEffect(() => {
    if (form.price_per_night && form.check_in && form.check_out) {
      const nights = Math.ceil(
        (new Date(form.check_out).getTime() - new Date(form.check_in).getTime()) / (1000 * 60 * 60 * 24)
      )
      if (nights > 0) {
        setForm(f => ({ ...f, total_price: (parseFloat(form.price_per_night) * nights).toFixed(2) }))
      }
    }
  }, [form.price_per_night, form.check_in, form.check_out])

  async function addBooking(e: React.FormEvent) {
    e.preventDefault()
    await supabase.from('bookings').insert({
      property_id: form.property_id,
      guest_name: form.guest_name || null,
      check_in: form.check_in,
      check_out: form.check_out,
      price_per_night: form.price_per_night ? parseFloat(form.price_per_night) : null,
      total_price: form.total_price ? parseFloat(form.total_price) : null,
      platform: form.platform,
      notes: form.notes || null,
      source: 'manual',
    })
    setShowAdd(false)
    setForm(f => ({ ...f, guest_name: '', check_in: '', check_out: '', price_per_night: '', total_price: '', notes: '' }))
    fetchData()
  }

  async function deleteBooking(id: string) {
    if (!confirm('Διαγραφή κράτησης;')) return
    await supabase.from('bookings').delete().eq('id', id)
    fetchData()
  }

  const filtered = bookings.filter(b => {
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

  const totalIncome = filtered.reduce((s, b) => s + (b.total_price ?? 0), 0)

  if (loading) return (
    <div className="flex items-center justify-center h-64 text-gray-400">
      <RefreshCw className="animate-spin mr-2" size={20} /> Φόρτωση...
    </div>
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Κρατήσεις</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            {filtered.length} κρατήσεις · Σύνολο εσόδων: <strong>€{totalIncome.toLocaleString('el-GR', { minimumFractionDigits: 2 })}</strong>
          </p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-medium shadow-sm"
        >
          <Plus size={16} /> Νέα Κράτηση
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Αναζήτηση επισκέπτη..."
            className="w-full border border-gray-200 rounded-xl pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select
          value={filterProperty}
          onChange={e => setFilterProperty(e.target.value)}
          className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">Όλα τα ακίνητα</option>
          {properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </div>

      {/* Add Booking Modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-semibold mb-4">Νέα Κράτηση</h2>
            <form onSubmit={addBooking} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ακίνητο *</label>
                <select required value={form.property_id}
                  onChange={e => setForm(f => ({ ...f, property_id: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  {properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Πλατφόρμα</label>
                <select value={form.platform}
                  onChange={e => setForm(f => ({ ...f, platform: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="manual">Χειροκίνητη</option>
                  <option value="airbnb">Airbnb</option>
                  <option value="booking">Booking.com</option>
                  <option value="vrbo">VRBO</option>
                  <option value="other">Άλλη</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Όνομα Επισκέπτη</label>
                <input value={form.guest_name}
                  onChange={e => setForm(f => ({ ...f, guest_name: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Προαιρετικό" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Check-in *</label>
                  <input required type="date" value={form.check_in}
                    onChange={e => setForm(f => ({ ...f, check_in: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Check-out *</label>
                  <input required type="date" value={form.check_out}
                    onChange={e => setForm(f => ({ ...f, check_out: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Τιμή/νύχτα (€)</label>
                  <input type="number" step="0.01" min="0" value={form.price_per_night}
                    onChange={e => setForm(f => ({ ...f, price_per_night: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0.00" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Σύνολο (€)</label>
                  <input type="number" step="0.01" min="0" value={form.total_price}
                    onChange={e => setForm(f => ({ ...f, total_price: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Αυτόματος υπολογισμός" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Σημειώσεις</label>
                <textarea value={form.notes} rows={2}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  placeholder="Προαιρετικές σημειώσεις..." />
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowAdd(false)}
                  className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-xl text-sm hover:bg-gray-50">
                  Ακύρωση
                </button>
                <button type="submit"
                  className="flex-1 bg-blue-600 text-white py-2 rounded-xl text-sm hover:bg-blue-700">
                  Αποθήκευση
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bookings table */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-12 text-center">
          <BookOpen size={40} className="text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">Δεν υπάρχουν κρατήσεις</p>
          <p className="text-gray-400 text-sm mt-1">Προσθέστε χειροκίνητα ή κάντε sync από πλατφόρμα.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Ακίνητο</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Επισκέπτης</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Check-in</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Check-out</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Νύχτες</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Σύνολο</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Πλατφόρμα</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Ενέργειες</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(booking => {
                  const prop = properties.find(p => p.id === booking.property_id)
                  return (
                    <tr key={booking.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: prop?.color ?? '#3b82f6' }} />
                          <span className="font-medium text-gray-900 truncate max-w-32">
                            {prop?.name ?? '—'}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{booking.guest_name || '—'}</td>
                      <td className="px-4 py-3 text-gray-600">
                        {format(new Date(booking.check_in), 'd MMM yyyy', { locale: el })}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {format(new Date(booking.check_out), 'd MMM yyyy', { locale: el })}
                      </td>
                      <td className="px-4 py-3 text-gray-600">{booking.nights}</td>
                      <td className="px-4 py-3 font-medium text-gray-900">
                        {booking.total_price ? `€${booking.total_price.toLocaleString('el-GR', { minimumFractionDigits: 2 })}` : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${PLATFORM_COLORS[booking.platform] ?? 'bg-gray-100 text-gray-600'}`}>
                          {PLATFORM_LABELS[booking.platform] ?? booking.platform}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <ShareBookingModal
                            booking={{
                              ...booking,
                              propertyName: prop?.name,
                              amaNumber: prop?.ama_number,
                            }}
                          />
                          <button
                            onClick={() => deleteBooking(booking.id)}
                            className="text-gray-300 hover:text-red-500 p-1 rounded transition-colors"
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
      )}
    </div>
  )
}
