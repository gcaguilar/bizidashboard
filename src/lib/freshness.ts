import { formatRelativeMinutes } from '@/lib/format';
import { DEFAULT_LOCALE, type Locale } from '@/lib/i18n/locales';
import { translate } from '@/lib/i18n/messages';

const DISCONNECTED_AFTER_MINUTES = 10;

export function formatFreshnessLabel(
  value: string | Date | null | undefined,
  locale: Locale = DEFAULT_LOCALE,
): string {
  if (!value) {
    return translate(locale, 'format.noData.lower');
  }

  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return translate(locale, 'format.noData.lower');
  }

  const diffMinutes = (Date.now() - date.getTime()) / 60000;

  if (diffMinutes > DISCONNECTED_AFTER_MINUTES) {
    return translate(locale, 'format.freshness.disconnected');
  }

  return formatRelativeMinutes(diffMinutes, locale);
}
