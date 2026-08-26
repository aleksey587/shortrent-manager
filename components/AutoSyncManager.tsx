'use client'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function AutoSyncManager() {
  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null

    const performSync = async () => {
      try {
        const lastSync = localStorage.getItem('greekhost_last_auto_sync')
        const now = Date.now()
        // Throttle: don't sync if last sync was under 90 seconds ago
        if (lastSync && now - parseInt(lastSync, 10) < 90 * 1000) {
          return
        }

        const supabase = createClient()
        const { data: props } = await supabase.from('properties').select('id')
        if (!props || props.length === 0) return

        for (const p of props) {
          await fetch('/api/sync-ical', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ propertyId: p.id }),
          }).catch(() => {})
        }

        localStorage.setItem('greekhost_last_auto_sync', String(now))
      } catch {}
    }

    // Initial background sync after 2 seconds
    const initialTimer = setTimeout(() => {
      performSync()
    }, 2000)

    // Repeat every 3 minutes while tab is open
    intervalId = setInterval(performSync, 3 * 60 * 1000)

    // Sync on tab focus / visibility return
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        performSync()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      clearTimeout(initialTimer)
      if (intervalId) clearInterval(intervalId)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])

  return null
}
