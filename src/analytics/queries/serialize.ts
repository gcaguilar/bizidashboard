/**
 * Normaliza valores que raw SQL puede devolver como BigInt, Decimal o string a
 * un numero serializable. Compartido por las consultas que agregan con COUNT/SUM.
 */
export function toSerializableNumber(value: unknown): number {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : 0;
  }

  if (typeof value === 'bigint') {
    return Number(value);
  }

  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  if (value && typeof value === 'object' && 'toString' in value) {
    const parsed = Number((value as { toString: () => string }).toString());
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
}
