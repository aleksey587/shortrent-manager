'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import {
  Plus, Trash2, RefreshCw, Home, ChevronDown, ChevronUp,
  MapPin, Hash, Palette, CalendarDays, Save, Euro, Link2, X, Edit2, Check, Clock, Sparkles, Wand2, Zap
} from 'lucide-react'
import MonthlyPricingPanel from '@/components/properties/MonthlyPricingPanel'
import ChannelConnectModal from '@/components/properties/ChannelConnectModal'
import { isSuperAdmin, isProUser, getUserTier, getMaxPropertiesAllowed, resolveUserId } from '@/lib/permissions'

const PLATFORM_LABELS: Record<string, { label: string; color: string }> = {
  airbnb: { label: 'Airbnb', color: 'bg-red-100 text-red-700' },
  booking: { label: 'Booking.com', color: 'bg-blue-100 text-blue-700' },
  vrbo: { label: 'VRBO', color: 'bg-teal-100 text-teal-700' },
  other: { label: 'Άλλη', color: 'bg-gray-100 text-gray-700' },
}

const PROPERTY_COLORS = [
  '#3b82f6', '#10b981', '#f59e0b', '#ef4444',
  '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16',
]

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

interface Property {
  id: string
  name: string
  address: string | null
  ama_number: string | null
  color: string
  description: string | null
  cleaning_fee: number | null
}

interface IcalSource {
  id: string
  property_id: string
  platform: string
  url: string
  last_synced_at: string | null
}

const EMPTY_PROP = {
  name: '', address: '', ama_number: '', color: PROPERTY_COLORS[0], description: '', cleaning_fee: ''
}

