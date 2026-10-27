/**
 * Render de stories y carruseles: SVG -> Resvg -> JPEG.
 *
 * No usa canvas, sharp ni navegador. Las fuentes Inter viajan con el repo y
 * `loadSystemFonts` queda desactivado para que el resultado sea identico en
 * local y en el contenedor. Todo texto dinamico pasa por `escapeSvgText`.
 */

import { join } from 'node:path';
import { Resvg } from '@resvg/resvg-js';
import * as jpeg from 'jpeg-js';
import { formatInteger } from '@/lib/format';
import { escapeSvgText } from '@/lib/og-cards';
import type {
  SocialBar,
  SocialCarousel,
  SocialCarouselSlide,
  SocialStory,
} from '@/lib/social/types';

export const SOCIAL_STORY_WIDTH = 1080;
export const SOCIAL_STORY_HEIGHT = 1920;
export const SOCIAL_CAROUSEL_WIDTH = 1080;
export const SOCIAL_CAROUSEL_HEIGHT = 1350;
export const SOCIAL_JPEG_QUALITY = 90;

const DARK_BG = '#0f172a';
const DARK_TEXT = '#f8fafc';
const DARK_MUTED = '#94a3b8';
const DARK_TRACK = '#334155';
const LIGHT_BG = '#f8fafc';
const LIGHT_TEXT = '#0f172a';
const LIGHT_MUTED = '#64748b';
const LIGHT_TRACK = '#e2e8f0';
const DEFAULT_ACCENT = '#0f766e';
const FONT_FAMILY = "Inter, 'Helvetica Neue', Arial, sans-serif";

const HEX_COLOR = /^#[0-9a-f]{6}$/i;

/** Acento seguro: cualquier valor que no sea `#rrggbb` cae al color por defecto. */
export function safeSocialAccent(value: string | undefined): string {
  return typeof value === 'string' && HEX_COLOR.test(value) ? value : DEFAULT_ACCENT;
}

function normalizeText(value: string): string {
  return value.trim().replace(/\s+/gu, ' ');
}

function truncateText(value: string, maxLength: number): string {
  const normalized = normalizeText(value);
  const safeMax = Math.max(1, Math.trunc(maxLength));
  if (normalized.length <= safeMax) {
    return normalized;
  }
  return `${normalized.slice(0, Math.max(0, safeMax - 1)).trimEnd()}…`;
}

/**
 * Ajuste de linea determinista por numero de caracteres. No mide pixeles: usa
 * un ancho medio conservador para que Inter no desborde en ningun caso.
 */
export function wrapSvgText(text: string, maxChars: number, maxLines: number): string[] {
  const normalized = normalizeText(text);
  if (!normalized) {
    return [];
  }

  const safeChars = Math.max(2, Math.trunc(maxChars));
  const safeLines = Math.max(1, Math.trunc(maxLines));
  const words = normalized.split(' ');
  const lines: string[] = [];
  let current = '';

  for (const word of words) {
    if (!current) {
      current = word;
    } else if (`${current} ${word}`.length <= safeChars) {
      current = `${current} ${word}`;
    } else {
      lines.push(current);
      current = word;
    }

    while (current.length > safeChars) {
      lines.push(current.slice(0, safeChars));
      current = current.slice(safeChars);
    }
  }

  if (current) {
    lines.push(current);
  }

  if (lines.length <= safeLines) {
    return lines;
  }

  const kept = lines.slice(0, safeLines);
  const lastIndex = safeLines - 1;
  kept[lastIndex] = `${kept[lastIndex]!.slice(0, Math.max(0, safeChars - 1)).trimEnd()}…`;
  return kept;
}

function maxCharsFor(fontSize: number, width: number): number {
  return Math.max(8, Math.floor(width / (fontSize * 0.56)));
}

function textElement(
  content: string,
  options: {
    x: number;
    y: number;
    size: number;
    weight?: number;
    fill: string;
    anchor?: 'start' | 'middle' | 'end';
    letterSpacing?: number;
  }
): string {
  const anchor = options.anchor ? ` text-anchor="${options.anchor}"` : '';
  const spacing =
    options.letterSpacing !== undefined ? ` letter-spacing="${options.letterSpacing}"` : '';
  return `<text x="${options.x}" y="${options.y}" font-size="${options.size}" font-weight="${options.weight ?? 400}"${anchor}${spacing} fill="${options.fill}">${escapeSvgText(content)}</text>`;
}

