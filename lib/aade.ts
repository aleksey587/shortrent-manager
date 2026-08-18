import { format, addMonths, startOfMonth, endOfMonth, addDays, eachDayOfInterval } from 'date-fns'
import { el } from 'date-fns/locale'

/**
 * ΣΗΜΑΝΤΙΚΟ ΦΟΡΟΛΟΓΙΚΟ ΠΛΑΙΣΙΟ ΒΡΑΧΥΧΡΟΝΙΩΝ ΜΙΣΘΩΣΕΩΝ:
 * 1. Δήλωση Βραχυχρόνιας Διαμονής: Μηνιαία έως 20ή του επόμενου μήνα από checkout (gsis.gr/taxisnet/short_term_letting).
 * 2. Τέλος Ανθεκτικότητας στην Κλιματική Κρίση: Μηνιαία έως το τέλος του επόμενου μήνα (myAADE).
 * 3. Φόρος Εισοδήματος: Ετήσια μέσω Ε1 + Ε2 (κλίμακα 15%-35%-45%).
 * 4. Κανόνας 3+ Ακινήτων: Υποχρέωση έναρξης επιχειρηματικής δραστηριότητας, ΦΠΑ 13%, Τέλος παρεπιδημούντων 0,5%, ΕΦΚΑ.
 */

export interface AadeDeadline {
  quarter: number
  year: number
  label: string
  period: string
  deadline: Date
  daysLeft: number
  isOverdue: boolean
  status: 'urgent' | 'upcoming' | 'overdue' | 'ok'
}

/**
 * Υπολογισμός Τέλους Ανθεκτικότητας στην Κλιματική Κρίση (ανά διανυκτέρευση)
 * Από 01/01/2025:
 * - Απρίλιος – Οκτώβριος (Υψηλή περίοδος): 8,00 € / νύχτα (ή 15,00 € για μονοκατοικία >80τ.μ. / βίλα)
 * - Νοέμβριος – Μάρτιος (Χαμηλή περίοδος): 2,00 € / νύχτα (ή 4,00 € για μονοκατοικία >80τ.μ. / βίλα)
 */
export function calculateClimateFee(checkIn: Date, checkOut: Date, isVillaOrLarge: boolean = false): number {
  if (checkOut <= checkIn) return 0

  // Όλες οι διανυκτερεύσεις (από checkIn έως την προηγούμενη του checkOut)
  const lastNight = new Date(checkOut)
  lastNight.setDate(lastNight.getDate() - 1)

  let totalFee = 0
  let cur = new Date(checkIn)

  while (cur <= lastNight) {
    const month = cur.getMonth() // 0 = Jan, 3 = Apr, 9 = Oct, 10 = Nov
    const isHighSeason = month >= 3 && month <= 9 // Apr to Oct

    if (isHighSeason) {
      totalFee += isVillaOrLarge ? 15.0 : 8.0
    } else {
      totalFee += isVillaOrLarge ? 4.0 : 2.0
    }

    cur.setDate(cur.getDate() + 1)
  }

  return Math.round(totalFee * 100) / 100
}

/**
 * Προθεσμία απόδοσης Τέλους Ανθεκτικότητας στην Κλιματική Κρίση:
 * Έως την τελευταία ημέρα του επόμενου μήνα από την έκδοση/είσπραξη.
 */
export function getClimateFeeMonthlyDeadline(month: number, year: number): Date {
  // month: 0-indexed (0 = Jan) -> next month last day
  const nextMonth = new Date(year, month + 2, 0)
  return nextMonth
}

/**
 * Υπολογισμός εκτιμώμενου φόρου εισοδήματος από ενοίκια (κλίμακα 2024-2026):
 * 0–12.000€ → 15%
 * 12.001–35.000€ → 35%
 * >35.000€ → 45%
 */
export function estimateTax(annualIncome: number): number {
  if (annualIncome <= 0) return 0

  let tax = 0
  if (annualIncome <= 12000) {
    tax = annualIncome * 0.15
  } else if (annualIncome <= 35000) {
    tax = 12000 * 0.15 + (annualIncome - 12000) * 0.35
  } else {
    tax = 12000 * 0.15 + 23000 * 0.35 + (annualIncome - 35000) * 0.45
  }

  return Math.round(tax * 100) / 100
}

/**
 * Υπολογισμός συνολικής φορολογικής εικόνας (Tax & Compliance Summary)
 */
export interface FullTaxReport {
  annualIncome: number
  estimatedIncomeTax: number
  totalClimateFee: number
  isBusinessObligated: boolean // 3 or more properties
  estimatedVat: number // 13% if >= 3 properties
  municipalityFee: number // 0.5% if >= 3 properties
  netEstimatedIncome: number
}

export function calculateFullTaxReport(annualIncome: number, totalClimateFee: number, propertiesCount: number): FullTaxReport {
  const isBusinessObligated = propertiesCount >= 3
  const estimatedIncomeTax = estimateTax(annualIncome)
  const estimatedVat = isBusinessObligated ? Math.round(annualIncome * 0.13 * 100) / 100 : 0
  const municipalityFee = isBusinessObligated ? Math.round(annualIncome * 0.005 * 100) / 100 : 0
  
  // Το τέλος κλιματικής κρίσης εισπράττεται από τον επισκέπτη και αποδίδεται στην ΑΑΔΕ (δεν είναι έξοδο από το καθαρό μίσθωμα)
  const netEstimatedIncome = annualIncome - estimatedIncomeTax - (isBusinessObligated ? estimatedVat + municipalityFee : 0)

  return {
    annualIncome,
    estimatedIncomeTax,
    totalClimateFee,
    isBusinessObligated,
    estimatedVat,
    municipalityFee,
    netEstimatedIncome: Math.round(netEstimatedIncome * 100) / 100,
  }
}

