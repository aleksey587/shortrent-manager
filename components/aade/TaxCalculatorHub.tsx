'use client'

import { useState, useMemo } from 'react'
import { calculateClimateFee, estimateTax, calculateFullTaxReport } from '@/lib/aade'
import { parseISO, format } from 'date-fns'
import { el } from 'date-fns/locale'
import { Calculator, HelpCircle, ShieldAlert, TrendingUp, Info, Building2, Flame, ArrowRight, ExternalLink } from 'lucide-react'

interface Booking {
  id: string
  property_id: string
  guest_name: string | null
  check_in: string
  check_out: string
  nights: number
  total_price: number | null
  platform: string
}

interface Property {
  id: string
  name: string
  color: string
}

interface Props {
  bookings: Booking[]
  properties: Property[]
  currentYear: number
}

export default function TaxCalculatorHub({ bookings, properties, currentYear }: Props) {
  const [selectedYear, setSelectedYear] = useState<number>(currentYear)
  const [propertyTypeMode, setPropertyTypeMode] = useState<'standard' | 'villa'>('standard')

  // Filter bookings by year
  const yearBookings = useMemo(() => {
    return bookings.filter(b => {
      if (!b.check_in) return false
      const year = new Date(b.check_in).getFullYear()
      return year === selectedYear
    })
  }, [bookings, selectedYear])

  // Total income for year
  const totalIncome = useMemo(() => {
    return yearBookings.reduce((sum, b) => sum + (b.total_price ?? 0), 0)
  }, [yearBookings])

  const totalNights = useMemo(() => {
    return yearBookings.reduce((sum, b) => sum + (b.nights ?? 0), 0)
  }, [yearBookings])

  // Total Climate Resilience Fee calculated per booking based on dates
  const totalClimateFee = useMemo(() => {
    return yearBookings.reduce((sum, b) => {
      const cIn = parseISO(b.check_in)
      const cOut = parseISO(b.check_out)
      return sum + calculateClimateFee(cIn, cOut, propertyTypeMode === 'villa')
    }, 0)
  }, [yearBookings, propertyTypeMode])

  const taxReport = useMemo(() => {
    return calculateFullTaxReport(totalIncome, totalClimateFee, properties.length)
  }, [totalIncome, totalClimateFee, properties.length])

  // Monthly breakdown of Climate Fee & Income
  const monthlyBreakdown = useMemo(() => {
    return Array.from({ length: 12 }, (_, monthIdx) => {
      const monthBookings = yearBookings.filter(b => new Date(b.check_in).getMonth() === monthIdx)
      const income = monthBookings.reduce((s, b) => s + (b.total_price ?? 0), 0)
      const nights = monthBookings.reduce((s, b) => s + (b.nights ?? 0), 0)
      const climateFee = monthBookings.reduce((s, b) => {
        const cIn = parseISO(b.check_in)
        const cOut = parseISO(b.check_out)
        return s + calculateClimateFee(cIn, cOut, propertyTypeMode === 'villa')
      }, 0)
      const monthName = format(new Date(selectedYear, monthIdx, 1), 'MMMM', { locale: el })
      // Payment deadline: end of next month
      const deadline = new Date(selectedYear, monthIdx + 2, 0)

      return {
        monthIndex: monthIdx,
        monthName,
        count: monthBookings.length,
        income,
        nights,
        climateFee,
        deadline,
      }
    }).filter(m => m.count > 0 || m.income > 0)
  }, [yearBookings, selectedYear, propertyTypeMode])

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <Calculator className="text-blue-600" size={22} />
            <h2 className="text-xl font-bold text-gray-900">Φορολογικός Οδηγός & Υπολογιστής Επιβαρύνσεων</h2>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Αυτόματος υπολογισμός Φόρου Εισοδήματος, Τέλους Ανθεκτικότητας (Κλιματικής Κρίσης) και ΦΠΑ.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={selectedYear}
            onChange={e => setSelectedYear(parseInt(e.target.value))}
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {[2024, 2025, 2026, 2027].map(y => (
              <option key={y} value={y}>Έτος {y}</option>
            ))}
          </select>

          <select
            value={propertyTypeMode}
            onChange={e => setPropertyTypeMode(e.target.value as any)}
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="standard">Διαμερίσματα / Κατοικίες (2€–8€)</option>
            <option value="villa">Μονοκατοικίες &gt;80τ.μ. / Βίλες (4€–15€)</option>
          </select>
        </div>
      </div>

      {/* Notice for 3+ Properties */}
      {taxReport.isBusinessObligated && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
          <ShieldAlert size={22} className="text-amber-600 shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-semibold text-amber-900">
              ⚠️ Έχετε καταχωρημένα {properties.length} ακίνητα — Κανόνας 3+ Ακινήτων
            </p>
            <p className="text-amber-700 mt-1">
              Βάσει νόμου, η εκμίσθωση <strong>3 ή περισσότερων ακινήτων</strong> θεωρείται επιχειρηματική δραστηριότητα.
              Υποχρεούστε σε έναρξη εργασιών, υπαγωγή σε <strong>ΦΠΑ (13%)</strong>, <strong>Τέλος Παρεπιδημούντων (0,5%)</strong> και ασφαλιστικές εισφορές ΕΦΚΑ.
            </p>
          </div>
        </div>
      )}

      {/* Main Tax Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Income */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50/50 border border-blue-100 rounded-2xl p-5">
          <div className="flex items-center justify-between text-blue-700 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wide">Ακαθάριστα Έσοδα</span>
            <TrendingUp size={18} />
          </div>
          <p className="text-2xl font-bold text-blue-950">
            €{taxReport.annualIncome.toLocaleString('el-GR', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-xs text-blue-600 mt-1">
            {totalNights} διανυκτερεύσεις σε {yearBookings.length} κρατήσεις
          </p>
        </div>

        {/* Estimated Income Tax */}
        <div className="bg-gradient-to-br from-orange-50 to-amber-50/50 border border-orange-100 rounded-2xl p-5">
          <div className="flex items-center justify-between text-orange-700 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wide">Φόρος Εισοδήματος (Ε1/Ε2)</span>
            <Building2 size={18} />
          </div>
          <p className="text-2xl font-bold text-orange-950">
            €{taxReport.estimatedIncomeTax.toLocaleString('el-GR', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-xs text-orange-700 mt-1">
            Κλίμακα 15% (έως 12k€) / 35% / 45%
          </p>
        </div>

        {/* Climate Resilience Fee */}
        <div className="bg-gradient-to-br from-emerald-50 to-teal-50/50 border border-emerald-100 rounded-2xl p-5">
          <div className="flex items-center justify-between text-emerald-700 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wide">Τέλος Κλιματικής Κρίσης</span>
            <Flame size={18} />
          </div>
          <p className="text-2xl font-bold text-emerald-950">
            €{taxReport.totalClimateFee.toLocaleString('el-GR', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-xs text-emerald-700 mt-1">
            Εισπράττεται από φιλοξενούμενο & αποδίδεται μηνιαία
          </p>
        </div>

        {/* Estimated Net Income */}
        <div className="bg-gradient-to-br from-purple-50 to-violet-50/50 border border-purple-100 rounded-2xl p-5">
          <div className="flex items-center justify-between text-purple-700 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wide">Καθαρό Εκτιμώμενο Κέρδος</span>
            <Calculator size={18} />
          </div>
          <p className="text-2xl font-bold text-purple-950">
            €{taxReport.netEstimatedIncome.toLocaleString('el-GR', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-xs text-purple-700 mt-1">
            Μετά την αφαίρεση φόρου εισοδήματος
          </p>
        </div>
      </div>

      {/* Monthly Breakdown of Climate Fee */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
            <Flame className="text-emerald-500" size={18} />
            Μηνιαία Ανάλυση & Απόδοση Τέλους Ανθεκτικότητας ({selectedYear})
          </h3>
        </div>

        {monthlyBreakdown.length === 0 ? (
          <div className="border border-dashed border-gray-200 rounded-xl p-6 text-center text-sm text-gray-400">
            Δεν υπάρχουν κρατήσεις για το έτος {selectedYear}.
          </div>
        ) : (
          <div className="border border-gray-100 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Μήνας</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Κρατήσεις</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Νύχτες</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Έσοδα</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-emerald-700 uppercase">Τέλος Κλιματικής Κρίσης</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Προθεσμία myAADE</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {monthlyBreakdown.map(m => (
                  <tr key={m.monthIndex} className="hover:bg-gray-50/70">
                    <td className="px-4 py-3 font-medium text-gray-900 capitalize">{m.monthName}</td>
                    <td className="px-4 py-3 text-gray-600">{m.count}</td>
                    <td className="px-4 py-3 text-gray-600">{m.nights}</td>
                    <td className="px-4 py-3 text-gray-900 font-medium">
                      €{m.income.toLocaleString('el-GR', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-3 font-bold text-emerald-700">
                      €{m.climateFee.toLocaleString('el-GR', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600">
                      Έως {format(m.deadline, 'd MMM yyyy', { locale: el })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Tax Guide Information Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
        <div className="border border-gray-100 rounded-2xl p-4 bg-gray-50/50 space-y-2">
          <h4 className="font-semibold text-sm text-gray-900 flex items-center gap-1.5">
            <Info size={16} className="text-blue-600" />
            1. Φόρος Εισοδήματος
          </h4>
          <p className="text-xs text-gray-600 leading-relaxed">
            Δηλώνεται ετησίως στα έντυπα <strong>Ε2</strong> και <strong>Ε1</strong>.
          </p>
          <ul className="text-xs text-gray-500 space-y-1 pl-1">
            <li>• <strong>15%</strong> για εισόδημα έως 12.000 €</li>
            <li>• <strong>35%</strong> για 12.001 € έως 35.000 €</li>
            <li>• <strong>45%</strong> για ποσά άνω των 35.000 €</li>
          </ul>
        </div>

        <div className="border border-gray-100 rounded-2xl p-4 bg-gray-50/50 space-y-2">
          <h4 className="font-semibold text-sm text-gray-900 flex items-center gap-1.5">
            <Flame size={16} className="text-emerald-600" />
            2. Τέλος Ανθεκτικότητας
          </h4>
          <p className="text-xs text-gray-600 leading-relaxed">
            Εισπράττεται από τον επισκέπτη και αποδίδεται <strong>μηνιαία</strong> μέσω myAADE έως το τέλος του επόμενου μήνα.
          </p>
          <ul className="text-xs text-gray-500 space-y-1 pl-1">
            <li>• <strong>8,00 € / νύχτα</strong>: Απρίλιος – Οκτώβριος</li>
            <li>• <strong>2,00 € / νύχτα</strong>: Νοέμβριος – Μάρτιος</li>
          </ul>
        </div>

        <div className="border border-gray-100 rounded-2xl p-4 bg-gray-50/50 space-y-2">
          <h4 className="font-semibold text-sm text-gray-900 flex items-center gap-1.5">
            <Building2 size={16} className="text-purple-600" />
            3. Δήλωση Βραχυχρόνιας Διαμονής
          </h4>
          <p className="text-xs text-gray-600 leading-relaxed">
            Υποβάλλεται στο Μητρώο Ακινήτων (gsis.gr) <strong>έως την 20ή ημέρα</strong> του επόμενου μήνα από την αναχώρηση του επισκέπτη.
          </p>
          <a
            href="https://www1.gsis.gr/taxisnet/short_term_letting"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline font-medium pt-1"
          >
            Είσοδος στο Taxisnet <ExternalLink size={11} />
          </a>
        </div>
      </div>
    </div>
  )
}
