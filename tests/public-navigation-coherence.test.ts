import { describe, expect, it } from 'vitest';
import {
  FOOTER_NAV_GROUPS,
  PUBLIC_FOOTER_ONLY_NAV_ITEMS,
  PUBLIC_MAIN_NAV_ITEMS,
  PUBLIC_MORE_NAV_ITEMS,
  PUBLIC_NAV_ITEMS,
  PUBLIC_SEARCHABLE_PAGE_ITEMS,
  PUBLIC_STATS_NAV_ITEMS,
} from '@/lib/public-navigation';

describe('public navigation coherence', () => {
  it('keeps the header short: at most 3 main groups plus a "Más" menu', () => {
    expect(PUBLIC_MAIN_NAV_ITEMS.length).toBeLessThanOrEqual(3);
    expect(PUBLIC_NAV_ITEMS).toEqual([...PUBLIC_MAIN_NAV_ITEMS, ...PUBLIC_MORE_NAV_ITEMS]);
  });

  it('every header destination is also reachable from the footer', () => {
    const footerHrefs = new Set(FOOTER_NAV_GROUPS.flat().map((item) => item.href));
    for (const item of PUBLIC_NAV_ITEMS) {
      expect(footerHrefs.has(item.href), item.href).toBe(true);
    }
  });

  it('footer-only and stats destinations are searchable', () => {
    const searchable = new Set(PUBLIC_SEARCHABLE_PAGE_ITEMS.map((item) => item.href));
    for (const item of [...PUBLIC_FOOTER_ONLY_NAV_ITEMS, ...PUBLIC_STATS_NAV_ITEMS]) {
      expect(searchable.has(item.href), item.href).toBe(true);
    }
  });

  it('does not repeat an href inside the header', () => {
    const hrefs = PUBLIC_NAV_ITEMS.map((item) => item.href);
    expect(new Set(hrefs).size).toBe(hrefs.length);
  });
});
