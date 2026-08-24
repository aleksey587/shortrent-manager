import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Fallback in-memory cloud store for user rules synced across devices
const userRulesCloudStore: Record<string, any[]> = {}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const email = user?.email || request.nextUrl.searchParams.get('email')

    if (!email) {
      return NextResponse.json({ rules: null }, { status: 200 })
    }

    const rules = userRulesCloudStore[email.toLowerCase()] || null
    return NextResponse.json({ rules, email }, { status: 200 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch rules' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const body = await request.json()
    const email = user?.email || body.email

    if (!email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (body.rules && Array.isArray(body.rules)) {
      userRulesCloudStore[email.toLowerCase()] = body.rules
    }

    return NextResponse.json({ success: true, email }, { status: 200 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to save rules' }, { status: 500 })
  }
}
