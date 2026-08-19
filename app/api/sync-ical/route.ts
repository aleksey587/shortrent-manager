import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const { sourceId, propertyId } = await request.json()

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Fetch iCal source
    const { data: source } = await supabase
      .from('ical_sources')
      .select('*, properties!inner(user_id, name)')
      .eq('id', sourceId)
      .single()

    if (!source || (source.properties as any).user_id !== user.id) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    // Fetch iCal data
    const icalResponse = await fetch(source.url, {
      headers: { 'User-Agent': 'ShortRentManager/1.0' },
    })
    if (!icalResponse.ok) {
      return NextResponse.json({ error: 'Failed to fetch iCal URL' }, { status: 400 })
    }

    const icalText = await icalResponse.text()
    const bookings = parseIcal(icalText, propertyId, source.platform)

    // Fetch existing bookings for this property to preserve custom manual prices
    const { data: existingBookings } = await supabase
      .from('bookings')
      .select('ical_uid, total_price, price_per_night, guest_name')
      .eq('property_id', propertyId)

    const existingMap = new Map<string, any>()
    existingBookings?.forEach(b => {
      if (b.ical_uid) existingMap.set(b.ical_uid, b)
    })

    let added = 0
    let updated = 0

    for (const booking of bookings) {
      const existing = existingMap.get(booking.ical_uid)
      
      // If booking exists and already has a custom price/name, keep it
      if (existing) {
        if (existing.total_price && !booking.total_price) {
          booking.total_price = existing.total_price
          booking.price_per_night = existing.price_per_night
        }
        if (existing.guest_name && (!booking.guest_name || booking.guest_name.includes('Επισκέπτης'))) {
          booking.guest_name = existing.guest_name
        }
      }

      const { error } = await supabase
        .from('bookings')
        .upsert(booking, { onConflict: 'property_id,ical_uid' })

      if (!error) {
        if (existing) updated++
        else added++
      }
    }

    // Update last_synced_at
    await supabase
      .from('ical_sources')
      .update({ last_synced_at: new Date().toISOString() })
      .eq('id', sourceId)

    return NextResponse.json({ success: true, added, updated, total: bookings.length })
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? 'Unknown error' }, { status: 500 })
  }
}

// Calculate seasonal rate for Athens / short term rental
function getSeasonalRate(dateStr: string): number {
  const month = parseInt(dateStr.slice(5, 7), 10) // 1 - 12
  // High season: June, July, August, September
  if (month >= 6 && month <= 9) return 125.0
  // Mid season: April, May, October
  if (month === 4 || month === 5 || month === 10) return 85.0
  // Low season: November, December, January, February, March
  return 70.0
}

function parseIcal(icalText: string, propertyId: string, platform: string) {
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
    const summary = getField('SUMMARY')

    if (!uid || !dtstart || !dtend) continue

    // Parse YYYYMMDD or YYYYMMDDTHHMMSSZ
    const parseDate = (d: string): string => {
      const clean = d.replace(/[TZ]/g, '').replace(/[^0-9]/g, '')
      return `${clean.slice(0, 4)}-${clean.slice(4, 6)}-${clean.slice(6, 8)}`
    }

    const checkIn = parseDate(dtstart)
    const checkOut = parseDate(dtend)

    // Calculate nights
    const startMs = new Date(checkIn).getTime()
    const endMs = new Date(checkOut).getTime()
    const nights = Math.max(1, Math.round((endMs - startMs) / (1000 * 60 * 60 * 24)))

    // Calculate seasonal estimated price
    const ratePerNight = getSeasonalRate(checkIn)
    const estimatedTotal = parseFloat((nights * ratePerNight).toFixed(2))

    // Format guest name
    let cleanGuest = summary || null
    if (!cleanGuest || cleanGuest.toLowerCase().includes('reserved') || cleanGuest.toLowerCase().includes('not available')) {
      const platformName = platform === 'booking' ? 'Booking.com' : platform === 'vrbo' ? 'VRBO' : 'Airbnb'
      cleanGuest = `Επισκέπτης ${platformName}`
    } else {
      // Remove any unwanted prefixes like "Airbnb - "
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
      total_price: estimatedTotal,
      source: 'ical',
    })
  }

  return bookings
}
