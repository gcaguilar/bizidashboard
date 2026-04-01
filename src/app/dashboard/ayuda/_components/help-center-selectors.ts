import { CATEGORY_PRIORITY, FAQ_ITEMS, FAQ_PRIORITY_IDS } from './help-center-content';
import type { FaqItem } from './help-center-content';

const CATEGORY_PRIORITY_MAP = new Map<string, number>(
  CATEGORY_PRIORITY.map((category, index) => [category, index])
);

const FAQ_PRIORITY_MAP = new Map<string, number>(
  FAQ_PRIORITY_IDS.map((faqId, index) => [faqId, index])
);

const FAQ_INDEX_MAP = new Map<string, number>(
  FAQ_ITEMS.map((item, index) => [item.id, index])
);

export function normalizeText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

export function compareCategories(a: string, b: string): number {
  const rankA = CATEGORY_PRIORITY_MAP.get(a) ?? Number.MAX_SAFE_INTEGER;
  const rankB = CATEGORY_PRIORITY_MAP.get(b) ?? Number.MAX_SAFE_INTEGER;

  if (rankA !== rankB) {
    return rankA - rankB;
  }

  return a.localeCompare(b, 'es-ES');
}

export function compareFaqItems(a: FaqItem, b: FaqItem): number {
  const rankA = FAQ_PRIORITY_MAP.get(a.id) ?? Number.MAX_SAFE_INTEGER;
  const rankB = FAQ_PRIORITY_MAP.get(b.id) ?? Number.MAX_SAFE_INTEGER;

  if (rankA !== rankB) {
    return rankA - rankB;
  }

  const originalA = FAQ_INDEX_MAP.get(a.id) ?? Number.MAX_SAFE_INTEGER;
  const originalB = FAQ_INDEX_MAP.get(b.id) ?? Number.MAX_SAFE_INTEGER;

  return originalA - originalB;
}

export function formatDateTime(value: string | null | undefined): string {
  if (!value) {
    return 'Sin datos';
  }

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return 'Sin datos';
  }

  return parsed.toLocaleString('es-ES');
}

export function getHelpCenterCategories(): string[] {
  const uniqueCategories = new Set(FAQ_ITEMS.map((item) => item.category));
  return Array.from(uniqueCategories.values()).sort(compareCategories);
}

export function filterHelpCenterFaqItems(params: {
  query: string;
  activeCategory: string | null;
}): FaqItem[] {
  const normalizedQuery = normalizeText(params.query);

  return FAQ_ITEMS.filter((item) => {
    if (params.activeCategory && item.category !== params.activeCategory) {
      return false;
    }

    if (!normalizedQuery) {
      return true;
    }

    const searchable = normalizeText(`${item.category} ${item.question} ${item.answer}`);
    return searchable.includes(normalizedQuery);
  });
}

export function groupHelpCenterFaqItems(items: FaqItem[]): Array<[string, FaqItem[]]> {
  const sortedItems = [...items].sort((a, b) => {
    const categoryDiff = compareCategories(a.category, b.category);

    if (categoryDiff !== 0) {
      return categoryDiff;
    }

    return compareFaqItems(a, b);
  });

  const map = new Map<string, FaqItem[]>();

  for (const item of sortedItems) {
    const rows = map.get(item.category) ?? [];
    rows.push(item);
    map.set(item.category, rows);
  }

  return Array.from(map.entries());
}

export function getHelpCenterCategoryCounts(): Map<string, number> {
  const counts = new Map<string, number>();

  for (const item of FAQ_ITEMS) {
    counts.set(item.category, (counts.get(item.category) ?? 0) + 1);
  }

  return counts;
}

export function getHelpCenterCategoryMatchesBySearch(params: {
  categories: string[];
  query: string;
}): Map<string, number> {
  const normalizedQuery = normalizeText(params.query);
  const counts = new Map<string, number>();

  for (const category of params.categories) {
    counts.set(category, 0);
  }

  for (const item of FAQ_ITEMS) {
    if (!normalizedQuery) {
      counts.set(item.category, (counts.get(item.category) ?? 0) + 1);
      continue;
    }

    const searchable = normalizeText(`${item.category} ${item.question} ${item.answer}`);

    if (searchable.includes(normalizedQuery)) {
      counts.set(item.category, (counts.get(item.category) ?? 0) + 1);
    }
  }

  return counts;
}

export function buildHelpCenterFaqStructuredData() {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQ_ITEMS.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  };
}
