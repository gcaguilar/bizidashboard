import { formatRelativeMinutes } from '@/lib/format';

const DISCONNECTED_AFTER_MINUTES = 10;

export function formatFreshnessLabel(value: string | Date | null | undefined): string {
  if (!value) {
    return 'sin datos';
  }

  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'sin datos';
  }

  const diffMinutes = (Date.now() - date.getTime()) / 60000;

  if (diffMinutes > DISCONNECTED_AFTER_MINUTES) {
    return 'desconectado';
  }

  return formatRelativeMinutes(diffMinutes);
}
