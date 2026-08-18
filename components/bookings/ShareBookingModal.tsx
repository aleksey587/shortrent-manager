'use client'

import { useState } from 'react'
import { Share2, Mail, MessageCircle, Copy, Check, Send } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { el } from 'date-fns/locale'
import { calculateClimateFee, getBookingDeclarationDeadline } from '@/lib/aade'

interface BookingData {
  id: string
  guest_name: string | null
  check_in: string
  check_out: string
  nights: number
  total_price: number | null
  platform: string
  propertyName?: string
  amaNumber?: string | null
}

interface Props {
  booking: BookingData
  accountantEmail?: string
}

export default function ShareBookingModal({ booking, accountantEmail = '' }: Props) {
  const [isOpen, setIsOpen] = useState(false)
  const [email, setEmail] = useState(accountantEmail)
  const [copied, setCopied] = useState(false)

  const checkInDate = parseISO(booking.check_in)
  const checkOutDate = parseISO(booking.check_out)
  const climateFee = calculateClimateFee(checkInDate, checkOutDate)
  const aadeDeadline = getBookingDeclarationDeadline(checkOutDate)

  const formattedMessage = `📌 Νέα Κράτηση για Δήλωση στην ΑΑΔΕ
------------------------------------
🏠 Ακίνητο: ${booking.propertyName || 'Ακίνητο'}${booking.amaNumber ? ` (ΑΜΑ: ${booking.amaNumber})` : ''}
👤 Επισκέπτης: ${booking.guest_name || '—'}
📅 Check-in: ${format(checkInDate, 'dd/MM/yyyy')}
📅 Check-out: ${format(checkOutDate, 'dd/MM/yyyy')} (${booking.nights} διανυκτερεύσεις)
💳 Πλατφόρμα: ${booking.platform}
💰 Μίσθωμα: €${(booking.total_price ?? 0).toLocaleString('el-GR', { minimumFractionDigits: 2 })}
🏨 Τέλος Κλιματικής Κρίσης (myAADE): €${climateFee.toLocaleString('el-GR', { minimumFractionDigits: 2 })}
⏰ Καταληκτική Προθεσμία Δήλωσης ΑΑΔΕ: ${format(aadeDeadline, 'dd/MM/yyyy')}
------------------------------------`

  const copyToClipboard = () => {
    navigator.clipboard.writeText(formattedMessage)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const sendEmail = () => {
    const subject = encodeURIComponent(`Στοιχεία Κράτησης ΑΑΔΕ - ${booking.propertyName || 'Ακίνητο'} (${format(checkOutDate, 'MM/yyyy')})`)
    const body = encodeURIComponent(formattedMessage)
    window.location.href = `mailto:${email}?subject=${subject}&body=${body}`
  }

  const shareWhatsApp = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(formattedMessage)}`, '_blank')
  }

  const shareViber = () => {
    window.open(`viber://forward?text=${encodeURIComponent(formattedMessage)}`, '_blank')
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-lg transition-colors"
        title="Κοινοποίηση / Αποστολή στο λογιστή"
      >
        <Share2 size={13} />
        <span>Στον Λογιστή</span>
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
          onClick={() => setIsOpen(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full space-y-4"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
                  <Share2 size={16} />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 text-base">Αποστολή στον Λογιστή</h3>
                  <p className="text-xs text-gray-500">Στοιχεία κράτησης έτοιμα για δήλωση</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600 text-lg leading-none"
              >
                &times;
              </button>
            </div>

            {/* Message Preview */}
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs font-mono text-gray-700 whitespace-pre-line leading-relaxed max-h-48 overflow-y-auto">
              {formattedMessage}
            </div>

            {/* Quick Actions */}
            <div className="space-y-3 pt-1">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Email Λογιστή
                </label>
                <div className="flex gap-2">
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="logistis@example.gr"
                    className="flex-1 border border-gray-300 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={sendEmail}
                    className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-xl text-xs font-medium transition-colors"
                  >
                    <Mail size={13} />
                    <span>Email</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-1">
                <button
                  onClick={shareWhatsApp}
                  className="flex items-center justify-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 py-2 rounded-xl text-xs font-medium transition-colors"
                >
                  <MessageCircle size={14} />
                  <span>WhatsApp</span>
                </button>

                <button
                  onClick={shareViber}
                  className="flex items-center justify-center gap-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 py-2 rounded-xl text-xs font-medium transition-colors"
                >
                  <Send size={13} />
                  <span>Viber</span>
                </button>

                <button
                  onClick={copyToClipboard}
                  className="flex items-center justify-center gap-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 rounded-xl text-xs font-medium transition-colors"
                >
                  {copied ? <Check size={14} className="text-green-600" /> : <Copy size={13} />}
                  <span>{copied ? 'Αντιγράφηκε!' : 'Αντιγραφή'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
