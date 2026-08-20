'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Download, FileText, Loader2, Mail, Share2, Copy, Check, MessageCircle, Send } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { el } from 'date-fns/locale'
import { calculateClimateFee, calculateFullTaxReport } from '@/lib/aade'

const PLATFORM_LABELS: Record<string, string> = {
  airbnb: 'Airbnb',
  booking: 'Booking.com',
  vrbo: 'VRBO',
  manual: 'Χειροκίνητη',
  other: 'Άλλη',
}

export default function ExportPDF() {
  const supabase = createClient()
  const [year, setYear] = useState(new Date().getFullYear())
  const [loading, setLoading] = useState(false)
  const [accountantEmail, setAccountantEmail] = useState('')
  const [copied, setCopied] = useState(false)

  async function generatePDF() {
    setLoading(true)
    try {
      const [{ data: bookings }, { data: properties }, { data: { user } }] = await Promise.all([
        supabase
          .from('bookings')
          .select('*, properties(name)')
          .gte('check_in', `${year}-01-01`)
          .lte('check_in', `${year}-12-31`)
          .order('check_in'),
        supabase.from('properties').select('id, name, color'),
        supabase.auth.getUser(),
      ])

      if (!bookings) return

      // Dynamic import for jsPDF
      const { default: jsPDF } = await import('jspdf')
      const { default: autoTable } = await import('jspdf-autotable')

      const doc = new jsPDF({ orientation: 'landscape' })

      // Header
      doc.setFontSize(18)
      doc.setTextColor(30, 58, 138)
      doc.text('GreekHost', 14, 18)
      doc.setFontSize(12)
      doc.setTextColor(100, 100, 100)
      doc.text(`Ετήσια Φορολογική Αναφορά Βραχυχρόνιων Μισθώσεων — ${year}`, 14, 26)
      doc.setFontSize(9)
      doc.text(`Εκτύπωση: ${format(new Date(), 'd MMMM yyyy', { locale: el })}  |  Ιδιοκτήτης: ${user?.email ?? ''}`, 14, 32)

      // Summary calculations
      const totalGrossIncome = bookings.reduce((s, b) => s + (b.total_price ?? 0), 0)
      const totalCleaningFee = bookings.reduce((s, b) => s + (b.cleaning_fee ?? 0), 0)
      const totalTaxableRental = Math.max(0, totalGrossIncome - totalCleaningFee)

      const totalClimateFee = bookings.reduce((s, b) => {
        const cIn = parseISO(b.check_in)
        const cOut = parseISO(b.check_out)
        return s + calculateClimateFee(cIn, cOut)
      }, 0)
      const taxReport = calculateFullTaxReport(totalTaxableRental, totalClimateFee, properties?.length ?? 1)

      // Summary by property
      const propSummary: Record<string, { name: string; gross: number; cleaning: number; rental: number; nights: number; count: number; climate: number }> = {}
      for (const b of bookings) {
        const propName = (b.properties as any)?.name ?? 'Άγνωστο'
        if (!propSummary[b.property_id]) {
          propSummary[b.property_id] = { name: propName, gross: 0, cleaning: 0, rental: 0, nights: 0, count: 0, climate: 0 }
        }
        const bClimate = calculateClimateFee(parseISO(b.check_in), parseISO(b.check_out))
        const bGross = b.total_price ?? 0
        const bClean = b.cleaning_fee ?? 0
        const bRental = Math.max(0, bGross - bClean)

        propSummary[b.property_id].gross += bGross
        propSummary[b.property_id].cleaning += bClean
        propSummary[b.property_id].rental += bRental
        propSummary[b.property_id].nights += b.nights ?? 0
        propSummary[b.property_id].count += 1
        propSummary[b.property_id].climate += bClimate
      }

      doc.setFontSize(11)
      doc.setTextColor(30, 30, 30)
      doc.text('1. Σύνοψη ανά Ακίνητο & Φορολογικές Υποχρεώσεις', 14, 42)

      autoTable(doc, {
        startY: 46,
        head: [['Ακίνητο', 'Κρατήσεις', 'Νύχτες', 'Σύνολο Είσπραξης (€)', 'Καθαριότητα (€)', 'Φορολογητέο Μίσθωμα (€)', 'Τέλος Κλιμ. Κρίσης (€)']],
        body: Object.values(propSummary).map(p => [
          p.name,
          p.count.toString(),
          p.nights.toString(),
          p.gross.toLocaleString('el-GR', { minimumFractionDigits: 2 }),
          p.cleaning.toLocaleString('el-GR', { minimumFractionDigits: 2 }),
          p.rental.toLocaleString('el-GR', { minimumFractionDigits: 2 }),
          p.climate.toLocaleString('el-GR', { minimumFractionDigits: 2 }),
        ]),
        foot: [[
          'ΣΥΝΟΛΟ',
          bookings.length.toString(),
          Object.values(propSummary).reduce((s, p) => s + p.nights, 0).toString(),
          totalGrossIncome.toLocaleString('el-GR', { minimumFractionDigits: 2 }),
          totalCleaningFee.toLocaleString('el-GR', { minimumFractionDigits: 2 }),
          totalTaxableRental.toLocaleString('el-GR', { minimumFractionDigits: 2 }),
          taxReport.totalClimateFee.toLocaleString('el-GR', { minimumFractionDigits: 2 }),
        ]],
        headStyles: { fillColor: [37, 99, 235], fontSize: 8 },
        footStyles: { fillColor: [239, 246, 255], textColor: [30, 58, 138], fontStyle: 'bold', fontSize: 8 },
        bodyStyles: { fontSize: 8 },
        margin: { left: 14, right: 14 },
      })

      // Tax estimation box
      const afterPropY = (doc as any).lastAutoTable?.finalY ?? 80
      doc.setFontSize(9)
      doc.setTextColor(50, 50, 50)
      doc.text(
        `Καθαρό Φορολογητέο Μίσθωμα (Ε2/ΑΑΔΕ): €${totalTaxableRental.toLocaleString('el-GR', { minimumFractionDigits: 2 })}  |  ` +
        `Εκτιμώμενος Φόρος: €${taxReport.estimatedIncomeTax.toLocaleString('el-GR', { minimumFractionDigits: 2 })}  |  ` +
        `Τέλος Κλιματικής Κρίσης (myAADE): €${taxReport.totalClimateFee.toLocaleString('el-GR', { minimumFractionDigits: 2 })}`,
        14, afterPropY + 8
      )

      // Monthly breakdown
      const months = Array.from({ length: 12 }, (_, i) => i)
      const monthlyData = months.map(m => {
        const mBookings = bookings.filter(b => new Date(b.check_in).getMonth() === m)
        const gross = mBookings.reduce((s, b) => s + (b.total_price ?? 0), 0)
        const cleaning = mBookings.reduce((s, b) => s + (b.cleaning_fee ?? 0), 0)
        const rental = Math.max(0, gross - cleaning)
        const nights = mBookings.reduce((s, b) => s + (b.nights ?? 0), 0)
        const climateFee = mBookings.reduce((s, b) => s + calculateClimateFee(parseISO(b.check_in), parseISO(b.check_out)), 0)
        return {
          month: format(new Date(year, m, 1), 'MMMM', { locale: el }),
          count: mBookings.length,
          nights,
          gross,
          cleaning,
          rental,
          climateFee,
        }
      }).filter(m => m.count > 0)

      if (monthlyData.length > 0) {
        doc.setFontSize(11)
        doc.setTextColor(30, 30, 30)
        doc.text('2. Ανάλυση ανά Μήνα & Προθεσμίες Απόδοσης', 14, afterPropY + 18)

        autoTable(doc, {
          startY: afterPropY + 22,
          head: [['Μήνας', 'Κρατήσεις', 'Νύχτες', 'Σύνολο (€)', 'Καθαριότητα (€)', 'Φορολογητέο (€)', 'Τέλος Κλιμ. (€)', 'Deadline ΑΑΔΕ', 'Deadline myAADE']],
          body: monthlyData.map(m => {
            const monthIndex = ['Ιανουάριος','Φεβρουάριος','Μάρτιος','Απρίλιος','Μάιος','Ιούνιος','Ιούλιος','Αύγουστος','Σεπτέμβριος','Οκτώβριος','Νοέμβριος','Δεκέμβριος'].indexOf(m.month)
            const aadeDeadline = new Date(year, monthIndex + 1, 20)
            const climateDeadline = new Date(year, monthIndex + 2, 0)
            return [
              m.month,
              m.count.toString(),
              m.nights.toString(),
              m.gross.toLocaleString('el-GR', { minimumFractionDigits: 2 }),
              m.cleaning.toLocaleString('el-GR', { minimumFractionDigits: 2 }),
              m.rental.toLocaleString('el-GR', { minimumFractionDigits: 2 }),
              m.climateFee.toLocaleString('el-GR', { minimumFractionDigits: 2 }),
              format(aadeDeadline, 'd MMM yyyy', { locale: el }),
              format(climateDeadline, 'd MMM yyyy', { locale: el }),
            ]
          }),
          headStyles: { fillColor: [37, 99, 235], fontSize: 7.5 },
          bodyStyles: { fontSize: 7.5 },
          margin: { left: 14, right: 14 },
        })
      }

      // Individual Bookings List
      const afterMonthY = (doc as any).lastAutoTable?.finalY ?? 130
      if (afterMonthY < 160) {
        doc.setFontSize(11)
        doc.setTextColor(30, 30, 30)
        doc.text('3. Αναλυτικός Πίνακας Κρατήσεων', 14, afterMonthY + 10)

        autoTable(doc, {
          startY: afterMonthY + 14,
          head: [['Ακίνητο', 'Επισκέπτης', 'Check-in', 'Check-out', 'Νύχτες', 'Σύνολο (€)', 'Καθαριότητα (€)', 'Φορολογητέο (€)', 'Πλατφόρμα']],
          body: bookings.map(b => [
            (b.properties as any)?.name ?? '—',
            b.guest_name || '—',
            format(parseISO(b.check_in), 'dd/MM/yyyy'),
            format(parseISO(b.check_out), 'dd/MM/yyyy'),
            b.nights.toString(),
            (b.total_price ?? 0).toLocaleString('el-GR', { minimumFractionDigits: 2 }),
            (b.cleaning_fee ?? 0).toLocaleString('el-GR', { minimumFractionDigits: 2 }),
            Math.max(0, (b.total_price ?? 0) - (b.cleaning_fee ?? 0)).toLocaleString('el-GR', { minimumFractionDigits: 2 }),
            PLATFORM_LABELS[b.platform] ?? b.platform,
          ]),
          headStyles: { fillColor: [71, 85, 105], fontSize: 7 },
          bodyStyles: { fontSize: 7 },
          margin: { left: 14, right: 14 },
        })
      }

      // Footer
      const pageCount = (doc as any).internal.getNumberOfPages()
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i)
        doc.setFontSize(8)
        doc.setTextColor(150, 150, 150)
        doc.text(`Σελίδα ${i} από ${pageCount}`, 260, 200)
      }

      doc.save(`greekhost-φορολογικη-αναφορα-${year}.pdf`)
    } catch (err) {
      console.error('PDF error:', err)
      alert('Σφάλμα κατά τη δημιουργία PDF.')
    }
    setLoading(false)
  }

  async function sendEmailToAccountant() {
    const { data: bookings } = await supabase
      .from('bookings')
      .select('*, properties(name)')
      .gte('check_in', `${year}-01-01`)
      .lte('check_in', `${year}-12-31`)

    const totalGross = bookings?.reduce((s, b) => s + (b.total_price ?? 0), 0) ?? 0
    const totalClean = bookings?.reduce((s, b) => s + (b.cleaning_fee ?? 0), 0) ?? 0
    const totalTaxable = Math.max(0, totalGross - totalClean)
    const totalNights = bookings?.reduce((s, b) => s + (b.nights ?? 0), 0) ?? 0
    const totalClimateFee = bookings?.reduce((s, b) => s + calculateClimateFee(parseISO(b.check_in), parseISO(b.check_out)), 0) ?? 0

    const subject = encodeURIComponent(`Φορολογική Σύνοψη Βραχυχρόνιας Μίσθωσης Έτους ${year}`)
    const body = encodeURIComponent(
      `Καλησπέρα,\n\n` +
      `Σας αποστέλλω τη φορολογική σύνοψη των βραχυχρόνιων μισθώσεών μου για το έτος ${year}:\n\n` +
      `• Συνολικές Κρατήσεις: ${bookings?.length ?? 0}\n` +
      `• Συνολικές Διανυκτερεύσεις: ${totalNights}\n` +
      `• Συνολική Είσπραξη (Gross): €${totalGross.toLocaleString('el-GR', { minimumFractionDigits: 2 })}\n` +
      `• Τέλη Καθαριότητας: €${totalClean.toLocaleString('el-GR', { minimumFractionDigits: 2 })}\n` +
      `• Καθαρό Φορολογητέο Μίσθωμα (Ε2/ΑΑΔΕ): €${totalTaxable.toLocaleString('el-GR', { minimumFractionDigits: 2 })}\n` +
      `• Τέλος Ανθεκτικότητας (Κλιματικής Κρίσης): €${totalClimateFee.toLocaleString('el-GR', { minimumFractionDigits: 2 })}\n\n` +
      `(Επισυνάπτεται η αναλυτική έκθεση PDF που κατέβασα από το GreekHost).\n\n` +
      `Ευχαριστώ!`
    )

    window.location.href = `mailto:${accountantEmail}?subject=${subject}&body=${body}`
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-5">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <FileText size={20} className="text-blue-600" />
          <h2 className="text-xl font-bold text-gray-900">Αποστολή & Εξαγωγή για τον Λογιστή</h2>
        </div>
        <p className="text-sm text-gray-500">
          Στείλτε με 1 κλικ τα στοιχεία στον λογιστή σας μέσω Email ή κατεβάστε την αναλυτική φορολογική έκθεση σε PDF.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
        {/* Επιλογή 1: Λήψη PDF */}
        <div className="border border-gray-200 rounded-2xl p-5 bg-gray-50/50 flex flex-col justify-between space-y-4">
          <div>
            <span className="font-semibold text-sm text-gray-900 flex items-center gap-1.5 mb-1">
              <Download size={16} className="text-blue-600" />
              1. Λήψη Φορολογικής Έκθεσης (PDF)
            </span>
            <p className="text-xs text-gray-500">
              Περιλαμβάνει αναλυτικό πίνακα εσόδων, διανυκτερεύσεων, φόρων και τέλους κλιματικής κρίσης.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <select
              value={year}
              onChange={e => setYear(parseInt(e.target.value))}
              className="border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
            >
              {[2024, 2025, 2026, 2027].map(y => (
                <option key={y} value={y}>Έτος {y}</option>
              ))}
            </select>

            <button
              onClick={generatePDF}
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors disabled:opacity-50 shadow-sm"
            >
              {loading
                ? <><Loader2 size={16} className="animate-spin" /> Δημιουργία...</>
                : <><Download size={16} /> Λήψη PDF {year}</>
              }
            </button>
          </div>
        </div>

        {/* Επιλογή 2: Απευθείας Email στον Λογιστή */}
        <div className="border border-blue-100 bg-blue-50/30 rounded-2xl p-5 flex flex-col justify-between space-y-4">
          <div>
            <span className="font-semibold text-sm text-blue-950 flex items-center gap-1.5 mb-1">
              <Mail size={16} className="text-blue-600" />
              2. Αποστολή Email στον Λογιστή
            </span>
            <p className="text-xs text-blue-700">
              Ανοίγει προδιαμορφωμένο email με τη σύνοψη εσόδων και υποχρεώσεων έτοιμο για αποστολή.
            </p>
          </div>

          <div className="flex gap-2">
            <input
              type="email"
              value={accountantEmail}
              onChange={e => setAccountantEmail(e.target.value)}
              placeholder="email-logisti@example.gr"
              className="flex-1 border border-blue-200 rounded-xl px-3 py-2 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={sendEmailToAccountant}
              className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-medium transition-colors shrink-0 shadow-sm"
            >
              <Send size={13} />
              <span>Αποστολή</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
