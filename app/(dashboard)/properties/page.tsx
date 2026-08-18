'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, Edit2, Trash2, ExternalLink, RefreshCw, Home } from 'lucide-react'

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

interface Property {
  id: string
  name: string
  address: string | null
  ama_number: string | null
  color: string
  description: string | null
}

interface IcalSource {
  id: string
  property_id: string
  platform: string
  url: string
  last_synced_at: string | null
}

export default function PropertiesPage() {
  const supabase = createClient()
  const [properties, setProperties] = useState<Property[]>([])
  const [icalSources, setIcalSources] = useState<IcalSource[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddProperty, setShowAddProperty] = useState(false)
  const [showAddIcal, setShowAddIcal] = useState<string | null>(null) // property id
  const [syncing, setSyncing] = useState<string | null>(null)

  // New property form
  const [newProp, setNewProp] = useState({
    name: '', address: '', ama_number: '', color: PROPERTY_COLORS[0], description: ''
  })
  // New iCal form
  const [newIcal, setNewIcal] = useState({ platform: 'airbnb', url: '' })

  useEffect(() => { fetchData() }, [])

  async function fetchData() {
    setLoading(true)
    const [{ data: props }, { data: icals }] = await Promise.all([
      supabase.from('properties').select('*').order('created_at'),
      supabase.from('ical_sources').select('*'),
    ])
    setProperties(props ?? [])
    setIcalSources(icals ?? [])
    setLoading(false)
  }

  async function addProperty(e: React.FormEvent) {
    e.preventDefault()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    await supabase.from('properties').insert({
      user_id: user.id,
      name: newProp.name,
      address: newProp.address || null,
      ama_number: newProp.ama_number || null,
      color: newProp.color,
      description: newProp.description || null,
    })
    setNewProp({ name: '', address: '', ama_number: '', color: PROPERTY_COLORS[0], description: '' })
    setShowAddProperty(false)
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
      else alert(`Sync ολοκληρώθηκε! ${data.added ?? 0} νέες κρατήσεις.`)
    } catch {
      alert('Σφάλμα σύνδεσης.')
    }
    setSyncing(null)
    fetchData()
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64 text-gray-400">
      <RefreshCw className="animate-spin mr-2" size={20} /> Φόρτωση...
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Ακίνητα</h1>
          <p className="text-gray-500 text-sm mt-0.5">{properties.length} ακίνητα συνολικά</p>
        </div>
        <button
          onClick={() => setShowAddProperty(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors shadow-sm"
        >
          <Plus size={16} /> Νέο Ακίνητο
        </button>
      </div>

      {/* Add Property Modal */}
      {showAddProperty && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h2 className="text-lg font-semibold mb-4">Νέο Ακίνητο</h2>
            <form onSubmit={addProperty} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Όνομα *</label>
                <input
                  required value={newProp.name}
                  onChange={e => setNewProp(p => ({ ...p, name: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="π.χ. Διαμέρισμα Αθήνα"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Διεύθυνση</label>
                <input
                  value={newProp.address}
                  onChange={e => setNewProp(p => ({ ...p, address: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="π.χ. Ερμού 10, Αθήνα"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ΑΜΑ (Αριθμός Μητρώου Ακινήτου)</label>
                <input
                  value={newProp.ama_number}
                  onChange={e => setNewProp(p => ({ ...p, ama_number: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Αριθμός από myProperty"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Χρώμα στο ημερολόγιο</label>
                <div className="flex gap-2">
                  {PROPERTY_COLORS.map(c => (
                    <button
                      key={c} type="button"
                      onClick={() => setNewProp(p => ({ ...p, color: c }))}
                      className={`w-7 h-7 rounded-full transition-transform ${newProp.color === c ? 'ring-2 ring-offset-2 ring-gray-400 scale-110' : ''}`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowAddProperty(false)}
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

      {/* Add iCal Modal */}
      {showAddIcal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6">
            <h2 className="text-lg font-semibold mb-2">Σύνδεση Πλατφόρμας (iCal)</h2>
            <p className="text-sm text-gray-500 mb-4">
              Αντιγράψτε το iCal/ics URL από την πλατφόρμα σας και επικολλήστε το παρακάτω.
            </p>
            <form onSubmit={addIcalSource} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Πλατφόρμα</label>
                <select
                  value={newIcal.platform}
                  onChange={e => setNewIcal(p => ({ ...p, platform: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="airbnb">Airbnb</option>
                  <option value="booking">Booking.com</option>
                  <option value="vrbo">VRBO</option>
                  <option value="other">Άλλη</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">iCal URL *</label>
                <input
                  required value={newIcal.url}
                  onChange={e => setNewIcal(p => ({ ...p, url: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                  placeholder="https://www.airbnb.com/calendar/ical/..."
                />
              </div>
              <div className="bg-blue-50 rounded-lg p-3 text-xs text-blue-700">
                <strong>Airbnb:</strong> Ημερολόγιο → Εξαγωγή ημερολογίου (.ics)<br />
                <strong>Booking:</strong> Ημερολόγιο → Sync → Εξαγωγή
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowAddIcal(null)}
                  className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-xl text-sm hover:bg-gray-50">
                  Ακύρωση
                </button>
                <button type="submit"
                  className="flex-1 bg-blue-600 text-white py-2 rounded-xl text-sm hover:bg-blue-700">
                  Προσθήκη
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Properties list */}
      {properties.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-12 text-center">
          <Home size={40} className="text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">Δεν έχετε ακίνητα ακόμα</p>
          <p className="text-gray-400 text-sm mt-1">Προσθέστε το πρώτο σας ακίνητο παραπάνω.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {properties.map(prop => {
            const propIcals = icalSources.filter(s => s.property_id === prop.id)
            return (
              <div key={prop.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                {/* Property header */}
                <div className="flex items-center gap-4 px-6 py-4 border-b border-gray-50">
                  <div
                    className="w-4 h-4 rounded-full shrink-0"
                    style={{ backgroundColor: prop.color }}
                  />
                  <div className="flex-1 min-w-0">
                    <h2 className="font-semibold text-gray-900">{prop.name}</h2>
                    <div className="flex items-center gap-3 text-xs text-gray-400 mt-0.5">
                      {prop.address && <span>{prop.address}</span>}
                      {prop.ama_number && <span>ΑΜΑ: {prop.ama_number}</span>}
                    </div>
                  </div>
                  <button
                    onClick={() => deleteProperty(prop.id)}
                    className="text-gray-400 hover:text-red-500 p-1.5 rounded-lg hover:bg-red-50 transition-colors"
                    title="Διαγραφή"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                {/* iCal sources */}
                <div className="px-6 py-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Συνδεδεμένες Πλατφόρμες</span>
                    <button
                      onClick={() => setShowAddIcal(prop.id)}
                      className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                    >
                      <Plus size={12} /> Προσθήκη
                    </button>
                  </div>

                  {propIcals.length === 0 ? (
                    <p className="text-xs text-gray-400 italic">Δεν υπάρχουν συνδεδεμένες πλατφόρμες.</p>
                  ) : (
                    <div className="space-y-2">
                      {propIcals.map(source => {
                        const pl = PLATFORM_LABELS[source.platform] ?? PLATFORM_LABELS.other
                        return (
                          <div key={source.id} className="flex items-center gap-3 bg-gray-50 rounded-xl px-3 py-2.5">
                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${pl.color}`}>
                              {pl.label}
                            </span>
                            <span className="text-xs text-gray-400 font-mono flex-1 truncate">
                              {source.url}
                            </span>
                            {source.last_synced_at && (
                              <span className="text-xs text-gray-400 shrink-0">
                                Sync: {new Date(source.last_synced_at).toLocaleDateString('el-GR')}
                              </span>
                            )}
                            <button
                              onClick={() => syncIcal(source.id, prop.id)}
                              disabled={syncing === source.id}
                              className="text-blue-500 hover:text-blue-700 p-1 rounded disabled:opacity-50"
                              title="Sync τώρα"
                            >
                              <RefreshCw size={14} className={syncing === source.id ? 'animate-spin' : ''} />
                            </button>
                            <button
                              onClick={() => deleteIcalSource(source.id)}
                              className="text-gray-400 hover:text-red-500 p-1 rounded"
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
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
