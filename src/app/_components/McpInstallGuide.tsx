'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { buildCtaClickEvent, trackUmamiEvent } from '@/lib/umami';

export const MCP_SERVER_URL = 'https://mcp.datosbizi.com/mcp';
export const MCP_CLIENT_ID = 'K2oblTaeUOJrP7mH6z97BSj0J2qcHaFX';
export const MCP_SCOPES = ['read:dashboard', 'read:exports'] as const;
export const MCP_CALLBACK_URLS = [
  'https://claude.ai/api/mcp/auth_callback',
  'https://chatgpt.com/connector_platform_oauth_redirect',
] as const;
export const CHATGPT_PLUGINS_URL = 'https://chatgpt.com/plugins';
export const CLAUDE_CODE_COMMAND = `claude mcp add --transport http bizidashboard ${MCP_SERVER_URL}`;
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

/** Copies a value, including browsers without navigator.clipboard. */
async function copyText(value: string): Promise<boolean> {
  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(value);
      return true;
    } catch {
      // Some embedded clients expose Clipboard but deny its permission.
    }
  }

  return typeof document !== 'undefined' && copyWithDocumentFallback(value);
}

/** Copies the public endpoint, including browsers without navigator.clipboard. */
export async function copyMcpServerUrl(): Promise<boolean> {
  return copyText(MCP_SERVER_URL);
}

/** Copies the public OAuth client ID. */
export async function copyMcpClientId(): Promise<boolean> {
  return copyText(MCP_CLIENT_ID);
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
    'Abre Claude y ve a Personalizar → Conectores.',
    'Pulsa «Añadir conector personalizado».',
    'Pega la dirección de arriba y pulsa Continuar.',
    'Pulsa Conectar, inicia sesión con tu cuenta de DatosBizi y acepta el permiso.',
  ],
  chatgpt: [
    'Abre chatgpt.com/plugins y pulsa para añadir un servidor MCP personalizado.',
    `Escribe un nombre (por ejemplo, BiziDashboard) y, en Conexión, deja «URL del servidor» y pega ${MCP_SERVER_URL}.`,
    'En Autenticación deja OAuth.',
    'Marca «Lo entiendo y quiero continuar» y pulsa «Crear como complemento».',
    'Inicia sesión con tu cuenta de DatosBizi y acepta el permiso.',
  ],
  claudeCode: [
    'Pega este comando en tu terminal.',
    'Abre Claude Code, escribe /mcp, elige bizidashboard y pulsa Autenticar.',
    'Inicia sesión con tu cuenta de DatosBizi y acepta el permiso.',
  ],
} as const;

const TROUBLESHOOTING = [
  {
    problem: '«No está autorizado» (Client … is not authorized)',
    fix: 'Pasa cuando falta dar permiso a tu aplicación. Reinstalar no lo arregla: escribe a soporte.',
  },
  {
    problem: '«Unknown client» o error 400',
    fix: 'Tu asistente todavía no está dado de alta en DatosBizi. Escribe a soporte.',
  },
  {
    problem: 'Conecta, pero no devuelve datos',
    fix: 'Tu cuenta aún no tiene acceso a esos datos. Pídeselo a tu administrador de DatosBizi.',
  },
] as const;

