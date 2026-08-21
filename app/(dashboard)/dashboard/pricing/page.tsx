'use client'

import { useState, useEffect } from 'react'
import { Check, Sparkles, Shield, Building2, HelpCircle, ArrowRight, Zap, Award, ExternalLink, Crown, Star } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { isSuperAdmin, isProUser, getUserSubscription, getUserTier } from '@/lib/permissions'

export default function PricingPage() {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly')
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user?.email) setUserEmail(user.email)
    })
  }, [])

  const isSuper = isSuperAdmin(userEmail)
  const isPro = isProUser(userEmail)
  const subInfo = getUserSubscription(userEmail)
  const userTier = getUserTier(userEmail)

  const plans = [
    {
      id: 'free',
      name: 'Starter (Δωρεάν)',
      description: 'Ιδανικό για ιδιοκτήτες με 1 ακίνητο που θέλουν πλήρη φορολογικό έλεγχο.',
      price: '0',
      period: 'για πάντα',
      popular: false,
      buttonText: userTier === 'free' ? 'Τρέχον Πλάνο' : 'Βασικό Πλάνο',
      buttonVariant: 'secondary',
      stripeLink: null,
      isActive: userTier === 'free',
      features: [
        '1 Ακίνητο',
        'Ημερολόγιο & iCal Sync (Airbnb, Booking, VRBO)',
        'Υπολογισμός Φόρου & Τέλους Ανθεκτικότητας',
        'Μηνιαία Deadlines ΑΑΔΕ (20ή του μήνα)',
        'Λήψη Φορολογικής Έκθεσης σε PDF',
        'Βήμα-Βήμα Οδηγός Taxisnet',
      ],
    },
    {
      id: 'pro',
      name: 'Active Host (Pro)',
      description: 'Για ιδιοκτήτες με 2-3 ακίνητα που θέλουν άμεση αποστολή στον λογιστή.',
      price: billingCycle === 'monthly' ? '4,99' : '4,08',
      billedText: billingCycle === 'yearly' ? 'Χρέωση 49 € / έτος (2 μήνες δώρο!)' : 'Χρέωση 4,99 € ανά μήνα',
      period: '/ μήνα',
      popular: true,
      buttonText: isPro && !isSuper
        ? '✅ Τρέχον Ενεργό Πλάνο'
        : billingCycle === 'yearly' ? 'Ετήσιο Pro (49 €)' : 'Μηνιαίο Pro (4,99 €)',
      buttonVariant: 'primary',
      isActive: userTier === 'pro',
      stripeLink: (isPro || isSuper) ? null : (billingCycle === 'yearly'
        ? 'https://buy.stripe.com/3cI28kfYi64c2j54l2eIw01'
        : 'https://buy.stripe.com/7sY5kw9zU78gg9VbNueIw00'),
      features: [
        'Έως 3 Ακίνητα',
        'Όλα τα χαρακτηριστικά του Starter',
        '1-Click Αποστολή στον Λογιστή (Email, Viber, WhatsApp)',
        'Αυτόματες Ειδοποιήσεις & Reminders πριν τις 20 του μήνα',
        'Απεριόριστες Κρατήσεις & Ιστορικό',
        'Έγκαιρες ενημερώσεις για αλλαγές νόμων ΑΑΔΕ',
      ],
    },
    {
      id: 'business',
      name: 'Super Host (Business)',
      description: 'Για διαχειριστές με 4+ ακίνητα που υπάγονται στον κανόνα επιχειρηματικότητας.',
      price: billingCycle === 'monthly' ? '9,99' : '8,25',
      billedText: billingCycle === 'yearly' ? 'Χρέωση 99 € / έτος (2 μήνες δώρο!)' : 'Χρέωση 9,99 € ανά μήνα',
      period: '/ μήνα',
      popular: false,
      buttonText: isSuper
        ? '✅ Super Admin Access'
        : billingCycle === 'yearly' ? 'Ετήσιο Business (99 €)' : 'Μηνιαίο Business (9,99 €)',
      buttonVariant: 'primary',
      isActive: isSuper,
      stripeLink: isSuper ? null : (billingCycle === 'yearly'
        ? 'https://buy.stripe.com/fZu00cbI2bowaPBcRyeIw03'
        : 'https://buy.stripe.com/7sY14gh2meAI9Lx18QeIw02'),
      features: [
        'Απεριόριστα Ακίνητα (5+)',
        'Όλα τα χαρακτηριστικά του Pro',
        'Παρακολούθηση Κανόνα 3+ Ακινήτων (ΦΠΑ 13%, Τέλος Παρεπιδημούντων, ΕΦΚΑ)',
        'Ομαδική Εξαγωγή Αναφορών για Λογιστικά Γραφεία',
        'Πρόγραμμα Καθαρισμού & Check-in / Out',
        'Προτεραιότητα στην τεχνική υποστήριξη 24/7',
      ],
    },
  ]

  const faqs = [
    {
      q: 'Μπορώ να χρησιμοποιήσω την εφαρμογή εντελώς δωρεάν;',
      a: 'Ναι! Αν διαχειρίζεστε 1 ακίνητο, το Starter πλάνο είναι 100% δωρεάν για πάντα χωρίς καμία κρυφή χρέωση.',
    },
    {
      q: 'Πώς γίνεται η πληρωμή;',
      a: 'Όλες οι πληρωμές γίνονται μέσω της ασφαλούς πύλης της Stripe με κάρτα (Visa, Mastercard), Apple Pay ή Google Pay.',
    },
    {
      q: 'Πώς λειτουργεί η ετήσια συνδρομή;',
      a: 'Με την ετήσια συνδρομή πληρώνετε εφάπαξ για όλο το έτος και κερδίζετε 2 μήνες εντελώς δωρεάν (π.χ. 49€ αντί για 60€).',
    },
    {
      q: 'Μπορώ να ακυρώσω τη συνδρομή μου ανά πάσα στιγμή;',
      a: 'Φυσικά. Δεν υπάρχει καμία δέσμευση συμβολαίου. Μπορείτε να διακόψετε τη συνδρομή σας όποτε επιθυμείτε με 1 κλικ.',
    },
  ]

  return (
    <div className="space-y-10 max-w-6xl mx-auto py-2">
      {/* Super Admin VIP Card */}
      {isSuper && (
        <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-white rounded-3xl p-6 shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4 animate-in fade-in duration-300">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur text-2xl flex items-center justify-center shadow-inner">
              👑
            </div>
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-amber-100">
                Super Admin Account Active
              </div>
              <h2 className="text-xl font-black">Όλες οι λειτουργίες είναι ΞΕΚΛΕΙΔΩΤΕΣ (Super Host VIP)</h2>
              <p className="text-xs text-amber-100 mt-0.5">
                Συνδεδεμένος ως <strong className="underline">{userEmail}</strong> — Απεριόριστα ακίνητα, WhatsApp/Viber, AADE Export & iCal.
              </p>
            </div>
          </div>
          <span className="bg-white text-amber-900 font-extrabold text-xs px-4 py-2 rounded-xl shadow-xs shrink-0">
            LIFETIME BUSINESS
          </span>
        </div>
      )}

      {/* Pro Subscriber Active Card */}
      {!isSuper && isPro && (
        <div className="bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 text-white rounded-3xl p-6 shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4 animate-in fade-in duration-300">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur text-2xl flex items-center justify-center shadow-inner">
              ⭐
            </div>
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-purple-200">
                Ενεργή Συνδρομή PRO
              </div>
              <h2 className="text-xl font-black">Το πακέτο Active Host (Pro) είναι Ενεργό!</h2>
              <p className="text-xs text-purple-100 mt-0.5">
                Συνδεδεμένος ως <strong className="underline">{userEmail}</strong> · {subInfo?.label || '3 Έτη Προπληρωμένο'}
              </p>
            </div>
          </div>
          <span className="bg-white text-purple-900 font-extrabold text-xs px-4 py-2 rounded-xl shadow-xs shrink-0">
            PRO ACTIVE ✓
          </span>
        </div>
      )}

      {/* Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-1.5 bg-blue-50 border border-blue-200 text-blue-700 px-3.5 py-1 rounded-full text-xs font-semibold">
          <Sparkles size={14} />
          <span>Απλά, Διαφανή Πλάνα Χωρίς Προμήθειες</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
          Επιλέξτε το ιδανικό πλάνο για εσάς
        </h1>
        <p className="text-gray-500 text-sm sm:text-base max-w-2xl mx-auto">
          Ξεκινήστε δωρεάν για 1 ακίνητο και αναβαθμίστε μόνο όταν μεγαλώσει το portfolio σας.
        </p>

        {/* Billing Switcher */}
        <div className="flex items-center justify-center gap-3 pt-3">
          <button
            onClick={() => setBillingCycle('monthly')}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              billingCycle === 'monthly'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            Μηνιαία Χρέωση
          </button>
          <button
            onClick={() => setBillingCycle('yearly')}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-1.5 ${
              billingCycle === 'yearly'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            <span>Ετήσια Χρέωση</span>
            <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
              2 Μήνες ΔΩΡΟ
            </span>
          </button>
        </div>
      </div>

      {/* Pricing Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map(plan => (
          <div
            key={plan.id}
            className={`relative bg-white rounded-3xl p-7 border transition-all flex flex-col justify-between ${
              plan.isActive
                ? 'border-emerald-500 shadow-xl ring-2 ring-emerald-500/20'
                : plan.popular
                ? 'border-blue-600 shadow-xl ring-2 ring-blue-600/20 md:-translate-y-2'
                : 'border-gray-200 shadow-sm hover:shadow-md'
            }`}
          >
            {plan.isActive ? (
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-emerald-600 text-white text-xs font-bold px-3.5 py-1 rounded-full uppercase tracking-wider shadow-sm flex items-center gap-1">
                <Check size={13} />
                <span>Το Πλάνο Σας</span>
              </div>
            ) : plan.popular && (
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-sm flex items-center gap-1">
                <Award size={13} />
                <span>Δημοφιλέστερο</span>
              </div>
            )}

            <div>
              <div className="mb-4">
                <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
                <p className="text-xs text-gray-500 mt-1 min-h-[32px]">{plan.description}</p>
              </div>

              <div className="flex items-baseline gap-1 my-6 pb-6 border-b border-gray-100">
                <span className="text-4xl font-extrabold text-gray-950">€{plan.price}</span>
                <span className="text-sm text-gray-500 font-medium">{plan.period}</span>
              </div>

              {plan.billedText && (
                <p className="text-xs font-medium text-blue-600 -mt-4 mb-4">
                  {plan.billedText}
                </p>
              )}

              <ul className="space-y-3 text-xs text-gray-600 mb-8">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <div className="w-4 h-4 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 mt-0.5">
                      <Check size={11} className="stroke-[3]" />
                    </div>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            {plan.stripeLink ? (
              <a
                href={plan.stripeLink}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3 rounded-2xl text-sm font-semibold transition-all shadow-sm bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center gap-2"
              >
                <span>{plan.buttonText}</span>
                <ExternalLink size={14} />
              </a>
            ) : (
              <button
                disabled
                className={`w-full py-3 rounded-2xl text-sm font-semibold transition-all flex items-center justify-center gap-1.5 ${
                  plan.isActive
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-300 font-bold cursor-default'
                    : 'bg-gray-100 text-gray-500 cursor-default'
                }`}
              >
                {plan.isActive && <Check size={14} className="stroke-[3]" />}
                <span>{plan.buttonText}</span>
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Extra Services & Monetization Partner Banners */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Insurance Partner */}
        <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-3xl p-6 flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-md">
            <Shield size={24} />
          </div>
          <div className="space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider bg-amber-200/70 text-amber-900 px-2.5 py-0.5 rounded-full inline-block">
              Υποχρεωτικό από 1/10/2025
            </span>
            <h3 className="font-bold text-gray-900 text-base">Ασφάλιση Αστικής Ευθύνης Ακινήτου</h3>
            <p className="text-xs text-gray-600 leading-relaxed">
              Εξασφαλίστε άμεσα ασφαλιστήριο συμβόλαιο με ειδικές τιμές για χρήστες του GreekHost.
            </p>
            <button
              onClick={() => alert('Σύντομα διαθέσιμο σε συνεργασία με κορυφαίες ασφαλιστικές εταιρείες!')}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-900 hover:underline pt-1"
            >
              <span>Λήψη Προσφοράς Ασφάλισης</span>
              <ArrowRight size={13} />
            </button>
          </div>
        </div>

        {/* Accounting Partner Network */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-3xl p-6 flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-md">
            <Building2 size={24} />
          </div>
          <div className="space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider bg-blue-200/70 text-blue-900 px-2.5 py-0.5 rounded-full inline-block">
              Εξειδικευμένοι Φοροτεχνικοί
            </span>
            <h3 className="font-bold text-gray-900 text-base">Δίκτυο Λογιστών Βραχυχρόνιας</h3>
            <p className="text-xs text-gray-600 leading-relaxed">
              Χρειάζεστε λογιστή εξειδικευμένο στις δηλώσεις βραχυχρόνιας μίσθωσης και ΑΑΔΕ;
            </p>
            <button
              onClick={() => alert('Σύντομα διαθέσιμη η υπηρεσία διασύνδεσης με πιστοποιημένους λογιστές!')}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-900 hover:underline pt-1"
            >
              <span>Εύρεση Λογιστή</span>
              <ArrowRight size={13} />
            </button>
          </div>
        </div>
      </div>

      {/* FAQ Accordion */}
      <div className="bg-white rounded-3xl border border-gray-200 p-8 space-y-6 shadow-sm">
        <div className="flex items-center gap-2 border-b border-gray-100 pb-4">
          <HelpCircle size={20} className="text-blue-600" />
          <h2 className="text-xl font-bold text-gray-900">Συχνές Ερωτήσεις</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {faqs.map((faq, i) => (
            <div key={i} className="space-y-1.5">
              <h4 className="font-bold text-gray-900 text-sm">{faq.q}</h4>
              <p className="text-xs text-gray-600 leading-relaxed">{faq.a}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
