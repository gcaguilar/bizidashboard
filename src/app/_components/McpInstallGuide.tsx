'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { buildCtaClickEvent, trackUmamiEvent } from '@/lib/umami';

export const MCP_SERVER_URL = 'https://mcp.datosbizi.com/mcp';
export const CLAUDE_CONNECTOR_URL = `https://claude.ai/customize/connectors?connectorName=BiziDashboard&connectorUrl=${encodeURIComponent(MCP_SERVER_URL)}&modal=add-custom-connector`;

type Notice =
  | { kind: 'success'; text: string }
  | { kind: 'error'; text: string }
  | null;

function copyWithDocumentFallback(value: string): boolean {
  const textArea = document.createElement('textarea');
  textArea.value = value;
  textArea.setAttribute('readonly', '');
  textArea.style.position = 'fixed';
  textArea.style.opacity = '0';
  textArea.style.pointerEvents = 'none';
  document.body.appendChild(textArea);
  textArea.select();

  try {
    return document.execCommand('copy');
  } finally {
    textArea.remove();
  }
}

/** Copies the public endpoint, including browsers without navigator.clipboard. */
export async function copyMcpServerUrl(): Promise<boolean> {
  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(MCP_SERVER_URL);
      return true;
    } catch {
      // Some embedded clients expose Clipboard but deny its permission.
    }
  }

  return typeof document !== 'undefined' && copyWithDocumentFallback(MCP_SERVER_URL);
}

function trackInstallAction(ctaId: string, destination?: string) {
  trackUmamiEvent(
    buildCtaClickEvent({
      surface: 'public',
      routeKey: 'mcp',
      source: 'mcp_install',
      ctaId,
      destination,
      isExternal: Boolean(destination),
      sourceRole: 'utility',
      destinationRole: 'utility',
      transitionKind: destination ? 'external' : 'within_public',
    })
  );
}

const INSTALL_STEPS = {
  claude: [
    'Pulsa el botón: la URL se copia y Claude se abre en otra pestaña.',
    'En Claude ve a Personalizar → Conectores → Añadir conector personalizado.',
    'Pega la URL e inicia sesión con DatosBizi cuando Claude lo solicite.',
  ],
  chatgpt: [
    'Pulsa el botón: la URL se copia y ChatGPT se abre en otra pestaña.',
    'Añade un conector MCP personalizado desde la configuración disponible en tu cuenta.',
    'Pega la URL e inicia sesión con DatosBizi cuando el conector lo solicite.',
  ],
} as const;

