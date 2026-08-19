'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Eye, EyeOff } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError('Λανθασμένο email ή κωδικός.')
      setLoading(false)
    } else {
      router.push('/dashboard')
      router.refresh()
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
      <h2 className="text-xl font-bold text-gray-900 mb-6">Είσοδος</h2>
      <form onSubmit={handleLogin} className="space-y-4">
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
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-sm font-semibold text-gray-800">Κωδικός</label>
            <Link
              href="/forgot-password"
              className="text-xs text-blue-600 hover:underline font-medium"
            >
              Ξεχάσατε τον κωδικό;
            </Link>
          </div>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 pr-11 bg-white text-gray-900 placeholder:text-gray-400 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm shadow-sm"
              placeholder="••••••••"
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
          {loading ? 'Σύνδεση...' : 'Είσοδος'}
        </button>
      </form>
      <p className="text-center text-sm text-gray-600 mt-6">
        Δεν έχετε λογαριασμό;{' '}
        <Link href="/register" className="text-blue-600 hover:underline font-semibold">
          Εγγραφή
        </Link>
      </p>
    </div>
  )
}
