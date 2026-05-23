'use client';

import { useEffect, useState } from 'react';
import { ThemeToggleButton } from '@/app/dashboard/_components/ThemeToggleButton';

const MAIN_NAV = [
  { href: '/', label: 'Inicio' },
  { href: '/estadisticas/mapa', label: 'Mapa' },
  { href: '/estadisticas/estaciones', label: 'Estaciones' },
  { href: '/informes', label: 'Informes' },
  { href: '/dashboard', label: 'Dashboard' },
];

const MORE_NAV = [
  { href: '/estadisticas/barrios', label: 'Barrios' },
  { href: '/estadisticas/horarios', label: 'Horarios' },
  { href: '/estadisticas/viajes', label: 'Viajes' },
  { href: '/estado', label: 'Estado' },
  { href: '/developers', label: 'API' },
  { href: '/about', label: 'Sobre' },
];

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);

  useEffect(() => {
    if (!mobileMenuOpen) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setMobileMenuOpen(false);
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [mobileMenuOpen]);

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!moreOpen) return;
    function handleClick(e: MouseEvent) {
      const target = e.target as HTMLElement;
      if (!target.closest('[data-more-dropdown]')) {
        setMoreOpen(false);
      }
    }
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [moreOpen]);

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
            <nav aria-label="Navegación principal" className="hidden items-center gap-4 text-sm md:flex">
              {MAIN_NAV.map(link => (
                <a
                  key={link.href}
                  href={link.href}
                  className="text-[var(--muted)] hover:text-[var(--foreground)] transition"
                >
                  {link.label}
                </a>
              ))}

              {/* Más dropdown */}
              <div className="relative" data-more-dropdown>
                <button
                  onClick={() => setMoreOpen(v => !v)}
                  className="text-[var(--muted)] hover:text-[var(--foreground)] transition"
                >
                  Más
                </button>
                {moreOpen && (
                  <div className="absolute right-0 top-full mt-2 flex min-w-[10rem] flex-col gap-1 rounded-xl border border-[var(--border)] bg-[var(--card)] p-2 shadow-lg">
                    {MORE_NAV.map(link => (
                      <a
                        key={link.href}
                        href={link.href}
                        className="rounded-lg px-3 py-2 text-sm text-[var(--muted)] hover:bg-[var(--secondary)] hover:text-[var(--foreground)] transition"
                      >
                        {link.label}
                      </a>
                    ))}
                  </div>
                )}
              </div>
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
            {MAIN_NAV.map(link => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="text-2xl font-bold text-[var(--foreground)] hover:text-[var(--primary)] transition"
              >
                {link.label}
              </a>
            ))}
            <div className="my-2 h-px bg-[var(--border)]" />
            {MORE_NAV.map(link => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="text-lg font-semibold text-[var(--muted)] hover:text-[var(--primary)] transition"
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
