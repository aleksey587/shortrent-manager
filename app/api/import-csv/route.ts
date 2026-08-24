import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const { propertyId, csvText, platform } = await request.json()

    if (!propertyId || !csvText) {
      return NextResponse.json({ error: 'Παρακαλώ επιλέξτε ακίνητο και αρχείο CSV.' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Verify property belongs to user
    const { data: prop } = await supabase
      .from('properties')
      .select('id, user_id, name')
      .eq('id', propertyId)
      .single()

    if (!prop || prop.user_id !== user.id) {
      return NextResponse.json({ error: 'Το ακίνητο δεν βρέθηκε.' }, { status: 404 })
    }

    const parsedBookings = parseCsv(csvText, propertyId, platform)
    if (parsedBookings.length === 0) {
      return NextResponse.json({ error: 'Δεν βρέθηκαν έγκυρες κρατήσεις στο αρχείο CSV' }, { status: 400 })
    }

    // Fetch existing bookings to match by dates
    const { data: existingBookings } = await supabase
      .from('bookings')
      .select('*')
      .eq('property_id', propertyId)

    let updatedCount = 0
    let insertedCount = 0

    for (const item of parsedBookings) {
      // Find matching existing booking by check_in and check_out
      const match = existingBookings?.find(
        b => b.check_in === item.check_in && b.check_out === item.check_out
      )

      if (match) {
        // Update existing booking with exact amounts and guest name
        const { error } = await supabase
          .from('bookings')
          .update({
            guest_name: item.guest_name || match.guest_name,
            total_price: item.total_price ?? match.total_price,
            price_per_night: item.price_per_night ?? match.price_per_night,
            platform: item.platform || match.platform,
            notes: item.confirmation_code ? `Κωδικός: ${item.confirmation_code}` : match.notes,
            source: 'csv',
          })
          .eq('id', match.id)

        if (!error) updatedCount++
      } else {
        // Insert as new booking
        const { error } = await supabase
          .from('bookings')
          .insert({
            property_id: propertyId,
            platform: item.platform || 'manual',
            guest_name: item.guest_name || null,
            check_in: item.check_in,
            check_out: item.check_out,
            nights: item.nights,
            price_per_night: item.price_per_night,
            total_price: item.total_price,
            notes: item.confirmation_code ? `Κωδικός: ${item.confirmation_code}` : null,
            source: 'csv',
          })

        if (!error) insertedCount++
      }
    }

    return NextResponse.json({
      success: true,
      totalParsed: parsedBookings.length,
      updated: updatedCount,
      inserted: insertedCount,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? 'Άγνωστο σφάλμα' }, { status: 500 })
  }
}

function parseCsv(csvText: string, propertyId: string, forcedPlatform?: string) {
  const lines = csvText.split(/\r?\n/).filter(line => line.trim().length > 0)
  if (lines.length < 2) return []

  const headerLine = lines[0]
  const delimiter = headerLine.includes(';') ? ';' : ','

  // Helper to split CSV row handling quotes
  const parseRow = (text: string): string[] => {
    const values: string[] = []
    let current = ''
    let insideQuotes = false

    for (let i = 0; i < text.length; i++) {
      const char = text[i]
      if (char === '"') {
        insideQuotes = !insideQuotes
      } else if (char === delimiter && !insideQuotes) {
        values.push(current.trim())
        current = ''
      } else {
        current += char
      }
    }
    values.push(current.trim())
    return values.map(v => v.replace(/^"|"$/g, '').trim())
  }

  const headers = parseRow(headerLine).map(h => h.toLowerCase().trim())

  // Find column indices
  const findCol = (candidates: string[]): number => {
    for (const c of candidates) {
      const idx = headers.findIndex(h => h.includes(c))
      if (idx !== -1) return idx
    }
    return -1
  }

  const checkInIdx = findCol(['start date', 'check-in', 'check in', 'έναρξη', 'ημερομηνία έναρξης', 'άφιξη', 'start'])
  const checkOutIdx = findCol(['end date', 'check-out', 'check out', 'λήξη', 'ημερομηνία λήξης', 'αναχώρηση', 'end'])
  const guestIdx = findCol(['guest name', 'guest', 'επισκέπτης', 'όνομα επισκέπτη', 'όνομα', 'contact', 'επαφή'])
  const amountIdx = findCol(['earnings', 'amount', 'paid out', 'gross earnings', 'total price', 'ποσό', 'έσοδα', 'σύνολο', 'τιμή', 'κέρδη', 'καθαρά κέρδη'])
  const codeIdx = findCol(['confirmation code', 'code', 'book number', 'κωδικός', 'κωδικός επιβεβαίωσης', 'αριθμός κράτησης'])
  const nightsIdx = findCol(['# of nights', 'nights', 'νύχτες', 'διανυκτερεύσεις'])

  const results: any[] = []

  // Clean date helper
  const parseDateStr = (raw: string): string | null => {
    if (!raw) return null
    const clean = raw.trim().replace(/\s+/g, '')

    // YYYY-MM-DD
    if (/^\d{4}[-\/.]\d{1,2}[-\/.]\d{1,2}$/.test(clean)) {
      const parts = clean.split(/[-\/.]/)
      const mm = parts[1].padStart(2, '0')
      const dd = parts[2].padStart(2, '0')
      return `${parts[0]}-${mm}-${dd}`
    }

    // DD/MM/YYYY or DD-MM-YYYY
    if (/^\d{1,2}[-\/.]\d{1,2}[-\/.]\d{4}$/.test(clean)) {
      const parts = clean.split(/[-\/.]/)
      const dd = parts[0].padStart(2, '0')
      const mm = parts[1].padStart(2, '0')
      return `${parts[2]}-${mm}-${dd}`
    }

    const d = new Date(raw)
    if (!isNaN(d.getTime())) {
      return d.toISOString().slice(0, 10)
    }
    return null
  }

  // Clean amount helper
  const parseAmount = (raw: string): number | null => {
    if (!raw) return null
    let clean = raw.replace(/[€$£\s]/g, '').trim()
    if (clean.includes(',') && clean.includes('.')) {
      clean = clean.replace(/,/g, '')
    } else if (clean.includes(',')) {
      clean = clean.replace(',', '.')
    }
    const num = parseFloat(clean)
    return isNaN(num) ? null : Math.abs(num)
  }

  for (let i = 1; i < lines.length; i++) {
    const row = parseRow(lines[i])
    if (row.length === 0 || !row[checkInIdx]) continue

    const checkIn = parseDateStr(row[checkInIdx])
    const checkOut = checkOutIdx !== -1 ? parseDateStr(row[checkOutIdx]) : null

    if (!checkIn) continue

    const guestName = guestIdx !== -1 ? row[guestIdx] : null
    const amount = amountIdx !== -1 ? parseAmount(row[amountIdx]) : null
    const code = codeIdx !== -1 ? row[codeIdx] : null

    // Calculate nights
    let nights = 1
    if (checkOut) {
      const diff = (new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (1000 * 60 * 60 * 24)
      nights = Math.max(1, Math.round(diff))
    } else if (nightsIdx !== -1 && row[nightsIdx]) {
      nights = parseInt(row[nightsIdx], 10) || 1
    }

    const effectiveCheckOut = checkOut || (() => {
      const d = new Date(checkIn)
      d.setDate(d.getDate() + nights)
      return d.toISOString().slice(0, 10)
    })()

    // Determine platform
    let platform = forcedPlatform || 'airbnb'
    const fullLine = lines[i].toLowerCase()
    if (fullLine.includes('booking')) platform = 'booking'
    else if (fullLine.includes('airbnb')) platform = 'airbnb'
    else if (fullLine.includes('vrbo')) platform = 'vrbo'

    const pricePerNight = amount ? parseFloat((amount / nights).toFixed(2)) : null

    results.push({
      property_id: propertyId,
      guest_name: guestName,
      check_in: checkIn,
      check_out: effectiveCheckOut,
      nights,
      total_price: amount,
      price_per_night: pricePerNight,
      platform,
      confirmation_code: code,
    })
  }

  return results
}
