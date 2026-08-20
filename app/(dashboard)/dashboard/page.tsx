import { createClient } from '@/lib/supabase/server'
import { Home, Calendar, TrendingUp, AlertCircle, Euro } from 'lucide-react'
import { getUpcomingDeadlines } from '@/lib/aade'
import { format } from 'date-fns'
import { el } from 'date-fns/locale'
import Link from 'next/link'

const MONTH_NAMES = ['Ιαν', 'Φεβ', 'Μαρ', 'Απρ', 'Μαΐ', 'Ιουν', 'Ιουλ', 'Αυγ', 'Σεπ', 'Οκτ', 'Νοε', 'Δεκ']

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const today = new Date()
  const currentYear = today.getFullYear()
  const currentMonth = today.getMonth() + 1

  // Fetch stats
  const [{ data: properties }, { data: bookingsThisYear }, { data: allBookings }] = await Promise.all([
    supabase.from('properties').select('id, name, color'),
    supabase
      .from('bookings')
      .select('id, check_in, check_out, total_price, property_id, nights')
      .gte('check_in', `${currentYear}-01-01`)
      .lte('check_in', `${currentYear}-12-31`),
    supabase
      .from('bookings')
      .select('id, check_in, check_out, total_price, property_id'),
  ])

  const totalProperties = properties?.length ?? 0
  const totalBookings = bookingsThisYear?.length ?? 0
  const totalIncome = bookingsThisYear?.reduce((sum, b) => sum + (b.total_price ?? 0), 0) ?? 0

  // This month income
  const thisMonthIncome = bookingsThisYear
    ?.filter(b => parseInt(b.check_in.slice(5, 7)) === currentMonth)
    .reduce((sum, b) => sum + (b.total_price ?? 0), 0) ?? 0

  // Monthly income breakdown (12 months of current year)
  const monthlyIncome: number[] = Array(12).fill(0)
  for (const b of bookingsThisYear ?? []) {
    const m = parseInt(b.check_in.slice(5, 7)) - 1
    if (m >= 0 && m < 12) monthlyIncome[m] += b.total_price ?? 0
  }
  const maxMonthlyIncome = Math.max(...monthlyIncome, 1)

  // Income per property (this year)
  const incomeByProperty: Record<string, number> = {}
  const bookingsByProperty: Record<string, number> = {}
  for (const b of bookingsThisYear ?? []) {
    incomeByProperty[b.property_id] = (incomeByProperty[b.property_id] ?? 0) + (b.total_price ?? 0)
    bookingsByProperty[b.property_id] = (bookingsByProperty[b.property_id] ?? 0) + 1
  }

  // Upcoming bookings (next 30 days)
  const in30days = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000)
  const upcomingBookings = (allBookings ?? [])
    .filter(b => new Date(b.check_in) >= today && new Date(b.check_in) <= in30days)
    .sort((a, b) => new Date(a.check_in).getTime() - new Date(b.check_in).getTime())
    .slice(0, 5)

  // ΑΑΔΕ deadlines
  const deadlines = getUpcomingDeadlines(4)
  const nextDeadline = deadlines.find(d => !d.isOverdue)
  const overdueDeadlines = deadlines.filter(d => d.isOverdue)

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
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-start gap-3">
          <AlertCircle className="text-red-500 mt-0.5 shrink-0" size={20} />
          <div>
            <p className="font-semibold text-red-700 text-sm">
              {overdueDeadlines.length === 1 ? 'Εκπρόθεσμη δήλωση ΑΑΔΕ!' : `${overdueDeadlines.length} εκπρόθεσμες δηλώσεις ΑΑΔΕ!`}
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
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Link href="/dashboard/properties">
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="inline-flex p-2 rounded-xl bg-blue-50 mb-2.5">
              <Home className="text-blue-600" size={20} />
            </div>
            <div className="text-2xl font-extrabold text-gray-900">{totalProperties}</div>
            <div className="text-xs text-gray-500 mt-0.5 font-medium">Ακίνητα</div>
          </div>
        </Link>
        <Link href="/dashboard/bookings">
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="inline-flex p-2 rounded-xl bg-green-50 mb-2.5">
              <Calendar className="text-green-600" size={20} />
            </div>
            <div className="text-2xl font-extrabold text-gray-900">{totalBookings}</div>
            <div className="text-xs text-gray-500 mt-0.5 font-medium">Κρατήσεις (φέτος)</div>
          </div>
        </Link>
        <Link href="/dashboard/aade">
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="inline-flex p-2 rounded-xl bg-purple-50 mb-2.5">
              <TrendingUp className="text-purple-600" size={20} />
            </div>
            <div className="text-2xl font-extrabold text-gray-900">
              €{totalIncome.toLocaleString('el-GR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </div>
            <div className="text-xs text-gray-500 mt-0.5 font-medium">Έσοδα (φέτος)</div>
          </div>
        </Link>
        <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl p-4 shadow-sm border border-emerald-200">
          <div className="inline-flex p-2 rounded-xl bg-emerald-100 mb-2.5">
            <Euro className="text-emerald-600" size={20} />
          </div>
          <div className="text-2xl font-extrabold text-emerald-700">
            €{thisMonthIncome.toLocaleString('el-GR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </div>
          <div className="text-xs text-emerald-600 mt-0.5 font-semibold">
            {MONTH_NAMES[currentMonth - 1]} (τρέχων μήνας)
          </div>
        </div>
      </div>

      {/* Monthly Income Bar Chart */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-gray-900 flex items-center gap-2">
            <TrendingUp size={17} className="text-purple-500" />
            Έσοδα ανά Μήνα — {currentYear}
          </h2>
          <span className="text-xs text-gray-400 font-medium">
            Σύνολο: <strong className="text-gray-700">€{totalIncome.toLocaleString('el-GR', { minimumFractionDigits: 2 })}</strong>
          </span>
        </div>
        <div className="flex items-end gap-1.5 h-28">
          {monthlyIncome.map((income, i) => {
            const heightPct = Math.round((income / maxMonthlyIncome) * 100)
            const isCurrent = i + 1 === currentMonth
            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
                <div className="text-[9px] text-gray-400 hidden group-hover:block font-bold">
                  {income > 0 ? `€${income.toLocaleString('el-GR', { maximumFractionDigits: 0 })}` : ''}
                </div>
                <div className="w-full flex items-end" style={{ height: '88px' }}>
                  <div
                    className={`w-full rounded-t-lg transition-all duration-500 ${
                      isCurrent ? 'bg-blue-500' : income > 0 ? 'bg-purple-400' : 'bg-gray-100'
                    }`}
                    style={{ height: `${Math.max(heightPct, income > 0 ? 4 : 2)}%` }}
                  />
                </div>
                <span className={`text-[9px] font-bold ${isCurrent ? 'text-blue-600' : 'text-gray-400'}`}>
                  {MONTH_NAMES[i]}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Properties income summary */}
        {(properties?.length ?? 0) > 0 && (
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Home size={17} className="text-blue-500" />
              Έσοδα ανά Ακίνητο (φέτος)
            </h2>
            <div className="space-y-2.5">
              {properties?.map(prop => (
                <div key={prop.id} className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: prop.color }} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-semibold text-gray-800 truncate">{prop.name}</span>
                      <span className="text-xs font-bold text-gray-900 ml-2 shrink-0">
                        €{(incomeByProperty[prop.id] ?? 0).toLocaleString('el-GR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-1.5">
                      <div
                        className="h-1.5 rounded-full transition-all"
                        style={{
                          width: totalIncome > 0 ? `${((incomeByProperty[prop.id] ?? 0) / totalIncome) * 100}%` : '0%',
                          backgroundColor: prop.color,
                        }}
                      />
                    </div>
                    <p className="text-[10px] text-gray-400 mt-0.5">{bookingsByProperty[prop.id] ?? 0} κρατήσεις φέτος</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Next ΑΑΔΕ Deadline */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <AlertCircle size={17} className="text-orange-500" />
            Επόμενο Deadline ΑΑΔΕ
          </h2>
          {nextDeadline ? (
            <div>
              <div className={`inline-flex px-3 py-1 rounded-full text-xs font-bold mb-3 ${
                nextDeadline.status === 'urgent'
                  ? 'bg-red-100 text-red-700'
                  : nextDeadline.status === 'upcoming'
                  ? 'bg-orange-100 text-orange-700'
                  : 'bg-green-100 text-green-700'
              }`}>
                {nextDeadline.daysLeft === 0 ? '⚠️ Σήμερα!' : nextDeadline.daysLeft === 1 ? '⚠️ Αύριο!' : `${nextDeadline.daysLeft} μέρες`}
              </div>
              <p className="text-gray-900 font-semibold">{nextDeadline.label}</p>
              <p className="text-gray-500 text-sm mt-1">
                Deadline: {format(nextDeadline.deadline, 'd MMMM yyyy', { locale: el })}
              </p>
              <Link href="/dashboard/aade" className="mt-4 inline-flex items-center text-sm text-blue-600 hover:underline font-medium">
                Οδηγίες υποβολής →
              </Link>
            </div>
          ) : (
            <p className="text-gray-500 text-sm">Δεν υπάρχουν επερχόμενα deadlines.</p>
          )}
        </div>

        {/* Upcoming Bookings */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 lg:col-span-1">
          <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Calendar size={17} className="text-blue-500" />
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
                    <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: prop?.color ?? '#3b82f6' }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{prop?.name ?? 'Ακίνητο'}</p>
                      <p className="text-xs text-gray-500">
                        {format(new Date(booking.check_in), 'd MMM', { locale: el })} →{' '}
                        {format(new Date(booking.check_out), 'd MMM yyyy', { locale: el })}
                      </p>
                    </div>
                    {booking.total_price && (
                      <span className="text-xs font-bold text-emerald-700 shrink-0">
                        €{booking.total_price.toLocaleString('el-GR', { minimumFractionDigits: 0 })}
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
          )}
          <Link href="/dashboard/calendar" className="mt-4 inline-flex items-center text-sm text-blue-600 hover:underline font-medium">
            Δείτε το ημερολόγιο →
          </Link>
        </div>
      </div>
    </div>
  )
}
