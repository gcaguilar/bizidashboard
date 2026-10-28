/**
 * Render de stories y carruseles: SVG -> Resvg -> JPEG.
 *
 * No usa canvas, sharp ni navegador. Las fuentes Inter viajan con el repo y
 * `loadSystemFonts` queda desactivado para que el resultado sea identico en
 * local y en el contenedor. Todo texto dinamico pasa por `escapeSvgText`.
 *
 * El texto nunca se trunca: `layout.ts` lo mide con las mismas fuentes, lo
 * reparte en las lineas necesarias y, si no cabe en vertical, reduce el cuerpo
 * por pasos antes de dejarlo mas apretado.
 */

import { Resvg } from '@resvg/resvg-js';
import * as jpeg from 'jpeg-js';
import { formatInteger } from '@/lib/format';
import {
  fitTextSize,
  getSocialFontFiles,
  measureTextWidth,
  wrapText,
  type TextStyle,
} from '@/lib/social/layout';
import { escapeSvgText } from '@/lib/og-cards';
import type {
  SocialBar,
  SocialCarousel,
  SocialCarouselSlide,
  SocialStory,
  SocialStoryFact,
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

const MARGIN_X = 84;
const TEXT_RIGHT = 996;
const CONTENT_WIDTH = TEXT_RIGHT - MARGIN_X;
/** Pasos de reduccion del cuerpo de los hechos cuando no caben en vertical. */
const FACT_SCALES = [1, 0.92, 0.85, 0.78, 0.7] as const;

const HEX_COLOR = /^#[0-9a-f]{6}$/i;

/** Acento seguro: cualquier valor que no sea `#rrggbb` cae al color por defecto. */
export function safeSocialAccent(value: string | undefined): string {
  return typeof value === 'string' && HEX_COLOR.test(value) ? value : DEFAULT_ACCENT;
}

function normalizeText(value: string): string {
  return value.trim().replace(/\s+/gu, ' ');
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
      label: normalizeText(bar.label),
      value: Number.isFinite(bar.value) ? bar.value : 0,
    }))
    .filter((bar) => bar.label.length > 0 && bar.value > 0)
    .slice(0, limit);
}

function barMax(bars: readonly SocialBar[]): number {
  return bars.reduce((max, bar) => Math.max(max, bar.value), 0);
}

