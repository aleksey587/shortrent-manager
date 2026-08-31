export interface UserSubscription {
  email: string
  tier: 'pro' | 'business'
  expiresAt: string // ISO date string or formatted date
  label: string
}

export const SUPER_ADMIN_EMAILS = [
  'gjokas.al@gmail.com',
]

// Registered Pro / Paid subscribers
export const PAID_SUBSCRIBERS: UserSubscription[] = [
  {
    email: 'theodoroskolokuthas@gmail.com',
    tier: 'pro',
    expiresAt: '2029-08-21T23:59:59.000Z',
    label: 'Pro (3 Έτη Προπληρωμένο — έως 21/08/2029)',
  },
]

export const USER_ID_MAP: Record<string, string> = {
  'theodoroskolokuthas@gmail.com': 'df2b28d9-5964-4efd-a2be-e9edf5de02a8',
  'demo@greekhost.gr': '1ab5df3a-8fc0-450e-9283-3fc7bd5ca4cb',
}

export function resolveUserId(user?: any, cookieEmail?: string | null): string | null {
  if (user?.id) return user.id
  if (cookieEmail) {
    const clean = cookieEmail.toLowerCase().trim()
    if (USER_ID_MAP[clean]) return USER_ID_MAP[clean]
  }
  if (typeof document !== 'undefined') {
    const match = document.cookie.match(/greekhost_magic_user=([^;]+)/)
    if (match) {
      const clean = decodeURIComponent(match[1]).toLowerCase().trim()
      if (USER_ID_MAP[clean]) return USER_ID_MAP[clean]
    }
  }
  return null
}

export function isSuperAdmin(email?: string | null): boolean {
  if (!email) return false
  return SUPER_ADMIN_EMAILS.includes(email.toLowerCase().trim())
}

export function getUserSubscription(email?: string | null): UserSubscription | null {
  if (!email) return null
  const cleanEmail = email.toLowerCase().trim()
  
  if (isSuperAdmin(cleanEmail)) {
    return {
      email: cleanEmail,
      tier: 'business',
      expiresAt: '2099-12-31T23:59:59.000Z',
      label: 'Super Admin (Απεριόριστη Πρόσβαση)',
    }
  }

  const found = PAID_SUBSCRIBERS.find(s => s.email.toLowerCase().trim() === cleanEmail)
  if (found) {
    // Check if not expired
    if (new Date(found.expiresAt).getTime() > Date.now()) {
      return found
    }
  }

  return null
}

export function isProUser(email?: string | null): boolean {
  if (!email) return false
  if (isSuperAdmin(email)) return true
  const sub = getUserSubscription(email)
  return sub !== null && (sub.tier === 'pro' || sub.tier === 'business')
}

export function getUserTier(email?: string | null): 'free' | 'pro' | 'business' {
  if (!email) return 'free'
  if (isSuperAdmin(email)) return 'business'
  const sub = getUserSubscription(email)
  if (sub) return sub.tier
  return 'free'
}

export function getMaxPropertiesAllowed(email?: string | null): number {
  const tier = getUserTier(email)
  if (tier === 'business') return 999
  if (tier === 'pro') return 3
  return 1
}
