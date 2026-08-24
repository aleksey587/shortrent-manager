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
  {
    id: 'rule-arrival-directions',
    title: 'Arrival',
    enabled: true,
    triggerType: 'instant_booking',
    offsetDays: 0,
    sendTime: '12:00',
    channel: 'all',
    icon: '💬',
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
  {
    id: 'rule-checkin-lockbox-photos',
    title: 'Check-in & Lockbox',
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
      { id: 'p1', title: '🔑 Κλειδοθήκη (Lockbox)', url: 'https://images.unsplash.com/photo-1558002038-1055907df827?w=600&auto=format&fit=crop&q=80' },
      { id: 'p2', title: '🚪 Κεντρική Είσοδος', url: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=600&auto=format&fit=crop&q=80' },
      { id: 'p3', title: '🔐 Κλειδοθήκη Code 3592', url: 'https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?w=600&auto=format&fit=crop&q=80' },
      { id: 'p4', title: '🛋️ Callisto Luxury Rooftop Suite', url: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=600&auto=format&fit=crop&q=80' }
    ],
  },
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
]

export async function GET(request: NextRequest) {
  try {
    const email = (request.nextUrl.searchParams.get('email') || '').toLowerCase().trim()

    if (!email) {
      const supabase = await createClient()
      const { data: { user } } = await supabase.auth.getUser()
      const userEmail = user?.email?.toLowerCase().trim()
      if (userEmail) {
        const rules = userRulesCloudStore[userEmail] || (userEmail === 'theodoroskolokuthas@gmail.com' ? THEODOROS_CUSTOM_RULES : null)
        return NextResponse.json({ rules, email: userEmail }, { status: 200 })
      }
      return NextResponse.json({ rules: null }, { status: 200 })
    }

    const rules = userRulesCloudStore[email] || (email === 'theodoroskolokuthas@gmail.com' ? THEODOROS_CUSTOM_RULES : null)
    return NextResponse.json({ rules, email }, { status: 200 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch rules' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const email = (body.email || '').toLowerCase().trim()

    if (!email) {
      return NextResponse.json({ error: 'Email required' }, { status: 400 })
    }

    if (body.rules && Array.isArray(body.rules)) {
      userRulesCloudStore[email] = body.rules
    }

    return NextResponse.json({ success: true, email }, { status: 200 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to save rules' }, { status: 500 })
  }
}