export default function PropertiesPage() {
  const supabase = createClient()
  const [properties, setProperties] = useState<Property[]>([])
  const [icalSources, setIcalSources] = useState<IcalSource[]>([])
  const [loading, setLoading] = useState(true)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [showAddProperty, setShowAddProperty] = useState(false)
  const [editingProp, setEditingProp] = useState<Property | null>(null)
  const [selectedChannelProp, setSelectedChannelProp] = useState<Property | null>(null)
  const [showAddIcal, setShowAddIcal] = useState<string | null>(null)
  const [syncing, setSyncing] = useState<string | null>(null)
  const [expandedIcal, setExpandedIcal] = useState<string | null>(null)

  // Modal tab state: 1 = Basic Info, 2 = Pricing & Cleaning
  const [modalTab, setModalTab] = useState<1 | 2>(1)
  const [modalYear, setModalYear] = useState<number>(new Date().getFullYear())
  const [modalRates, setModalRates] = useState<Record<number, string>>({})
  const [modalRatesLoading, setModalRatesLoading] = useState(false)

  // Form state
  const [newProp, setNewProp] = useState(EMPTY_PROP)
  const [newIcal, setNewIcal] = useState({ platform: 'airbnb', url: '' })

  useEffect(() => { fetchData() }, [])

  async function fetchData() {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    const targetUserId = resolveUserId(user)
    
    if (user?.email) {
      setUserEmail(user.email)
    } else if (typeof document !== 'undefined') {
      const match = document.cookie.match(/greekhost_magic_user=([^;]+)/)
      if (match) setUserEmail(decodeURIComponent(match[1]))
    }

    let propQuery = supabase.from('properties').select('*').order('created_at')
    if (targetUserId) {
      propQuery = propQuery.eq('user_id', targetUserId)
    }

    const { data: props } = await propQuery
    const fetchedProps = props ?? []
    const propIds = fetchedProps.map(p => p.id)

    let icalsQuery = supabase.from('ical_sources').select('*')
    if (propIds.length > 0) {
      icalsQuery = icalsQuery.in('property_id', propIds)
    } else {
      icalsQuery = icalsQuery.eq('property_id', '00000000-0000-0000-0000-000000000000')
    }

    const { data: icals } = await icalsQuery

    const fetchedIcals = icals ?? []
    setProperties(fetchedProps)
    setIcalSources(fetchedIcals)
    setLoading(false)

    // Background Smart Sync: Auto-sync sources older than 1 hour on page visit
    const oneHourAgo = Date.now() - 60 * 60 * 1000
    for (const source of fetchedIcals) {
      if (!source.last_synced_at || new Date(source.last_synced_at).getTime() < oneHourAgo) {
        fetch('/api/sync-ical', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sourceId: source.id, propertyId: source.property_id }),
        }).then(() => {
          // silently refresh ical sources timestamp
          supabase.from('ical_sources').select('*').then(({ data }) => {
            if (data) setIcalSources(data)
          })
        }).catch(() => {})
      }
    }
  }

  // Load rates when opening edit modal
  async function openEditModal(prop: Property) {
    setEditingProp(prop)
    setModalTab(1)
    setModalRatesLoading(true)
    const { data } = await supabase
      .from('monthly_rates')
      .select('*')
      .eq('property_id', prop.id)
      .eq('year', modalYear)

    const map: Record<number, string> = {}
    for (const r of data ?? []) {
      map[r.month] = String(r.price_per_night)
    }
    setModalRates(map)
    setModalRatesLoading(false)
  }

  function openAddModal() {
    setNewProp(EMPTY_PROP)
    setModalRates({})
    setModalTab(1)
    setShowAddProperty(true)
  }

  async function addProperty(e: React.FormEvent) {
    e.preventDefault()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const cleanNum = newProp.cleaning_fee ? parseFloat(String(newProp.cleaning_fee)) : 0

    const { data: createdProp, error } = await supabase.from('properties').insert({
      user_id: user.id,
      name: newProp.name,
      address: newProp.address || null,
      ama_number: newProp.ama_number || null,
      color: newProp.color,
      description: newProp.description || null,
      cleaning_fee: isNaN(cleanNum) ? 0 : cleanNum,
    }).select().single()

    if (error) {
      alert('Σφάλμα δημιουργίας: ' + error.message)
      return
    }

    // Save any entered monthly rates
    if (createdProp && Object.keys(modalRates).length > 0) {
      for (const [mStr, priceStr] of Object.entries(modalRates)) {
        const month = Number(mStr)
        const price = parseFloat(priceStr)
        if (!priceStr || isNaN(price) || price <= 0) continue

        await supabase.from('monthly_rates').upsert({
          property_id: createdProp.id,
          user_id: user.id,
          year: modalYear,
          month,
          price_per_night: price,
        }, { onConflict: 'property_id,year,month' })
      }
    }

    setNewProp(EMPTY_PROP)
    setModalRates({})
    setShowAddProperty(false)
    fetchData()
  }

  async function updateProperty(e: React.FormEvent) {
    e.preventDefault()
    if (!editingProp) return

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const cleanNum = editingProp.cleaning_fee != null ? parseFloat(String(editingProp.cleaning_fee)) : 0

    const { error } = await supabase.from('properties').update({
      name: editingProp.name,
      address: editingProp.address || null,
      ama_number: editingProp.ama_number || null,
      color: editingProp.color,
      description: editingProp.description || null,
      cleaning_fee: isNaN(cleanNum) ? 0 : cleanNum,
    }).eq('id', editingProp.id)

    if (error) {
      alert('⚠️ Σφάλμα αποθήκευσης: ' + error.message + '\n\nΑν αναφέρει τη στήλη cleaning_fee, εκτελέστε το SQL migration στο Supabase SQL Editor.')
      return
    }

    // Save updated monthly rates
    if (Object.keys(modalRates).length > 0) {
      for (const [mStr, priceStr] of Object.entries(modalRates)) {
        const month = Number(mStr)
        const price = parseFloat(priceStr)
        if (!priceStr || isNaN(price) || price <= 0) continue

        await supabase.from('monthly_rates').upsert({
          property_id: editingProp.id,
          user_id: user.id,
          year: modalYear,
          month,
          price_per_night: price,
        }, { onConflict: 'property_id,year,month' })
      }
    }

    setEditingProp(null)
    fetchData()
  }

  async function deleteProperty(id: string) {
    if (!confirm('Διαγραφή ακινήτου και όλων των κρατήσεων;')) return
    await supabase.from('properties').delete().eq('id', id)
    fetchData()
  }

  async function addIcalSource(e: React.FormEvent) {
    e.preventDefault()
    if (!showAddIcal) return
    await supabase.from('ical_sources').insert({
      property_id: showAddIcal,
      platform: newIcal.platform,
      url: newIcal.url,
    })
    setNewIcal({ platform: 'airbnb', url: '' })
    setShowAddIcal(null)
    fetchData()
  }

  async function deleteIcalSource(id: string) {
    await supabase.from('ical_sources').delete().eq('id', id)
    fetchData()
  }

  async function syncIcal(sourceId: string, propertyId: string) {
    setSyncing(sourceId)
    try {
      const res = await fetch('/api/sync-ical', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sourceId, propertyId }),
      })
      const data = await res.json()
      if (data.error) alert('Σφάλμα sync: ' + data.error)
      else alert(`✅ Sync ολοκληρώθηκε! ${data.added ?? 0} νέες κρατήσεις.`)
    } catch {
      alert('Σφάλμα σύνδεσης.')
    }
    setSyncing(null)
    fetchData()
  }

  // --- Property Form Modal (shared for add & edit) ---
  const propModalData = editingProp ?? newProp
  const setPropModalData = editingProp
    ? (updater: any) => setEditingProp(p => p ? { ...p, ...updater(p) } : p)
    : (updater: any) => setNewProp(p => ({ ...p, ...updater(p) }))

  const isModalOpen = showAddProperty || !!editingProp
  const closeModal = () => { setShowAddProperty(false); setEditingProp(null) }

  if (loading) return (
    <div className="flex items-center justify-center h-64 text-gray-400">
      <RefreshCw className="animate-spin mr-2" size={20} /> Φόρτωση...
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Ακίνητα</h1>
          <p className="text-gray-500 text-sm mt-0.5">{properties.length} ακίνητα συνολικά</p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/pricing"
            className={`hidden sm:inline-flex items-center gap-1.5 border px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
              isSuperAdmin(userEmail)
                ? 'bg-amber-50 border-amber-300 text-amber-900 hover:bg-amber-100/60'
                : getUserTier(userEmail) === 'pro'
                ? 'bg-purple-50 border-purple-300 text-purple-900 hover:bg-purple-100/60'
                : 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 text-blue-900 hover:bg-blue-100/60'
            }`}
          >
            <span>
              {isSuperAdmin(userEmail)
                ? `👑 Super Admin (${properties.length} ακίνητα)`
                : getUserTier(userEmail) === 'pro'
                ? `⭐ Πλάνο Pro (${properties.length}/3 ακίνητα)`
                : `💎 Πλάνο Starter (${properties.length}/1 δωρεάν)`}
            </span>
          </Link>
          <button
            onClick={openAddModal}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors shadow-sm"
          >
            <Plus size={16} /> Νέο Ακίνητο
          </button>
        </div>
      </div>

      {/* Add / Edit Property Modal with 2 TABS / PAGES */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xl p-6 space-y-5 overflow-y-auto max-h-[92vh]">
            {/* Modal header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center">
                  <Home size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-extrabold text-gray-900">
                    {editingProp ? `Επεξεργασία: ${editingProp.name}` : 'Νέο Ακίνητο'}
                  </h2>
                  <p className="text-xs text-gray-400">Στοιχεία ακινήτου, τιμολόγηση και καθαριότητα</p>
                </div>
              </div>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 p-1.5 rounded-xl hover:bg-gray-100">
                <X size={18} />
              </button>
            </div>

            {/* TAB SELECTOR (2 Pages) */}
            <div className="grid grid-cols-2 gap-2 p-1.5 bg-gray-100 rounded-2xl">
              <button
                type="button"
                onClick={() => setModalTab(1)}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  modalTab === 1
                    ? 'bg-white text-blue-700 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Home size={14} />
                <span>1. Βασικά Στοιχεία</span>
              </button>
              <button
                type="button"
                onClick={() => setModalTab(2)}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  modalTab === 2
                    ? 'bg-white text-blue-700 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Euro size={14} className="text-amber-500" />
                <span>2. Τιμές & Καθαριότητα</span>
              </button>
            </div>

            <form onSubmit={editingProp ? updateProperty : addProperty} className="space-y-4">
              {/* --- PAGE 1: BASIC INFO --- */}
              {modalTab === 1 && (
                <div className="space-y-4 animate-in fade-in duration-200">
                  {/* Name */}
                  <div>
                    <label className="flex items-center gap-1.5 text-xs font-bold text-gray-700 mb-1.5">
                      <Home size={13} className="text-blue-500" />
                      Όνομα Ακινήτου *
                    </label>
                    <input
                      required
                      value={propModalData.name}
                      onChange={e => setPropModalData((p: any) => ({ ...p, name: e.target.value }))}
                      className="w-full border border-gray-300 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="π.χ. Callisto, Διαμέρισμα Αθήνα"
                    />
                  </div>

                  {/* Address */}
                  <div>
                    <label className="flex items-center gap-1.5 text-xs font-bold text-gray-700 mb-1.5">
                      <MapPin size={13} className="text-emerald-500" />
                      Διεύθυνση
                    </label>
                    <input
                      value={propModalData.address ?? ''}
                      onChange={e => setPropModalData((p: any) => ({ ...p, address: e.target.value }))}
                      className="w-full border border-gray-300 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="π.χ. Παρασίου 28-30, Άγιος Δημήτριος"
                    />
                  </div>

                  {/* AMA */}
                  <div>
                    <label className="flex items-center gap-1.5 text-xs font-bold text-gray-700 mb-1.5">
                      <Hash size={13} className="text-purple-500" />
                      ΑΜΑ (Αριθμός Μητρώου Ακινήτου)
                    </label>
                    <input
                      value={propModalData.ama_number ?? ''}
                      onChange={e => setPropModalData((p: any) => ({ ...p, ama_number: e.target.value }))}
                      className="w-full border border-gray-300 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Αριθμός από myProperty (ΑΑΔΕ)"
                    />
                    <p className="text-[10px] text-gray-400 mt-1">
                      Βρείτε τον ΑΜΑ στο <a href="https://www1.aade.gr/saadeweb/web/guest/myProperty" target="_blank" rel="noopener noreferrer" className="text-blue-500 underline">myProperty (ΑΑΔΕ)</a>
                    </p>
                  </div>

                  {/* Description */}
                  <div>
                    <label className="flex items-center gap-1.5 text-xs font-bold text-gray-700 mb-1.5">
                      📝 Σημειώσεις / Περιγραφή
                    </label>
                    <textarea
                      value={propModalData.description ?? ''}
                      onChange={e => setPropModalData((p: any) => ({ ...p, description: e.target.value }))}
                      rows={2}
                      className="w-full border border-gray-300 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                      placeholder="π.χ. 2ος όροφος, 2 υπνοδωμάτια, κωδικός κλειδοθήκης #4829"
                    />
                  </div>

                  {/* Color picker */}
                  <div>
                    <label className="flex items-center gap-1.5 text-xs font-bold text-gray-700 mb-2">
                      <Palette size={13} className="text-pink-500" />
                      Χρώμα στο Ημερολόγιο
                    </label>
                    <div className="flex gap-2.5 flex-wrap">
                      {PROPERTY_COLORS.map(c => (
                        <button
                          key={c} type="button"
                          onClick={() => setPropModalData((p: any) => ({ ...p, color: c }))}
                          className={`w-8 h-8 rounded-full transition-all ${propModalData.color === c ? 'ring-3 ring-offset-2 ring-gray-500 scale-110' : 'hover:scale-105'}`}
                          style={{ backgroundColor: c }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* --- PAGE 2: PRICING & CLEANING --- */}
              {modalTab === 2 && (
                <div className="space-y-4 animate-in fade-in duration-200">
                  {/* Cleaning Fee */}
                  <div className="bg-teal-50 border border-teal-200 rounded-2xl p-4 space-y-2">
                    <label className="flex items-center gap-1.5 text-xs font-bold text-teal-900">
                      <Euro size={14} className="text-teal-600" />
                      Πάγιο Τέλος Καθαριότητας (€ ανά κράτηση)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-teal-600 text-sm font-bold">€</span>
                      <input
                        type="number"
                        step="1"
                        min="0"
                        value={propModalData.cleaning_fee ?? ''}
                        onChange={e => setPropModalData((p: any) => ({ ...p, cleaning_fee: e.target.value }))}
                        className="w-full border border-teal-300 rounded-xl pl-8 pr-3.5 py-2.5 text-sm font-bold text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                        placeholder="π.χ. 50"
                      />
                    </div>
                    <p className="text-[11px] text-teal-700 leading-relaxed">
                      💡 Προστίθεται <strong>μία φορά ανά κράτηση</strong> στο τελικό ποσό. Δεν λογίζεται ως ενοίκιο στο ΑΑΔΕ.
                    </p>
                  </div>

                  {/* Monthly Pricing 12 Months */}
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <label className="flex items-center gap-1.5 text-xs font-bold text-gray-800">
                        <CalendarDays size={14} className="text-amber-500" />
                        Καθαρή Τιμή ανά Διανυκτέρευση (€/νύχτα για το {modalYear})
                      </label>
                      <div className="flex items-center gap-1 text-xs">
                        <button
                          type="button"
                          onClick={() => setModalYear(y => y - 1)}
                          className="px-2 py-0.5 border rounded-lg text-gray-500 hover:bg-gray-50"
                        >
                          ‹
                        </button>
                        <span className="font-bold text-gray-800">{modalYear}</span>
                        <button
                          type="button"
                          onClick={() => setModalYear(y => y + 1)}
                          className="px-2 py-0.5 border rounded-lg text-gray-500 hover:bg-gray-50"
                        >
                          ›
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {MONTHS.map(({ key, label }) => (
                        <div key={key} className="p-2.5 bg-gray-50 rounded-xl border border-gray-200">
                          <label className="block text-[11px] font-bold text-gray-600 mb-1">
                            {label}
                          </label>
                          <div className="relative">
                            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-bold">€</span>
                            <input
                              type="number"
                              step="1"
                              min="0"
                              placeholder="—"
                              value={modalRates[key] ?? ''}
                              onChange={e => setModalRates(r => ({ ...r, [key]: e.target.value }))}
                              className="w-full pl-6 pr-2 py-1 text-xs font-bold border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Modal Bottom Navigation & Submit */}
              <div className="flex items-center justify-between gap-3 pt-3 border-t border-gray-100">
                {modalTab === 1 ? (
                  <>
                    <button
                      type="button"
                      onClick={closeModal}
                      className="px-4 py-2.5 border border-gray-300 text-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-50"
                    >
                      Ακύρωση
                    </button>
                    <button
                      type="button"
                      onClick={() => setModalTab(2)}
                      className="px-5 py-2.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-xl text-sm font-bold hover:bg-blue-100 transition-colors flex items-center gap-1.5"
                    >
                      <span>Επόμενο: Τιμές & Καθαριότητα →</span>
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => setModalTab(1)}
                      className="px-4 py-2.5 border border-gray-300 text-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-50"
                    >
                      ← Πίσω στα Στοιχεία
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 shadow-sm transition-colors"
                    >
                      {editingProp ? 'Αποθήκευση Όλων' : 'Δημιουργία Ακινήτου'}
                    </button>
                  </>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add iCal Modal */}
      {showAddIcal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-teal-100 text-teal-700 flex items-center justify-center">
                  <Link2 size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-extrabold text-gray-900">Σύνδεση Πλατφόρμας (iCal)</h2>
                  <p className="text-xs text-gray-400">Αυτόματος συγχρονισμός κρατήσεων</p>
                </div>
              </div>
              <button onClick={() => setShowAddIcal(null)} className="text-gray-400 hover:text-gray-600 p-1.5 rounded-xl hover:bg-gray-100">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={addIcalSource} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">Πλατφόρμα</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { key: 'airbnb', label: 'Airbnb', color: 'bg-red-50 border-red-300 text-red-700' },
                    { key: 'booking', label: 'Booking.com', color: 'bg-blue-50 border-blue-300 text-blue-700' },
                    { key: 'vrbo', label: 'VRBO', color: 'bg-teal-50 border-teal-300 text-teal-700' },
                    { key: 'other', label: 'Άλλη', color: 'bg-gray-50 border-gray-300 text-gray-700' },
                  ].map(pl => (
                    <button
                      key={pl.key}
                      type="button"
                      onClick={() => setNewIcal(p => ({ ...p, platform: pl.key }))}
                      className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                        newIcal.platform === pl.key
                          ? pl.color + ' ring-2 ring-offset-1 ring-blue-400'
                          : 'bg-gray-50 border-gray-200 text-gray-600'
                      }`}
                    >
                      {pl.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">iCal URL *</label>
                <input
                  required
                  value={newIcal.url}
                  onChange={e => setNewIcal(p => ({ ...p, url: e.target.value }))}
                  className="w-full border border-gray-300 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                  placeholder="https://www.airbnb.com/calendar/ical/..."
                />
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3.5 text-xs text-amber-800 space-y-1.5 leading-relaxed">
                <p className="font-bold text-amber-900">📍 Πώς να βρείτε το iCal URL:</p>
                <p><strong>Airbnb:</strong> Ημερολόγιο → Διαθεσιμότητα → Εξαγωγή Ημερολογίου (.ics)</p>
                <p><strong>Booking.com:</strong> Ακίνητο → Ημερολόγιο → Sync → Εξαγωγή</p>
                <p><strong>VRBO:</strong> Ημερολόγιο → Εξαγωγή</p>
              </div>

              <div className="flex gap-3">
                <button type="button" onClick={() => setShowAddIcal(null)}
                  className="flex-1 border border-gray-300 text-gray-700 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-50">
                  Ακύρωση
                </button>
                <button type="submit"
                  className="flex-1 bg-blue-600 text-white py-2.5 rounded-xl text-sm font-bold hover:bg-blue-700 shadow-sm">
                  Προσθήκη & Σύνδεση
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Properties list */}
      {properties.length === 0 ? (
        <div className="bg-white rounded-3xl border border-dashed border-gray-300 p-16 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Home size={28} className="text-gray-300" />
          </div>
          <p className="text-gray-600 font-semibold text-base">Δεν έχετε ακίνητα ακόμα</p>
          <p className="text-gray-400 text-sm mt-1">Πατήστε «Νέο Ακίνητο» για να ξεκινήσετε.</p>
          <button
            onClick={openAddModal}
            className="mt-5 inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-sm transition-colors"
          >
            <Plus size={16} /> Προσθήκη Πρώτου Ακινήτου
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {properties.map(prop => {
            const propIcals = icalSources.filter(s => s.property_id === prop.id)
            const isExpanded = expandedIcal === prop.id

            return (
              <div key={prop.id} className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                {/* Property header */}
                <div className="flex items-center gap-4 px-5 py-4">
                  <div
                    className="w-5 h-5 rounded-full shrink-0 shadow-sm"
                    style={{ backgroundColor: prop.color }}
                  />
                  <div className="flex-1 min-w-0">
                    <h2 className="font-bold text-gray-900 text-base">{prop.name}</h2>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-gray-400 mt-0.5">
                      {prop.address && (
                        <span className="flex items-center gap-1">
                          <MapPin size={11} /> {prop.address}
                        </span>
                      )}
                      {prop.ama_number && (
                        <span className="flex items-center gap-1">
                          <Hash size={11} /> ΑΜΑ: {prop.ama_number}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Euro size={11} className="text-teal-600" />
                        {prop.cleaning_fee && prop.cleaning_fee > 0 ? (
                          <span className="text-teal-700 font-semibold bg-teal-50 border border-teal-200 px-2 py-0.5 rounded-md">
                            Καθαριότητα: €{prop.cleaning_fee}
                          </span>
                        ) : (
                          <span className="text-gray-400">Χωρίς τέλος καθαρισμού</span>
                        )}
                      </span>
                      <span className="flex items-center gap-1">
                        <Link2 size={11} />
                        {propIcals.length} {propIcals.length === 1 ? 'πλατφόρμα' : 'πλατφόρμες'}
                      </span>
                    </div>
                    {prop.description && (
                      <p className="text-xs text-gray-400 mt-1 truncate">{prop.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => setSelectedChannelProp(prop)}
                      className="flex items-center gap-1 bg-gradient-to-r from-emerald-50 to-teal-50 hover:from-emerald-100 hover:to-teal-100 text-emerald-800 border border-emerald-200 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-2xs"
                      title="Σύνδεση με Airbnb & Booking.com"
                    >
                      <Zap size={12} className="text-emerald-600" />
                      <span>⚡ Σύνδεση OTA Κανάλια</span>
                    </button>

                    <button
                      onClick={() => openEditModal(prop)}
                      className="text-gray-400 hover:text-blue-600 p-1.5 rounded-xl hover:bg-blue-50 transition-colors"
                      title="Επεξεργασία"
                    >
                      <Edit2 size={15} />
                    </button>
                    <button
                      onClick={() => deleteProperty(prop.id)}
                      className="text-gray-400 hover:text-red-500 p-1.5 rounded-xl hover:bg-red-50 transition-colors"
                      title="Διαγραφή"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>

                {/* Monthly Pricing Panel */}
                <MonthlyPricingPanel
                  propertyId={prop.id}
                  propertyName={prop.name}
                  initialCleaningFee={prop.cleaning_fee}
                  userEmail={userEmail}
                  onPropertyUpdated={fetchData}
                />

                {/* iCal sources section */}
                <div className="border-t border-gray-100">
                  <button
                    onClick={() => setExpandedIcal(isExpanded ? null : prop.id)}
                    className="w-full flex items-center justify-between px-5 py-3.5 text-left hover:bg-gray-50/70 transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <Link2 size={15} className="text-blue-500" />
                      <span className="text-sm font-semibold text-gray-700">
                        Συνδεδεμένες Πλατφόρμες (iCal)
                      </span>
                      {propIcals.length > 0 && (
                        <span className="text-[10px] bg-blue-100 text-blue-700 font-bold px-2 py-0.5 rounded-full">
                          {propIcals.length}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setShowAddIcal(prop.id) }}
                        className="text-xs text-blue-600 hover:underline font-semibold flex items-center gap-0.5"
                      >
                        <Plus size={12} /> Προσθήκη
                      </button>
                      {isExpanded ? <ChevronUp size={15} className="text-gray-400" /> : <ChevronDown size={15} className="text-gray-400" />}
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="px-5 pb-4">
                      {propIcals.length === 0 ? (
                        <div className="bg-gray-50 rounded-2xl p-5 text-center">
                          <Link2 size={22} className="text-gray-300 mx-auto mb-2" />
                          <p className="text-xs text-gray-400 font-medium">Δεν υπάρχουν συνδεδεμένες πλατφόρμες.</p>
                          <button
                            onClick={() => setShowAddIcal(prop.id)}
                            className="mt-2 text-xs text-blue-600 hover:underline font-semibold"
                          >
                            + Προσθήκη Airbnb / Booking iCal
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {/* Auto-sync notice */}
                          <div className="flex items-center gap-2 text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2">
                            <Clock size={11} className="shrink-0" />
                            <span className="font-semibold">Αυτόματη ανανέωση κάθε 6 ώρες · Μπορείτε και χειροκίνητα με το κουμπί ↻</span>
                          </div>
                          {propIcals.map(source => {
                            const pl = PLATFORM_LABELS[source.platform] ?? PLATFORM_LABELS.other
                            const lastSync = source.last_synced_at ? new Date(source.last_synced_at) : null
                            const minutesAgo = lastSync ? Math.round((Date.now() - lastSync.getTime()) / 60000) : null
                            const syncLabel = minutesAgo === null
                              ? 'Δεν έχει γίνει sync'
                              : minutesAgo < 60
                              ? `${minutesAgo} λεπτά πριν`
                              : minutesAgo < 1440
                              ? `${Math.round(minutesAgo / 60)} ώρες πριν`
                              : lastSync!.toLocaleDateString('el-GR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })

                            return (
                              <div key={source.id} className="flex items-center gap-3 bg-gray-50 rounded-2xl px-4 py-3">
                                <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full shrink-0 ${pl.color}`}>
                                  {pl.label}
                                </span>
                                <div className="flex-1 min-w-0">
                                  <span className="text-xs text-gray-400 font-mono block truncate">
                                    {source.url}
                                  </span>
                                  <span className={`text-[10px] flex items-center gap-0.5 mt-0.5 ${lastSync ? 'text-gray-400' : 'text-amber-500'}`}>
                                    <Clock size={9} />
                                    {syncLabel}
                                  </span>
                                </div>
                                <button
                                  onClick={() => syncIcal(source.id, prop.id)}
                                  disabled={syncing === source.id}
                                  className="text-blue-500 hover:text-blue-700 p-1.5 rounded-xl hover:bg-blue-50 disabled:opacity-50 transition-colors shrink-0"
                                  title="Sync τώρα"
                                >
                                  <RefreshCw size={14} className={syncing === source.id ? 'animate-spin' : ''} />
                                </button>
                                <button
                                  onClick={() => deleteIcalSource(source.id)}
                                  className="text-gray-400 hover:text-red-500 p-1.5 rounded-xl hover:bg-red-50 transition-colors shrink-0"
                                  title="Αφαίρεση"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Channel Connect 2-Way Modal */}
      {selectedChannelProp && (
        <ChannelConnectModal
          property={selectedChannelProp}
          userEmail={userEmail}
          isOpen={true}
          onClose={() => setSelectedChannelProp(null)}
        />
      )}
    </div>
  )
}
