'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { buildCtaClickEvent, trackUmamiEvent } from '@/lib/umami';

export const MCP_SERVER_URL = 'https://mcp.datosbizi.com/mcp';
export const MCP_CLIENT_ID = 'K2oblTaeUOJrP7mH6z97BSj0J2qcHaFX';
export const MCP_SCOPES = ['read:dashboard', 'read:exports'] as const;
export const CLAUDE_CONNECTOR_URL = `https://claude.ai/customize/connectors?connectorName=BiziDashboard&connectorUrl=${encodeURIComponent(MCP_SERVER_URL)}&modal=add-custom-connector`;
export const CHATGPT_PLUGINS_URL = 'https://chatgpt.com/plugins';

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
    'Abre Claude y ve a Personalizar → Conectores → Añadir conector personalizado.',
    'Pega la URL del servidor MCP y pulsa Continuar.',
    'En autenticación elige «Iniciar sesión cuando sea necesario» o «Iniciar sesión ahora».',
    'En el paso de autenticación, abre Advanced settings si aparece y elige «Usar tu propio cliente OAuth». Introduce el Client ID y deja el Client Secret vacío.',
    'Guarda, pulsa Conectar e inicia sesión con tu cuenta de DatosBizi.',
  ],
  chatgpt: [
    'Abre ChatGPT en el navegador y ve a Plugins → botón + → Añadir servidor MCP personalizado.',
    'Ponle el nombre BiziDashboard y pega la URL del servidor MCP.',
    'En autenticación elige OAuth e introduce el Client ID si la interfaz lo pide. Deja el secret vacío.',
    'Revisa el aviso de riesgo, marca que lo entiendes y pulsa Crear como plugin.',
    'Pulsa Conectar e inicia sesión con tu cuenta de DatosBizi.',
  ],
} as const;

