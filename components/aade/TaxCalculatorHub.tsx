'use client'

import { useState, useMemo } from 'react'
import { calculateClimateFee, estimateTax, calculateFullTaxReport } from '@/lib/aade'
import { parseISO, format } from 'date-fns'
import { el } from 'date-fns/locale'
import {
  Calculator, HelpCircle, ShieldAlert, TrendingUp, Info, Building2,
  Flame, ArrowRight, ExternalLink, Percent, Sparkles, Wallet, Receipt
} from 'lucide-react'

interface Booking {
  id: string
  property_id: string
  guest_name: string | null
  check_in: string
  check_out: string
  nights: number
  cleaning_fee?: number | null
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

// Platform commission percentages + 24% Greek VAT on host fees
export function getPlatformHostFee(platform: string, gross: number, includeVat: boolean = true): { percent: number; effectivePercent: number; fee: number; vat: number } {
  if (!gross || gross <= 0) return { percent: 0, effectivePercent: 0, fee: 0, vat: 0 }
  const pl = (platform || '').toLowerCase()
  let basePercent = 3
  if (pl.includes('booking')) {
    basePercent = 15
  } else if (pl.includes('airbnb')) {
    basePercent = 3
  } else if (pl.includes('vrbo')) {
    basePercent = 5
  } else if (pl.includes('manual') || pl.includes('direct') || pl.includes('άλλη')) {
    basePercent = 0
  }

  // With Greek VAT 24%: Airbnb 3% * 1.24 = 3.72%, Booking 15% * 1.24 = 18.60%
  const effectivePercent = includeVat && basePercent > 0 ? basePercent * 1.24 : basePercent
  const rawFee = gross * (basePercent / 100)
  const vat = includeVat && basePercent > 0 ? rawFee * 0.24 : 0
  const totalFee = Math.round((rawFee + vat) * 100) / 100

  return {
    percent: basePercent,
    effectivePercent: Math.round(effectivePercent * 100) / 100,
    fee: totalFee,
    vat: Math.round(vat * 100) / 100,
  }
}

export default function TaxCalculatorHub({ bookings, properties, currentYear }: Props) {
  const [selectedYear, setSelectedYear] = useState<number>(currentYear)
  const [propertyTypeMode, setPropertyTypeMode] = useState<'standard' | 'villa'>('standard')
  const [includeVatOnHostFee, setIncludeVatOnHostFee] = useState<boolean>(true)

  // Filter bookings by year
  const yearBookings = useMemo(() => {
    return bookings.filter(b => {
      if (!b.check_in) return false
      const year = new Date(b.check_in).getFullYear()
      return year === selectedYear
    })
  }, [bookings, selectedYear])

  // Total gross income for year
  const totalIncome = useMemo(() => {
    return yearBookings.reduce((sum, b) => sum + (b.total_price ?? 0), 0)
  }, [yearBookings])

  const totalNights = useMemo(() => {
    return yearBookings.reduce((sum, b) => sum + (b.nights ?? 0), 0)
  }, [yearBookings])

  // Total Platform Host Fees (including 24% VAT)
  const totalHostFees = useMemo(() => {
    return yearBookings.reduce((sum, b) => {
      const { fee } = getPlatformHostFee(b.platform, b.total_price ?? 0, includeVatOnHostFee)
      return sum + fee
    }, 0)
  }, [yearBookings, includeVatOnHostFee])

  // Total Cleaning Fees
  const totalCleaningFees = useMemo(() => {
    return yearBookings.reduce((sum, b) => sum + (b.cleaning_fee ?? 0), 0)
  }, [yearBookings])

  // Net Bank Payout (Gross - Platform Commissions with VAT - Cleanings)
  const netBankPayout = Math.max(0, totalIncome - totalHostFees - totalCleaningFees)

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

  // True Net Profit (Net Payout - Taxes)
  const trueNetProfit = Math.max(0, netBankPayout - taxReport.estimatedIncomeTax)

  // Monthly breakdown of Climate Fee, Host Fees & Income
  const monthlyBreakdown = useMemo(() => {
    return Array.from({ length: 12 }, (_, monthIdx) => {
      const monthBookings = yearBookings.filter(b => new Date(b.check_in).getMonth() === monthIdx)
      const income = monthBookings.reduce((s, b) => s + (b.total_price ?? 0), 0)
      const cleaning = monthBookings.reduce((s, b) => s + (b.cleaning_fee ?? 0), 0)
      const hostFee = monthBookings.reduce((s, b) => s + getPlatformHostFee(b.platform, b.total_price ?? 0, includeVatOnHostFee).fee, 0)
      const netPayout = Math.max(0, income - hostFee - cleaning)
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
        cleaning,
        hostFee,
        netPayout,
        nights,
        climateFee,
        deadline,
      }
    }).filter(m => m.count > 0 || m.income > 0)
  }, [yearBookings, selectedYear, propertyTypeMode, includeVatOnHostFee])

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 sm:p-7 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <Calculator className="text-blue-600" size={24} />
            <h2 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
              Φορολογικός Οδηγός, Προμήθειες & Καθαρό Κέρδος
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Αυτόματος υπολογισμός Τέλους Οικοδεσπότη (+24% ΦΠΑ), Φόρου Εισοδήματος και Τέλους Κλιματικής Κρίσης.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={() => setIncludeVatOnHostFee(!includeVatOnHostFee)}
            className={`px-3 py-2 rounded-xl text-xs font-bold border transition-colors ${
              includeVatOnHostFee
                ? 'bg-rose-50 border-rose-200 text-rose-800'
                : 'bg-gray-50 border-gray-200 text-gray-600'
            }`}
            title="Υπολογισμός ελληνικού ΦΠΑ 24% επί της προμήθειας πλατφόρμας"
          >
            {includeVatOnHostFee ? '✅ +24% ΦΠΑ Προμηθειών (Ιδιώτες)' : '⚪ Χωρίς ΦΠΑ (Επαγγελματικό VIES)'}
          </button>

