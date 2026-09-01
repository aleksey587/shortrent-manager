import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Protect this route with a secret token
// Set CRON_SECRET in Vercel environment variables
const CRON_SECRET = process.env.CRON_SECRET

export async function GET(request: NextRequest) {
  // Verify the request is from Vercel Cron or authorized caller
  const authHeader = request.headers.get('authorization')
  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = await createClient()

  // Fetch ALL iCal sources across all users
  const { data: sources, error } = await supabase
    .from('ical_sources')
    .select('id, property_id, url, platform, last_synced_at, properties!inner(user_id, cleaning_fee)')

  if (error) {
    console.error('[Cron] Failed to fetch iCal sources:', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const results = {
    total: sources?.length ?? 0,
    synced: 0,
    skipped: 0,
    errors: 0,
    details: [] as any[],
  }

  for (const source of sources ?? []) {
    try {
      // Skip if synced in the last 2 minutes (unless force param is present)
      const isForce = request.nextUrl.searchParams.get('force') === 'true' || request.nextUrl.searchParams.get('force') === '1'
      if (source.last_synced_at && !isForce) {
        const lastSync = new Date(source.last_synced_at).getTime()
        const twoMinsAgo = Date.now() - 2 * 60 * 1000
        if (lastSync > twoMinsAgo) {
          results.skipped++
          continue
        }
      }

      const propCleaningFee = (source.properties as any)?.cleaning_fee
        ? Number((source.properties as any).cleaning_fee)
        : 0

      // Fetch monthly rates for this property
      const { data: monthlyRates } = await supabase
        .from('monthly_rates')
        .select('year, month, price_per_night')
        .eq('property_id', source.property_id)

      const ratesMap: Record<number, Record<number, number>> = {}
      for (const r of monthlyRates ?? []) {
        if (!ratesMap[r.year]) ratesMap[r.year] = {}
        ratesMap[r.year][r.month] = r.price_per_night
      }

      const getRateForDate = (dateStr: string): number => {
        const d = new Date(dateStr)
        const year = d.getFullYear()
        const month = d.getMonth() + 1
        if (ratesMap[year]?.[month]) return ratesMap[year][month]
        const years = Object.keys(ratesMap).map(Number).sort((a, b) => Math.abs(a - year) - Math.abs(b - year))
        for (const y of years) {
          if (ratesMap[y]?.[month]) return ratesMap[y][month]
        }
        return getSeasonalRate(dateStr)
      }

      // Fetch iCal
      const icalResponse = await fetch(source.url, {
        headers: { 'User-Agent': 'GreekHost-AutoSync/1.0' },
        signal: AbortSignal.timeout(15000), // 15 second timeout per source
      })

      if (!icalResponse.ok) {
        results.errors++
        results.details.push({ id: source.id, status: 'error', reason: `HTTP ${icalResponse.status}` })
        continue
      }

      const icalText = await icalResponse.text()
      const bookings = parseIcal(icalText, source.property_id, source.platform, getRateForDate, propCleaningFee)

      // Get existing bookings for deduplication
      const { data: existingBookings } = await supabase
        .from('bookings')
        .select('ical_uid, total_price, price_per_night, guest_name')
        .eq('property_id', source.property_id)

      const existingMap = new Map<string, any>()
      existingBookings?.forEach(b => { if (b.ical_uid) existingMap.set(b.ical_uid, b) })

      let added = 0
      let updated = 0
      let cancelled = 0

      // Collect UIDs currently active in the iCal feed
      const activeUids = new Set(bookings.map((b: any) => b.ical_uid).filter(Boolean))

      for (const booking of bookings) {
        const existing = existingMap.get(booking.ical_uid)
        if (existing) {
          if (existing.total_price != null && existing.total_price > 0) {
            booking.total_price = existing.total_price
            booking.price_per_night = existing.price_per_night
            booking.cleaning_fee = existing.cleaning_fee ?? booking.cleaning_fee
          }
          if (existing.source === 'csv') {
            booking.source = 'csv'
          }
          if (existing.guest_name && (!booking.guest_name || booking.guest_name.includes('Επισκέπτης'))) {
            booking.guest_name = existing.guest_name
          }
        }

        const { error: upsertErr } = await supabase
          .from('bookings')
          .upsert(booking, { onConflict: 'property_id,ical_uid' })

        if (!upsertErr) {
          if (existing) updated++
          else added++
        }
      }

      // CANCELLATION DETECTION: Delete iCal bookings no longer in the feed
      const existingIcalUids = [...existingMap.keys()]
      const cancelledUids = existingIcalUids.filter((uid: string) => !activeUids.has(uid))

      if (cancelledUids.length > 0) {
        const { data: toDelete } = await supabase
          .from('bookings')
          .select('id, ical_uid, source')
          .eq('property_id', source.property_id)
          .eq('platform', source.platform)
          .in('ical_uid', cancelledUids)

        const icalOnlyIds = (toDelete || [])
          .filter((b: any) => b.source === 'ical' || b.source === null)
          .map((b: any) => b.id)

        if (icalOnlyIds.length > 0) {
          await supabase.from('bookings').delete().in('id', icalOnlyIds)
          cancelled = icalOnlyIds.length
        }
      }

      // Update last_synced_at
      await supabase
        .from('ical_sources')
        .update({ last_synced_at: new Date().toISOString() })
        .eq('id', source.id)

      results.synced++
      results.details.push({ id: source.id, platform: source.platform, status: 'ok', added, updated, cancelled })

    } catch (err: any) {
      results.errors++
      results.details.push({ id: source.id, status: 'error', reason: err.message })
    }
  }

  console.log(`[Cron] Auto-sync complete: ${results.synced} synced, ${results.skipped} skipped, ${results.errors} errors`)

  return NextResponse.json({
    success: true,
    timestamp: new Date().toISOString(),
    ...results,
  })
}

function getSeasonalRate(dateStr: string): number {
  const month = parseInt(dateStr.slice(5, 7), 10)
  if (month >= 6 && month <= 9) return 125.0
  if (month === 4 || month === 5 || month === 10) return 85.0
  return 70.0
}

function parseIcal(
  icalText: string,
  propertyId: string,
  platform: string,
  getRateForDate: (d: string) => number,
  cleaningFee: number = 0
) {
  const bookings: any[] = []
  const events = icalText.split('BEGIN:VEVENT')

  for (let i = 1; i < events.length; i++) {
    const event = events[i]
    const getField = (field: string): string | null => {
      const match = event.match(new RegExp(`${field}[^:]*:([^\\r\\n]+)`))
      return match ? match[1].trim() : null
    }

    const uid = getField('UID')
    const dtstart = getField('DTSTART')
    const dtend = getField('DTEND')
    const summary = getField('SUMMARY') || ''
    const summaryLower = summary.toLowerCase().trim()

    if (!uid || !dtstart || !dtend) continue

    // Ignore calendar blocks / closed periods (not actual guest reservations)
    if (
      summaryLower.includes('closed') ||
      summaryLower.includes('not available') ||
      summaryLower.includes('blocked') ||
      summaryLower.includes('unavailable')
    ) {
      continue
    }

    const parseDate = (d: string): string => {
      const clean = d.replace(/[TZ]/g, '').replace(/[^0-9]/g, '')
      return `${clean.slice(0, 4)}-${clean.slice(4, 6)}-${clean.slice(6, 8)}`
    }

    const checkIn = parseDate(dtstart)
    const checkOut = parseDate(dtend)

    const nights = Math.max(1, Math.round(
      (new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (1000 * 60 * 60 * 24)
    ))

    // If a single reservation is excessively long (>60 nights) and has no real guest name, it's likely a seasonal block
    if (nights > 60 && (!summary || summaryLower.includes('reserved'))) {
      continue
    }

    const ratePerNight = getRateForDate(checkIn)
    const estimatedTotal = parseFloat(((nights * ratePerNight) + cleaningFee).toFixed(2))

    let cleanGuest = summary || null
    if (!cleanGuest || summaryLower.includes('reserved')) {
      const platformName = platform === 'booking' ? 'Booking.com' : platform === 'vrbo' ? 'VRBO' : 'Airbnb'
      cleanGuest = `Επισκέπτης ${platformName}`
    } else {
      cleanGuest = cleanGuest.replace(/^Airbnb\s*[-–:]\s*/i, '').trim()
    }

    bookings.push({
      property_id: propertyId,
      ical_uid: uid,
      platform,
      guest_name: cleanGuest,
      check_in: checkIn,
      check_out: checkOut,
      price_per_night: ratePerNight,
      cleaning_fee: cleaningFee,
      total_price: estimatedTotal,
      source: 'ical',
    })
  }

  return bookings
}
