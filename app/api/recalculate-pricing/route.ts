import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

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

export async function POST(request: NextRequest) {
  try {
    const { propertyId } = await request.json().catch(() => ({}))

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Find all bookings with null or 0 total_price
    let query = supabase
      .from('bookings')
      .select('id, property_id, check_in, check_out, total_price, price_per_night, properties!inner(user_id)')
      .eq('properties.user_id', user.id)

    if (propertyId) {
      query = query.eq('property_id', propertyId)
    }

    const { data: bookings, error } = await query
    if (error) throw error

    let updatedCount = 0

    for (const b of bookings || []) {
      if (!b.total_price || b.total_price === 0) {
        const startMs = new Date(b.check_in).getTime()
        const endMs = new Date(b.check_out).getTime()
        const nights = Math.max(1, Math.round((endMs - startMs) / (1000 * 60 * 60 * 24)))

        const rate = getSeasonalRate(b.check_in)
        const total = parseFloat((nights * rate).toFixed(2))

        await supabase
          .from('bookings')
          .update({
            price_per_night: rate,
            total_price: total,
          })
          .eq('id', b.id)

        updatedCount++
      }
    }

    return NextResponse.json({ success: true, updated: updatedCount })
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? 'Unknown error' }, { status: 500 })
  }
}
