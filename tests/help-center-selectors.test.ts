import { describe, expect, it } from 'vitest';
import {
  buildHelpCenterFaqStructuredData,
  filterHelpCenterFaqItems,
  formatDateTime,
  getHelpCenterCategories,
  getHelpCenterCategoryCounts,
  getHelpCenterCategoryMatchesBySearch,
  groupHelpCenterFaqItems,
  normalizeText,
} from '@/app/dashboard/ayuda/_components/help-center-selectors';

describe('help center selectors', () => {
  it('normalizes text for search comparisons', () => {
    expect(normalizeText('  Prediccion Ágil  ')).toBe('prediccion agil');
  });

  it('filters and groups faq items by category and query', () => {
    const filteredItems = filterHelpCenterFaqItems({
      query: 'alerta',
      activeCategory: 'Alertas',
    });
    const groupedItems = groupHelpCenterFaqItems(filteredItems);

    expect(filteredItems.length).toBeGreaterThan(0);
    expect(filteredItems.every((item) => item.category === 'Alertas')).toBe(true);
    expect(groupedItems[0]?.[0]).toBe('Alertas');
  });

  it('builds category summaries from the static faq dataset', () => {
    const categories = getHelpCenterCategories();
    const counts = getHelpCenterCategoryCounts();
    const matches = getHelpCenterCategoryMatchesBySearch({
      categories,
      query: 'movilidad',
    });

    expect(categories[0]).toBe('Alertas');
    expect(counts.get('Movilidad')).toBeGreaterThan(0);
    expect(matches.get('Movilidad')).toBeGreaterThan(0);
  });

  it('formats metadata dates and faq schema safely', () => {
    const schema = buildHelpCenterFaqStructuredData();

    expect(formatDateTime('2026-04-01T14:35:00.000Z')).toContain('2026');
    expect(formatDateTime('not-a-date')).toBe('Sin datos');
    expect(schema['@type']).toBe('FAQPage');
    expect(schema.mainEntity.length).toBeGreaterThan(0);
  });
});
