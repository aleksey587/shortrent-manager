'use client'

import { useState } from 'react'
import { Check, Sparkles, Shield, Building2, HelpCircle, ArrowRight, Zap, Award } from 'lucide-react'
import Link from 'next/link'

export default function PricingPage() {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly')

  const plans = [
    {
      id: 'free',
      name: 'Starter (Δωρεάν)',
      description: 'Ιδανικό για ιδιοκτήτες με 1 ακίνητο που θέλουν πλήρη φορολογικό έλεγχο.',
      price: '0',
      period: 'για πάντα',
      popular: false,
      buttonText: 'Τρέχον Πλάνο',
      buttonVariant: 'secondary',
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
      billedText: billingCycle === 'yearly' ? 'Χρέωση 49 € / έτος (2 μήνες δώρο!)' : 'Χρέωση ανά μήνα',
      period: '/ μήνα',
      popular: true,
      buttonText: 'Αναβάθμιση σε Pro',
      buttonVariant: 'primary',
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
      billedText: billingCycle === 'yearly' ? 'Χρέωση 99 € / έτος (2 μήνες δώρο!)' : 'Χρέωση ανά μήνα',
      period: '/ μήνα',
      popular: false,
      buttonText: 'Επιλογή Business',
      buttonVariant: 'primary',
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
      a: 'Ναι! Αν διαχειρίζεστε 1 ακίνητο, το Starter πλάνο είναι 100% δωρεάν για πάντα χωρίς κρυφές χρεώσεις.',
    },
    {
      q: 'Πώς γίνεται η πληρωμή;',
      a: 'Δεχόμαστε όλες τις πιστωτικές/χρεωστικές κάρτες μέσω ασφαλούς περιβάλλοντος Stripe (Visa, Mastercard, Apple Pay, Google Pay).',
    },
    {
      q: 'Μπορώ να ακυρώσω τη συνδρομή μου ανά πάσα στιγμή;',
      a: 'Φυσικά. Δεν υπάρχει καμία δέσμευση συμβολαίου. Μπορείτε να ακυρώσετε όποτε θέλετε με 1 κλικ.',
    },
    {
      q: 'Τι γίνεται αν προσθέσω παραπάνω ακίνητα;',
      a: 'Αν έχετε το δωρεάν πλάνο και προσθέσετε 2ο ή 3ο ακίνητο, η εφαρμογή θα σας προτείνει αυτόματα να μεταβείτε στο Pro πλάνο.',
    },
  ]

  return (
    <div className="space-y-10 max-w-6xl mx-auto py-2">
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
              plan.popular
                ? 'border-blue-600 shadow-xl ring-2 ring-blue-600/20 md:-translate-y-2'
                : 'border-gray-200 shadow-sm hover:shadow-md'
            }`}
          >
            {plan.popular && (
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

            <button
              onClick={() => alert(`Επιλέξατε το πλάνο: ${plan.name}. Η σύνδεση με το σύστημα πληρωμών Stripe/Viva θα ενεργοποιηθεί στο live deployment!`)}
              className={`w-full py-3 rounded-2xl text-sm font-semibold transition-all shadow-sm ${
                plan.buttonVariant === 'primary'
                  ? 'bg-blue-600 hover:bg-blue-700 text-white'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-800'
              }`}
            >
              {plan.buttonText}
            </button>
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
              Εξασφαλίστε άμεσα ασφαλιστήριο συμβόλαιο με ειδικές τιμές για χρήστες του ShortRent Manager.
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

        {/* Accountant Network */}
        <div className="bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-200 rounded-3xl p-6 flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-purple-600 text-white flex items-center justify-center shrink-0 shadow-md">
            <Building2 size={24} />
          </div>
          <div className="space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider bg-purple-200/70 text-purple-900 px-2.5 py-0.5 rounded-full inline-block">
              B2B Δίκτυο
            </span>
            <h3 className="font-bold text-gray-900 text-base">Εξειδικευμένοι Φοροτεχνικοί Airbnb</h3>
            <p className="text-xs text-gray-600 leading-relaxed">
              Συνδέστε το ShortRent Manager με το λογιστικό σας γραφείο ή βρείτε πιστοποιημένο συνεργάτη.
            </p>
            <button
              onClick={() => alert('Σύντομα διαθέσιμο το δίκτυο πιστοποιημένων λογιστών βραχυχρόνιας μίσθωσης!')}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-purple-900 hover:underline pt-1"
            >
              <span>Σύνδεση με Λογιστή</span>
              <ArrowRight size={13} />
            </button>
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm space-y-6">
        <div className="text-center space-y-1">
          <h2 className="text-xl font-bold text-gray-900">Συχνές Ερωτήσεις</h2>
          <p className="text-xs text-gray-500">Όλα όσα θέλετε να γνωρίζετε για τις χρεώσεις</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          {faqs.map((faq, idx) => (
            <div key={idx} className="space-y-1.5 bg-gray-50/70 p-4 rounded-2xl border border-gray-100">
              <h4 className="font-semibold text-sm text-gray-900 flex items-center gap-1.5">
                <HelpCircle size={15} className="text-blue-600 shrink-0" />
                {faq.q}
              </h4>
              <p className="text-xs text-gray-600 leading-relaxed pl-5">
                {faq.a}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
