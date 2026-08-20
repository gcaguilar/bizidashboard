import { createFileRoute } from '@tanstack/react-router';
import { McpInstallGuide } from '@/app/_components/McpInstallGuide';
import { PageShell } from '@/components/layout/page-shell';
import { buildSeoHead } from '@/lib/seo-head';
import { appRoutes } from '@/lib/routes';

export const Route = createFileRoute('/mcp')({
  head: () => buildSeoHead({
    title: 'Conecta BiziDashboard con tu asistente de IA',
    description: 'Instala el conector MCP de BiziDashboard para consultar disponibilidad, alertas, patrones, movilidad e informes de Bizi Zaragoza desde tu asistente de IA.',
    path: appRoutes.mcp(),
  }),
  component: McpPage,
});

function McpPage() {
  return (
    <PageShell>
      <header className="ui-page-hero">
        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--muted)]">BiziDashboard MCP</p>
        <h1 className="mt-2 max-w-4xl text-3xl font-black leading-tight text-[var(--foreground)] md:text-5xl">
          Conecta BiziDashboard con tu asistente de IA
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-[var(--muted)] md:text-base">
          Accede a disponibilidad, alertas, patrones, movilidad e informes de Bizi Zaragoza desde tu asistente habitual.
        </p>
        <a href="#install" className="ui-primary-button mt-2 w-full sm:w-auto">Instalar conector</a>
      </header>

      <McpInstallGuide />
    </PageShell>
  );
}