export function McpInstallGuide() {
  const [notice, setNotice] = useState<Notice>(null);

  async function copyValue(value: string, successMessage: string, fallbackMessage: string) {
    const copied = await copyText(value);

    if (copied) {
      setNotice({ kind: 'success', text: successMessage });
      return;
    }

    setNotice({ kind: 'error', text: fallbackMessage });
  }

  function handleChatgptConnect() {
    trackInstallAction('mcp_connect_chatgpt', 'chatgpt');
    void copyValue(
      MCP_SERVER_URL,
      'URL copiada. ChatGPT se abre en otra pestaña.',
      'No se pudo copiar automáticamente. Selecciona y copia la URL del campo.'
    );
  }

  function handleClaudeConnect() {
    trackInstallAction('mcp_connect_claude', 'claude');
    void copyValue(
      MCP_SERVER_URL,
      'URL copiada. Claude se abre en otra pestaña.',
      'No se pudo copiar automáticamente. Selecciona y copia la URL del campo.'
    );
  }

  return (
    <>
      <section id="install" aria-labelledby="install-title" className="scroll-mt-6">
        <div className="mb-4 max-w-3xl">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--muted)]">Instalación</p>
          <h2 id="install-title" className="mt-1 text-2xl font-black text-[var(--foreground)]">
            Cómo conectarlo
          </h2>
        </div>

        <article className="ui-section-card mb-4" aria-labelledby="address-title">
          <div>
            <p className="stat-label">Dirección del servidor</p>
            <h3 id="address-title" className="text-xl font-black text-[var(--foreground)]">
              Lo único que necesitas es esta dirección
            </h3>
            <p className="text-sm leading-6 text-[var(--muted)]">
              Tu asistente se encarga del resto y tú solo inicias sesión con tu cuenta de DatosBizi.
            </p>
          </div>

          <div className="grid gap-2">
            <label htmlFor="mcp-server-url" className="text-xs font-semibold text-[var(--muted)]">
              URL del servidor MCP
            </label>
            <Input id="mcp-server-url" value={MCP_SERVER_URL} readOnly aria-describedby="mcp-url-help" />
            <p id="mcp-url-help" className="sr-only">URL pública del servidor MCP de BiziDashboard.</p>
            <Button
              variant="outline"
              className="w-full md:w-auto"
              onClick={() => void copyValue(MCP_SERVER_URL, 'URL MCP copiada.', 'No se pudo copiar automáticamente. Selecciona y copia la URL del campo.')}
            >
              Copiar
            </Button>
          </div>
        </article>

        <div className="mb-3 max-w-3xl">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--muted)]">Elige tu asistente</p>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <article className="ui-section-card" aria-labelledby="claude-title">
            <p className="stat-label">Conector</p>
            <h3 id="claude-title" className="text-xl font-black text-[var(--foreground)]">Claude</h3>
            <p className="text-sm leading-6 text-[var(--muted)]">
              Añade DatosBizi como conector personalizado y consulta el estado de Bizi desde Claude.
            </p>
            <ol className="list-decimal space-y-2 pl-5 text-sm leading-6 text-[var(--muted)]">
              {INSTALL_STEPS.claude.map((step) => <li key={step}>{step}</li>)}
            </ol>
            <p className="text-sm leading-6 text-[var(--foreground)]">
              <span className="font-semibold">¿Ya lo habías creado antes?</span>{' '}
              <span className="text-[var(--muted)]">Bórralo y créalo de nuevo con solo la dirección.</span>
            </p>
            <p className="text-xs leading-5 text-[var(--muted)]">
              Si usas Claude en un equipo u organización, un administrador debe añadir el conector una vez; después cada persona pulsa Conectar.
            </p>
            <Button asChild className="mt-1 w-full">
              <a
                href={CLAUDE_CONNECTOR_URL}
                target="_blank"
                rel="noopener noreferrer"
                onClick={handleClaudeConnect}
              >
                Conectar con Claude
              </a>
            </Button>
          </article>

          <article className="ui-section-card" aria-labelledby="chatgpt-title">
            <p className="stat-label">Conector</p>
            <h3 id="chatgpt-title" className="text-xl font-black text-[var(--foreground)]">ChatGPT</h3>
            <p className="text-sm leading-6 text-[var(--muted)]">
              Crea un MCP personalizado en ChatGPT y consulta el estado de Bizi desde tus conversaciones.
            </p>
            <ol className="list-decimal space-y-2 pl-5 text-sm leading-6 text-[var(--muted)]">
              {INSTALL_STEPS.chatgpt.map((step) => <li key={step}>{step}</li>)}
            </ol>
            <p className="text-xs leading-5 text-[var(--muted)]">
              Si ya habías creado el conector antes, bórralo y créalo de nuevo para que ChatGPT use el callback actual.
            </p>
            <Button asChild className="mt-1 w-full">
              <a
                href={CHATGPT_PLUGINS_URL}
                target="_blank"
                rel="noopener noreferrer"
                onClick={handleChatgptConnect}
              >
                Crear MCP en ChatGPT
              </a>
            </Button>
          </article>

          <article className="ui-section-card" aria-labelledby="claude-code-title">
            <p className="stat-label">Terminal</p>
            <h3 id="claude-code-title" className="text-xl font-black text-[var(--foreground)]">Claude Code</h3>
            <p className="text-sm leading-6 text-[var(--muted)]">
              Añade el servidor desde la terminal y autentícate dentro de Claude Code.
            </p>
            <ol className="list-decimal space-y-2 pl-5 text-sm leading-6 text-[var(--muted)]">
              <li>
                Pega este comando en tu terminal.
                <code className="ui-surface-block mt-2 block overflow-x-auto whitespace-pre font-mono text-xs text-[var(--foreground)]">
                  {CLAUDE_CODE_COMMAND}
                </code>
              </li>
              <li>Abre Claude Code, escribe /mcp, elige bizidashboard y pulsa Autenticar.</li>
              <li>Inicia sesión con tu cuenta de DatosBizi y acepta el permiso.</li>
            </ol>
            <Button
              variant="outline"
              className="mt-1 w-full"
              onClick={() => void copyValue(CLAUDE_CODE_COMMAND, 'Comando copiado.', 'No se pudo copiar automáticamente. Selecciona y copia el comando.')}
            >
              Copiar comando
            </Button>
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

      <section className="ui-section-card" aria-labelledby="verify-title">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--muted)]">¿Funciona?</p>
          <h2 id="verify-title" className="mt-1 text-2xl font-black text-[var(--foreground)]">Comprueba que funciona</h2>
        </div>
        <p className="text-sm leading-6 text-[var(--foreground)]">
          Escríbele a tu asistente: «¿Cuántas estaciones hay ahora mismo?» o «Muéstrame las alertas recientes».
        </p>
        <ul className="list-disc space-y-2 pl-5 text-sm leading-6 text-[var(--muted)]">
          <li>Si te responde con datos, ya está conectado.</li>
          <li>Si dice que no encuentra herramientas, desconecta el conector y vuelve a conectarlo.</li>
        </ul>
      </section>

      <section className="ui-section-card" aria-labelledby="troubleshooting-title">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--muted)]">¿Algo ha fallado?</p>
          <h2 id="troubleshooting-title" className="mt-1 text-2xl font-black text-[var(--foreground)]">Problemas frecuentes</h2>
        </div>
        <dl className="grid gap-3 text-sm leading-6">
          {TROUBLESHOOTING.map((item) => (
            <div key={item.problem} className="ui-surface-block text-left">
              <dt className="font-semibold text-[var(--foreground)]">{item.problem}</dt>
              <dd className="text-[var(--muted)]">{item.fix}</dd>
            </div>
          ))}
        </dl>
        <p className="text-sm leading-6 text-[var(--muted)]">
          Cualquier otro problema: contacta con soporte de DatosBizi. Nunca compartas tu contraseña con nadie.
        </p>
      </section>

      <section className="ui-section-card" aria-labelledby="connection-title">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--muted)]">Privacidad y acceso</p>
          <h2 id="connection-title" className="mt-1 text-2xl font-black text-[var(--foreground)]">Tu cuenta está segura</h2>
        </div>
        <p className="text-sm leading-6 text-[var(--muted)]">
          Tu asistente nunca ve tu contraseña. El inicio de sesión se hace en la ventana segura de DatosBizi y puedes quitar el acceso cuando quieras desde la configuración del conector.
        </p>
      </section>

      <section className="ui-section-card" aria-labelledby="credentials-title">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--muted)]">Solo para perfiles técnicos</p>
          <h2 id="credentials-title" className="mt-1 text-2xl font-black text-[var(--foreground)]">
            Clientes MCP que piden un Client ID
          </h2>
          <p className="text-sm leading-6 text-[var(--muted)]">
            Si tu programa te pide los datos de conexión a mano, usa estos valores.
          </p>
        </div>

        <div className="grid gap-2 md:grid-cols-2 md:items-end">
          <div className="grid gap-2">
            <label htmlFor="mcp-client-id" className="text-xs font-semibold text-[var(--muted)]">
              Client ID (OAuth)
            </label>
            <Input id="mcp-client-id" value={MCP_CLIENT_ID} readOnly aria-describedby="mcp-client-id-help" />
            <p id="mcp-client-id-help" className="sr-only">Identificador público del cliente OAuth de BiziDashboard.</p>
          </div>
          <Button
            variant="outline"
            className="w-full"
            onClick={() => void copyValue(MCP_CLIENT_ID, 'Client ID copiado.', 'No se pudo copiar automáticamente. Selecciona y copia el Client ID del campo.')}
          >
            Copiar Client ID
          </Button>
        </div>

        <div className="grid gap-3 text-sm leading-6 text-[var(--muted)] md:grid-cols-2">
          <p>
            <span className="font-semibold text-[var(--foreground)]">Client Secret:</span> ninguno (déjalo vacío; usa PKCE).
          </p>
          <div>
            <p className="font-semibold text-[var(--foreground)]">Permisos:</p>
            <ul className="mt-1 flex flex-wrap gap-2" aria-label="Scopes OAuth">
              {MCP_SCOPES.map((scope) => (
                <li key={scope} className="ui-chip font-mono text-xs">{scope}</li>
              ))}
            </ul>
          </div>
          <p>
            <span className="font-semibold text-[var(--foreground)]">En Claude:</span> Advanced settings → «Usar tu propio cliente OAuth».
          </p>
          <div>
            <p className="font-semibold text-[var(--foreground)]">Callbacks admitidos:</p>
            <ul className="mt-1 grid gap-1">
              {MCP_CALLBACK_URLS.map((url) => (
                <li key={url} className="font-mono text-xs break-all">{url}</li>
              ))}
            </ul>
          </div>
        </div>

        <p className="text-sm leading-6 text-[var(--muted)]">
          Los clientes que solo admiten registro automático (DCR) no pueden conectar, porque está desactivado por seguridad.
        </p>
      </section>
    </>
  );
}
