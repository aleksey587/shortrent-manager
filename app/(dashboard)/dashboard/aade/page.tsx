import { createClient } from '@/lib/supabase/server'
import {
  getUpcomingDeadlines,
  getCurrentQuarter,
  getQuarterDateRange,
  estimateTax,
  AADE_STEPS,
  getQuarterLabel,
} from '@/lib/aade'
import { format } from 'date-fns'
import { el } from 'date-fns/locale'
import { AlertCircle, CheckCircle2, Clock, ExternalLink, FileText, TrendingUp } from 'lucide-react'
import AadeDeclarationTracker from '@/components/aade/AadeDeclarationTracker'
import AadeBookingReminders from '@/components/aade/AadeBookingReminders'
import Requirements2025 from '@/components/aade/Requirements2025'
import ExportPDF from '@/components/aade/ExportPDF'
import TaxCalculatorHub from '@/components/aade/TaxCalculatorHub'
import TaxObligationsSummary from '@/components/aade/TaxObligationsSummary'

export default async function AadePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const deadlines = getUpcomingDeadlines(6)
  const { quarter: currentQ, year: currentYear } = getCurrentQuarter()

  // Fetch properties and bookings
  const [{ data: properties }, { data: bookings }, { data: declarations }] = await Promise.all([
    supabase.from('properties').select('id, name, color'),
    supabase
      .from('bookings')
      .select('id, property_id, guest_name, check_in, check_out, nights, total_price, platform')
      .order('check_in', { ascending: false }),
    supabase
      .from('aade_declarations')
      .select('*')
      .eq('user_id', user!.id),
  ])

  // Upcoming deadlines (not overdue)
  const upcoming = deadlines.filter(d => !d.isOverdue).slice(0, 3)
  const overdue = deadlines.filter(d => d.isOverdue)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Φορολογικό Κέντρο & ΑΑΔΕ</h1>
        <p className="text-gray-500 text-sm mt-0.5">
          Υπολογισμός Φόρων, Τέλους Ανθεκτικότητας, Προθεσμίες και Οδηγίες Δηλώσεων.
        </p>
      </div>

      {/* Overdue alerts */}
      {overdue.map(d => (
        <div key={`${d.quarter}-${d.year}`}
          className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="text-red-500 mt-0.5 shrink-0" size={20} />
          <div>
            <p className="font-semibold text-red-700">⚠️ Εκπρόθεσμη Προθεσμία: {d.label} {d.year}</p>
            <p className="text-red-600 text-sm mt-0.5">
              Deadline: {format(d.deadline, 'd MMMM yyyy', { locale: el })} — Έχει παρέλθει κατά {Math.abs(d.daysLeft)} μέρες
            </p>
            <p className="text-red-600 text-sm font-medium mt-1">
              Υποβάλετε άμεσα στο Taxisnet για αποφυγή προστίμων.
            </p>
          </div>
        </div>
      ))}

      {/* Quarterly Income Auto-Summary */}
      {(() => {
        const quarters = [
          { q: 1, label: 'Α΄ Τρίμηνο', months: [1, 2, 3] },
          { q: 2, label: 'Β΄ Τρίμηνο', months: [4, 5, 6] },
          { q: 3, label: 'Γ΄ Τρίμηνο', months: [7, 8, 9] },
          { q: 4, label: 'Δ΄ Τρίμηνο', months: [10, 11, 12] },
        ]
        const quarterData = quarters.map(({ q, label, months }) => {
          const qBookings = (bookings ?? []).filter(b => {
            const year = parseInt(b.check_in.slice(0, 4))
            const month = parseInt(b.check_in.slice(5, 7))
            return year === currentYear && months.includes(month)
          })
          const totalIncome = qBookings.reduce((sum, b) => sum + (b.total_price ?? 0), 0)
          const cleaningTotal = qBookings.reduce((sum, b) => sum + ((b as any).cleaning_fee ?? 0), 0)
          const rentalIncome = totalIncome - cleaningTotal
          return { q, label, totalIncome, cleaningTotal, rentalIncome, count: qBookings.length }
        })
        const yearTotal = quarterData.reduce((s, r) => s + r.totalIncome, 0)
        const yearRental = quarterData.reduce((s, r) => s + r.rentalIncome, 0)
        const yearCleaning = quarterData.reduce((s, r) => s + r.cleaningTotal, 0)

        return (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <h2 className="font-bold text-gray-900 flex items-center gap-2">
                <TrendingUp size={17} className="text-purple-500" />
                Έσοδα ανά Τρίμηνο — {currentYear}
              </h2>
              <div className="flex items-center gap-3 text-xs flex-wrap">
                <span className="font-bold text-gray-700 bg-gray-100 px-3 py-1 rounded-full">
                  Σύνολο: €{yearTotal.toLocaleString('el-GR', { minimumFractionDigits: 2 })}
                </span>
                <span className="font-bold text-purple-700 bg-purple-50 border border-purple-200 px-3 py-1 rounded-full">
                  Φορολογητέο: €{yearRental.toLocaleString('el-GR', { minimumFractionDigits: 2 })}
                </span>
                {yearCleaning > 0 && (
                  <span className="font-bold text-teal-700 bg-teal-50 border border-teal-200 px-3 py-1 rounded-full">
                    Καθαριότητα: €{yearCleaning.toLocaleString('el-GR', { minimumFractionDigits: 2 })}
                  </span>
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {quarterData.map(({ q, label, totalIncome, cleaningTotal, rentalIncome, count }) => {
                const isCurrent = q === currentQ && currentYear === new Date().getFullYear()
                return (
                  <div
                    key={q}
                    className={`rounded-2xl p-4 border ${
                      isCurrent ? 'border-blue-300 bg-blue-50' : 'border-gray-100 bg-gray-50'
                    }`}
                  >
                    <p className={`text-xs font-bold mb-1 ${isCurrent ? 'text-blue-700' : 'text-gray-500'}`}>
                      {label} {isCurrent && '(τρέχον)'}
                    </p>
                    <p className={`text-lg font-extrabold ${totalIncome > 0 ? 'text-gray-900' : 'text-gray-400'}`}>
                      €{totalIncome.toLocaleString('el-GR', { minimumFractionDigits: 2 })}
                    </p>
                    <p className="text-[10px] text-gray-400 mt-0.5">{count} κρατήσεις</p>
                    {cleaningTotal > 0 && (
                      <p className="text-[10px] text-teal-600 mt-0.5">
                        Καθαρ.: €{cleaningTotal.toFixed(2)}
                      </p>
                    )}
                    {rentalIncome > 0 && (
                      <>
                        <p className="text-[10px] text-purple-600 font-semibold mt-0.5">
                          Φορολογητέο: €{rentalIncome.toFixed(2)}
                        </p>
                        <p className="text-[10px] text-emerald-600 font-semibold">
                          Φόρος ~€{(rentalIncome * 0.15).toFixed(2)}
                        </p>
                      </>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )
      })()}

      {/* Complete Tax Calculator & Breakdown Hub */}
      <TaxCalculatorHub
        bookings={bookings ?? []}
        properties={properties ?? []}
        currentYear={currentYear}
      />

      {/* Full Breakdown: What to Declare vs What to Pay */}
      <TaxObligationsSummary />

      {/* Per-booking reminders with Monthly Deadlines (20th of next month) */}
      <AadeBookingReminders />

      {/* Deadlines timeline */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h2 className="font-semibold text-gray-900 mb-4">Επερχόμενες Προθεσμίες & Ορόσημα</h2>
        <div className="space-y-3">
          {upcoming.map(d => (
            <div key={`${d.quarter}-${d.year}`}
              className={`flex items-center justify-between p-4 rounded-xl border ${
                d.status === 'urgent'
                  ? 'border-red-200 bg-red-50'
                  : d.status === 'upcoming'
                  ? 'border-orange-200 bg-orange-50'
                  : 'border-gray-100 bg-gray-50'
              }`}>
              <div>
                <p className="font-medium text-gray-900 text-sm">{d.label} {d.year}</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  Προθεσμία: {format(d.deadline, 'd MMMM yyyy', { locale: el })}
                </p>
              </div>
              <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
                d.status === 'urgent'
                  ? 'bg-red-100 text-red-700'
                  : d.status === 'upcoming'
                  ? 'bg-orange-100 text-orange-700'
                  : 'bg-green-100 text-green-700'
              }`}>
                {d.daysLeft === 0 ? 'Σήμερα!' : d.daysLeft === 1 ? 'Αύριο!' : `${d.daysLeft} μέρες`}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Declaration tracker */}
      <AadeDeclarationTracker declarations={declarations ?? []} currentYear={currentYear} />

      {/* Step-by-step guide */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h2 className="font-semibold text-gray-900 mb-2">Οδηγός Βήμα-Βήμα για την ΑΑΔΕ</h2>
        <p className="text-sm text-gray-500 mb-5">
          Πώς και πού υποβάλλετε κάθε δήλωση στο Taxisnet και στο myAADE
        </p>
        <div className="space-y-4">
          {AADE_STEPS.map((step, i) => (
            <div key={step.id} className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-sm font-bold shrink-0">
                  {step.id}
                </div>
                {i < AADE_STEPS.length - 1 && (
                  <div className="w-0.5 flex-1 bg-gray-100 mt-2" />
                )}
              </div>
              <div className="pb-4 flex-1">
                <h3 className="font-medium text-gray-900 text-sm">{step.title}</h3>
                <p className="text-sm text-gray-500 mt-0.5">{step.description}</p>
                {step.url && (
                  <a
                    href={step.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 mt-2 text-xs text-blue-600 hover:underline font-medium"
                  >
                    {step.action} <ExternalLink size={11} />
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 2025 requirements checklist */}
      <Requirements2025 />

      {/* PDF Export & Direct Send to Accountant */}
      <ExportPDF />
    </div>
  )
}
