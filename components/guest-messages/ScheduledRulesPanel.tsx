'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import {
  Clock, Sparkles, Check, Plus, Trash2, Edit3, Lock, Zap,
  AlertCircle, ChevronDown, ChevronUp, Bell, Calendar, Send, ShieldCheck,
  RotateCcw, Copy, Info, Smile, Image as ImageIcon, Upload, Eye, X, ExternalLink,
  MessageSquare, User, Phone, CheckCircle2, ListFilter
} from 'lucide-react'
import { format, parseISO, addDays } from 'date-fns'
import { el } from 'date-fns/locale'
import { isProUser } from '@/lib/permissions'
import ProFeatureModal from '@/components/ui/ProFeatureModal'
import { replaceTemplateVariables } from '@/lib/templates'

export interface RulePhoto {
  id: string
  title: string
  url: string
}

export interface AutomationRule {
  id: string
  title: string
  enabled: boolean
  triggerType: 'instant_booking' | 'before_checkin' | 'checkin_day' | 'mid_stay' | 'before_checkout' | 'after_checkout'
  offsetDays: number
  offsetHours?: number
  sendTime: string
  channel: 'all' | 'airbnb' | 'booking' | 'whatsapp'
  icon: string
  subject: string
  body: string
  photos?: RulePhoto[]
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
    photos: [],
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
    body: 'Ανυπομονούμε να σας υποδεχτούμε αύριο {{check_in}} στο {{property_name}}!\n\n📍 Διεύθυνση: {{address}}\n🕒 Check-in: από τις {{check_in_time}}\n🔐 Κωδικός Κλειδοθήκης (Lockbox): {{lockbox_code}}\n\n📸 Δείτε παρακάτω τη φωτογραφία της κλειδοθήκης και της εισόδου για εύκολη πρόσβαση!\n\nΕνημερώστε μας μόλις φτάσετε!',
    photos: [
      { id: 'p1', title: '🔑 Κλειδοθήκη (Lockbox)', url: 'https://images.unsplash.com/photo-1558002038-1055907df827?w=600&auto=format&fit=crop&q=80' },
      { id: 'p2', title: '🚪 Κεντρική Είσοδος', url: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=600&auto=format&fit=crop&q=80' }
    ],
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
    photos: [],
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
    photos: [],
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
    photos: [],
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
    photos: [],
  },
]

const EMOJI_OPTIONS = ['💬', '🔑', '🏠', '📶', '☕', '🚪', '⭐', '🚗', '🏖️', '📍', '🎁', '⚠️', '💡', '🧹', '🏊‍♂️']

const PHOTO_PRESETS = [
  '🔑 Κλειδοθήκη (Lockbox)',
  '🚪 Κεντρική Είσοδος / Πόρτα',
  '🏢 Πρόσοψη Κτιρίου',
  '🅿️ Θέση Πάρκινγκ',
  '⚡ Πίνακας Ρεύματος & Θερμοσίφωνας',
  '🛗 Ασανσέρ / Σκάλα',
]

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
  bookings?: any[]
  properties?: any[]
}

