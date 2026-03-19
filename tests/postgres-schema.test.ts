import { describe, expect, it } from 'vitest'
import { normalizeDatabaseSchemaName, quotePgIdentifier } from '@/lib/postgres-schema'

describe('postgres schema helpers', () => {
  it('normalizes valid schema names', () => {
    expect(normalizeDatabaseSchemaName(' Zaragoza ')).toBe('zaragoza')
    expect(normalizeDatabaseSchemaName('madrid_analytics')).toBe('madrid_analytics')
  })

  it('rejects invalid schema names', () => {
    expect(() => normalizeDatabaseSchemaName('barcelona-sp')).toThrow(/Invalid CITY value/)
    expect(() => normalizeDatabaseSchemaName('bad schema')).toThrow(/Invalid CITY value/)
    expect(() => normalizeDatabaseSchemaName('"oops"')).toThrow(/Invalid CITY value/)
  })

  it('quotes valid identifiers safely', () => {
    expect(quotePgIdentifier('zaragoza')).toBe('"zaragoza"')
  })
})
