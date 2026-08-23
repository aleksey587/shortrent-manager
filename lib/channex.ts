/**
 * Channex.io Direct Channel Manager Client
 * Connects GreekHost directly to Airbnb, Booking.com, VRBO & Expedia
 */

const CHANNEX_API_URL = process.env.CHANNEX_API_URL || 'https://staging.channex.io/api/v1'
const CHANNEX_API_KEY = process.env.CHANNEX_API_KEY || 'YMA31Y3FaAfYttZt47YT8YawygB8NhPy2cjnylxNDuFxtlz90xTlhlR8ljkZ0QWs'

interface ChannexPropertyPayload {
  title: string
  address: string
  city: string
  zip_code: string
  country: string // 'GR'
  currency: string // 'EUR'
  email?: string
}

interface RateUpdateItem {
  property_id: string
  rate_plan_id: string
  date_from: string // YYYY-MM-DD
  date_to: string   // YYYY-MM-DD
  rate: number      // in cents or standard units depending on rate plan
  min_stay_arrival?: number
  closed?: boolean
}

/**
 * Standard fetch wrapper for Channex API
 */
async function channexFetch(endpoint: string, options: RequestInit = {}) {
  const url = `${CHANNEX_API_URL}${endpoint}`
  const headers = {
    'user-api-key': CHANNEX_API_KEY,
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  }

  const response = await fetch(url, {
    ...options,
    headers,
  })

  const data = await response.json().catch(() => null)

  if (!response.ok) {
    console.error('Channex API Error:', data)
    throw new Error(data?.errors?.title || data?.errors?.detail || `Channex API error: ${response.status}`)
  }

  return data
}

/**
 * List all properties from Channex
 */
export async function listChannexProperties() {
  return channexFetch('/properties')
}

/**
 * Create or register a Property in Channex
 */
export async function createChannexProperty(payload: ChannexPropertyPayload) {
  return channexFetch('/properties', {
    method: 'POST',
    body: JSON.stringify({
      property: {
        title: payload.title,
        address: payload.address || 'Athens, Greece',
        city: payload.city || 'Athens',
        zip_code: payload.zip_code || '17342',
        country: payload.country || 'GR',
        currency: payload.currency || 'EUR',
        email: payload.email || 'info@greekhost.gr',
      }
    })
  })
}

/**
 * Create Room Type for a Property
 */
export async function createChannexRoomType(propertyId: string, title: string, count_of_rooms: number = 1, occ_default: number = 2) {
  return channexFetch('/room_types', {
    method: 'POST',
    body: JSON.stringify({
      room_type: {
        property_id: propertyId,
        title,
        count_of_rooms,
        occ_default,
        occ_max: occ_default + 2,
      }
    })
  })
}

/**
 * Create Rate Plan for a Room Type
 */
export async function createChannexRatePlan(propertyId: string, roomTypeId: string, title: string = 'Standard Rate') {
  return channexFetch('/rate_plans', {
    method: 'POST',
    body: JSON.stringify({
      rate_plan: {
        property_id: propertyId,
        room_type_id: roomTypeId,
        title,
        currency: 'EUR',
        sell_mode: 'per_room',
        rate_mode: 'manual',
      }
    })
  })
}

/**
 * Push ARI (Availability, Rates & Restrictions) update to Channex
 * This instantly propagates to connected Airbnb & Booking.com channels
 */
export async function pushChannexRestrictions(updates: {
  property_id: string
  rate_plan_id: string
  date_from: string
  date_to: string
  rate: number // price in EUR
  min_stay_arrival?: number
}[]) {
  const values = updates.map(u => ({
    property_id: u.property_id,
    rate_plan_id: u.rate_plan_id,
    date_from: u.date_from,
    date_to: u.date_to,
    rate: u.rate * 100, // Channex expects price in cents (e.g. 100€ = 10000)
    min_stay_arrival: u.min_stay_arrival || 1,
  }))

  return channexFetch('/restrictions', {
    method: 'POST',
    body: JSON.stringify({ values })
  })
}

/**
 * Check Channex connection health
 */
export async function checkChannexStatus() {
  try {
    const data = await listChannexProperties()
    return { success: true, count: data?.meta?.total ?? 0 }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}
