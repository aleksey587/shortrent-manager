'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  MessageSquare, Copy, Check, Send, Sparkles, User, Home, Calendar,
  Globe, Key, Wifi, Clock, ShieldCheck, Share2, AlertCircle, Edit3, ChevronRight
} from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { el } from 'date-fns/locale'
import { DEFAULT_GUEST_TEMPLATES, replaceTemplateVariables, MessageTemplate } from '@/lib/templates'

interface Property {
  id: string
  name: string
  address: string | null
  color: string
  check_in_time?: string | null
  check_out_time?: string | null
  wifi_name?: string | null
  wifi_password?: string | null
  lockbox_code?: string | null
  directions?: string | null
}

interface Booking {
  id: string
  property_id: string
  guest_name: string | null
  check_in: string
  check_out: string
  nights: number
  platform: string
}

export default function GuestMessagesPage() {
  const supabase = createClient()
  const [properties, setProperties] = useState<Property[]>([])
  const [bookings, setBookings] = useState<Booking[]>([])
  const [selectedBookingId, setSelectedBookingId] = useState<string>('')
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>('')
  const [selectedCategory, setSelectedCategory] = useState<string>('checkin')
  const [language, setLanguage] = useState<'el' | 'en'>('el')
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const [customBody, setCustomBody] = useState<string>('')
  const [editingAmenities, setEditingAmenities] = useState(false)
  const [amenityForm, setAmenityForm] = useState({
    wifi_name: '',
    wifi_password: '',
    lockbox_code: '',
    check_in_time: '15:00',
    check_out_time: '11:00',
    directions: '',
  })
  const [savingAmenities, setSavingAmenities] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    setLoading(true)
    const [{ data: props }, { data: books }] = await Promise.all([
      supabase.from('properties').select('*').order('created_at'),
      supabase
        .from('bookings')
        .select('*')
        .order('check_in', { ascending: false })
        .limit(100),
    ])

    const fetchedProps = props ?? []
    setProperties(fetchedProps)
    setBookings(books ?? [])

    if (fetchedProps.length > 0) {
      setSelectedPropertyId(fetchedProps[0].id)
      loadAmenityForm(fetchedProps[0])
    }

    if (books && books.length > 0) {
      setSelectedBookingId(books[0].id)
      setSelectedPropertyId(books[0].property_id)
      const relatedProp = fetchedProps.find(p => p.id === books[0].property_id)
      if (relatedProp) loadAmenityForm(relatedProp)
    }

    setLoading(false)
  }

  function loadAmenityForm(prop: Property) {
    setAmenityForm({
      wifi_name: prop.wifi_name || '',
      wifi_password: prop.wifi_password || '',
      lockbox_code: prop.lockbox_code || '',
      check_in_time: prop.check_in_time || '15:00',
      check_out_time: prop.check_out_time || '11:00',
      directions: prop.directions || '',
    })
  }

  const activeProperty = properties.find(p => p.id === selectedPropertyId) || properties[0]
  const activeBooking = bookings.find(b => b.id === selectedBookingId)

  // Find matching template
  const activeTemplate = DEFAULT_GUEST_TEMPLATES.find(
    t => t.category === selectedCategory && t.language === language
  ) || DEFAULT_GUEST_TEMPLATES[0]

  // Rendered body with smart variables
  const renderedMessage = activeBooking && activeProperty
    ? replaceTemplateVariables(customBody || activeTemplate.body, {
        guest_name: activeBooking.guest_name || (language === 'el' ? 'Επισκέπτη' : 'Guest'),
        property_name: activeProperty.name,
        property_address: activeProperty.address || '—',
        check_in: format(parseISO(activeBooking.check_in), 'dd/MM/yyyy'),
        check_out: format(parseISO(activeBooking.check_out), 'dd/MM/yyyy'),
        nights: activeBooking.nights,
        check_in_time: activeProperty.check_in_time || '15:00',
        check_out_time: activeProperty.check_out_time || '11:00',
        wifi_name: activeProperty.wifi_name || '—',
        wifi_password: activeProperty.wifi_password || '—',
        lockbox_code: activeProperty.lockbox_code || '—',
        directions: activeProperty.directions || 'Είσοδος με κλειδοθήκη.',
      })
    : (customBody || activeTemplate.body)

  const handleCopy = () => {
    navigator.clipboard.writeText(renderedMessage)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleWhatsApp = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(renderedMessage)}`, '_blank')
  }

  const handleEmail = () => {
    const subject = encodeURIComponent(
      activeTemplate.subject.replace('{{property_name}}', activeProperty?.name || 'Ακίνητο')
    )
    const body = encodeURIComponent(renderedMessage)
    window.location.href = `mailto:?subject=${subject}&body=${body}`
  }

  const handleSaveAmenities = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!activeProperty) return
    setSavingAmenities(true)

    const { error } = await supabase
      .from('properties')
      .update({
        wifi_name: amenityForm.wifi_name || null,
        wifi_password: amenityForm.wifi_password || null,
        lockbox_code: amenityForm.lockbox_code || null,
        check_in_time: amenityForm.check_in_time || '15:00',
        check_out_time: amenityForm.check_out_time || '11:00',
        directions: amenityForm.directions || null,
      })
      .eq('id', activeProperty.id)

    setSavingAmenities(false)
    if (error) {
      alert('⚠️ Σημείωση: Αν οι στήλες Wi-Fi δεν έχουν δημιουργηθεί ακόμα στη βάση, εκτελέστε το Migration 006 στο Supabase SQL Editor.')
    } else {
      setProperties(prev => prev.map(p => p.id === activeProperty.id ? { ...p, ...amenityForm } : p))
      setEditingAmenities(false)
    }
  }

  const categories = [
    { key: 'confirmation', label: '1. Επιβεβαίωση', icon: '🎉' },
    { key: 'checkin', label: '2. Check-in & Wi-Fi', icon: '🔑' },
    { key: 'midstay', label: '3. Έλεγχος Διαμονής', icon: '✨' },
    { key: 'checkout', label: '4. Check-out', icon: '🧳' },
    { key: 'review', label: '5. Αίτημα Κριτικής 5★', icon: '⭐' },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-gray-500 text-sm">Φόρτωση μηνυμάτων & κρατήσεων...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 bg-blue-50 border border-blue-200 text-blue-700 px-3 py-1 rounded-full text-xs font-semibold mb-1">
            <Sparkles size={14} className="text-amber-500" />
            <span>Hospitable-Grade Guest Automation</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
            Αυτόματα & Έξυπνα Μηνύματα Επισκεπτών
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Επαγγελματικά μηνύματα για κάθε στάδιο της κράτησης με 1-click αποστολή σε WhatsApp, Airbnb & Booking.
          </p>
        </div>

        {/* Language Toggle */}
        <div className="flex items-center gap-1.5 bg-gray-100 p-1.5 rounded-2xl shrink-0 self-start sm:self-auto border border-gray-200">
          <button
            onClick={() => { setLanguage('el'); setCustomBody('') }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              language === 'el' ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <span>🇬🇷</span>
            <span>Ελληνικά</span>
          </button>
          <button
            onClick={() => { setLanguage('en'); setCustomBody('') }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              language === 'en' ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <span>🇬🇧</span>
            <span>English</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Booking & Template Selector */}
        <div className="lg:col-span-5 space-y-5">
          {/* Booking Selector Card */}
          <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                <User size={15} className="text-blue-600" />
                <span>Επιλογή Κράτησης</span>
              </label>
              <span className="text-[11px] text-gray-400 font-medium">{bookings.length} διαθέσιμες</span>
            </div>

            <select
              value={selectedBookingId}
              onChange={e => {
                const bId = e.target.value
                setSelectedBookingId(bId)
                const bk = bookings.find(b => b.id === bId)
                if (bk) {
                  setSelectedPropertyId(bk.property_id)
                  const prop = properties.find(p => p.id === bk.property_id)
                  if (prop) loadAmenityForm(prop)
                }
              }}
              className="w-full border border-gray-300 rounded-2xl px-3.5 py-3 text-sm text-gray-900 bg-gray-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
            >
              {bookings.map(b => {
                const prop = properties.find(p => p.id === b.property_id)
                return (
                  <option key={b.id} value={b.id}>
                    {b.guest_name || 'Επισκέπτης'} · {prop?.name || 'Ακίνητο'} ({format(parseISO(b.check_in), 'd MMM', { locale: el })} - {format(parseISO(b.check_out), 'd MMM', { locale: el })})
                  </option>
                )
              })}
            </select>

            {activeBooking && activeProperty && (
              <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-3.5 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-blue-950 flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: activeProperty.color }} />
                    {activeProperty.name}
                  </span>
                  <span className="bg-white border border-blue-200 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase text-blue-700">
                    {activeBooking.platform}
                  </span>
                </div>
                <div className="text-gray-600 grid grid-cols-2 gap-1 pt-1 text-[11px]">
                  <div>📅 Check-in: <strong>{format(parseISO(activeBooking.check_in), 'dd/MM/yyyy')}</strong></div>
                  <div>📅 Check-out: <strong>{format(parseISO(activeBooking.check_out), 'dd/MM/yyyy')}</strong></div>
                  <div>🌙 Διανυκτερεύσεις: <strong>{activeBooking.nights}</strong></div>
                  <div>👤 Επισκέπτης: <strong>{activeBooking.guest_name || '—'}</strong></div>
                </div>
              </div>
            )}
          </div>

          {/* Template Stage Selector */}
          <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 space-y-3">
            <label className="text-xs font-bold text-gray-900 uppercase tracking-wider block">
              Στάδιο Επικοινωνίας (Templates)
            </label>

            <div className="space-y-1.5">
              {categories.map(cat => {
                const isSelected = selectedCategory === cat.key
                return (
                  <button
                    key={cat.key}
                    onClick={() => { setSelectedCategory(cat.key); setCustomBody('') }}
                    className={`w-full text-left px-4 py-3 rounded-2xl text-xs font-bold transition-all flex items-center justify-between ${
                      isSelected
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                        : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-base">{cat.icon}</span>
                      <span>{cat.label}</span>
                    </div>
                    <ChevronRight size={14} className={isSelected ? 'text-white' : 'text-gray-400'} />
                  </button>
                )
              })}
            </div>
          </div>

          {/* Wi-Fi & Lockbox Quick Settings for Property */}
          <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                <Wifi size={14} className="text-teal-600" />
                <span>Στοιχεία Wi-Fi & Check-in</span>
              </span>
              <button
                type="button"
                onClick={() => setEditingAmenities(!editingAmenities)}
                className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1"
              >
                <Edit3 size={12} />
                <span>{editingAmenities ? 'Ακύρωση' : 'Επεξεργασία'}</span>
              </button>
            </div>

            {editingAmenities ? (
              <form onSubmit={handleSaveAmenities} className="space-y-3 pt-2 text-xs animate-in fade-in duration-150">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-bold text-gray-600 uppercase block mb-1">Wi-Fi (SSID)</label>
                    <input
                      value={amenityForm.wifi_name}
                      onChange={e => setAmenityForm(f => ({ ...f, wifi_name: e.target.value }))}
                      placeholder="π.χ. Callisto_Guest"
                      className="w-full border border-gray-300 rounded-xl px-2.5 py-1.5 text-xs focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-gray-600 uppercase block mb-1">Κωδικός Wi-Fi</label>
                    <input
                      value={amenityForm.wifi_password}
                      onChange={e => setAmenityForm(f => ({ ...f, wifi_password: e.target.value }))}
                      placeholder="π.χ. Athens2026!"
                      className="w-full border border-gray-300 rounded-xl px-2.5 py-1.5 text-xs focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-[10px] font-bold text-gray-600 uppercase block mb-1">Lockbox</label>
                    <input
                      value={amenityForm.lockbox_code}
                      onChange={e => setAmenityForm(f => ({ ...f, lockbox_code: e.target.value }))}
                      placeholder="π.χ. 1234"
                      className="w-full border border-gray-300 rounded-xl px-2.5 py-1.5 text-xs focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-gray-600 uppercase block mb-1">Check-in</label>
                    <input
                      value={amenityForm.check_in_time}
                      onChange={e => setAmenityForm(f => ({ ...f, check_in_time: e.target.value }))}
                      placeholder="15:00"
                      className="w-full border border-gray-300 rounded-xl px-2.5 py-1.5 text-xs focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-gray-600 uppercase block mb-1">Check-out</label>
                    <input
                      value={amenityForm.check_out_time}
                      onChange={e => setAmenityForm(f => ({ ...f, check_out_time: e.target.value }))}
                      placeholder="11:00"
                      className="w-full border border-gray-300 rounded-xl px-2.5 py-1.5 text-xs focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-gray-600 uppercase block mb-1">Οδηγίες Πρόσβασης</label>
                  <input
                    value={amenityForm.directions}
                    onChange={e => setAmenityForm(f => ({ ...f, directions: e.target.value }))}
                    placeholder="π.χ. Κλειδοθήκη δίπλα στο κουδούνι του 2ου ορόφου"
                    className="w-full border border-gray-300 rounded-xl px-2.5 py-1.5 text-xs focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={savingAmenities}
                  className="w-full bg-teal-600 hover:bg-teal-700 text-white py-2 rounded-xl text-xs font-bold transition-colors disabled:opacity-50"
                >
                  {savingAmenities ? 'Αποθήκευση...' : 'Αποθήκευση Στοιχείων Ακινήτου'}
                </button>
              </form>
            ) : (
              <div className="bg-gray-50 border border-gray-200/80 rounded-2xl p-3 text-[11px] space-y-1.5 text-gray-600">
                <div className="flex justify-between">
                  <span className="text-gray-400">Wi-Fi:</span>
                  <span className="font-semibold text-gray-800">{activeProperty?.wifi_name || 'Δεν ορίστηκε'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Κωδικός Wi-Fi:</span>
                  <span className="font-mono font-bold text-gray-800">{activeProperty?.wifi_password || 'Δεν ορίστηκε'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Κλειδοθήκη / Lockbox:</span>
                  <span className="font-mono font-bold text-indigo-700">{activeProperty?.lockbox_code || 'Δεν ορίστηκε'}</span>
                </div>
                <div className="flex justify-between border-t border-gray-200/60 pt-1">
                  <span className="text-gray-400">Check-in / Check-out:</span>
                  <span className="font-semibold text-gray-800">{activeProperty?.check_in_time || '15:00'} / {activeProperty?.check_out_time || '11:00'}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Live Message Preview & 1-Click Dispatch */}
        <div className="lg:col-span-7 space-y-5">
          <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-sm border border-gray-100 space-y-5">
            {/* Header info */}
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div className="flex items-center gap-2.5">
                <span className="text-2xl">{activeTemplate.icon}</span>
                <div>
                  <h3 className="font-extrabold text-gray-900 text-base">{activeTemplate.title}</h3>
                  <p className="text-xs text-gray-400">
                    Έτοιμο προς αποστολή για {activeBooking?.guest_name || 'τον επισκέπτη'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold px-3.5 py-2 rounded-xl text-xs transition-colors shadow-2xs"
                >
                  {copied ? <Check size={14} className="text-emerald-600 stroke-[3]" /> : <Copy size={14} />}
                  <span>{copied ? 'Αντιγράφηκε!' : 'Αντιγραφή'}</span>
                </button>
              </div>
            </div>

            {/* Message Body Editor / Preview */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                  Προεπισκόπηση & Προσαρμογή Μηνύματος:
                </label>
                <span className="text-[10px] text-teal-600 bg-teal-50 px-2 py-0.5 rounded-md font-bold">
                  ✨ Smart Variables Auto-Filled
                </span>
              </div>

              <textarea
                rows={12}
                value={renderedMessage}
                onChange={e => setCustomBody(e.target.value)}
                className="w-full font-sans text-xs sm:text-sm text-gray-900 bg-gray-50/70 border border-gray-200 rounded-2xl p-4 leading-relaxed focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-inner"
              />
            </div>

            {/* Action Bar */}
            <div className="pt-2 border-t border-gray-100 space-y-3">
              <span className="text-xs font-bold text-gray-700 block">Άμεση Αποστολή στον Επισκέπτη:</span>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Copy Button */}
                <button
                  onClick={handleCopy}
                  className="w-full flex items-center justify-center gap-2 bg-gray-900 hover:bg-black text-white py-3 px-4 rounded-2xl text-xs font-bold transition-all shadow-sm"
                >
                  {copied ? <Check size={16} className="text-emerald-400 stroke-[3]" /> : <Copy size={16} />}
                  <span>{copied ? 'Αντιγράφηκε!' : 'Αντιγραφή για Airbnb'}</span>
                </button>

                {/* WhatsApp Button */}
                <button
                  onClick={handleWhatsApp}
                  className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white py-3 px-4 rounded-2xl text-xs font-bold transition-all shadow-sm shadow-emerald-600/20"
                >
                  <Share2 size={16} />
                  <span>Αποστολή WhatsApp</span>
                </button>

                {/* Email Button */}
                <button
                  onClick={handleEmail}
                  className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-2xl text-xs font-bold transition-all shadow-sm shadow-blue-600/20"
                >
                  <Send size={16} />
                  <span>Αποστολή Email</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
