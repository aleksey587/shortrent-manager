'use client'

import { useState } from 'react'
import { Share2, Mail, MessageCircle, Copy, Check, Send, Sparkles, Lock } from 'lucide-react'
import Link from 'next/link'
import { format, parseISO } from 'date-fns'
import { el } from 'date-fns/locale'
import { calculateClimateFee, getBookingDeclarationDeadline } from '@/lib/aade'
import { openWhatsAppMessage } from '@/lib/utils'

interface BookingData {
  id: string
  guest_name: string | null
  check_in: string
  check_out: string
  nights: number
  price_per_night?: number | null
  cleaning_fee?: number | null
  total_price: number | null
  platform: string
  propertyName?: string
  amaNumber?: string | null
}

interface Props {
  booking: BookingData
  accountantEmail?: string
  isPro?: boolean
}

export default function ShareBookingModal({ booking, accountantEmail = '', isPro = false }: Props) {
  const [isOpen, setIsOpen] = useState(false)
  const [showProPrompt, setShowProPrompt] = useState(false)
  const [email, setEmail] = useState(accountantEmail)
  const [copied, setCopied] = useState(false)

  const checkInDate = parseISO(booking.check_in)
  const checkOutDate = parseISO(booking.check_out)
  const climateFee = calculateClimateFee(checkInDate, checkOutDate)
  const aadeDeadline = getBookingDeclarationDeadline(checkOutDate)

  const totalPrice = booking.total_price ?? 0
  const cleaningFee = booking.cleaning_fee ?? 0
  const taxableRental = Math.max(0, totalPrice - cleaningFee)

  const formattedMessage = `📌 Στοιχεία Κράτησης για Δήλωση στην ΑΑΔΕ
------------------------------------
🏠 Ακίνητο: ${booking.propertyName || 'Ακίνητο'}${booking.amaNumber ? ` (ΑΜΑ: ${booking.amaNumber})` : ''}
👤 Επισκέπτης: ${booking.guest_name || '—'}
📅 Check-in: ${format(checkInDate, 'dd/MM/yyyy')}
📅 Check-out: ${format(checkOutDate, 'dd/MM/yyyy')} (${booking.nights} διανυκτερεύσεις)
💳 Πλατφόρμα: ${booking.platform}
------------------------------------
💰 Φορολογητέο Μίσθωμα (Δήλωση ΑΑΔΕ): €${taxableRental.toLocaleString('el-GR', { minimumFractionDigits: 2 })}
🧹 Τέλος Καθαριότητας: €${cleaningFee.toLocaleString('el-GR', { minimumFractionDigits: 2 })}
💵 Συνολική Είσπραξη: €${totalPrice.toLocaleString('el-GR', { minimumFractionDigits: 2 })}
🏨 Τέλος Κλιματικής Κρίσης (myAADE): €${climateFee.toLocaleString('el-GR', { minimumFractionDigits: 2 })}
⏰ Καταληκτική Προθεσμία Δήλωσης: ${format(aadeDeadline, 'dd/MM/yyyy')}
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
    if (!isPro) {
      setShowProPrompt(true)
      return
    }
    openWhatsAppMessage(formattedMessage)
  }

  const shareViber = () => {
    if (!isPro) {
      setShowProPrompt(true)
      return
    }
    window.open(`viber://forward?text=${encodeURIComponent(formattedMessage)}`, '_blank')
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-xl transition-colors shadow-2xs"
        title="Κοινοποίηση / Αποστολή στο λογιστή"
      >
        <Share2 size={13} />
        <span>Στον Λογιστή</span>
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => {
            setIsOpen(false)
            setShowProPrompt(false)
          }}
        >
          <div
            className="bg-white rounded-3xl shadow-2xl p-6 sm:p-7 max-w-md w-full space-y-4 animate-in zoom-in-95 duration-200 border border-gray-100"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center">
                  <Share2 size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-base">Αποστολή στον Λογιστή</h3>
                  <p className="text-xs text-gray-500">Στοιχεία κράτησης έτοιμα για δήλωση</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsOpen(false)
                  setShowProPrompt(false)
                }}
                className="text-gray-400 hover:text-gray-600 p-1.5 rounded-xl hover:bg-gray-100"
              >
                &times;
              </button>
            </div>

            {/* Pro Paywall Banner if triggered */}
            {showProPrompt && (
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl p-4 space-y-2 animate-in fade-in duration-200 shadow-md">
                <div className="flex items-center gap-2 text-xs font-bold">
                  <Sparkles size={15} className="text-amber-300" />
                  <span>Αποκλειστικό Χαρακτηριστικό Pro</span>
                </div>
                <p className="text-xs text-blue-100 leading-relaxed">
                  Η άμεση αποστολή μέσω <strong>WhatsApp & Viber</strong> είναι διαθέσιμη στα πλάνα Pro & Business (από 4,08 €/μήνα).
                </p>
                <div className="flex items-center gap-2 pt-1">
                  <Link
                    href="/dashboard/pricing"
                    onClick={() => setIsOpen(false)}
                    className="flex-1 text-center bg-white text-blue-700 font-bold py-2 rounded-xl text-xs hover:bg-blue-50 transition-all shadow-xs"
                  >
                    Αναβάθμιση σε Pro
                  </Link>
                  <button
                    onClick={() => setShowProPrompt(false)}
                    className="px-3 py-2 bg-blue-700/60 hover:bg-blue-700 text-white rounded-xl text-xs"
                  >
                    Κλείσιμο
                  </button>
                </div>
              </div>
            )}

            {/* Message Preview */}
            <div className="bg-gray-50 border border-gray-200 rounded-2xl p-3.5 text-xs font-mono text-gray-700 whitespace-pre-line leading-relaxed max-h-44 overflow-y-auto">
              {formattedMessage}
            </div>

            {/* Quick Actions */}
            <div className="space-y-3 pt-1">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Email Λογιστή
                </label>
                <div className="flex gap-2">
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="logistis@example.gr"
                    className="flex-1 bg-white text-gray-900 border border-gray-300 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs"
                  />
                  <button
                    onClick={sendEmail}
                    className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-2 rounded-xl text-xs font-semibold transition-all shadow-xs"
                  >
                    <Mail size={13} />
                    <span>Email</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-1">
                {/* WhatsApp button with Pro Badge */}
                <button
                  onClick={shareWhatsApp}
                  className="relative flex items-center justify-center gap-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 py-2.5 rounded-xl text-xs font-semibold transition-all"
                >
                  <MessageCircle size={14} />
                  <span>WhatsApp</span>
                  {!isPro && (
                    <span className="absolute -top-2 -right-1 bg-amber-500 text-white text-[9px] font-bold px-1.5 py-0.2 rounded-full shadow-2xs">
                      PRO
                    </span>
                  )}
                </button>

                {/* Viber button with Pro Badge */}
                <button
                  onClick={shareViber}
                  className="relative flex items-center justify-center gap-1 bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 py-2.5 rounded-xl text-xs font-semibold transition-all"
                >
                  <Send size={13} />
                  <span>Viber</span>
                  {!isPro && (
                    <span className="absolute -top-2 -right-1 bg-amber-500 text-white text-[9px] font-bold px-1.5 py-0.2 rounded-full shadow-2xs">
                      PRO
                    </span>
                  )}
                </button>

                {/* Copy to clipboard */}
                <button
                  onClick={copyToClipboard}
                  className="flex items-center justify-center gap-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2.5 rounded-xl text-xs font-semibold transition-all"
                >
                  {copied ? <Check size={14} className="text-green-600" /> : <Copy size={13} />}
                  <span>{copied ? 'Έτοιμο!' : 'Αντιγραφή'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