          <select
            value={selectedYear}
            onChange={e => setSelectedYear(parseInt(e.target.value))}
            className="border border-gray-200 rounded-xl px-3 py-2 text-xs sm:text-sm font-bold bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {[2024, 2025, 2026, 2027].map(y => (
              <option key={y} value={y}>Έτος {y}</option>
            ))}
          </select>

          <select
            value={propertyTypeMode}
            onChange={e => setPropertyTypeMode(e.target.value as any)}
            className="border border-gray-200 rounded-xl px-3 py-2 text-xs sm:text-sm font-semibold bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
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
          <div className="text-xs sm:text-sm">
            <p className="font-bold text-amber-900">
              ⚠️ Έχετε καταχωρημένα {properties.length} ακίνητα — Κανόνας 3+ Ακινήτων
            </p>
            <p className="text-amber-800 mt-1 leading-relaxed">
              Βάσει νόμου, η εκμίσθωση <strong>3 ή περισσότερων ακινήτων</strong> θεωρείται επιχειρηματική δραστηριότητα.
              Υποχρεούστε σε έναρξη εργασιών, υπαγωγή σε <strong>ΦΠΑ (13%)</strong>, <strong>Τέλος Παρεπιδημούντων (0,5%)</strong> και ασφαλιστικές εισφορές ΕΦΚΑ.
            </p>
          </div>
        </div>
      )}

      {/* Main Tax Cards Grid (5 Stat Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        {/* Total Gross Income */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50/60 border border-blue-100 rounded-2xl p-4.5">
          <div className="flex items-center justify-between text-blue-700 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Συνολικά Έσοδα</span>
            <TrendingUp size={16} />
          </div>
          <p className="text-xl sm:text-2xl font-black text-blue-950">
            €{taxReport.annualIncome.toLocaleString('el-GR', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-[10px] text-blue-600 mt-1">
            {totalNights} διανυκτερεύσεις σε {yearBookings.length} κρατήσεις
          </p>
        </div>

        {/* Total Host Platform Fee */}
        <div className="bg-gradient-to-br from-rose-50 to-red-50/60 border border-rose-100 rounded-2xl p-4.5">
          <div className="flex items-center justify-between text-rose-700 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Τέλος Οικοδεσπότη</span>
            <Percent size={16} />
          </div>
          <p className="text-xl sm:text-2xl font-black text-rose-950">
            €{totalHostFees.toLocaleString('el-GR', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-[10px] text-rose-700 mt-1">
            Airbnb (3%) & Booking (15%)
          </p>
        </div>

        {/* Estimated Income Tax */}
        <div className="bg-gradient-to-br from-orange-50 to-amber-50/60 border border-orange-100 rounded-2xl p-4.5">
          <div className="flex items-center justify-between text-orange-700 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Φόρος ΑΑΔΕ (Ε1/Ε2)</span>
            <Building2 size={16} />
          </div>
          <p className="text-xl sm:text-2xl font-black text-orange-950">
            €{taxReport.estimatedIncomeTax.toLocaleString('el-GR', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-[10px] text-orange-700 mt-1">
            Κλίμακα 15% (έως 12k€) / 25% / 35% / 45%
          </p>
        </div>

        {/* Climate Resilience Fee */}
        <div className="bg-gradient-to-br from-emerald-50 to-teal-50/60 border border-emerald-100 rounded-2xl p-4.5">
          <div className="flex items-center justify-between text-emerald-700 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Τέλος Κλιματικής</span>
            <Flame size={16} />
          </div>
          <p className="text-xl sm:text-2xl font-black text-emerald-950">
            €{taxReport.totalClimateFee.toLocaleString('el-GR', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-[10px] text-emerald-700 mt-1">
            myAADE (Εισπράττεται από επισκέπτη)
          </p>
        </div>

        {/* Estimated True Net Profit */}
        <div className="bg-gradient-to-br from-purple-50 to-violet-50/60 border border-purple-100 rounded-2xl p-4.5">
          <div className="flex items-center justify-between text-purple-700 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Καθαρά στην Τσέπη</span>
            <Wallet size={16} />
          </div>
          <p className="text-xl sm:text-2xl font-black text-purple-950">
            €{trueNetProfit.toLocaleString('el-GR', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-[10px] text-purple-700 mt-1">
            Μετά από προμήθειες, καθαρισμούς & φόρους
          </p>
        </div>
      </div>

      {/* Monthly Breakdown Table */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm sm:text-base font-extrabold text-gray-900 flex items-center gap-2">
            <Receipt className="text-blue-600" size={18} />
            Μηνιαία Ανάλυση Εσόδων, Προμηθειών & Τέλους Κλιματικής ({selectedYear})
          </h3>
        </div>

        {monthlyBreakdown.length === 0 ? (
          <div className="border border-dashed border-gray-200 rounded-2xl p-8 text-center text-xs text-gray-400">
            Δεν υπάρχουν κρατήσεις για το έτος {selectedYear}.
          </div>
        ) : (
          <div className="border border-gray-100 rounded-2xl overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="text-left px-4 py-3 font-bold text-gray-500 uppercase tracking-wider">Μήνας</th>
                    <th className="text-center px-3 py-3 font-bold text-gray-500 uppercase tracking-wider">Κρατήσεις</th>
                    <th className="text-center px-3 py-3 font-bold text-gray-500 uppercase tracking-wider">Νύχτες</th>
                    <th className="text-right px-4 py-3 font-bold text-gray-500 uppercase tracking-wider">Έσοδα Gross</th>
                    <th className="text-right px-4 py-3 font-bold text-rose-600 uppercase tracking-wider">Τέλος Οικοδεσπότη</th>
                    <th className="text-right px-4 py-3 font-bold text-blue-700 uppercase tracking-wider">Καθαρά Τράπεζας</th>
                    <th className="text-right px-4 py-3 font-bold text-emerald-700 uppercase tracking-wider">Τέλος myAADE</th>
                    <th className="text-right px-4 py-3 font-bold text-gray-500 uppercase tracking-wider">Προθεσμία myAADE</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {monthlyBreakdown.map(m => (
                    <tr key={m.monthIndex} className="hover:bg-gray-50/70 transition-colors">
                      <td className="px-4 py-3 font-extrabold text-gray-900">{m.monthName}</td>
                      <td className="px-3 py-3 text-center text-gray-600">{m.count}</td>
                      <td className="px-3 py-3 text-center text-gray-600">{m.nights}</td>
                      <td className="px-4 py-3 text-right font-bold text-gray-900">
                        €{m.income.toLocaleString('el-GR', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-rose-600">
                        -€{m.hostFee.toLocaleString('el-GR', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 py-3 text-right font-extrabold text-blue-700">
                        €{m.netPayout.toLocaleString('el-GR', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-emerald-700">
                        €{m.climateFee.toLocaleString('el-GR', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-500 font-medium">
                        {format(m.deadline, 'd MMM yyyy', { locale: el })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
