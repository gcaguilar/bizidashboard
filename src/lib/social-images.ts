import { appRoutes } from '@/lib/routes';

export type SocialImageKind =
  | 'home'
  | 'landing'
  | 'report'
  | 'station'
  | 'district'
  | 'api';

type BuildSocialImagePathOptions = {
  kind: SocialImageKind;
  title: string;
  subtitle?: string;
  eyebrow?: string;
  badges?: string[];
};

function normalizeImageText(value: string | undefined, fallback: string): string {
  const normalized = (value ?? fallback).trim().replace(/\s+/gu, ' ');
  return normalized.length > 0 ? normalized.slice(0, 90) : fallback;
}

export function buildSocialImagePath({
  kind,
  title,
  subtitle,
  eyebrow,
  badges,
}: BuildSocialImagePathOptions): string {
  const params = new URLSearchParams({
    kind,
    title: normalizeImageText(title, 'DatosBizi'),
  });

  const normalizedSubtitle = normalizeImageText(subtitle, '');
  const normalizedEyebrow = normalizeImageText(eyebrow, '');

  if (normalizedSubtitle.length > 0) {
    params.set('subtitle', normalizedSubtitle);
  }

  if (normalizedEyebrow.length > 0) {
    params.set('eyebrow', normalizedEyebrow);
  }

  for (const badge of (badges ?? []).map((item) => normalizeImageText(item, '')).filter(Boolean).slice(0, 4)) {
    params.append('badge', badge);
  }

  return `${appRoutes.api.socialImage()}?${params.toString()}`;
}
