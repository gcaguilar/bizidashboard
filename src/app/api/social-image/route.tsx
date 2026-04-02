import { ImageResponse } from 'next/og';
import type { SocialImageKind } from '@/lib/social-images';

export const runtime = 'edge';

const DEFAULT_BADGES = ['DatosBizi', 'Bizi Zaragoza'];

const KIND_THEME: Record<
  SocialImageKind,
  {
    accent: string;
    backgroundStart: string;
    backgroundEnd: string;
    eyebrow: string;
  }
> = {
  home: {
    accent: '#d90a1a',
    backgroundStart: '#fff7f7',
    backgroundEnd: '#ffe4e6',
    eyebrow: 'Datos publicos y analisis',
  },
  landing: {
    accent: '#0f766e',
    backgroundStart: '#f4fbfa',
    backgroundEnd: '#d9f3ef',
    eyebrow: 'Landing preparada para captacion',
  },
  report: {
    accent: '#9a3412',
    backgroundStart: '#fff7ed',
    backgroundEnd: '#ffedd5',
    eyebrow: 'Informe mensual indexable',
  },
  station: {
    accent: '#1d4ed8',
    backgroundStart: '#f5f9ff',
    backgroundEnd: '#dbeafe',
    eyebrow: 'Ficha publica por estacion',
  },
  district: {
    accent: '#7c3aed',
    backgroundStart: '#faf5ff',
    backgroundEnd: '#ede9fe',
    eyebrow: 'Contexto territorial',
  },
  api: {
    accent: '#1f2937',
    backgroundStart: '#f8fafc',
    backgroundEnd: '#e2e8f0',
    eyebrow: 'API y datos abiertos',
  },
};

function sanitizeText(value: string | null, fallback: string, maxLength: number): string {
  const normalized = (value ?? fallback).trim().replace(/\s+/gu, ' ');

  if (normalized.length === 0) {
    return fallback;
  }

  return normalized.slice(0, maxLength);
}

function resolveKind(rawKind: string | null): SocialImageKind {
  switch (rawKind) {
    case 'landing':
    case 'report':
    case 'station':
    case 'district':
    case 'api':
      return rawKind;
    default:
      return 'home';
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const kind = resolveKind(searchParams.get('kind'));
  const theme = KIND_THEME[kind];
  const title = sanitizeText(searchParams.get('title'), 'DatosBizi', 70);
  const subtitle = sanitizeText(
    searchParams.get('subtitle'),
    'Disponibilidad, patrones y analisis de Bizi Zaragoza',
    120
  );
  const eyebrow = sanitizeText(searchParams.get('eyebrow'), theme.eyebrow, 60);
  const badges = searchParams
    .getAll('badge')
    .map((badge) => sanitizeText(badge, '', 28))
    .filter(Boolean)
    .slice(0, 4);
  const visibleBadges = badges.length > 0 ? badges : DEFAULT_BADGES;

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          background: `linear-gradient(135deg, ${theme.backgroundStart} 0%, ${theme.backgroundEnd} 100%)`,
          padding: '48px',
          color: '#111827',
          fontFamily: 'sans-serif',
          position: 'relative',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: '20px',
            borderRadius: '28px',
            border: `2px solid ${theme.accent}22`,
          }}
        />

        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div
              style={{
                width: '68px',
                height: '68px',
                borderRadius: '18px',
                background: theme.accent,
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '34px',
                fontWeight: 800,
              }}
            >
              B
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ fontSize: '24px', color: theme.accent, fontWeight: 700 }}>{eyebrow}</div>
              <div style={{ fontSize: '18px', color: '#475569' }}>datosbizi.com</div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px', maxWidth: '900px' }}>
            <div style={{ fontSize: '66px', lineHeight: 1.05, fontWeight: 800 }}>{title}</div>
            <div style={{ fontSize: '28px', lineHeight: 1.3, color: '#334155' }}>{subtitle}</div>
          </div>

          <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
            {visibleBadges.map((badge) => (
              <div
                key={badge}
                style={{
                  padding: '10px 18px',
                  borderRadius: '999px',
                  background: `${theme.accent}18`,
                  color: theme.accent,
                  fontSize: '22px',
                  fontWeight: 700,
                }}
              >
                {badge}
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
