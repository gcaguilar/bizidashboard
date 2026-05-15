export default function Header() {
  return (
    <header className="border-b border-[var(--border)] bg-[var(--background)]/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-6">
          <a href="/" className="text-lg font-bold text-[var(--foreground)]">
            DatosBizi
          </a>
          <nav className="hidden gap-4 text-sm md:flex">
            <a href="/dashboard" className="text-[var(--muted)] hover:text-[var(--foreground)] transition">
              Dashboard
            </a>
            <a href="/estado" className="text-[var(--muted)] hover:text-[var(--foreground)] transition">
              Estado
            </a>
            <a href="/developers" className="text-[var(--muted)] hover:text-[var(--foreground)] transition">
              Developers
            </a>
            <a href="/informes" className="text-[var(--muted)] hover:text-[var(--foreground)] transition">
              Informes
            </a>
          </nav>
        </div>
      </div>
    </header>
  )
}
