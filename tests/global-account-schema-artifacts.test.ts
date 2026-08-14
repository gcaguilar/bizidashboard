import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const repositoryRoot = resolve(import.meta.dirname, '..')
const schemaPath = resolve(repositoryRoot, 'prisma/schema.prisma')
const migrationPath = resolve(
  repositoryRoot,
  'prisma/migrations/20260814113000_add_global_identity_accounts/migration.sql'
)

describe('global account data artifacts', () => {
  it('keeps ApiKey ownership compatible while preparing account ownership', async () => {
    const schema = await readFile(schemaPath, 'utf8')

    expect(schema).toMatch(/model ApiKey \{[\s\S]*accountId\s+String\?/)
    expect(schema).toMatch(/model ApiKey \{[\s\S]*ownerEmail\s+String\?/)
    expect(schema).toContain('@@index([accountId, revokedAt])')
    expect(schema).not.toMatch(/^model Account\s/m)
  })

  it('creates a single global identity schema and links city keys to it', async () => {
    const migration = await readFile(migrationPath, 'utf8')

    expect(migration).toContain("pg_advisory_xact_lock(hashtext('bizidashboard:global-identity-v1'))")
    expect(migration).toContain('CREATE SCHEMA IF NOT EXISTS "identity";')
    expect(migration).toContain('CREATE TABLE IF NOT EXISTS "identity"."Account"')
    expect(migration).toContain('"auth0Subject" TEXT NOT NULL')
    expect(migration).toContain("CREATE TYPE \"identity\".\"AccountStatus\" AS ENUM ('active', 'revoked')")
    expect(migration).toContain('CREATE TABLE IF NOT EXISTS "identity"."AccountCityAccess"')
    expect(migration).toContain('ALTER TABLE "ApiKey" ADD COLUMN IF NOT EXISTS "accountId" TEXT;')
    expect(migration).toContain('REFERENCES "identity"."Account"("id")')
    expect(migration).toContain("WHEN duplicate_object THEN NULL")
    expect(migration).toContain('IF NOT EXISTS (\n    SELECT 1\n    FROM pg_constraint')
  })
})
