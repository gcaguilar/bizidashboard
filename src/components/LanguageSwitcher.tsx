'use client';

import { useLocation } from '@tanstack/react-router';
import {
  getLocaleFromPathname,
  isTranslatedPath,
  localizePath,
  stripLocalePrefix,
  type Locale,
} from '@/lib/i18n/locales';

const OTHER_LOCALE: Record<Locale, Locale> = { es: 'en', en: 'es' };

const LABELS: Record<Locale, { text: string; title: string }> = {
  es: { text: 'Español', title: 'Ver esta página en español' },
  en: { text: 'English', title: 'View this page in English' },
};

/**
 * Selector de idioma. Solo aparece en páginas con versión en el otro idioma y
 * usa un `<a>` normal (navegación completa): evita el `rewrite` de salida del
 * router y da a los rastreadores un enlace real.
 */
export function LanguageSwitcher() {
  const location = useLocation();
  const publicHref = location?.publicHref ?? location?.pathname ?? '/';
  const [publicPath, ...rest] = publicHref.split(/(?=[?#])/);
  const locale = getLocaleFromPathname(publicPath);
  const internalPath = stripLocalePrefix(publicPath);

  if (!isTranslatedPath(internalPath)) {
    return null;
  }

  const target = OTHER_LOCALE[locale];
  const href = localizePath(`${internalPath}${rest.join('')}`, target);

  return (
    <a
      href={href}
      rel="alternate"
      lang={target}
      // El hash solo existe en el cliente: no debe provocar aviso de hidratacion.
      suppressHydrationWarning
      hrefLang={target}
      title={LABELS[target].title}
      aria-label={LABELS[target].title}
      className="rounded-md px-2 py-1 text-xs font-semibold text-[var(--muted)] transition hover:text-[var(--foreground)]"
    >
      {LABELS[target].text}
    </a>
  );
}
