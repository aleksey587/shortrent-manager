'use client'

import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  Sparkles, CheckCircle2, Clock, AlertTriangle, User, Home, Calendar,
  Share2, Phone, MessageSquare, Check, Filter, Moon, ChevronRight, Edit3, Send,
  CalendarDays, Bell, Download, Copy
} from 'lucide-react'
import { format, parseISO, isToday, isTomorrow, isPast, isFuture, addDays, startOfDay, endOfDay, isSameDay, getMonth, getYear } from 'date-fns'
import { el } from 'date-fns/locale'
import { openWhatsAppMessage } from '@/lib/utils'
import { isProUser } from '@/lib/permissions'
import ProFeatureModal from '@/components/ui/ProFeatureModal'

interface Property {
  id: string
  name: string
  address: string | null
  color: string
  cleaning_fee: number | null
  cleaner_name?: string | null
  cleaner_phone?: string | null
  check_in_time?: string | null
  check_out_time?: string | null
}

interface Booking {
  id: string
  property_id: string
  guest_name: string | null
  check_in: string
  check_out: string
  nights: number
  platform: string
  cleaning_fee: number | null
}

interface CleaningTask {
  id: string
  property: Property
  date: Date
  checkoutBooking?: Booking
  nextCheckinBooking?: Booking
  isTurnaround: boolean
  cleaningFee: number
  status: 'pending' | 'in_progress' | 'completed'
}

const MONTH_NAMES = [
  'Ιανουάριος', 'Φεβρουάριος', 'Μάρτιος', 'Απρίλιος', 'Μάιος', 'Ιούνιος',
  'Ιούλιος', 'Αύγουστος', 'Σεπτέμβριος', 'Οκτώβριος', 'Νοέμβριος', 'Δεκέμβριος'
]