const TROUBLESHOOTING = [
  {
    problem: '«Client … is not authorized to access resource server»',
    fix: 'La aplicación no está autorizada en Auth0 para acceder a la API de DatosBizi. Reinstalar el conector no lo arregla: avisa al administrador para que autorice la app.',
  },
  {
    problem: 'Error de callback o redirect',
    fix: 'Comprueba que has pegado el Client ID exacto, sin espacios. El cliente público debe tener registrada la URL de callback del conector en Auth0.',
  },
  {
    problem: 'El conector conecta pero no devuelve datos',
    fix: 'Tu cuenta no tiene permisos sobre los dashboards o las exportaciones. Consúltalo con el administrador de DatosBizi.',
  },
  {
    problem: 'Error 403 o «too_many_entities»',
    fix: 'El registro dinámico de clientes está desactivado, así que no debería ocurrir. Si aparece, escálalo a soporte.',
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

  function handleConnectorClick(connector: keyof typeof INSTALL_STEPS) {
    trackInstallAction(`mcp_connect_${connector}`, connector);
    void copyValue(
      MCP_SERVER_URL,
      connector === 'claude'
        ? 'URL copiada. Claude se abre en otra pestaña; en Advanced settings pega el Client ID.'
        : 'URL copiada. ChatGPT se abre en otra pestaña; elige OAuth y pega el Client ID si lo pide.',
      'No se pudo copiar automáticamente. Selecciona y copia la URL del campo.'
    );
  }

  return (
    <>
      <section id="install" aria-labelledby="install-title" className="scroll-mt-6">
        <div className="mb-4 max-w-3xl">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--muted)]">Instalación</p>
          <h2 id="install-title" className="mt-1 text-2xl font-black text-[var(--foreground)]">
            BiziDashboard para tu asistente de IA
          </h2>
          <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
            Usa la misma URL, el mismo Client ID y los mismos scopes en Claude, ChatGPT u otro cliente compatible. El registro dinámico de clientes está desactivado, así que hay que indicar el Client ID a mano. El cliente es público y usa PKCE: no hay Client Secret. El inicio de sesión se hace siempre en la ventana segura de DatosBizi.
          </p>
        </div>

        <article className="ui-section-card mb-4" aria-labelledby="credentials-title">
          <div>
            <p className="stat-label">Datos de conexión</p>
            <h3 id="credentials-title" className="text-xl font-black text-[var(--foreground)]">
              URL, Client ID y permisos
            </h3>
            <p className="text-sm leading-6 text-[var(--muted)]">
              Copia estos valores en el formulario del conector. No compartas tu contraseña ni tus tokens con nadie.
            </p>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div className="grid gap-2">
              <label htmlFor="mcp-server-url" className="text-xs font-semibold text-[var(--muted)]">
                URL del servidor MCP
              </label>
              <Input id="mcp-server-url" value={MCP_SERVER_URL} readOnly aria-describedby="mcp-url-help" />
              <p id="mcp-url-help" className="sr-only">URL pública del servidor MCP de BiziDashboard.</p>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => void copyValue(MCP_SERVER_URL, 'URL MCP copiada.', 'No se pudo copiar automáticamente. Selecciona y copia la URL del campo.')}
              >
                Copiar URL
              </Button>
            </div>

            <div className="grid gap-2">
              <label htmlFor="mcp-client-id" className="text-xs font-semibold text-[var(--muted)]">
                Client ID (OAuth)
              </label>
              <Input id="mcp-client-id" value={MCP_CLIENT_ID} readOnly aria-describedby="mcp-client-id-help" />
              <p id="mcp-client-id-help" className="sr-only">Identificador público del cliente OAuth de BiziDashboard.</p>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => void copyValue(MCP_CLIENT_ID, 'Client ID copiado.', 'No se pudo copiar automáticamente. Selecciona y copia el Client ID del campo.')}
              >
                Copiar Client ID
              </Button>
            </div>
          </div>

          <div className="grid gap-3 text-sm leading-6 text-[var(--muted)] md:grid-cols-2">
            <p>
              <span className="font-semibold text-[var(--foreground)]">Client Secret:</span> no hay. El cliente es público y usa PKCE; si el formulario pide un secret, déjalo vacío.
            </p>
            <div>
              <p className="font-semibold text-[var(--foreground)]">Scopes:</p>
              <ul className="mt-1 flex flex-wrap gap-2" aria-label="Scopes OAuth">
                {MCP_SCOPES.map((scope) => (
                  <li key={scope} className="ui-chip font-mono text-xs">{scope}</li>
                ))}
              </ul>
            </div>
          </div>
        </article>

        <div className="grid gap-4 lg:grid-cols-2">
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
            <p className="text-xs leading-5 text-[var(--muted)]">
              En planes Team y Enterprise, solo un propietario de la organización puede añadir el conector; después cada persona pulsa Conectar.
            </p>
          </article>

          <article className="ui-section-card" aria-labelledby="chatgpt-title">
            <p className="stat-label">Conector</p>
            <h3 id="chatgpt-title" className="text-xl font-black text-[var(--foreground)]">ChatGPT</h3>
            <p className="text-sm leading-6 text-[var(--muted)]">
              Da de alta el servidor MCP manualmente desde Plugins. No hace falta que BiziDashboard esté publicado en el directorio de ChatGPT.
            </p>
            <Button asChild variant="outline" className="mt-1 w-full">
              <a
                href={CHATGPT_PLUGINS_URL}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => handleConnectorClick('chatgpt')}
              >
                Abrir Plugins de ChatGPT
              </a>
            </Button>
            <ol className="list-decimal space-y-2 pl-5 text-sm leading-6 text-[var(--muted)]">
              {INSTALL_STEPS.chatgpt.map((step) => <li key={step}>{step}</li>)}
            </ol>
            <p className="text-xs leading-5 text-[var(--muted)]">
              En la experiencia actual de ChatGPT no hace falta el modo desarrollador. Si tu interfaz aún lo muestra, actívalo en Configuración → Conectores → Avanzado. En planes Business y Enterprise, solo administradores o propietarios pueden crear y publicar el conector.
            </p>
          </article>

          <article className="ui-section-card lg:col-span-2" aria-labelledby="generic-title">
            <p className="stat-label">Otros clientes</p>
            <h3 id="generic-title" className="text-xl font-black text-[var(--foreground)]">Cliente MCP compatible</h3>
            <p className="text-sm leading-6 text-[var(--muted)]">
              Si tu cliente permite configurar OAuth manualmente, usa la URL, el Client ID y los scopes de arriba. Si solo ofrece registro automático o descubrimiento dinámico, no podrá conectar mientras esa función esté desactivada en el servidor.
            </p>
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
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--muted)]">Comprobación</p>
          <h2 id="verify-title" className="mt-1 text-2xl font-black text-[var(--foreground)]">Comprueba que funciona</h2>
        </div>
        <ol className="list-decimal space-y-2 pl-5 text-sm leading-6 text-[var(--muted)]">
          <li>Pide a tu asistente: «Lista los dashboards disponibles» o «¿Qué exportaciones puedo generar?».</li>
          <li>Si responde con datos o con una lista vacía, el conector está autenticado y funcionando.</li>
          <li>Si dice que no encuentra herramientas, desconecta el conector y vuelve a conectarlo.</li>
        </ol>
      </section>

      <section className="ui-section-card" aria-labelledby="troubleshooting-title">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--muted)]">Ayuda</p>
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
          Si el problema no está en esta lista, contacta con soporte de DatosBizi. No compartas contraseñas ni tokens.
        </p>
      </section>

      <section className="ui-section-card" aria-labelledby="connection-title">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--muted)]">Privacidad y acceso</p>
          <h2 id="connection-title" className="mt-1 text-2xl font-black text-[var(--foreground)]">Qué ocurre al conectar</h2>
        </div>
        <div className="grid gap-3 text-center text-sm font-semibold text-[var(--foreground)] md:grid-cols-4 md:items-center">
          <span className="ui-surface-block">Tú <span aria-hidden="true">→</span></span>
          <span className="ui-surface-block">Tu asistente de IA <span aria-hidden="true">→</span></span>
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
