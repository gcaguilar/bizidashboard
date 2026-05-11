import { Link } from '@tanstack/react-router'
import BetterAuthHeader from '../integrations/better-auth/header-user'

export default function Header() {
  return (
    <header className="border-b border-[var(--border)] bg-[var(--background)]/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-6">
          <Link to="/" className="text-lg font-bold text-[var(--foreground)]">
            DatosBizi
          </Link>
          <nav className="hidden gap-4 text-sm md:flex">
            <Link to="/dashboard" className="text-[var(--muted)] hover:text-[var(--foreground)] transition">
              Dashboard
            </Link>
            <Link to="/estado" className="text-[var(--muted)] hover:text-[var(--foreground)] transition">
              Estado
            </Link>
            <Link to="/developers" className="text-[var(--muted)] hover:text-[var(--foreground)] transition">
              Developers
            </Link>
            <Link to="/informes" className="text-[var(--muted)] hover:text-[var(--foreground)] transition">
              Informes
            </Link>
          </nav>
        </div>
        <BetterAuthHeader />
      </div>
    </header>
  )
}
