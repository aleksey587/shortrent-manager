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

    // Lazy init — only called on user action, not at render time
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
      setSuccess(true)
    }
  }

  if (success) {
    return (
      <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
        <div className="text-5xl mb-4">✅</div>
        <h2 className="text-xl font-semibold text-gray-800 mb-2">Επιτυχής Εγγραφή!</h2>
        <p className="text-gray-500 text-sm">
          Ελέγξτε το email σας για να επιβεβαιώσετε τον λογαριασμό σας.
        </p>
        <Link
          href="/login"
          className="mt-6 inline-block text-blue-600 hover:underline text-sm font-medium"
        >
          Επιστροφή στη σύνδεση
        </Link>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8">
      <h2 className="text-xl font-semibold text-gray-800 mb-6">Δημιουργία Λογαριασμού</h2>
      <form onSubmit={handleRegister} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            placeholder="email@example.com"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Κωδικός</label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            placeholder="Τουλάχιστον 8 χαρακτήρες"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Επιβεβαίωση Κωδικού</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            placeholder="••••••••"
          />
        </div>
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2 rounded-lg">
            {error}
          </div>
        )}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg transition-colors disabled:opacity-50"
        >
          {loading ? 'Εγγραφή...' : 'Δημιουργία Λογαριασμού'}
        </button>
      </form>
      <p className="text-center text-sm text-gray-500 mt-6">
        Έχετε ήδη λογαριασμό;{' '}
        <Link href="/login" className="text-blue-600 hover:underline font-medium">
          Είσοδος
        </Link>
      </p>
    </div>
  )
}
