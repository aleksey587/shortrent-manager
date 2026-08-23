'use client'

import { useState, useEffect } from 'react'
import {
  Clock, Sparkles, Check, Plus, Trash2, Edit3, Lock, Zap,
  AlertCircle, ChevronDown, ChevronUp, Bell, Calendar, Send, ShieldCheck,
  RotateCcw, Copy, Info, Smile
} from 'lucide-react'
import { isProUser } from '@/lib/permissions'
import ProFeatureModal from '@/components/ui/ProFeatureModal'

export interface AutomationRule {
  id: string
  title: string
  enabled: boolean
  triggerType: 'instant_booking' | 'before_checkin' | 'checkin_day' | 'mid_stay' | 'before_checkout' | 'after_checkout'
  offsetDays: number // e.g. 1 = 1 day before, 2 = 2 days before
  offsetHours?: number
  sendTime: string // '10:00', '12:00', '14:00', '18:00'
  channel: 'all' | 'airbnb' | 'booking' | 'whatsapp'
  icon: string
  subject: string
  body: string
}

const DEFAULT_RULES: AutomationRule[] = [
  {
    id: 'rule-booking-confirm',
    title: 'Άμεση Επιβεβαίωση Κράτησης',
    enabled: true,
    triggerType: 'instant_booking',
    offsetDays: 0,
    sendTime: 'Άμεσα',
    channel: 'all',
    icon: '⚡',
    subject: 'Επιβεβαίωση Κράτησης: {{property_name}}',
    body: 'Γεια σας {{guest_name}}! Σας ευχαριστούμε πολύ για την κράτησή σας στο {{property_name}} για τις {{check_in}} έως {{check_out}}. Είμαστε στη διάθεσή σας για ό,τι χρειαστείτε!',
  },
  {
    id: 'rule-before-checkin',
    title: 'Οδηγίες Άφιξης & Lockbox (1 ημέρα πριν)',
    enabled: true,
    triggerType: 'before_checkin',
    offsetDays: 1,
    sendTime: '12:00',
    channel: 'all',
    icon: '🔑',
    subject: 'Οδηγίες Άφιξης & Πρόσβασης: {{property_name}}',
    body: 'Ανυπομονούμε να σας υποδεχτούμε αύριο {{check_in}} στο {{property_name}}!\n\n📍 Διεύθυνση: {{address}}\n🕒 Check-in: από τις {{check_in_time}}\n🔐 Κωδικός Κλειδοθήκης (Lockbox): {{lockbox_code}}\n\nΕνημερώστε μας μόλις φτάσετε!',
  },
  {
    id: 'rule-checkin-wifi',
    title: 'Καλωσόρισμα & Κωδικός Wi-Fi (Ημέρα Άφιξης)',
    enabled: true,
    triggerType: 'checkin_day',
    offsetDays: 0,
    sendTime: '14:00',
    channel: 'all',
    icon: '📶',
    subject: 'Καλώς ήρθατε στο {{property_name}} & Στοιχεία Wi-Fi',
    body: 'Καλώς ήρθατε στο {{property_name}}! 🏠\n\n📶 Wi-Fi Δίκτυο: {{wifi_name}}\n🔑 Κωδικός Wi-Fi: {{wifi_password}}\n📱 Ψηφιακός Οδηγός Σπιτιού: {{guide_link}}\n\nΕυχόμαστε μια υπέροχη διαμονή!',
  },
  {
    id: 'rule-midstay-check',
    title: 'Έλεγχος Ικανοποίησης (Mid-Stay Check)',
    enabled: true,
    triggerType: 'mid_stay',
    offsetDays: 1,
    sendTime: '11:00',
    channel: 'all',
    icon: '☕',
    subject: 'Πώς είναι η διαμονή σας στο {{property_name}};',
    body: 'Καλημέρα {{guest_name}}! Ελπίζουμε να απολαμβάνετε τη διαμονή σας στο {{property_name}}. Ενημερώστε μας αν χρειάζεστε επιπλέον πετσέτες, προτάσεις για φαγητό ή οτιδήποτε άλλο!',
  },
  {
    id: 'rule-before-checkout',
    title: 'Οδηγίες Αναχώρησης & Κλειδιά (1 ημέρα πριν το Check-out)',
    enabled: true,
    triggerType: 'before_checkout',
    offsetDays: 1,
    sendTime: '18:00',
    channel: 'all',
    icon: '🚪',
    subject: 'Πληροφορίες Αναχώρησης (Check-out): {{property_name}}',
    body: 'Γεια σας {{guest_name}}, σας υπενθυμίζουμε ότι το check-out είναι αύριο {{check_out}} έως τις {{check_out_time}}.\n\nΠαρακαλούμε:\n1. Κλείστε το A/C και τον θερμοσίφωνα\n2. Αφήστε τα κλειδιά στην κλειδοθήκη (κωδικός {{lockbox_code}})\n\nΣας ευχαριστούμε θερμά για τη φιλοξενία!',
  },
  {
    id: 'rule-after-checkout-review',
    title: 'Ευχαριστήριο & Αίτημα Κριτικής 5 Αστέρων (Μετά την Αναχώρηση)',
    enabled: true,
    triggerType: 'after_checkout',
    offsetDays: 0,
    sendTime: '15:00',
    channel: 'all',
    icon: '⭐',
    subject: 'Ευχαριστούμε για τη διαμονή σας! ⭐⭐⭐⭐⭐',
    body: 'Σας ευχαριστούμε πολύ που επιλέξατε το {{property_name}} για τη διαμονή σας! Ελπίζουμε να περάσατε υπέροχα.\n\nΑν μείνατε ευχαριστημένοι, μια θετική κριτική 5 αστέρων στην πλατφόρμα θα μας βοηθούσε απίστευτα. Καλό ταξίδι επιστροφής!',
  },
]

