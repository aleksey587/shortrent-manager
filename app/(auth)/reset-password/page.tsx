'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, CheckCircle2 } from 'lucide-react'

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const router = useRouter()

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== confirmPassword) {
      setError('Οι κωδικοί δεν ταιριάζουν.')
      return
    }
    if (password.length < 8) {
      setError('Ο νέος κωδικός πρέπει να είναι τουλάχιστον 8 χαρακτήρες.')
      return
    }

    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      setSuccess(true)
      setTimeout(() => {
        router.push('/dashboard')
        router.refresh()
      }, 2000)
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
      <h2 className="text-xl font-bold text-gray-900 mb-2">Ορισμός Νέου Κωδικού</h2>
      <p className="text-xs text-gray-500 mb-6">
        Εισάγετε τον νέο επιθυμητό κωδικό πρόσβασης.
      </p>

      {success ? (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 text-center space-y-2">
          <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 size={26} />
          </div>
          <h3 className="font-bold text-emerald-950 text-base">Ο κωδικός άλλαξε επιτυχώς!</h3>
          <p className="text-xs text-emerald-800">Μεταφορά στον πίνακα ελέγχου...</p>
        </div>
      ) : (
        <form onSubmit={handleUpdatePassword} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-1.5">Νέος Κωδικός</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 pr-11 bg-white text-gray-900 placeholder:text-gray-400 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm shadow-sm"
                placeholder="Τουλάχιστον 8 χαρακτήρες"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                aria-label={showPassword ? 'Απόκρυψη κωδικού' : 'Εμφάνιση κωδικού'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-1.5">Επιβεβαίωση Νέου Κωδικού</label>
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
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition-all shadow-sm disabled:opacity-50"
          >
            {loading ? 'Ενημέρωση...' : 'Αποθήκευση Νέου Κωδικού'}
          </button>
        </form>
      )}
    </div>
  )
}
