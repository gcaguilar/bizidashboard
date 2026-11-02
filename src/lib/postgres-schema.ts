import { DEFAULT_CITY } from './constants'

const PG_IDENTIFIER_PATTERN = /^[a-z][a-z0-9_]*$/
const PG_IDENTIFIER_MAX_BYTES = 63

export function normalizeDatabaseSchemaName(rawValue?: string): string {
  const schema = (rawValue || DEFAULT_CITY).trim().toLowerCase()

  if (!PG_IDENTIFIER_PATTERN.test(schema)) {
    throw new Error(
      `Invalid CITY value "${rawValue}". Expected a lowercase PostgreSQL identifier matching ${PG_IDENTIFIER_PATTERN.source}.`
    )
  }

  if (Buffer.byteLength(schema, 'utf8') > PG_IDENTIFIER_MAX_BYTES) {
    throw new Error(
      `Invalid CITY value "${rawValue}". PostgreSQL identifiers are limited to ${PG_IDENTIFIER_MAX_BYTES} bytes.`
    )
  }

  return schema
}

export function quotePgIdentifier(identifier: string): string {
  const normalized = normalizeDatabaseSchemaName(identifier)
  return `"${normalized}"`
}

export function stripPrismaSchemaParam(databaseUrl: string): string {
  const url = new URL(databaseUrl)
  url.searchParams.delete('schema')
  return url.toString()
}

export function buildPgSearchPathOption(schema: string): string {
  const normalized = normalizeDatabaseSchemaName(schema)
  return `-c search_path=${normalized},public`
}
