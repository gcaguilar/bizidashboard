import { describe, expect, it } from 'vitest';

import {
  buildFeedCaption,
  buildHashtags,
  buildSocialAltText,
  buildStoryText,
  formatFrictionFact,
  formatSocialWeekLabel,
  getDayFraming,
  SOCIAL_ALT_TEXT_MAX_LENGTH,
  SOCIAL_CAPTION_MAX_LENGTH,
  SOCIAL_FEED_DISCLAIMER,
  SOCIAL_HASHTAGS,
  SOCIAL_STORY_FOOTER,
} from '@/lib/social/copy';

const TRAVEL_TERM = /viaj/iu;
const JARGON_TERM = /tensi[óo]n|estaciones? clave|GBFS/iu;
const COMMUTE_TERM = /hora punta|entrada al trabajo|salida del trabajo|desplazamiento|commute/iu;

function withoutDisclaimer(value: string): string {
  return value.replace(SOCIAL_FEED_DISCLAIMER, '');
}

describe('social copy guardrails', () => {
  it('keeps the project vocabulary and only mentions "viajes" in the legal disclaimer', () => {
    const caption = buildFeedCaption({
      hook: 'Zaragoza en bici · semana del 19 al 25 de octubre',
      facts: [
        { label: 'Distrito con más uso', value: 'Centro' },
        { label: 'Horas sin bicis o sin huecos', value: formatFrictionFact(4, 2, 20) },
      ],
      context: 'La red cerró la semana con pocas bicis en dos distritos.',
      cta: 'Explora tu barrio en datosbizi.com',
    });

    expect(caption).toContain('más uso');
    expect(caption).toContain('sin bicis o sin huecos');
    expect(caption).not.toMatch(JARGON_TERM);
    expect(withoutDisclaimer(caption)).not.toMatch(TRAVEL_TERM);
    expect(caption).toContain(SOCIAL_FEED_DISCLAIMER);
    expect(SOCIAL_FEED_DISCLAIMER).toContain('no viajes reales');
  });

  it('uses the five required hashtags', () => {
    expect(buildHashtags()).toEqual([
      '#BiziZaragoza',
      '#Zaragoza',
      '#MovilidadSostenible',
      '#Bicicleta',
      '#DatosAbiertos',
    ]);
    expect(SOCIAL_HASHTAGS).toHaveLength(5);

    const caption = buildFeedCaption({ hook: 'Zaragoza en bici' });
    for (const hashtag of SOCIAL_HASHTAGS) {
      expect(caption).toContain(hashtag);
    }
  });

  it('never exceeds the caption limit, even with a runaway hook', () => {
    const caption = buildFeedCaption({
      hook: 'Zaragoza en bici '.repeat(400),
      facts: Array.from({ length: 8 }, (_, index) => ({
        label: `Hecho ${index}`,
        value: 'índice de actividad '.repeat(20),
      })),
      context: 'Contexto largo '.repeat(100),
      cta: 'Explora tu barrio en datosbizi.com',
    });

    expect(caption.length).toBeLessThanOrEqual(SOCIAL_CAPTION_MAX_LENGTH);
    expect(caption).toContain(SOCIAL_FEED_DISCLAIMER);
    for (const hashtag of SOCIAL_HASHTAGS) {
      expect(caption).toContain(hashtag);
    }
  });

  it('uses non-commute framing for weekends and keeps both daily slots', () => {
    const weekday = getDayFraming('2026-10-27');
    const weekend = getDayFraming('2026-10-31');

    expect(weekday.isWeekend).toBe(false);
    expect(weekday.morningKicker).toBe('Bizi esta mañana');
    expect(weekday.afternoonKicker).toBe('Bizi esta tarde');

    expect(weekend.isWeekend).toBe(true);
    expect(weekend.morningKicker).toBe('Bizi este fin de semana');
    expect(weekend.afternoonKicker).toBe('Bizi este fin de semana · tarde');

    for (const framing of [weekday, weekend]) {
      expect(framing.morningKicker).not.toMatch(COMMUTE_TERM);
      expect(framing.afternoonKicker).not.toMatch(COMMUTE_TERM);
    }
  });

  it('builds short internal story texts without relying on Instagram captions', () => {
    const text = buildStoryText({
      slot: 'morning',
      dateKey: '2026-10-27',
      headline: '3 estaciones que suelen vaciarse, sin bicis',
      dataWindow: '07:00–08:30',
    });

    expect(text.length).toBeLessThanOrEqual(280);
    expect(text).toContain('Story de la mañana');
    expect(text).toContain('07:00–08:30');
    expect(text).toContain('datosbizi.com');
    expect(text).not.toContain('#');
  });

  it('writes descriptive alt text without hashtags', () => {
    const alt = buildSocialAltText({
      kind: 'story',
      slot: 'morning',
      dateKey: '2026-10-27',
      headline: '3 estaciones que suelen vaciarse, sin bicis',
      facts: [
        { label: 'Estaciones sin bicis', value: 'Plaza España (0 bicis)' },
        { label: 'En toda la red', value: '12 de 276 estaciones sin bicis o sin huecos' },
      ],
      dataWindow: '07:00–08:30',
      cause: { label: 'Fiestas del Pilar' },
    });

    expect(alt).toContain('3 estaciones que suelen vaciarse, sin bicis');
    expect(alt).toContain('Plaza España');
    expect(alt).toContain('Fiestas del Pilar');
    expect(alt).toContain('estimación');
    expect(alt).not.toContain('#');
    expect(alt.length).toBeLessThanOrEqual(SOCIAL_ALT_TEXT_MAX_LENGTH);
    expect(alt).not.toMatch(TRAVEL_TERM);
  });

  it('formats week ranges across months and years deterministically', () => {
    expect(formatSocialWeekLabel('2026-10-19', '2026-10-25')).toBe(
      'semana del 19 al 25 de octubre'
    );
    expect(formatSocialWeekLabel('2026-10-26', '2026-11-01')).toBe(
      'semana del 26 de octubre al 1 de noviembre'
    );
    expect(formatSocialWeekLabel('2026-12-28', '2027-01-03')).toBe(
      'semana del 28 de diciembre de 2026 al 3 de enero de 2027'
    );
    expect(SOCIAL_STORY_FOOTER).toBe('datosbizi.com · datos abiertos de Bizi Zaragoza');
  });
});
