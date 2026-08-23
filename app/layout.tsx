import type { Metadata } from 'next'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/next'
import { LanguageProvider } from '@/lib/languageContext'
import { ThemeProvider } from '@/lib/themeContext'
import './globals.css'

export const metadata: Metadata = {
  title: 'GreekHost — Διαχείριση Βραχυχρόνιων Μισθώσεων & ΑΑΔΕ',
  description: 'Η No.1 εφαρμογή για ιδιοκτήτες Airbnb στην Ελλάδα. Ημερολόγιο, συγχρονισμός κρατήσεων, φόροι & δηλώσεις ΑΑΔΕ.',
  manifest: '/manifest.json',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="el" suppressHydrationWarning>
      <body className="bg-gray-50 text-gray-900 antialiased">
        <ThemeProvider>
          <LanguageProvider>
            {children}
          </LanguageProvider>
        </ThemeProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}
