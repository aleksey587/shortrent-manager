export interface MessageTemplate {
  id: string
  title: string
  category: 'confirmation' | 'checkin' | 'midstay' | 'checkout' | 'review' | 'custom'
  language: 'el' | 'en'
  icon: string
  subject: string
  body: string
}

export const DEFAULT_GUEST_TEMPLATES: MessageTemplate[] = [
  // 1. Επιβεβαίωση Κράτησης (GR)
  {
    id: 'gr-confirmation',
    title: 'Επιβεβαίωση Κράτησης & Καλωσόρισμα',
    category: 'confirmation',
    language: 'el',
    icon: '🎉',
    subject: 'Επιβεβαίωση Κράτησης — {{property_name}}',
    body: `Γεια σας {{guest_name}}! 🌿

Σας ευχαριστούμε θερμά για την κράτησή σας στο {{property_name}}!

📋 Στοιχεία Διαμονής:
• Check-in: {{check_in}} (από τις {{check_in_time}})
• Check-out: {{check_out}} (έως τις {{check_out_time}})
• Διάρκεια: {{nights}} διανυκτερεύσεις
• Διεύθυνση: {{property_address}}

Λίγες ημέρες πριν την άφιξή σας θα σας στείλουμε αναλυτικές οδηγίες πρόσβασης και τον κωδικό εισόδου.

Είμαστε στη διάθεσή σας για οτιδήποτε χρειαστείτε!

Με εκτίμηση,
Ο οικοδεσπότης σας`
  },

  // 1. Booking Confirmation (EN)
  {
    id: 'en-confirmation',
    title: 'Booking Confirmation & Welcome',
    category: 'confirmation',
    language: 'en',
    icon: '🎉',
    subject: 'Booking Confirmation — {{property_name}}',
    body: `Hello {{guest_name}}! 🌿

Thank you very much for booking your stay at {{property_name}}!

📋 Reservation Details:
• Check-in: {{check_in}} (from {{check_in_time}})
• Check-out: {{check_out}} (until {{check_out_time}})
• Length of stay: {{nights}} nights
• Address: {{property_address}}

We will send you detailed check-in and access instructions a couple of days before your arrival.

Feel free to reach out if you have any questions!

Warm regards,
Your Host`
  },

  // 2. Οδηγίες Άφιξης & Check-in / Wi-Fi (GR)
  {
    id: 'gr-checkin',
    title: 'Οδηγίες Άφιξης, Εισόδου & Wi-Fi',
    category: 'checkin',
    language: 'el',
    icon: '🔑',
    subject: 'Οδηγίες Check-in & Πρόσβασης — {{property_name}}',
    body: `Καλησπέρα {{guest_name}}! 🏡

Ανυπομονούμε να σας υποδεχτούμε αύριο στο {{property_name}}!

🔑 Οδηγίες Εισόδου (Check-in: {{check_in_time}}):
• Διεύθυνση: {{property_address}}
• Κωδικός Lockbox / Εισόδου: {{lockbox_code}}
• Οδηγίες Πρόσβασης: {{directions}}

📶 Σύνδεση Wi-Fi:
• Δίκτυο (SSID): {{wifi_name}}
• Κωδικός: {{wifi_password}}

ℹ️ Χρήσιμες Πληροφορίες:
• Ζεστό νερό: Ο θερμοσίφωνας είναι πάντα έτοιμος / αυτόματος.
• Ήσυχες ώρες: 15:00 - 17:30 & 23:00 - 07:00.

Σας ευχόμαστε ένα ασφαλές ταξίδι και υπέροχη διαμονή!`
  },

  // 2. Check-in & Wi-Fi Details (EN)
  {
    id: 'en-checkin',
    title: 'Check-in & Wi-Fi Access Guide',
    category: 'checkin',
    language: 'en',
    icon: '🔑',
    subject: 'Check-in & Access Guide — {{property_name}}',
    body: `Hello {{guest_name}}! 🏡

We are looking forward to hosting you tomorrow at {{property_name}}!

🔑 Access & Check-in (from {{check_in_time}}):
• Address: {{property_address}}
• Keybox / Entry Code: {{lockbox_code}}
• Directions: {{directions}}

📶 Wi-Fi Details:
• Network (SSID): {{wifi_name}}
• Password: {{wifi_password}}

ℹ️ House Notes:
• Quiet hours: 15:00 - 17:30 & 23:00 - 07:00.
• Please treat our home with care and respect.

Wishing you a safe trip and a fantastic stay!`
  },

  // 3. Mid-Stay Check-in (GR)
  {
    id: 'gr-midstay',
    title: 'Έλεγχος Διαμονής (Όλα καλά;)',
    category: 'midstay',
    language: 'el',
    icon: '✨',
    subject: 'Πώς είναι η διαμονή σας στο {{property_name}};',
    body: `Καλημέρα {{guest_name}}! ☀️

Ελπίζουμε να απολαμβάνετε τη διαμονή σας στο {{property_name}} και να περνάτε υπέροχα!

Θέλαμε απλά να βεβαιωθούμε ότι όλα είναι εντάξει και άνετα. Αν χρειάζεστε επιπλέον πετσέτες, προτάσεις για φαγητό ή οτιδήποτε άλλο, μην διστάσετε να μας στείλετε μήνυμα!

Καλή συνέχεια στην ημέρα σας!`
  },

  // 3. Mid-Stay Check-in (EN)
  {
    id: 'en-midstay',
    title: 'Mid-Stay Check-in (How is everything?)',
    category: 'midstay',
    language: 'en',
    icon: '✨',
    subject: 'How is your stay at {{property_name}}?',
    body: `Good morning {{guest_name}}! ☀️

We hope you are having a wonderful time and enjoying your stay at {{property_name}}!

Just checking in to make sure everything is comfortable and going smoothly. If you need anything at all (extra towels, local recommendations, etc.), please feel free to let us know!

Have a fantastic day!`
  },

  // 4. Οδηγίες Αναχώρησης & Check-out (GR)
  {
    id: 'gr-checkout',
    title: 'Οδηγίες Αναχώρησης & Check-out',
    category: 'checkout',
    language: 'el',
    icon: '🧳',
    subject: 'Οδηγίες Check-out — {{property_name}}',
    body: `Καλημέρα {{guest_name}},

Ελπίζουμε να περάσατε υπέροχα κατά τη διαμονή σας!

Σας υπενθυμίζουμε ότι το Check-out είναι σήμερα έως τις {{check_out_time}}.

🧳 Πριν την αναχώρησή σας:
1. Παρακαλούμε κλείστε όλα τα κλιματιστικά (A/C) και τα φώτα.
2. Πετάξτε τα σκουπίδια στον εξωτερικό κάδο.
3. Τοποθετήστε το κλειδί πίσω στο lockbox και κλειδώστε το.

Σας ευχαριστούμε θερμά για τη φιλοξενία και σας ευχόμαστε καλό ταξίδι επιστροφής!`
  },

  // 4. Check-out Instructions (EN)
  {
    id: 'en-checkout',
    title: 'Check-out Instructions',
    category: 'checkout',
    language: 'en',
    icon: '🧳',
    subject: 'Check-out Instructions — {{property_name}}',
    body: `Good morning {{guest_name}},

We hope you enjoyed your stay with us!

This is a gentle reminder that check-out is today by {{check_out_time}}.

🧳 Before you leave:
1. Please ensure all A/C units and lights are turned off.
2. Place any trash in the outside bins.
3. Lock the door and return the key to the lockbox.

Thank you once again for being wonderful guests, and have a safe journey back home!`
  },

  // 5. Αίτημα Κριτικής 5 Αστέρων (GR)
  {
    id: 'gr-review',
    title: 'Ευχαριστήριο & Αίτημα Κριτικής 5★',
    category: 'review',
    language: 'el',
    icon: '⭐',
    subject: 'Ευχαριστούμε για τη διαμονή σας στο {{property_name}}!',
    body: `Αγαπητέ/ή {{guest_name}},

Ήταν πραγματικά χαρά μας να σας φιλοξενήσουμε στο {{property_name}}! Ήσασταν εξαιρετικοί επισκέπτες και σας αφήσαμε ήδη μια θετική κριτική 5 αστέρων! ⭐⭐⭐⭐⭐

Αν μείνατε ικανοποιημένοι από τη φιλοξενία μας, θα σήμαινε πάρα πολλά για εμάς αν αφιερώνατε 1 λεπτό για να μας αφήσετε μια κριτική 5 αστέρων στην πλατφόρμα. Μας βοηθάει καθοριστικά ως ανεξάρτητους οικοδεσπότες.

Αν υπάρχει οτιδήποτε θα μπορούσαμε να βελτιώσουμε, παρακαλούμε ενημερώστε μας άμεσα σε προσωπικό μήνυμα.

Ελπίζουμε να σας ξαναδούμε σύντομα!

Με θερμούς χαιρετισμούς,
Ο οικοδεσπότης σας`
  },

  // 5. 5-Star Review Request (EN)
  {
    id: 'en-review',
    title: 'Thank You & 5-Star Review Request',
    category: 'review',
    language: 'en',
    icon: '⭐',
    subject: 'Thank you for staying at {{property_name}}!',
    body: `Dear {{guest_name}},

It was an absolute pleasure hosting you at {{property_name}}! You were wonderful guests, and we have already left you a glowing 5-star review! ⭐⭐⭐⭐⭐

If you enjoyed your stay, it would mean the world to us if you could take a minute to leave us a 5-star review on the platform. As independent hosts, your feedback truly supports our home.

If there was anything less than perfect, please feel free to message us directly so we can improve for future stays.

We would love to welcome you back anytime!

Warmest regards,
Your Host`
  },
]