const EMOJI_OPTIONS = ['💬', '🔑', '🏠', '📶', '☕', '🚪', '⭐', '🚗', '🏖️', '📍', '🎁', '⚠️', '💡', '🧹', '🏊‍♂️']

const SMART_VARIABLES = [
  { label: 'Όνομα Επισκέπτη', tag: '{{guest_name}}' },
  { label: 'Όνομα Ακινήτου', tag: '{{property_name}}' },
  { label: 'Ημερομηνία Check-in', tag: '{{check_in}}' },
  { label: 'Ημερομηνία Check-out', tag: '{{check_out}}' },
  { label: 'Ώρα Check-in', tag: '{{check_in_time}}' },
  { label: 'Ώρα Check-out', tag: '{{check_out_time}}' },
  { label: 'Όνομα Wi-Fi', tag: '{{wifi_name}}' },
  { label: 'Κωδικός Wi-Fi', tag: '{{wifi_password}}' },
  { label: 'Κλειδοθήκη / Lockbox', tag: '{{lockbox_code}}' },
  { label: 'Διεύθυνση', tag: '{{address}}' },
  { label: 'Οδηγίες', tag: '{{directions}}' },
  { label: 'Link Ψηφιακού Οδηγού', tag: '{{guide_link}}' },
]

interface Props {
  userEmail?: string | null
}

