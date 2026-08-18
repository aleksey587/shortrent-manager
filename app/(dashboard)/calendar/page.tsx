'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, startOfWeek, endOfWeek, isSameMonth, isToday, isSameDay, parseISO } from 'date-fns'
import { el } from 'date-fns/locale'

interface Booking {
  id: string
  property_id: string
  guest_name: string | null
  check_in: string
  check_out: string
  platform: string
  total_price: number | null
}

interface Property {
  id: string
  name: string
  color: string
}

export default function CalendarPage() {
  const supabase = createClient()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [properties, setProperties] = useState<Property[]>([])
  const [selectedProperties, setSelectedProperties] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)

  useEffect(() => { fetchData() }, [])

  async function fetchData() {
    setLoading(true)
    const [{ data: props }, { data: books }] = await Promise.all([
      supabase.from('properties').select('id, name, color').order('created_at'),
      supabase.from('bookings').select('id, property_id, guest_name, check_in, check_out, platform, total_price'),
    ])
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

  // Generate calendar grid
  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 })
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 })
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd })

  // Get bookings for a specific day
  const getBookingsForDay = (day: Date) => {
    return bookings.filter(b => {
      if (!selectedProperties.has(b.property_id)) return false
      const checkIn = parseISO(b.check_in)
      const checkOut = parseISO(b.check_out)
      return day >= checkIn && day < checkOut
    })
  }

  const prevMonth = () => setCurrentDate(d => new Date(d.getFullYear(), d.getMonth() - 1, 1))
  const nextMonth = () => setCurrentDate(d => new Date(d.getFullYear(), d.getMonth() + 1, 1))

  if (loading) return (
    <div className="flex items-center justify-center h-64 text-gray-400">
      <RefreshCw className="animate-spin mr-2" size={20} /> Φόρτωση...
    </div>
  )

  const WEEKDAYS = ['Δευ', 'Τρί', 'Τετ', 'Πέμ', 'Παρ', 'Σάβ', 'Κυρ']

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Ημερολόγιο</h1>
          <p className="text-gray-500 text-sm mt-0.5">Όλες οι κρατήσεις σε ένα ημερολόγιο</p>
        </div>
        {/* Property filter pills */}
        <div className="flex flex-wrap gap-2">
          {properties.map(prop => (
            <button
              key={prop.id}
              onClick={() => toggleProperty(prop.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${
                selectedProperties.has(prop.id)
                  ? 'border-transparent text-white shadow-sm'
                  : 'border-gray-200 text-gray-400 bg-white'
              }`}
              style={selectedProperties.has(prop.id) ? { backgroundColor: prop.color } : {}}
            >
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: selectedProperties.has(prop.id) ? 'rgba(255,255,255,0.7)' : prop.color }}
              />
              {prop.name}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Calendar header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <button onClick={prevMonth} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
            <ChevronLeft size={18} />
          </button>
          <h2 className="font-semibold text-gray-900 capitalize">
            {format(currentDate, 'MMMM yyyy', { locale: el })}
          </h2>
          <button onClick={nextMonth} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
            <ChevronRight size={18} />
          </button>
        </div>

        {/* Weekday labels */}
        <div className="grid grid-cols-7 border-b border-gray-100">
          {WEEKDAYS.map(day => (
            <div key={day} className="px-2 py-2 text-center text-xs font-semibold text-gray-400 uppercase tracking-wide">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7">
          {calendarDays.map((day, idx) => {
            const dayBookings = getBookingsForDay(day)
            const isCurrentMonth = isSameMonth(day, currentDate)
            const isCurrentDay = isToday(day)

            return (
              <div
                key={idx}
                className={`min-h-[80px] p-1.5 border-b border-r border-gray-50 ${
                  !isCurrentMonth ? 'bg-gray-50/50' : ''
                } ${idx % 7 === 6 ? 'border-r-0' : ''}`}
              >
                <div className={`text-xs font-medium mb-1 w-6 h-6 flex items-center justify-center rounded-full ${
                  isCurrentDay
                    ? 'bg-blue-600 text-white'
                    : isCurrentMonth
                    ? 'text-gray-700'
                    : 'text-gray-300'
                }`}>
                  {format(day, 'd')}
                </div>

                <div className="space-y-0.5">
                  {dayBookings.slice(0, 3).map(b => {
                    const prop = properties.find(p => p.id === b.property_id)
                    return (
                      <button
                        key={b.id}
                        onClick={() => setSelectedBooking(b)}
                        className="w-full text-left px-1.5 py-0.5 rounded text-xs font-medium truncate text-white hover:opacity-80 transition-opacity"
                        style={{ backgroundColor: prop?.color ?? '#3b82f6' }}
                        title={b.guest_name || prop?.name}
                      >
                        {b.guest_name || prop?.name || 'Κράτηση'}
                      </button>
                    )
                  })}
                  {dayBookings.length > 3 && (
                    <div className="text-xs text-gray-400 px-1">+{dayBookings.length - 3}</div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Legend */}
      {properties.length > 0 && (
        <div className="flex flex-wrap gap-3">
          {properties.map(prop => (
            <div key={prop.id} className="flex items-center gap-1.5 text-xs text-gray-500">
              <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: prop.color }} />
              {prop.name}
            </div>
          ))}
        </div>
      )}

      {/* Booking detail modal */}
      {selectedBooking && (
        <div
          className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedBooking(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full"
            onClick={e => e.stopPropagation()}
          >
            <h3 className="font-semibold text-gray-900 mb-4">📅 Λεπτομέρειες Κράτησης</h3>
            {(() => {
              const b = selectedBooking
              const prop = properties.find(p => p.id === b.property_id)
              const nights = Math.ceil(
                (new Date(b.check_out).getTime() - new Date(b.check_in).getTime()) / 86400000
              )
              return (
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Ακίνητο</span>
                    <span className="font-medium flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: prop?.color }} />
                      {prop?.name}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Επισκέπτης</span>
                    <span className="font-medium">{b.guest_name || '—'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Check-in</span>
                    <span className="font-medium">{format(parseISO(b.check_in), 'd MMM yyyy', { locale: el })}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Check-out</span>
                    <span className="font-medium">{format(parseISO(b.check_out), 'd MMM yyyy', { locale: el })}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Νύχτες</span>
                    <span className="font-medium">{nights}</span>
                  </div>
                  {b.total_price && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Σύνολο</span>
                      <span className="font-semibold text-green-700">€{b.total_price.toLocaleString('el-GR', { minimumFractionDigits: 2 })}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-500">Πλατφόρμα</span>
                    <span className="font-medium capitalize">{b.platform}</span>
                  </div>
                </div>
              )
            })()}
            <button
              onClick={() => setSelectedBooking(null)}
              className="w-full mt-5 py-2 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50"
            >
              Κλείσιμο
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