export default function ScheduledRulesPanel({ userEmail, bookings = [], properties = [] }: Props) {
  const [subTab, setSubTab] = useState<'queue' | 'rules'>('queue')
  const [queueFilter, setQueueFilter] = useState<'all' | 'due' | 'sent'>('all')
  const [rules, setRules] = useState<AutomationRule[]>(DEFAULT_RULES)
  const [editingRule, setEditingRule] = useState<AutomationRule | null>(null)
  const [isNewRule, setIsNewRule] = useState(false)
  const [showProModal, setShowProModal] = useState(false)
  const [savedSuccess, setSavedSuccess] = useState<string | null>(null)

  // Guest phones & sent messages storage
  const [guestPhones, setGuestPhones] = useState<Record<string, string>>({})
  const [sentMessages, setSentMessages] = useState<Record<string, boolean>>({})
  const [copiedId, setCopiedId] = useState<string | null>(null)

  // Photo management state in modal
  const [photoTitleInput, setPhotoTitleInput] = useState(PHOTO_PRESETS[0])
  const [photoUrlInput, setPhotoUrlInput] = useState('')
  const [previewingPhoto, setPreviewingPhoto] = useState<RulePhoto | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [currentEmail, setCurrentEmail] = useState<string | null>(userEmail ?? null)
  const isPro = isProUser(currentEmail)

  useEffect(() => {
    if (userEmail) {
      setCurrentEmail(userEmail)
    } else {
      import('@/lib/supabase/client').then(({ createClient }) => {
        createClient().auth.getUser().then(({ data: { user } }) => {
          if (user?.email) setCurrentEmail(user.email)
        })
      })
    }
  }, [userEmail])

  useEffect(() => {
    try {
      const saved = localStorage.getItem('greekhost_automated_rules')
      if (saved) setRules(JSON.parse(saved))
      const savedPhones = localStorage.getItem('greekhost_guest_phones')
      if (savedPhones) setGuestPhones(JSON.parse(savedPhones))
      const savedSent = localStorage.getItem('greekhost_sent_messages')
      if (savedSent) setSentMessages(JSON.parse(savedSent))
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

  const handlePhoneChange = (bookingId: string, phone: string) => {
    const updated = { ...guestPhones, [bookingId]: phone }
    setGuestPhones(updated)
    try {
      localStorage.setItem('greekhost_guest_phones', JSON.stringify(updated))
    } catch {}
  }

  const toggleSentStatus = (queueItemId: string) => {
    const updated = { ...sentMessages, [queueItemId]: !sentMessages[queueItemId] }
    setSentMessages(updated)
    try {
      localStorage.setItem('greekhost_sent_messages', JSON.stringify(updated))
    } catch {}
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
      photos: [],
    })
    setPhotoUrlInput('')
  }

  const handleEditClick = (rule: AutomationRule) => {
    if (!isPro) {
      setShowProModal(true)
      return
    }
    setIsNewRule(false)
    setEditingRule(JSON.parse(JSON.stringify({ ...rule, photos: rule.photos || [] })))
    setPhotoUrlInput('')
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

  const insertVariableToBody = (variableTag: string) => {
    if (!editingRule) return
    setEditingRule({
      ...editingRule,
      body: editingRule.body + ' ' + variableTag,
    })
  }

  const handlePhotoFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !editingRule) return
    const reader = new FileReader()
    reader.onload = () => {
      const dataUrl = reader.result as string
      const newPhoto: RulePhoto = {
        id: `photo-${Date.now()}`,
        title: photoTitleInput,
        url: dataUrl,
      }
      setEditingRule({
        ...editingRule,
        photos: [...(editingRule.photos || []), newPhoto],
      })
    }
    reader.readAsDataURL(file)
  }

  const handleAddPhotoUrl = () => {
    if (!photoUrlInput.trim() || !editingRule) return
    const newPhoto: RulePhoto = {
      id: `photo-${Date.now()}`,
      title: photoTitleInput,
      url: photoUrlInput.trim(),
    }
    setEditingRule({
      ...editingRule,
      photos: [...(editingRule.photos || []), newPhoto],
    })
    setPhotoUrlInput('')
  }

  const handleRemovePhoto = (photoId: string) => {
    if (!editingRule) return
    setEditingRule({
      ...editingRule,
      photos: (editingRule.photos || []).filter(p => p.id !== photoId),
    })
  }

  // Compute Live Scheduled Queue items across all bookings & rules
  const queueItems = useMemo(() => {
    const items: any[] = []
    const enabledRules = rules.filter(r => r.enabled)

    bookings.forEach(b => {
      const prop = properties.find(p => p.id === b.property_id) || { name: 'Ακίνητο', id: b.property_id }
      const checkInDate = parseISO(b.check_in)
      const checkOutDate = parseISO(b.check_out)

      enabledRules.forEach(rule => {
        let targetDate = checkInDate
        if (rule.triggerType === 'before_checkin') {
          targetDate = addDays(checkInDate, -rule.offsetDays)
        } else if (rule.triggerType === 'checkin_day') {
          targetDate = checkInDate
        } else if (rule.triggerType === 'mid_stay') {
          targetDate = addDays(checkInDate, rule.offsetDays)
        } else if (rule.triggerType === 'before_checkout') {
          targetDate = addDays(checkOutDate, -rule.offsetDays)
        } else if (rule.triggerType === 'after_checkout') {
          targetDate = addDays(checkOutDate, rule.offsetDays)
        }

        const queueId = `${b.id}_${rule.id}`
        const isSent = !!sentMessages[queueId]
        const todayStr = format(new Date(), 'yyyy-MM-dd')
        const targetStr = format(targetDate, 'yyyy-MM-dd')
        const isDueTodayOrPast = targetStr <= todayStr

        // Render message text with variables
        const messageText = replaceTemplateVariables(rule.body, {
          guest_name: b.guest_name || 'Επισκέπτη',
          property_name: prop.name || 'Ακίνητο',
          property_address: prop.address || '—',
          check_in: format(checkInDate, 'dd/MM/yyyy'),
          check_out: format(checkOutDate, 'dd/MM/yyyy'),
          nights: b.nights || 1,
          check_in_time: prop.check_in_time || '15:00',
          check_out_time: prop.check_out_time || '11:00',
          wifi_name: prop.wifi_name || '—',
          wifi_password: prop.wifi_password || '—',
          lockbox_code: prop.lockbox_code || '—',
          directions: prop.directions || 'Είσοδος με κλειδοθήκη.',
        })

        items.push({
          id: queueId,
          booking: b,
          property: prop,
          rule,
          targetDate,
          targetStr,
          sendTime: rule.sendTime,
          messageText,
          isSent,
          isDueTodayOrPast,
        })
      })
    })

    return items.sort((a, b) => a.targetDate.getTime() - b.targetDate.getTime())
  }, [bookings, properties, rules, sentMessages])

  const filteredQueueItems = useMemo(() => {
    if (queueFilter === 'due') return queueItems.filter(item => !item.isSent && item.isDueTodayOrPast)
    if (queueFilter === 'sent') return queueItems.filter(item => item.isSent)
    return queueItems
  }, [queueItems, queueFilter])

  const dueCount = queueItems.filter(item => !item.isSent && item.isDueTodayOrPast).length

  const handleSendWhatsApp = (phone: string, text: string, queueId: string) => {
    let cleanPhone = phone.replace(/[^0-9+]/g, '')
    if (cleanPhone.startsWith('69') && cleanPhone.length === 10) {
      cleanPhone = `30${cleanPhone}`
    } else if (cleanPhone.startsWith('00')) {
      cleanPhone = cleanPhone.substring(2)
    }

    const encoded = encodeURIComponent(text)
    const url = cleanPhone
      ? `https://wa.me/${cleanPhone.replace('+', '')}?text=${encoded}`
      : `https://wa.me/?text=${encoded}`

    window.open(url, '_blank')
    toggleSentStatus(queueId)
  }

  const handleCopyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
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
              <span>Hospitable-Grade WhatsApp & Channel Automation</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight">
              Αυτοματοποιημένα Μηνύματα WhatsApp & Οδηγίες
            </h2>
            <p className="text-xs sm:text-sm text-blue-100/80 leading-relaxed">
              Το σύστημα υπολογίζει αυτόματα τις <strong>ημέρες και ώρες αποστολής</strong> για κάθε κράτηση και σας επιτρέπει άμεση αποστολή στο WhatsApp του επισκέπτη!
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

      {/* Subtabs: 1. Live WhatsApp Queue | 2. Rule Configuration */}
      <div className="flex items-center gap-2 p-1.5 bg-gray-100/90 dark:bg-slate-900 rounded-2xl border border-gray-200/80 dark:border-slate-800 max-w-lg">
        <button
          type="button"
          onClick={() => setSubTab('queue')}
          className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center gap-2 ${
            subTab === 'queue'
              ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-500/20'
              : 'text-gray-600 dark:text-gray-300 hover:text-gray-900'
          }`}
        >
          <Send size={15} />
          <span>⚡ Ζωντανή Ουρά WhatsApp</span>
          {dueCount > 0 && (
            <span className="bg-amber-400 text-slate-900 text-[10px] font-black px-1.5 py-0.2 rounded-full">
              {dueCount}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setSubTab('rules')}
          className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center gap-2 ${
            subTab === 'rules'
              ? 'bg-white dark:bg-slate-800 text-blue-700 dark:text-blue-400 shadow-sm'
              : 'text-gray-600 dark:text-gray-300 hover:text-gray-900'
          }`}
        >
          <Clock size={15} />
          <span>⚙️ Ρύθμιση Κανόνων ({rules.length})</span>
        </button>
      </div>

      {/* VIEW 1: LIVE WHATSAPP DISPATCH QUEUE */}
      {subTab === 'queue' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-xs">
            <div className="flex items-center gap-2">
              <span className="text-xl">📅</span>
              <div>
                <h3 className="font-extrabold text-gray-900 dark:text-white text-sm">
                  Προγραμματισμένες Αποστολές ανά Επισκέπτη & Ώρα
                </h3>
                <p className="text-[11px] text-gray-500 dark:text-gray-400">
                  Υπολογίζονται αυτόματα βάσει των ημερομηνιών check-in/out και των κανόνων σας
                </p>
              </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1.5 bg-gray-100 dark:bg-slate-800 p-1 rounded-xl text-xs">
              <button
                onClick={() => setQueueFilter('all')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                  queueFilter === 'all' ? 'bg-white dark:bg-slate-700 text-gray-900 dark:text-white shadow-xs' : 'text-gray-500'
                }`}
              >
                Όλα ({queueItems.length})
              </button>
              <button
                onClick={() => setQueueFilter('due')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all flex items-center gap-1 ${
                  queueFilter === 'due' ? 'bg-amber-500 text-white shadow-xs' : 'text-gray-500'
                }`}
              >
                <span>🟢 Έτοιμα ({dueCount})</span>
              </button>
              <button
                onClick={() => setQueueFilter('sent')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                  queueFilter === 'sent' ? 'bg-emerald-600 text-white shadow-xs' : 'text-gray-500'
                }`}
              >
                ✅ Απεσταλμένα ({queueItems.filter(i => i.isSent).length})
              </button>
            </div>
          </div>

          {filteredQueueItems.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 text-center border border-gray-100 dark:border-slate-800 space-y-2">
              <span className="text-3xl">🎉</span>
              <h4 className="font-extrabold text-gray-900 dark:text-white text-sm">Δεν υπάρχουν εκκρεμή μηνύματα</h4>
              <p className="text-xs text-gray-500">Όλα τα προγραμματισμένα μηνύματα έχουν σταλεί ή δεν υπάρχουν ενεργές κρατήσεις!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3.5">
              {filteredQueueItems.map(item => {
                const phone = guestPhones[item.booking.id] || ''
                return (
                  <div
                    key={item.id}
                    className={`bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border transition-all shadow-sm hover:shadow-md ${
                      item.isSent
                        ? 'border-gray-200 dark:border-slate-800 opacity-70 bg-gray-50/40 dark:bg-slate-950'
                        : item.isDueTodayOrPast
                        ? 'border-emerald-300 dark:border-emerald-800 ring-2 ring-emerald-400/20'
                        : 'border-gray-100 dark:border-slate-800'
                    }`}
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      {/* Left: Booking & Trigger Details */}
                      <div className="space-y-1.5 flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-lg">{item.rule.icon}</span>
                          <h4 className="font-extrabold text-gray-900 dark:text-white text-sm sm:text-base">
                            {item.rule.title}
                          </h4>

                          {item.isSent ? (
                            <span className="bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-800 px-2 py-0.5 rounded-md text-[10px] font-black flex items-center gap-1">
                              <CheckCircle2 size={11} className="text-emerald-600" />
                              <span>Απεστάλη</span>
                            </span>
                          ) : item.isDueTodayOrPast ? (
                            <span className="bg-emerald-500 text-white px-2 py-0.5 rounded-md text-[10px] font-black animate-pulse">
                              🟢 Ώρα για Αποστολή (Τώρα)
                            </span>
                          ) : (
                            <span className="bg-blue-50 dark:bg-blue-950/60 text-blue-800 dark:text-blue-200 border border-blue-200 dark:border-blue-800 px-2 py-0.5 rounded-md text-[10px] font-bold">
                              🕒 Προγραμματισμένο
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300 flex-wrap">
                          <span className="font-extrabold text-gray-900 dark:text-white flex items-center gap-1">
                            <User size={13} className="text-blue-600" />
                            <span>{item.booking.guest_name || 'Επισκέπτης'}</span>
                          </span>
                          <span>•</span>
                          <span className="font-medium text-gray-500">{item.property.name}</span>
                          <span>•</span>
                          <span className="text-indigo-600 dark:text-indigo-400 font-bold bg-indigo-50 dark:bg-indigo-950/50 px-2 py-0.5 rounded-md text-[11px]">
                            📅 Ημερομηνία: {format(item.targetDate, 'd MMM yyyy', { locale: el })} ({item.sendTime})
                          </span>
                        </div>
                      </div>

                      {/* Right: Phone Input & WhatsApp 1-Click Action */}
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 shrink-0">
                        {/* Guest Phone Number Input */}
                        <div className="relative">
                          <Phone size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                          <input
                            value={phone}
                            onChange={e => handlePhoneChange(item.booking.id, e.target.value)}
                            placeholder="Κινητό WhatsApp (+30...)"
                            className="pl-7 pr-2.5 py-2 border border-gray-300 dark:border-slate-700 rounded-xl text-xs bg-white dark:bg-slate-950 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 w-full sm:w-44 font-medium"
                          />
                        </div>

                        {/* WhatsApp Send Button */}
                        <button
                          type="button"
                          onClick={() => handleSendWhatsApp(phone, item.messageText, item.id)}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold px-3.5 py-2 rounded-xl text-xs shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-1.5 active:scale-95"
                          title="Άμεση αποστολή στο WhatsApp του επισκέπτη"
                        >
                          <Send size={13} />
                          <span>Αποστολή WhatsApp</span>
                        </button>

                        {/* Copy Button */}
                        <button
                          type="button"
                          onClick={() => handleCopyText(item.messageText, item.id)}
                          className="p-2 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 text-gray-700 dark:text-gray-300 rounded-xl text-xs transition-colors"
                          title="Αντιγραφή κειμένου"
                        >
                          {copiedId === item.id ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                        </button>

                        {/* Toggle Sent Status */}
                        <button
                          type="button"
                          onClick={() => toggleSentStatus(item.id)}
                          className={`p-2 rounded-xl text-xs transition-colors border ${
                            item.isSent
                              ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                              : 'bg-gray-50 dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-gray-400 hover:text-gray-600'
                          }`}
                          title={item.isSent ? 'Σημειωμένο ως απεσταλμένο' : 'Σημείωση ως απεσταλμένο'}
                        >
                          <CheckCircle2 size={15} />
                        </button>
                      </div>
                    </div>

                    {/* Message Preview Snippet */}
                    <div className="mt-3 pt-2.5 border-t border-gray-100 dark:border-slate-800">
                      <p className="text-xs font-mono p-3 rounded-2xl border leading-relaxed whitespace-pre-line bg-slate-100/90 text-slate-900 border-slate-200 dark:bg-slate-950 dark:text-slate-100 dark:border-slate-800 shadow-inner">
                        {item.messageText}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* VIEW 2: RULE CONFIGURATION & PHOTO ATTACHMENTS */}
      {subTab === 'rules' && (
        <div className="grid grid-cols-1 gap-3.5">
          {rules.map((rule) => {
            const hasPhotos = rule.photos && rule.photos.length > 0

            return (
              <div
                key={rule.id}
                className={`bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border transition-all shadow-sm hover:shadow-md ${
                  rule.enabled
                    ? 'border-indigo-100 dark:border-slate-800 bg-white dark:bg-slate-900'
                    : 'border-gray-200/80 dark:border-slate-800/80 bg-gray-50/70 dark:bg-slate-950 opacity-75'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  {/* Left Title & Trigger Info */}
                  <div className="flex items-start gap-3.5">
                    <div className="w-11 h-11 rounded-2xl bg-indigo-50 dark:bg-indigo-950 border border-indigo-100 dark:border-indigo-900 flex items-center justify-center text-xl shrink-0 shadow-2xs">
                      {rule.icon}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-extrabold text-gray-900 dark:text-white text-sm sm:text-base">{rule.title}</h3>
                        <span className="inline-flex items-center gap-1 bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-900 text-amber-900 dark:text-amber-300 text-[10px] font-extrabold px-2 py-0.5 rounded-md">
                          <Clock size={11} className="text-amber-600 dark:text-amber-400" />
                          <span>{rule.sendTime === 'Άμεσα' ? 'Άμεση Αποστολή' : `Ώρα: ${rule.sendTime}`}</span>
                        </span>
                        {hasPhotos && (
                          <span className="inline-flex items-center gap-1 bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-900 text-teal-800 dark:text-teal-300 text-[10px] font-extrabold px-2 py-0.5 rounded-md">
                            <ImageIcon size={11} className="text-teal-600 dark:text-teal-400" />
                            <span>{rule.photos?.length} Φωτογραφίες</span>
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mt-1 flex-wrap">
                        <span className="bg-blue-50 dark:bg-blue-950/60 text-blue-800 dark:text-blue-200 border border-blue-100 dark:border-blue-900 px-2 py-0.5 rounded-md font-semibold text-[11px]">
                          {rule.triggerType === 'instant_booking' && '⚡ Κατά την ολοκλήρωση κράτησης'}
                          {rule.triggerType === 'before_checkin' && `📅 ${rule.offsetDays === 0 ? 'Την ημέρα του' : `${rule.offsetDays} μέρα πριν το`} Check-in`}
                          {rule.triggerType === 'checkin_day' && '📅 Την ημέρα του Check-in'}
                          {rule.triggerType === 'mid_stay' && `☕ ${rule.offsetDays} ημέρα μετά την άφιξη`}
                          {rule.triggerType === 'before_checkout' && `🚪 ${rule.offsetDays === 0 ? 'Την ημέρα του' : `${rule.offsetDays} μέρα πριν το`} Check-out`}
                          {rule.triggerType === 'after_checkout' && '⭐ Μετά το Check-out'}
                        </span>
                        <span>•</span>
                        <span className="text-[11px] text-indigo-700 dark:text-indigo-400 font-bold">
                          Κανάλια: WhatsApp, Airbnb Chat, Booking.com
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right Controls: Toggle, Edit, Delete */}
                  <div className="flex items-center gap-2 self-end sm:self-auto shrink-0 pt-2 sm:pt-0">
                    <button
                      type="button"
                      onClick={() => handleEditClick(rule)}
                      className="flex items-center gap-1 text-xs font-bold text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 px-3 py-2 rounded-xl transition-colors"
                      title="Επεξεργασία κειμένου, ώρας & φωτογραφιών"
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
                        rule.enabled ? 'bg-emerald-600' : 'bg-gray-300 dark:bg-slate-700'
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
                <div className="mt-3.5 pt-3 border-t border-gray-100 dark:border-slate-800">
                  <p className="text-xs font-mono p-3.5 rounded-2xl border leading-relaxed whitespace-pre-line bg-slate-100/90 text-slate-900 border-slate-200 dark:bg-slate-950 dark:text-slate-100 dark:border-slate-800 shadow-inner">
                    {rule.body}
                  </p>
                </div>

                {/* Attached Photos Thumbnail Gallery */}
                {hasPhotos && (
                  <div className="mt-3 pt-3 border-t border-gray-100/80 dark:border-slate-800">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-gray-700 dark:text-gray-300 mb-2">
                      <ImageIcon size={14} className="text-teal-600 dark:text-teal-400" />
                      <span>Συνημμένες Φωτογραφίες Οδηγιών ({rule.photos?.length}):</span>
                    </div>
                    <div className="flex items-center gap-3 overflow-x-auto pb-1">
                      {rule.photos?.map((photo) => (
                        <div
                          key={photo.id}
                          onClick={() => setPreviewingPhoto(photo)}
                          className="group relative cursor-pointer rounded-2xl overflow-hidden border border-gray-200 dark:border-slate-700 shadow-2xs hover:shadow-md transition-all shrink-0 w-36 bg-gray-50 dark:bg-slate-800"
                        >
                          <img
                            src={photo.url}
                            alt={photo.title}
                            className="w-full h-24 object-cover group-hover:scale-105 transition-transform duration-200"
                          />
                          <div className="p-1.5 bg-white/95 dark:bg-slate-900 text-[10px] font-bold text-gray-800 dark:text-white truncate text-center">
                            {photo.title}
                          </div>
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                            <Eye size={18} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Edit / Create Rule Modal */}
      {editingRule && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4"
          onClick={() => setEditingRule(null)}
        >
          <div
            className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full p-6 sm:p-7 space-y-5 shadow-2xl animate-in zoom-in-95 duration-150 border border-gray-100 dark:border-slate-800 max-h-[92vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <span className="text-2xl">{editingRule.icon}</span>
                <div>
                  <h3 className="font-extrabold text-gray-900 dark:text-white text-lg">
                    {isNewRule ? 'Δημιουργία Νέου Κανόνα Αυτοματισμού' : 'Επεξεργασία Κανόνα & Φωτογραφιών'}
                  </h3>
                  <p className="text-xs text-gray-400">Προσαρμόστε συνθήκες, φωτογραφίες εισόδου και κείμενο</p>
                </div>
              </div>
              <button
                onClick={() => setEditingRule(null)}
                className="text-gray-400 hover:text-gray-600 p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEditedRule} className="space-y-4 text-xs">
              {/* Title & Emoji Selector */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div className="sm:col-span-3">
                  <label className="font-bold text-gray-700 dark:text-gray-300 block mb-1">Τίτλος Κανόνα *</label>
                  <input
                    required
                    value={editingRule.title}
                    onChange={e => setEditingRule({ ...editingRule, title: e.target.value })}
                    placeholder="π.χ. Οδηγίες Στάθμευσης & Άφιξης"
                    className="w-full border border-gray-300 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs bg-white dark:bg-slate-950 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 font-medium"
                  />
                </div>
                <div>
                  <label className="font-bold text-gray-700 dark:text-gray-300 block mb-1">Εικονίδιο</label>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xl p-1 bg-gray-100 dark:bg-slate-800 rounded-lg">{editingRule.icon}</span>
                    <select
                      value={editingRule.icon}
                      onChange={e => setEditingRule({ ...editingRule, icon: e.target.value })}
                      className="w-full border border-gray-300 dark:border-slate-700 rounded-xl px-2 py-2 text-xs bg-white dark:bg-slate-950 text-gray-900 dark:text-white"
                    >
                      {EMOJI_OPTIONS.map(em => (
                        <option key={em} value={em}>{em}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Timing Controls (Event, Days, Time of Day) */}
              <div className="bg-gray-50 dark:bg-slate-950 border border-gray-200/80 dark:border-slate-800 rounded-2xl p-3.5 space-y-3">
                <span className="font-extrabold text-gray-900 dark:text-white block text-xs">
                  ⏰ Συνθήκη & Χρόνος Αποστολής:
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {/* Trigger Event */}
                  <div>
                    <label className="font-semibold text-gray-600 dark:text-gray-400 block mb-1 text-[11px]">Γεγονός</label>
                    <select
                      value={editingRule.triggerType}
                      onChange={e => setEditingRule({ ...editingRule, triggerType: e.target.value as any })}
                      className="w-full border border-gray-300 dark:border-slate-700 rounded-xl px-2.5 py-2 text-xs bg-white dark:bg-slate-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 font-medium"
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
                    <label className="font-semibold text-gray-600 dark:text-gray-400 block mb-1 text-[11px]">Ημέρες Διαφοράς</label>
                    <select
                      value={editingRule.offsetDays}
                      onChange={e => setEditingRule({ ...editingRule, offsetDays: Number(e.target.value) })}
                      className="w-full border border-gray-300 dark:border-slate-700 rounded-xl px-2.5 py-2 text-xs bg-white dark:bg-slate-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
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
                    <label className="font-semibold text-gray-600 dark:text-gray-400 block mb-1 text-[11px]">Ώρα Αποστολής</label>
                    <select
                      value={editingRule.sendTime}
                      onChange={e => setEditingRule({ ...editingRule, sendTime: e.target.value })}
                      className="w-full border border-gray-300 dark:border-slate-700 rounded-xl px-2.5 py-2 text-xs bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 font-bold focus:ring-2 focus:ring-blue-500"
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

              {/* 📸 Visual Check-in Photos Uploader */}
              <div className="bg-gradient-to-r from-teal-50/70 to-emerald-50/70 dark:from-teal-950/40 dark:to-emerald-950/40 border border-teal-200/80 dark:border-teal-800 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-teal-500" />
                    <span className="font-extrabold text-teal-950 dark:text-teal-200 text-xs">
                      📸 Φωτογραφίες Οδηγιών (Κλειδοθήκη, Πόρτα, Είσοδος, Πάρκινγκ):
                    </span>
                  </div>
                  <span className="text-[10px] text-teal-700 dark:text-teal-300 bg-white dark:bg-slate-900 border border-teal-200 dark:border-teal-800 px-2 py-0.5 rounded-md font-bold">
                    {editingRule.photos?.length || 0} Φωτογραφίες
                  </span>
                </div>

                {/* Add Photo Controls */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                  <div className="sm:col-span-4">
                    <select
                      value={photoTitleInput}
                      onChange={e => setPhotoTitleInput(e.target.value)}
                      className="w-full border border-teal-300 dark:border-teal-800 rounded-xl px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500 font-medium"
                    >
                      {PHOTO_PRESETS.map(p => <option key={p} value={p}>{p}</option>)}
                      <option value="Άλλη Φωτογραφία">Άλλη Φωτογραφία</option>
                    </select>
                  </div>

                  <div className="sm:col-span-5 flex gap-1">
                    <input
                      value={photoUrlInput}
                      onChange={e => setPhotoUrlInput(e.target.value)}
                      placeholder="Επικόλληση URL ή ανέβασμα ➔"
                      className="w-full border border-teal-300 dark:border-teal-800 rounded-xl px-2.5 py-1.5 text-xs bg-white dark:bg-slate-950 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500"
                    />
                  </div>

                  <div className="sm:col-span-3 flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex-1 bg-white dark:bg-slate-900 hover:bg-teal-50 text-teal-700 dark:text-teal-300 border border-teal-300 dark:border-teal-800 font-bold px-2 py-1.5 rounded-xl text-xs transition-colors flex items-center justify-center gap-1 shadow-2xs"
                      title="Ανέβασμα από τη συσκευή σας"
                    >
                      <Upload size={12} />
                      <span>Αρχείο</span>
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handlePhotoFileUpload}
                    />

                    {photoUrlInput && (
                      <button
                        type="button"
                        onClick={handleAddPhotoUrl}
                        className="bg-teal-600 hover:bg-teal-700 text-white font-bold px-3 py-1.5 rounded-xl text-xs transition-colors shadow-2xs"
                      >
                        + URL
                      </button>
                    )}
                  </div>
                </div>

                {/* Thumbnails of Added Photos */}
                {(editingRule.photos && editingRule.photos.length > 0) && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-teal-200/60 dark:border-teal-800/60">
                    {editingRule.photos.map((photo) => (
                      <div key={photo.id} className="relative group bg-white dark:bg-slate-900 rounded-xl p-1.5 border border-teal-200 dark:border-teal-800 shadow-2xs">
                        <img
                          src={photo.url}
                          alt={photo.title}
                          className="w-full h-18 object-cover rounded-lg"
                        />
                        <div className="text-[10px] font-bold text-gray-700 dark:text-gray-300 truncate mt-1 text-center">
                          {photo.title}
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemovePhoto(photo.id)}
                          className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white p-1 rounded-full shadow-md opacity-90 group-hover:opacity-100 transition-opacity"
                          title="Αφαίρεση φωτογραφίας"
                        >
                          <X size={11} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Clickable Smart Variable Chips */}
              <div>
                <label className="font-bold text-gray-700 dark:text-gray-300 uppercase text-[10px] block mb-1.5 flex items-center justify-between">
                  <span>Κάντε κλικ για εισαγωγή μεταβλητής:</span>
                  <span className="text-teal-600 dark:text-teal-400 font-bold normal-case">✨ Αυτόματη Συμπλήρωση</span>
                </label>
                <div className="flex flex-wrap gap-1.5 p-2 bg-gray-50 dark:bg-slate-950 border border-gray-200/80 dark:border-slate-800 rounded-2xl">
                  {SMART_VARIABLES.map(v => (
                    <button
                      key={v.tag}
                      type="button"
                      onClick={() => insertVariableToBody(v.tag)}
                      className="bg-white dark:bg-slate-800 hover:bg-blue-50 text-blue-700 dark:text-blue-300 border border-gray-200 dark:border-slate-700 hover:border-blue-300 px-2.5 py-1 rounded-xl text-[11px] font-semibold transition-all shadow-2xs active:scale-95"
                    >
                      + {v.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Rule Body Textarea */}
              <div>
                <label className="font-bold text-gray-700 dark:text-gray-300 block mb-1">Κείμενο Μηνύματος (Template Body) *</label>
                <textarea
                  rows={7}
                  required
                  value={editingRule.body}
                  onChange={e => setEditingRule({ ...editingRule, body: e.target.value })}
                  placeholder="Γράψτε το μήνυμά σας χρησιμοποιώντας τις παραπάνω μεταβλητές..."
                  className="w-full border border-gray-300 dark:border-slate-700 rounded-2xl p-4 text-xs font-mono bg-white dark:bg-slate-950 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 leading-relaxed"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-gray-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingRule(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800"
                >
                  Ακύρωση
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-extrabold text-white bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-500/20"
                >
                  Αποθήκευση Κανόνα
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Photo Full-View Lightbox Modal */}
      {previewingPhoto && (
        <div
          className="fixed inset-0 bg-black/80 z-60 flex items-center justify-center p-4 backdrop-blur-xs"
          onClick={() => setPreviewingPhoto(null)}
        >
          <div className="max-w-2xl w-full bg-white dark:bg-slate-900 rounded-3xl overflow-hidden shadow-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-extrabold text-gray-900 dark:text-white text-sm">{previewingPhoto.title}</h4>
              <button onClick={() => setPreviewingPhoto(null)} className="text-gray-400 hover:text-gray-600 p-1">✕</button>
            </div>
            <img src={previewingPhoto.url} alt={previewingPhoto.title} className="w-full max-h-[70vh] object-contain rounded-2xl" />
          </div>
        </div>
      )}

      {/* Pro Upgrade Modal */}
      <ProFeatureModal
        isOpen={showProModal}
        onClose={() => setShowProModal(false)}
        featureTitle="Αυτοματοποιημένοι Κανόνες Μηνυμάτων & Φωτογραφίες Οδηγιών"
      />
    </div>
  )
}
