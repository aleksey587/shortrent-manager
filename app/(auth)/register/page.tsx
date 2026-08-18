'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function RegisterPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const router = useRouter()

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== confirmPassword) {
      setError('Οι κωδικοί δεν ταιριάζουν.')
      return
    }
    if (password.length < 8) {
      setError('Ο κωδικός πρέπει να είναι τουλάχιστον 8 χαρακτήρες.')
      return
    }

    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/dashboard` },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      // Auto-redirect to dashboard if email confirmation is disabled
      router.push('/dashboard')
      router.refresh()
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
      <h2 className="text-xl font-bold text-gray-900 mb-6">Δημιουργία Λογαριασμού</h2>
      <form onSubmit={handleRegister} className="space-y-4">
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
        <div>
          <label className="block text-sm font-semibold text-gray-800 mb-1.5">Κωδικός</label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            className="w-full px-3.5 py-2.5 bg-white text-gray-900 placeholder:text-gray-400 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm shadow-sm"
            placeholder="Τουλάχιστον 8 χαρακτήρες"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-800 mb-1.5">Επιβεβαίωση Κωδικού</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
            required
            className="w-full px-3.5 py-2.5 bg-white text-gray-900 placeholder:text-gray-400 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm shadow-sm"
            placeholder="••••••••"
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
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition-all shadow-sm disabled:opacity-50 mt-2"
        >
          {loading ? 'Εγγραφή...' : 'Δημιουργία Λογαριασμού'}
        </button>
      </form>
      <p className="text-center text-sm text-gray-600 mt-6">
        Έχετε ήδη λογαριασμό;{' '}
        <Link href="/login" className="text-blue-600 hover:underline font-semibold">
          Είσοδος
        </Link>
      </p>
    </div>
  )
}
