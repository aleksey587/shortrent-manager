'use client'

import { useState } from 'react'
import { MessageSquare, Mail, X, Send, CheckCircle2, Loader2 } from 'lucide-react'

export default function SupportModal({ isMobile = false }: { isMobile?: boolean }) {
  const [open, setOpen] = useState(false)
  const [senderEmail, setSenderEmail] = useState('')
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const supportEmail = 'gjokas.al@gmail.com'

  const handleSendDirect = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject, message, senderEmail }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Σφάλμα κατά την αποστολή.')
      }

      setSent(true)
      setTimeout(() => {
        setSent(false)
        setOpen(false)
        setMessage('')
        setSubject('')
        setSenderEmail('')
      }, 3500)
    } catch (err: any) {
      setError(err.message || 'Παρουσιάστηκε σφάλμα. Δοκιμάστε ξανά.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-blue-50 hover:text-blue-700 w-full transition-all text-left"
      >
        <MessageSquare size={18} className="text-blue-600" />
        <span>Επικοινωνία & Support</span>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div
            className="bg-white rounded-3xl p-6 sm:p-7 max-w-lg w-full shadow-2xl border border-gray-100 space-y-5 animate-in zoom-in-95 duration-200"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-md">
                  <MessageSquare size={20} />
                </div>
                <div>
                  <h3 className="font-extrabold text-gray-900 text-lg">Άμεση Επικοινωνία & Support</h3>
                  <p className="text-xs text-gray-500">Στείλτε μας το μήνυμά σας κατευθείαν μέσα από την εφαρμογή</p>
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1.5 rounded-xl hover:bg-gray-100"
              >
                <X size={18} />
              </button>
            </div>

            {sent ? (
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 text-center space-y-3 animate-in zoom-in-95 duration-200">
                <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 size={26} />
                </div>
                <h4 className="font-bold text-emerald-950 text-base">Το μήνυμά σας στάλθηκε επιτυχώς!</h4>
                <p className="text-xs text-emerald-800 leading-relaxed">
                  Το λάβαμε απευθείας και θα επικοινωνήσουμε μαζί σας σύντομα στο email σας.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSendDirect} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-gray-800 mb-1">
                    Το Email σας (για να σας απαντήσουμε)
                  </label>
                  <input
                    type="email"
                    value={senderEmail}
                    onChange={e => setSenderEmail(e.target.value)}
                    placeholder="το-email-σας@example.com"
                    className="w-full px-3.5 py-2.5 bg-white text-gray-900 placeholder:text-gray-400 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-800 mb-1">
                    Θέμα Μηνύματος *
                  </label>
                  <input
                    type="text"
                    value={subject}
                    onChange={e => setSubject(e.target.value)}
                    placeholder="π.χ. Ερώτηση για συγχρονισμό ημερολογίου Airbnb / φόρους"
                    required
                    className="w-full px-3.5 py-2.5 bg-white text-gray-900 placeholder:text-gray-400 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-800 mb-1">
                    Το Μήνυμά σας *
                  </label>
                  <textarea
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    placeholder="Γράψτε εδώ την ερώτηση, την παρατήρηση ή την πρότασή σας..."
                    required
                    rows={4}
                    className="w-full px-3.5 py-2.5 bg-white text-gray-900 placeholder:text-gray-400 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none shadow-2xs"
                  />
                </div>

                {error && (
                  <div className="bg-red-50 text-red-700 text-xs p-3 rounded-xl border border-red-200">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>Αποστολή Μηνύματος...</span>
                    </>
                  ) : (
                    <>
                      <Send size={15} />
                      <span>Αποστολή Μηνύματος</span>
                    </>
                  )}
                </button>

                <div className="pt-1 text-center">
                  <p className="text-[11px] text-gray-400">
                    Απευθείας email: <span className="font-semibold text-gray-600">{supportEmail}</span>
                  </p>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  )
}
