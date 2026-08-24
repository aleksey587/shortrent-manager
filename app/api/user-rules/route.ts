import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const THEODOROS_CUSTOM_RULES = [
  // 1. Instant Confirmation
  {
    id: 'rule-booking-confirm',
    title: 'Άμεση Επιβεβαίωση Κράτησης (Booking Confirmation)',
    enabled: true,
    triggerType: 'instant_booking',
    offsetDays: 0,
    sendTime: 'Άμεσα',
    channel: 'all',
    icon: '⚡',
    subject: 'Booking Confirmation: {{property_name}}',
    body: `Hope you are doing fine :)


Thank you so much for choosing my apartment !


I am excited to have you !


All the information you might need regarding your reservation, for example: address, self- check in instructions, check in/out times, and much more, will be sent to you a day before your arrival.


Please take some time to read the house manual and the house rules.


Looking forward to hearing from you !


Please do not hesitate to ask any questions you might have :)


Safe travels !`,
    photos: [],
  },

  // 2. Arrival & Transit Guide
  {
    id: 'rule-arrival-directions',
    title: 'Arrival & Transit Guide (Οδηγίες Άφιξης & Μετρό)',
    enabled: true,
    triggerType: 'instant_booking',
    offsetDays: 0,
    sendTime: '12:00',
    channel: 'all',
    icon: '✈️',
    subject: 'How to get here: {{property_name}}',
    body: `How to get here:

Please read carefully!


Adress: Parasiou 28,Athens 104 40
Floor: 6th floor
Bell: The Homis


From the airport:


Option 1: Take the metro (blue line) from the airport to Syntagma square.
The metro departs from the airport every 30' min (05' and 35' from 6:35 to 23:35) and takes about 40 minutes.

At Syntagma station change onto the red line to 'Larissa station'
From here it is a 5-minute walk home.


A one-way ticket for one person: 10.00 €
Return ticket for one person: 18.00 €
A one-way ticket for 2 persons: 18.00 €
A one-way ticket for 3 persons: 24.00 €
One-way half-price tickets (students younger than 25, youngsters 6-18, people older than 65+): 5.00 €
Children under 6 years: Free


Option 2: Take bus 'X95' (runs 24/7) from the airport (€6) to Syntagma square. It takes about 50 minutes. At Syntagma station change onto the red line to 'Larissa station'.`,
    photos: [],
  },

  // 3. Check-in & Lockbox Instructions with 4 Photos
  {
    id: 'rule-checkin-lockbox-photos',
    title: 'Check-in & Lockbox (Οδηγίες Κλειδοθήκης με Φωτογραφίες)',
    enabled: true,
    triggerType: 'checkin_day',
    offsetDays: 0,
    sendTime: '10:00',
    channel: 'all',
    icon: '🔑',
    subject: 'Check-in & Lockbox Instructions: {{property_name}}',
    body: `On the right side of the building you will find this letter box.
Open it to find the lockbox inside.
Pull down the black flap and enter code '3592'.
Push down the black button with the arrow and pull the latch towards you to open the box.
After you take the keys please return the numbers back to '0000'
Go up to the 5th floor by elevator. Then one more stairs up to the 6th floor.
As you exit the white door on the roofdeck our door is to your right.
Have a wonderful stay!`,
    photos: [
      { id: 'p1', title: '🔑 Κλειδοθήκη (Lockbox)', url: '/callisto/photo1_lockbox.jpg' },
      { id: 'p2', title: '🚪 Κεντρική Είσοδος', url: '/callisto/photo2_door.jpg' },
      { id: 'p3', title: '🔐 Κλειδοθήκη Code 3592', url: '/callisto/photo3_code3592.jpg' },
      { id: 'p4', title: '🛋️ Callisto Luxury Rooftop Suite', url: '/callisto/photo4_suite.jpg' }
    ],
  },

  // 4. Welcome, Wi-Fi & Jacuzzi Care
  {
    id: 'rule-welcome-wifi-jacuzzi',
    title: 'Καλωσόρισμα, Wi-Fi & Jacuzzi (Ημέρα Άφιξης)',
    enabled: true,
    triggerType: 'checkin_day',
    offsetDays: 0,
    sendTime: '15:00',
    channel: 'all',
    icon: '📶',
    subject: 'Welcome to {{property_name}} & Wi-Fi Details',
    body: `Welcome to {{property_name}}! 🏠✨

📶 Wi-Fi Network: {{wifi_name}}
🔑 Password: {{wifi_password}}

🛁 Jacuzzi Care & Tips:
• Please take a quick shower before entering the jacuzzi.
• Kindly turn off the jets/bubbles when not in use.

📱 Digital House Manual & Local Tips: {{guide_link}}

Wishing you a wonderful stay in Athens!`,
    photos: [],
  },

  // 5. Mid-Stay Comfort Check
  {
    id: 'rule-midstay-comfort',
    title: 'Έλεγχος Ικανοποίησης (Mid-Stay Comfort Check)',
    enabled: true,
    triggerType: 'mid_stay',
    offsetDays: 1,
    sendTime: '11:00',
    channel: 'all',
    icon: '☕',
    subject: 'How is your stay going at {{property_name}}?',
    body: `Good morning {{guest_name}}! ☀️

I hope you are enjoying your time at {{property_name}} and having a fantastic experience exploring Athens!

Please let me know if you need fresh towels, restaurant recommendations, or anything else to make your stay more comfortable.

Enjoy your day!`,
    photos: [],
  },

  // 6. Trash & House Care Reminder
  {
    id: 'rule-trash-guidelines',
    title: 'Οδηγίες Καθαριότητας & Απορρίμματα (House Care)',
    enabled: true,
    triggerType: 'before_checkout',
    offsetDays: 2,
    sendTime: '14:00',
    channel: 'all',
    icon: '🗑️',
    subject: 'Friendly reminder & House care: {{property_name}}',
    body: `Hello {{guest_name}}! 🌿

Hope you are having a pleasant stay.

Just a quick friendly reminder regarding trash disposal:
The large municipal waste bins are located just outside on Parasiou street.

Please feel free to reach out if you need anything!`,
    photos: [],
  },

  // 7. Check-out Instructions & Keys
  {
    id: 'rule-before-checkout-theo',
    title: 'Οδηγίες Αναχώρησης & Κλειδιά (1 ημέρα πριν το Check-out)',
    enabled: true,
    triggerType: 'before_checkout',
    offsetDays: 1,
    sendTime: '18:00',
    channel: 'all',
    icon: '🚪',
    subject: 'Check-out & Thank You: {{property_name}}',
    body: `Dear {{guest_name}} ,thank you for everything !


I hope you had a wonderful stay😊


As for the keys, it is best to leave them on the table or kitchen counter inside the apartment.


I want to thank you again for choosing my apartment to spend your time in Greece!


note that your review is most welcome as it helps me to keep improving ☺️


Wish you the best :)


Warmest regards, Theo`,
    photos: [],
  },

  // 8. Morning of Check-out Reminder
  {
    id: 'rule-checkout-morning-reminder',
    title: 'Υπενθύμιση Πρωί Αναχώρησης (Check-out Morning)',
    enabled: true,
    triggerType: 'before_checkout',
    offsetDays: 0,
    sendTime: '08:30',
    channel: 'all',
    icon: '⏰',
    subject: 'Check-out Reminder for today: {{property_name}}',
    body: `Good morning {{guest_name}}! ☀️

Friendly reminder that check-out is today by {{check_out_time}} to allow our cleaning team to prepare the suite for the next guests.

Please remember to:
1. Turn off the A/C units and water heater
2. Leave the keys on the table
3. Close the door firmly behind you

Have a safe trip back home! ✈️`,
    photos: [],
  },

  // 9. 5-Star Review Request & Farewell
  {
    id: 'rule-after-checkout-review-request',
    title: 'Ευχαριστήριο & Αίτημα Κριτικής 5★ (Μετά το Check-out)',
    enabled: true,
    triggerType: 'after_checkout',
    offsetDays: 0,
    sendTime: '15:00',
    channel: 'all',
    icon: '⭐',
    subject: 'Thank you for staying at {{property_name}}! ⭐⭐⭐⭐⭐',
    body: `Hello {{guest_name}}! 🌟

Thank you so much once again for staying at {{property_name}}! It was a true pleasure hosting you.

I will be leaving you a 5-star review as an exemplary guest. If you enjoyed your time and our hospitality, I would deeply appreciate it if you could leave a 5-star review on Airbnb as well — it helps our small hosting business immensely!

Hope to welcome you back to Greece soon! 🇬🇷`,
    photos: [],
  },
]

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const email = (request.nextUrl.searchParams.get('email') || '').toLowerCase().trim()

    let targetEmail = email
    if (!targetEmail) {
      const { data: { user } } = await supabase.auth.getUser()
      targetEmail = user?.email?.toLowerCase().trim() || ''
    }
    if (!targetEmail) return NextResponse.json({ rules: null }, { status: 200 })

    // Load from permanent DB table
    const { data, error } = await supabase
      .from('user_automation_rules')
      .select('rules')
      .eq('email', targetEmail)
      .maybeSingle()

    if (!error && data?.rules && Array.isArray(data.rules) && data.rules.length > 0) {
      return NextResponse.json({ rules: data.rules, email: targetEmail, source: 'db' }, { status: 200 })
    }

    // Fallback: return default rules for Theodoros if nothing saved yet
    if (targetEmail === 'theodoroskolokuthas@gmail.com') {
      return NextResponse.json({ rules: THEODOROS_CUSTOM_RULES, email: targetEmail, source: 'defaults' }, { status: 200 })
    }

    return NextResponse.json({ rules: null, email: targetEmail }, { status: 200 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch rules' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const email = (body.email || '').toLowerCase().trim()

    if (!email) return NextResponse.json({ error: 'Email required' }, { status: 400 })
    if (!body.rules || !Array.isArray(body.rules)) return NextResponse.json({ error: 'Rules required' }, { status: 400 })

    const supabase = await createClient()

    // Strip base64 data-URLs from photos before saving to DB (they are too large)
    // Keep only external https:// URLs and /callisto/... static paths
    const sanitizedRules = body.rules.map((rule: any) => ({
      ...rule,
      photos: (rule.photos || []).map((photo: any) => ({
        ...photo,
        url: photo.url?.startsWith('data:') ? '' : (photo.url || ''),
      })).filter((p: any) => p.url !== ''), // Remove photos that only had base64
    }))

    // Save permanently to Supabase DB
    const { error } = await supabase
      .from('user_automation_rules')
      .upsert(
        { email, rules: sanitizedRules, updated_at: new Date().toISOString() },
        { onConflict: 'email' }
      )

    if (error) {
      console.error('[user-rules] DB save error:', error.message)
      return NextResponse.json({ error: 'Failed to save to DB: ' + error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, email, saved: sanitizedRules.length }, { status: 200 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message ?? 'Failed to save rules' }, { status: 500 })
  }
}
