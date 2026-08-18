import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const { subject, message } = await request.json()

    if (!subject || !message) {
      return NextResponse.json({ error: 'Παρακαλώ συμπληρώστε θέμα και μήνυμα.' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const userEmail = user?.email || 'Ανώνυμος χρήστης'
    const userId = user?.id || null

    // Store in Supabase support_messages table
    const { error: dbError } = await supabase.from('support_messages').insert({
      user_id: userId,
      user_email: userEmail,
      subject,
      message,
    })

    if (dbError) {
      console.error('Support message DB save error:', dbError)
    }

    return NextResponse.json({
      success: true,
      message: 'Το μήνυμα ελήφθη επιτυχώς!',
    })
  } catch (err: any) {
    console.error('Support API error:', err)
    return NextResponse.json({ error: 'Σφάλμα κατά την αποστολή.' }, { status: 500 })
  }
}
