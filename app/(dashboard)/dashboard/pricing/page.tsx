'use client'

import { useState, useEffect } from 'react'
import {
  Check, Sparkles, Shield, Building2, HelpCircle, ArrowRight, Zap, Award,
  ExternalLink, Crown, Star
} from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { isSuperAdmin, isProUser, getUserSubscription, getUserTier } from '@/lib/permissions'
import { useLanguage } from '@/lib/languageContext'

export default function PricingPage() {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('yearly')
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const supabase = createClient()
  const { language } = useLanguage()

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user?.email) {
        setUserEmail(user.email)
      } else if (typeof document !== 'undefined') {
        const match = document.cookie.match(/greekhost_magic_user=([^;]+)/)
        if (match) setUserEmail(decodeURIComponent(match[1]))
      }
    })
  }, [])

  const isSuper = isSuperAdmin(userEmail)
  const isPro = isProUser(userEmail)
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
      price: '0',
      period: isEn ? 'forever' : 'για πάντα',
      billedText: isEn ? 'No credit card required' : 'Χωρίς πιστωτική κάρτα',
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
      badge: isEn ? '⭐ Most Popular' : '⭐ Δημοφιλέστερη Επιλογή',
      description: isEn
        ? 'For owners with up to 3 properties who want automated cleaning, messaging & 1-click accountant dispatch.'
        : 'Για ιδιοκτήτες με έως 3 ακίνητα που θέλουν καθαρισμούς, μηνύματα επισκεπτών & 1-click αποστολή στον λογιστή.',
      price: billingCycle === 'monthly' ? '7,99' : '6,65',
      billedText: billingCycle === 'yearly'
        ? (isEn ? 'Billed €79.90 / year (2 Months Free)' : 'Χρέωση 79,90 € / έτος (2 μήνες δώρο στην ετήσια συνδρομή)')
        : (isEn ? 'Billed €7.99 per month' : 'Μηνιαία χρέωση 7,99 € χωρίς δέσμευση'),
      period: isEn ? '/ month' : '/ μήνα',
      popular: true,
      buttonText: isPro && !isSuper
        ? (isEn ? '✅ Current Active Plan' : '✅ Τρέχον Ενεργό Πλάνο')
        : billingCycle === 'yearly'
          ? (isEn ? 'Get Annual Pro (€79.90 / yr)' : 'Απόκτηση Ετήσιου Pro (79,90 € / έτος)')
          : (isEn ? 'Get Monthly Pro (€7.99 / mo)' : 'Απόκτηση Μηνιαίου Pro (7,99 € / μήνα)'),
      buttonVariant: 'primary',
      isActive: userTier === 'pro',
      stripeLink: (isPro || isSuper) ? null : (billingCycle === 'yearly'
        ? 'https://buy.stripe.com/3cI28kfYi64c2j54l2eIw01'
        : 'https://buy.stripe.com/7sY5kw9zU78gg9VbNueIw00'),
      features: isEn ? [
        'Up to 3 Properties',
        'All Starter features included',
        '🌐 Direct Booking Mini-Site (0% Commissions)',
        '⚡ 2-Way Channel Manager: Direct Rate Sync to Airbnb & Booking',
        '💬 Unified Guest Inbox & Automated Rules',
        'Cleaning Hub: Monthly WhatsApp Dispatch & Turnaround Alerts',
        'Guest Messages: Unlimited Custom Templates Builder',
        'Digital Guest Guidebook Mobile App & QR Card',
        'Multi-Property Timeline Calendar',
        '1-Click Accountant Dispatch (WhatsApp, Email, Viber)',
      ] : [
        'Έως 3 Ακίνητα',
        'Όλα τα χαρακτηριστικά του Starter',
        '🌐 Direct Booking Mini-Site Ακινήτου (0% Προμήθειες)',
        '⚡ 2-Way Channel Manager: Άμεση Αλλαγή Τιμών σε Airbnb & Booking.com',
        '💬 Ενιαίο Inbox & Αυτόματοι Κανόνες Μηνυμάτων',
        'Καθαρισμοί: Μηνιαίο WhatsApp Dispatch & Turnaround Alerts',
        'Μηνύματα Επισκεπτών: Δημιουργία Απεριόριστων Custom Προτύπων',
        'Digital Guest Guidebook & Εκτύπωση Κάρτας QR Wi-Fi',
        'Multi-Property Timeline Ημερολόγιο',
        '1-Click Αποστολή στον Λογιστή (WhatsApp, Email, Viber)',
      ],
    },
    {
      id: 'business',
      name: isEn ? 'Super Host (Business)' : 'Super Host (Business)',
      badge: isEn ? '🏢 Property Managers' : '🏢 Επαγγελματίες & Εταιρείες',
      description: isEn
        ? 'For property managers with 4+ listings subject to commercial VAT/EFKA rules.'
        : 'Για διαχειριστές με 4+ ακίνητα που υπάγονται στον κανόνα επιχειρηματικότητας (ΦΠΑ/ΕΦΚΑ).',
      price: billingCycle === 'monthly' ? '14,99' : '12,49',
      billedText: billingCycle === 'yearly'
        ? (isEn ? 'Billed €149.90 / year (2 Months Free)' : 'Χρέωση 149,90 € / έτος (2 μήνες δώρο στην ετήσια συνδρομή)')
        : (isEn ? 'Billed €14.99 per month' : 'Μηνιαία χρέωση 14,99 € χωρίς δέσμευση'),
      period: isEn ? '/ month' : '/ μήνα',
      popular: false,
      buttonText: isSuper
        ? '✅ Super Admin Access'
        : billingCycle === 'yearly'
          ? (isEn ? 'Get Annual Business (€149.90 / yr)' : 'Απόκτηση Ετήσιου Business (149,90 € / έτος)')
          : (isEn ? 'Get Monthly Business (€14.99 / mo)' : 'Απόκτηση Μηνιαίου Business (14,99 € / μήνα)'),
      buttonVariant: 'primary',
      isActive: isSuper,
      stripeLink: isSuper ? null : (billingCycle === 'yearly'
        ? 'https://buy.stripe.com/fZu00cbI2bowaPBcRyeIw03'
        : 'https://buy.stripe.com/7sY14gh2meAI9Lx18QeIw02'),
      features: isEn ? [
        'Unlimited Properties (4+)',
        'All Pro features included',
        '⚡ High-Frequency Realtime 2-Way Sync Engine',
        '3+ Property Commercial Rules Tracking (VAT 13%, EFKA)',
        'Bulk Export for Accounting Firms',
        'Direct Booking Mini-Sites for All Properties (0% Commissions)',
        '24/7 Priority Support',
      ] : [
        'Απεριόριστα Ακίνητα (4+)',
        'Όλα τα χαρακτηριστικά του Pro',
        '⚡ High-Frequency Realtime 2-Way Sync Engine',
        'Παρακολούθηση Κανόνα 3+ Ακινήτων (ΦΠΑ 13%, Τέλος Παρεπιδημούντων, ΕΦΚΑ)',
        'Ομαδική Εξαγωγή Αναφορών για Λογιστικά Γραφεία',
        'Direct Booking Mini-Sites για Όλα τα Ακίνητα (0% Προμήθειες)',
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
      q: 'What is the difference between Monthly and Annual billing?',
      a: 'With annual billing you get 2 months completely free (€79.90/yr for Pro instead of €95.88, and €149.90/yr for Business instead of €179.88).',
    },
    {
      q: 'Can I cancel anytime?',
      a: 'Yes, no commitments or lock-ins. You can cancel your subscription with 1 click anytime.',
    },
    {
      q: 'How does the Direct Booking Mini-Site work?',
      a: 'Every property gets its own public booking webpage (/stay/[id]) where guests can check live calendar availability and request a direct booking with 0% commission.',
    },
  ] : [
    {
      q: 'Μπορώ να χρησιμοποιήσω την εφαρμογή εντελώς δωρεάν;',
      a: 'Ναι! Το Starter πλάνο είναι 100% δωρεάν για 1 ακίνητο, χωρίς κάρτα, για πάντα. Περιλαμβάνει ημερολόγιο, iCal sync και υπολογισμό φόρων.',
    },
    {
      q: 'Τι κερδίζω με την Ετήσια Συνδρομή;',
      a: 'Με την ετήσια χρέωση κερδίζετε 2 μήνες εντελώς δωρεάν (79,90€/έτος για το Pro αντί 95,88€ και 149,90€/έτος για το Business αντί 179,88€).',
    },
    {
      q: 'Μπορώ να ακυρώσω όποτε θέλω;',
      a: 'Απολύτως. Δεν υπάρχει καμία δέσμευση. Μπορείτε να ακυρώσετε τη συνδρομή σας με ένα κλικ ανά πάσα στιγμή.',
    },
    {
      q: 'Πώς λειτουργεί το Direct Booking Mini-Site;',
      a: 'Κάθε ακίνητο αποκτά τη δική του σελίδα απευθείας κρατήσεων (/stay/[id]), όπου οι επισκέπτες βλέπουν τη ζωντανή διαθεσιμότητα και κάνουν κράτηση χωρίς προμήθειες Airbnb/Booking.',
    },
  ]

  return (
    <div className="space-y-10 max-w-6xl mx-auto pb-12">
      {/* Header */}
      <div className="text-center space-y-3 pt-2">
        <div className="inline-flex items-center gap-1.5 bg-blue-50 border border-blue-200 text-blue-700 px-3.5 py-1.5 rounded-full text-xs font-bold">
          <Sparkles size={14} className="text-amber-500" />
          <span>{isEn ? 'Official Subscription Plans' : 'Επίσημα Πλάνα Συνδρομής GreekHost'}</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
          {isEn ? 'Select the Right Plan for Your Properties' : 'Επιλέξτε το Πλάνο που σας Ταιριάζει'}
        </h1>
        <p className="text-sm sm:text-base text-gray-500 max-w-2xl mx-auto leading-relaxed">
          {isEn
            ? 'Complete short-term rental management, AADE tax compliance, automated cleaning & direct booking websites.'
            : 'Ολοκληρωμένη διαχείριση βραχυχρόνιων μισθώσεων, φορολογικός έλεγχος ΑΑΔΕ, καθαρισμοί & ιστοσελίδα απευθείας κρατήσεων.'}
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
              {isEn ? 'Monthly Billing' : 'Μηνιαία Χρέωση'}
            </button>
            <button
              onClick={() => setBillingCycle('yearly')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                billingCycle === 'yearly'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              <span>{isEn ? 'Annual Billing' : 'Ετήσια Χρέωση'}</span>
              <span className="bg-amber-400 text-amber-950 text-[10px] font-black px-2 py-0.5 rounded-md">
                {isEn ? '2 Months Free' : '2 Μήνες Δώρο'}
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
              {/* Badge */}
              {plan.badge && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-[10px] font-extrabold px-3.5 py-1 rounded-full shadow-md uppercase tracking-wider whitespace-nowrap">
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

                {/* Clean Official Price Display */}
                <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4 space-y-1">
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

      {/* Powered by UpLogic Footer */}
      <div className="text-center pt-2">
        <p className="text-xs text-gray-400 font-medium">
          GreekHost SaaS Platform · Engineered & Powered by{' '}
          <a
            href="https://uplogic.gr"
            target="_blank"
            rel="noopener noreferrer"
            className="text-indigo-600 hover:underline font-extrabold"
          >
            UpLogic
          </a>
        </p>
      </div>
    </div>
  )
}
