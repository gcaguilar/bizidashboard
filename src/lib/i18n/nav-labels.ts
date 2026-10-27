import type { Locale } from '@/lib/i18n/locales';
import { MESSAGE_CATALOGS, translate, type MessageKey } from '@/lib/i18n/messages';

/**
 * Label of a `PublicNavItem` in `locale`. Items without a dictionary entry keep
 * the Spanish `label` they were declared with.
 */
export function translateNavLabel(locale: Locale, item: { id: string; label: string }): string {
  const key = `nav.item.${item.id}`;
  return key in MESSAGE_CATALOGS.es ? translate(locale, key as MessageKey) : item.label;
}
