import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ rules: null }, { status: 200 })
    }

    const rules = user.user_metadata?.custom_rules || null
    return NextResponse.json({ rules, email: user.email }, { status: 200 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch rules' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const body = await request.json()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (body.rules && Array.isArray(body.rules)) {
      await supabase.auth.updateUser({
        data: {
          custom_rules: body.rules,
        }
      })
    }

    return NextResponse.json({ success: true, email: user.email }, { status: 200 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to save rules' }, { status: 500 })
  }
}
