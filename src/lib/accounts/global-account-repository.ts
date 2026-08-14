import { randomUUID } from 'node:crypto'

import { Prisma } from '@/generated/prisma/client'
import { prisma } from '@/lib/db'

export type GlobalAccountStatus = 'active' | 'revoked'

export type GlobalAccount = Readonly<{
  id: string
  auth0Subject: string
  email: string | null
  status: GlobalAccountStatus
  createdAt: Date
  updatedAt: Date
  lastSeenAt: Date | null
  revokedAt: Date | null
}>

export type ProvisionVerifiedAccountInput = Readonly<{
  /** Auth0 `sub` already verified by the authentication boundary. */
  auth0Subject: string
  /** A verified profile email when available; omitted values retain the cache. */
  email?: string | null
}>

/** Minimal query boundary so this repository has no dependency on city models. */
export type GlobalAccountQueryExecutor = Readonly<{
  query<T>(statement: Prisma.Sql): Promise<T[]>
}>

export class RevokedAccountError extends Error {
  constructor() {
    super('This account has been revoked.')
    this.name = 'RevokedAccountError'
  }
}

export class AccountNotFoundError extends Error {
  constructor() {
    super('The account does not exist.')
    this.name = 'AccountNotFoundError'
  }
}

type AccountRow = {
  id: string
  auth0Subject: string
  email: string | null
  status: GlobalAccountStatus
  createdAt: Date
  updatedAt: Date
  lastSeenAt: Date | null
  revokedAt: Date | null
}

type CityAccessRow = {
  status: GlobalAccountStatus | null
  hasAccess?: boolean
  granted?: boolean
}

export type GlobalAccountRepository = Readonly<{
  resolveActiveAccountByAuth0Subject(auth0Subject: string): Promise<GlobalAccount | null>
  provisionVerifiedAccount(input: ProvisionVerifiedAccountInput): Promise<GlobalAccount>
  hasCityAccess(accountId: string, city: string): Promise<boolean>
  grantCityAccess(accountId: string, city: string): Promise<void>
}>

function requireAuth0Subject(value: string): string {
  const subject = value.trim()
  if (!subject) throw new TypeError('auth0Subject is required.')
  return subject
}

function requireAccountId(value: string): string {
  const accountId = value.trim()
  if (!accountId) throw new TypeError('accountId is required.')
  return accountId
}

function normalizeCity(value: string): string {
  const city = value.trim().toLowerCase()
  if (!/^[a-z][a-z0-9_]*$/.test(city)) {
    throw new TypeError('city must be a lowercase PostgreSQL-style identifier.')
  }
  return city
}

function normalizeCachedEmail(value: string | null | undefined): string | null {
  if (value === undefined || value === null) return null

  const email = value.trim()
  if (!email) throw new TypeError('email must not be empty when provided.')
  return email
}

function toAccount(row: AccountRow): GlobalAccount {
  if (row.status !== 'active' && row.status !== 'revoked') {
    throw new Error('Identity database returned an unknown account status.')
  }
  return row
}

function requireActiveAccount(row: AccountRow): GlobalAccount {
  const account = toAccount(row)
  if (account.status === 'revoked') throw new RevokedAccountError()
  return account
}

async function findAccountByAuth0Subject(
  executor: GlobalAccountQueryExecutor,
  auth0Subject: string
): Promise<AccountRow | null> {
  const rows = await executor.query<AccountRow>(Prisma.sql`
    SELECT
      "id", "auth0Subject", "email", "status",
      "createdAt", "updatedAt", "lastSeenAt", "revokedAt"
    FROM "identity"."Account"
    WHERE "auth0Subject" = ${auth0Subject}
    LIMIT 1
  `)

  return rows[0] ?? null
}

/**
 * Creates a repository over the global `identity` schema. All identifiers are
 * fixed SQL literals; user-controlled values are always bound parameters.
 */
export function createGlobalAccountRepository(
  executor: GlobalAccountQueryExecutor
): GlobalAccountRepository {
  return {
    async resolveActiveAccountByAuth0Subject(auth0Subject) {
      const row = await findAccountByAuth0Subject(executor, requireAuth0Subject(auth0Subject))
      return row ? requireActiveAccount(row) : null
    },

    async provisionVerifiedAccount(input) {
      const auth0Subject = requireAuth0Subject(input.auth0Subject)
      const email = normalizeCachedEmail(input.email)
      const rows = await executor.query<AccountRow>(Prisma.sql`
        INSERT INTO "identity"."Account" (
          "id", "auth0Subject", "email", "status",
          "createdAt", "updatedAt", "lastSeenAt"
        ) VALUES (
          ${randomUUID()}, ${auth0Subject}, ${email},
          'active'::"identity"."AccountStatus",
          CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
        )
        ON CONFLICT ("auth0Subject") DO UPDATE SET
          "email" = COALESCE(EXCLUDED."email", "identity"."Account"."email"),
          "updatedAt" = CURRENT_TIMESTAMP,
          "lastSeenAt" = CURRENT_TIMESTAMP
        WHERE "identity"."Account"."status" = 'active'::"identity"."AccountStatus"
        RETURNING
          "id", "auth0Subject", "email", "status",
          "createdAt", "updatedAt", "lastSeenAt", "revokedAt"
      `)

      const row = rows[0] ?? await findAccountByAuth0Subject(executor, auth0Subject)
      if (!row) throw new Error('Account provisioning did not return an account.')
      return requireActiveAccount(row)
    },

    async hasCityAccess(accountId, city) {
      const normalizedAccountId = requireAccountId(accountId)
      const normalizedCity = normalizeCity(city)
      const rows = await executor.query<CityAccessRow>(Prisma.sql`
        SELECT
          "account"."status" AS "status",
          EXISTS(
            SELECT 1
            FROM "identity"."AccountCityAccess" AS "access"
            WHERE "access"."accountId" = "account"."id"
              AND "access"."city" = ${normalizedCity}
          ) AS "hasAccess"
        FROM "identity"."Account" AS "account"
        WHERE "account"."id" = ${normalizedAccountId}
      `)

      const row = rows[0]
      if (!row) return false
      if (row.status === 'revoked') throw new RevokedAccountError()
      return row.hasAccess === true
    },

    async grantCityAccess(accountId, city) {
      const normalizedAccountId = requireAccountId(accountId)
      const normalizedCity = normalizeCity(city)
      const rows = await executor.query<CityAccessRow>(Prisma.sql`
        WITH "account" AS (
          SELECT "status"
          FROM "identity"."Account"
          WHERE "id" = ${normalizedAccountId}
        ), "granted" AS (
          INSERT INTO "identity"."AccountCityAccess" (
            "accountId", "city", "createdAt", "updatedAt"
          )
          SELECT ${normalizedAccountId}, ${normalizedCity}, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
          FROM "account"
          WHERE "status" = 'active'::"identity"."AccountStatus"
          ON CONFLICT ("accountId", "city") DO UPDATE SET
            "updatedAt" = CURRENT_TIMESTAMP
          RETURNING "accountId"
        )
        SELECT
          (SELECT "status" FROM "account") AS "status",
          EXISTS(SELECT 1 FROM "granted") AS "granted"
      `)

      const row = rows[0]
      if (!row || row.status === null) throw new AccountNotFoundError()
      if (row.status === 'revoked') throw new RevokedAccountError()
      if (row.granted !== true) throw new Error('City access could not be granted.')
    },
  }
}

export const globalAccountRepository = createGlobalAccountRepository({
  query: (statement) => prisma.$queryRaw(statement),
})
