import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// In-memory multi-tenant cloud cache
const userRulesCloudStore: Record<string, any[]> = {}

const THEODOROS_CUSTOM_RULES = [
  {
    id: 'rule-booking-confirm',
    title: 'Άμεση Επιβεβαίωση Κράτησης',
    enabled: true,
    triggerType: 'instant_booking',
    offsetDays: 0,
    sendTime: 'Άμεσα',
    channel: 'all',
    icon: '⚡',
    subject: 'Confirmation: {{property_name}}',
    body: 'Hope you are doing fine :)\n\nThank you so much for choosing my apartment !\n\nI am excited to have you !\n\nAll the information you might need regarding your reservation, for example: address, self- check in instructions, check in/out times, and much more, will be sent to you a day before your arrival.',
    photos: [],
  },
  {
    id: 'rule-before-checkin',
    title: 'Οδηγίες Άφιξης & Lockbox (1 ημέρα πριν)',
    enabled: true,
    triggerType: 'before_checkin',
    offsetDays: 1,
    sendTime: '12:00',
    channel: 'all',
    icon: '🔑',
    subject: 'Οδηγίες Άφιξης & Πρόσβασης: {{property_name}}',
    body: 'Ανυπομονούμε να σας υποδεχτούμε αύριο {{check_in}} στο {{property_name}}!\n\n📍 Διεύθυνση: {{address}}\n🕒 Check-in: από τις {{check_in_time}}\n🔐 Κωδικός Κλειδοθήκης (Lockbox): {{lockbox_code}}\n\n📸 Δείτε παρακάτω τη φωτογραφία της κλειδοθήκης και της εισόδου για εύκολη πρόσβαση!\n\nΕνημερώστε μας μόλις φτάσετε!',
    photos: [
      { id: 'p1', title: '🔑 Κλειδοθήκη (Lockbox)', url: 'https://images.unsplash.com/photo-1558002038-1055907df827?w=600&auto=format&fit=crop&q=80' },
      { id: 'p2', title: '🚪 Κεντρική Είσοδος', url: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=600&auto=format&fit=crop&q=80' }
    ],
  },
  {
    id: 'rule-checkin-wifi',
    title: 'Καλωσόρισμα & Κωδικός Wi-Fi (Ημέρα Άφιξης)',
    enabled: true,
    triggerType: 'checkin_day',
    offsetDays: 0,
    sendTime: '14:00',
    channel: 'all',
    icon: '📶',
    subject: 'Καλώς ήρθατε στο {{property_name}} & Στοιχεία Wi-Fi',
    body: 'Καλώς ήρθατε στο {{property_name}}! 🏠\n\n📶 Wi-Fi Δίκτυο: {{wifi_name}}\n🔑 Κωδικός Wi-Fi: {{wifi_password}}\n📱 Ψηφιακός Οδηγός Σπιτιού: {{guide_link}}\n\nΕυχόμαστε μια υπέροχη διαμονή!',
    photos: [],
  },
  {
    id: 'rule-midstay-check',
    title: 'Έλεγχος Ικανοποίησης (Mid-Stay Check)',
    enabled: true,
    triggerType: 'mid_stay',
    offsetDays: 1,
    sendTime: '11:00',
    channel: 'all',
    icon: '☕',
    subject: 'Πώς είναι η διαμονή σας στο {{property_name}};',
    body: 'Καλημέρα {{guest_name}}! Ελπίζουμε να απολαμβάνετε τη διαμονή σας στο {{property_name}}. Ενημερώστε μας αν χρειάζεστε επιπλέον πετσέτες, προτάσεις για φαγητό ή οτιδήποτε άλλο!',
    photos: [],
  },
  {
    id: 'rule-before-checkout',
    title: 'Οδηγίες Αναχώρησης & Κλειδιά (1 ημέρα πριν το Check-out)',
    enabled: true,
    triggerType: 'before_checkout',
    offsetDays: 1,
    sendTime: '18:00',
    channel: 'all',
    icon: '🚪',
    subject: 'Πληροφορίες Αναχώρησης (Check-out): {{property_name}}',
    body: 'Γεια σας {{guest_name}}, σας υπενθυμίζουμε ότι το check-out είναι αύριο {{check_out}} έως τις {{check_out_time}}.\n\nΠαρακαλούμε:\n1. Κλείστε το A/C και τον θερμοσίφωνα\n2. Αφήστε τα κλειδιά στην κλειδοθήκη (κωδικός {{lockbox_code}})\n\nΣας ευχαριστούμε θερμά για τη φιλοξενία!',
    photos: [],
  },
  {
    id: 'rule-after-checkout-review',
    title: 'Ευχαριστήριο & Αίτημα Κριτικής 5 Αστέρων (Μετά την Αναχώρηση)',
    enabled: true,
    triggerType: 'after_checkout',
    offsetDays: 0,
    sendTime: '15:00',
    channel: 'all',
    icon: '⭐',
    subject: 'Ευχαριστούμε για τη διαμονή σας! ⭐⭐⭐⭐⭐',
    body: 'Σας ευχαριστούμε πολύ που επιλέξατε το {{property_name}} για τη διαμονή σας! Ελπίζουμε να περάσατε υπέροχα.\n\nΑν μείνατε ευχαριστημένοι, μια θετική κριτική 5 αστέρων στην πλατφόρμα θα μας βοηθούσε απίστευτα. Καλό ταξίδι επιστροφής!',
    photos: [],
  },
]

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const email = (user?.email || request.nextUrl.searchParams.get('email') || '').toLowerCase().trim()

    if (!email) {
      return NextResponse.json({ rules: null }, { status: 200 })
    }

    const rules = userRulesCloudStore[email] || user?.user_metadata?.custom_rules || (email === 'theodoroskolokuthas@gmail.com' ? THEODOROS_CUSTOM_RULES : null)
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
    const email = (user?.email || body.email || '').toLowerCase().trim()

    if (!email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (body.rules && Array.isArray(body.rules)) {
      userRulesCloudStore[email] = body.rules
      if (user) {
        try {
          await supabase.auth.updateUser({
            data: { custom_rules: body.rules }
          })
        } catch {}
      }
    }

    return NextResponse.json({ success: true, email }, { status: 200 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to save rules' }, { status: 500 })
  }
}
