'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { CheckCircle2, Clock, SkipForward } from 'lucide-react'
import { getQuarterLabel } from '@/lib/aade'

interface Declaration {
  id: string
  quarter: number
  year: number
  status: string
  total_income: number | null
  submitted_at: string | null
  notes: string | null
}

interface Props {
  declarations: Declaration[]
  currentYear: number
}

export default function AadeDeclarationTracker({ declarations, currentYear }: Props) {
  const supabase = createClient()
  const [loading, setLoading] = useState<string | null>(null)
  const [localDecls, setLocalDecls] = useState<Declaration[]>(declarations)

  async function updateDeclaration(quarter: number, status: 'submitted' | 'pending' | 'skipped') {
    const key = `${quarter}-${currentYear}`
    setLoading(key)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const existing = localDecls.find(d => d.quarter === quarter && d.year === currentYear)

    if (existing) {
      const { data } = await supabase
        .from('aade_declarations')
        .update({ status, submitted_at: status === 'submitted' ? new Date().toISOString() : null })
        .eq('id', existing.id)
        .select()
        .single()
      if (data) setLocalDecls(prev => prev.map(d => d.id === existing.id ? data : d))
    } else {
      const { data } = await supabase
        .from('aade_declarations')
        .insert({
          user_id: user.id,
          quarter,
          year: currentYear,
          status,
          submitted_at: status === 'submitted' ? new Date().toISOString() : null,
        })
        .select()
        .single()
      if (data) setLocalDecls(prev => [...prev, data])
    }

    setLoading(null)
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <h2 className="font-semibold text-gray-900 mb-1">Κατάσταση Δηλώσεων {currentYear}</h2>
      <p className="text-sm text-gray-500 mb-5">Σημειώστε ποιες δηλώσεις έχετε υποβάλλει</p>
      <div className="space-y-3">
        {[1, 2, 3, 4].map(q => {
          const decl = localDecls.find(d => d.quarter === q && d.year === currentYear)
          const status = decl?.status ?? 'pending'
          const key = `${q}-${currentYear}`
          const isLoading = loading === key

          return (
            <div key={q} className={`flex items-center justify-between p-4 rounded-xl border ${
              status === 'submitted' ? 'border-green-200 bg-green-50'
                : status === 'skipped' ? 'border-gray-200 bg-gray-50'
                : 'border-gray-100'
            }`}>
              <div className="flex items-center gap-3">
                {status === 'submitted' ? (
                  <CheckCircle2 size={18} className="text-green-500" />
                ) : status === 'skipped' ? (
                  <SkipForward size={18} className="text-gray-400" />
                ) : (
                  <Clock size={18} className="text-gray-300" />
                )}
                <div>
                  <p className="font-medium text-gray-900 text-sm">{getQuarterLabel(q)}</p>
                  {decl?.submitted_at && (
                    <p className="text-xs text-gray-400">
                      Υποβλήθηκε: {new Date(decl.submitted_at).toLocaleDateString('el-GR')}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                {status !== 'submitted' && (
                  <button
                    onClick={() => updateDeclaration(q, 'submitted')}
                    disabled={!!isLoading}
                    className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs rounded-lg font-medium transition-colors disabled:opacity-50"
                  >
                    {isLoading ? '...' : '✓ Υποβλήθηκε'}
                  </button>
                )}
                {status === 'submitted' && (
                  <button
                    onClick={() => updateDeclaration(q, 'pending')}
                    disabled={!!isLoading}
                    className="px-3 py-1.5 border border-gray-300 text-gray-600 text-xs rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                  >
                    Αναίρεση
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
