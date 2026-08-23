'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'

export type ThemeMode = 'light' | 'dark'
export type BackgroundTheme = 'midnight' | 'oled' | 'emerald' | 'slate'

interface ThemeContextType {
  mode: ThemeMode
  bgTheme: BackgroundTheme
  setMode: (mode: ThemeMode) => void
  setBgTheme: (theme: BackgroundTheme) => void
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextType>({
  mode: 'light',
  bgTheme: 'midnight',
  setMode: () => {},
  setBgTheme: () => {},
  toggleTheme: () => {},
})

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>('light')
  const [bgTheme, setBgThemeState] = useState<BackgroundTheme>('midnight')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    try {
      const savedMode = localStorage.getItem('greekhost_theme_mode') as ThemeMode
      const savedBg = localStorage.getItem('greekhost_bg_theme') as BackgroundTheme
      
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      const initialMode = savedMode || (prefersDark ? 'dark' : 'light')
      const initialBg = savedBg || 'midnight'

      setModeState(initialMode)
      setBgThemeState(initialBg)
      applyTheme(initialMode, initialBg)
    } catch {
      // ignore
    }
    setMounted(true)
  }, [])

  const applyTheme = (currentMode: ThemeMode, currentBg: BackgroundTheme) => {
    const root = document.documentElement
    
    // Remove all theme classes first
    root.classList.remove('dark', 'theme-midnight', 'theme-oled', 'theme-emerald', 'theme-slate')

    if (currentMode === 'dark') {
      root.classList.add('dark')
      root.classList.add(`theme-${currentBg}`)
    }
  }

  const setMode = (newMode: ThemeMode) => {
    setModeState(newMode)
    applyTheme(newMode, bgTheme)
    try {
      localStorage.setItem('greekhost_theme_mode', newMode)
    } catch {
      // ignore
    }
  }

  const setBgTheme = (newBg: BackgroundTheme) => {
    setBgThemeState(newBg)
    applyTheme(mode, newBg)
    try {
      localStorage.setItem('greekhost_bg_theme', newBg)
    } catch {
      // ignore
    }
  }

  const toggleTheme = () => {
    const nextMode = mode === 'dark' ? 'light' : 'dark'
    setMode(nextMode)
  }

  return (
    <ThemeContext.Provider value={{ mode, bgTheme, setMode, setBgTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  return useContext(ThemeContext)
}
