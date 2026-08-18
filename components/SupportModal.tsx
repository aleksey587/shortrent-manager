'use client'

import { useState } from 'react'
import { MessageSquare, Mail, X, Send, CheckCircle2 } from 'lucide-react'

export default function SupportModal({ isMobile = false }: { isMobile?: boolean }) {
  const [open, setOpen] = useState(false)
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [sent, setSent] = useState(false)

  const supportEmail = 'gjokas.al@gmail.com'

  const handleSendEmail = (e: React.FormEvent) => {
    e.preventDefault()
    const mailtoUrl = `mailto:${supportEmail}?subject=${encodeURIComponent(
      subject ? `GreekHost — ${subject}` : 'GreekHost — Ερώτηση / Υποστήριξη'
    )}&body=${encodeURIComponent(message)}`
    
    window.location.href = mailtoUrl
    setSent(true)
    setTimeout(() => {
      setSent(false)
      setOpen(false)
      setMessage('')
      setSubject('')
    }, 2500)
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div
            className="bg-white rounded-3xl p-6 sm:p-7 max-w-lg w-full shadow-2xl border border-gray-100 space-y-5 animate-in zoom-in-95 duration-200"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center">
                  <Mail size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-lg">Επικοινωνία & Υποστήριξη</h3>
                  <p className="text-xs text-gray-500">Είμαστε εδώ για ό,τι χρειαστείτε</p>
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1.5 rounded-xl hover:bg-gray-100"
              >
                <X size={18} />
              </button>
            </div>

            {/* Direct Email Card */}
            <div className="bg-blue-50/70 border border-blue-100 rounded-2xl p-4 flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider block">
                  Απευθείας Email
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

            {/* Quick Contact Form */}
            <form onSubmit={handleSendEmail} className="space-y-3.5 pt-1">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Θέμα Μηνύματος
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={e => setSubject(e.target.value)}
                  placeholder="π.χ. Ερώτηση για το iCal Sync ή τους φόρους"
                  required
                  className="w-full px-3.5 py-2.5 bg-white text-gray-900 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Το Μήνυμά σας
                </label>
                <textarea
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  placeholder="Γράψτε μας την ερώτηση ή την πρότασή σας..."
                  required
                  rows={4}
                  className="w-full px-3.5 py-2.5 bg-white text-gray-900 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>

              {sent ? (
                <div className="bg-emerald-50 text-emerald-800 text-xs font-semibold p-3 rounded-xl flex items-center justify-center gap-2 border border-emerald-200">
                  <CheckCircle2 size={16} />
                  <span>Το μήνυμα ετοιμάστηκε στο πρόγραμμα email σας!</span>
                </div>
              ) : (
                <button
                  type="submit"
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-sm transition-all shadow-sm flex items-center justify-center gap-2"
                >
                  <Send size={15} />
                  <span>Αποστολή Μηνύματος</span>
                </button>
              )}
            </form>
          </div>
        </div>
      )}
    </>
  )
}
