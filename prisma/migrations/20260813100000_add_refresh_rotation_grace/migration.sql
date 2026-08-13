ALTER TABLE "Install"
ADD COLUMN "previousRefreshTokenHash" TEXT,
ADD COLUMN "previousRefreshTokenExpiresAt" TIMESTAMP(3);

CREATE INDEX "Install_previousRefreshTokenHash_idx" ON "Install"("previousRefreshTokenHash");
