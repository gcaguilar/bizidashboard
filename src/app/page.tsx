import Link from 'next/link'
import { CITIES, CITY_CONFIGS } from '@/lib/constants'

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8 bg-gradient-to-br from-[var(--surface)] to-[var(--surface-soft)]">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-black text-[var(--foreground)] mb-2">
          BiziDashboard
        </h1>
        <p className="text-[var(--muted)]">
          Selecciona una ciudad
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl">
        {CITIES.map((city) => (
          <Link
            key={city}
            href={`/${city}/dashboard`}
            className="group flex flex-col items-center p-8 rounded-2xl border-2 border-[var(--border)] bg-[var(--surface)] hover:border-[var(--accent)] hover:-translate-y-1 transition-all duration-200"
          >
            <div className="w-16 h-16 mb-4 rounded-full bg-[var(--accent)]/10 flex items-center justify-center">
              <svg
                className="w-8 h-8 text-[var(--accent)]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-[var(--foreground)] group-hover:text-[var(--accent)] transition-colors">
              {CITY_CONFIGS[city].name}
            </h2>
            <p className="text-sm text-[var(--muted)] mt-1">
              Bicicleta pública
            </p>
          </Link>
        ))}
      </div>
    </main>
  )
}
