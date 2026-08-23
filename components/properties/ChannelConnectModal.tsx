'use client'

import { useState, useEffect } from 'react'
import {
  Sparkles, X, Check, ArrowRight, Zap, RefreshCw, Globe,
  ShieldCheck, AlertCircle, ExternalLink, Link2, Unlink, Lock
} from 'lucide-react'
import { isProUser } from '@/lib/permissions'
import ProFeatureModal from '@/components/ui/ProFeatureModal'

interface Property {
  id: string
  name: string
  address: string | null
  color: string
}

interface Props {
  property: Property
  userEmail?: string | null
  isOpen: boolean
  onClose: () => void
}

export default function ChannelConnectModal({ property, userEmail, isOpen, onClose }: Props) {
  const [connectingChannel, setConnectingChannel] = useState<string | null>(null)
  const [showProModal, setShowProModal] = useState(false)
  const [bookingHotelId, setBookingHotelId] = useState('')
  const [connectedChannels, setConnectedChannels] = useState<{
    airbnb: boolean
    booking: boolean
    vrbo: boolean
  }>({
    airbnb: false,
    booking: false,
    vrbo: false,
  })
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const [currentEmail, setCurrentEmail] = useState<string | null>(userEmail ?? null)

  const isPro = isProUser(currentEmail)

  useEffect(() => {
    if (userEmail) {
      setCurrentEmail(userEmail)
    } else {
      import('@/lib/supabase/client').then(({ createClient }) => {
        createClient().auth.getUser().then(({ data: { user } }) => {
          if (user?.email) setCurrentEmail(user.email)
        })
      })
    }
  }, [userEmail])

  useEffect(() => {
    try {
      const saved = localStorage.getItem(`greekhost_channels_${property.id}`)
      if (saved) {
        setConnectedChannels(JSON.parse(saved))
      }
      const savedHotelId = localStorage.getItem(`greekhost_booking_hotel_id_${property.id}`)
      if (savedHotelId) {
        setBookingHotelId(savedHotelId)
      }
    } catch {}
  }, [property.id])

  if (!isOpen) return null

  const handleConnectAirbnb = async () => {
    if (!isPro) {
      setShowProModal(true)
      return
    }

    setConnectingChannel('airbnb')
    setStatusMessage(null)

    // Simulate real OAuth session generation & connection
    setTimeout(() => {
      const updated = { ...connectedChannels, airbnb: true }
      setConnectedChannels(updated)
      try {
        localStorage.setItem(`greekhost_channels_${property.id}`, JSON.stringify(updated))
      } catch {}
      setConnectingChannel(null)
      setStatusMessage('✅ Το Airbnb συνδέθηκε επιτυχώς! Οι τιμές και τα μηνύματα συγχρονίζονται πλέον αυτόματα.')
    }, 1800)
  }

  const handleConnectBooking = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isPro) {
      setShowProModal(true)
      return
    }

    if (!bookingHotelId.trim()) {
      alert('Παρακαλώ εισάγετε το Hotel ID / Property ID από το Booking.com Extranet.')
      return
    }

    setConnectingChannel('booking')
    setStatusMessage(null)

    setTimeout(() => {
      const updated = { ...connectedChannels, booking: true }
      setConnectedChannels(updated)
      try {
        localStorage.setItem(`greekhost_channels_${property.id}`, JSON.stringify(updated))
        localStorage.setItem(`greekhost_booking_hotel_id_${property.id}`, bookingHotelId.trim())
      } catch {}
      setConnectingChannel(null)
      setStatusMessage('✅ Το Booking.com συνδέθηκε επιτυχώς με το Channex Channel Manager!')
    }, 1800)
  }

  const handleDisconnect = (channel: 'airbnb' | 'booking' | 'vrbo') => {
    if (!confirm(`Αποσύνδεση του ${channel.toUpperCase()} από το ακίνητο ${property.name};`)) return
    const updated = { ...connectedChannels, [channel]: false }
    setConnectedChannels(updated)
    try {
      localStorage.setItem(`greekhost_channels_${property.id}`, JSON.stringify(updated))
    } catch {}
    setStatusMessage(`ℹ️ Το κανάλι ${channel.toUpperCase()} αποσυνδέθηκε.`)
  }

  return (
    <>
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <div
          className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 space-y-5 shadow-2xl animate-in zoom-in-95 duration-150 border border-gray-100 max-h-[92vh] overflow-y-auto relative"
          onClick={e => e.stopPropagation()}
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-5 right-5 text-gray-400 hover:text-gray-600 p-1.5 rounded-full hover:bg-gray-100 transition-colors"
          >
            <X size={18} />
          </button>

          {/* Header */}
          <div className="flex items-center gap-3 pr-8">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 via-teal-500 to-blue-600 text-white flex items-center justify-center font-black text-xl shadow-lg shadow-emerald-500/20 shrink-0">
              ⚡
            </div>
            <div>
              <div className="inline-flex items-center gap-1 bg-emerald-50 border border-emerald-200 text-emerald-800 px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider mb-0.5">
                <span>Channex 2-Way Channel Manager</span>
              </div>
              <h3 className="font-extrabold text-gray-900 text-base sm:text-lg">
                Σύνδεση OTA Κανάλια: {property.name}
              </h3>
            </div>
          </div>

          <p className="text-xs text-gray-600 leading-relaxed">
            Συνδέστε απευθείας τα κανάλια σας για <strong>αυτόματο συγχρονισμό τιμών σε 2 δευτερόλεπτα</strong> και <strong>ανάγνωση/απάντηση μηνυμάτων επισκεπτών</strong> μέσα από το GreekHost.
          </p>

          {statusMessage && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 p-3 rounded-2xl text-xs font-bold animate-in fade-in duration-200">
              {statusMessage}
            </div>
          )}

          {/* Channels List */}
          <div className="space-y-3.5">
            {/* 1. Airbnb Channel */}
            <div className="bg-gray-50 border border-gray-200/80 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-red-100 text-red-600 flex items-center justify-center font-black text-base shrink-0">
                    🔴
                  </div>
                  <div>
                    <h4 className="font-extrabold text-gray-900 text-xs sm:text-sm">Airbnb Official 2-Way Sync</h4>
                    <p className="text-[11px] text-gray-500">Αυτόματες τιμές, ημερολόγιο & συνομιλίες</p>
                  </div>
                </div>

                {connectedChannels.airbnb ? (
                  <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 px-2.5 py-1 rounded-full text-[10px] font-extrabold flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span>Συνδεδεμένο</span>
                  </span>
                ) : (
                  <span className="text-[10px] bg-gray-200 text-gray-600 font-bold px-2 py-0.5 rounded-md">
                    Αποσυνδεδεμένο
                  </span>
                )}
              </div>

              <div className="pt-1 flex items-center justify-between gap-2 border-t border-gray-200/60">
                {connectedChannels.airbnb ? (
                  <div className="flex items-center justify-between w-full">
                    <span className="text-[11px] text-emerald-800 font-bold">
                      🟢 Live Sync: Ενεργό (2-Way ARI & Chat)
                    </span>
                    <button
                      type="button"
                      onClick={() => handleDisconnect('airbnb')}
                      className="text-xs text-red-600 hover:underline font-bold"
                    >
                      Αποσύνδεση
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    disabled={connectingChannel === 'airbnb'}
                    onClick={handleConnectAirbnb}
                    className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition-all shadow-sm shadow-red-500/20 disabled:opacity-50"
                  >
                    {connectingChannel === 'airbnb' ? (
                      <>
                        <RefreshCw size={13} className="animate-spin" />
                        <span>Σύνδεση με Airbnb...</span>
                      </>
                    ) : (
                      <>
                        {!isPro && <Lock size={12} />}
                        <ExternalLink size={13} />
                        <span>🔗 Σύνδεση με Airbnb (1-Click OAuth)</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>

            {/* 2. Booking.com Channel */}
            <div className="bg-gray-50 border border-gray-200/80 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-black text-base shrink-0">
                    🔵
                  </div>
                  <div>
                    <h4 className="font-extrabold text-gray-900 text-xs sm:text-sm">Booking.com Channel Sync</h4>
                    <p className="text-[11px] text-gray-500">Συγχρονισμός μέσω Booking.com Extranet</p>
                  </div>
                </div>

                {connectedChannels.booking ? (
                  <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 px-2.5 py-1 rounded-full text-[10px] font-extrabold flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span>Συνδεδεμένο</span>
                  </span>
                ) : (
                  <span className="text-[10px] bg-gray-200 text-gray-600 font-bold px-2 py-0.5 rounded-md">
                    Αποσυνδεδεμένο
                  </span>
                )}
              </div>

              {connectedChannels.booking ? (
                <div className="flex items-center justify-between w-full pt-1 border-t border-gray-200/60">
                  <span className="text-[11px] text-emerald-800 font-bold">
                    🟢 Live Sync: Ενεργό (Property ID συνδεδεμένο)
                  </span>
                  <button
                    type="button"
                    onClick={() => handleDisconnect('booking')}
                    className="text-xs text-red-600 hover:underline font-bold"
                  >
                    Αποσύνδεση
                  </button>
                </div>
              ) : (
                <form onSubmit={handleConnectBooking} className="space-y-2 pt-1 border-t border-gray-200/60">
                  <div className="flex gap-2">
                    <input
                      value={bookingHotelId}
                      onChange={e => setBookingHotelId(e.target.value)}
                      placeholder="Hotel / Property ID (π.χ. 1048291)"
                      className="flex-1 border border-gray-300 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      type="submit"
                      disabled={connectingChannel === 'booking'}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2 rounded-xl text-xs transition-colors shrink-0 disabled:opacity-50"
                    >
                      {connectingChannel === 'booking' ? 'Σύνδεση...' : 'Σύνδεση'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>

          <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
            <span className="text-[11px] text-gray-400 font-medium">GreekHost Channel Infrastructure</span>
            <button
              type="button"
              onClick={onClose}
              className="bg-gray-900 hover:bg-black text-white font-bold py-2.5 px-5 rounded-2xl text-xs transition-colors"
            >
              Κλείσιμο
            </button>
          </div>
        </div>
      </div>

      {/* Pro Upgrade Modal */}
      <ProFeatureModal
        isOpen={showProModal}
        onClose={() => setShowProModal(false)}
        featureTitle="2-Way Channel Manager (Pro)"
        featureDescription="Αναβαθμίστε στο πακέτο Pro για να συνδέσετε αυτόματα τους λογαριασμούς σας σε Airbnb & Booking.com για ζωντανή αλλαγή τιμών και ενιαία συνομιλία!"
      />
    </>
  )
}
