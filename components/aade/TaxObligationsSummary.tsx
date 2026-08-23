'use client'

import { FileCheck, Coins, Building, ShieldAlert, CheckCircle, Clock, ExternalLink } from 'lucide-react'

export default function TaxObligationsSummary() {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <FileCheck className="text-blue-600" size={22} />
          Πλήρης Οδηγός Φορολογικών Υποχρεώσεων: Τι Δηλώνω & Τι Πληρώνω
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Αναλυτικός πίνακας όλων των χρεώσεων και δηλώσεων προς την ΑΑΔΕ για ιδιοκτήτες βραχυχρόνιας μίσθωσης.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Κολόνα 1: ΤΙ ΔΗΛΩΝΩ */}
        <div className="border border-blue-100 bg-blue-50/30 rounded-2xl p-5 space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-blue-100">
            <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-sm">
              1
            </div>
            <div>
              <h3 className="font-bold text-blue-950 text-base">ΤΙ ΠΡΕΠΕΙ ΝΑ ΔΗΛΩΣΕΤΕ</h3>
              <p className="text-xs text-blue-700">Ηλεκτρονικές δηλώσεις στο Taxisnet & myAADE</p>
            </div>
          </div>

          {/* Υποχρέωση 1 */}
          <div className="bg-white rounded-xl p-4 border border-blue-100 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <span className="font-semibold text-sm text-gray-900">
                1. Δήλωση Βραχυχρόνιας Διαμονής
              </span>
              <span className="text-xs bg-red-100 text-red-700 font-bold px-2 py-0.5 rounded-full shrink-0">
                Μηνιαία
              </span>
            </div>
            <p className="text-xs text-gray-600">
              Καταχώρηση κάθε κράτησης με τον ΑΜΑ του ακινήτου, ημερομηνίες check-in/out και συνολικό ποσό.
            </p>
            <div className="text-xs text-gray-500 pt-1 flex flex-col gap-0.5">
              <span>⏰ <strong>Προθεσμία:</strong> Έως την 20ή ημέρα του επόμενου μήνα από την αναχώρηση.</span>
              <span>🔗 <strong>Πλατφόρμα:</strong> <em>gsis.gr/taxisnet/short_term_letting</em></span>
            </div>
          </div>

          {/* Υποχρέωση 2 */}
          <div className="bg-white rounded-xl p-4 border border-blue-100 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <span className="font-semibold text-sm text-gray-900">
                2. Δήλωση Τέλους Ανθεκτικότητας (Κλιματικής Κρίσης)
              </span>
              <span className="text-xs bg-orange-100 text-orange-700 font-bold px-2 py-0.5 rounded-full shrink-0">
                Μηνιαία
              </span>
            </div>
            <p className="text-xs text-gray-600">
              Υποβολή του ειδικού στοιχείου είσπραξης τέλους ανά διανυκτέρευση που εισπράχθηκε από τους επισκέπτες.
            </p>
            <div className="text-xs text-gray-500 pt-1 flex flex-col gap-0.5">
              <span>⏰ <strong>Προθεσμία:</strong> Έως το τέλος του επόμενου μήνα από την είσπραξη.</span>
              <span>🔗 <strong>Πλατφόρμα:</strong> <em>myAADE (Εφαρμογή Τέλους Ανθεκτικότητας)</em></span>
            </div>
          </div>

          {/* Υποχρέωση 3 */}
          <div className="bg-white rounded-xl p-4 border border-blue-100 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <span className="font-semibold text-sm text-gray-900">
                3. Ετήσια Δήλωση Εισοδήματος (Ε1 & Ε2)
              </span>
              <span className="text-xs bg-purple-100 text-purple-700 font-bold px-2 py-0.5 rounded-full shrink-0">
                Ετήσια
              </span>
            </div>
            <p className="text-xs text-gray-600">
              Οριστικοποίηση του Μητρώου Ακινήτων (έως 28 Φεβρουαρίου) και αυτόματη ή χειροκίνητη μεταφορά των καθαρών εσόδων στα έντυπα Ε2 και Ε1.
            </p>
            <div className="text-xs text-gray-500 pt-1">
              <span>⏰ <strong>Προθεσμία:</strong> Κατά την περίοδο των φορολογικών δηλώσεων (Ιούνιος - Ιούλιος).</span>
            </div>
          </div>
        </div>

        {/* Κολόνα 2: ΤΙ ΠΛΗΡΩΝΩ */}
        <div className="border border-emerald-100 bg-emerald-50/30 rounded-2xl p-5 space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-emerald-100">
            <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-sm">
              2
            </div>
            <div>
              <h3 className="font-bold text-emerald-950 text-base">ΤΙ & ΠΟΣΟ ΠΛΗΡΩΝΕΤΕ</h3>
              <p className="text-xs text-emerald-700">Φόροι, Τέλη και Κλίμακες Χρέωσης</p>
            </div>
          </div>

          {/* Χρέωση 1: Φόρος Εισοδήματος */}
          <div className="bg-white rounded-xl p-4 border border-emerald-100 space-y-2">
            <span className="font-semibold text-sm text-gray-900 block">
              1. Φόρος Εισοδήματος (Αυτοτελής Κλίμακα Ενοικίων 2026)
            </span>
            <div className="bg-gray-50 rounded-lg p-2.5 text-xs text-gray-700 space-y-1">
              <div className="flex justify-between">
                <span>• Έως 12.000 €:</span>
                <strong className="text-gray-900">15%</strong>
              </div>
              <div className="flex justify-between">
                <span>• 12.001 € έως 24.000 €:</span>
                <strong className="text-emerald-700">25% (Νέο ελαφρυντικό κλιμάκιο)</strong>
              </div>
              <div className="flex justify-between">
                <span>• 24.001 € έως 36.000 €:</span>
                <strong className="text-gray-900">35%</strong>
              </div>
              <div className="flex justify-between">
                <span>• Άνω των 36.000 €:</span>
                <strong className="text-gray-900">45%</strong>
              </div>
            </div>
            <p className="text-xs text-gray-500">
              * Πληρώνεται με το εκκαθαριστικό της ετήσιας φορολογικής δήλωσης σε δόσεις.
            </p>
          </div>

          {/* Χρέωση 2: Τέλος Ανθεκτικότητας */}
          <div className="bg-white rounded-xl p-4 border border-emerald-100 space-y-2">
            <span className="font-semibold text-sm text-gray-900 block">
              2. Τέλος Ανθεκτικότητας στην Κλιματική Κρίση
            </span>
            <div className="bg-gray-50 rounded-lg p-2.5 text-xs text-gray-700 space-y-1">
              <div className="flex justify-between">
                <span>• Υψηλή Περίοδος (Απρίλιος – Οκτώβριος):</span>
                <strong className="text-emerald-700">8,00 € / νύχτα</strong>
              </div>
              <div className="flex justify-between">
                <span>• Χαμηλή Περίοδος (Νοέμβριος – Μάρτιος):</span>
                <strong className="text-emerald-700">2,00 € / νύχτα</strong>
              </div>
              <div className="flex justify-between text-gray-500 pt-1 border-t border-gray-200">
                <span>• Μονοκατοικίες &gt;80τ.μ. / Βίλες:</span>
                <span>4,00 € (χειμώνας) / 15,00 € (καλοκαίρι)</span>
              </div>
            </div>
            <p className="text-xs text-gray-500">
              * <em>Σημείωση:</em> Το τέλος το πληρώνει ο επισκέπτης και εσείς απλώς το αποδίδετε στην ΑΑΔΕ.
            </p>
          </div>

          {/* Χρέωση 3: Κανόνας 3+ Ακινήτων (ΦΠΑ, Τέλος Παρεπιδημούντων) */}
          <div className="bg-white rounded-xl p-4 border border-emerald-100 space-y-2">
            <div className="flex items-center gap-1.5 text-amber-800">
              <ShieldAlert size={15} />
              <span className="font-semibold text-sm">3. Επιπλέον Χρεώσεις για 3+ Ακίνητα</span>
            </div>
            <p className="text-xs text-gray-600">
              Αν έχετε 3 ή παραπάνω ακίνητα σε βραχυχρόνια μίσθωση, υποχρεούστε σε:
            </p>
            <div className="text-xs text-gray-700 space-y-0.5 pl-1">
              <div>• <strong>ΦΠΑ 13%:</strong> Επιβάλλεται στο μίσθωμα.</div>
              <div>• <strong>Τέλος Παρεπιδημούντων 0,5%:</strong> Υπέρ του οικείου Δήμου.</div>
              <div>• <strong>ΕΦΚΑ:</strong> Μηνιαίες ασφαλιστικές εισφορές μη μισθωτού.</div>
            </div>
          </div>
        </div>
      </div>

      {/* Useful Quick Links */}
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3 text-xs">
        <span className="font-semibold text-gray-700">Επίσημες Πύλες ΑΑΔΕ:</span>
        <div className="flex flex-wrap gap-4">
          <a
            href="https://www1.gsis.gr/taxisnet/short_term_letting"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline flex items-center gap-1 font-medium"
          >
            Μητρώο Βραχυχρόνιας Διαμονής <ExternalLink size={12} />
          </a>
          <a
            href="https://myaade.gov.gr"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline flex items-center gap-1 font-medium"
          >
            myAADE (Απόδοση Τέλους & Φορολογική Δήλωση) <ExternalLink size={12} />
          </a>
        </div>
      </div>
    </div>
  )
}
