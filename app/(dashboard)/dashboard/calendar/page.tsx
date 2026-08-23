'use client'

import { useEffect, useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  RefreshCw, ChevronLeft, ChevronRight, Calendar as CalendarIcon,
  LayoutGrid, AlignLeft, AlertTriangle, Sparkles, MessageSquare, Send, Check, User, Home
} from 'lucide-react'
import {
  format, startOfMonth, endOfMonth, eachDayOfInterval, startOfWeek, endOfWeek,
  isSameMonth, isToday, isSameDay, parseISO, addMonths, subMonths, addDays, differenceInDays
} from 'date-fns'
import { el } from 'date-fns/locale'
import Link from 'next/link'
import { isProUser } from '@/lib/permissions'
import ProFeatureModal from '@/components/ui/ProFeatureModal'

interface Booking {
  id: string
  property_id: string
  guest_name: string | null
  check_in: string
  check_out: string
  nights?: number
  platform: string
  total_price: number | null
}

interface Property {
  id: string
  name: string
  color: string
}

const PLATFORM_INFO: Record<string, { label: string; bg: string; text: string; dot: string }> = {
  airbnb: { label: 'Airbnb', bg: 'bg-red-50', text: 'text-red-700', dot: '#ef4444' },
  booking: { label: 'Booking.com', bg: 'bg-blue-50', text: 'text-blue-700', dot: '#3b82f6' },
  vrbo: { label: 'VRBO', bg: 'bg-teal-50', text: 'text-teal-700', dot: '#14b8a6' },
  manual: { label: 'Χειροκίνητη', bg: 'bg-purple-50', text: 'text-purple-700', dot: '#a855f7' },
  other: { label: 'Άλλη', bg: 'bg-gray-50', text: 'text-gray-700', dot: '#6b7280' },
}

