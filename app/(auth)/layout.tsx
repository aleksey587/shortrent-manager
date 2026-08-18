export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="w-full max-w-md px-4">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl mb-4 shadow-lg">
            <span className="text-3xl">🏠</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">GreekHost</h1>
          <p className="text-gray-500 text-sm mt-1">Διαχείριση Βραχυχρόνιων Μισθώσεων & ΑΑΔΕ</p>
        </div>
        {children}
      </div>
    </div>
  )
}
