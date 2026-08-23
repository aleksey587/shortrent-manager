'use client'

import { useState } from 'react'
import { Moon, Sun, Palette, Check, X, Sparkles } from 'lucide-react'
import { useTheme, BackgroundTheme } from '@/lib/themeContext'
import { useLanguage } from '@/lib/languageContext'

export default function ThemeCustomizerModal() {
  const { mode, bgTheme, setMode, setBgTheme, toggleTheme } = useTheme()
  const { language } = useLanguage()
  const [isOpen, setIsOpen] = useState(false)

  const isEn = language === 'en'

  const themeOptions: { id: BackgroundTheme; name: string; nameEn: string; desc: string; descEn: string; preview: string; ring: string }[] = [
    {
      id: 'midnight',
      name: 'Midnight Navy',
      nameEn: 'Midnight Navy',
      desc: 'Βαθύ μπλε-μαύρο (Προτεινόμενο)',
      descEn: 'Deep Blue-Black (Recommended)',
      preview: 'bg-[#080d1a] border-[#1e293b]',
      ring: 'border-blue-500',
    },
    {
      id: 'oled',
      name: 'OLED Pure Black',
      nameEn: 'OLED Pure Black',
      desc: 'Απόλυτο μαύρο για μέγιστη αντίθεση',
      descEn: 'Pitch black for ultimate contrast',
      preview: 'bg-[#000000] border-[#222222]',
      ring: 'border-white',
    },
    {
      id: 'emerald',
      name: 'Aegean Emerald',
      nameEn: 'Aegean Emerald',
      desc: 'Σκούρο teal & πετρόλ',
      descEn: 'Dark teal & petroleum tone',
      preview: 'bg-[#041210] border-[#123d37]',
      ring: 'border-emerald-500',
    },
    {
      id: 'slate',
      name: 'Slate Tech',
      nameEn: 'Slate Tech',
      desc: 'Γραφίτης & σκούρο γκρι',
      descEn: 'Graphite & deep slate gray',
      preview: 'bg-[#0f172a] border-[#334155]',
      ring: 'border-slate-400',
    },
  ]

  return (
    <>
      {/* Quick Theme Toggle & Customizer Button Group */}
      <div className="flex items-center bg-gray-100 dark:bg-gray-800 p-1 rounded-xl border border-gray-200 dark:border-gray-700">
        <button
          onClick={toggleTheme}
          className="p-1 rounded-lg text-gray-700 dark:text-gray-200 hover:bg-white dark:hover:bg-gray-700 transition-all"
          title={mode === 'dark' ? (isEn ? 'Switch to Light Mode' : 'Εναλλαγή σε Φωτεινό') : (isEn ? 'Switch to Dark Mode' : 'Εναλλαγή σε Σκοτεινό')}
        >
          {mode === 'dark' ? (
            <Sun size={14} className="text-amber-400" />
          ) : (
            <Moon size={14} className="text-indigo-600" />
          )}
        </button>

        <button
          onClick={() => setIsOpen(true)}
          className="p-1 rounded-lg text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-white dark:hover:bg-gray-700 transition-all ml-0.5"
          title={isEn ? 'Customize Background Theme' : 'Επιλογή Χρώματος Φόντου'}
        >
          <Palette size={13} />
        </button>
      </div>

      {/* Theme Customizer Modal */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4"
          onClick={() => setIsOpen(false)}
        >
          <div
            className="bg-white dark:bg-slate-900 rounded-3xl max-w-sm w-full p-6 space-y-5 shadow-2xl animate-in zoom-in-95 duration-150 border border-gray-200 dark:border-gray-800 relative"
            onClick={e => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-5 right-5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <X size={18} />
            </button>

            {/* Header */}
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-black text-lg border border-indigo-200 dark:border-indigo-800">
                <Palette size={20} />
              </div>
              <div>
                <h3 className="font-extrabold text-gray-900 dark:text-white text-base">
                  {isEn ? 'Theme & Background' : 'Εμφάνιση & Χρώμα Φόντου'}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {isEn ? 'Customize your visual workspace' : 'Προσαρμόστε την εμπειρία προβολής'}
                </p>
              </div>
            </div>

            {/* Mode Selector (Light vs Dark) */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
                {isEn ? 'Display Mode' : 'Λειτουργία Προβολής'}
              </label>
              <div className="grid grid-cols-2 gap-2 bg-gray-100 dark:bg-gray-800 p-1 rounded-2xl border border-gray-200 dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => setMode('light')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                    mode === 'light'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
                  }`}
                >
                  <Sun size={14} className="text-amber-500" />
                  <span>{isEn ? 'Light Mode' : 'Φωτεινό'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setMode('dark')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                    mode === 'dark'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
                  }`}
                >
                  <Moon size={14} className="text-indigo-200" />
                  <span>{isEn ? 'Dark Mode' : 'Σκοτεινό'}</span>
                </button>
              </div>
            </div>

            {/* Dark Background Color Palette (Shown if dark mode active) */}
            {mode === 'dark' && (
              <div className="space-y-2.5 pt-1 animate-in fade-in duration-200">
                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
                  {isEn ? 'Dark Theme Shade' : 'Απόχρωση Σκοτεινού Φόντου'}
                </label>
                <div className="space-y-2">
                  {themeOptions.map(t => {
                    const isSelected = bgTheme === t.id
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setBgTheme(t.id)}
                        className={`w-full text-left p-3 rounded-2xl border transition-all flex items-center justify-between ${
                          isSelected
                            ? 'border-indigo-500 bg-indigo-50/10 ring-2 ring-indigo-500/20'
                            : 'border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 bg-gray-50 dark:bg-gray-800/40'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-xl border ${t.preview} shadow-sm shrink-0 flex items-center justify-center`}>
                            {isSelected && <Check size={14} className="text-indigo-400" />}
                          </div>
                          <div>
                            <div className="font-bold text-xs text-gray-900 dark:text-white">
                              {isEn ? t.nameEn : t.name}
                            </div>
                            <div className="text-[10px] text-gray-500 dark:text-gray-400">
                              {isEn ? t.descEn : t.desc}
                            </div>
                          </div>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Action button */}
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="w-full bg-gray-900 hover:bg-black dark:bg-indigo-600 dark:hover:bg-indigo-700 text-white font-bold py-2.5 rounded-2xl text-xs transition-colors"
            >
              {isEn ? 'Done' : 'Έτοιμο'}
            </button>
          </div>
        </div>
      )}
    </>
  )
}
