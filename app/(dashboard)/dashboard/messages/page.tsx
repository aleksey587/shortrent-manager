'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  Crown, Building2, Calendar, MessageSquare, Mail, Trash2, RefreshCw,
  User, ExternalLink, Search, Sparkles, CheckCircle2, ShieldAlert, Euro, Link2
} from 'lucide-react'
import { format } from 'date-fns'
import { el } from 'date-fns/locale'
import Link from 'next/link'
import { isSuperAdmin, PAID_SUBSCRIBERS } from '@/lib/permissions'

interface SupportMessage {
  id: string
  user_email: string
  subject: string
  message: string
  created_at: string
}

interface PropertyRow {
  id: string
  user_id: string
  name: string
  address: string | null
  ama_number: string | null
  color: string
  created_at: string
}

interface BookingRow {
  id: string
  property_id: string
  guest_name: string | null
  check_in: string
  check_out: string
  platform: string
  total_price: number | null
}

interface IcalSourceRow {
  id: string
  property_id: string
  platform: string
  url: string
  last_synced_at: string | null
}

export default function SuperAdminHubPage() {
  const supabase = createClient()
  const [activeTab, setActiveTab] = useState<'overview' | 'properties' | 'support' | 'subscribers'>('overview')
  const [loading, setLoading] = useState(true)
  const [syncingAll, setSyncingAll] = useState(false)
  const [syncStatus, setSyncStatus] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  const [messages, setMessages] = useState<SupportMessage[]>([])
  const [properties, setProperties] = useState<PropertyRow[]>([])
  const [bookings, setBookings] = useState<BookingRow[]>([])
  const [icalSources, setIcalSources] = useState<IcalSourceRow[]>([])

  useEffect(() => {
    fetchAllPlatformData()
  }, [])

  async function fetchAllPlatformData() {
    setLoading(true)
    const [
      { data: msgs },
      { data: props },
      { data: books },
      { data: icals },
    ] = await Promise.all([
      supabase.from('support_messages').select('*').order('created_at', { ascending: false }),
      supabase.from('properties').select('*').order('created_at', { ascending: false }),
      supabase.from('bookings').select('id, property_id, guest_name, check_in, check_out, platform, total_price'),
      supabase.from('ical_sources').select('*'),
    ])

    setMessages(msgs ?? [])
    setProperties(props ?? [])
    setBookings(books ?? [])
    setIcalSources(icals ?? [])
    setLoading(false)
  }

  async function handleGlobalSync() {
    setSyncingAll(true)
    setSyncStatus(null)
    try {
      const res = await fetch('/api/cron/sync-ical?force=true')
      const data = await res.json()
      await fetchAllPlatformData()
      setSyncStatus(`✅ Καθολικός συγχρονισμός ολοκληρώθηκε! (${data.synced || 0} πηγές συγχρονίστηκαν)`)
      setTimeout(() => setSyncStatus(null), 5000)
    } catch {
      setSyncStatus('❌ Σφάλμα κατά τον καθολικό συγχρονισμό.')
    } finally {
      setSyncingAll(false)
    }
  }

  async function deleteMessage(id: string) {
    if (!confirm('Διαγραφή μηνύματος;')) return
    await supabase.from('support_messages').delete().eq('id', id)
    fetchAllPlatformData()
  }

  // Group properties by user_id to count unique active hosts
  const uniqueHostIds = Array.from(new Set(properties.map(p => p.user_id)))
  const totalRevenueTracked = bookings.reduce((sum, b) => sum + (b.total_price || 0), 0)

  // Filtered properties
  const filteredProps = properties.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.address && p.address.toLowerCase().includes(searchQuery.toLowerCase())) ||
    p.user_id.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Super Admin Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 sm:p-8 rounded-3xl shadow-xl border border-indigo-500/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-1.5 bg-amber-500/20 border border-amber-400/40 text-amber-300 px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider">
            <Crown size={14} className="text-amber-400" />
            <span>Super Admin Command Center</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Κέντρο Ελέγχου Πλατφόρμας GreekHost
          </h1>
          <p className="text-xs sm:text-sm text-slate-300">
            Πλήρης εποπτεία όλων των ιδιοκτητών, καταλυμάτων, κρατήσεων, iCal συγχρονισμών & μηνυμάτων Support.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 self-start md:self-auto">
          <button
            onClick={handleGlobalSync}
            disabled={syncingAll}
            className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold px-4 py-2.5 rounded-2xl text-xs transition-all shadow-lg disabled:opacity-50"
          >
            <RefreshCw size={14} className={syncingAll ? 'animate-spin' : ''} />
            <span>{syncingAll ? 'Συγχρονισμός όλων...' : '⚡ Global iCal Sync (Όλοι οι Χρήστες)'}</span>
          </button>

          <button
            onClick={fetchAllPlatformData}
            className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white font-bold px-4 py-2.5 rounded-2xl text-xs transition-all"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            <span>Ανανέωση</span>
          </button>
        </div>
      </div>

      {syncStatus && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-2xl text-xs font-bold">
          {syncStatus}
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-gray-400 text-xs font-bold uppercase">
            <span>Ενεργοί Ιδιοκτήτες</span>
            <User size={16} className="text-blue-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-gray-900">{uniqueHostIds.length}</div>
          <p className="text-[11px] text-gray-500">Με καταχωρημένα ακίνητα</p>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-gray-400 text-xs font-bold uppercase">
            <span>Συνολικά Ακίνητα</span>
            <Building2 size={16} className="text-indigo-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-gray-900">{properties.length}</div>
          <p className="text-[11px] text-gray-500">{icalSources.length} ενεργές συνδέσεις iCal</p>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-gray-400 text-xs font-bold uppercase">
            <span>Συνολικές Κρατήσεις</span>
            <Calendar size={16} className="text-emerald-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-gray-900">{bookings.length}</div>
          <p className="text-[11px] text-gray-500">Τζίρος: €{totalRevenueTracked.toLocaleString('el-GR', { maximumFractionDigits: 0 })}</p>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-gray-400 text-xs font-bold uppercase">
            <span>Support Inbox</span>
            <MessageSquare size={16} className="text-amber-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-gray-900">{messages.length}</div>
          <p className="text-[11px] text-gray-500">{PAID_SUBSCRIBERS.length} ενεργοί Pro συνδρομητές</p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-2 bg-white p-1.5 rounded-2xl border border-gray-200 w-fit shadow-2xs">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'overview' ? 'bg-blue-600 text-white shadow-xs' : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          📊 Επισκόπηση Χρηστών ({uniqueHostIds.length})
        </button>
        <button
          onClick={() => setActiveTab('properties')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'properties' ? 'bg-blue-600 text-white shadow-xs' : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          🏠 Όλα τα Ακίνητα ({properties.length})
        </button>
        <button
          onClick={() => setActiveTab('subscribers')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'subscribers' ? 'bg-blue-600 text-white shadow-xs' : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          ⭐ Συνδρομές Pro ({PAID_SUBSCRIBERS.length})
        </button>
        <button
          onClick={() => setActiveTab('support')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'support' ? 'bg-blue-600 text-white shadow-xs' : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          📬 Μηνύματα Support ({messages.length})
        </button>
      </div>

      {/* TAB 1: HOST OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="bg-white rounded-3xl border border-gray-100 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-gray-900 text-base">Εγγεγραμμένοι Ιδιοκτήτες & Δραστηριότητα</h3>
              <p className="text-xs text-gray-500">Ομαδοποίηση ανά λογαριασμό χρήστη (User ID)</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-gray-50 text-gray-500 uppercase font-bold border-b border-gray-100">
                  <th className="py-3.5 px-4">Χρήστης / Ταυτότητα</th>
                  <th className="py-3.5 px-4">Ακίνητα</th>
                  <th className="py-3.5 px-4">Πηγές iCal</th>
                  <th className="py-3.5 px-4">Κρατήσεις</th>
                  <th className="py-3.5 px-4">Συνολικός Τζίρος</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {uniqueHostIds.map(uid => {
                  const userProps = properties.filter(p => p.user_id === uid)
                  const propIds = userProps.map(p => p.id)
                  const userBooks = bookings.filter(b => propIds.includes(b.property_id))
                  const userIcals = icalSources.filter(s => propIds.includes(s.property_id))
                  const userRevenue = userBooks.reduce((s, b) => s + (b.total_price || 0), 0)

                  const isCallistoUser = uid === 'df2b28d9-5964-4efd-a2be-e9edf5de02a8'
                  const isDemoUser = uid === '1ab5df3a-8fc0-450e-9283-3fc7bd5ca4cb'

                  return (
                    <tr key={uid} className="hover:bg-gray-50/80 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-gray-900 flex items-center gap-1.5">
                          {isCallistoUser ? (
                            <span className="bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full text-[11px] font-extrabold">
                              ⭐ theodoroskolokuthas@gmail.com (Pro)
                            </span>
                          ) : isDemoUser ? (
                            <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full text-[11px] font-extrabold">
                              🧪 demo@greekhost.gr (Demo Account)
                            </span>
                          ) : (
                            <span className="font-mono text-gray-600 text-[11px]">{uid.slice(0, 14)}...</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex flex-wrap gap-1">
                          {userProps.map(p => (
                            <span
                              key={p.id}
                              className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[11px] font-bold text-white"
                              style={{ backgroundColor: p.color || '#3b82f6' }}
                            >
                              {p.name}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-gray-700">
                        {userIcals.length > 0 ? (
                          <span className="text-emerald-600">{userIcals.length} ενεργές</span>
                        ) : (
                          <span className="text-gray-400">0</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-extrabold text-gray-900">
                        {userBooks.length}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-emerald-700">
                        €{userRevenue.toLocaleString('el-GR', { maximumFractionDigits: 0 })}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: ALL PROPERTIES */}
      {activeTab === 'properties' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-gray-200 flex items-center gap-2.5">
            <Search size={16} className="text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Αναζήτηση ακινήτου, διεύθυνσης ή User ID..."
              className="w-full text-xs text-gray-900 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProps.map(p => {
              const pBooks = bookings.filter(b => b.property_id === p.id)
              const pIcals = icalSources.filter(s => s.property_id === p.id)
              return (
                <div key={p.id} className="bg-white rounded-3xl p-5 border border-gray-100 shadow-xs space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <span
                        className="w-3.5 h-3.5 rounded-full shrink-0"
                        style={{ backgroundColor: p.color || '#3b82f6' }}
                      />
                      <h4 className="font-extrabold text-gray-900 text-sm">{p.name}</h4>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Link
                        href={`/stay/${p.id}`}
                        target="_blank"
                        className="text-[11px] text-purple-600 hover:underline font-bold flex items-center gap-0.5"
                      >
                        <span>Direct Site</span>
                        <ExternalLink size={10} />
                      </Link>
                      <Link
                        href={`/guide/${p.id}`}
                        target="_blank"
                        className="text-[11px] text-blue-600 hover:underline font-bold flex items-center gap-0.5"
                      >
                        <span>Οδηγός</span>
                        <ExternalLink size={10} />
                      </Link>
                    </div>
                  </div>

                  <div className="text-xs text-gray-500 space-y-1">
                    <p>📍 Διεύθυνση: <strong className="text-gray-700">{p.address || '—'}</strong></p>
                    <p>🏛️ ΑΜΑ: <strong className="text-gray-700">{p.ama_number || '—'}</strong></p>
                    <p>📅 Κρατήσεις: <strong className="text-gray-900">{pBooks.length}</strong> | Πηγές iCal: <strong className="text-emerald-600">{pIcals.length}</strong></p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* TAB 3: SUBSCRIBERS */}
      {activeTab === 'subscribers' && (
        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-xs space-y-4">
          <div>
            <h3 className="font-extrabold text-gray-900 text-base">Ενεργές Συνδρομές Pro & Business</h3>
            <p className="text-xs text-gray-500">Λογαριασμοί με ξεκλείδωτες όλες τις Pro δυνατότητες</p>
          </div>

          <div className="space-y-3">
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-extrabold uppercase text-amber-700 bg-amber-200/70 px-2 py-0.5 rounded-full">
                  👑 Super Admin
                </span>
                <p className="font-extrabold text-gray-900 text-sm mt-1">gjokas.al@gmail.com</p>
                <p className="text-xs text-gray-600">Απεριόριστη πρόσβαση & διαχείριση πλατφόρμας</p>
              </div>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-3 py-1 rounded-full">
                Ενεργό για πάντα
              </span>
            </div>

            {PAID_SUBSCRIBERS.map(sub => (
              <div key={sub.email} className="bg-purple-50 border border-purple-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <span className="text-[10px] font-extrabold uppercase text-purple-700 bg-purple-200/70 px-2 py-0.5 rounded-full">
                    ⭐ {sub.tier.toUpperCase()} PLAN
                  </span>
                  <p className="font-extrabold text-gray-900 text-sm mt-1">{sub.email}</p>
                  <p className="text-xs text-purple-800">{sub.label}</p>
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href="/api/auth/magic-login?user=theodoros"
                    className="text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white px-3.5 py-2 rounded-xl transition-colors"
                  >
                    Σύνδεση ως Χρήστης
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: SUPPORT MESSAGES */}
      {activeTab === 'support' && (
        <div className="space-y-4">
          {messages.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-dashed border-gray-200 space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto text-2xl">
                📬
              </div>
              <h3 className="font-bold text-gray-800 text-base">Δεν υπάρχουν νέα μηνύματα Support</h3>
              <p className="text-xs text-gray-400 max-w-sm mx-auto">
                Όταν κάποιος χρήστης στέλνει μήνυμα από τη φόρμα «Επικοινωνία & Support», θα εμφανίζεται αμέσως εδώ!
              </p>
            </div>
          ) : (
            messages.map(msg => (
              <div
                key={msg.id}
                className="bg-white rounded-3xl p-6 border border-gray-100 shadow-xs space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-gray-100">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
                      <User size={15} />
                    </div>
                    <div>
                      <span className="font-bold text-gray-900 text-sm block">
                        {msg.user_email || 'Χρήστης GreekHost'}
                      </span>
                      <span className="text-[11px] text-gray-400 flex items-center gap-1">
                        {msg.created_at ? format(new Date(msg.created_at), 'dd MMM yyyy, HH:mm', { locale: el }) : ''}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <a
                      href={`mailto:${msg.user_email}?subject=${encodeURIComponent(`Re: ${msg.subject}`)}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl transition-all"
                    >
                      <Mail size={13} />
                      <span>Απάντηση με Email</span>
                    </a>
                    <button
                      onClick={() => deleteMessage(msg.id)}
                      className="p-1.5 text-gray-400 hover:text-red-600 rounded-xl hover:bg-red-50 transition-all"
                      title="Διαγραφή"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>

                <div>
                  <h4 className="font-bold text-gray-800 text-sm mb-1">{msg.subject}</h4>
                  <p className="text-gray-600 text-sm whitespace-pre-line leading-relaxed bg-gray-50 p-4 rounded-2xl border border-gray-100">
                    {msg.message}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
