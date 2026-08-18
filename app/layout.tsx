import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'ShortRent Manager',
  description: 'Διαχείριση βραχυχρόνιων μισθώσεων & ΑΑΔΕ',
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
