export const SUPER_ADMIN_EMAILS = [
  'gjokas.al@gmail.com',
]

export function isSuperAdmin(email?: string | null): boolean {
  if (!email) return false
  return SUPER_ADMIN_EMAILS.includes(email.toLowerCase().trim())
}

export function getUserTier(email?: string | null): 'free' | 'pro' | 'business' {
  if (isSuperAdmin(email)) return 'business'
  return 'free'
}
