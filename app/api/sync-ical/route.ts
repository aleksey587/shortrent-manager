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
      .select('*, properties!inner(user_id)')
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

    let added = 0
    for (const booking of bookings) {
      const { error } = await supabase
        .from('bookings')
        .upsert(booking, { onConflict: 'property_id,ical_uid', ignoreDuplicates: true })
      if (!error) added++
    }

    // Update last_synced_at
    await supabase
      .from('ical_sources')
      .update({ last_synced_at: new Date().toISOString() })
      .eq('id', sourceId)

    return NextResponse.json({ success: true, added, total: bookings.length })
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? 'Unknown error' }, { status: 500 })
  }
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

    // Skip blocks (Airbnb marks unavailable dates as BLOCKED)
    if (summary?.toLowerCase().includes('not available') ||
        summary?.toLowerCase().includes('blocked') ||
        summary?.toLowerCase().includes('airbnb (not available)')) {
      // Still add these as bookings for calendar display
    }

    bookings.push({
      property_id: propertyId,
      ical_uid: uid,
      platform,
      guest_name: summary || null,
      check_in: checkIn,
      check_out: checkOut,
      source: 'ical',
    })
  }

  return bookings
}
