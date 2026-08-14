-- Identity is deliberately kept outside the per-city schemas. This migration
-- is deployed once per city schema, so every global statement is idempotent.
-- A future dedicated identity Prisma client must use this schema explicitly.
SELECT pg_advisory_xact_lock(hashtext('bizidashboard:global-identity-v1'));

CREATE SCHEMA IF NOT EXISTS "identity";

DO $$
BEGIN
  CREATE TYPE "identity"."AccountStatus" AS ENUM ('active', 'revoked');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "identity"."Account" (
  "id" TEXT NOT NULL,
  "auth0Subject" TEXT NOT NULL,
  "email" TEXT,
  "status" "identity"."AccountStatus" NOT NULL DEFAULT 'active',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "lastSeenAt" TIMESTAMP(3),
  "revokedAt" TIMESTAMP(3),

  CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "Account_auth0Subject_key"
  ON "identity"."Account"("auth0Subject");

CREATE INDEX IF NOT EXISTS "Account_status_idx"
  ON "identity"."Account"("status");

CREATE TABLE IF NOT EXISTS "identity"."AccountCityAccess" (
  "accountId" TEXT NOT NULL,
  "city" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "AccountCityAccess_pkey" PRIMARY KEY ("accountId", "city"),
  CONSTRAINT "AccountCityAccess_accountId_fkey"
    FOREIGN KEY ("accountId") REFERENCES "identity"."Account"("id")
    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "AccountCityAccess_city_idx"
  ON "identity"."AccountCityAccess"("city");

-- ApiKey remains city-local today. This nullable reference preserves existing
-- keys until the authenticated owner can be resolved from a verified Auth0 sub.
ALTER TABLE "ApiKey" ADD COLUMN IF NOT EXISTS "accountId" TEXT;

CREATE INDEX IF NOT EXISTS "ApiKey_accountId_revokedAt_idx"
  ON "ApiKey"("accountId", "revokedAt");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'ApiKey_accountId_fkey'
      AND conrelid = '"ApiKey"'::regclass
  ) THEN
    ALTER TABLE "ApiKey"
      ADD CONSTRAINT "ApiKey_accountId_fkey"
      FOREIGN KEY ("accountId") REFERENCES "identity"."Account"("id")
      ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;
