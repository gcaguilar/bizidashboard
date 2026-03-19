import { describe, expect, it } from 'vitest'
import {
  buildPgSearchPathOption,
  normalizeDatabaseSchemaName,
  quotePgIdentifier,
  stripPrismaSchemaParam,
} from '@/lib/postgres-schema'

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

  it('strips prisma schema query params from connection strings', () => {
    expect(
      stripPrismaSchemaParam(
        'postgresql://user:pass@db:5432/postgres?schema=zaragoza&sslmode=require'
      )
    ).toBe('postgresql://user:pass@db:5432/postgres?sslmode=require')
  })

  it('builds a pg search_path option for pooled connections', () => {
    expect(buildPgSearchPathOption('zaragoza')).toBe('-c search_path=zaragoza,public')
  })
})
