import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://bgbcnftrecdlpbrgpfth.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJnYmNuZnRyZWNkbHBicmdwZnRoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY5ODc0NDIsImV4cCI6MjEwMjU2MzQ0Mn0.57gZd434LTksTlH2L4cyFxkhpzsp3MLfr5FR_tm-EGw'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function run() {
  const { data: props, error: pErr } = await supabase.from('properties').select('*')
  console.log('PROPERTIES:', JSON.stringify(props, null, 2))

  const { data: rates, error: rErr } = await supabase.from('monthly_rates').select('*')
  console.log('MONTHLY_RATES:', JSON.stringify(rates, null, 2))

  const { data: bookings, error: bErr } = await supabase.from('bookings').select('*').limit(20)
  console.log('BOOKINGS SAMPLE:', JSON.stringify(bookings, null, 2))
}

run()
