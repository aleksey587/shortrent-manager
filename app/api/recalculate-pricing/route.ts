import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const { propertyId, overwriteExisting } = await request.json().catch(() => ({}))

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const magicCookie = request.cookies.get('greekhost_magic_user')?.value
    if (!user && !magicCookie) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Fetch all bookings for this user/property
    let query = supabase
      .from('bookings')
      .select('id, property_id, check_in, check_out, nights, total_price, price_per_night')

    if (propertyId) {
      query = query.eq('property_id', propertyId)
    }

    const { data: bookings, error } = await query
    if (error) throw error

    // Fetch properties to get their cleaning_fee
    let propQuery = supabase.from('properties').select('id, cleaning_fee')
    if (propertyId) propQuery = propQuery.eq('id', propertyId)
    const { data: userProps } = await propQuery

    const propCleaningMap: Record<string, number> = {}
    for (const p of userProps ?? []) {
      propCleaningMap[p.id] = p.cleaning_fee ? Number(p.cleaning_fee) : 0
    }

    // Fetch monthly_rates
    let ratesQuery = supabase.from('monthly_rates').select('property_id, year, month, price_per_night')
    if (propertyId) ratesQuery = ratesQuery.eq('property_id', propertyId)
    const { data: monthlyRates } = await ratesQuery

    // Build a lookup: property_id -> year -> month -> price_per_night
    const ratesMap: Record<string, Record<number, Record<number, number>>> = {}
    for (const r of monthlyRates ?? []) {
      if (!ratesMap[r.property_id]) ratesMap[r.property_id] = {}
      if (!ratesMap[r.property_id][r.year]) ratesMap[r.property_id][r.year] = {}
      ratesMap[r.property_id][r.year][r.month] = r.price_per_night
    }

    let updatedCount = 0
    let skippedCount = 0

    for (const b of bookings ?? []) {
      // Skip if already has price and overwriteExisting is false
      if (!overwriteExisting && b.total_price && b.total_price > 0) {
        skippedCount++
        continue
      }

      const checkInDate = new Date(b.check_in)
      const year = checkInDate.getFullYear()
      const month = checkInDate.getMonth() + 1 // 1-12

      // Try to get this property's monthly rate for this year/month
      const propRates = ratesMap[b.property_id]
      let rate: number | null = null

      if (propRates) {
        // First try exact year/month match
        rate = propRates[year]?.[month] ?? null

        // If not found, try adjacent years (e.g. 2027 booking uses 2026 rates)
        if (rate === null) {
          const years = Object.keys(propRates).map(Number).sort((a, b) => Math.abs(a - year) - Math.abs(b - year))
          for (const y of years) {
            if (propRates[y]?.[month] != null) {
              rate = propRates[y][month]
              break
            }
          }
        }
      }

      if (!rate || rate <= 0) {
        skippedCount++
        continue
      }

      // Calculate nights
      const startMs = new Date(b.check_in).getTime()
      const endMs = new Date(b.check_out).getTime()
      const nights = Math.max(1, Math.round((endMs - startMs) / (1000 * 60 * 60 * 24)))
      const cleaningFee = propCleaningMap[b.property_id] ?? 0
      const total = parseFloat(((nights * rate) + cleaningFee).toFixed(2))

      await supabase
        .from('bookings')
        .update({
          price_per_night: rate,
          cleaning_fee: cleaningFee,
          total_price: total,
        })
        .eq('id', b.id)

      updatedCount++
    }

    return NextResponse.json({
      success: true,
      updated: updatedCount,
      skipped: skippedCount,
      total: (bookings ?? []).length,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? 'Unknown error' }, { status: 500 })
  }
}
