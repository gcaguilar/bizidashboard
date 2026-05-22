'use client';

import { useEffect, useState } from 'react';
import { ThemeToggleButton } from '@/app/dashboard/_components/ThemeToggleButton';

const NAV_LINKS = [
  { href: '/estadisticas', label: 'Estadísticas' },
  { href: '/informes', label: 'Informes' },
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/estado', label: 'Estado' },
];

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!mobileMenuOpen) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setMobileMenuOpen(false);
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [mobileMenuOpen]);

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-[var(--border)] bg-[var(--background)]/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-[1280px] items-center justify-between px-4 py-3">
          {/* Logo */}
          <div className="flex items-center gap-6">
            <a href="/" className="text-lg font-bold text-[var(--foreground)]">
              DatosBizi
            </a>

            {/* Desktop nav */}
            <nav aria-label="Navegación principal" className="hidden gap-4 text-sm md:flex">
              {NAV_LINKS.map(link => (
                <a
                  key={link.href}
                  href={link.href}
                  className="text-[var(--muted)] hover:text-[var(--foreground)] transition"
                >
                  {link.label}
                </a>
              ))}
            </nav>
          </div>

          {/* Right side controls */}
          <div className="flex items-center gap-2">
            <ThemeToggleButton className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--secondary)] text-sm text-[var(--foreground)] transition hover:border-[var(--primary)]/40" />

            {/* Hamburger — mobile only */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Abrir menú"
              aria-expanded={mobileMenuOpen}
              className="md:hidden inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--secondary)] text-[var(--foreground)] transition hover:border-[var(--primary)]/40"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="2" y1="4" x2="14" y2="4" />
                <line x1="2" y1="8" x2="14" y2="8" />
                <line x1="2" y1="12" x2="14" y2="12" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-[200] flex flex-col bg-[var(--background)] p-6 gap-6 md:hidden">
          {/* Close button */}
          <div className="flex justify-end">
            <button
              onClick={() => setMobileMenuOpen(false)}
              aria-label="Cerrar menú"
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--secondary)] text-[var(--foreground)] transition hover:border-[var(--primary)]/40"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="2" y1="2" x2="14" y2="14" />
                <line x1="14" y1="2" x2="2" y2="14" />
              </svg>
            </button>
          </div>

          {/* Mobile nav links */}
          <nav className="flex flex-col gap-4 mt-4">
            {NAV_LINKS.map(link => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="text-2xl font-bold text-[var(--foreground)] hover:text-[var(--primary)] transition"
              >
                {link.label}
              </a>
            ))}
          </nav>
        </div>
      )}
    </>
  );
}