export default function CleaningHubPage() {
  const supabase = createClient()
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [properties, setProperties] = useState<Property[]>([])
  const [bookings, setBookings] = useState<Booking[]>([])
  const [taskStatusMap, setTaskStatusMap] = useState<Record<string, 'pending' | 'in_progress' | 'completed'>>({})
  const [loading, setLoading] = useState(true)
  const [filterPeriod, setFilterPeriod] = useState<'upcoming' | 'today' | 'turnaround' | 'all'>('upcoming')
  const [selectedPropertyFilter, setSelectedPropertyFilter] = useState<string>('all')
  const [editingCleanerProp, setEditingCleanerProp] = useState<Property | null>(null)
  const [cleanerForm, setCleanerForm] = useState({ name: '', phone: '' })
  const [savingCleaner, setSavingCleaner] = useState(false)

  // Monthly dispatch & cleaners modal states
  const [showMonthlyModal, setShowMonthlyModal] = useState(false)
  const [showCleanersManagerModal, setShowCleanersManagerModal] = useState(false)
  const [showProModal, setShowProModal] = useState(false)
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth())
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear())
  const [monthlyPropertyId, setMonthlyPropertyId] = useState<string>('')
  const [monthlyCopied, setMonthlyCopied] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    setLoading(true)
    const [{ data: { user } }, { data: props }, { data: books }] = await Promise.all([
      supabase.auth.getUser(),
      supabase.from('properties').select('*').order('created_at'),
      supabase.from('bookings').select('*').order('check_out', { ascending: true }),
    ])

    if (user?.email) setUserEmail(user.email)
    const fetchedProps = props ?? []
    setProperties(fetchedProps)
    setBookings(books ?? [])
    if (fetchedProps.length > 0) {
      setMonthlyPropertyId(fetchedProps[0].id)
    }
    setLoading(false)
  }

  // Generate cleaning tasks from bookings
  const cleaningTasks: CleaningTask[] = useMemo(() => {
    if (!bookings.length || !properties.length) return []

    const tasks: CleaningTask[] = []
    const propMap = new Map<string, Property>()
    properties.forEach(p => propMap.set(p.id, p))

    bookings.forEach(b => {
      const prop = propMap.get(b.property_id)
      if (!prop) return

      const checkoutDate = parseISO(b.check_out)

      // Find if there is a next booking checking in on the same day (Turnaround)
      const nextBooking = bookings.find(
        other => other.id !== b.id &&
                 other.property_id === b.property_id &&
                 other.check_in === b.check_out
      )

      const taskId = `clean-${b.id}`
      const status = taskStatusMap[taskId] || 'pending'
      const fee = b.cleaning_fee || prop.cleaning_fee || 0

      tasks.push({
        id: taskId,
        property: prop,
        date: checkoutDate,
        checkoutBooking: b,
        nextCheckinBooking: nextBooking,
        isTurnaround: !!nextBooking,
        cleaningFee: fee,
        status,
      })
    })

    return tasks.sort((a, b) => a.date.getTime() - b.date.getTime())
  }, [bookings, properties, taskStatusMap])

  // Filter tasks
  const filteredTasks = useMemo(() => {
    const today = startOfDay(new Date())
    const sevenDaysLater = addDays(today, 14)

    return cleaningTasks.filter(task => {
      if (selectedPropertyFilter !== 'all' && task.property.id !== selectedPropertyFilter) {
        return false
      }

      if (filterPeriod === 'today') {
        return isSameDay(task.date, today)
      }
      if (filterPeriod === 'upcoming') {
        return task.date >= today && task.date <= sevenDaysLater
      }
      if (filterPeriod === 'turnaround') {
        return task.isTurnaround && task.date >= today
      }

      return true
    })
  }, [cleaningTasks, filterPeriod, selectedPropertyFilter])

  // Tasks for the selected month in the monthly dispatch modal
  const monthlyTasks = useMemo(() => {
    return cleaningTasks.filter(task => {
      const taskMonth = task.date.getMonth()
      const taskYear = task.date.getFullYear()
      const matchesDate = taskMonth === selectedMonth && taskYear === selectedYear
      const matchesProp = monthlyPropertyId ? task.property.id === monthlyPropertyId : true
      return matchesDate && matchesProp
    })
  }, [cleaningTasks, selectedMonth, selectedYear, monthlyPropertyId])

  // Generate monthly dispatch message text
  const monthlyMessageText = useMemo(() => {
    const prop = properties.find(p => p.id === monthlyPropertyId) || properties[0]
    const cleanerName = prop?.cleaner_name || 'Συνεργάτη'
    const monthName = MONTH_NAMES[selectedMonth]

    let text = `📅 ΠΡΟΓΡΑΜΜΑ ΚΑΘΑΡΙΣΜΩΝ — ${monthName.toUpperCase()} ${selectedYear}\n`
    text += `🏠 Ακίνητο: *${prop?.name || 'Ακίνητο'}*\n`
    if (prop?.address) text += `📍 Διεύθυνση: ${prop.address}\n`
    text += `👤 Καθαριστής: ${cleanerName}\n`
    text += `------------------------------------\n\n`

    if (monthlyTasks.length === 0) {
      text += `Δεν υπάρχουν προγραμματισμένοι καθαρισμοί για αυτόν τον μήνα.\n`
    } else {
      text += `📋 Ημερομηνίες Καθαρισμού (${monthlyTasks.length} σύνολο):\n\n`
      monthlyTasks.forEach((t, index) => {
        const dateStr = format(t.date, 'EEEE dd/MM', { locale: el })
        const outTime = t.property.check_out_time || '11:00'
        const inTime = t.property.check_in_time || '15:00'

        text += `${index + 1}. *${dateStr}*\n`
        text += `   • Check-out: ${outTime}\n`
        if (t.isTurnaround) {
          text += `   • ⚠️ *SAME-DAY TURNAROUND* -> Επόμενο Check-in: ${inTime}\n`
        } else {
          text += `   • Επόμενο Check-in: Άλλη μέρα\n`
        }
        text += `\n`
      })

      text += `------------------------------------\n`
      text += `🧹 *Σύνολο Καθαρισμών:* ${monthlyTasks.length}\n`
    }

    text += `\nΣας ευχαριστούμε για την εξαιρετική συνεργασία! 🌟`
    return text
  }, [monthlyTasks, selectedMonth, selectedYear, monthlyPropertyId, properties])

  const sendMonthlyWhatsApp = () => {
    const prop = properties.find(p => p.id === monthlyPropertyId)
    openWhatsAppMessage(monthlyMessageText, prop?.cleaner_phone)
  }

  const copyMonthlyMessage = () => {
    navigator.clipboard.writeText(monthlyMessageText)
    setMonthlyCopied(true)
    setTimeout(() => setMonthlyCopied(false), 2000)
  }

  const toggleTaskStatus = (taskId: string, current: 'pending' | 'in_progress' | 'completed') => {
    const next: Record<'pending' | 'in_progress' | 'completed', 'pending' | 'in_progress' | 'completed'> = {
      pending: 'in_progress',
      in_progress: 'completed',
      completed: 'pending',
    }
    const newStatus = next[current]
    setTaskStatusMap(prev => ({ ...prev, [taskId]: newStatus }))
  }

  const dispatchToCleaner = (task: CleaningTask, isReminder = false) => {
    const prop = task.property
    const cleanerName = prop.cleaner_name ? `${prop.cleaner_name}` : 'Συνεργάτη'
    const dateFormatted = format(task.date, 'EEEE d MMMM', { locale: el })
    const checkOutTime = prop.check_out_time || '11:00'
    const checkInTime = prop.check_in_time || '15:00'

    let msg = isReminder
      ? `🔔 *ΠΡΩΙΝΗ ΥΠΕΝΘΥΜΙΣΗ ΚΑΘΑΡΙΣΜΟΥ* 🔔\n\nΚαλημέρα ${cleanerName}!\n`
      : `Καλημέρα ${cleanerName}! 🧹\n\n`

    msg += `Έχουμε προγραμματισμένο καθαρισμό για το ακίνητο *${prop.name}*:\n`
    if (prop.address) msg += `📍 Διεύθυνση: ${prop.address}\n`
    msg += `📅 Ημερομηνία: ${dateFormatted}\n`
    msg += `⏰ Check-out επισκέπτη: ${checkOutTime}\n`

    if (task.isTurnaround && task.nextCheckinBooking) {
      msg += `⚠️ *ΠΡΟΣΟΧΗ — SAME-DAY TURNAROUND* ⚠️\n`
      msg += `Άφιξη νέου επισκέπτη στις ${checkInTime}! Το σπίτι πρέπει να είναι έτοιμο πριν τις ${checkInTime}.\n`
    } else {
      msg += `ℹ️ Δεν υπάρχει άμεση άφιξη την ίδια μέρα.\n`
    }

    msg += `\nΠαρακαλώ ενημερώστε με μόλις ολοκληρωθεί. Ευχαριστώ πολύ!`

    openWhatsAppMessage(msg, prop.cleaner_phone)
  }

  const handleSaveCleaner = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingCleanerProp) return
    setSavingCleaner(true)

    const { error } = await supabase
      .from('properties')
      .update({
        cleaner_name: cleanerForm.name || null,
        cleaner_phone: cleanerForm.phone || null,
      })
      .eq('id', editingCleanerProp.id)

    setSavingCleaner(false)
    if (!error) {
      setProperties(prev => prev.map(p => p.id === editingCleanerProp.id ? { ...p, cleaner_name: cleanerForm.name, cleaner_phone: cleanerForm.phone } : p))
      setEditingCleanerProp(null)
    } else {
      alert('⚠️ Σημείωση: Αν οι στήλες καθαριστή δεν υπάρχουν στη βάση, εκτελέστε το Migration 006 στο Supabase SQL Editor.')
    }
  }

  // Summary counts
  const todayCount = cleaningTasks.filter(t => isSameDay(t.date, new Date())).length
  const turnaroundCount = cleaningTasks.filter(t => t.isTurnaround && t.date >= startOfDay(new Date())).length
  const totalUpcomingFees = cleaningTasks
    .filter(t => t.date >= startOfDay(new Date()) && t.date <= addDays(new Date(), 30))
    .reduce((sum, t) => sum + t.cleaningFee, 0)

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-gray-500 text-sm">Φόρτωση προγράμματος καθαρισμών...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 bg-teal-50 border border-teal-200 text-teal-700 px-3 py-1 rounded-full text-xs font-semibold mb-1">
            <Sparkles size={14} className="text-teal-600" />
            <span>Smart Cleaning Operations & Turnaround Hub</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
            Διαχείριση & Πρόγραμμα Καθαριστριών
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Αυτόματος προγραμματισμός καθαρισμών, αποστολή μηνιαίου προγράμματος και ημερήσιες υπενθυμίσεις WhatsApp.
          </p>
        </div>

        {/* Action Buttons: Cleaners Manager & Monthly Dispatch */}
        <div className="flex items-center gap-2 flex-wrap self-start sm:self-auto">
          <button
            onClick={() => setShowCleanersManagerModal(true)}
            className="flex items-center gap-1.5 bg-white hover:bg-gray-50 text-gray-800 border border-gray-200 px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all shadow-2xs"
          >
            <User size={15} className="text-teal-600" />
            <span>👤 Στοιχεία Καθαριστών</span>
          </button>

          <button
            onClick={() => {
              if (!isProUser(userEmail)) {
                setShowProModal(true)
              } else {
                setShowMonthlyModal(true)
              }
            }}
            className="flex items-center gap-2 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white px-4 py-2.5 rounded-2xl text-xs font-extrabold transition-all shadow-md shadow-teal-600/20"
          >
            {!isProUser(userEmail) && <span className="text-[10px]">⭐</span>}
            <CalendarDays size={16} />
            <span>📅 Αποστολή Μηνιαίου Προγράμματος</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Today's cleanings */}
        <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center font-black text-xl shrink-0">
            🧹
          </div>
          <div>
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Καθαρισμοί Σήμερα</span>
            <div className="text-2xl font-extrabold text-gray-900 mt-0.5">{todayCount}</div>
          </div>
        </div>

        {/* Turnaround alerts */}
        <div className="bg-white rounded-3xl p-5 border border-amber-200 bg-amber-50/20 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center font-black text-xl shrink-0">
            ⚠️
          </div>
          <div>
            <span className="text-xs font-bold text-amber-800 uppercase tracking-wider">Same-Day Turnarounds</span>
            <div className="text-2xl font-extrabold text-amber-900 mt-0.5">{turnaroundCount}</div>
          </div>
        </div>

        {/* Total cleaning fees upcoming */}
        <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-black text-xl shrink-0">
            💰
          </div>
          <div>
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Προϋπολογισμός (30ημ.)</span>
            <div className="text-2xl font-extrabold text-blue-900 mt-0.5">€{totalUpcomingFees.toLocaleString('el-GR')}</div>
          </div>
        </div>
      </div>

      {/* Filter Tabs & Property Selector */}
      <div className="bg-white rounded-3xl p-4 shadow-sm border border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Period Filter Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setFilterPeriod('upcoming')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              filterPeriod === 'upcoming'
                ? 'bg-teal-600 text-white shadow-sm'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Επόμενες 14 Ημέρες
          </button>
          <button
            onClick={() => setFilterPeriod('today')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              filterPeriod === 'today'
                ? 'bg-teal-600 text-white shadow-sm'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Σήμερα ({todayCount})
          </button>
          <button
            onClick={() => setFilterPeriod('turnaround')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              filterPeriod === 'turnaround'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
            }`}
          >
            <AlertTriangle size={13} />
            <span>Turnarounds ({turnaroundCount})</span>
          </button>
          <button
            onClick={() => setFilterPeriod('all')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              filterPeriod === 'all'
                ? 'bg-teal-600 text-white shadow-sm'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Όλοι οι Καθαρισμοί
          </button>
        </div>

        {/* Property Dropdown Filter */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-gray-500 shrink-0">Ακίνητο:</span>
          <select
            value={selectedPropertyFilter}
            onChange={e => setSelectedPropertyFilter(e.target.value)}
            className="border border-gray-300 rounded-xl px-3 py-1.5 text-xs font-semibold text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            <option value="all">Όλα τα ακίνητα ({properties.length})</option>
            {properties.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Task List */}
      <div className="space-y-3">
        {filteredTasks.length === 0 ? (
          <div className="bg-white rounded-3xl p-10 text-center border border-gray-100 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center text-2xl mx-auto">
              ✨
            </div>
            <h3 className="font-bold text-gray-900 text-base">Δεν βρέθηκαν καθαρισμοί για αυτό το διάστημα!</h3>
            <p className="text-xs text-gray-500 max-w-md mx-auto">
              Οι καθαρισμοί δημιουργούνται αυτόματα βάσει των check-outs των κρατήσεων σας.
            </p>
          </div>
        ) : (
          filteredTasks.map(task => {
            const isTaskToday = isToday(task.date)
            const isTaskTomorrow = isTomorrow(task.date)

            return (
              <div
                key={task.id}
                className={`bg-white rounded-3xl p-5 border transition-all shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                  task.isTurnaround
                    ? 'border-amber-300 bg-gradient-to-r from-amber-50/40 via-white to-white'
                    : isTaskToday
                    ? 'border-teal-300 ring-1 ring-teal-300/40'
                    : 'border-gray-100 hover:border-gray-200'
                }`}
              >
                {/* Left: Date & Property Info */}
                <div className="flex items-start gap-4">
                  {/* Date badge */}
                  <div className={`rounded-2xl p-3 text-center min-w-[70px] shrink-0 border ${
                    isTaskToday
                      ? 'bg-teal-600 text-white border-teal-600'
                      : isTaskTomorrow
                      ? 'bg-teal-50 text-teal-900 border-teal-200'
                      : 'bg-gray-50 text-gray-800 border-gray-200'
                  }`}>
                    <div className="text-[10px] font-bold uppercase tracking-wider opacity-80">
                      {format(task.date, 'EEE', { locale: el })}
                    </div>
                    <div className="text-xl font-extrabold leading-tight">
                      {format(task.date, 'dd')}
                    </div>
                    <div className="text-[10px] font-medium opacity-80">
                      {format(task.date, 'MMM', { locale: el })}
                    </div>
                  </div>

                  {/* Property & Flow Details */}
                  <div className="space-y-1.5">
                    <div className="flex items-center flex-wrap gap-2">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: task.property.color }} />
                        <span className="font-extrabold text-gray-900 text-sm sm:text-base">{task.property.name}</span>
                      </div>

                      {task.isTurnaround && (
                        <span className="bg-amber-100 border border-amber-300 text-amber-900 font-extrabold text-[10px] px-2.5 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
                          <AlertTriangle size={11} className="text-amber-600" />
                          <span>Same-Day Turnaround</span>
                        </span>
                      )}

                      {task.cleaningFee > 0 && (
                        <span className="bg-teal-50 border border-teal-200 text-teal-700 text-xs font-bold px-2 py-0.5 rounded-md">
                          €{task.cleaningFee}
                        </span>
                      )}
                    </div>

                    {/* Flow details */}
                    <div className="text-xs text-gray-600 flex items-center flex-wrap gap-x-4 gap-y-1">
                      <div className="flex items-center gap-1">
                        <span className="text-gray-400">Check-out:</span>
                        <strong className="text-gray-800">
                          {task.checkoutBooking?.guest_name || 'Επισκέπτης'} ({task.property.check_out_time || '11:00'})
                        </strong>
                      </div>

                      {task.isTurnaround && task.nextCheckinBooking ? (
                        <div className="flex items-center gap-1 text-amber-700 font-bold">
                          <span>➔ Check-in:</span>
                          <span>{task.nextCheckinBooking.guest_name || 'Νέος Επισκέπτης'} ({task.property.check_in_time || '15:00'})</span>
                        </div>
                      ) : (
                        <div className="text-gray-400 text-[11px]">
                          (Επόμενη άφιξη: Δεν υπάρχει την ίδια μέρα)
                        </div>
                      )}
                    </div>

                    {/* Cleaner assigned */}
                    <div className="text-[11px] text-gray-500 flex items-center flex-wrap gap-2 pt-0.5">
                      <span>Καθαριστής:</span>
                      {task.property.cleaner_name ? (
                        <span className="font-semibold text-gray-800 flex items-center gap-1.5 bg-gray-50 px-2 py-0.5 rounded-lg border border-gray-200">
                          <User size={12} className="text-teal-600" />
                          <span>{task.property.cleaner_name}</span>
                          {task.property.cleaner_phone && <span className="text-gray-500 font-mono">({task.property.cleaner_phone})</span>}
                          <button
                            type="button"
                            onClick={() => {
                              setEditingCleanerProp(task.property)
                              setCleanerForm({ name: task.property.cleaner_name || '', phone: task.property.cleaner_phone || '' })
                            }}
                            className="text-[10px] text-blue-600 hover:text-blue-800 font-bold ml-1.5 hover:underline inline-flex items-center gap-0.5"
                          >
                            <Edit3 size={10} />
                            <span>Επεξεργασία</span>
                          </button>
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setEditingCleanerProp(task.property)
                            setCleanerForm({ name: task.property.cleaner_name || '', phone: task.property.cleaner_phone || '' })
                          }}
                          className="text-xs text-blue-600 font-bold hover:underline inline-flex items-center gap-1 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-100"
                        >
                          <Edit3 size={12} />
                          <span>+ Ορισμός Καθαριστή</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-2 shrink-0 self-end md:self-center pt-2 md:pt-0">
                  {/* Status Toggle Button */}
                  <button
                    onClick={() => toggleTaskStatus(task.id, task.status)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all border flex items-center gap-1.5 ${
                      task.status === 'completed'
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                        : task.status === 'in_progress'
                        ? 'bg-blue-50 border-blue-300 text-blue-800'
                        : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {task.status === 'completed' ? (
                      <>
                        <CheckCircle2 size={14} className="text-emerald-600" />
                        <span>Ολοκληρώθηκε ✓</span>
                      </>
                    ) : task.status === 'in_progress' ? (
                      <>
                        <Clock size={14} className="text-blue-600" />
                        <span>Σε Εξέλιξη...</span>
                      </>
                    ) : (
                      <>
                        <Clock size={14} className="text-gray-400" />
                        <span>Εκκρεμεί</span>
                      </>
                    )}
                  </button>

                  {/* 1-Click WhatsApp Reminder Button */}
                  {isTaskToday ? (
                    <button
                      onClick={() => dispatchToCleaner(task, true)}
                      className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-600 text-white font-bold px-3.5 py-2 rounded-xl text-xs transition-all shadow-sm shadow-amber-500/20"
                      title="Αποστολή πρωινής υπενθύμισης WhatsApp"
                    >
                      <Bell size={13} />
                      <span>🔔 Υπενθύμιση Σήμερα</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => dispatchToCleaner(task, false)}
                      className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3.5 py-2 rounded-xl text-xs transition-all shadow-sm shadow-emerald-600/20"
                      title="Αποστολή εντολής καθαρισμού μέσω WhatsApp"
                    >
                      <Send size={13} />
                      <span>WhatsApp</span>
                    </button>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Monthly Dispatch Modal */}
      {showMonthlyModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-lg w-full space-y-5 shadow-2xl animate-in zoom-in-95 duration-150 border border-gray-100 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2.5">
                <span className="text-2xl">📅</span>
                <div>
                  <h3 className="font-extrabold text-gray-900 text-base">Αποστολή Μηνιαίου Προγράμματος</h3>
                  <p className="text-xs text-gray-500">Συγκεντρωτική λίστα όλων των καθαρισμών του μήνα</p>
                </div>
              </div>
              <button onClick={() => setShowMonthlyModal(false)} className="text-gray-400 hover:text-gray-600 font-bold">
                ✕
              </button>
            </div>

            {/* Selector controls */}
            <div className="grid grid-cols-2 gap-3 bg-gray-50 p-3 rounded-2xl border border-gray-200/80">
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Ακίνητο</label>
                <select
                  value={monthlyPropertyId}
                  onChange={e => setMonthlyPropertyId(e.target.value)}
                  className="w-full border border-gray-300 rounded-xl px-2.5 py-1.5 text-xs font-bold text-gray-900 bg-white"
                >
                  {properties.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Μήνας</label>
                <select
                  value={selectedMonth}
                  onChange={e => setSelectedMonth(Number(e.target.value))}
                  className="w-full border border-gray-300 rounded-xl px-2.5 py-1.5 text-xs font-bold text-gray-900 bg-white"
                >
                  {MONTH_NAMES.map((m, idx) => (
                    <option key={idx} value={idx}>{m} {selectedYear}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Generated Message Preview */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold text-gray-700">Προεπισκόπηση Μηνύματος ({monthlyTasks.length} καθαρισμοί):</span>
                <button
                  type="button"
                  onClick={copyMonthlyMessage}
                  className="text-xs font-bold text-teal-600 hover:underline flex items-center gap-1"
                >
                  {monthlyCopied ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                  <span>{monthlyCopied ? 'Αντιγράφηκε!' : 'Αντιγραφή'}</span>
                </button>
              </div>

              <textarea
                readOnly
                rows={9}
                value={monthlyMessageText}
                className="w-full font-sans text-xs text-gray-900 bg-gray-50 border border-gray-200 rounded-2xl p-3.5 leading-relaxed focus:outline-none"
              />
            </div>

            {/* Action buttons */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <button
                type="button"
                onClick={copyMonthlyMessage}
                className="flex items-center justify-center gap-1.5 bg-gray-900 hover:bg-black text-white font-bold py-3 px-4 rounded-2xl text-xs transition-colors shadow-sm"
              >
                {monthlyCopied ? <Check size={15} /> : <Copy size={15} />}
                <span>{monthlyCopied ? 'Αντιγράφηκε!' : 'Αντιγραφή Κειμένου'}</span>
              </button>

              <button
                type="button"
                onClick={sendMonthlyWhatsApp}
                className="flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-4 rounded-2xl text-xs transition-colors shadow-sm shadow-emerald-600/20"
              >
                <Send size={15} />
                <span>Αποστολή WhatsApp</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Set Cleaner Modal */}
      {editingCleanerProp && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl animate-in zoom-in-95 duration-150">
            <div>
              <h3 className="font-extrabold text-gray-900 text-base">Στοιχεία Καθαριστή: {editingCleanerProp.name}</h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Ορίστε όνομα και τηλέφωνο για άμεση αποστολή WhatsApp με 1 κλικ.
              </p>
            </div>

            <form onSubmit={handleSaveCleaner} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Όνομα Καθαριστή / Συνεργείου</label>
                <input
                  value={cleanerForm.name}
                  onChange={e => setCleanerForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="π.χ. Μαρία Καθαρισμοί"
                  className="w-full border border-gray-300 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Τηλέφωνο WhatsApp / Κινητό</label>
                <input
                  value={cleanerForm.phone}
                  onChange={e => setCleanerForm(f => ({ ...f, phone: e.target.value }))}
                  placeholder="π.χ. 6971234567"
                  className="w-full border border-gray-300 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingCleanerProp(null)}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 rounded-xl text-xs font-bold transition-colors"
                >
                  Ακύρωση
                </button>
                <button
                  type="submit"
                  disabled={savingCleaner}
                  className="flex-1 bg-teal-600 hover:bg-teal-700 text-white py-2 rounded-xl text-xs font-bold transition-colors disabled:opacity-50"
                >
                  {savingCleaner ? 'Αποθήκευση...' : 'Αποθήκευση'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Cleaners Manager Modal */}
      {showCleanersManagerModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full space-y-5 shadow-2xl animate-in zoom-in-95 duration-150 border border-gray-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">👤</span>
                <div>
                  <h3 className="font-extrabold text-gray-900 text-base">Συνεργάτες Καθαρισμού</h3>
                  <p className="text-xs text-gray-500">Στοιχεία επικοινωνίας ανά ακίνητο</p>
                </div>
              </div>
              <button onClick={() => setShowCleanersManagerModal(false)} className="text-gray-400 hover:text-gray-600 font-bold">
                ✕
              </button>
            </div>

            <div className="space-y-3">
              {properties.map(prop => (
                <div key={prop.id} className="bg-gray-50 border border-gray-200/80 rounded-2xl p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: prop.color }} />
                      <span className="font-bold text-gray-900 text-sm">{prop.name}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setShowCleanersManagerModal(false)
                        setEditingCleanerProp(prop)
                        setCleanerForm({ name: prop.cleaner_name || '', phone: prop.cleaner_phone || '' })
                      }}
                      className="text-xs font-bold text-teal-700 hover:text-teal-900 bg-teal-50 hover:bg-teal-100 border border-teal-200 px-3 py-1 rounded-xl transition-colors inline-flex items-center gap-1"
                    >
                      <Edit3 size={12} />
                      <span>{prop.cleaner_name ? 'Επεξεργασία' : '+ Ορισμός'}</span>
                    </button>
                  </div>

                  <div className="text-xs text-gray-600 space-y-0.5 pt-1">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Όνομα:</span>
                      <strong className="text-gray-800">{prop.cleaner_name || '—'}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Τηλέφωνο / WhatsApp:</span>
                      <strong className="text-gray-800 font-mono">{prop.cleaner_phone || '—'}</strong>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setShowCleanersManagerModal(false)}
              className="w-full bg-gray-900 hover:bg-black text-white font-bold py-2.5 rounded-2xl text-xs transition-colors"
            >
              Κλείσιμο
            </button>
          </div>
        </div>
      )}

      {/* Pro Upgrade Modal */}
      <ProFeatureModal
        isOpen={showProModal}
        onClose={() => setShowProModal(false)}
        featureTitle="Μηνιαίο Πρόγραμμα Καθαρισμών (Pro)"
        featureDescription="Αναβαθμίστε στο πακέτο Pro για να στέλνετε συγκεντρωτικά ολόκληρο το μηνιαίο πρόγραμμα καθαρισμών στην καθαρίστρια με 1 κλικ στο WhatsApp!"
      />
    </div>
  )
}
