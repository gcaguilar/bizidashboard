import type { StationSnapshot } from '@/lib/api-types';
import { getCitizenStatus } from '@/lib/map-colors';
import { getNetworkBalanceSummary } from '@/lib/product-copy';

export const OG_CARD_WIDTH = 1200;
export const OG_CARD_HEIGHT = 630;

/** Caché corta: el estado cambia cada pocos minutos. */
export const OG_CARD_CACHE_CONTROL = 'public, max-age=120, stale-while-revalidate=300';

const FONT_STACK = "Inter, 'Helvetica Neue', Arial, sans-serif";

export function escapeSvgText(value: string): string {
  return value
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/gu, '')
    .replace(/&/gu, '&amp;')
    .replace(/</gu, '&lt;')
    .replace(/>/gu, '&gt;')
    .replace(/"/gu, '&quot;')
    .replace(/'/gu, '&apos;');
}

function truncate(value: string, max: number): string {
  const normalized = value.trim().replace(/\s+/gu, ' ');
  return normalized.length > max ? `${normalized.slice(0, max - 1)}…` : normalized;
}

type CardInput = {
  eyebrow: string;
  title: string;
  accent: string;
  badge: string;
  stats: Array<{ label: string; value: string }>;
  footer: string;
};

function renderCard({ eyebrow, title, accent, badge, stats, footer }: CardInput): string {
  const statBlocks = stats
    .slice(0, 3)
    .map((stat, index) => {
      const x = 80 + index * 340;
      return (
        `<text x="${x}" y="420" font-size="96" font-weight="900" fill="#0f172a">${escapeSvgText(stat.value)}</text>` +
        `<text x="${x}" y="462" font-size="28" font-weight="600" fill="#475569">${escapeSvgText(stat.label)}</text>`
      );
    })
    .join('');

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${OG_CARD_WIDTH}" height="${OG_CARD_HEIGHT}" viewBox="0 0 ${OG_CARD_WIDTH} ${OG_CARD_HEIGHT}" role="img" aria-label="${escapeSvgText(title)}" font-family="${FONT_STACK}">`,
    `<rect width="${OG_CARD_WIDTH}" height="${OG_CARD_HEIGHT}" fill="#f8fafc"/>`,
    `<rect width="24" height="${OG_CARD_HEIGHT}" fill="${accent}"/>`,
    `<text x="80" y="110" font-size="28" font-weight="700" letter-spacing="3" fill="#475569">${escapeSvgText(eyebrow.toUpperCase())}</text>`,
    `<text x="80" y="200" font-size="64" font-weight="900" fill="#0f172a">${escapeSvgText(title)}</text>`,
    `<rect x="80" y="240" width="${Math.max(260, badge.length * 20 + 40)}" height="60" rx="30" fill="${accent}"/>`,
    `<text x="110" y="281" font-size="30" font-weight="700" fill="#ffffff">${escapeSvgText(badge)}</text>`,
    statBlocks,
    `<text x="80" y="570" font-size="26" fill="#64748b">${escapeSvgText(footer)}</text>`,
    `<text x="1120" y="570" font-size="30" font-weight="900" text-anchor="end" fill="#0f172a">datosbizi.com</text>`,
    '</svg>',
  ].join('');
}

export function buildStationOgCard(station: StationSnapshot): string {
  const status = getCitizenStatus(station);
  return renderCard({
    eyebrow: 'Bizi Zaragoza · ahora',
    title: truncate(station.name, 34),
    accent: status.color,
    badge: `${status.icon} ${status.label}`,
    stats: [
      { label: 'Bicis', value: String(station.bikesAvailable) },
      { label: 'Huecos libres', value: String(station.anchorsFree) },
      { label: 'Capacidad', value: String(station.capacity) },
    ],
    footer: status.description,
  });
}

export function buildNetworkOgCard(stations: StationSnapshot[]): string {
  const summary = getNetworkBalanceSummary(stations);
  const accent =
    summary.state === 'tense' ? '#b45309' : summary.state === 'balanced' ? '#0f766e' : '#64748b';
  const bikes = stations.reduce((total, station) => total + station.bikesAvailable, 0);
  return renderCard({
    eyebrow: 'Estado de la red Bizi',
    title: 'Bizi Zaragoza ahora',
    accent,
    badge: `Red ${summary.label}`.slice(0, 40),
    stats: [
      { label: 'Bicis libres', value: String(bikes) },
      { label: 'Estaciones', value: String(stations.length) },
      { label: 'Vacías o llenas', value: String(summary.criticalStationsCount) },
    ],
    footer: 'Datos abiertos GBFS · estimaciones, no viajes reales',
  });
}

export function buildFallbackOgCard(): string {
  return renderCard({
    eyebrow: 'DatosBizi',
    title: 'Bizi Zaragoza en datos',
    accent: '#64748b',
    badge: 'Sin datos ahora',
    stats: [],
    footer: 'Disponibilidad y estadísticas de Bizi Zaragoza',
  });
}

export function svgResponse(svg: string): Response {
  return new Response(svg, {
    status: 200,
    headers: {
      'Content-Type': 'image/svg+xml; charset=utf-8',
      // SVG sin scripts; esta CSP evita ejecución si alguien lo abre directamente.
      'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline'; sandbox",
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