export default function CalendarPage() {
  const supabase = createClient()
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [bookings, setBookings] = useState<Booking[]>([])
  const [properties, setProperties] = useState<Property[]>([])
  const [selectedProperties, setSelectedProperties] = useState<Set<string>>(new Set())
  const [selectedPlatform, setSelectedPlatform] = useState<string>('all')
  const [viewMode, setViewMode] = useState<'grid' | 'timeline'>('grid')
  const [showProModal, setShowProModal] = useState(false)
  const [loading, setLoading] = useState(true)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)

  useEffect(() => { fetchData() }, [])

  async function fetchData() {
    setLoading(true)
    const [{ data: { user } }, { data: props }, { data: books }] = await Promise.all([
      supabase.auth.getUser(),
      supabase.from('properties').select('id, name, color').order('created_at'),
      supabase.from('bookings').select('id, property_id, guest_name, check_in, check_out, platform, total_price, nights'),
    ])
    if (user?.email) setUserEmail(user.email)
    const fetchedProps = props ?? []
    setProperties(fetchedProps)
    setSelectedProperties(new Set(fetchedProps.map(p => p.id)))
    setBookings(books ?? [])
    setLoading(false)
  }

  const toggleProperty = (id: string) => {
    setSelectedProperties(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  // Filtered bookings
  const filteredBookings = useMemo(() => {
    return bookings.filter(b => {
      if (!selectedProperties.has(b.property_id)) return false
      if (selectedPlatform !== 'all' && b.platform !== selectedPlatform) return false
      return true
    })
  }, [bookings, selectedProperties, selectedPlatform])

  // Turnaround lookup: (property_id:date_string)
  const turnarounds = useMemo(() => {
    const map = new Set<string>()
    filteredBookings.forEach(b1 => {
      const match = filteredBookings.find(b2 => b2.id !== b1.id && b2.property_id === b1.property_id && b2.check_in === b1.check_out)
      if (match) {
        map.add(`${b1.property_id}:${b1.check_out}`)
      }
    })
    return map
  }, [filteredBookings])

  // Calculate seasonal pricing per day
  const getSeasonalRate = (day: Date): number => {
    const month = day.getMonth() + 1 // 1-12
    if (month >= 6 && month <= 9) return 125.0 // Summer
    if (month === 4 || month === 5 || month === 10) return 85.0 // Spring/Autumn
    return 70.0 // Winter
  }

  // Generate calendar grid
  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 })
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 })
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd })

  // Timeline days (all days of current month)
  const timelineDays = eachDayOfInterval({ start: monthStart, end: monthEnd })

  // Get bookings for a specific day
  const getBookingsForDay = (day: Date) => {
    return filteredBookings.filter(b => {
      const checkIn = parseISO(b.check_in)
      const checkOut = parseISO(b.check_out)
      return day >= checkIn && day < checkOut
    })
  }

  const prevMonth = () => setCurrentDate(d => subMonths(d, 1))
  const nextMonth = () => setCurrentDate(d => addMonths(d, 1))

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh] text-gray-400">
      <RefreshCw className="animate-spin mr-2" size={20} /> Φόρτωση ημερολογίου...
    </div>
  )

  const WEEKDAYS = ['Δευ', 'Τρί', 'Τετ', 'Πέμ', 'Παρ', 'Σάβ', 'Κυρ']

  return (
    <div className="space-y-5 max-w-7xl mx-auto pb-10">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 bg-blue-50 border border-blue-200 text-blue-700 px-3 py-1 rounded-full text-xs font-semibold mb-1">
            <Sparkles size={13} className="text-amber-500" />
            <span>Cross-Platform Multi-Calendar</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
            Ενοποιημένο Ημερολόγιο
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">
            Προβολή όλων των κρατήσεων από Airbnb, Booking.com & VRBO με συνεχόμενες μπάρες και τιμές ανά ημέρα.
          </p>
        </div>

        {/* View Switcher: Grid vs Timeline */}
        <div className="flex items-center gap-2 self-start md:self-auto">
          <div className="flex items-center bg-gray-100 p-1.5 rounded-2xl border border-gray-200">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                viewMode === 'grid' ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <LayoutGrid size={14} />
              <span>Πλέγμα Μήνα</span>
            </button>
            <button
              onClick={() => {
                if (!isProUser(userEmail)) {
                  setShowProModal(true)
                } else {
                  setViewMode('timeline')
                }
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                viewMode === 'timeline' ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {!isProUser(userEmail) && <span className="text-[10px]">⭐</span>}
              <AlignLeft size={14} />
              <span>Multi Timeline</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filters Bar: Properties & Platforms */}
      <div className="bg-white rounded-3xl p-4 shadow-sm border border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Property Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider mr-1">Ακίνητα:</span>
          {properties.map(prop => {
            const isSelected = selectedProperties.has(prop.id)
            return (
              <button
                key={prop.id}
                onClick={() => toggleProperty(prop.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all border ${
                  isSelected
                    ? 'text-white shadow-xs'
                    : 'border-gray-200 text-gray-400 bg-white hover:border-gray-300'
                }`}
                style={isSelected ? { backgroundColor: prop.color, borderColor: prop.color } : {}}
              >
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: isSelected ? 'rgba(255,255,255,0.85)' : prop.color }}
                />
                <span>{prop.name}</span>
              </button>
            )
          })}
        </div>

        {/* Platform Dropdown */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs font-bold text-gray-500">Πλατφόρμα:</span>
          <select
            value={selectedPlatform}
            onChange={e => setSelectedPlatform(e.target.value)}
            className="border border-gray-300 rounded-xl px-3 py-1.5 text-xs font-bold text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Όλες οι Πλατφόρμες</option>
            <option value="airbnb">🔴 Airbnb</option>
            <option value="booking">🔵 Booking.com</option>
            <option value="vrbo">🟢 VRBO</option>
            <option value="manual">🟣 Χειροκίνητη</option>
          </select>
        </div>
      </div>

      {/* Main Calendar Card */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Month Navigator */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
          <button onClick={prevMonth} className="p-2 hover:bg-white rounded-xl border border-gray-200/80 transition-colors shadow-2xs">
            <ChevronLeft size={18} />
          </button>
          <div className="text-center">
            <h2 className="font-extrabold text-gray-900 text-base sm:text-lg capitalize">
              {format(currentDate, 'MMMM yyyy', { locale: el })}
            </h2>
            <span className="text-[11px] text-gray-400 font-medium">
              {filteredBookings.length} κρατήσεις καταγεγραμμένες
            </span>
          </div>
          <button onClick={nextMonth} className="p-2 hover:bg-white rounded-xl border border-gray-200/80 transition-colors shadow-2xs">
            <ChevronRight size={18} />
          </button>
        </div>

        {/* VIEW 1: MONTH GRID VIEW WITH CONTINUOUS MULTI-DAY BARS & RATES */}
        {viewMode === 'grid' && (
          <div>
            {/* Weekday labels */}
            <div className="grid grid-cols-7 border-b border-gray-100 bg-gray-50/30">
              {WEEKDAYS.map(day => (
                <div key={day} className="px-2 py-2 text-center text-xs font-bold text-gray-400 uppercase tracking-wide">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar grid cells */}
            <div className="grid grid-cols-7">
              {calendarDays.map((day, idx) => {
                const isCurrentMonth = isSameMonth(day, currentDate)
                const isCurrentDay = isToday(day)
                const dayStr = format(day, 'yyyy-MM-dd')
                const isFirstDayOfWeek = idx % 7 === 0
                const isLastDayOfWeek = idx % 7 === 6

                // Separate check-ins, check-outs, and full-day ongoing stays for this day
                const dayCheckins = filteredBookings.filter(b => isSameDay(parseISO(b.check_in), day))
                const dayCheckouts = filteredBookings.filter(b => isSameDay(parseISO(b.check_out), day))
                const dayOngoings = filteredBookings.filter(b => {
                  const ci = parseISO(b.check_in)
                  const co = parseISO(b.check_out)
                  return day > ci && day < co
                })

                const isTurnaround = dayCheckouts.length > 0 && dayCheckins.length > 0
                const hasAnyBooking = dayCheckins.length > 0 || dayCheckouts.length > 0 || dayOngoings.length > 0
                const seasonalPrice = getSeasonalRate(day)

                const getPlatformBg = (platform: string) => {
                  if (platform === 'airbnb') return 'bg-red-500 hover:bg-red-600 text-white'
                  if (platform === 'booking') return 'bg-blue-600 hover:bg-blue-700 text-white'
                  if (platform === 'vrbo') return 'bg-teal-600 hover:bg-teal-700 text-white'
                  return 'bg-purple-600 hover:bg-purple-700 text-white'
                }

                return (
                  <div
                    key={idx}
                    className={`min-h-[105px] sm:min-h-[115px] p-1.5 border-b border-r border-gray-100 flex flex-col justify-between relative overflow-hidden ${
                      !isCurrentMonth ? 'bg-gray-50/40 text-gray-300' : 'bg-white'
                    } ${idx % 7 === 6 ? 'border-r-0' : ''}`}
                  >
                    <div className="flex items-center justify-between mb-1 z-1">
                      <span className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full ${
                        isCurrentDay
                          ? 'bg-blue-600 text-white shadow-xs'
                          : isCurrentMonth
                          ? 'text-gray-800'
                          : 'text-gray-300'
                      }`}>
                        {format(day, 'd')}
                      </span>

                      {isTurnaround && (
                        <span className="text-[9px] bg-amber-100 text-amber-900 border border-amber-300 px-1 py-0.2 rounded font-extrabold flex items-center gap-0.5" title="Same-Day Turnaround: Αναχώρηση & Άφιξη!">
                          <span>⚡</span>
                          <span className="hidden sm:inline">Turnaround</span>
                        </span>
                      )}
                    </div>

                    {/* Bookings rendering: Full bar or 50/50 Split on Turnaround */}
                    {hasAnyBooking ? (
                      <div className="space-y-1.5 my-auto z-2">
                        {/* CASE 1: Turnaround Day (Same Day Checkout & Checkin) -> 50/50 Split WITH VISUAL GAP */}
                        {isTurnaround ? (
                          <div className="flex items-center w-full h-7 -mx-1 px-0.5 gap-1.5">
                            {/* Left Half: Departing Guest (Checkout morning) -> Points Left ◂ */}
                            {dayCheckouts.slice(0, 1).map(b => (
                              <div
                                key={`out-${b.id}`}
                                onClick={() => setSelectedBooking(b)}
                                className={`flex-1 h-full flex items-center justify-between pl-1.5 pr-2 text-[10px] font-bold shadow-xs cursor-pointer transition-all rounded-r-lg ${getPlatformBg(b.platform)}`}
                                title={`Αναχώρηση (Out): ${b.guest_name || 'Reserved'}`}
                              >
                                <span className="text-[9px] font-black shrink-0">◂</span>
                                <span className="truncate leading-none">{b.guest_name || 'Reserved'}</span>
                              </div>
                            ))}

                            {/* Right Half: Arriving Guest (Checkin afternoon) -> Start Dot ● */}
                            {dayCheckins.slice(0, 1).map(b => (
                              <div
                                key={`in-${b.id}`}
                                onClick={() => setSelectedBooking(b)}
                                className={`flex-1 h-full flex items-center gap-1 pl-1.5 pr-1 text-[10px] font-bold shadow-xs cursor-pointer transition-all rounded-l-lg ${getPlatformBg(b.platform)}`}
                                title={`Άφιξη (In): ${b.guest_name || 'Reserved'}`}
                              >
                                <span className="w-1.5 h-1.5 rounded-full bg-white shrink-0 shadow-2xs" />
                                <span className="truncate leading-none">{b.guest_name || 'Reserved'}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          /* CASE 2: Single Check-in, Check-out or Ongoing Full Day */
                          <>
                            {/* Checkouts without same-day checkin (Occupy left half of cell, points left ◂) */}
                            {dayCheckouts.map(b => (
                              <div
                                key={`co-${b.id}`}
                                onClick={() => setSelectedBooking(b)}
                                className={`cursor-pointer h-7 w-1/2 -ml-1.5 pr-2 pl-1.5 rounded-r-lg flex items-center justify-between text-[10px] font-bold shadow-xs transition-all ${getPlatformBg(b.platform)}`}
                                title={`Αναχώρηση (Check-out): ${b.guest_name || 'Reserved'}`}
                              >
                                <span className="text-[9px] font-black shrink-0">◂</span>
                                <span className="truncate leading-none">{b.guest_name || 'Reserved'}</span>
                              </div>
                            ))}

                            {/* Checkins without same-day checkout (Starts with white dot ●, rounded left, spans right) */}
                            {dayCheckins.map(b => {
                              const checkOutDate = parseISO(b.check_out)
                              const is1Night = differenceInDays(checkOutDate, parseISO(b.check_in)) === 1
                              return (
                                <div
                                  key={`ci-${b.id}`}
                                  onClick={() => setSelectedBooking(b)}
                                  className={`cursor-pointer h-7 flex items-center gap-1 text-[11px] font-bold shadow-xs transition-all ${getPlatformBg(b.platform)} ${
                                    isLastDayOfWeek
                                      ? 'rounded-lg mx-0.5 px-2'
                                      : 'rounded-l-lg -mr-1.5 pl-2 pr-1'
                                  }`}
                                  title={`Άφιξη (Check-in): ${b.guest_name || 'Reserved'}`}
                                >
                                  <span className="w-1.5 h-1.5 rounded-full bg-white shrink-0 shadow-2xs" />
                                  <span className="truncate leading-none">{b.guest_name || 'Reserved'}</span>
                                  {b.nights && (
                                    <span className="text-[9px] opacity-85 font-normal shrink-0">
                                      ({b.nights}ν)
                                    </span>
                                  )}
                                </div>
                              )
                            })}

                            {/* Full-day Ongoing Stays (Middle of booking) */}
                            {dayOngoings.map(b => {
                              return (
                                <div
                                  key={`stay-${b.id}`}
                                  onClick={() => setSelectedBooking(b)}
                                  className={`cursor-pointer h-7 flex items-center gap-1 text-[11px] font-bold shadow-xs transition-all ${getPlatformBg(b.platform)} ${
                                    isFirstDayOfWeek && isLastDayOfWeek
                                      ? 'rounded-lg mx-0.5 px-2'
                                      : isFirstDayOfWeek
                                      ? 'rounded-l-lg -mr-1.5 pl-2 pr-1'
                                      : isLastDayOfWeek
                                      ? 'rounded-r-lg -ml-1.5 pr-2 pl-1'
                                      : 'rounded-none -mx-1.5 px-1'
                                  }`}
                                  title={`${b.guest_name || 'Reserved'} (Διαμονή)`}
                                >
                                  {isFirstDayOfWeek && (
                                    <span className="truncate leading-none pl-1">
                                      {b.guest_name || 'Reserved'}
                                    </span>
                                  )}
                                </div>
                              )
                            })}
                          </>
                        )}
                      </div>
                    ) : (
                      /* Empty Day: Show Daily Seasonal Price */
                      <div className="mt-auto pt-2 flex items-center justify-between text-right">
                        <span className="text-[9px] font-medium text-gray-300">
                          {isCurrentMonth ? 'Κενό' : ''}
                        </span>
                        {isCurrentMonth && (
                          <span className="text-[11px] font-black text-emerald-600 bg-emerald-50 border border-emerald-200/80 px-1.5 py-0.5 rounded-md shadow-2xs">
                            €{seasonalPrice}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* VIEW 2: MULTI-PROPERTY TIMELINE VIEW (Hospitable-style) */}
        {viewMode === 'timeline' && (
          <div className="overflow-x-auto">
            <div className="min-w-[900px]">
              {/* Timeline Day Header */}
              <div className="flex border-b border-gray-200 bg-gray-50/80 sticky top-0 z-10">
                <div className="w-48 p-3 text-xs font-bold text-gray-500 uppercase tracking-wider shrink-0 border-r border-gray-200">
                  Ακίνητο
                </div>
                <div className="flex-1 grid" style={{ gridTemplateColumns: `repeat(${timelineDays.length}, minmax(32px, 1fr))` }}>
                  {timelineDays.map(day => {
                    const isCurrentDay = isToday(day)
                    return (
                      <div
                        key={day.toISOString()}
                        className={`text-center py-2 border-r border-gray-100 text-[11px] font-bold ${
                          isCurrentDay ? 'bg-blue-100/70 text-blue-800 font-extrabold' : 'text-gray-600'
                        }`}
                      >
                        <div className="text-[9px] uppercase text-gray-400 font-medium">{format(day, 'EEE', { locale: el })}</div>
                        <div>{format(day, 'd')}</div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Rows per Property */}
              {properties.filter(p => selectedProperties.has(p.id)).map(prop => {
                return (
                  <div key={prop.id} className="flex border-b border-gray-100 hover:bg-gray-50/30 transition-colors">
                    {/* Property Label */}
                    <div className="w-48 p-3.5 shrink-0 border-r border-gray-200 flex items-center gap-2 bg-white">
                      <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: prop.color }} />
                      <span className="font-extrabold text-xs text-gray-900 truncate">{prop.name}</span>
                    </div>

                    {/* Timeline Day Grid Cells for this Property */}
                    <div className="flex-1 grid relative py-2" style={{ gridTemplateColumns: `repeat(${timelineDays.length}, minmax(32px, 1fr))` }}>
                      {timelineDays.map(day => {
                        const dayStr = format(day, 'yyyy-MM-dd')
                        const hasTurnaround = turnarounds.has(`${prop.id}:${dayStr}`)
                        const isCurrentDay = isToday(day)

                        return (
                          <div
                            key={day.toISOString()}
                            className={`min-h-[46px] border-r border-gray-100/80 flex items-center justify-center ${
                              isCurrentDay ? 'bg-blue-50/30' : ''
                            }`}
                          >
                            {hasTurnaround && (
                              <span className="text-[10px]" title="Same-day turnaround">⚠️</span>
                            )}
                          </div>
                        )
                      })}

                      {/* Render Bookings as Span Bars over Timeline */}
                      {filteredBookings.filter(b => b.property_id === prop.id).map(b => {
                        const start = parseISO(b.check_in)
                        const end = parseISO(b.check_out)

                        // Calculate offset & length relative to current month
                        const startMonthMs = monthStart.getTime()
                        const dayWidthPercent = 100 / timelineDays.length

                        const startIndex = differenceInDays(start, monthStart)
                        const totalDays = differenceInDays(end, start)

                        if (end < monthStart || start > monthEnd) return null

                        const startDayStr = format(start, 'yyyy-MM-dd')
                        const endDayStr = format(end, 'yyyy-MM-dd')
                        const hasTurnaroundAtStart = turnarounds.has(`${prop.id}:${startDayStr}`)
                        const hasTurnaroundAtEnd = turnarounds.has(`${prop.id}:${endDayStr}`)

                        const clampedStart = Math.max(0, startIndex)
                        const clampedEnd = Math.min(timelineDays.length, startIndex + totalDays)
                        const spanDays = Math.max(1, clampedEnd - clampedStart)

                        // Add small gap on turnaround days so bookings do not touch each other
                        const gapSize = dayWidthPercent * 0.12
                        const leftPercent = (clampedStart / timelineDays.length) * 100 + (hasTurnaroundAtStart ? gapSize : 0.1)
                        const widthPercent = Math.max(1, (spanDays / timelineDays.length) * 100 - (hasTurnaroundAtStart ? gapSize : 0) - (hasTurnaroundAtEnd ? gapSize : 0.2))

                        const plat = PLATFORM_INFO[b.platform] || PLATFORM_INFO.other

                        return (
                          <div
                            key={b.id}
                            onClick={() => setSelectedBooking(b)}
                            className="absolute top-2.5 h-8 rounded-xl px-2 flex items-center justify-between gap-1.5 text-[11px] font-bold text-white shadow-sm cursor-pointer transition-transform hover:scale-[1.02] truncate z-2"
                            style={{
                              left: `${leftPercent}%`,
                              width: `${widthPercent}%`,
                              backgroundColor: prop.color,
                            }}
                            title={`${b.guest_name || 'Reserved'} (${b.platform})`}
                          >
                            <div className="flex items-center gap-1.5 min-w-0">
                              {/* Dot / Circle indicator at Check-in start */}
                              <span className="w-2 h-2 rounded-full bg-white shrink-0 shadow-2xs" />
                              <span className="truncate">{b.guest_name || 'Reserved'}</span>
                            </div>

                            {/* Left-pointing arrow ◂ at Check-out end */}
                            <span className="text-[10px] font-black text-white/90 shrink-0 ml-1">
                              ◂
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* Booking Quick Action Drawer / Modal */}
      {selectedBooking && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedBooking(null)}
        >
          <div
            className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full space-y-4 shadow-2xl animate-in zoom-in-95 duration-150 border border-gray-100"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">📋</span>
                <h3 className="font-extrabold text-gray-900 text-base">Λεπτομέρειες Κράτησης</h3>
              </div>
              <button onClick={() => setSelectedBooking(null)} className="text-gray-400 hover:text-gray-600 font-bold">
                ✕
              </button>
            </div>

            <div className="space-y-2.5 text-xs text-gray-700 bg-gray-50/70 p-4 rounded-2xl border border-gray-100">
              <div className="flex justify-between">
                <span className="text-gray-400">Επισκέπτης:</span>
                <strong className="text-gray-900">{selectedBooking.guest_name || '—'}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Ακίνητο:</span>
                <strong className="text-gray-900">{properties.find(p => p.id === selectedBooking.property_id)?.name || '—'}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Πλατφόρμα:</span>
                <span className="font-bold uppercase text-blue-700">{selectedBooking.platform}</span>
              </div>
              <div className="flex justify-between border-t border-gray-200/60 pt-2">
                <span className="text-gray-400">Check-in:</span>
                <strong>{format(parseISO(selectedBooking.check_in), 'dd/MM/yyyy')}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Check-out:</span>
                <strong>{format(parseISO(selectedBooking.check_out), 'dd/MM/yyyy')} ({selectedBooking.nights || '—'} νύχτες)</strong>
              </div>
              {selectedBooking.total_price && (
                <div className="flex justify-between border-t border-gray-200/60 pt-2 font-bold text-emerald-800">
                  <span>Σύνολο Είσπραξης:</span>
                  <span>€{selectedBooking.total_price.toLocaleString('el-GR', { minimumFractionDigits: 2 })}</span>
                </div>
              )}
            </div>

            {/* Quick Actions Bar */}
            <div className="space-y-2 pt-2">
              <span className="text-xs font-bold text-gray-600 block">Άμεσες Ενέργειες:</span>
              <div className="grid grid-cols-2 gap-2">
                <Link
                  href="/dashboard/guest-messages"
                  className="flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-3 rounded-xl text-xs transition-colors shadow-2xs text-center"
                >
                  <MessageSquare size={13} />
                  <span>Μήνυμα Επισκέπτη</span>
                </Link>

                <Link
                  href="/dashboard/cleaning"
                  className="flex items-center justify-center gap-1.5 bg-teal-600 hover:bg-teal-700 text-white font-bold py-2.5 px-3 rounded-xl text-xs transition-colors shadow-2xs text-center"
                >
                  <span>🧹 Καθαρισμοί</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Pro Upgrade Modal */}
      <ProFeatureModal
        isOpen={showProModal}
        onClose={() => setShowProModal(false)}
        featureTitle="Multi-Property Timeline Ημερολόγιο (Pro)"
        featureDescription="Αναβαθμίστε στο πακέτο Pro για να παρακολουθείτε όλα τα ακίνητά σας ταυτόχρονα σε οριζόντιο Timeline, με ένδειξη πλατφορμών και Turnaround flags!"
      />
    </div>
  )
}
