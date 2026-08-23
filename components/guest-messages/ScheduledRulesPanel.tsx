'use client'

import { useState, useEffect } from 'react'
import {
  Clock, Sparkles, Check, Plus, Trash2, Edit3, Lock, Zap,
  AlertCircle, ChevronDown, ChevronUp, Bell, Calendar, Send, ShieldCheck
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

interface Props {
  userEmail?: string | null
}

export default function ScheduledRulesPanel({ userEmail }: Props) {
  const [rules, setRules] = useState<AutomationRule[]>(DEFAULT_RULES)
  const [editingRule, setEditingRule] = useState<AutomationRule | null>(null)
  const [showProModal, setShowProModal] = useState(false)
  const [savedSuccess, setSavedSuccess] = useState(false)

  const isPro = isProUser(userEmail)

  useEffect(() => {
    try {
      const saved = localStorage.getItem('greekhost_automated_rules')
      if (saved) {
        setRules(JSON.parse(saved))
      }
    } catch {}
  }, [])

  const saveRulesToStorage = (updated: AutomationRule[]) => {
    setRules(updated)
    try {
      localStorage.setItem('greekhost_automated_rules', JSON.stringify(updated))
    } catch {}
    setSavedSuccess(true)
    setTimeout(() => setSavedSuccess(false), 2500)
  }

  const toggleRule = (id: string) => {
    if (!isPro) {
      setShowProModal(true)
      return
    }
    const updated = rules.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r)
    saveRulesToStorage(updated)
  }

  const handleEditClick = (rule: AutomationRule) => {
    if (!isPro) {
      setShowProModal(true)
      return
    }
    setEditingRule(rule)
  }

  const handleSaveEditedRule = (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingRule) return

    const updated = rules.map(r => r.id === editingRule.id ? editingRule : r)
    saveRulesToStorage(updated)
    setEditingRule(null)
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
              Αυτοματοποιημένα Μηνύματα σε Συγκεκριμένες Ώρες
            </h2>
            <p className="text-xs sm:text-sm text-blue-100/80 leading-relaxed">
              Ρυθμίστε κανόνες ώστε τα μηνύματα (Check-in, Wi-Fi, Lockbox, Check-out, Κριτικές) να φεύγουν <strong>αυτόματα την κατάλληλη μέρα και ώρα</strong> σε κάθε επισκέπτη!
            </p>
          </div>

          <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 px-4 py-3 rounded-2xl shrink-0 self-start sm:self-auto">
            <div className="w-3 h-3 rounded-full bg-emerald-400 animate-ping" />
            <div>
              <span className="text-xs font-extrabold text-white block">Auto-Scheduler</span>
              <span className="text-[10px] text-emerald-300 font-bold">
                {rules.filter(r => r.enabled).length} / {rules.length} Κανόνες Ενεργοί
              </span>
            </div>
          </div>
        </div>
      </div>

      {savedSuccess && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 p-3 rounded-2xl text-xs font-bold animate-in fade-in duration-200 flex items-center gap-2">
          <Check size={16} className="text-emerald-600 stroke-[3]" />
          <span>Οι κανόνες αυτοματισμού αποθηκεύτηκαν επιτυχώς!</span>
        </div>
      )}

      {/* Rules List */}
      <div className="grid grid-cols-1 gap-3.5">
        {rules.map(rule => (
          <div
            key={rule.id}
            className={`bg-white rounded-3xl p-5 sm:p-6 border transition-all shadow-sm hover:shadow-md ${
              rule.enabled ? 'border-indigo-100 bg-white' : 'border-gray-200/80 bg-gray-50/70 opacity-75'
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              {/* Left Title & Trigger Info */}
              <div className="flex items-start gap-3.5">
                <div className="w-11 h-11 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-xl shrink-0">
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
                    <span className="bg-gray-100 px-2 py-0.5 rounded-md font-medium text-[11px]">
                      {rule.triggerType === 'instant_booking' && '⚡ Κατά την ολοκλήρωση κράτησης'}
                      {rule.triggerType === 'before_checkin' && `📅 ${rule.offsetDays} ημέρα πριν το Check-in`}
                      {rule.triggerType === 'checkin_day' && '📅 Την ημέρα του Check-in'}
                      {rule.triggerType === 'mid_stay' && `☕ ${rule.offsetDays} ημέρα μετά την άφιξη`}
                      {rule.triggerType === 'before_checkout' && `🚪 ${rule.offsetDays} ημέρα πριν το Check-out`}
                      {rule.triggerType === 'after_checkout' && '⭐ Μετά το Check-out'}
                    </span>
                    <span>•</span>
                    <span className="text-[11px] text-indigo-700 font-bold">
                      Κανάλια: Airbnb Chat, Booking.com, WhatsApp
                    </span>
                  </div>
                </div>
              </div>

              {/* Right Controls: Toggle & Edit Button */}
              <div className="flex items-center gap-2.5 self-end sm:self-auto shrink-0 pt-2 sm:pt-0">
                <button
                  type="button"
                  onClick={() => handleEditClick(rule)}
                  className="flex items-center gap-1 text-xs font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 px-3 py-2 rounded-xl transition-colors"
                >
                  <Edit3 size={13} />
                  <span>Ρύθμιση Ώρας & Κειμένου</span>
                </button>

                {/* ON/OFF Switch */}
                <button
                  type="button"
                  onClick={() => toggleRule(rule.id)}
                  className={`relative inline-flex h-7 w-13 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
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
              <p className="text-xs text-gray-600 font-mono bg-gray-50/80 p-3 rounded-2xl border border-gray-200/60 leading-relaxed">
                {rule.body}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Edit Rule Modal */}
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
              <div className="flex items-center gap-2">
                <span className="text-2xl">{editingRule.icon}</span>
                <h3 className="font-extrabold text-gray-900 text-lg">Επεξεργασία Κανόνα Αυτοματισμού</h3>
              </div>
              <button
                onClick={() => setEditingRule(null)}
                className="text-gray-400 hover:text-gray-600 p-1.5 rounded-full hover:bg-gray-100"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEditedRule} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-gray-700 block mb-1">Τίτλος Κανόνα</label>
                <input
                  required
                  value={editingRule.title}
                  onChange={e => setEditingRule({ ...editingRule, title: e.target.value })}
                  className="w-full border border-gray-300 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500 font-medium"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Χρόνος Αποστολής</label>
                  <select
                    value={editingRule.offsetDays}
                    onChange={e => setEditingRule({ ...editingRule, offsetDays: Number(e.target.value) })}
                    className="w-full border border-gray-300 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500"
                  >
                    <option value={0}>Την ίδια ημέρα (Day 0)</option>
                    <option value={1}>1 ημέρα πριν / μετά</option>
                    <option value={2}>2 ημέρες πριν</option>
                    <option value={3}>3 ημέρες πριν</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-gray-700 block mb-1">Ώρα Αποστολής</label>
                  <select
                    value={editingRule.sendTime}
                    onChange={e => setEditingRule({ ...editingRule, sendTime: e.target.value })}
                    className="w-full border border-gray-300 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Άμεσα">Άμεσα (Triggered)</option>
                    <option value="09:00">09:00 π.μ. (Πρωί)</option>
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

              <div>
                <label className="font-bold text-gray-700 block mb-1">Κείμενο Μηνύματος</label>
                <textarea
                  rows={6}
                  required
                  value={editingRule.body}
                  onChange={e => setEditingRule({ ...editingRule, body: e.target.value })}
                  className="w-full border border-gray-300 rounded-2xl p-3.5 text-xs font-mono focus:ring-2 focus:ring-blue-500 leading-relaxed"
                />
                <p className="text-[10px] text-gray-400 mt-1">
                  Διαθέσιμες μεταβλητές: <code>{'{{guest_name}}'}</code>, <code>{'{{property_name}}'}</code>, <code>{'{{wifi_name}}'}</code>, <code>{'{{wifi_password}}'}</code>, <code>{'{{lockbox_code}}'}</code>, <code>{'{{check_in}}'}</code>, <code>{'{{check_out}}'}</code>
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setEditingRule(null)}
                  className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl"
                >
                  Ακύρωση
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm"
                >
                  Αποθήκευση Κανόνα
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
        featureDescription="Αναβαθμίστε στο πακέτο Pro για να στέλνονται τα μηνύματά σας αυτόματα σε συγκεκριμένες ώρες και μέρες σε κάθε επισκέπτη χωρίς να κάνετε τίποτα!"
      />
    </div>
  )
}
