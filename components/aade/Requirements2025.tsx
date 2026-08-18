'use client'

import { NEW_REQUIREMENTS_2025 } from '@/lib/aade'
import { CheckCircle2, Circle, AlertTriangle, ExternalLink } from 'lucide-react'
import { useState } from 'react'

export default function Requirements2025() {
  const [checked, setChecked] = useState<Set<number>>(new Set())

  const toggle = (i: number) => {
    setChecked(prev => {
      const next = new Set(prev)
      if (next.has(i)) next.delete(i)
      else next.add(i)
      return next
    })
  }

  const allDone = checked.size === NEW_REQUIREMENTS_2025.length

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-start gap-3 mb-5">
        <AlertTriangle size={20} className="text-amber-500 mt-0.5 shrink-0" />
        <div>
          <h2 className="font-semibold text-gray-900">Νέες Απαιτήσεις από 1/10/2025</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Νέες υποχρεώσεις για ακίνητα βραχυχρόνιας μίσθωσης (Ν. 5222/2025).
            Τσεκάρετε όσα έχετε ήδη κανονίσει.
          </p>
        </div>
      </div>

      <div className="space-y-2.5">
        {NEW_REQUIREMENTS_2025.map((req, i) => (
          <button
            key={i}
            onClick={() => toggle(i)}
            className={`w-full flex items-start gap-3 p-3.5 rounded-xl border text-left transition-all ${
              checked.has(i)
                ? 'border-green-200 bg-green-50'
                : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50'
            }`}
          >
            {checked.has(i)
              ? <CheckCircle2 size={18} className="text-green-500 shrink-0 mt-0.5" />
              : <Circle size={18} className="text-gray-300 shrink-0 mt-0.5" />
            }
            <span className={`text-sm ${checked.has(i) ? 'text-green-700 line-through decoration-green-400' : 'text-gray-700'}`}>
              {req}
            </span>
          </button>
        ))}
      </div>

      {allDone && (
        <div className="mt-4 flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl p-3">
          <CheckCircle2 size={16} className="text-green-500" />
          <p className="text-green-700 text-sm font-medium">Όλες οι απαιτήσεις πληρούνται! 🎉</p>
        </div>
      )}

      <div className="mt-4 pt-4 border-t border-gray-100">
        <a
          href="https://www1.gsis.gr/taxisnet/short_term_letting"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:underline font-medium"
        >
          Μητρώο Ακινήτων Βραχυχρόνιας Διαμονής (ΑΑΔΕ)
          <ExternalLink size={13} />
        </a>
        <p className="text-xs text-gray-400 mt-1">
          gsis.gr/taxisnet/short_term_letting — Εγγραφή & Δηλώσεις
        </p>
      </div>
    </div>
  )
}