function normalizeBars(bars: readonly SocialBar[] | undefined, limit: number): SocialBar[] {
  return (bars ?? [])
    .map((bar) => ({
      label: truncateText(bar.label, 26),
      value: Number.isFinite(bar.value) ? bar.value : 0,
    }))
    .filter((bar) => bar.label.length > 0 && bar.value > 0)
    .slice(0, limit);
}

function barMax(bars: readonly SocialBar[]): number {
  return bars.reduce((max, bar) => Math.max(max, bar.value), 0);
}

let cachedFontFiles: string[] | null = null;

function getFontFiles(): string[] {
  if (!cachedFontFiles) {
    const dir = process.env.OG_FONTS_DIR ?? join(process.cwd(), 'assets', 'og-fonts');
    cachedFontFiles = ['Inter-Regular.ttf', 'Inter-Bold.ttf', 'Inter-Black.ttf'].map((file) =>
      join(dir, file)
    );
  }
  return cachedFontFiles;
}

function renderSvgToJpeg(svg: string, width: number): Uint8Array {
  const resvg = new Resvg(svg, {
    fitTo: { mode: 'width', value: width },
    font: {
      fontFiles: getFontFiles(),
      loadSystemFonts: false,
      defaultFontFamily: 'Inter',
    },
  });
  const rendered = resvg.render();
  const encoded = jpeg.encode(
    {
      width: rendered.width,
      height: rendered.height,
      data: rendered.pixels,
    },
    SOCIAL_JPEG_QUALITY
  );

  return new Uint8Array(encoded.data);
}

/* -------------------------------------------------------------------------- */
/* Story 1080x1920                                                            */
/* -------------------------------------------------------------------------- */

/**
 * SVG de la story. Se exporta para poder comprobar el escapado de texto en
 * tests sin pasar por el codificador JPEG.
 */
