'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'

export type Language = 'el' | 'en'

interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: string, fallback?: string) => string
}

const TRANSLATIONS: Record<Language, Record<string, string>> = {
  el: {
    // Navigation
    'nav.dashboard': 'Επισκόπηση',
    'nav.properties': 'Ακίνητα',
    'nav.calendar': 'Ημερολόγιο',
    'nav.bookings': 'Κρατήσεις',
    'nav.cleaning': 'Καθαρισμός & Tasks',
    'nav.messages': 'Μηνύματα Επισκεπτών',
    'nav.guidebook': 'Ψηφιακός Οδηγός',
    'nav.aade': 'Φορολογικό & ΑΑΔΕ',
    'nav.pricing': 'Συνδρομές & Πλάνα',
    'nav.logout': 'Αποσύνδεση',
    'nav.whatsnew': '✨ Τι Νέο Υπάρχει',
    'nav.install': '📲 Εγκατάσταση App',
    'nav.support': '💬 Υποστήριξη & Βοήθεια',
    'badge.pro': '⭐ Pro Μέλος',
    'badge.admin': '👑 Super Admin',

    // Pricing Page
    'pricing.title': 'Απλή & Διαφανής Τιμολόγηση',
    'pricing.subtitle': 'Επιλέξτε το πλάνο που ταιριάζει στο portfolio των ακινήτων σας.',
    'pricing.banner': '🔥 Ειδική Προσφορά Έναρξης (Early Bird Launch) — Κλειδώστε τις προνομιακές τιμές πριν την επιστροφή στις κανονικές τιμές (7,99€ & 14,99€)!',
    'pricing.monthly': 'Μηνιαία Χρέωση',
    'pricing.yearly': 'Ετήσια Χρέωση',
    'pricing.two_months_free': '🎁 2 Μήνες ΔΩΡΟ!',
    'pricing.save_pct': 'Έκπτωση',
  },
  en: {
    // Navigation
    'nav.dashboard': 'Overview',
    'nav.properties': 'Properties',
    'nav.calendar': 'Calendar',
    'nav.bookings': 'Bookings',
    'nav.cleaning': 'Cleaning & Tasks',
    'nav.messages': 'Guest Messages',
    'nav.guidebook': 'Digital Guidebook',
    'nav.aade': 'Taxes & AADE',
    'nav.pricing': 'Plans & Pricing',
    'nav.logout': 'Sign Out',
    'nav.whatsnew': "✨ What's New",
    'nav.install': '📲 Install App',
    'nav.support': '💬 Support & Help',
    'badge.pro': '⭐ Pro Member',
    'badge.admin': '👑 Super Admin',

    // Pricing Page
    'pricing.title': 'Simple & Transparent Pricing',
    'pricing.subtitle': 'Choose the plan tailored to your short-term rental portfolio.',
    'pricing.banner': '🔥 Early Bird Launch Offer — Lock in special discount pricing before regular rates take effect (€7.99 & €14.99)!',
    'pricing.monthly': 'Monthly Billing',
    'pricing.yearly': 'Annual Billing',
    'pricing.two_months_free': '🎁 2 Months FREE!',
    'pricing.save_pct': 'Discount',
  },
}

const LanguageContext = createContext<LanguageContextType>({
  language: 'el',
  setLanguage: () => {},
  t: (key: string, fallback?: string) => fallback || key,
})

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>('el')

  useEffect(() => {
    try {
      const saved = localStorage.getItem('greekhost_lang') as Language
      if (saved === 'el' || saved === 'en') {
        setLanguageState(saved)
      }
    } catch {
      // ignore
    }
  }, [])

  const setLanguage = (lang: Language) => {
    setLanguageState(lang)
    try {
      localStorage.setItem('greekhost_lang', lang)
    } catch {
      // ignore
    }
  }

  const t = (key: string, fallback?: string): string => {
    const table = TRANSLATIONS[language]
    if (table && table[key]) {
      return table[key]
    }
    return fallback || key
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  return useContext(LanguageContext)
}
