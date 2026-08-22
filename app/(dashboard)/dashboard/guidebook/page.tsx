'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  Sparkles, Wifi, Key, MapPin, Copy, Check, ExternalLink, Edit3, Save,
  Home, Coffee, Utensils, Share2, Eye, Shield, Smartphone
} from 'lucide-react'
import Link from 'next/link'

interface Property {
  id: string
  name: string
  address: string | null
  color: string
  description?: string | null
  wifi_name?: string | null
  wifi_password?: string | null
  lockbox_code?: string | null
  check_in_time?: string | null
  check_out_time?: string | null
  directions?: string | null
  house_rules?: string | null
}

export default function GuidebookManagerPage() {
  const supabase = createClient()
  const [properties, setProperties] = useState<Property[]>([])
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [copiedLink, setCopiedLink] = useState(false)
  const [saving, setSaving] = useState(false)
  const [savedSuccess, setSavedSuccess] = useState(false)

  const [form, setForm] = useState({
    wifi_name: '',
    wifi_password: '',
    lockbox_code: '',
    check_in_time: '15:00',
    check_out_time: '11:00',
    directions: '',
    house_rules: '',
  })

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    setLoading(true)
    const { data } = await supabase
      .from('properties')
      .select('*')
      .order('created_at')

    const props = data ?? []
    setProperties(props)
    if (props.length > 0) {
      setSelectedPropertyId(props[0].id)
      loadForm(props[0])
    }
    setLoading(false)
  }

  function loadForm(prop: Property) {
    setForm({
      wifi_name: prop.wifi_name || '',
      wifi_password: prop.wifi_password || '',
      lockbox_code: prop.lockbox_code || '',
      check_in_time: prop.check_in_time || '15:00',
      check_out_time: prop.check_out_time || '11:00',
      directions: prop.directions || '',
      house_rules: prop.house_rules || '',
    })
  }

  const activeProperty = properties.find(p => p.id === selectedPropertyId) || properties[0]

  const handlePropertyChange = (propId: string) => {
    setSelectedPropertyId(propId)
    const prop = properties.find(p => p.id === propId)
    if (prop) loadForm(prop)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!activeProperty) return
    setSaving(true)
    setSavedSuccess(false)

    const { error } = await supabase
      .from('properties')
      .update({
        wifi_name: form.wifi_name || null,
        wifi_password: form.wifi_password || null,
        lockbox_code: form.lockbox_code || null,
        check_in_time: form.check_in_time || '15:00',
        check_out_time: form.check_out_time || '11:00',
        directions: form.directions || null,
        house_rules: form.house_rules || null,
      })
      .eq('id', activeProperty.id)

    setSaving(false)
    if (!error) {
      setProperties(prev => prev.map(p => p.id === activeProperty.id ? { ...p, ...form } : p))
      setSavedSuccess(true)
      setTimeout(() => setSavedSuccess(false), 2500)
    } else {
      alert('⚠️ Σημείωση: Αν οι στήλες Wi-Fi δεν έχουν δημιουργηθεί στη βάση, εκτελέστε το Migration 006 στο Supabase SQL Editor.')
    }
  }

  const guideUrl = typeof window !== 'undefined' && activeProperty
    ? `${window.location.origin}/guide/${activeProperty.id}`
    : `/guide/${activeProperty?.id || ''}`

  const copyGuideLink = () => {
    navigator.clipboard.writeText(guideUrl)
    setCopiedLink(true)
    setTimeout(() => setCopiedLink(false), 2000)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-gray-500 text-sm">Φόρτωση οδηγού επισκέπτη...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 bg-blue-50 border border-blue-200 text-blue-700 px-3 py-1 rounded-full text-xs font-semibold mb-1">
            <Smartphone size={14} className="text-blue-600" />
            <span>Digital Guest Experience & Guidebook</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
            Ψηφιακός Οδηγός Επισκέπτη (Guidebook)
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Ένα πανέμορφο web app link για το κινητό του επισκέπτη με κωδικούς Wi-Fi, Lockbox, οδηγίες συσκευών και τοπικές προτάσεις.
          </p>
        </div>
      </div>

      {/* Property Selector & Share Bar */}
      <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Selector */}
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-gray-500 uppercase tracking-wider shrink-0">Ακίνητο:</span>
          <select
            value={selectedPropertyId}
            onChange={e => handlePropertyChange(e.target.value)}
            className="border border-gray-300 rounded-2xl px-4 py-2 text-sm font-bold text-gray-900 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {properties.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>

        {/* Share & Preview Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={copyGuideLink}
            className="flex items-center gap-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold px-3.5 py-2 rounded-xl text-xs transition-colors shadow-2xs"
          >
            {copiedLink ? <Check size={14} className="text-emerald-600 stroke-[3]" /> : <Copy size={14} />}
            <span>{copiedLink ? 'Αντιγράφηκε!' : '🔗 Αντιγραφή Link Οδηγού'}</span>
          </button>

          {activeProperty && (
            <Link
              href={`/guide/${activeProperty.id}`}
              target="_blank"
              className="flex items-center gap-1.5 bg-gray-900 hover:bg-black text-white font-bold px-3.5 py-2 rounded-xl text-xs transition-colors shadow-sm"
            >
              <ExternalLink size={13} />
              <span>Προβολή Οδηγού</span>
            </Link>
          )}
        </div>
      </div>

      {/* Editor Form */}
      <form onSubmit={handleSave} className="space-y-6">
        {/* Section 1: Wi-Fi & Entry */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 space-y-4">
          <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
            <Wifi size={18} className="text-teal-600" />
            <h3 className="font-extrabold text-gray-900 text-base">Σύνδεση Wi-Fi & Check-in</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1">Όνομα Δικτύου Wi-Fi (SSID)</label>
              <input
                value={form.wifi_name}
                onChange={e => setForm(f => ({ ...f, wifi_name: e.target.value }))}
                placeholder="π.χ. Callisto_Guest"
                className="w-full border border-gray-300 rounded-xl px-3.5 py-2.5 text-xs text-gray-900 focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1">Κωδικός Wi-Fi</label>
              <input
                value={form.wifi_password}
                onChange={e => setForm(f => ({ ...f, wifi_password: e.target.value }))}
                placeholder="π.χ. Athens2026!"
                className="w-full border border-gray-300 rounded-xl px-3.5 py-2.5 text-xs text-gray-900 focus:ring-2 focus:ring-blue-500 font-mono font-bold"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1">Κωδικός Κλειδοθήκης (Lockbox)</label>
              <input
                value={form.lockbox_code}
                onChange={e => setForm(f => ({ ...f, lockbox_code: e.target.value }))}
                placeholder="π.χ. 4821"
                className="w-full border border-gray-300 rounded-xl px-3.5 py-2.5 text-xs text-indigo-700 focus:ring-2 focus:ring-blue-500 font-mono font-extrabold"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1">Ώρα Check-in</label>
              <input
                value={form.check_in_time}
                onChange={e => setForm(f => ({ ...f, check_in_time: e.target.value }))}
                placeholder="15:00"
                className="w-full border border-gray-300 rounded-xl px-3.5 py-2.5 text-xs text-gray-900 focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1">Ώρα Check-out</label>
              <input
                value={form.check_out_time}
                onChange={e => setForm(f => ({ ...f, check_out_time: e.target.value }))}
                placeholder="11:00"
                className="w-full border border-gray-300 rounded-xl px-3.5 py-2.5 text-xs text-gray-900 focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-gray-700 block mb-1">Οδηγίες Πρόσβασης & Εισόδου</label>
            <textarea
              rows={2}
              value={form.directions}
              onChange={e => setForm(f => ({ ...f, directions: e.target.value }))}
              placeholder="π.χ. Η κλειδοθήκη βρίσκεται στον 2ο όροφο, δεξιά από την πόρτα του διαμερίσματος."
              className="w-full border border-gray-300 rounded-xl p-3 text-xs text-gray-900 focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Section 2: House Rules & Appliances */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 space-y-4">
          <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
            <Home size={18} className="text-blue-600" />
            <h3 className="font-extrabold text-gray-900 text-base">Κανόνες Σπιτιού & Συσκευές</h3>
          </div>

          <div>
            <label className="text-xs font-bold text-gray-700 block mb-1">Επιπλέον Κανόνες & Οδηγίες</label>
            <textarea
              rows={3}
              value={form.house_rules}
              onChange={e => setForm(f => ({ ...f, house_rules: e.target.value }))}
              placeholder="π.χ. Ώρες κοινής ησυχίας: 15:00 - 17:30 & 23:00 - 07:00. Απαγορεύεται το κάπνισμα στους εσωτερικούς χώρους."
              className="w-full border border-gray-300 rounded-xl p-3 text-xs text-gray-900 focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Submit Bar */}
        <div className="flex items-center justify-between pt-2">
          {savedSuccess && (
            <span className="text-xs font-bold text-emerald-600 flex items-center gap-1.5">
              <Check size={16} className="stroke-[3]" />
              <span>Οι ρυθμίσεις του οδηγού αποθηκεύτηκαν επιτυχώς!</span>
            </span>
          )}
          {!savedSuccess && <div />}

          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-2xl text-xs transition-colors shadow-md shadow-blue-600/20 disabled:opacity-50"
          >
            <Save size={15} />
            <span>{saving ? 'Αποθήκευση...' : 'Αποθήκευση Οδηγού'}</span>
          </button>
        </div>
      </form>
    </div>
  )
}
