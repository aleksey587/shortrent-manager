'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  MessageSquare, Copy, Check, Send, Sparkles, User, Home, Calendar,
  Globe, Key, Wifi, Clock, ShieldCheck, Share2, AlertCircle, Edit3, ChevronRight,
  Plus, Trash2, RotateCcw, Lock
} from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { el } from 'date-fns/locale'
import { DEFAULT_GUEST_TEMPLATES, replaceTemplateVariables, MessageTemplate } from '@/lib/templates'
import { openWhatsAppMessage } from '@/lib/utils'
import { isProUser } from '@/lib/permissions'
import ProFeatureModal from '@/components/ui/ProFeatureModal'
import ScheduledRulesPanel from '@/components/guest-messages/ScheduledRulesPanel'

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
  const [activeMainTab, setActiveMainTab] = useState<'dispatch' | 'scheduled'>('dispatch')
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [properties, setProperties] = useState<Property[]>([])
  const [bookings, setBookings] = useState<Booking[]>([])
  const [selectedBookingId, setSelectedBookingId] = useState<string>('')
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>('')
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('gr-checkin')
  const [language, setLanguage] = useState<'el' | 'en'>('el')
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const [customBody, setCustomBody] = useState<string>('')

  // Custom Templates state
  const [customTemplates, setCustomTemplates] = useState<MessageTemplate[]>([])
  const [showTemplateModal, setShowTemplateModal] = useState(false)
  const [showProModal, setShowProModal] = useState(false)
  const [templateForm, setTemplateForm] = useState<{
    id?: string
    title: string
    category: 'confirmation' | 'checkin' | 'midstay' | 'checkout' | 'review' | 'custom'
    language: 'el' | 'en'
    icon: string
    subject: string
    body: string
  }>({
    title: '',
    category: 'custom',
    language: 'el',
    icon: '💬',
    subject: '',
    body: '',
  })

  // Wi-Fi quick editor state
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
    const [{ data: { user } }, { data: props }, { data: books }] = await Promise.all([
      supabase.auth.getUser(),
      supabase.from('properties').select('*').order('created_at'),
      supabase
        .from('bookings')
        .select('*')
        .order('check_in', { ascending: false })
        .limit(100),
    ])

    if (user?.email) setUserEmail(user.email)

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

    // Load saved custom templates from localStorage
    try {
      const saved = localStorage.getItem('greekhost_custom_templates')
      if (saved) {
        setCustomTemplates(JSON.parse(saved))
      }
    } catch {
      // ignore
    }

    setLoading(false)
  }

  const isPro = isProUser(userEmail)

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

  // Combined templates (default + custom)
  const allTemplates = [...DEFAULT_GUEST_TEMPLATES, ...customTemplates]

  // Filter templates by current language
  const availableTemplates = allTemplates.filter(t => t.language === language)

  // Active template
  const activeTemplate = allTemplates.find(t => t.id === selectedTemplateId) || availableTemplates[0] || DEFAULT_GUEST_TEMPLATES[0]

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
    openWhatsAppMessage(renderedMessage)
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
      alert('⚠️ Σημείωση: Αν οι στήλες Wi-Fi δεν έχουν δημιουργηθεί στη βάση, εκτελέστε το Migration 006 στο Supabase SQL Editor.')
    } else {
      setProperties(prev => prev.map(p => p.id === activeProperty.id ? { ...p, ...amenityForm } : p))
      setEditingAmenities(false)
    }
  }

  // Open Template Editor (Pro gated)
  const openNewTemplate = () => {
    if (!isPro) {
      setShowProModal(true)
      return
    }
    setTemplateForm({
      title: '',
      category: 'custom',
      language,
      icon: '💬',
      subject: '',
      body: '',
    })
    setShowTemplateModal(true)
  }

  const openEditTemplate = (tmpl: MessageTemplate) => {
    if (!isPro) {
      setShowProModal(true)
      return
    }
    setTemplateForm({
      id: tmpl.id,
      title: tmpl.title,
      category: tmpl.category,
      language: tmpl.language,
      icon: tmpl.icon,
      subject: tmpl.subject,
      body: tmpl.body,
    })
    setShowTemplateModal(true)
  }

  const saveCustomTemplate = (e: React.FormEvent) => {
    e.preventDefault()
    if (!templateForm.title.trim() || !templateForm.body.trim()) {
      alert('Παρακαλούμε συμπληρώστε τίτλο και κείμενο μηνύματος.')
      return
    }

    let updated: MessageTemplate[]
    if (templateForm.id) {
      // update existing
      updated = customTemplates.map(t =>
        t.id === templateForm.id
          ? { ...t, ...templateForm, id: templateForm.id }
          : t
      )
      // or if it was a default template being edited, save as custom override
      if (!customTemplates.some(t => t.id === templateForm.id)) {
        const newEntry: MessageTemplate = {
          ...templateForm,
          id: `custom-${Date.now()}`,
        }
        updated = [...customTemplates, newEntry]
        setSelectedTemplateId(newEntry.id)
      }
    } else {
      // create new
      const newEntry: MessageTemplate = {
        ...templateForm,
        id: `custom-${Date.now()}`,
      }
      updated = [...customTemplates, newEntry]
      setSelectedTemplateId(newEntry.id)
    }

    setCustomTemplates(updated)
    try {
      localStorage.setItem('greekhost_custom_templates', JSON.stringify(updated))
    } catch {
      // ignore
    }
    setShowTemplateModal(false)
    setCustomBody('')
  }

  const deleteCustomTemplate = (id: string) => {
    if (!confirm('Διαγραφή αυτού του προτύπου;')) return
    const updated = customTemplates.filter(t => t.id !== id)
    setCustomTemplates(updated)
    try {
      localStorage.setItem('greekhost_custom_templates', JSON.stringify(updated))
    } catch {
      // ignore
    }
    setSelectedTemplateId(availableTemplates[0]?.id || 'gr-checkin')
    setCustomBody('')
  }

  const insertVariable = (variableTag: string) => {
    setTemplateForm(prev => ({
      ...prev,
      body: prev.body + ' ' + variableTag,
    }))
  }

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
            Έτοιμα πρότυπα και δυνατότητα δημιουργίας δικών σας μηνυμάτων με 1-click αποστολή σε WhatsApp, Airbnb & Booking.
          </p>
        </div>

        {/* Language Toggle */}
        <div className="flex items-center gap-1.5 bg-gray-100 p-1.5 rounded-2xl shrink-0 self-start sm:self-auto border border-gray-200">
          <button
            onClick={() => {
              setLanguage('el')
              setCustomBody('')
              setSelectedTemplateId(allTemplates.find(t => t.language === 'el')?.id || 'gr-checkin')
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              language === 'el' ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <span>🇬🇷</span>
            <span>Ελληνικά</span>
          </button>
          <button
            onClick={() => {
              setLanguage('en')
              setCustomBody('')
              setSelectedTemplateId(allTemplates.find(t => t.language === 'en')?.id || 'en-checkin')
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              language === 'en' ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <span>🇺🇸</span>
            <span>English</span>
          </button>
        </div>
      </div>

      {/* Main Tab Switcher */}
      <div className="flex items-center gap-2 p-1.5 bg-gray-100/90 rounded-2xl border border-gray-200/80 max-w-md">
        <button
          type="button"
          onClick={() => setActiveMainTab('dispatch')}
          className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center gap-2 ${
            activeMainTab === 'dispatch'
              ? 'bg-white text-blue-700 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <MessageSquare size={15} />
          <span>💬 Άμεση Αποστολή</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveMainTab('scheduled')}
          className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center gap-2 ${
            activeMainTab === 'scheduled'
              ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Clock size={15} className={activeMainTab === 'scheduled' ? 'text-amber-300' : 'text-amber-500'} />
          <span>⚡ Αυτοματοποιημένα</span>
        </button>
      </div>

      {/* Scheduled Automation Rules View */}
      {activeMainTab === 'scheduled' ? (
        <ScheduledRulesPanel userEmail={userEmail} bookings={bookings} properties={properties} />
      ) : (
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

          {/* Template Stage Selector with Custom Templates & Pro Gating */}
          <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-gray-900 uppercase tracking-wider block">
                Στάδιο Επικοινωνίας (Templates)
              </label>

              {/* Add Custom Template Button (Pro) */}
              <button
                type="button"
                onClick={openNewTemplate}
                className="text-xs font-bold text-purple-700 hover:text-purple-900 bg-purple-50 hover:bg-purple-100 border border-purple-200 px-2.5 py-1 rounded-xl transition-all flex items-center gap-1 shadow-2xs"
                title={isPro ? 'Προσθήκη δικού σας προτύπου' : 'Pro λειτουργία'}
              >
                {!isPro && <Lock size={11} className="text-purple-600" />}
                <Plus size={12} />
                <span>Νέο Πρότυπο</span>
              </button>
            </div>

            <div className="space-y-1.5">
              {availableTemplates.map(tmpl => {
                const isSelected = selectedTemplateId === tmpl.id
                const isCustom = tmpl.id.startsWith('custom-')

                return (
                  <div key={tmpl.id} className="relative group flex items-center">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedTemplateId(tmpl.id)
                        setCustomBody('')
                      }}
                      className={`w-full text-left px-4 py-3 rounded-2xl text-xs font-bold transition-all flex items-center justify-between pr-14 ${
                        isSelected
                          ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                          : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <span className="text-base shrink-0">{tmpl.icon}</span>
                        <span className="truncate">{tmpl.title}</span>
                      </div>
                      <ChevronRight size={14} className={isSelected ? 'text-white' : 'text-gray-400'} />
                    </button>

                    {/* Action buttons (Edit & Delete for custom, Edit for default if Pro) */}
                    <div className="absolute right-2 flex items-center gap-1 z-2">
                      <button
                        type="button"
                        onClick={() => openEditTemplate(tmpl)}
                        className={`p-1.5 rounded-lg transition-colors ${
                          isSelected ? 'text-white/80 hover:text-white hover:bg-white/20' : 'text-gray-400 hover:text-gray-700 hover:bg-gray-200'
                        }`}
                        title={isPro ? 'Επεξεργασία προτύπου' : 'Απαιτείται Pro'}
                      >
                        <Edit3 size={12} />
                      </button>

                      {isCustom && (
                        <button
                          type="button"
                          onClick={() => deleteCustomTemplate(tmpl.id)}
                          className={`p-1.5 rounded-lg transition-colors ${
                            isSelected ? 'text-white/80 hover:text-red-200 hover:bg-white/20' : 'text-gray-400 hover:text-red-600 hover:bg-gray-200'
                          }`}
                          title="Διαγραφή προτύπου"
                        >
                          <Trash2 size={12} />
                        </button>
                      )}
                    </div>
                  </div>
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
                  <div className="flex items-center gap-2">
                    <h3 className="font-extrabold text-gray-900 text-base">{activeTemplate.title}</h3>
                    {isPro && (
                      <button
                        onClick={() => openEditTemplate(activeTemplate)}
                        className="text-xs text-blue-600 hover:text-blue-800 font-bold hover:underline inline-flex items-center gap-0.5"
                      >
                        <Edit3 size={11} />
                        <span>Επεξεργασία</span>
                      </button>
                    )}
                  </div>
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
      )}

      {/* Pro Upgrade Modal */}
      <ProFeatureModal
        isOpen={showProModal}
        onClose={() => setShowProModal(false)}
        featureTitle="Δημιουργία Προσαρμοσμένων Προτύπων (Pro)"
        featureDescription="Αναβαθμίστε στο πακέτο Pro για να δημιουργήσετε απεριόριστα δικά σας πρότυπα μηνυμάτων, αυτοματισμούς καθαριστριών και multi-calendar!"
      />

      {/* Custom Template Editor Modal (Pro Member Only) */}
      {showTemplateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-lg w-full space-y-4 shadow-2xl animate-in zoom-in-95 duration-150 border border-gray-100 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{templateForm.icon}</span>
                <div>
                  <h3 className="font-extrabold text-gray-900 text-base">
                    {templateForm.id ? 'Επεξεργασία Προτύπου Μηνύματος' : 'Δημιουργία Νέου Προτύπου'}
                  </h3>
                  <p className="text-xs text-gray-500">Προσαρμόστε τίτλο, κείμενο και μεταβλητές</p>
                </div>
              </div>
              <button onClick={() => setShowTemplateModal(false)} className="text-gray-400 hover:text-gray-600 font-bold">
                ✕
              </button>
            </div>

            <form onSubmit={saveCustomTemplate} className="space-y-4 text-xs">
              <div className="grid grid-cols-4 gap-3">
                <div className="col-span-3">
                  <label className="font-bold text-gray-700 block mb-1">Τίτλος Προτύπου</label>
                  <input
                    value={templateForm.title}
                    onChange={e => setTemplateForm(f => ({ ...f, title: e.target.value }))}
                    placeholder="π.χ. Οδηγίες Στάθμευσης & Parking"
                    className="w-full border border-gray-300 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500 font-medium"
                    required
                  />
                </div>
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Εικονίδιο</label>
                  <input
                    value={templateForm.icon}
                    onChange={e => setTemplateForm(f => ({ ...f, icon: e.target.value }))}
                    placeholder="🚗"
                    className="w-full border border-gray-300 rounded-xl px-3 py-2 text-center text-base focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">Θέμα Email (Προαιρετικό)</label>
                <input
                  value={templateForm.subject}
                  onChange={e => setTemplateForm(f => ({ ...f, subject: e.target.value }))}
                  placeholder="π.χ. Σημαντικές Πληροφορίες — {{property_name}}"
                  className="w-full border border-gray-300 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Smart Variable Insertion Chips */}
              <div>
                <label className="font-bold text-gray-600 uppercase text-[10px] block mb-1.5">
                  Κάντε κλικ για εισαγωγή μεταβλητής:
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { label: 'Όνομα Επισκέπτη', tag: '{{guest_name}}' },
                    { label: 'Όνομα Ακινήτου', tag: '{{property_name}}' },
                    { label: 'Check-in', tag: '{{check_in}}' },
                    { label: 'Check-out', tag: '{{check_out}}' },
                    { label: 'Ώρα Check-in', tag: '{{check_in_time}}' },
                    { label: 'Ώρα Check-out', tag: '{{check_out_time}}' },
                    { label: 'Wi-Fi Name', tag: '{{wifi_name}}' },
                    { label: 'Wi-Fi Pass', tag: '{{wifi_password}}' },
                    { label: 'Lockbox PIN', tag: '{{lockbox_code}}' },
                    { label: 'Οδηγίες', tag: '{{directions}}' },
                  ].map(v => (
                    <button
                      key={v.tag}
                      type="button"
                      onClick={() => insertVariable(v.tag)}
                      className="bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-lg text-[10px] font-semibold transition-colors"
                    >
                      + {v.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">Κείμενο Μηνύματος (Template Body)</label>
                <textarea
                  rows={8}
                  value={templateForm.body}
                  onChange={e => setTemplateForm(f => ({ ...f, body: e.target.value }))}
                  placeholder="Γράψτε το μήνυμά σας χρησιμοποιώντας τις παραπάνω μεταβλητές..."
                  className="w-full border border-gray-300 rounded-xl p-3 text-xs leading-relaxed focus:ring-2 focus:ring-blue-500 font-sans"
                  required
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowTemplateModal(false)}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2.5 rounded-xl font-bold transition-colors"
                >
                  Ακύρωση
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl font-bold transition-colors shadow-sm"
                >
                  Αποθήκευση Προτύπου
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