export function buildStorySvg(story: SocialStory): string {
  const accent = safeSocialAccent(story.accent);
  const kicker = truncateText(story.kicker ?? 'DatosBizi', 58).toUpperCase();
  const headlineLines = wrapSvgText(story.headline, maxCharsFor(92, 900), 3);
  const facts = story.facts.slice(0, 4);
  const bars = normalizeBars(story.bars, 4);
  const parts: string[] = [];

  const headlineBottom = 320 + Math.max(0, headlineLines.length - 1) * 112;
  const dividerY = headlineBottom + 60;
  let cursor = dividerY + 90;

  parts.push(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${SOCIAL_STORY_WIDTH}" height="${SOCIAL_STORY_HEIGHT}" viewBox="0 0 ${SOCIAL_STORY_WIDTH} ${SOCIAL_STORY_HEIGHT}" role="img" font-family="${FONT_FAMILY}">`,
    `<rect width="${SOCIAL_STORY_WIDTH}" height="${SOCIAL_STORY_HEIGHT}" fill="${DARK_BG}"/>`,
    `<rect width="${SOCIAL_STORY_WIDTH}" height="16" fill="${accent}"/>`,
    textElement(kicker, {
      x: 84,
      y: 178,
      size: 30,
      weight: 700,
      fill: accent,
      letterSpacing: 3,
    })
  );

  headlineLines.forEach((line, index) => {
    parts.push(
      textElement(line, {
        x: 84,
        y: 320 + index * 112,
        size: 92,
        weight: 900,
        fill: DARK_TEXT,
      })
    );
  });

  parts.push(`<rect x="84" y="${dividerY}" width="148" height="8" fill="${accent}"/>`);

  for (const fact of facts) {
    parts.push(
      textElement(truncateText(fact.label, 48).toUpperCase(), {
        x: 84,
        y: cursor,
        size: 24,
        weight: 700,
        fill: DARK_MUTED,
        letterSpacing: 2,
      })
    );
    cursor += 48;

    const valueLines = wrapSvgText(fact.value, maxCharsFor(40, 880), 2);
    for (const line of valueLines) {
      parts.push(
        textElement(line, {
          x: 84,
          y: cursor,
          size: 40,
          weight: 700,
          fill: DARK_TEXT,
        })
      );
      cursor += 50;
    }
    cursor += 38;
  }

  const barsHeight = bars.length > 0 ? 46 + bars.length * 58 : 0;
  if (bars.length > 0 && cursor + barsHeight < 1680) {
    parts.push(
      textElement(truncateText(story.barsLabel ?? 'Movimiento estimado', 44).toUpperCase(), {
        x: 84,
        y: cursor + 22,
        size: 22,
        weight: 700,
        fill: DARK_MUTED,
        letterSpacing: 2,
      })
    );
    cursor += 58;

    const max = barMax(bars);
    for (const bar of bars) {
      const trackWidth = 468;
      const fillWidth = max > 0 ? Math.max(4, Math.round((bar.value / max) * trackWidth)) : 0;
      parts.push(
        textElement(bar.label, {
          x: 84,
          y: cursor + 18,
          size: 24,
          weight: 600,
          fill: DARK_TEXT,
        }),
        `<rect x="452" y="${cursor + 3}" width="${trackWidth}" height="18" rx="9" fill="${DARK_TRACK}"/>`,
        `<rect x="452" y="${cursor + 3}" width="${fillWidth}" height="18" rx="9" fill="${accent}"/>`,
        textElement(formatInteger(bar.value), {
          x: 1000,
          y: cursor + 18,
          size: 24,
          weight: 700,
          fill: DARK_TEXT,
          anchor: 'end',
        })
      );
      cursor += 58;
    }
  }

  parts.push(
    `<rect x="84" y="1728" width="912" height="2" fill="${DARK_TRACK}"/>`,
    textElement(truncateText(story.footer, 56), {
      x: 84,
      y: 1802,
      size: 24,
      fill: DARK_MUTED,
    }),
    textElement('datosbizi.com', {
      x: 996,
      y: 1802,
      size: 26,
      weight: 900,
      fill: DARK_TEXT,
      anchor: 'end',
    }),
    '</svg>'
  );

  return parts.join('');
}

/* -------------------------------------------------------------------------- */
/* Carrusel 1080x1350                                                         */
/* -------------------------------------------------------------------------- */