export function getCurrentQuarter(date: Date = new Date()): { quarter: number; year: number } {
  const month = date.getMonth()
  const quarter = Math.floor(month / 3) + 1
  return { quarter, year: date.getFullYear() }
}

export function getQuarterLabel(quarter: number): string {
  const labels: Record<number, string> = {
    1: "Α' Τρίμηνο (Ιαν–Μαρ)",
    2: "Β' Τρίμηνο (Απρ–Ιουν)",
    3: "Γ' Τρίμηνο (Ιουλ–Σεπ)",
    4: "Δ' Τρίμηνο (Οκτ–Δεκ)",
  }
  return labels[quarter] || `Q${quarter}`
}

export function getQuarterDateRange(quarter: number, year: number): { start: Date; end: Date } {
  const startMonth = (quarter - 1) * 3
  const start = new Date(year, startMonth, 1)
  const end = new Date(year, startMonth + 3, 0)
  return { start, end }
}

export function getUpcomingDeadlines(count: number = 4): AadeDeadline[] {
  const now = new Date()
  const deadlines: AadeDeadline[] = []
  const { quarter: currentQ, year: currentYear } = getCurrentQuarter(now)

  for (let offset = -1; offset <= count; offset++) {
    let q = currentQ + offset
    let y = currentYear

    while (q < 1) { q += 4; y-- }
    while (q > 4) { q -= 4; y++ }

    // Quarterly references
    const deadline = new Date(y, (q * 3), 20)
    const daysLeft = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

    let status: AadeDeadline['status'] = 'ok'
    if (daysLeft < 0) status = 'overdue'
    else if (daysLeft <= 7) status = 'urgent'
    else if (daysLeft <= 30) status = 'upcoming'

    deadlines.push({
      quarter: q,
      year: y,
      label: getQuarterLabel(q),
      period: `${y}`,
      deadline,
      daysLeft,
      isOverdue: daysLeft < 0,
      status,
    })
  }

  return deadlines.sort((a, b) => a.deadline.getTime() - b.deadline.getTime())
}

export const AADE_STEPS = [
  {
    id: 1,
    title: '1. Σύνδεση στο Μητρώο Βραχυχρόνιας Διαμονής',
    description: 'Μπείτε με κωδικούς Taxisnet στο επίσημο portal της ΑΑΔΕ για βραχυχρόνιες μισθώσεις.',
    url: 'https://www1.gsis.gr/taxisnet/short_term_letting',
    action: 'Άνοιγμα Εφαρμογής ΑΑΔΕ',
  },
  {
    id: 2,
    title: '2. Επιλογή Ακινήτου (ΑΜΑ)',
    description: 'Επιλέξτε το ακίνητο βάσει του Αριθμού Μητρώου Ακινήτου (ΑΜΑ). Κάθε ακίνητο πρέπει να έχει ξεχωριστό ΑΜΑ.',
    url: 'https://www1.gsis.gr/taxisnet/short_term_letting',
    action: 'Διαχείριση Ακινήτων / ΑΜΑ',
  },
  {
    id: 3,
    title: '3. Μηνιαία Δήλωση Διαμονής',
    description: 'Καταχωρήστε τις κρατήσεις μέχρι την 20ή του επόμενου μήνα από την αναχώρηση του επισκέπτη.',
  },
  {
    id: 4,
    title: '4. Απόδοση Τέλους Ανθεκτικότητας στην Κλιματική Κρίση',
    description: 'Υποβάλετε τη μηνιαία δήλωση απόδοσης τέλους μέσω myAADE έως το τέλος του επόμενου μήνα (2€-8€/νύχτα).',
    url: 'https://myaade.gov.gr',
    action: 'Άνοιγμα myAADE',
  },
  {
    id: 5,
    title: '5. Ετήσια Φορολογική Δήλωση (Ε1 & Ε2)',
    description: 'Οριστικοποίηση Μητρώου έως 28 Φεβρουαρίου και μεταφορά των καθαρών εσόδων στο έντυπο Ε2 και Ε1.',
  },
]

/**
 * Υπολογισμός deadline δήλωσης για συγκεκριμένη κράτηση.
 * Deadline = 20η του επόμενου μήνα από το check-out.
 */
export function getBookingDeclarationDeadline(checkOutDate: Date): Date {
  const nextMonth = addMonths(startOfMonth(checkOutDate), 1)
  return new Date(nextMonth.getFullYear(), nextMonth.getMonth(), 20)
}

export function getBookingDeadlineStatus(checkOutDate: Date, now: Date = new Date()) {
  const deadline = getBookingDeclarationDeadline(checkOutDate)
  const daysLeft = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  return {
    deadline,
    daysLeft,
    isOverdue: daysLeft < 0,
    status: daysLeft < 0 ? 'overdue' : daysLeft <= 5 ? 'urgent' : daysLeft <= 15 ? 'upcoming' : 'ok' as const,
  }
}

export const NEW_REQUIREMENTS_2025 = [
  'Ασφάλεια αστικής ευθύνης για ζημιές ή ατυχήματα (υποχρεωτική από 1/10/2025)',
  'Πιστοποιητικό πυρασφάλειας / πυροσβεστήρες & ανιχνευτές καπνού',
  'Πιστοποιητικό μυοκτονίας / απεντόμωσης',
  'ΑΜΑ εγγεγραμμένο στο Μητρώο Βραχυχρόνιας Διαμονής ΑΑΔΕ',
  'Υποβολή Δήλωσης Βραχυχρόνιας Διαμονής έως την 20ή του επόμενου μήνα από αναχώρηση',
  'Έκδοση ειδικού στοιχείου & απόδοση Τέλους Ανθεκτικότητας (2€-8€/διανυκτέρευση) μηνιαίως',
]
