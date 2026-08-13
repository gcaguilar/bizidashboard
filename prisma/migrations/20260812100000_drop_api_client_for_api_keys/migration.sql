-- Public API access is now a single mechanism: personal API keys minted from
-- the developer portal. The Auth0 M2M client registry is no longer used.
DROP TABLE IF EXISTS "ApiClient";

-- Supports listing a developer's live keys by owner.
CREATE INDEX IF NOT EXISTS "ApiKey_ownerEmail_revokedAt_idx" ON "ApiKey"("ownerEmail", "revokedAt");
