import { describe, expect, it, vi } from 'vitest'

import { Prisma } from '@/generated/prisma/client'
import {
  AccountNotFoundError,
  createGlobalAccountRepository,
  RevokedAccountError,
  type GlobalAccountQueryExecutor,
} from '@/lib/accounts/global-account-repository'

const activeAccount = {
  id: 'account-1',
  auth0Subject: 'auth0|person-1',
  email: 'person@example.com',
  status: 'active' as const,
  createdAt: new Date('2026-08-14T10:00:00.000Z'),
  updatedAt: new Date('2026-08-14T10:00:00.000Z'),
  lastSeenAt: new Date('2026-08-14T10:00:00.000Z'),
  revokedAt: null,
}

function sqlText(statement: Prisma.Sql): string {
  return statement.strings.join('?')
}

function queryExecutor(...responses: unknown[][]): {
  executor: GlobalAccountQueryExecutor
  query: ReturnType<typeof vi.fn>
} {
  const query = vi.fn()
  for (const response of responses) query.mockResolvedValueOnce(response)

  return {
    executor: { query },
    query,
  }
}

describe('global account repository', () => {
  it('resolves only by Auth0 subject and rejects a revoked account', async () => {
    const { executor, query } = queryExecutor([{ ...activeAccount, status: 'revoked' }])
    const repository = createGlobalAccountRepository(executor)

    await expect(repository.resolveActiveAccountByAuth0Subject('auth0|person-1'))
      .rejects.toBeInstanceOf(RevokedAccountError)

    const statement = query.mock.calls[0]?.[0] as Prisma.Sql
    expect(sqlText(statement)).toContain('FROM "identity"."Account"')
    expect(sqlText(statement)).toContain('WHERE "auth0Subject" = ?')
    expect(statement.values).toEqual(['auth0|person-1'])
    expect(sqlText(statement)).not.toContain('WHERE "email"')
  })

  it('provisions with an atomic subject upsert and refreshes only cached identity data', async () => {
    const { executor, query } = queryExecutor([activeAccount])
    const repository = createGlobalAccountRepository(executor)

    await expect(repository.provisionVerifiedAccount({
      auth0Subject: 'auth0|person-1',
      email: 'person@example.com',
    })).resolves.toEqual(activeAccount)

    const statement = query.mock.calls[0]?.[0] as Prisma.Sql
    const text = sqlText(statement)
    expect(text).toContain('INSERT INTO "identity"."Account"')
    expect(text).toContain('ON CONFLICT ("auth0Subject") DO UPDATE')
    expect(text).toContain('"lastSeenAt" = CURRENT_TIMESTAMP')
    expect(text).toContain('COALESCE(EXCLUDED."email", "identity"."Account"."email")')
    expect(text).toContain('"status" = \'active\'::"identity"."AccountStatus"')
    expect(text).not.toContain('WHERE "email"')
    expect(statement.values).toContain('auth0|person-1')
    expect(statement.values).toContain('person@example.com')
  })

  it('re-reads the subject after a concurrent upsert and still rejects revocation', async () => {
    const { executor, query } = queryExecutor([], [{ ...activeAccount, status: 'revoked' }])
    const repository = createGlobalAccountRepository(executor)

    await expect(repository.provisionVerifiedAccount({ auth0Subject: 'auth0|person-1' }))
      .rejects.toBeInstanceOf(RevokedAccountError)

    expect(query).toHaveBeenCalledTimes(2)
    expect(sqlText(query.mock.calls[1]?.[0] as Prisma.Sql)).toContain(
      'WHERE "auth0Subject" = ?'
    )
  })

  it('checks and grants city access only for active accounts', async () => {
    const check = queryExecutor([{ status: 'active', hasAccess: true }])
    const checkRepository = createGlobalAccountRepository(check.executor)

    await expect(checkRepository.hasCityAccess('account-1', 'Zaragoza')).resolves.toBe(true)
    const checkStatement = check.query.mock.calls[0]?.[0] as Prisma.Sql
    expect(sqlText(checkStatement)).toContain('"identity"."AccountCityAccess"')
    expect(checkStatement.values).toEqual(['zaragoza', 'account-1'])

    const grant = queryExecutor([{ status: 'active', granted: true }])
    const grantRepository = createGlobalAccountRepository(grant.executor)
    await expect(grantRepository.grantCityAccess('account-1', 'zaragoza')).resolves.toBeUndefined()

    const grantStatement = grant.query.mock.calls[0]?.[0] as Prisma.Sql
    expect(sqlText(grantStatement)).toContain('ON CONFLICT ("accountId", "city") DO UPDATE')
    expect(sqlText(grantStatement)).toContain('"status" = \'active\'::"identity"."AccountStatus"')
  })

  it('does not grant access to revoked or missing accounts', async () => {
    const revoked = queryExecutor([{ status: 'revoked', granted: false }])
    await expect(createGlobalAccountRepository(revoked.executor).grantCityAccess('account-1', 'zaragoza'))
      .rejects.toBeInstanceOf(RevokedAccountError)

    const missing = queryExecutor([{ status: null, granted: false }])
    await expect(createGlobalAccountRepository(missing.executor).grantCityAccess('missing', 'zaragoza'))
      .rejects.toBeInstanceOf(AccountNotFoundError)
  })
})