export function McpInstallGuide() {
  const [notice, setNotice] = useState<Notice>(null);

  async function copyUrl(message: string) {
    const copied = await copyMcpServerUrl();

    if (copied) {
      trackInstallAction('mcp_url_copy');
      setNotice({ kind: 'success', text: message });
      return;
    }

    setNotice({
      kind: 'error',
      text: 'No se pudo copiar automáticamente. Selecciona y copia la URL del campo.',
    });
  }

  function handleConnectorClick(connector: 'claude' | 'chatgpt') {
    trackInstallAction(`mcp_connect_${connector}`, connector);
    void copyUrl(
      connector === 'claude'
        ? 'URL copiada. En Claude: Personalizar → Conectores → Añadir conector personalizado → pegar.'
        : 'URL copiada. En ChatGPT añade un conector MCP personalizado y pega la URL.'
    );
  }

  return (
    <>
      <section id="install" aria-labelledby="install-title" className="scroll-mt-6">
        <div className="mb-4 max-w-3xl">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--muted)]">Instalación</p>
          <h2 id="install-title" className="mt-1 text-2xl font-black text-[var(--foreground)]">
            BiziDashboard para Claude y ChatGPT
          </h2>
          <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
            Instala el conector, pega la URL y continúa con tu inicio de sesión habitual de DatosBizi. No necesitas configurar OAuth ni introducir secretos.
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <article className="ui-section-card" aria-labelledby="claude-title">
            <p className="stat-label">Conector</p>
            <h3 id="claude-title" className="text-xl font-black text-[var(--foreground)]">Claude</h3>
            <p className="text-sm leading-6 text-[var(--muted)]">
              Añade DatosBizi como conector personalizado y consulta el estado de Bizi desde Claude.
            </p>
            <Button asChild className="mt-1 w-full">
              <a
                href={CLAUDE_CONNECTOR_URL}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => handleConnectorClick('claude')}
              >
                Conectar con Claude
              </a>
            </Button>
            <ol className="list-decimal space-y-2 pl-5 text-sm leading-6 text-[var(--muted)]">
              {INSTALL_STEPS.claude.map((step) => <li key={step}>{step}</li>)}
            </ol>
          </article>

          <article className="ui-section-card" aria-labelledby="chatgpt-title">
            <p className="stat-label">Conector</p>
            <h3 id="chatgpt-title" className="text-xl font-black text-[var(--foreground)]">ChatGPT</h3>
            <p className="text-sm leading-6 text-[var(--muted)]">
              Copia la misma URL para añadirla desde las opciones de conectores de tu cuenta, si están disponibles.
            </p>
            <Button asChild variant="outline" className="mt-1 w-full">
              <a
                href="https://chatgpt.com/"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => handleConnectorClick('chatgpt')}
              >
                Conectar con ChatGPT
              </a>
            </Button>
            <ol className="list-decimal space-y-2 pl-5 text-sm leading-6 text-[var(--muted)]">
              {INSTALL_STEPS.chatgpt.map((step) => <li key={step}>{step}</li>)}
            </ol>
            <p className="text-xs leading-5 text-[var(--muted)]">
              No introduzcas secretos ni datos técnicos de OAuth en el conector.
            </p>
          </article>

          <article className="ui-section-card" aria-labelledby="generic-title">
            <p className="stat-label">Desarrolladores</p>
            <h3 id="generic-title" className="text-xl font-black text-[var(--foreground)]">Cliente MCP genérico</h3>
            <p className="text-sm leading-6 text-[var(--muted)]">
              Usa esta URL en un cliente compatible con MCP. La autorización se solicita al conectar.
            </p>
            <label htmlFor="mcp-server-url" className="text-xs font-semibold text-[var(--muted)]">
              URL del servidor MCP
            </label>
            <Input id="mcp-server-url" value={MCP_SERVER_URL} readOnly aria-describedby="mcp-url-help" />
            <p id="mcp-url-help" className="sr-only">URL pública del servidor MCP de BiziDashboard.</p>
            <Button variant="outline" className="w-full" onClick={() => void copyUrl('URL MCP copiada.')}>Copiar URL</Button>
            <pre className="overflow-x-auto rounded-xl bg-black/20 p-3 text-xs text-[var(--foreground)]"><code>{`{\n  "url": "${MCP_SERVER_URL}"\n}`}</code></pre>
          </article>
        </div>

        <p
          aria-live="polite"
          aria-atomic="true"
          className={`mt-4 rounded-xl border px-4 py-3 text-sm ${
            notice?.kind === 'error'
              ? 'border-[var(--warning)]/30 bg-[var(--warning)]/10 text-[var(--foreground)]'
              : 'border-[var(--primary)]/25 bg-[var(--primary)]/10 text-[var(--foreground)]'
          }`}
        >
          {notice?.text ?? 'Al añadir el conector, iniciarás sesión con DatosBizi en una ventana segura.'}
        </p>
      </section>

      <section className="ui-section-card" aria-labelledby="connection-title">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--muted)]">Privacidad y acceso</p>
          <h2 id="connection-title" className="mt-1 text-2xl font-black text-[var(--foreground)]">Qué ocurre al conectar</h2>
        </div>
        <div className="grid gap-3 text-center text-sm font-semibold text-[var(--foreground)] md:grid-cols-4 md:items-center">
          <span className="ui-surface-block">Tú <span aria-hidden="true">→</span></span>
          <span className="ui-surface-block">Claude o ChatGPT <span aria-hidden="true">→</span></span>
          <span className="ui-surface-block">Login seguro de DatosBizi <span aria-hidden="true">→</span></span>
          <span className="ui-surface-block">BiziDashboard MCP</span>
        </div>
        <p className="text-sm leading-6 text-[var(--muted)]">
          Tu asistente no recibe tu contraseña: el inicio de sesión se realiza con DatosBizi. Puedes revocar el acceso desde la configuración del conector o desde Auth0.
        </p>
      </section>
    </>
  );
}
