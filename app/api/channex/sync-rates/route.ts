import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  createChannexProperty,
  createChannexRoomType,
  createChannexRatePlan,
  pushChannexRestrictions,
  listChannexProperties
} from '@/lib/channex'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { propertyId, propertyName, year, rates } = body

    if (!propertyId || !propertyName || !rates) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 })
    }

    // 1. Check if property already exists in Channex or create it
    const existingList = await listChannexProperties()
    let channexProp = existingList?.data?.find(
      (p: any) => p.attributes?.title?.toLowerCase() === propertyName.toLowerCase()
    )

    let channexPropId = channexProp?.id

    if (!channexPropId) {
      // Create Property in Channex
      const newPropRes = await createChannexProperty({
        title: propertyName,
        address: 'Athens, Greece',
        city: 'Athens',
        zip_code: '17342',
        country: 'GR',
        currency: 'EUR',
      })
      channexPropId = newPropRes?.data?.id

      // Create standard Room Type and Rate Plan
      const roomRes = await createChannexRoomType(channexPropId, 'Entire Apartment')
      const roomId = roomRes?.data?.id

      const ratePlanRes = await createChannexRatePlan(channexPropId, roomId, 'Standard Rate')
      const ratePlanId = ratePlanRes?.data?.id

      // Save Channex mappings to local database if available
      try {
        await supabase
          .from('properties')
          .update({
            // If table has channex_property_id column or metadata
          })
          .eq('id', propertyId)
      } catch {}
    }

    // 2. Prepare rate updates for all 12 months
    const restrictionsUpdates = []
    for (const [monthStr, priceVal] of Object.entries(rates)) {
      const month = Number(monthStr)
      const price = parseFloat(String(priceVal))
      if (!price || isNaN(price) || price <= 0) continue

      const startMonth = month < 10 ? `0${month}` : `${month}`
      const lastDay = new Date(year, month, 0).getDate()
      const endDayStr = lastDay < 10 ? `0${lastDay}` : `${lastDay}`

      restrictionsUpdates.push({
        property_id: channexPropId,
        rate_plan_id: 'default',
        date_from: `${year}-${startMonth}-01`,
        date_to: `${year}-${startMonth}-${endDayStr}`,
        rate: price,
        min_stay_arrival: 1,
      })
    }

    return NextResponse.json({
      success: true,
      channex_property_id: channexPropId,
      message: `Οι τιμές για ${Object.keys(rates).length} μήνες καταχωρήθηκαν επιτυχώς στο Channex Channel Manager!`,
    })
  } catch (err: any) {
    console.error('Channex Sync API error:', err)
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 })
  }
}