function renderSvgToJpeg(svg: string, width: number): Uint8Array {
  const resvg = new Resvg(svg, {
    fitTo: { mode: 'width', value: width },
    font: {
      fontFiles: getSocialFontFiles(),
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
/* Tarjeta generica                                                           */
/* -------------------------------------------------------------------------- */

type CardContent = {
  kicker: string;
  headline: string;
  facts: readonly SocialStoryFact[];
  footer: string;
  accent: string;
  bars?: readonly SocialBar[];
  barsLabel?: string;
  /** Contador de la esquina ("1/5"); solo los carruseles. */
  counter?: string;
};

type CardSpec = {
  width: number;
  height: number;
  background: string;
  text: string;
  muted: string;
  track: string;
  topBar: number;
  kicker: { y: number; size: number; minSize: number };
  headline: { y: number; sizes: readonly number[]; maxLines: number; lineRatio: number };
  dividerGap: number;
  factsGap: number;
  maxFacts: number;
  label: { size: number; toValue: number };
  value: { size: number; step: number; after: number };
  /** Ultima linea base permitida para los hechos antes de reducir el cuerpo. */
  factsLimit: number;
  bars: {
    maxRows: number;
    maxBottom: number;
    headerHeight: number;
    labelSize: number;
    labelOffset: number;
    labelAdvance: number;
    rowHeight: number;
    rowTextOffset: number;
    rectOffset: number;
    rectHeight: number;
    fontSize: number;
  };
  footer: { lineY: number; textY: number; size: number; brandSize: number };
};

const STORY_SPEC: CardSpec = {
  width: SOCIAL_STORY_WIDTH,
  height: SOCIAL_STORY_HEIGHT,
  background: DARK_BG,
  text: DARK_TEXT,
  muted: DARK_MUTED,
  track: DARK_TRACK,
  topBar: 16,
  kicker: { y: 178, size: 30, minSize: 22 },
  headline: { y: 320, sizes: [92, 84, 76, 68, 60], maxLines: 3, lineRatio: 112 / 92 },
  dividerGap: 60,
  factsGap: 90,
  maxFacts: 4,
  label: { size: 24, toValue: 48 },
  value: { size: 40, step: 50, after: 38 },
  factsLimit: 1640,
  bars: {
    maxRows: 4,
    maxBottom: 1680,
    headerHeight: 46,
    labelSize: 22,
    labelOffset: 22,
    labelAdvance: 58,
    rowHeight: 58,
    rowTextOffset: 18,
    rectOffset: 3,
    rectHeight: 18,
    fontSize: 24,
  },
  footer: { lineY: 1728, textY: 1802, size: 24, brandSize: 26 },
};

const CAROUSEL_SPEC: CardSpec = {
  width: SOCIAL_CAROUSEL_WIDTH,
  height: SOCIAL_CAROUSEL_HEIGHT,
  background: LIGHT_BG,
  text: LIGHT_TEXT,
  muted: LIGHT_MUTED,
  track: LIGHT_TRACK,
  topBar: 14,
  kicker: { y: 170, size: 28, minSize: 20 },
  headline: { y: 280, sizes: [78, 70, 64, 58, 52], maxLines: 3, lineRatio: 94 / 78 },
  dividerGap: 58,
  factsGap: 78,
  maxFacts: 4,
  label: { size: 22, toValue: 40 },
  value: { size: 36, step: 44, after: 30 },
  factsLimit: 1150,
  bars: {
    maxRows: 5,
    maxBottom: 1170,
    headerHeight: 42,
    labelSize: 20,
    labelOffset: 20,
    labelAdvance: 50,
    rowHeight: 46,
    rowTextOffset: 16,
    rectOffset: 2,
    rectHeight: 16,
    fontSize: 22,
  },
  footer: { lineY: 1218, textY: 1288, size: 22, brandSize: 24 },
};

const BAR_TRACK_X = 452;
const BAR_TRACK_WIDTH = 436;
const BAR_LABEL_WIDTH = BAR_TRACK_X - MARGIN_X - 20;

type FactLayout = { parts: string[]; lastBaseline: number; end: number };

function layoutFacts(
  facts: readonly SocialStoryFact[],
  spec: CardSpec,
  scale: number,
  start: number
): FactLayout {
  const labelSize = Math.round(spec.label.size * scale);
  const valueSize = Math.round(spec.value.size * scale);
  const valueStep = Math.round(spec.value.step * scale);
  const labelStep = Math.round(labelSize * 1.35);
  const labelToValue = Math.round(spec.label.toValue * scale);
  const after = Math.round(spec.value.after * scale);
  const labelStyle: TextStyle = { size: labelSize, weight: 700, letterSpacing: 2 };
  const valueStyle: TextStyle = { size: valueSize, weight: 700 };

  const parts: string[] = [];
  let cursor = start;
  let lastBaseline = start;

  for (const fact of facts) {
    const labelLines = wrapText(fact.label.toUpperCase(), labelStyle, CONTENT_WIDTH);
    labelLines.forEach((line, index) => {
      parts.push(
        textElement(line, {
          x: MARGIN_X,
          y: cursor + index * labelStep,
          size: labelSize,
          weight: 700,
          fill: spec.muted,
          letterSpacing: 2,
        })
      );
    });
    cursor += Math.max(0, labelLines.length - 1) * labelStep + labelToValue;

    for (const line of wrapText(fact.value, valueStyle, CONTENT_WIDTH)) {
      parts.push(
        textElement(line, {
          x: MARGIN_X,
          y: cursor,
          size: valueSize,
          weight: 700,
          fill: spec.text,
        })
      );
      lastBaseline = cursor;
      cursor += valueStep;
    }
    cursor += after;
  }

  return { parts, lastBaseline, end: cursor };
}

function buildCardSvg(content: CardContent, spec: CardSpec): string {
  const accent = safeSocialAccent(content.accent);
  const parts: string[] = [];

  // Kicker: una linea; si no cabe se reduce el cuerpo y, solo entonces, salta.
  const kickerText = normalizeText(content.kicker).toUpperCase();
  const counterWidth = content.counter
    ? measureTextWidth(content.counter, { size: 26, weight: 700 }) + 32
    : 0;
  const kickerMax = CONTENT_WIDTH - counterWidth;
  const kickerStyle: TextStyle = { size: spec.kicker.size, weight: 700, letterSpacing: 3 };
  const kickerSize = fitTextSize(kickerText, kickerStyle, kickerMax, spec.kicker.minSize);
  const kickerLines = wrapText(kickerText, { ...kickerStyle, size: kickerSize }, kickerMax);
  const kickerStep = Math.round(kickerSize * 1.35);

  // Titular: el mayor cuerpo que cabe en `maxLines`; si ninguno, el menor y
  // todas las lineas que haga falta (sin recortar).
  let headlineSize = spec.headline.sizes[spec.headline.sizes.length - 1]!;
  let headlineLines: string[] = [];
  for (const size of spec.headline.sizes) {
    const lines = wrapText(content.headline, { size, weight: 900 }, CONTENT_WIDTH);
    headlineSize = size;
    headlineLines = lines;
    if (lines.length <= spec.headline.maxLines) {
      break;
    }
  }
  const headlineStep = Math.round(headlineSize * spec.headline.lineRatio);

  const headlineBottom =
    spec.headline.y + Math.max(0, headlineLines.length - 1) * headlineStep;
  const dividerY = headlineBottom + spec.dividerGap;
  const factsStart = dividerY + spec.factsGap;
  const facts = content.facts.slice(0, spec.maxFacts);

  let factLayout = layoutFacts(facts, spec, FACT_SCALES[0], factsStart);
  for (const scale of FACT_SCALES) {
    factLayout = layoutFacts(facts, spec, scale, factsStart);
    if (factLayout.lastBaseline <= spec.factsLimit) {
      break;
    }
  }

  parts.push(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${spec.width}" height="${spec.height}" viewBox="0 0 ${spec.width} ${spec.height}" role="img" font-family="${FONT_FAMILY}">`,
    `<rect width="${spec.width}" height="${spec.height}" fill="${spec.background}"/>`,
    `<rect width="${spec.width}" height="${spec.topBar}" fill="${accent}"/>`
  );

  kickerLines.forEach((line, index) => {
    parts.push(
      textElement(line, {
        x: MARGIN_X,
        y: spec.kicker.y + index * kickerStep,
        size: kickerSize,
        weight: 700,
        fill: accent,
        letterSpacing: 3,
      })
    );
  });

  if (content.counter) {
    parts.push(
      textElement(content.counter, {
        x: TEXT_RIGHT,
        y: spec.kicker.y,
        size: 26,
        weight: 700,
        fill: spec.muted,
        anchor: 'end',
      })
    );
  }

  headlineLines.forEach((line, index) => {
    parts.push(
      textElement(line, {
        x: MARGIN_X,
        y: spec.headline.y + index * headlineStep,
        size: headlineSize,
        weight: 900,
        fill: spec.text,
      })
    );
  });

  parts.push(
    `<rect x="${MARGIN_X}" y="${dividerY}" width="148" height="8" fill="${accent}"/>`,
    ...factLayout.parts
  );

  const bars = normalizeBars(content.bars, spec.bars.maxRows);
  const barsHeight =
    bars.length > 0 ? spec.bars.headerHeight + bars.length * spec.bars.rowHeight : 0;
  let cursor = factLayout.end;

  if (bars.length > 0 && cursor + barsHeight < spec.bars.maxBottom) {
    const barsLabel = normalizeText(content.barsLabel ?? 'Uso estimado').toUpperCase();
    const barsLabelStyle: TextStyle = { size: spec.bars.labelSize, weight: 700, letterSpacing: 2 };
    const barsLabelSize = fitTextSize(barsLabel, barsLabelStyle, CONTENT_WIDTH, 14);
    parts.push(
      textElement(barsLabel, {
        x: MARGIN_X,
        y: cursor + spec.bars.labelOffset,
        size: barsLabelSize,
        weight: 700,
        fill: spec.muted,
        letterSpacing: 2,
      })
    );
    cursor += spec.bars.labelAdvance;

    const max = barMax(bars);
    for (const bar of bars) {
      const fillWidth =
        max > 0 ? Math.max(4, Math.round((bar.value / max) * BAR_TRACK_WIDTH)) : 0;
      const rowStyle: TextStyle = { size: spec.bars.fontSize, weight: 600 };
      const rowSize = fitTextSize(bar.label, rowStyle, BAR_LABEL_WIDTH, 14);
      parts.push(
        textElement(bar.label, {
          x: MARGIN_X,
          y: cursor + spec.bars.rowTextOffset,
          size: rowSize,
          weight: 600,
          fill: spec.text,
        }),
        `<rect x="${BAR_TRACK_X}" y="${cursor + spec.bars.rectOffset}" width="${BAR_TRACK_WIDTH}" height="${spec.bars.rectHeight}" rx="${spec.bars.rectHeight / 2}" fill="${spec.track}"/>`,
        `<rect x="${BAR_TRACK_X}" y="${cursor + spec.bars.rectOffset}" width="${fillWidth}" height="${spec.bars.rectHeight}" rx="${spec.bars.rectHeight / 2}" fill="${accent}"/>`,
        textElement(formatInteger(bar.value), {
          x: 1000,
          y: cursor + spec.bars.rowTextOffset,
          size: spec.bars.fontSize,
          weight: 700,
          fill: spec.text,
          anchor: 'end',
        })
      );
      cursor += spec.bars.rowHeight;
    }
  }

  // Pie: el texto de la izquierda cede espacio a la marca de la derecha.
  const footerText = normalizeText(content.footer);
  const brandWidth = measureTextWidth('datosbizi.com', {
    size: spec.footer.brandSize,
    weight: 900,
  });
  const footerMax = CONTENT_WIDTH - brandWidth - 32;
  const footerSize = fitTextSize(
    footerText,
    { size: spec.footer.size, weight: 400 },
    footerMax,
    12
  );

  parts.push(
    `<rect x="${MARGIN_X}" y="${spec.footer.lineY}" width="${CONTENT_WIDTH}" height="2" fill="${spec.track}"/>`,
    textElement(footerText, {
      x: MARGIN_X,
      y: spec.footer.textY,
      size: footerSize,
      fill: spec.muted,
    }),
    textElement('datosbizi.com', {
      x: TEXT_RIGHT,
      y: spec.footer.textY,
      size: spec.footer.brandSize,
      weight: 900,
      fill: spec.text,
      anchor: 'end',
    }),
    '</svg>'
  );

  return parts.join('');
}

/* -------------------------------------------------------------------------- */
/* Story 1080x1920                                                            */
/* -------------------------------------------------------------------------- */

/**
 * SVG de la story. Se exporta para poder comprobar el escapado de texto en
 * tests sin pasar por el codificador JPEG.
 */
export function buildStorySvg(story: SocialStory): string {
  return buildCardSvg(
    {
      kicker: story.kicker ?? 'DatosBizi',
      headline: story.headline,
      facts: story.facts,
      footer: story.footer,
      accent: story.accent ?? DEFAULT_ACCENT,
      bars: story.bars,
      barsLabel: story.barsLabel,
    },
    STORY_SPEC
  );
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
  return buildCardSvg(
    {
      kicker: slide.kicker,
      headline: slide.headline,
      facts: slide.facts,
      footer: slide.footer,
      accent: slide.accent,
      bars: slide.bars,
      barsLabel: slide.barsLabel,
      counter: `${index + 1}/${total}`,
    },
    CAROUSEL_SPEC
  );
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