export function replaceTemplateVariables(
  template: string,
  vars: {
    guest_name?: string
    property_name?: string
    property_address?: string
    check_in?: string
    check_out?: string
    nights?: number | string
    check_in_time?: string
    check_out_time?: string
    wifi_name?: string
    wifi_password?: string
    lockbox_code?: string
    directions?: string
  }
): string {
  let result = template
  result = result.replace(/\{\{guest_name\}\}/g, vars.guest_name || 'Επισκέπτης')
  result = result.replace(/\{\{property_name\}\}/g, vars.property_name || 'Ακίνητο')
  result = result.replace(/\{\{property_address\}\}/g, vars.property_address || '—')
  result = result.replace(/\{\{check_in\}\}/g, vars.check_in || '—')
  result = result.replace(/\{\{check_out\}\}/g, vars.check_out || '—')
  result = result.replace(/\{\{nights\}\}/g, String(vars.nights || 1))
  result = result.replace(/\{\{check_in_time\}\}/g, vars.check_in_time || '15:00')
  result = result.replace(/\{\{check_out_time\}\}/g, vars.check_out_time || '11:00')
  result = result.replace(/\{\{wifi_name\}\}/g, vars.wifi_name || '—')
  result = result.replace(/\{\{wifi_password\}\}/g, vars.wifi_password || '—')
  result = result.replace(/\{\{lockbox_code\}\}/g, vars.lockbox_code || '—')
  result = result.replace(/\{\{directions\}\}/g, vars.directions || 'Είσοδος με κλειδοθήκη στην κύρια είσοδο.')
  return result
}
