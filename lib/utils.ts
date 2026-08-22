import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatGreekPhone(rawPhone?: string | null): string {
  if (!rawPhone) return ''
  let clean = rawPhone.replace(/\D/g, '')
  if (clean.startsWith('0030')) clean = clean.slice(4)
  if (clean.length === 10 && clean.startsWith('69')) {
    clean = '30' + clean
  }
  return clean
}

export function openWhatsAppMessage(text: string, rawPhone?: string | null) {
  const phone = formatGreekPhone(rawPhone)
  const url = phone
    ? `https://api.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(text)}`
    : `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`

  try {
    const link = document.createElement('a')
    link.href = url
    link.target = '_blank'
    link.rel = 'noopener noreferrer'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  } catch {
    window.location.href = url
  }
}
