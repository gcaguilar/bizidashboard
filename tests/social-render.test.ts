import { describe, expect, it } from 'vitest';
import * as jpeg from 'jpeg-js';

import { SOCIAL_FEED_FOOTER, SOCIAL_STORY_FOOTER } from '@/lib/social/copy';
import {
  buildCarouselSlideSvg,
  buildStorySvg,
  renderCarousel,
  renderStory,
  SOCIAL_CAROUSEL_HEIGHT,
  SOCIAL_CAROUSEL_WIDTH,
  SOCIAL_STORY_HEIGHT,
  SOCIAL_STORY_WIDTH,
} from '@/lib/social/render';
import type {
  SocialCarousel,
  SocialCarouselSlide,
  SocialStory,
} from '@/lib/social/types';

const story: SocialStory = {
  slot: 'morning',
  family: 'daily-story',
  dateKey: '2026-10-27',
  headline: '2 estaciones clave agotadas',
  facts: [
    { label: 'Estaciones clave agotadas', value: 'Plaza España (0 bicis) · Independencia (0 bicis)' },
    { label: 'Movimiento por zonas', value: 'Centro · Delicias' },
    { label: 'Red', value: 'Afectaciones moderadas · 12 de 276 sin bicis o huecos' },
  ],
  footer: SOCIAL_STORY_FOOTER,
  caption: 'Story de la mañana · datosbizi.com',
  altText: 'Imagen vertical de la story del 27 de octubre de 2026',
  kicker: 'Mañana en bici · 07:00–08:30',
  accent: '#b45309',
  bars: [
    { label: 'Centro', value: 1200 },
    { label: 'Delicias', value: 900 },
    { label: 'Universidad', value: 600 },
  ],
  barsLabel: 'Movimiento estimado por distrito',
};

function slide(index: number, overrides: Partial<SocialCarouselSlide> = {}): SocialCarouselSlide {
  return {
    kicker: `Sección ${index + 1}`,
    headline: `Titular de la lámina ${index + 1}`,
    facts: [
      { label: 'Hecho principal', value: 'Índice de actividad 1.200' },
      { label: 'Contexto', value: 'Movimiento estimado en la semana' },
    ],
    footer: SOCIAL_FEED_FOOTER,
    accent: index % 2 === 0 ? '#0f766e' : '#1d4ed8',
    bars: [
      { label: 'Centro', value: 1200 },
      { label: 'Delicias', value: 900 },
    ],
    barsLabel: 'Índice de actividad',
    ...overrides,
  };
}

const carousel: SocialCarousel = {
  slot: 'weekly',
  family: 'weekly-carousel',
  dateKey: '2026-10-19',
  headline: 'Zaragoza en bici · semana del 19 al 25 de octubre',
  facts: [{ label: 'Red', value: 'Afectaciones moderadas' }],
  footer: SOCIAL_FEED_FOOTER,
  caption: 'Zaragoza en bici · semana del 19 al 25 de octubre',
  altText: 'Carrusel de 5 imágenes',
  slides: Array.from({ length: 5 }, (_, index) => slide(index)),
};

function expectJpeg(bytes: Uint8Array, width: number, height: number): void {
  expect(bytes.length).toBeGreaterThan(10_000);
  expect(Array.from(bytes.slice(0, 3))).toEqual([0xff, 0xd8, 0xff]);

  const decoded = jpeg.decode(bytes, { useTArray: true });
  expect(decoded.width).toBe(width);
  expect(decoded.height).toBe(height);
}

describe('social render', () => {
  it(
    'renders a 1080x1920 story as JPEG',
    () => {
      const bytes = renderStory(story);
      expectJpeg(bytes, SOCIAL_STORY_WIDTH, SOCIAL_STORY_HEIGHT);
    },
    30_000
  );

  it(
    'renders five 1080x1350 carousel slides as JPEG',
    () => {
      const images = renderCarousel(carousel);

      expect(images).toHaveLength(5);
      for (const image of images) {
        expectJpeg(image, SOCIAL_CAROUSEL_WIDTH, SOCIAL_CAROUSEL_HEIGHT);
      }
    },
    30_000
  );

  it('escapes every dynamic text injected into the SVG', () => {
    const svg = buildStorySvg({
      ...story,
      headline: 'Plaza <España> & Co "centro"',
      facts: [{ label: '<b>Estación</b>', value: '<script>alert(1)</script> & más' }],
      accent: '#fff" onload="alert(1)',
    });

    expect(svg).toContain('Plaza &lt;España&gt;');
    expect(svg).toContain('&amp; Co &quot;centro&quot;');
    expect(svg).toContain('&lt;B&gt;ESTACIÓN&lt;/B&gt;');
    expect(svg).toContain('&lt;script&gt;alert(1)&lt;/script&gt; &amp; más');
    expect(svg).not.toContain('<España>');
    expect(svg).not.toContain('<script>');
    expect(svg).not.toContain('onload');
    expect(svg).toContain('#0f766e');
    expect(svg).toContain('datosbizi.com');
  });

  it('escapes slide text and keeps the slide counter deterministic', () => {
    const svg = buildCarouselSlideSvg(
      slide(0, { headline: 'Delicias <Centro> & más' }),
      2,
      5
    );

    expect(svg).toContain('Delicias');
    expect(svg).toContain('&lt;Centro&gt; &amp; más');
    expect(svg).toContain('3/5');
    expect(svg).toContain('datosbizi.com');
  });

  it('never truncates long text: it wraps onto more lines instead', () => {
    const value =
      'Desde Plaza de los Sitios: Paseo de la Independencia - Plaza de Aragón, a unos 280 m (8 bicis)';
    const svg = buildStorySvg({
      ...story,
      headline: 'Avenida de Navarra - Hospital Miguel Servet sin bicis',
      kicker: 'Bizi este fin de semana · tarde · 17:00–18:30',
      facts: [{ label: 'Dónde coger bici cerca', value }],
    });

    expect(svg).not.toContain('…');
    // Todas las palabras del valor siguen en el SVG, repartidas en lineas.
    for (const word of value.split(' ')) {
      expect(svg).toContain(word.replace('&', '&amp;'));
    }
    expect(svg.match(/<text /g)!.length).toBeGreaterThan(8);
  });

  it('keeps every text inside the canvas and above the footer line', () => {
    const svg = buildCarouselSlideSvg(
      slide(0, {
        kicker: 'Semana del 28 de diciembre de 2026 al 3 de enero de 2027',
        headline: 'Avenida de Navarra - Hospital Miguel Servet: más horas sin bicis o huecos',
        facts: Array.from({ length: 4 }, (_, index) => ({
          label: `Estación con más horas sin bicis o sin huecos ${index}`,
          value:
            'Avenida de Navarra - Hospital Miguel Servet · Gran Vía - Fernando el Católico · 30%',
        })),
        bars: [],
      })
    );

    const baselines = Array.from(svg.matchAll(/<text [^>]*y="(\d+)"/g)).map((m) => Number(m[1]));
    const footerLine = Number(/<rect x="84" y="(\d+)" width="912" height="2"/.exec(svg)![1]);
    const body = baselines.filter((y) => y < footerLine);

    expect(Math.max(...body)).toBeLessThan(footerLine);
    expect(svg).not.toContain('…');
  });

  it('keeps the latest months when a series has more bars than rows', () => {
    const svg = buildCarouselSlideSvg(
      slide(0, {
        bars: ['a', 'b', 'c', 'd', 'e', 'f'].map((label, index) => ({
          label,
          value: 10 + index,
        })),
      })
    );

    expect(svg.match(/rx="8"/g)!.length).toBe(10);
  });
});
