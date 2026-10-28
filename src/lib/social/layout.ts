/**
 * Medicion y ajuste de texto para las imagenes sociales.
 *
 * El render no trunca nunca: mide con las mismas fuentes Inter que usa Resvg,
 * reparte el texto en las lineas que haga falta (equilibradas, sin palabras
 * sueltas) y, solo si no cabe en vertical, reduce el cuerpo antes de recortar.
 * Si Resvg no pudiera medir, cae a un ancho medio conservador.
 */

import { join } from 'node:path';
import { Resvg } from '@resvg/resvg-js';
import { escapeSvgText } from '@/lib/og-cards';

export type TextStyle = {
  size: number;
  weight: number;
  letterSpacing?: number;
};

/** Margen sobre el ancho medido: kerning y redondeos del rasterizador. */
const WIDTH_SAFETY = 1.015;
/** Separador que se prefiere para saltar de linea ("A · B · C"). */
const SEPARATOR = ' · ';
const MAX_CACHE_ENTRIES = 5000;

let cachedFontFiles: string[] | null = null;

export function getSocialFontFiles(): string[] {
  if (!cachedFontFiles) {
    const dir = process.env.OG_FONTS_DIR ?? join(process.cwd(), 'assets', 'og-fonts');
    cachedFontFiles = ['Inter-Regular.ttf', 'Inter-Bold.ttf', 'Inter-Black.ttf'].map((file) =>
      join(dir, file)
    );
  }
  return cachedFontFiles;
}

function normalizeText(value: string): string {
  return value.trim().replace(/\s+/gu, ' ');
}

function approximateWidth(text: string, style: TextStyle): number {
  const factor = style.weight >= 900 ? 0.6 : style.weight >= 700 ? 0.57 : 0.55;
  return text.length * (style.size * factor + (style.letterSpacing ?? 0));
}

const widthCache = new Map<string, number>();

/** Ancho de tinta de un texto en una linea, sin margen de seguridad. */
function rawWidth(text: string, style: TextStyle): number {
  if (!text) {
    return 0;
  }

  const key = `${style.size}|${style.weight}|${style.letterSpacing ?? 0}|${text}`;
  const cached = widthCache.get(key);
  if (cached !== undefined) {
    return cached;
  }

  let width: number;
  try {
    const spacing =
      style.letterSpacing !== undefined ? ` letter-spacing="${style.letterSpacing}"` : '';
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="8000" height="400" font-family="Inter"><text x="0" y="200" font-size="${style.size}" font-weight="${style.weight}"${spacing}>${escapeSvgText(text)}</text></svg>`;
    const bbox = new Resvg(svg, {
      font: {
        fontFiles: getSocialFontFiles(),
        loadSystemFonts: false,
        defaultFontFamily: 'Inter',
      },
    }).getBBox();
    width = bbox && Number.isFinite(bbox.width) ? bbox.width : approximateWidth(text, style);
  } catch {
    width = approximateWidth(text, style);
  }

  if (widthCache.size >= MAX_CACHE_ENTRIES) {
    widthCache.clear();
  }
  widthCache.set(key, width);
  return width;
}

/** Avance de un espacio entre palabras (incluye el espaciado entre letras). */
function spaceAdvance(style: TextStyle): number {
  const x = rawWidth('x', style);
  const advance = rawWidth('x x', style) - 2 * x;
  return advance > 0 ? advance : style.size * 0.28 + 2 * (style.letterSpacing ?? 0);
}

function wordsWidth(words: readonly string[], style: TextStyle): number {
  if (words.length === 0) {
    return 0;
  }

  const total =
    words.reduce((sum, word) => sum + rawWidth(word, style), 0) +
    (words.length - 1) * spaceAdvance(style);
  return total * WIDTH_SAFETY;
}

/** Ancho de una linea ya compuesta, con margen de seguridad. */
export function measureTextWidth(text: string, style: TextStyle): number {
  const normalized = normalizeText(text);
  return normalized ? wordsWidth(normalized.split(' '), style) : 0;
}

/** Parte una palabra mas ancha que la linea en trozos que caben. */
function splitLongWord(word: string, style: TextStyle, maxWidth: number): string[] {
  const pieces: string[] = [];
  let rest = word;

  while (rest.length > 0) {
    let end = rest.length;
    while (end > 1 && wordsWidth([rest.slice(0, end)], style) > maxWidth) {
      end -= 1;
    }
    pieces.push(rest.slice(0, end));
    rest = rest.slice(end);
  }

  return pieces;
}

function wrapWords(words: readonly string[], style: TextStyle, maxWidth: number): string[] {
  const lines: string[] = [];
  let current: string[] = [];

  const flush = () => {
    if (current.length > 0) {
      lines.push(current.join(' '));
      current = [];
    }
  };

  for (const word of words) {
    if (wordsWidth([word], style) > maxWidth) {
      flush();
      const pieces = splitLongWord(word, style, maxWidth);
      lines.push(...pieces.slice(0, -1));
      current = [pieces[pieces.length - 1]!];
      continue;
    }

    if (current.length === 0 || wordsWidth([...current, word], style) <= maxWidth) {
      current.push(word);
    } else {
      flush();
      current = [word];
    }
  }

  flush();
  return lines;
}

/** Reparto voraz por palabras de un texto sin separadores. Nunca pierde texto. */
function greedyLines(text: string, style: TextStyle, maxWidth: number): string[] {
  return wrapWords(text.split(' '), style, maxWidth);
}

/**
 * Reparte `text` en lineas de como mucho `maxWidth` px.
 *
 * - Una lista separada por " · " ("A · B · C") va en una sola linea si cabe; si
 *   no, cada elemento en su linea, para que el separador nunca quede a mitad.
 * - Con `balance` (por defecto) busca el ancho mas estrecho que mantiene el
 *   mismo numero de lineas, de modo que no quede una palabra sola en la ultima.
 */
export function wrapText(
  text: string,
  style: TextStyle,
  maxWidth: number,
  options: { balance?: boolean } = {}
): string[] {
  const normalized = normalizeText(text);
  if (!normalized) {
    return [];
  }

  const segments = normalized.split(SEPARATOR).map((segment) => segment.trim()).filter(Boolean);
  if (segments.length > 1) {
    if (measureTextWidth(segments.join(SEPARATOR), style) <= maxWidth) {
      return [segments.join(SEPARATOR)];
    }
    return segments.flatMap((segment) => wrapText(segment, style, maxWidth, options));
  }

  const lines = greedyLines(normalized, style, maxWidth);
  if (lines.length < 2 || options.balance === false) {
    return lines;
  }

  const longestWord = Math.max(
    ...normalized.split(' ').map((word) => wordsWidth([word], style))
  );
  let low = Math.max(longestWord, maxWidth * 0.45);
  let high = maxWidth;
  let best = lines;

  for (let step = 0; step < 9 && high - low > 4; step += 1) {
    const middle = (low + high) / 2;
    const candidate = greedyLines(normalized, style, middle);
    if (candidate.length <= lines.length) {
      best = candidate;
      high = middle;
    } else {
      low = middle;
    }
  }

  return best;
}

/**
 * Mayor tamano (hasta `style.size`, nunca por debajo de `minSize`) con el que el
 * texto cabe en una sola linea de `maxWidth` px.
 */
export function fitTextSize(
  text: string,
  style: TextStyle,
  maxWidth: number,
  minSize: number
): number {
  for (let size = style.size; size > minSize; size -= 1) {
    if (measureTextWidth(text, { ...style, size }) <= maxWidth) {
      return size;
    }
  }
  return minSize;
}
