import { useEffect, useState } from 'react'
import { TrackedLink } from '@/app/_components/TrackedLink'
import { appRoutes } from '@/lib/routes'

const FOOTER_LINKS_ROW1 = [
  { href: appRoutes.dashboard(), label: 'Mapa', ctaId: 'map' },
  { href: appRoutes.statsEstaciones(), label: 'Estaciones', ctaId: 'stations' },
  { href: appRoutes.reports(), label: 'Informes', ctaId: 'reports' },
  { href: appRoutes.dashboard(), label: 'Dashboard', ctaId: 'dashboard' },
]

const FOOTER_LINKS_ROW2 = [
  { href: appRoutes.status(), label: 'Estado', ctaId: 'status' },
  { href: appRoutes.developers(), label: 'API', ctaId: 'api' },
  { href: appRoutes.methodology(), label: 'Metodología', ctaId: 'methodology' },
  { href: appRoutes.biciradar(), label: 'Bici Radar', ctaId: 'biciradar' },
]

const GITHUB_REPO = 'https://github.com/gcaguilar/bizidashboard'

type VersionInfo = {
  gitSha: string;
  version: string;
  buildDate: string;
};

export default function Footer() {
  const [lastUpdated, setLastUpdated] = useState<string | null>(null)
  const [version, setVersion] = useState<VersionInfo | null>(null)

  useEffect(() => {
    fetch('/api/status')
      .then(res => res.json())
      .then(data => {
        const ts = data?.quality?.freshness?.lastUpdated
        if (ts) {
          setLastUpdated(new Date(ts).toLocaleString('es-ES', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          }))
        }
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    fetch('/api/version')
      .then(res => res.json())
      .then(data => {
        if (data?.gitSha) setVersion(data)
      })
      .catch(() => {})
  }, [])

  return (
    <footer className="border-t border-[var(--border)] bg-[var(--background)] py-8">
      <div className="mx-auto max-w-[1280px] px-4">
        <div className="flex flex-col items-center gap-6">
          <div className="flex flex-col items-center gap-2">
            <nav className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-[var(--muted)]">
              {FOOTER_LINKS_ROW1.map(link => (
                <TrackedLink key={link.href} href={link.href} ctaEvent={{ source: 'footer', ctaId: link.ctaId, destination: link.ctaId, sourceRole: 'utility', destinationRole: 'hub', transitionKind: 'within_public' }} className="hover:text-[var(--foreground)] transition">
                  {link.label}
                </TrackedLink>
              ))}
            </nav>
            <nav className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-[var(--muted)]">
              {FOOTER_LINKS_ROW2.map(link => (
                <TrackedLink key={link.href} href={link.href} ctaEvent={{ source: 'footer', ctaId: link.ctaId, destination: link.ctaId, sourceRole: 'utility', destinationRole: 'hub', transitionKind: 'within_public' }} className="hover:text-[var(--foreground)] transition">
                  {link.label}
                </TrackedLink>
              ))}
            </nav>
          </div>

          <div className="text-xs text-[var(--muted)] text-center space-y-1">
            {lastUpdated && <p>Última actualización: {lastUpdated}</p>}
            <p>
              Datos abiertos vía{' '}
              <TrackedLink href={appRoutes.developers()} ctaEvent={{ source: 'footer', ctaId: 'api_public', destination: 'api', sourceRole: 'utility', destinationRole: 'hub', transitionKind: 'within_public' }} className="hover:text-[var(--foreground)] transition underline underline-offset-2">
                API pública
              </TrackedLink>
            </p>
            {version && (
              <p className="text-[10px] text-[var(--muted)]/60">
                Build{' '}
                <a
                  href={`${GITHUB_REPO}/commit/${version.gitSha}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono underline hover:text-[var(--foreground)]"
                >
                  {version.gitSha.substring(0, 7)}
                </a>
                {version.buildDate && <> · {new Date(version.buildDate).toLocaleDateString('es-ES')}</>}
              </p>
            )}
            <p>Hecho con ❤️ por la comunidad</p>
          </div>

          <div className="flex items-center gap-4 text-xs text-[var(--muted)]">
            <a
              href={GITHUB_REPO}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[var(--foreground)] transition"
            >
              GitHub
            </a>
            <a
              href={`${GITHUB_REPO}/issues`}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[var(--foreground)] transition"
            >
              Reportar un problema
            </a>
          </div>

          <p className="text-xs text-[var(--muted)]">
            DatosBizi - Panel de movilidad para sistemas de bicicletas públicas.
          </p>
        </div>
      </div>
    </footer>
  )
}
