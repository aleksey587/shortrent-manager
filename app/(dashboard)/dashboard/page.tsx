import { createClient } from '@/lib/supabase/server'
import { Home, Calendar, TrendingUp, AlertCircle } from 'lucide-react'
import { getUpcomingDeadlines } from '@/lib/aade'
import { format } from 'date-fns'
import { el } from 'date-fns/locale'
import Link from 'next/link'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Fetch stats
  const [{ data: properties }, { data: bookings }] = await Promise.all([
    supabase.from('properties').select('id, name, color'),
    supabase
      .from('bookings')
      .select('id, check_in, check_out, total_price, property_id')
      .gte('check_in', new Date(new Date().getFullYear(), 0, 1).toISOString()),
  ])

  const totalProperties = properties?.length ?? 0
  const totalBookings = bookings?.length ?? 0
  const totalIncome = bookings?.reduce((sum, b) => sum + (b.total_price ?? 0), 0) ?? 0

  // Upcoming bookings (next 30 days)
  const today = new Date()
  const in30days = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000)
  const upcomingBookings = bookings
    ?.filter(b => new Date(b.check_in) >= today && new Date(b.check_in) <= in30days)
    .sort((a, b) => new Date(a.check_in).getTime() - new Date(b.check_in).getTime())
    .slice(0, 5) ?? []

  // ΑΑΔΕ deadlines
  const deadlines = getUpcomingDeadlines(4)
  const nextDeadline = deadlines.find(d => !d.isOverdue)
  const overdueDeadlines = deadlines.filter(d => d.isOverdue)

  const statCards = [
    {
      label: 'Ακίνητα',
      value: totalProperties,
      icon: Home,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      href: '/dashboard/properties',
    },
    {
      label: 'Κρατήσεις (φέτος)',
      value: totalBookings,
      icon: Calendar,
      color: 'text-green-600',
      bg: 'bg-green-50',
      href: '/dashboard/bookings',
    },
    {
      label: 'Έσοδα (φέτος)',
      value: `€${totalIncome.toLocaleString('el-GR', { minimumFractionDigits: 2 })}`,
      icon: TrendingUp,
      color: 'text-purple-600',
      bg: 'bg-purple-50',
      href: '/dashboard/aade',
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Επισκόπηση</h1>
        <p className="text-gray-500 text-sm mt-0.5">
          {format(today, "EEEE, d MMMM yyyy", { locale: el })}
        </p>
      </div>

      {/* Overdue ΑΑΔΕ Alert */}
      {overdueDeadlines.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="text-red-500 mt-0.5 shrink-0" size={20} />
          <div>
            <p className="font-semibold text-red-700 text-sm">
              {overdueDeadlines.length === 1
                ? 'Εκπρόθεσμη δήλωση ΑΑΔΕ!'
                : `${overdueDeadlines.length} εκπρόθεσμες δηλώσεις ΑΑΔΕ!`}
            </p>
            <p className="text-red-600 text-xs mt-0.5">
              {overdueDeadlines.map(d => d.label).join(', ')} — Υποβάλετε άμεσα
            </p>
            <Link href="/dashboard/aade" className="text-red-700 underline text-xs font-medium mt-1 inline-block">
              Πηγαίνετε στο ΑΑΔΕ Dashboard →
            </Link>
          </div>
        </div>
      )}

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {statCards.map(({ label, value, icon: Icon, color, bg, href }) => (
          <Link key={label} href={href}>
            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className={`inline-flex p-2.5 rounded-xl ${bg} mb-3`}>
                <Icon className={color} size={22} />
              </div>
              <div className="text-2xl font-bold text-gray-900">{value}</div>
              <div className="text-sm text-gray-500 mt-0.5">{label}</div>
            </div>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Next ΑΑΔΕ Deadline */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <AlertCircle size={18} className="text-orange-500" />
            Επόμενο Deadline ΑΑΔΕ
          </h2>
          {nextDeadline ? (
            <div>
              <div className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold mb-3 ${
                nextDeadline.status === 'urgent'
                  ? 'bg-red-100 text-red-700'
                  : nextDeadline.status === 'upcoming'
                  ? 'bg-orange-100 text-orange-700'
                  : 'bg-green-100 text-green-700'
              }`}>
                {nextDeadline.daysLeft === 0
                  ? '⚠️ Σήμερα!'
                  : nextDeadline.daysLeft === 1
                  ? '⚠️ Αύριο!'
                  : `${nextDeadline.daysLeft} μέρες`}
              </div>
              <p className="text-gray-900 font-medium">{nextDeadline.label}</p>
              <p className="text-gray-500 text-sm">
                Deadline: {format(nextDeadline.deadline, 'd MMMM yyyy', { locale: el })}
              </p>
              <Link
                href="/dashboard/aade"
                className="mt-4 inline-flex items-center text-sm text-blue-600 hover:underline font-medium"
              >
                Οδηγίες υποβολής →
              </Link>
            </div>
          ) : (
            <p className="text-gray-500 text-sm">Δεν υπάρχουν επερχόμενα deadlines.</p>
          )}
        </div>

        {/* Upcoming Bookings */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Calendar size={18} className="text-blue-500" />
            Επόμενες Κρατήσεις (30 μέρες)
          </h2>
          {upcomingBookings.length === 0 ? (
            <p className="text-gray-500 text-sm">Δεν υπάρχουν κρατήσεις τις επόμενες 30 μέρες.</p>
          ) : (
            <div className="space-y-3">
              {upcomingBookings.map(booking => {
                const prop = properties?.find(p => p.id === booking.property_id)
                return (
                  <div key={booking.id} className="flex items-center gap-3">
                    <div
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: prop?.color ?? '#3b82f6' }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {prop?.name ?? 'Ακίνητο'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {format(new Date(booking.check_in), 'd MMM', { locale: el })} →{' '}
                        {format(new Date(booking.check_out), 'd MMM yyyy', { locale: el })}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
          <Link
            href="/dashboard/calendar"
            className="mt-4 inline-flex items-center text-sm text-blue-600 hover:underline font-medium"
          >
            Δείτε το ημερολόγιο →
          </Link>
        </div>
      </div>
    </div>
  )
}
