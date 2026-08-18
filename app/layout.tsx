import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'GreekHost — Διαχείριση Βραχυχρόνιων Μισθώσεων & ΑΑΔΕ',
  description: 'Η No.1 εφαρμογή για ιδιοκτήτες Airbnb στην Ελλάδα. Ημερολόγιο, συγχρονισμός κρατήσεων, φόροι & δηλώσεις ΑΑΔΕ.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="el">
      <body className="bg-gray-50 text-gray-900 antialiased">
        {children}
      </body>
    </html>
  )
}