export default function ScheduledRulesPanel({ userEmail }: Props) {
  const [rules, setRules] = useState<AutomationRule[]>(DEFAULT_RULES)
  const [editingRule, setEditingRule] = useState<AutomationRule | null>(null)
  const [isNewRule, setIsNewRule] = useState(false)
  const [showProModal, setShowProModal] = useState(false)
  const [savedSuccess, setSavedSuccess] = useState<string | null>(null)

  const isPro = isProUser(userEmail)

  useEffect(() => {
    try {
      const saved = localStorage.getItem('greekhost_automated_rules')
      if (saved) {
        setRules(JSON.parse(saved))
      }
    } catch {}
  }, [])

  const saveRulesToStorage = (updated: AutomationRule[], msg: string = 'Οι κανόνες αυτοματισμού αποθηκεύτηκαν επιτυχώς!') => {
    setRules(updated)
    try {
      localStorage.setItem('greekhost_automated_rules', JSON.stringify(updated))
    } catch {}
    setSavedSuccess(msg)
    setTimeout(() => setSavedSuccess(null), 3000)
  }

  const toggleRule = (id: string) => {
    if (!isPro) {
      setShowProModal(true)
      return
    }
    const updated = rules.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r)
    saveRulesToStorage(updated, 'Η κατάσταση του κανόνα ενημερώθηκε!')
  }

  const handleCreateNewRule = () => {
    if (!isPro) {
      setShowProModal(true)
      return
    }
    setIsNewRule(true)
    setEditingRule({
      id: `custom-rule-${Date.now()}`,
      title: 'Νέος Αυτοματοποιημένος Κανόνας',
      enabled: true,
      triggerType: 'before_checkin',
      offsetDays: 1,
      sendTime: '12:00',
      channel: 'all',
      icon: '💬',
      subject: 'Ενημέρωση για το {{property_name}}',
      body: 'Γεια σας {{guest_name}}!\n\nΣας στέλνουμε χρήσιμες πληροφορίες για τη διαμονή σας στο {{property_name}}.\n\nWi-Fi: {{wifi_name}}\nΚωδικός: {{wifi_password}}\nLockbox: {{lockbox_code}}\n\nΕίμαστε στη διάθεσή σας!',
    })
  }

  const handleEditClick = (rule: AutomationRule) => {
    if (!isPro) {
      setShowProModal(true)
      return
    }
    setIsNewRule(false)
    setEditingRule(JSON.parse(JSON.stringify(rule)))
  }

  const handleDeleteRule = (id: string, title: string) => {
    if (!isPro) {
      setShowProModal(true)
      return
    }
    if (!confirm(`Είστε σίγουροι ότι θέλετε να διαγράψετε τον κανόνα «${title}»;`)) return
    const updated = rules.filter(r => r.id !== id)
    saveRulesToStorage(updated, 'Ο κανόνας διαγράφηκε επιτυχώς!')
  }

  const handleResetDefaults = () => {
    if (!confirm('Επαναφορά όλων των κανόνων στις αρχικές προεπιλογές του GreekHost;')) return
    saveRulesToStorage(DEFAULT_RULES, 'Έγινε επαναφορά στις αρχικές προεπιλογές!')
  }

  const handleSaveEditedRule = (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingRule) return

    let updated: AutomationRule[]
    if (isNewRule) {
      updated = [...rules, editingRule]
    } else {
      updated = rules.map(r => r.id === editingRule.id ? editingRule : r)
    }
    saveRulesToStorage(updated, isNewRule ? 'Ο νέος κανόνας προστέθηκε επιτυχώς!' : 'Ο κανόνας ενημερώθηκε επιτυχώς!')
    setEditingRule(null)
    setIsNewRule(false)
  }

  const insertVariableToBody = (tag: string) => {
    if (!editingRule) return
    setEditingRule({
      ...editingRule,
      body: editingRule.body + (editingRule.body.endsWith(' ') ? '' : ' ') + tag,
    })
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-purple-950 rounded-3xl p-6 sm:p-7 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-1 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-xl">
            <div className="inline-flex items-center gap-1.5 bg-blue-500/20 border border-blue-400/30 text-blue-200 px-2.5 py-0.5 rounded-full text-xs font-bold">
              <Zap size={12} className="text-amber-400" />
              <span>Airbnb-Style Auto Scheduled Messages</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight">
              Προσαρμοσμένα Αυτοματοποιημένα Μηνύματα
            </h2>
            <p className="text-xs sm:text-sm text-blue-100/80 leading-relaxed">
              Δημιουργήστε, επεξεργαστείτε και ρυθμίστε τους δικούς σας κανόνες ώστε τα μηνύματα να φεύγουν <strong>αυτόματα την ημέρα και ώρα που θέλετε</strong> σε κάθε επισκέπτη!
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <button
              type="button"
              onClick={handleCreateNewRule}
              className="flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-extrabold px-4 py-3 rounded-2xl text-xs shadow-lg shadow-emerald-500/20 transition-all active:scale-95"
            >
              <Plus size={16} />
              <span>+ Νέος Κανόνας</span>
            </button>

            <button
              type="button"
              onClick={handleResetDefaults}
              className="flex items-center justify-center gap-1.5 bg-white/10 hover:bg-white/20 text-white border border-white/20 px-3 py-3 rounded-2xl text-xs font-semibold transition-colors"
              title="Επαναφορά στις αρχικές προεπιλογές"
            >
              <RotateCcw size={14} />
              <span className="hidden sm:inline">Επαναφορά</span>
            </button>
          </div>
        </div>
      </div>

      {savedSuccess && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 p-3.5 rounded-2xl text-xs font-bold animate-in fade-in duration-200 flex items-center gap-2 shadow-2xs">
          <Check size={16} className="text-emerald-600 stroke-[3]" />
          <span>{savedSuccess}</span>
        </div>
      )}

      {/* Rules List */}
      <div className="grid grid-cols-1 gap-3.5">
        {rules.map((rule, idx) => (
          <div
            key={rule.id}
            className={`bg-white rounded-3xl p-5 sm:p-6 border transition-all shadow-sm hover:shadow-md ${
              rule.enabled ? 'border-indigo-100 bg-white' : 'border-gray-200/80 bg-gray-50/70 opacity-75'
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              {/* Left Title & Trigger Info */}
              <div className="flex items-start gap-3.5">
                <div className="w-11 h-11 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-xl shrink-0 shadow-2xs">
                  {rule.icon}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-extrabold text-gray-900 text-sm sm:text-base">{rule.title}</h3>
                    <span className="inline-flex items-center gap-1 bg-amber-50 border border-amber-200 text-amber-900 text-[10px] font-extrabold px-2 py-0.5 rounded-md">
                      <Clock size={11} className="text-amber-600" />
                      <span>{rule.sendTime === 'Άμεσα' ? 'Άμεση Αποστολή' : `Ώρα: ${rule.sendTime}`}</span>
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-gray-500 mt-1 flex-wrap">
                    <span className="bg-blue-50 text-blue-800 border border-blue-100 px-2 py-0.5 rounded-md font-semibold text-[11px]">
                      {rule.triggerType === 'instant_booking' && '⚡ Κατά την ολοκλήρωση κράτησης'}
                      {rule.triggerType === 'before_checkin' && `📅 ${rule.offsetDays === 0 ? 'Την ημέρα του' : `${rule.offsetDays} μέρα πριν το`} Check-in`}
                      {rule.triggerType === 'checkin_day' && '📅 Την ημέρα του Check-in'}
                      {rule.triggerType === 'mid_stay' && `☕ ${rule.offsetDays} ημέρα μετά την άφιξη`}
                      {rule.triggerType === 'before_checkout' && `🚪 ${rule.offsetDays === 0 ? 'Την ημέρα του' : `${rule.offsetDays} μέρα πριν το`} Check-out`}
                      {rule.triggerType === 'after_checkout' && '⭐ Μετά το Check-out'}
                    </span>
                    <span>•</span>
                    <span className="text-[11px] text-indigo-700 font-bold">
                      Κανάλια: Airbnb Chat, Booking.com, WhatsApp
                    </span>
                  </div>
                </div>
              </div>

              {/* Right Controls: Toggle, Edit, Delete */}
              <div className="flex items-center gap-2 self-end sm:self-auto shrink-0 pt-2 sm:pt-0">
                <button
                  type="button"
                  onClick={() => handleEditClick(rule)}
                  className="flex items-center gap-1 text-xs font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 px-3 py-2 rounded-xl transition-colors"
                  title="Επεξεργασία κειμένου & ώρας"
                >
                  <Edit3 size={13} />
                  <span>Επεξεργασία</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleDeleteRule(rule.id, rule.title)}
                  className="text-gray-400 hover:text-red-600 p-2 rounded-xl hover:bg-red-50 transition-colors"
                  title="Διαγραφή κανόνα"
                >
                  <Trash2 size={15} />
                </button>

                {/* ON/OFF Switch */}
                <button
                  type="button"
                  onClick={() => toggleRule(rule.id)}
                  className={`relative inline-flex h-7 w-13 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ml-1 ${
                    rule.enabled ? 'bg-emerald-600' : 'bg-gray-300'
                  }`}
                  title={rule.enabled ? 'Ενεργό' : 'Ανενεργό'}
                >
                  <span
                    className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                      rule.enabled ? 'translate-x-6' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Message Preview Snippet */}
            <div className="mt-3.5 pt-3 border-t border-gray-100">
              <p className="text-xs text-gray-700 font-mono bg-gray-50/90 p-3.5 rounded-2xl border border-gray-200/70 leading-relaxed whitespace-pre-line">
                {rule.body}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Edit / Create Rule Modal */}
      {editingRule && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4"
          onClick={() => setEditingRule(null)}
        >
          <div
            className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-7 space-y-5 shadow-2xl animate-in zoom-in-95 duration-150 border border-gray-100 max-h-[92vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2.5">
                <span className="text-2xl">{editingRule.icon}</span>
                <div>
                  <h3 className="font-extrabold text-gray-900 text-lg">
                    {isNewRule ? 'Δημιουργία Νέου Κανόνα Αυτοματισμού' : 'Επεξεργασία Κανόνα'}
                  </h3>
                  <p className="text-xs text-gray-400">Προσαρμόστε τις συνθήκες αποστολής και το κείμενο</p>
                </div>
              </div>
              <button
                onClick={() => setEditingRule(null)}
                className="text-gray-400 hover:text-gray-600 p-1.5 rounded-full hover:bg-gray-100 transition-colors"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEditedRule} className="space-y-4 text-xs">
              {/* Title & Emoji Selector */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div className="sm:col-span-3">
                  <label className="font-bold text-gray-700 block mb-1">Τίτλος Κανόνα *</label>
                  <input
                    required
                    value={editingRule.title}
                    onChange={e => setEditingRule({ ...editingRule, title: e.target.value })}
                    placeholder="π.χ. Οδηγίες Στάθμευσης & Άφιξης"
                    className="w-full border border-gray-300 rounded-xl px-3.5 py-2 text-xs focus:ring-2 focus:ring-blue-500 font-medium"
                  />
                </div>
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Εικονίδιο</label>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xl p-1 bg-gray-100 rounded-lg">{editingRule.icon}</span>
                    <select
                      value={editingRule.icon}
                      onChange={e => setEditingRule({ ...editingRule, icon: e.target.value })}
                      className="w-full border border-gray-300 rounded-xl px-2 py-2 text-xs"
                    >
                      {EMOJI_OPTIONS.map(em => (
                        <option key={em} value={em}>{em}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Timing Controls (Event, Days, Time of Day) */}
              <div className="bg-gray-50 border border-gray-200/80 rounded-2xl p-3.5 space-y-3">
                <span className="font-extrabold text-gray-900 block text-xs">
                  ⏰ Συνθήκη & Χρόνος Αποστολής:
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {/* Trigger Event */}
                  <div>
                    <label className="font-semibold text-gray-600 block mb-1 text-[11px]">Γεγονός</label>
                    <select
                      value={editingRule.triggerType}
                      onChange={e => setEditingRule({ ...editingRule, triggerType: e.target.value as any })}
                      className="w-full border border-gray-300 rounded-xl px-2.5 py-2 text-xs bg-white focus:ring-2 focus:ring-blue-500 font-medium"
                    >
                      <option value="instant_booking">⚡ Κατά την κράτηση</option>
                      <option value="before_checkin">🔑 Πριν το Check-in</option>
                      <option value="checkin_day">🏠 Ημέρα Check-in</option>
                      <option value="mid_stay">☕ Κατά τη διαμονή</option>
                      <option value="before_checkout">🚪 Πριν το Check-out</option>
                      <option value="after_checkout">⭐ Μετά το Check-out</option>
                    </select>
                  </div>

                  {/* Offset Days */}
                  <div>
                    <label className="font-semibold text-gray-600 block mb-1 text-[11px]">Ημέρες Διαφοράς</label>
                    <select
                      value={editingRule.offsetDays}
                      onChange={e => setEditingRule({ ...editingRule, offsetDays: Number(e.target.value) })}
                      className="w-full border border-gray-300 rounded-xl px-2.5 py-2 text-xs bg-white focus:ring-2 focus:ring-blue-500"
                    >
                      <option value={0}>0 (Την ίδια ημέρα)</option>
                      <option value={1}>1 ημέρα πριν / μετά</option>
                      <option value={2}>2 ημέρες πριν</option>
                      <option value={3}>3 ημέρες πριν</option>
                      <option value={5}>5 ημέρες πριν</option>
                      <option value={7}>7 ημέρες (1 εβδομάδα)</option>
                    </select>
                  </div>

                  {/* Send Time */}
                  <div>
                    <label className="font-semibold text-gray-600 block mb-1 text-[11px]">Ώρα Αποστολής</label>
                    <select
                      value={editingRule.sendTime}
                      onChange={e => setEditingRule({ ...editingRule, sendTime: e.target.value })}
                      className="w-full border border-gray-300 rounded-xl px-2.5 py-2 text-xs bg-white focus:ring-2 focus:ring-blue-500 font-bold text-blue-700"
                    >
                      <option value="Άμεσα">⚡ Άμεσα (Instant)</option>
                      <option value="08:00">08:00 π.μ. (Πρωί)</option>
                      <option value="09:00">09:00 π.μ.</option>
                      <option value="10:00">10:00 π.μ.</option>
                      <option value="11:00">11:00 π.μ.</option>
                      <option value="12:00">12:00 μ.μ. (Μεσημέρι)</option>
                      <option value="13:00">13:00 μ.μ.</option>
                      <option value="14:00">14:00 μ.μ. (Check-in time)</option>
                      <option value="15:00">15:00 μ.μ.</option>
                      <option value="16:00">16:00 μ.μ.</option>
                      <option value="18:00">18:00 μ.μ. (Απόγευμα)</option>
                      <option value="20:00">20:00 μ.μ. (Βράδυ)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Clickable Smart Variable Chips */}
              <div>
                <label className="font-bold text-gray-700 uppercase text-[10px] block mb-1.5 flex items-center justify-between">
                  <span>Κάντε κλικ για εισαγωγή μεταβλητής:</span>
                  <span className="text-teal-600 font-bold normal-case">✨ Αυτόματη Συμπλήρωση</span>
                </label>
                <div className="flex flex-wrap gap-1.5 p-2 bg-gray-50 border border-gray-200/80 rounded-2xl">
                  {SMART_VARIABLES.map(v => (
                    <button
                      key={v.tag}
                      type="button"
                      onClick={() => insertVariableToBody(v.tag)}
                      className="bg-white hover:bg-blue-50 text-blue-700 hover:text-blue-900 border border-gray-200 hover:border-blue-300 px-2.5 py-1 rounded-xl text-[11px] font-semibold transition-all shadow-2xs active:scale-95"
                    >
                      + {v.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Rule Body Textarea */}
              <div>
                <label className="font-bold text-gray-700 block mb-1">Κείμενο Μηνύματος (Template Body) *</label>
                <textarea
                  rows={8}
                  required
                  value={editingRule.body}
                  onChange={e => setEditingRule({ ...editingRule, body: e.target.value })}
                  placeholder="Γράψτε το μήνυμά σας χρησιμοποιώντας τις παραπάνω μεταβλητές..."
                  className="w-full border border-gray-300 rounded-2xl p-4 text-xs font-mono focus:ring-2 focus:ring-blue-500 leading-relaxed"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setEditingRule(null)}
                  className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  Ακύρωση
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md transition-colors"
                >
                  {isNewRule ? 'Δημιουργία Κανόνα' : 'Αποθήκευση Κανόνα'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Pro Upgrade Modal */}
      <ProFeatureModal
        isOpen={showProModal}
        onClose={() => setShowProModal(false)}
        featureTitle="Αυτοματοποιημένα Προγραμματισμένα Μηνύματα (Pro)"
        featureDescription="Αναβαθμίστε στο πακέτο Pro για να δημιουργήσετε απεριόριστους δικούς σας αυτοματοποιημένους κανόνες μηνυμάτων σε συγκεκριμένες ώρες και μέρες!"
      />
    </div>
  )
}
