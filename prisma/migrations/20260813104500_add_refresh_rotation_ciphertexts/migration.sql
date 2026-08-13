ALTER TABLE "Install"
ADD COLUMN "previousRefreshTokenCiphertext" TEXT,
ADD COLUMN "previousAccessTokenCiphertext" TEXT;
