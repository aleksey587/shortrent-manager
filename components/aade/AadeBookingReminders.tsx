'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getBookingDeclarationDeadline, getBookingDeadlineStatus } from '@/lib/aade'
import { format, parseISO } from 'date-fns'
import { el } from 'date-fns/locale'
import { AlertCircle, CheckCircle2, Clock, Bell } from 'lucide-react'
import Link from 'next/link'

interface Booking {
  id: string
  property_id: string
  guest_name: string | null
  check_out: string
  total_price: number | null
  platform: string
  aade_declared: boolean
}

interface Property {
  id: string
  name: string
  color: string
}

export default function AadeBookingReminders() {
  const supabase = createClient()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [marking, setMarking] = useState<string | null>(null)

  useEffect(() => { fetchData() }, [])

  async function fetchData() {
    setLoading(true)
    const [{ data: props }, { data: books }] = await Promise.all([
      supabase.from('properties').select('id, name, color'),
      supabase
        .from('bookings')
        .select('id, property_id, guest_name, check_out, total_price, platform, aade_declared')
        .lte('check_out', new Date().toISOString().split('T')[0]) // only past checkouts
        .order('check_out', { ascending: false })
        .limit(50),
    ])
    setProperties(props ?? [])
    setBookings(books ?? [])
    setLoading(false)
  }

  async function toggleDeclared(bookingId: string, current: boolean) {
    setMarking(bookingId)
    await supabase
      .from('bookings')
      .update({ aade_declared: !current })
      .eq('id', bookingId)
    setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, aade_declared: !current } : b))
    setMarking(null)
  }

  const pendingBookings = bookings.filter(b => !b.aade_declared)
  const declaredBookings = bookings.filter(b => b.aade_declared)

  if (loading) return <div className="text-gray-400 text-sm py-4">Φόρτωση...</div>

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center gap-2 mb-1">
        <Bell size={18} className="text-orange-500" />
        <h2 className="font-semibold text-gray-900">Εκκρεμείς Δηλώσεις ανά Κράτηση</h2>
      </div>
      <p className="text-sm text-gray-500 mb-5">
        Κάθε κράτηση πρέπει να δηλωθεί στην ΑΑΔΕ έως την <strong>20ή του επόμενου μήνα</strong> από αναχώρηση.
      </p>

      {pendingBookings.length === 0 ? (
        <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl p-4">
          <CheckCircle2 size={18} className="text-green-500" />
          <p className="text-green-700 text-sm font-medium">Όλες οι κρατήσεις έχουν δηλωθεί! ✓</p>
        </div>
      ) : (
        <div className="space-y-2 mb-6">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
            Εκκρεμείς ({pendingBookings.length})
          </p>
          {pendingBookings.map(booking => {
            const prop = properties.find(p => p.id === booking.property_id)
            const checkOut = parseISO(booking.check_out)
            const { deadline, daysLeft, isOverdue, status } = getBookingDeadlineStatus(checkOut)

            return (
              <div key={booking.id} className={`flex items-center gap-3 p-3 rounded-xl border ${
                status === 'overdue' ? 'border-red-200 bg-red-50'
                : status === 'urgent' ? 'border-orange-200 bg-orange-50'
                : status === 'upcoming' ? 'border-yellow-200 bg-yellow-50'
                : 'border-gray-100 bg-gray-50'
              }`}>
                {status === 'overdue'
                  ? <AlertCircle size={16} className="text-red-500 shrink-0" />
                  : <Clock size={16} className="text-orange-400 shrink-0" />
                }
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: prop?.color ?? '#3b82f6' }}
                    />
                    <span className="text-sm font-medium text-gray-900 truncate">
                      {prop?.name} {booking.guest_name ? `— ${booking.guest_name}` : ''}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Checkout: {format(checkOut, 'd MMM yyyy', { locale: el })} ·{' '}
                    Deadline ΑΑΔΕ: {format(deadline, 'd MMM yyyy', { locale: el })}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                    status === 'overdue' ? 'bg-red-100 text-red-700'
                    : status === 'urgent' ? 'bg-orange-100 text-orange-700'
                    : status === 'upcoming' ? 'bg-yellow-100 text-yellow-700'
                    : 'bg-gray-100 text-gray-600'
                  }`}>
                    {isOverdue ? `${Math.abs(daysLeft)}μ εκπρόθεσμη` : `${daysLeft} μέρες`}
                  </span>
                  <button
                    onClick={() => toggleDeclared(booking.id, false)}
                    disabled={marking === booking.id}
                    className="text-xs px-2.5 py-1 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50"
                  >
                    {marking === booking.id ? '...' : '✓ Δηλώθηκε'}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {declaredBookings.length > 0 && (
        <details className="group">
          <summary className="text-xs font-semibold text-gray-400 uppercase tracking-wide cursor-pointer hover:text-gray-600 select-none">
            Δηλωμένες ({declaredBookings.length}) ▸
          </summary>
          <div className="mt-2 space-y-1.5">
            {declaredBookings.slice(0, 10).map(booking => {
              const prop = properties.find(p => p.id === booking.property_id)
              return (
                <div key={booking.id} className="flex items-center gap-3 p-2.5 rounded-xl border border-green-100 bg-green-50">
                  <CheckCircle2 size={14} className="text-green-500 shrink-0" />
                  <span className="text-xs text-green-700 flex-1 truncate">
                    {prop?.name} {booking.guest_name ? `— ${booking.guest_name}` : ''} · checkout {format(parseISO(booking.check_out), 'd MMM', { locale: el })}
                  </span>
                  <button
                    onClick={() => toggleDeclared(booking.id, true)}
                    className="text-xs text-gray-400 hover:text-red-500"
                  >
                    Αναίρεση
                  </button>
                </div>
              )
            })}
          </div>
        </details>
      )}
    </div>
  )
}
