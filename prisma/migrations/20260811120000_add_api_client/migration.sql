-- CreateTable
CREATE TABLE "ApiClient" (
    "id" TEXT NOT NULL,
    "auth0ClientId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "ownerEmail" TEXT NOT NULL,
    "customRateLimit" INTEGER,
    "customRateWindow" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ApiClient_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ApiClient_auth0ClientId_key" ON "ApiClient"("auth0ClientId");

-- CreateIndex
CREATE INDEX "ApiClient_isActive_revokedAt_idx" ON "ApiClient"("isActive", "revokedAt");
