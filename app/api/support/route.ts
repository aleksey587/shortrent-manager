import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const { subject, message, senderEmail } = await request.json()

    if (!subject || !message) {
      return NextResponse.json({ error: 'Παρακαλώ συμπληρώστε θέμα και μήνυμα.' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const userEmail = senderEmail || user?.email || 'Χρήστης GreekHost'
    const userId = user?.id || null
    const targetEmail = 'gjokas.al@gmail.com'

    // 1. Send direct email to gjokas.al@gmail.com via FormSubmit API
    try {
      await fetch(`https://formsubmit.co/ajax/${targetEmail}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          _subject: `🔔 GreekHost Νέο Μήνυμα: ${subject}`,
          _replyto: userEmail,
          _captcha: 'false',
          'Αποστολέας (Email Χρήστη)': userEmail,
          'Θέμα': subject,
          'Μήνυμα': message,
          'Ημερομηνία': new Date().toLocaleString('el-GR'),
        }),
      })
    } catch (mailErr) {
      console.error('Email dispatch error:', mailErr)
    }

    // 2. Also save to Supabase support_messages table for full history backup
    try {
      await supabase.from('support_messages').insert({
        user_id: userId,
        user_email: userEmail,
        subject,
        message,
      })
    } catch (dbErr) {
      console.error('DB backup error:', dbErr)
    }

    return NextResponse.json({
      success: true,
      message: 'Το μήνυμα στάλθηκε επιτυχώς στο gjokas.al@gmail.com!',
    })
  } catch (err: any) {
    console.error('Support API error:', err)
    return NextResponse.json({ error: 'Σφάλμα κατά την αποστολή.' }, { status: 500 })
  }
}
