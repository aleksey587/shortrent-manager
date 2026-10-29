'use client'

import { useState, useEffect } from 'react'
import { MessageSquare, Mail, X, Send, CheckCircle2, RefreshCw } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function SupportModal({ isMobile = false }: { isMobile?: boolean }) {
  const [open, setOpen] = useState(false)
  const [senderEmail, setSenderEmail] = useState('')
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const supportEmail = 'gjokas.al@gmail.com'
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user?.email) {
        setSenderEmail(user.email)
      } else if (typeof document !== 'undefined') {
        const match = document.cookie.match(/greekhost_magic_user=([^;]+)/)
        if (match) setSenderEmail(decodeURIComponent(match[1]))
      }
    })
  }, [])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    setSending(true)
    setErrorMsg(null)

    try {
      const res = await fetch('/api/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject,
          message,
          senderEmail,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Σφάλμα κατά την αποστολή')
      }

      setSent(true)
      setTimeout(() => {
        setSent(false)
        setOpen(false)
        setMessage('')
        setSubject('')
      }, 2200)
    } catch (err: any) {
      setErrorMsg(err.message || 'Σφάλμα κατά την αποστολή μηνύματος.')
    } finally {
      setSending(false)
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
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={() => setOpen(false)}
        >
          <div
            className="bg-white rounded-3xl p-6 sm:p-7 max-w-lg w-full shadow-2xl border border-gray-100 space-y-5 animate-in zoom-in-95 duration-200"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center shadow-xs">
                  <Mail size={22} />
                </div>
                <div>
                  <h3 className="font-extrabold text-gray-900 text-lg">Επικοινωνία & Υποστήριξη</h3>
                  <p className="text-xs text-gray-500">Άμεση αποστολή στην ομάδα του GreekHost</p>
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1.5 rounded-xl hover:bg-gray-100"
              >
                <X size={18} />
              </button>
            </div>

            {/* Direct Email Info Card */}
            <div className="bg-blue-50/80 border border-blue-100 rounded-2xl p-4 flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider block">
                  Email Υποστήριξης
                </span>
                <span className="font-semibold text-gray-900 text-sm">{supportEmail}</span>
              </div>
              <a
                href={`mailto:${supportEmail}?subject=GreekHost%20Support`}
                className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-3 py-2 rounded-xl transition-all shadow-xs flex items-center gap-1.5"
              >
                <Mail size={13} />
                <span>Άνοιγμα Email</span>
              </a>
            </div>

            {/* Contact Form */}
            <form onSubmit={handleSendMessage} className="space-y-3.5 pt-1">
              <div>
                <label className="block text-xs font-bold text-gray-800 mb-1">
                  Το Email σας (για απάντηση)
                </label>
                <input
                  type="email"
                  value={senderEmail}
                  onChange={e => setSenderEmail(e.target.value)}
                  placeholder="π.χ. name@email.com"
                  required
                  className="w-full px-3.5 py-2.5 bg-white text-gray-900 placeholder:text-gray-400 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-800 mb-1">
                  Θέμα Μηνύματος
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={e => setSubject(e.target.value)}
                  placeholder="π.χ. Ερώτηση για το iCal Sync ή τους φόρους"
                  required
                  className="w-full px-3.5 py-2.5 bg-white text-gray-900 placeholder:text-gray-400 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-800 mb-1">
                  Το Μήνυμά σας
                </label>
                <textarea
                  rows={4}
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  placeholder="Περιγράψτε μας πώς μπορούμε να βοηθήσουμε..."
                  required
                  className="w-full px-3.5 py-2.5 bg-white text-gray-900 placeholder:text-gray-400 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none shadow-2xs"
                />
              </div>

              {errorMsg && (
                <p className="text-xs font-bold text-red-600 bg-red-50 p-2.5 rounded-xl border border-red-200">
                  ❌ {errorMsg}
                </p>
              )}

              <button
                type="submit"
                disabled={sending || sent}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-3 rounded-xl text-sm transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {sent ? (
                  <>
                    <CheckCircle2 size={16} />
                    <span>Το μήνυμα στάλθηκε επιτυχώς!</span>
                  </>
                ) : sending ? (
                  <>
                    <RefreshCw size={16} className="animate-spin" />
                    <span>Αποστολή...</span>
                  </>
                ) : (
                  <>
                    <Send size={15} />
                    <span>Αποστολή Μηνύματος</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