/** SVG de una lamina. `index` es 0-based y se pinta como `index + 1 / total`. */
export function buildCarouselSlideSvg(
  slide: SocialCarouselSlide,
  index = 0,
  total = 5
): string {
  const accent = safeSocialAccent(slide.accent);
  const kicker = truncateText(slide.kicker, 54).toUpperCase();
  const headlineLines = wrapSvgText(slide.headline, maxCharsFor(78, 900), 3);
  const facts = slide.facts.slice(0, 4);
  const bars = normalizeBars(slide.bars, 5);
  const parts: string[] = [];

  const headlineBottom = 280 + Math.max(0, headlineLines.length - 1) * 94;
  const dividerY = headlineBottom + 58;
  let cursor = dividerY + 78;

  parts.push(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${SOCIAL_CAROUSEL_WIDTH}" height="${SOCIAL_CAROUSEL_HEIGHT}" viewBox="0 0 ${SOCIAL_CAROUSEL_WIDTH} ${SOCIAL_CAROUSEL_HEIGHT}" role="img" font-family="${FONT_FAMILY}">`,
    `<rect width="${SOCIAL_CAROUSEL_WIDTH}" height="${SOCIAL_CAROUSEL_HEIGHT}" fill="${LIGHT_BG}"/>`,
    `<rect width="${SOCIAL_CAROUSEL_WIDTH}" height="14" fill="${accent}"/>`,
    textElement(kicker, {
      x: 84,
      y: 170,
      size: 28,
      weight: 700,
      fill: accent,
      letterSpacing: 3,
    }),
    textElement(`${index + 1}/${total}`, {
      x: 996,
      y: 170,
      size: 26,
      weight: 700,
      fill: LIGHT_MUTED,
      anchor: 'end',
    })
  );

  headlineLines.forEach((line, lineIndex) => {
    parts.push(
      textElement(line, {
        x: 84,
        y: 280 + lineIndex * 94,
        size: 78,
        weight: 900,
        fill: LIGHT_TEXT,
      })
    );
  });

  parts.push(`<rect x="84" y="${dividerY}" width="148" height="8" fill="${accent}"/>`);

  for (const fact of facts) {
    parts.push(
      textElement(truncateText(fact.label, 50).toUpperCase(), {
        x: 84,
        y: cursor,
        size: 22,
        weight: 700,
        fill: LIGHT_MUTED,
        letterSpacing: 2,
      })
    );
    cursor += 40;

    const valueLines = wrapSvgText(fact.value, maxCharsFor(36, 880), 2);
    for (const line of valueLines) {
      parts.push(
        textElement(line, {
          x: 84,
          y: cursor,
          size: 36,
          weight: 700,
          fill: LIGHT_TEXT,
        })
      );
      cursor += 44;
    }
    cursor += 30;
  }

  const barsHeight = bars.length > 0 ? 42 + bars.length * 46 : 0;
  if (bars.length > 0 && cursor + barsHeight < 1170) {
    parts.push(
      textElement(truncateText(slide.barsLabel ?? 'Movimiento estimado', 44).toUpperCase(), {
        x: 84,
        y: cursor + 20,
        size: 20,
        weight: 700,
        fill: LIGHT_MUTED,
        letterSpacing: 2,
      })
    );
    cursor += 50;

    const max = barMax(bars);
    for (const bar of bars) {
      const trackWidth = 468;
      const fillWidth = max > 0 ? Math.max(4, Math.round((bar.value / max) * trackWidth)) : 0;
      parts.push(
        textElement(bar.label, {
          x: 84,
          y: cursor + 16,
          size: 22,
          weight: 600,
          fill: LIGHT_TEXT,
        }),
        `<rect x="452" y="${cursor + 2}" width="${trackWidth}" height="16" rx="8" fill="${LIGHT_TRACK}"/>`,
        `<rect x="452" y="${cursor + 2}" width="${fillWidth}" height="16" rx="8" fill="${accent}"/>`,
        textElement(formatInteger(bar.value), {
          x: 1000,
          y: cursor + 16,
          size: 22,
          weight: 700,
          fill: LIGHT_TEXT,
          anchor: 'end',
        })
      );
      cursor += 46;
    }
  }

  parts.push(
    `<rect x="84" y="1218" width="912" height="2" fill="${LIGHT_TRACK}"/>`,
    textElement(truncateText(slide.footer, 56), {
      x: 84,
      y: 1288,
      size: 22,
      fill: LIGHT_MUTED,
    }),
    textElement('datosbizi.com', {
      x: 996,
      y: 1288,
      size: 24,
      weight: 900,
      fill: LIGHT_TEXT,
      anchor: 'end',
    }),
    '</svg>'
  );

  return parts.join('');
}

/* -------------------------------------------------------------------------- */
/* API publica                                                                */
/* -------------------------------------------------------------------------- */

/** Renderiza una story vertical de 1080x1920 y la devuelve codificada en JPEG. */
export function renderStory(story: SocialStory): Uint8Array {
  return renderSvgToJpeg(
    buildStorySvg(story),
    SOCIAL_STORY_WIDTH
  );
}

/** Renderiza todas las laminas del carrusel a 1080x1350, en orden. */
export function renderCarousel(carousel: SocialCarousel): Uint8Array[] {
  const total = carousel.slides.length;
  return carousel.slides.map((slide, index) =>
    renderSvgToJpeg(
      buildCarouselSlideSvg(slide, index, total),
      SOCIAL_CAROUSEL_WIDTH
    )
  );
}

/**
 * Render generico para el runner: una story produce un JPEG vertical y un
 * carrusel su lista de laminas. No altera los dos helpers anteriores.
 */
export function renderSocialContent(
  content: SocialStory | SocialCarousel
): Uint8Array[] {
  return 'slides' in content ? renderCarousel(content) : [renderStory(content)];
}
