'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { Mail, CheckCircle2, ArrowLeft } from 'lucide-react'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      setSent(true)
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
      <div className="mb-6">
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:underline mb-4"
        >
          <ArrowLeft size={14} />
          <span>Επιστροφή στη Σύνδεση</span>
        </Link>
        <h2 className="text-xl font-bold text-gray-900">Επαναφορά Κωδικού</h2>
        <p className="text-xs text-gray-500 mt-1">
          Εισάγετε το email σας για να λάβετε σύνδεσμο αλλαγής κωδικού.
        </p>
      </div>

      {sent ? (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 text-center space-y-3">
          <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 size={26} />
          </div>
          <h3 className="font-bold text-emerald-950 text-base">Ο σύνδεσμος εστάλη!</h3>
          <p className="text-xs text-emerald-800 leading-relaxed">
            Ελέγξτε τα εισερχόμενά σας (και τον φάκελο Spam) στο <strong className="underline">{email}</strong> για να ορίσετε τον νέο σας κωδικό.
          </p>
          <Link
            href="/login"
            className="inline-block mt-3 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl transition-all"
          >
            Επιστροφή στη Σύνδεση
          </Link>
        </div>
      ) : (
        <form onSubmit={handleReset} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-1.5">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 bg-white text-gray-900 placeholder:text-gray-400 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm shadow-sm"
              placeholder="email@example.com"
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-3.5 py-2.5 rounded-xl">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition-all shadow-sm disabled:opacity-50"
          >
            {loading ? 'Αποστολή Συνδέσμου...' : 'Αποστολή Συνδέσμου Επαναφοράς'}
          </button>
        </form>
      )}
    </div>
  )
}
