/**
 * API Key management service
 *
 * Handles creation, validation, and revocation of multiple API keys
 * for public API access with individual rate limiting.
 */

import { createHash, randomBytes } from 'node:crypto';
import { prisma } from '@/lib/db';
import { logger } from '@/lib/logger';

export type ApiKeyInfo = {
  id: string;
  name: string;
  keyPrefix: string;
  description: string | null;
  ownerEmail: string | null;
  isActive: boolean;
  lastUsedAt: Date | null;
  requestCount: number;
  createdAt: Date;
  customRateLimit: number | null;
  customRateWindow: number | null;
};

export type CreateApiKeyInput = {
  name: string;
  description?: string;
  ownerEmail?: string;
  customRateLimit?: number;
  customRateWindow?: number;
  createdBy?: string;
};

// Default rate limits
export const DEFAULT_RATE_LIMIT = 100;
export const DEFAULT_RATE_WINDOW_MS = 60_000; // 1 minute

/**
 * Generate a secure API key
 * Format: biz_live_<random>
 */
function generateApiKey(): string {
  const prefix = 'biz_live_';
  const randomPart = randomBytes(32).toString('base64url');
  return `${prefix}${randomPart}`;
}

/**
 * Hash an API key for storage
 */
function hashApiKey(key: string): string {
  return createHash('sha256').update(key).digest('hex');
}

/**
 * Get the prefix of an API key (first 8 chars after prefix)
 */
function getKeyPrefix(key: string): string {
  return key.slice(0, 16); // Include 'biz_live_' + first 7 chars
}

/**
 * Create a new API key
 *
 * @returns The full API key (only shown once) and key info
 */
export async function createApiKey(
  input: CreateApiKeyInput
): Promise<{ fullKey: string; info: ApiKeyInfo }> {
  const fullKey = generateApiKey();
  const keyHash = hashApiKey(fullKey);
  const keyPrefix = getKeyPrefix(fullKey);

  const record = await prisma.apiKey.create({
    data: {
      name: input.name,
      keyHash,
      keyPrefix,
      description: input.description ?? null,
      ownerEmail: input.ownerEmail ?? null,
      customRateLimit: input.customRateLimit ?? null,
      customRateWindow: input.customRateWindow ?? null,
      createdBy: input.createdBy ?? null,
    },
  });

  logger.info('api_key.created', {
    keyId: record.id,
    name: record.name,
    keyPrefix: record.keyPrefix,
  });

  return {
    fullKey,
    info: {
      id: record.id,
      name: record.name,
      keyPrefix: record.keyPrefix,
      description: record.description,
      ownerEmail: record.ownerEmail,
      isActive: record.isActive,
      lastUsedAt: record.lastUsedAt,
      requestCount: record.requestCount,
      createdAt: record.createdAt,
      customRateLimit: record.customRateLimit,
      customRateWindow: record.customRateWindow,
    },
  };
}

/**
 * Validate an API key and return its info if valid
 */
export async function validateApiKey(
  providedKey: string | null | undefined
): Promise<ApiKeyInfo | null> {
  if (!providedKey) {
    return null;
  }

  const keyHash = hashApiKey(providedKey);

  const record = await prisma.apiKey.findUnique({
    where: { keyHash },
  });

  if (!record) {
    return null;
  }

  if (!record.isActive || record.revokedAt) {
    return null;
  }

  // Update usage stats asynchronously (don't block the request)
  prisma.apiKey
    .update({
      where: { id: record.id },
      data: {
        lastUsedAt: new Date(),
        requestCount: { increment: 1 },
      },
    })
    .catch((error) => {
      logger.warn('api_key.usage_update_failed', { error });
    });

  return {
    id: record.id,
    name: record.name,
    keyPrefix: record.keyPrefix,
    description: record.description,
    ownerEmail: record.ownerEmail,
    isActive: record.isActive,
    lastUsedAt: record.lastUsedAt,
    requestCount: record.requestCount,
    createdAt: record.createdAt,
    customRateLimit: record.customRateLimit,
    customRateWindow: record.customRateWindow,
  };
}

/**
 * Get rate limits for an API key (custom or defaults)
 */
export function getApiKeyRateLimits(
  apiKeyInfo: ApiKeyInfo | null
): { limit: number; windowMs: number } {
  if (apiKeyInfo?.customRateLimit && apiKeyInfo?.customRateWindow) {
    return {
      limit: apiKeyInfo.customRateLimit,
      windowMs: apiKeyInfo.customRateWindow,
    };
  }

  return {
    limit: DEFAULT_RATE_LIMIT,
    windowMs: DEFAULT_RATE_WINDOW_MS,
  };
}

/**
 * List all API keys (for admin)
 */
export async function listApiKeys(includeRevoked = false): Promise<ApiKeyInfo[]> {
  const records = await prisma.apiKey.findMany({
    where: includeRevoked ? undefined : { revokedAt: null },
    orderBy: { createdAt: 'desc' },
  });

  return records.map((record) => ({
    id: record.id,
    name: record.name,
    keyPrefix: record.keyPrefix,
    description: record.description,
    ownerEmail: record.ownerEmail,
    isActive: record.isActive,
    lastUsedAt: record.lastUsedAt,
    requestCount: record.requestCount,
    createdAt: record.createdAt,
    customRateLimit: record.customRateLimit,
    customRateWindow: record.customRateWindow,
  }));
}

/**
 * Revoke an API key
 */
export async function revokeApiKey(
  keyId: string,
  reason: string
): Promise<boolean> {
  try {
    await prisma.apiKey.update({
      where: { id: keyId },
      data: {
        isActive: false,
        revokedAt: new Date(),
        revokedReason: reason,
      },
    });

    logger.info('api_key.revoked', { keyId, reason });
    return true;
  } catch (error) {
    logger.error('api_key.revoke_failed', { keyId, error });
    return false;
  }
}

/**
 * Delete an API key permanently
 */
export async function deleteApiKey(keyId: string): Promise<boolean> {
  try {
    await prisma.apiKey.delete({
      where: { id: keyId },
    });

    logger.info('api_key.deleted', { keyId });
    return true;
  } catch (error) {
    logger.error('api_key.delete_failed', { keyId, error });
    return false;
  }
}

/**
 * Check if API keys feature is configured
 * Returns true if we should use multi-key system, false for legacy single-key
 */
export function isMultiKeySystemEnabled(): boolean {
  // If PUBLIC_API_KEY is set, use legacy single-key mode
  // Otherwise, use multi-key system from database
  const legacyKey = process.env.PUBLIC_API_KEY?.trim();
  return !legacyKey;
}
