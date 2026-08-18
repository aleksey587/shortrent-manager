'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { MessageSquare, Mail, Calendar, User, RefreshCw, Trash2, Reply, CheckCircle2 } from 'lucide-react'
import { format } from 'date-fns'
import { el } from 'date-fns/locale'

interface SupportMessage {
  id: string
  user_email: string
  subject: string
  message: string
  created_at: string
}

export default function MessagesPage() {
  const [messages, setMessages] = useState<SupportMessage[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    fetchMessages()
  }, [])

  async function fetchMessages() {
    setLoading(true)
    const { data, error } = await supabase
      .from('support_messages')
      .select('*')
      .order('created_at', { ascending: false })

    if (!error && data) {
      setMessages(data)
    }
    setLoading(false)
  }

  async function deleteMessage(id: string) {
    if (!confirm('Διαγραφή μηνύματος;')) return
    await supabase.from('support_messages').delete().eq('id', id)
    fetchMessages()
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto py-2">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-md">
            <MessageSquare size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Εισερχόμενα Μηνύματα Support</h1>
            <p className="text-xs text-gray-500 mt-0.5">
              Όλα τα μηνύματα και οι ερωτήσεις των χρηστών εμφανίζονται εδώ σε πραγματικό χρόνο
            </p>
          </div>
        </div>

        <button
          onClick={fetchMessages}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold rounded-xl transition-all self-start sm:self-auto"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          <span>Ανανέωση</span>
        </button>
      </div>

      {/* Messages List */}
      {loading ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-gray-100">
          <RefreshCw size={24} className="animate-spin text-blue-600 mx-auto mb-2" />
          <p className="text-xs text-gray-500">Φόρτωση μηνυμάτων...</p>
        </div>
      ) : messages.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-dashed border-gray-200 space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto text-2xl">
            📬
          </div>
          <h3 className="font-bold text-gray-800 text-base">Δεν υπάρχουν νέα μηνύματα</h3>
          <p className="text-xs text-gray-400 max-w-sm mx-auto">
            Όταν κάποιος χρήστης στέλνει μήνυμα από τη φόρμα «Επικοινωνία & Support», θα εμφανίζεται αμέσως εδώ!
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {messages.map(msg => (
            <div
              key={msg.id}
              className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-all space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-gray-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
                    <User size={15} />
                  </div>
                  <div>
                    <span className="font-bold text-gray-900 text-sm block">
                      {msg.user_email || 'Χρήστης GreekHost'}
                    </span>
                    <span className="text-[11px] text-gray-400 flex items-center gap-1">
                      <Calendar size={11} />
                      {msg.created_at
                        ? format(new Date(msg.created_at), 'd MMMM yyyy, HH:mm', { locale: el })
                        : '—'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto">
                  <a
                    href={`mailto:${msg.user_email}?subject=${encodeURIComponent(
                      `Απάντηση από GreekHost: ${msg.subject}`
                    )}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold transition-all shadow-xs"
                  >
                    <Reply size={13} />
                    <span>Απάντηση</span>
                  </a>
                  <button
                    onClick={() => deleteMessage(msg.id)}
                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                    title="Διαγραφή"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-gray-900 text-base mb-1.5">
                  📌 {msg.subject}
                </h4>
                <p className="text-xs text-gray-700 leading-relaxed whitespace-pre-wrap bg-gray-50/80 p-4 rounded-2xl border border-gray-100">
                  {msg.message}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
