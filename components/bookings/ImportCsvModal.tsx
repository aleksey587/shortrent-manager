'use client'

import { useState } from 'react'
import { FileSpreadsheet, Upload, CheckCircle2, AlertCircle, X, Loader2 } from 'lucide-react'

interface Property {
  id: string
  name: string
}

interface Props {
  properties: Property[]
  onSuccess: () => void
}

export default function ImportCsvModal({ properties, onSuccess }: Props) {
  const [open, setOpen] = useState(false)
  const [propertyId, setPropertyId] = useState(properties[0]?.id || '')
  const [platform, setPlatform] = useState('airbnb')
  const [file, setFile] = useState<File | null>(null)
  const [csvText, setCsvText] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<{ updated: number; inserted: number; totalParsed: number } | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0]
    if (selected) {
      setFile(selected)
      const reader = new FileReader()
      reader.onload = (event) => {
        setCsvText(event.target?.result as string)
      }
      reader.readAsText(selected)
    }
  }

  const handleImport = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!propertyId) {
      setError('Παρακαλώ επιλέξτε ακίνητο.')
      return
    }
    if (!csvText.trim()) {
      setError('Παρακαλώ επιλέξτε ένα αρχείο CSV.')
      return
    }

    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const res = await fetch('/api/import-csv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ propertyId, csvText, platform }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Σφάλμα κατά την εισαγωγή.')
      }

      setResult({
        updated: data.updated,
        inserted: data.inserted,
        totalParsed: data.totalParsed,
      })
      onSuccess()
    } catch (err: any) {
      setError(err.message || 'Αποτυχία ανάγνωσης του CSV.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-semibold rounded-xl transition-all shadow-2xs"
      >
        <FileSpreadsheet size={15} />
        <span>Εισαγωγή CSV (Airbnb / Booking)</span>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div
            className="bg-white rounded-3xl p-6 sm:p-7 max-w-lg w-full shadow-2xl border border-gray-100 space-y-5 animate-in zoom-in-95 duration-200"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shadow-xs">
                  <FileSpreadsheet size={22} />
                </div>
                <div>
                  <h3 className="font-extrabold text-gray-900 text-lg">Εισαγωγή Κρατήσεων & Εσόδων CSV</h3>
                  <p className="text-xs text-gray-500">Αρχείο Εξαγωγής από Airbnb ή Booking.com</p>
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1.5 rounded-xl hover:bg-gray-100"
              >
                <X size={18} />
              </button>
            </div>

            {result ? (
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 text-center space-y-3">
                <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 size={26} />
                </div>
                <h4 className="font-bold text-emerald-950 text-base">Επιτυχής Εισαγωγή CSV!</h4>
                <div className="text-xs text-emerald-800 space-y-1">
                  <p>Βρέθηκαν συνολικά: <strong>{result.totalParsed}</strong> κρατήσεις</p>
                  <p>Νέες κρατήσεις που προστέθηκαν: <strong>{result.inserted}</strong></p>
                  <p>Υπάρχουσες που ενημερώθηκαν με τιμές: <strong>{result.updated}</strong></p>
                </div>
                <button
                  onClick={() => {
                    setResult(null)
                    setOpen(false)
                  }}
                  className="w-full mt-2 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-xs transition-all"
                >
                  Ολοκλήρωση
                </button>
              </div>
            ) : (
              <form onSubmit={handleImport} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-800 mb-1.5">
                    Επιλογή Ακινήτου *
                  </label>
                  <select
                    value={propertyId}
                    onChange={e => setPropertyId(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 bg-white text-gray-900 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    {properties.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-800 mb-1.5">
                    Πλατφόρμα Προέλευσης
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setPlatform('airbnb')}
                      className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                        platform === 'airbnb'
                          ? 'bg-rose-50 border-rose-500 text-rose-700'
                          : 'bg-gray-50 border-gray-200 text-gray-600'
                      }`}
                    >
                      Airbnb CSV
                    </button>
                    <button
                      type="button"
                      onClick={() => setPlatform('booking')}
                      className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                        platform === 'booking'
                          ? 'bg-blue-50 border-blue-500 text-blue-700'
                          : 'bg-gray-50 border-gray-200 text-gray-600'
                      }`}
                    >
                      Booking.com CSV
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-800 mb-1.5">
                    Αρχείο CSV *
                  </label>
                  <div className="border-2 border-dashed border-gray-300 hover:border-emerald-500 rounded-2xl p-6 text-center cursor-pointer transition-all bg-gray-50/50">
                    <input
                      type="file"
                      accept=".csv,text/csv"
                      onChange={handleFileChange}
                      className="hidden"
                      id="csv-upload-input"
                    />
                    <label htmlFor="csv-upload-input" className="cursor-pointer block space-y-2">
                      <Upload size={24} className="mx-auto text-gray-400" />
                      <div className="text-xs font-semibold text-gray-700">
                        {file ? file.name : 'Κάντε κλικ για επιλογή αρχείου .csv'}
                      </div>
                      <p className="text-[10px] text-gray-400">
                        Υποστηρίζει εξαγωγές εσόδων και κρατήσεων από Airbnb & Booking
                      </p>
                    </label>
                  </div>
                </div>

                {error && (
                  <div className="bg-red-50 text-red-700 text-xs p-3 rounded-xl border border-red-200 flex items-center gap-2">
                    <AlertCircle size={15} className="shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>Ανάγνωση & Εισαγωγή CSV...</span>
                    </>
                  ) : (
                    <>
                      <Upload size={15} />
                      <span>Εισαγωγή Κρατήσεων Τώρα</span>
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  )
}
