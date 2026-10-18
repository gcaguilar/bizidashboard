import type { InteractiveComparisonOption } from '@/lib/comparison-hub-builders';

/**
 * Búsqueda difusa para los selectores del comparador. Puntúa nombre e id, de
 * modo que escribir "espana" o "plaza aragon" encuentre la estación aunque el
 * usuario no recuerde el nombre exacto o su acentuación.
 */

export function normalizeText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function isSubsequence(query: string, target: string): boolean {
  if (!query) {
    return true;
  }

  let queryIndex = 0;

  for (const char of target) {
    if (char === query[queryIndex]) {
      queryIndex += 1;
      if (queryIndex === query.length) {
        return true;
      }
    }
  }

  return false;
}

function levenshteinDistance(a: string, b: string): number {
  if (a === b) {
    return 0;
  }
  if (!a) {
    return b.length;
  }
  if (!b) {
    return a.length;
  }

  const previousRow = Array.from({ length: b.length + 1 }, (_, index) => index);
  const currentRow = Array.from({ length: b.length + 1 }, () => 0);

  for (let i = 1; i <= a.length; i += 1) {
    currentRow[0] = i;

    for (let j = 1; j <= b.length; j += 1) {
      const substitutionCost = a[i - 1] === b[j - 1] ? 0 : 1;
      currentRow[j] = Math.min(
        currentRow[j - 1] + 1,
        previousRow[j] + 1,
        previousRow[j - 1] + substitutionCost
      );
    }

    for (let j = 0; j < currentRow.length; j += 1) {
      previousRow[j] = currentRow[j];
    }
  }

  return previousRow[b.length] ?? Math.max(a.length, b.length);
}

function scoreCandidate(query: string, target: string): number {
  if (!target) {
    return Number.NEGATIVE_INFINITY;
  }
  if (target === query) {
    return 500;
  }
  if (target.startsWith(query)) {
    return 360 - (target.length - query.length) * 0.2;
  }

  const includeIndex = target.indexOf(query);
  if (includeIndex >= 0) {
    return 290 - includeIndex * 0.5;
  }
  if (isSubsequence(query, target)) {
    return 220 - (target.length - query.length) * 0.35;
  }

  return 160 - levenshteinDistance(query, target) * 8;
}

export const STATION_POPULAR_HINTS = [
  'Plaza España',
  'Plaza Aragón',
  'Paraninfo',
  'Gran Vía',
  'Puerta del Carmen',
  'Delicias',
  'Actur',
  'Almozara',
  'Valdespartera',
  'San José',
];

export const DISTRICT_POPULAR_HINTS = [
  'Centro',
  'Delicias',
  'Actur',
  'Universidad',
  'Romareda',
  'Casco Antiguo',
  'La Almozara',
  'San José',
  'Las Fuentes',
  'Valdespartera',
];

/** Ordena opciones por relevancia; sin consulta encadena favoritas → populares → resto. */
export function rankComparisonOptions(params: {
  options: InteractiveComparisonOption[];
  query: string;
  favoriteIds?: readonly string[];
  popularHints?: readonly string[];
  limit?: number;
}): InteractiveComparisonOption[] {
  const { options, query, favoriteIds = [], popularHints = [], limit = 40 } = params;
  const favorites = new Set(favoriteIds);
  const normalizedQuery = normalizeText(query);

  if (!normalizedQuery) {
    const chosen = new Map<string, InteractiveComparisonOption>();
    const push = (option: InteractiveComparisonOption) => {
      if (!chosen.has(option.id)) {
        chosen.set(option.id, option);
      }
    };

    for (const option of options) {
      if (favorites.has(option.id)) {
        push(option);
      }
    }

    for (const hint of popularHints) {
      const normalizedHint = normalizeText(hint);
      for (const option of options) {
        if (chosen.has(option.id)) {
          continue;
        }
        if (normalizeText(option.label).includes(normalizedHint)) {
          push(option);
        }
      }
    }

    for (const option of [...options].sort((a, b) => a.label.localeCompare(b.label, 'es'))) {
      push(option);
    }

    return [...chosen.values()].slice(0, limit);
  }

  return options
    .map((option) => {
      const nameScore = scoreCandidate(normalizedQuery, normalizeText(option.label));
      const idScore = scoreCandidate(normalizedQuery, normalizeText(option.id));
      return {
        option,
        score: Math.max(nameScore, idScore) + (favorites.has(option.id) ? 12 : 0),
      };
    })
    .filter((entry) => entry.score > 150)
    .sort((left, right) => right.score - left.score)
    .slice(0, limit)
    .map((entry) => entry.option);
}
