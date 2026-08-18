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

export default async function AadePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const deadlines = getUpcomingDeadlines(6)
  const { quarter: currentQ, year: currentYear } = getCurrentQuarter()

  // Fetch income data per quarter from bookings
  const { data: bookings } = await supabase
    .from('bookings')
    .select('check_in, check_out, total_price, property_id')
    .gte('check_in', `${currentYear - 1}-01-01`)

  // Fetch existing declarations
  const { data: declarations } = await supabase
    .from('aade_declarations')
    .select('*')
    .eq('user_id', user!.id)

  // Calculate income per quarter for current year
  const quarterIncomes = [1, 2, 3, 4].map(q => {
    const { start, end } = getQuarterDateRange(q, currentYear)
    const qBookings = bookings?.filter(b => {
      const checkIn = new Date(b.check_in)
      return checkIn >= start && checkIn <= end
    }) ?? []
    const total = qBookings.reduce((s, b) => s + (b.total_price ?? 0), 0)
    return { quarter: q, year: currentYear, total, count: qBookings.length }
  })

  const annualIncome = quarterIncomes.reduce((s, q) => s + q.total, 0)
  const estimatedAnnualTax = estimateTax(annualIncome)

  // Upcoming deadlines (not overdue)
  const upcoming = deadlines.filter(d => !d.isOverdue).slice(0, 3)
  const overdue = deadlines.filter(d => d.isOverdue)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">ΑΑΔΕ Dashboard</h1>
        <p className="text-gray-500 text-sm mt-0.5">Υποχρεώσεις βραχυχρόνιων μισθώσεων & deadlines</p>
      </div>

      {/* Overdue alerts */}
      {overdue.map(d => (
        <div key={`${d.quarter}-${d.year}`}
          className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="text-red-500 mt-0.5 shrink-0" size={20} />
          <div>
            <p className="font-semibold text-red-700">⚠️ Εκπρόθεσμη Δήλωση: {d.label} {d.year}</p>
            <p className="text-red-600 text-sm mt-0.5">
              Deadline: {format(d.deadline, 'd MMMM yyyy', { locale: el })} — Έχει παρέλθει κατά {Math.abs(d.daysLeft)} μέρες
            </p>
            <p className="text-red-600 text-sm font-medium mt-1">
              Υποβάλετε άμεσα στο myProperty για να αποφύγετε πρόστιμα.
            </p>
          </div>
        </div>
      ))}

      {/* Income Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp size={18} className="text-green-500" />
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Έσοδα {currentYear}</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            €{annualIncome.toLocaleString('el-GR', { minimumFractionDigits: 2 })}
          </p>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-2">
            <FileText size={18} className="text-orange-500" />
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Εκτ. Φόρος {currentYear}</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            €{estimatedAnnualTax.toLocaleString('el-GR', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-xs text-gray-400 mt-1">Βάσει κλίμακας ενοικίων 2024</p>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-2">
            <Clock size={18} className="text-blue-500" />
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Τρέχον Τρίμηνο</span>
          </div>
          <p className="text-lg font-bold text-gray-900">{getQuarterLabel(currentQ)}</p>
          <p className="text-xs text-gray-400">{currentYear}</p>
        </div>
      </div>

      {/* Deadlines timeline */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h2 className="font-semibold text-gray-900 mb-4">Επόμενα Deadlines</h2>
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
                  Deadline: {format(d.deadline, 'd MMMM yyyy', { locale: el })}
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

      {/* Quarter income breakdown */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h2 className="font-semibold text-gray-900 mb-4">Έσοδα ανά Τρίμηνο ({currentYear})</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {quarterIncomes.map(({ quarter, total, count }) => {
            const decl = declarations?.find(d => d.quarter === quarter && d.year === currentYear)
            return (
              <div key={quarter} className="border border-gray-100 rounded-xl p-4">
                <div className="flex items-start justify-between mb-2">
                  <span className="text-xs font-semibold text-gray-500">Q{quarter}</span>
                  {decl?.status === 'submitted' ? (
                    <CheckCircle2 size={14} className="text-green-500" />
                  ) : total > 0 ? (
                    <Clock size={14} className="text-orange-400" />
                  ) : null}
                </div>
                <p className="text-lg font-bold text-gray-900">
                  €{total.toLocaleString('el-GR', { minimumFractionDigits: 2 })}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">{count} κρατήσεις</p>
                {decl?.status === 'submitted' && (
                  <span className="inline-block mt-2 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                    ✓ Υποβλήθηκε
                  </span>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Declaration tracker */}
      <AadeDeclarationTracker declarations={declarations ?? []} currentYear={currentYear} />

      {/* Step-by-step guide */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h2 className="font-semibold text-gray-900 mb-2">Οδηγός Υποβολής Δήλωσης</h2>
        <p className="text-sm text-gray-500 mb-5">Βήμα-βήμα οδηγίες για την υποβολή στο myAADE / myProperty</p>
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

        {/* Important notes */}
        <div className="mt-4 bg-amber-50 border border-amber-200 rounded-xl p-4">
          <p className="text-sm font-semibold text-amber-800 mb-2">📋 Σημαντικές Πληροφορίες</p>
          <ul className="text-xs text-amber-700 space-y-1">
            <li>• Η δήλωση βραχυχρόνιας μίσθωσης υποβάλλεται <strong>τριμηνιαία</strong> στο myProperty</li>
            <li>• Για νέα ακίνητα χρειάζεται <strong>εγγραφή και λήψη ΑΜΑ</strong> πριν την πρώτη μίσθωση</li>
            <li>• Ο φόρος εισοδήματος δηλώνεται <strong>ετήσια</strong> μέσω Ε1 + Ε2</li>
            <li>• Σε περίπτωση αμφιβολίας συμβουλευτείτε λογιστή</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
