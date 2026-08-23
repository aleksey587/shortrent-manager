'use client'

import { useState, useEffect } from 'react'
import {
  Check, Sparkles, Shield, Building2, HelpCircle, ArrowRight, Zap, Award,
  ExternalLink, Crown, Star, Flame, Clock, Gift
} from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { isSuperAdmin, isProUser, getUserSubscription, getUserTier } from '@/lib/permissions'
import { useLanguage } from '@/lib/languageContext'

export default function PricingPage() {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('yearly')
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const supabase = createClient()
  const { language, t } = useLanguage()

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user?.email) setUserEmail(user.email)
    })
  }, [])

  const isSuper = isSuperAdmin(userEmail)
  const isPro = isProUser(userEmail)
  const subInfo = getUserSubscription(userEmail)
  const userTier = getUserTier(userEmail)

  const isEn = language === 'en'

  const plans = [
    {
      id: 'free',
      name: isEn ? 'Starter (Free)' : 'Starter (Δωρεάν)',
      badge: isEn ? 'Free Forever' : 'Δωρεάν για Πάντα',
      description: isEn
        ? 'Ideal for hosts with 1 property needing basic tax and calendar tracking.'
        : 'Ιδανικό για ιδιοκτήτες με 1 ακίνητο που θέλουν βασικό φορολογικό και ημερολογιακό έλεγχο.',
      regularPrice: null,
      price: '0',
      period: isEn ? 'forever' : 'για πάντα',
      popular: false,
      buttonText: userTier === 'free'
        ? (isEn ? 'Current Plan' : 'Τρέχον Πλάνο')
        : (isEn ? 'Basic Plan' : 'Βασικό Πλάνο'),
      buttonVariant: 'secondary',
      stripeLink: null,
      isActive: userTier === 'free',
      features: isEn ? [
        '1 Property',
        'Calendar & iCal Sync (Airbnb, Booking, VRBO)',
        'Tax & Climate Crisis Fee Calculator',
        'Monthly AADE Deadlines (20th of each month)',
        'Export Tax Report in PDF',
        '5 Standard Guest Message Templates',
      ] : [
        '1 Ακίνητο',
        'Ημερολόγιο & iCal Sync (Airbnb, Booking, VRBO)',
        'Υπολογισμός Φόρου & Τέλους Κλιματικής Κρίσης',
        'Μηνιαία Deadlines ΑΑΔΕ (20ή του μήνα)',
        'Λήψη Φορολογικής Έκθεσης σε PDF',
        '5 Βασικά Πρότυπα Μηνυμάτων Επισκεπτών',
      ],
    },
    {
      id: 'pro',
      name: isEn ? 'Active Host (Pro)' : 'Active Host (Pro)',
      badge: isEn ? '🔥 Launch Offer -38%' : '🔥 Προσφορά Έναρξης -38%',
      description: isEn
        ? 'For owners with up to 3 properties who want automated cleaning, messaging & 1-click accountant dispatch.'
        : 'Για ιδιοκτήτες με έως 3 ακίνητα που θέλουν καθαρισμούς, μηνύματα επισκεπτών & 1-click αποστολή στον λογιστή.',
      regularPrice: billingCycle === 'monthly' ? '7,99' : '79,90',
      price: billingCycle === 'monthly' ? '4,99' : '4,08',
      billedText: billingCycle === 'yearly'
        ? (isEn ? 'Billed €49 / year (regular €79.90 — 2 Months FREE!)' : 'Χρέωση 49 € / έτος (κανονική 79,90 € — 2 μήνες δώρο!)')
        : (isEn ? 'Billed €4.99 per month (regular €7.99)' : 'Χρέωση 4,99 € ανά μήνα (κανονική 7,99 €)'),
      period: isEn ? '/ month' : '/ μήνα',
      popular: true,
      buttonText: isPro && !isSuper
        ? (isEn ? '✅ Current Active Plan' : '✅ Τρέχον Ενεργό Πλάνο')
        : billingCycle === 'yearly'
          ? (isEn ? 'Get Annual Pro (€49 / yr)' : 'Ετήσιο Pro (49 € / έτος)')
          : (isEn ? 'Get Monthly Pro (€4.99 / mo)' : 'Μηνιαίο Pro (4,99 € / μήνα)'),
      buttonVariant: 'primary',
      isActive: userTier === 'pro',
      stripeLink: (isPro || isSuper) ? null : (billingCycle === 'yearly'
        ? 'https://buy.stripe.com/3cI28kfYi64c2j54l2eIw01'
        : 'https://buy.stripe.com/7sY5kw9zU78gg9VbNueIw00'),
      features: isEn ? [
        'Up to 3 Properties',
        'All Starter features included',
        '⚡ 2-Way Channel Manager: Direct Rate Sync to Airbnb & Booking',
        '💬 Unified Guest Inbox: Read & Reply to Airbnb/Booking chats',
        'Cleaning Hub: Monthly WhatsApp Dispatch & Turnaround Alerts',
        'Guest Messages: Unlimited Custom Templates Builder',
        'Digital Guest Guidebook Mobile App',
        'Multi-Property Timeline Calendar',
        '1-Click Accountant Dispatch (WhatsApp, Email, Viber)',
      ] : [
        'Έως 3 Ακίνητα',
        'Όλα τα χαρακτηριστικά του Starter',
        '⚡ 2-Way Channel Manager: Άμεση Αλλαγή Τιμών σε Airbnb & Booking.com',
        '💬 Ενιαίο Inbox: Ανάγνωση & Απάντηση Μηνυμάτων Επισκεπτών',
        'Καθαρισμοί: Μηνιαίο WhatsApp Dispatch & Turnaround Alerts',
        'Μηνύματα Επισκεπτών: Δημιουργία Απεριόριστων Custom Προτύπων',
        'Digital Guest Guidebook (Ψηφιακός Οδηγός Επισκέπτη)',
        'Multi-Property Timeline Ημερολόγιο',
        '1-Click Αποστολή στον Λογιστή (WhatsApp, Email, Viber)',
      ],
    },
    {
      id: 'business',
      name: isEn ? 'Super Host (Business)' : 'Super Host (Business)',
      badge: isEn ? '🔥 Launch Offer -34%' : '🔥 Προσφορά Έναρξης -34%',
      description: isEn
        ? 'For property managers with 4+ listings subject to commercial VAT/EFKA rules.'
        : 'Για διαχειριστές με 4+ ακίνητα που υπάγονται στον κανόνα επιχειρηματικότητας (ΦΠΑ/ΕΦΚΑ).',
      regularPrice: billingCycle === 'monthly' ? '14,99' : '149,90',
      price: billingCycle === 'monthly' ? '9,99' : '8,25',
      billedText: billingCycle === 'yearly'
        ? (isEn ? 'Billed €99 / year (regular €149.90 — 2 Months FREE!)' : 'Χρέωση 99 € / έτος (κανονική 149,90 € — 2 μήνες δώρο!)')
        : (isEn ? 'Billed €9.99 per month (regular €14.99)' : 'Χρέωση 9,99 € ανά μήνα (κανονική 14,99 €)'),
      period: isEn ? '/ month' : '/ μήνα',
      popular: false,
      buttonText: isSuper
        ? '✅ Super Admin Access'
        : billingCycle === 'yearly'
          ? (isEn ? 'Get Annual Business (€99 / yr)' : 'Ετήσιο Business (99 € / έτος)')
          : (isEn ? 'Get Monthly Business (€9.99 / mo)' : 'Μηνιαίο Business (9,99 € / μήνα)'),
      buttonVariant: 'primary',
      isActive: isSuper,
      stripeLink: isSuper ? null : (billingCycle === 'yearly'
        ? 'https://buy.stripe.com/fZu00cbI2bowaPBcRyeIw03'
        : 'https://buy.stripe.com/7sY14gh2meAI9Lx18QeIw02'),
      features: isEn ? [
        'Unlimited Properties (5+)',
        'All Pro features included',
        '⚡ High-Frequency Realtime 2-Way Sync Engine',
        '3+ Property Commercial Rules Tracking (VAT 13%, EFKA)',
        'Bulk Export for Accounting Firms',
        'Upcoming: Direct Booking Mini-Sites (0% Commissions)',
        '24/7 Priority Support',
      ] : [
        'Απεριόριστα Ακίνητα (5+)',
        'Όλα τα χαρακτηριστικά του Pro',
        '⚡ High-Frequency Realtime 2-Way Sync Engine',
        'Παρακολούθηση Κανόνα 3+ Ακινήτων (ΦΠΑ 13%, Τέλος Παρεπιδημούντων, ΕΦΚΑ)',
        'Ομαδική Εξαγωγή Αναφορών για Λογιστικά Γραφεία',
        'Προτεραιότητα στα Direct Booking Mini-Sites (0% Προμήθειες)',
        'Προτεραιότητα στην τεχνική υποστήριξη 24/7',
      ],
    },
  ]

  const faqs = isEn ? [
    {
      q: 'Can I use GreekHost for free?',
      a: 'Yes! The Starter plan is 100% free forever for 1 property with calendar sync and tax calculations.',
    },
    {
      q: 'Why are prices discounted right now?',
      a: 'We are running an Early Bird Launch Offer for early adopters. Pro is currently €4.99/mo (€49/yr) instead of regular €7.99/mo (€79.90/yr). Lock in your discount today!',
    },
    {
      q: 'Can I cancel anytime?',
      a: 'Yes, no commitments or lock-ins. You can cancel your subscription with 1 click anytime.',
    },
    {
      q: 'How does WhatsApp Cleaner Dispatch work?',
      a: 'GreekHost automatically creates cleaning schedules from check-outs and formats clean messages ready to send via WhatsApp to your cleaners with 1 click.',
    },
  ] : [
    {
      q: 'Μπορώ να χρησιμοποιήσω την εφαρμογή εντελώς δωρεάν;',
      a: 'Ναι! Το Starter πλάνο είναι 100% δωρεάν για 1 ακίνητο, χωρίς κάρτα, για πάντα. Περιλαμβάνει ημερολόγιο, iCal sync και υπολογισμό φόρων.',
    },
    {
      q: 'Γιατί οι τιμές είναι σε προσφορά αυτή τη στιγμή;',
      a: 'Βρισκόμαστε στην περίοδο Early-Bird Launch Offer. Το Pro είναι στα 4,99€/μήνα (49€/έτος) αντί για την κανονική τιμή 7,99€/μήνα (79,90€/έτος). Κλειδώστε την έκπτωση τώρα!',
    },
    {
      q: 'Μπορώ να ακυρώσω όποτε θέλω;',
      a: 'Απολύτως. Δεν υπάρχει καμία δέσμευση. Μπορείτε να ακυρώσετε τη συνδρομή σας με ένα κλικ ανά πάσα στιγμή.',
    },
    {
      q: 'Πώς λειτουργεί η αποστολή μηνιαίου προγράμματος στην καθαρίστρια;',
      a: 'Το GreekHost ανιχνεύει αυτόματα τα check-outs και τα same-day turnarounds και ετοιμάζει καθαρό χρονοδιάγραμμα έτοιμο για αποστολή στο WhatsApp με 1 κλικ.',
    },
  ]

  return (
    <div className="space-y-10 max-w-6xl mx-auto pb-12">
      {/* Top Early Bird Launch Announcement Banner (Modern Sapphire & Indigo Glassmorphism) */}
      <div className="relative overflow-hidden bg-gradient-to-r from-slate-950 via-indigo-950 to-slate-900 border border-indigo-500/30 text-white rounded-3xl p-5 sm:p-6 shadow-xl shadow-indigo-950/25 flex flex-col sm:flex-row items-center justify-between gap-5 animate-in fade-in duration-300 ring-1 ring-white/10">
        {/* Subtle luminous background glow */}
        <div className="absolute -top-12 -left-12 w-48 h-48 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-12 -right-12 w-48 h-48 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-center gap-4 text-center sm:text-left relative z-10">
          <div className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-amber-400 p-[1px] shadow-lg shrink-0">
            <div className="w-full h-full bg-slate-950/80 backdrop-blur-md rounded-2xl flex items-center justify-center text-2xl">
              ✨
            </div>
          </div>
          <div>
            <div className="inline-flex items-center gap-1.5 bg-gradient-to-r from-amber-400/20 to-orange-400/20 border border-amber-400/40 text-amber-300 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider mb-1">
              <Flame size={12} className="text-amber-400" />
              <span>{isEn ? 'Limited Time Launch Offer' : 'Ειδική Προσφορά Έναρξης — Early Bird'}</span>
            </div>
            <h2 className="font-extrabold text-base sm:text-lg text-white leading-tight">
              {isEn
                ? 'Save up to 40% on Pro & Business Plans Before Regular Rates Apply!'
                : 'Κλειδώστε έκπτωση έως -40% πριν την επιστροφή στις κανονικές τιμές (7,99€ & 14,99€)!'}
            </h2>
            <p className="text-xs text-indigo-200/80 mt-0.5 font-medium">
              {isEn
                ? 'All existing subscribers retain lifetime early-bird rates.'
                : 'Όλοι οι πρώτοι συνδρομητές διατηρούν μόνιμα την προνομιακή τιμή.'}
            </p>
          </div>
        </div>

        <div className="shrink-0 bg-white/5 backdrop-blur-md border border-white/15 rounded-2xl px-4 py-2.5 text-center relative z-10 shadow-inner">
          <span className="text-[11px] font-semibold block text-indigo-200">{isEn ? 'Annual Plan Bonus:' : 'Ετήσιο Πλάνο:'}</span>
          <span className="text-sm font-black text-amber-300 flex items-center justify-center gap-1.5 mt-0.5">
            <Gift size={15} className="text-amber-400" />
            <span>{isEn ? '2 Months FREE' : '2 Μήνες ΔΩΡΟ'}</span>
          </span>
        </div>
      </div>

      {/* Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-1.5 bg-blue-50 border border-blue-200 text-blue-700 px-3.5 py-1.5 rounded-full text-xs font-bold">
          <Sparkles size={14} className="text-amber-500" />
          <span>{isEn ? 'Simple & Transparent Pricing' : 'Απλή & Διαφανής Τιμολόγηση'}</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
          {isEn ? 'Select the Right Plan for Your Properties' : 'Επιλέξτε το Πλάνο που σας Ταιριάζει'}
        </h1>
        <p className="text-sm sm:text-base text-gray-500 max-w-2xl mx-auto leading-relaxed">
          {isEn
            ? 'From simple tax calculations to automated cleaner dispatch and guest messaging. No hidden fees.'
            : 'Από απλό υπολογισμό φόρων έως αυτόματους καθαρισμούς και μηνύματα επισκεπτών. Χωρίς κρυφές χρεώσεις.'}
        </p>

        {/* Billing Switcher (Monthly vs Yearly) */}
        <div className="flex items-center justify-center pt-3">
          <div className="bg-gray-100 p-1.5 rounded-2xl flex items-center border border-gray-200 shadow-inner">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                billingCycle === 'monthly'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              {isEn ? 'Monthly' : 'Μηνιαία Χρέωση'}
            </button>
            <button
              onClick={() => setBillingCycle('yearly')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                billingCycle === 'yearly'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              <span>{isEn ? 'Annual (2 Months FREE)' : 'Ετήσια (2 Μήνες ΔΩΡΟ)'}</span>
              <span className="bg-amber-400 text-amber-950 text-[10px] font-black px-1.5 py-0.5 rounded-md">
                -38%
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Pricing Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
        {plans.map((plan) => {
          return (
            <div
              key={plan.id}
              className={`relative bg-white rounded-3xl p-6 sm:p-7 border flex flex-col justify-between transition-all ${
                plan.popular
                  ? 'border-blue-500 shadow-xl shadow-blue-500/10 ring-2 ring-blue-500/20'
                  : 'border-gray-200 shadow-sm hover:border-gray-300'
              }`}
            >
              {/* Popular / Promo Badge */}
              {plan.badge && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-[10px] font-extrabold px-3 py-1 rounded-full shadow-md uppercase tracking-wider">
                  {plan.badge}
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-extrabold text-gray-900">{plan.name}</h3>
                  <p className="text-xs text-gray-500 mt-1 leading-relaxed min-h-[36px]">
                    {plan.description}
                  </p>
                </div>

                {/* Price Display with Struck-Through Regular Price */}
                <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4 space-y-1">
                  {plan.regularPrice && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400 font-semibold line-through">
                        Κανονική: {plan.regularPrice} € {plan.period}
                      </span>
                      <span className="bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-1.5 py-0.2 rounded">
                        Προσφορά
                      </span>
                    </div>
                  )}

                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl sm:text-4xl font-black text-gray-900">
                      {plan.price} €
                    </span>
                    <span className="text-xs font-bold text-gray-500">
                      {plan.period}
                    </span>
                  </div>

                  {plan.billedText && (
                    <p className="text-[11px] text-blue-700 font-semibold pt-0.5">
                      {plan.billedText}
                    </p>
                  )}
                </div>

                {/* Features list */}
                <div className="space-y-2.5 pt-2">
                  <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
                    {isEn ? 'Features included:' : 'Τι περιλαμβάνει:'}
                  </span>
                  {plan.features.map((feat, idx) => (
                    <div key={idx} className="flex items-start gap-2.5 text-xs text-gray-700">
                      <Check size={15} className="text-emerald-600 stroke-[3] shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-6">
                {plan.stripeLink ? (
                  <a
                    href={plan.stripeLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-extrabold py-3.5 px-4 rounded-2xl text-xs transition-all shadow-md shadow-blue-500/25"
                  >
                    <span>{plan.buttonText}</span>
                    <ArrowRight size={14} />
                  </a>
                ) : (
                  <button
                    disabled={plan.isActive}
                    className={`w-full py-3.5 px-4 rounded-2xl text-xs font-bold transition-all ${
                      plan.isActive
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 cursor-default'
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-800'
                    }`}
                  >
                    {plan.buttonText}
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* FAQ Section */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm space-y-6">
        <div className="flex items-center gap-2 font-extrabold text-gray-900 text-lg">
          <HelpCircle size={20} className="text-blue-600" />
          <span>{isEn ? 'Frequently Asked Questions' : 'Συχνές Ερωτήσεις'}</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {faqs.map((faq, i) => (
            <div key={i} className="bg-gray-50 border border-gray-100 rounded-2xl p-4 space-y-1.5">
              <h4 className="font-bold text-gray-900 text-xs sm:text-sm">{faq.q}</h4>
              <p className="text-xs text-gray-600 leading-relaxed">{faq.a}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
