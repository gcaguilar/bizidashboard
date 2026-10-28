import { describe, expect, it } from 'vitest';

import { fitTextSize, measureTextWidth, wrapText, type TextStyle } from '@/lib/social/layout';

const VALUE: TextStyle = { size: 40, weight: 700 };
const HEADLINE: TextStyle = { size: 92, weight: 900 };
const WIDTH = 912;

describe('social text layout', () => {
  it('measures with the real font, not a fixed average', () => {
    const narrow = measureTextWidth('iiiiiiiiii', VALUE);
    const wide = measureTextWidth('WWWWWWWWWW', VALUE);

    expect(narrow).toBeGreaterThan(0);
    expect(wide).toBeGreaterThan(narrow * 2);
  });

  it('keeps short text on one line', () => {
    expect(wrapText('Fiestas del Pilar', VALUE, WIDTH)).toEqual(['Fiestas del Pilar']);
  });

  it('never drops or truncates text, however long', () => {
    const text =
      'Desde Plaza de los Sitios: Paseo de la Independencia - Plaza de Aragón, a unos 280 m (8 bicis)';
    const lines = wrapText(text, VALUE, WIDTH);

    expect(lines.length).toBeGreaterThan(1);
    expect(lines.join(' ')).toBe(text);
    expect(lines.join('')).not.toContain('…');
    for (const line of lines) {
      expect(measureTextWidth(line, VALUE)).toBeLessThanOrEqual(WIDTH);
    }
  });

  it('balances lines so the last one is not a lone word', () => {
    const text = 'Casco Histórico es el distrito con más uso';
    const lines = wrapText(text, HEADLINE, WIDTH);
    const unbalanced = wrapText(text, HEADLINE, WIDTH, { balance: false });

    expect(lines.length).toBe(unbalanced.length);
    expect(lines.join(' ')).toBe(text);
    // Sin equilibrar, la ultima linea es la que sobra; equilibrada, nunca es una palabra suelta.
    expect(lines[lines.length - 1]!.split(' ').length).toBeGreaterThan(1);
  });

  it('keeps a "·" list on one line when it fits and one item per line when it does not', () => {
    expect(wrapText('Plaza España · Independencia', VALUE, WIDTH)).toEqual([
      'Plaza España · Independencia',
    ]);

    const lines = wrapText(
      'Plaza de los Sitios · Avenida de Navarra - Hospital Miguel Servet · Gran Vía - Fernando el Católico',
      VALUE,
      WIDTH
    );
    expect(lines).toEqual([
      'Plaza de los Sitios',
      'Avenida de Navarra - Hospital Miguel Servet',
      'Gran Vía - Fernando el Católico',
    ]);
    expect(lines.some((line) => line.includes('·'))).toBe(false);
  });

  it('splits a word wider than the line instead of overflowing', () => {
    const word = 'Infraestructuras'.repeat(6);
    const lines = wrapText(word, VALUE, WIDTH);

    expect(lines.length).toBeGreaterThan(1);
    expect(lines.join('')).toBe(word);
    for (const line of lines) {
      expect(measureTextWidth(line, VALUE)).toBeLessThanOrEqual(WIDTH);
    }
  });

  it('returns no lines for empty text', () => {
    expect(wrapText('   ', VALUE, WIDTH)).toEqual([]);
  });

  it('shrinks a single line to fit, but not below the minimum', () => {
    const kicker: TextStyle = { size: 30, weight: 700, letterSpacing: 3 };
    const text = 'SEMANA DEL 28 DE DICIEMBRE DE 2026 AL 3 DE ENERO DE 2027';
    const size = fitTextSize(text, kicker, 800, 20);

    expect(size).toBeLessThan(30);
    expect(size).toBeGreaterThanOrEqual(20);
    expect(measureTextWidth(text, { ...kicker, size })).toBeLessThanOrEqual(800);
    expect(fitTextSize('CORTO', kicker, 800, 20)).toBe(30);
    expect(fitTextSize(text.repeat(5), kicker, 800, 20)).toBe(20);
  });
});
