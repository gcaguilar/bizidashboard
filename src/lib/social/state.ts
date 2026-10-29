/**
 * Estado operativo del agente social.
 *
 * `StateStore` es el unico contrato que ven los runners. La implementacion de
 * produccion usa SQLite via `bun:sqlite` importado dinamicamente (Vitest corre
 * en Node y no debe resolver el modulo); los tests usan `MemoryStateStore`.
 *
 * Las transiciones son deliberadamente estrictas: un post publicado no puede
 * volver a moverse y un fallo no se reintenta solo. `claimSlot` recupera una
 * fila activa abandonada tras 15 minutos, salvo que este en `publishing`: ahi
 * Buffer pudo aceptar el post antes de morir el proceso, asi que la fila queda
 * bloqueada para revision manual y nunca se republica sola.
 */

import { mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';

import type {
  SocialAsset,
  SocialClaimOutcome,
  SocialContentMetadata,
  SocialFamily,
  SocialPostPatch,
  SocialPostRecord,
  SocialSlot,
  SocialSlotMeta,
  SocialStatus,
} from '@/lib/social/types';
import {
  SOCIAL_ACTIVE_STATUSES,
  SOCIAL_SLOT_FAMILY,
} from '@/lib/social/types';

export const SOCIAL_STALE_AFTER_MS = 15 * 60_000;

const TRANSITIONS: Record<SocialStatus, readonly SocialStatus[]> = {
  claimed: ['rendering', 'skipped', 'error'],
  rendering: ['uploading', 'skipped', 'error'],
  uploading: ['publishing', 'skipped', 'error'],
  publishing: ['sent', 'skipped', 'error'],
  sent: [],
  skipped: [],
  error: [],
};

export type SocialStateStoreOptions = {
  /** Reloj inyectable para tests de obsolescencia. */
  now?: () => Date;
};

export interface StateStore {
  claimSlot(
    dateKey: string,
    slot: SocialSlot,
    meta?: SocialSlotMeta
  ): Promise<SocialClaimOutcome>;
  markRendering(id: number, patch?: SocialPostPatch): Promise<SocialPostRecord>;
  markUploading(id: number, patch?: SocialPostPatch): Promise<SocialPostRecord>;
  markPublishing(id: number, patch?: SocialPostPatch): Promise<SocialPostRecord>;
  markSent(
    id: number,
    patch: SocialPostPatch & { bufferPostId: string }
  ): Promise<SocialPostRecord>;
  markSkipped(id: number, patch?: SocialPostPatch): Promise<SocialPostRecord>;
  markError(
    id: number,
    patch: SocialPostPatch & { error: string }
  ): Promise<SocialPostRecord>;
  getBySlot(dateKey: string, slot: SocialSlot): Promise<SocialPostRecord | null>;
  /** Familias publicadas mas recientes, sin duplicados, para anti-repeticion. */
  getRecentFamilies(limit: number): Promise<SocialFamily[]>;
  /**
   * Metadata de las ultimas piezas publicadas (`sent`), de mas reciente a mas
   * antigua. Descarta filas sin metadata o con metadata invalida. `family`
   * limita la consulta a una familia editorial (por ejemplo, el semanal).
   */
  getRecentContent(
    limit: number,
    family?: SocialFamily
  ): Promise<SocialContentMetadata[]>;
  /** Ultimos registros (cualquier estado), de mas reciente a mas antiguo. */
  listRecentPosts(limit: number): Promise<SocialPostRecord[]>;
  close(): Promise<void>;
}

export function canTransition(from: SocialStatus, to: SocialStatus): boolean {
  return TRANSITIONS[from].includes(to);
}

export function isSocialRecordStale(
  record: Pick<SocialPostRecord, 'status' | 'updatedAt'>,
  nowMs: number = Date.now()
): boolean {
  if (!SOCIAL_ACTIVE_STATUSES.includes(record.status)) {
    return false;
  }

  const updatedAtMs = Date.parse(record.updatedAt);
  if (!Number.isFinite(updatedAtMs)) {
    return false;
  }

  return nowMs - updatedAtMs > SOCIAL_STALE_AFTER_MS;
}

function normalizeStringList(value: unknown): string[] | null | undefined {
  if (!Array.isArray(value)) {
    return null;
  }

  const values: string[] = [];
  for (const entry of value) {
    if (typeof entry !== 'string') {
      return null;
    }

    const normalized = entry.trim();
    if (!normalized) {
      return null;
    }
    if (!values.includes(normalized)) {
      values.push(normalized);
    }
  }

  // Un array vacio no invalida la metadata: simplemente no aporta nada.
  return values.length > 0 ? values : undefined;
}

/**
 * Valida y normaliza metadata sin confiar en el JSON persistido. Cualquier
 * campo con forma invalida invalida la metadata entera: es preferible perder
 * una pista de rotacion a guardar datos corruptos.
 */
function normalizeMetadata(value: unknown): SocialContentMetadata | undefined {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return undefined;
  }

  const candidate = value as {
    theme?: unknown;
    stationIds?: unknown;
    districtNames?: unknown;
    spotlightDistrict?: unknown;
  };

  let theme: string | undefined;
  if (candidate.theme !== undefined) {
    if (typeof candidate.theme !== 'string' || !candidate.theme.trim()) {
      return undefined;
    }
    theme = candidate.theme.trim();
  }

  let stationIds: string[] | undefined;
  if (candidate.stationIds !== undefined) {
    const normalized = normalizeStringList(candidate.stationIds);
    if (normalized === null) {
      return undefined;
    }
    stationIds = normalized;
  }

  let districtNames: string[] | undefined;
  if (candidate.districtNames !== undefined) {
    const normalized = normalizeStringList(candidate.districtNames);
    if (normalized === null) {
      return undefined;
    }
    districtNames = normalized;
  }

  let spotlightDistrict: string | undefined;
  if (candidate.spotlightDistrict !== undefined) {
    if (
      typeof candidate.spotlightDistrict !== 'string' ||
      !candidate.spotlightDistrict.trim()
    ) {
      return undefined;
    }
    spotlightDistrict = candidate.spotlightDistrict.trim();
  }

  if (!theme && !stationIds && !districtNames && !spotlightDistrict) {
    return undefined;
  }

  return {
    ...(theme ? { theme } : {}),
    ...(stationIds ? { stationIds } : {}),
    ...(districtNames ? { districtNames } : {}),
    ...(spotlightDistrict ? { spotlightDistrict } : {}),
  };
}

function cloneMetadata(
  metadata: SocialContentMetadata | undefined
): SocialContentMetadata | undefined {
  const normalized = normalizeMetadata(metadata);
  if (!normalized) {
    return undefined;
  }

  return {
    ...normalized,
    ...(normalized.stationIds ? { stationIds: [...normalized.stationIds] } : {}),
    ...(normalized.districtNames ? { districtNames: [...normalized.districtNames] } : {}),
  };
}

function parseMetadata(value: unknown): SocialContentMetadata | undefined {
  if (typeof value !== 'string' || value.trim() === '') {
    return undefined;
  }

  try {
    return normalizeMetadata(JSON.parse(value));
  } catch {
    return undefined;
  }
}

function serializeMetadata(
  metadata: SocialContentMetadata | undefined
): string | null {
  const normalized = cloneMetadata(metadata);
  return normalized ? JSON.stringify(normalized) : null;
}

function cloneRecord(record: SocialPostRecord): SocialPostRecord {
  return {
    ...record,
    assetUrls: record.assetUrls.map((asset) => ({ ...asset })),
    metadata: cloneMetadata(record.metadata),
  };
}

/** Ejecuta trabajo sincrono y entrega el resultado como promesa. */
function runAsync<T>(fn: () => T): Promise<T> {
  return Promise.resolve().then(fn);
}

function buildClaimedRecord(
  existing: SocialPostRecord | null,
  id: number,
  dateKey: string,
  slot: SocialSlot,
  family: SocialFamily,
  meta: SocialSlotMeta,
  nowIso: string
): SocialPostRecord {
  return {
    id,
    dateKey,
    slot,
    family,
    status: 'claimed',
    caption: meta.caption ?? null,
    altText: meta.altText ?? null,
    assetUrls: [],
    bufferPostId: null,
    error: null,
    metadata: cloneMetadata(meta.metadata),
    createdAt: existing?.createdAt ?? nowIso,
    updatedAt: nowIso,
    publishedAt: null,
  };
}

function transitionRecord(
  record: SocialPostRecord,
  next: SocialStatus,
  patch: SocialPostPatch,
  nowIso: string
): SocialPostRecord {
  if (!canTransition(record.status, next)) {
    throw new Error(`Invalid social status transition: ${record.status} -> ${next}`);
  }

  const publishedAt =
    next === 'sent'
      ? (patch.publishedAt ?? nowIso)
      : (patch.publishedAt !== undefined ? patch.publishedAt : record.publishedAt);

  return {
    ...record,
    status: next,
    caption: patch.caption !== undefined ? patch.caption : record.caption,
    altText: patch.altText !== undefined ? patch.altText : record.altText,
    assetUrls: patch.assets
      ? patch.assets.map((asset) => ({ ...asset }))
      : record.assetUrls.map((asset) => ({ ...asset })),
    bufferPostId:
      patch.bufferPostId !== undefined ? patch.bufferPostId : record.bufferPostId,
    error: patch.error !== undefined ? patch.error : record.error,
    metadata:
      patch.metadata !== undefined
        ? cloneMetadata(patch.metadata)
        : cloneMetadata(record.metadata),
    updatedAt: nowIso,
    publishedAt,
  };
}

function resolveFamily(slot: SocialSlot, meta: SocialSlotMeta): SocialFamily {
  return meta.family ?? SOCIAL_SLOT_FAMILY[slot];
}

function assertSentPatch(patch: SocialPostPatch & { bufferPostId: string }): void {
  if (!patch.bufferPostId.trim()) {
    throw new Error('markSent requires a Buffer post id');
  }
}

function assertErrorPatch(patch: SocialPostPatch & { error: string }): void {
  if (!patch.error.trim()) {
    throw new Error('markError requires an error message');
  }
}

function recentFamilies(records: SocialPostRecord[], limit: number): SocialFamily[] {
  const safeLimit = Math.max(0, Math.trunc(limit));
  if (safeLimit === 0) {
    return [];
  }

  const sent = records
    .filter((record) => record.status === 'sent')
    .sort((left, right) => {
      const leftAt = Date.parse(left.publishedAt ?? left.updatedAt);
      const rightAt = Date.parse(right.publishedAt ?? right.updatedAt);
      return rightAt - leftAt || right.id - left.id;
    });

  const families: SocialFamily[] = [];
  for (const record of sent) {
    if (!families.includes(record.family)) {
      families.push(record.family);
    }
    if (families.length >= safeLimit) {
      break;
    }
  }

  return families;
}

function recentContent(
  records: SocialPostRecord[],
  limit: number,
  family?: SocialFamily
): SocialContentMetadata[] {
  const safeLimit = Math.max(0, Math.trunc(limit));
  if (safeLimit === 0) {
    return [];
  }

  return records
    .filter(
      (record) =>
        record.status === 'sent' && (!family || record.family === family)
    )
    .sort((left, right) => {
      const leftAt = Date.parse(left.publishedAt ?? left.updatedAt);
      const rightAt = Date.parse(right.publishedAt ?? right.updatedAt);
      return rightAt - leftAt || right.id - left.id;
    })
    .map((record) => cloneMetadata(record.metadata))
    .filter((metadata): metadata is SocialContentMetadata => metadata !== undefined)
    .slice(0, safeLimit);
}

function recentPosts(
  records: readonly SocialPostRecord[],
  limit: number
): SocialPostRecord[] {
  const safeLimit = Math.max(0, Math.trunc(limit));
  if (safeLimit === 0) {
    return [];
  }

  return [...records]
    .sort((left, right) => {
      const leftAt = Date.parse(
        left.publishedAt ?? left.updatedAt ?? left.createdAt
      );
      const rightAt = Date.parse(
        right.publishedAt ?? right.updatedAt ?? right.createdAt
      );
      return rightAt - leftAt || right.id - left.id;
    })
    .slice(0, safeLimit)
    .map(cloneRecord);
}

export class MemoryStateStore implements StateStore {
  private readonly now: () => Date;
  private nextId = 1;
  private readonly byId = new Map<number, SocialPostRecord>();
  private readonly bySlot = new Map<string, number>();

  constructor(options: SocialStateStoreOptions = {}) {
    this.now = options.now ?? (() => new Date());
  }

  private nowIso(): string {
    return this.now().toISOString();
  }

  private slotKey(dateKey: string, slot: SocialSlot): string {
    return `${dateKey}\u0000${slot}`;
  }

  private getRecordOrThrow(id: number): SocialPostRecord {
    const record = this.byId.get(id);
    if (!record) {
      throw new Error(`Social post ${id} not found`);
    }
    return record;
  }

  private updateRecord(
    id: number,
    next: SocialStatus,
    patch: SocialPostPatch
  ): SocialPostRecord {
    const current = this.getRecordOrThrow(id);
    const updated = transitionRecord(current, next, patch, this.nowIso());
    this.byId.set(id, updated);
    return cloneRecord(updated);
  }

  claimSlot(
    dateKey: string,
    slot: SocialSlot,
    meta: SocialSlotMeta = {}
  ): Promise<SocialClaimOutcome> {
    return runAsync(() => {
      const key = this.slotKey(dateKey, slot);
      const existingId = this.bySlot.get(key);
      const nowIso = this.nowIso();
      const family = resolveFamily(slot, meta);

      if (existingId === undefined) {
        const record = buildClaimedRecord(
          null,
          this.nextId,
          dateKey,
          slot,
          family,
          meta,
          nowIso
        );
        this.nextId += 1;
        this.byId.set(record.id, record);
        this.bySlot.set(key, record.id);
        return { claimed: true, record: cloneRecord(record), reclaimed: false };
      }

      const existing = this.getRecordOrThrow(existingId);
      if (isSocialRecordStale(existing, this.now().getTime())) {
        if (existing.status === 'publishing') {
          return {
            claimed: false,
            record: cloneRecord(existing),
            reason: 'stale_publishing',
          };
        }

        const record = buildClaimedRecord(
          existing,
          existing.id,
          dateKey,
          slot,
          family,
          meta,
          nowIso
        );
        this.byId.set(record.id, record);
        return { claimed: true, record: cloneRecord(record), reclaimed: true };
      }

      return {
        claimed: false,
        record: cloneRecord(existing),
        reason: SOCIAL_ACTIVE_STATUSES.includes(existing.status)
          ? 'in_progress'
          : 'terminal',
      };
    });
  }

  markRendering(id: number, patch: SocialPostPatch = {}): Promise<SocialPostRecord> {
    return runAsync(() => this.updateRecord(id, 'rendering', patch));
  }

  markUploading(id: number, patch: SocialPostPatch = {}): Promise<SocialPostRecord> {
    return runAsync(() => this.updateRecord(id, 'uploading', patch));
  }

  markPublishing(id: number, patch: SocialPostPatch = {}): Promise<SocialPostRecord> {
    return runAsync(() => this.updateRecord(id, 'publishing', patch));
  }

  markSent(
    id: number,
    patch: SocialPostPatch & { bufferPostId: string }
  ): Promise<SocialPostRecord> {
    return runAsync(() => {
      assertSentPatch(patch);
      return this.updateRecord(id, 'sent', patch);
    });
  }

  markSkipped(id: number, patch: SocialPostPatch = {}): Promise<SocialPostRecord> {
    return runAsync(() => this.updateRecord(id, 'skipped', patch));
  }

  markError(
    id: number,
    patch: SocialPostPatch & { error: string }
  ): Promise<SocialPostRecord> {
    return runAsync(() => {
      assertErrorPatch(patch);
      return this.updateRecord(id, 'error', patch);
    });
  }

  getBySlot(
    dateKey: string,
    slot: SocialSlot
  ): Promise<SocialPostRecord | null> {
    return runAsync(() => {
      const id = this.bySlot.get(this.slotKey(dateKey, slot));
      if (id === undefined) {
        return null;
      }

      return cloneRecord(this.getRecordOrThrow(id));
    });
  }

  getRecentFamilies(limit: number): Promise<SocialFamily[]> {
    return runAsync(() =>
      recentFamilies(Array.from(this.byId.values()), limit)
    );
  }

  getRecentContent(
    limit: number,
    family?: SocialFamily
  ): Promise<SocialContentMetadata[]> {
    return runAsync(() =>
      recentContent(Array.from(this.byId.values()), limit, family)
    );
  }

  listRecentPosts(limit: number): Promise<SocialPostRecord[]> {
    return runAsync(() => recentPosts(Array.from(this.byId.values()), limit));
  }

  close(): Promise<void> {
    return Promise.resolve();
  }
}

type SqliteRow = {
  id: number | bigint;
  date_key: string;
  slot: string;
  family: string;
  status: string;
  caption: string | null;
  alt_text: string | null;
  asset_urls: string | null;
  buffer_post_id: string | null;
  error: string | null;
  metadata_json: string | null;
  created_at: string;
  updated_at: string;
  published_at: string | null;
};

const CREATE_SCHEMA_SQL = `
  CREATE TABLE IF NOT EXISTS social_posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date_key TEXT NOT NULL,
    slot TEXT NOT NULL,
    family TEXT NOT NULL,
    status TEXT NOT NULL,
    caption TEXT,
    alt_text TEXT,
    asset_urls TEXT,
    buffer_post_id TEXT,
    error TEXT,
    metadata_json TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    published_at TEXT,
    UNIQUE(date_key, slot)
  );
`;

function parseAssets(value: unknown): SocialAsset[] {
  if (typeof value !== 'string' || value.trim() === '') {
    return [];
  }

  try {
    const parsed: unknown = JSON.parse(value);
    if (!Array.isArray(parsed)) {
      return [];
    }

    const assets: SocialAsset[] = [];
    for (const entry of parsed) {
      if (!entry || typeof entry !== 'object') {
        continue;
      }

      const candidate = entry as { pageUrl?: unknown; directUrl?: unknown };
      if (
        typeof candidate.pageUrl === 'string' &&
        typeof candidate.directUrl === 'string'
      ) {
        assets.push({
          pageUrl: candidate.pageUrl,
          directUrl: candidate.directUrl,
        });
      }
    }
    return assets;
  } catch {
    return [];
  }
}

function serializeAssets(assets: readonly SocialAsset[]): string {
  return JSON.stringify(assets.map((asset) => ({
    pageUrl: asset.pageUrl,
    directUrl: asset.directUrl,
  })));
}

function toRecord(row: SqliteRow): SocialPostRecord {
  return {
    id: Number(row.id),
    dateKey: String(row.date_key),
    slot: String(row.slot) as SocialSlot,
    family: String(row.family) as SocialFamily,
    status: String(row.status) as SocialStatus,
    caption: row.caption === null ? null : String(row.caption),
    altText: row.alt_text === null ? null : String(row.alt_text),
    assetUrls: parseAssets(row.asset_urls),
    bufferPostId:
      row.buffer_post_id === null ? null : String(row.buffer_post_id),
    error: row.error === null ? null : String(row.error),
    metadata: parseMetadata(row.metadata_json),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
    publishedAt: row.published_at === null ? null : String(row.published_at),
  };
}

class SqliteStateStore implements StateStore {
  private readonly now: () => Date;

  private readonly selectBySlot: import('bun:sqlite').Statement<SqliteRow>;
  private readonly selectById: import('bun:sqlite').Statement<SqliteRow>;
  private readonly insert: import('bun:sqlite').Statement<unknown>;
  private readonly reclaim: import('bun:sqlite').Statement<unknown>;
  private readonly update: import('bun:sqlite').Statement<unknown>;
  private readonly recentFamiliesQuery: import('bun:sqlite').Statement<{ family: string }>;
  private readonly recentContentQuery: import('bun:sqlite').Statement<{
    metadata_json: string | null;
  }>;
  private readonly recentContentByFamilyQuery: import('bun:sqlite').Statement<{
    metadata_json: string | null;
  }>;
  private readonly recentPostsQuery: import('bun:sqlite').Statement<SqliteRow>;

  constructor(
    private readonly db: import('bun:sqlite').Database,
    options: SocialStateStoreOptions = {}
  ) {
    this.now = options.now ?? (() => new Date());

    this.selectBySlot = db.query<SqliteRow>(
      'SELECT * FROM social_posts WHERE date_key = ? AND slot = ?'
    );
    this.selectById = db.query<SqliteRow>(
      'SELECT * FROM social_posts WHERE id = ?'
    );
    this.insert = db.query(
      `INSERT INTO social_posts
        (date_key, slot, family, status, caption, alt_text, asset_urls,
         buffer_post_id, error, metadata_json, created_at, updated_at, published_at)
       VALUES (?, ?, ?, 'claimed', ?, ?, NULL, NULL, NULL, ?, ?, ?, NULL)`
    );
    this.reclaim = db.query(
      `UPDATE social_posts
       SET family = ?, status = 'claimed', caption = ?, alt_text = ?,
           asset_urls = NULL, buffer_post_id = NULL, error = NULL,
           metadata_json = ?, updated_at = ?, published_at = NULL
       WHERE id = ?`
    );
    this.update = db.query(
      `UPDATE social_posts
       SET status = ?, caption = ?, alt_text = ?, asset_urls = ?,
           buffer_post_id = ?, error = ?, metadata_json = ?, updated_at = ?,
           published_at = ?
       WHERE id = ?`
    );
    this.recentFamiliesQuery = db.query<{ family: string }>(
      `SELECT family FROM social_posts
       WHERE status = 'sent'
       GROUP BY family
       ORDER BY MAX(COALESCE(published_at, updated_at)) DESC
       LIMIT ?`
    );
    this.recentContentQuery = db.query<{ metadata_json: string | null }>(
      `SELECT metadata_json FROM social_posts
       WHERE status = 'sent'
       ORDER BY COALESCE(published_at, updated_at) DESC, id DESC`
    );
    this.recentContentByFamilyQuery = db.query<{ metadata_json: string | null }>(
      `SELECT metadata_json FROM social_posts
       WHERE status = 'sent' AND family = ?
       ORDER BY COALESCE(published_at, updated_at) DESC, id DESC`
    );
    this.recentPostsQuery = db.query<SqliteRow>(
      `SELECT * FROM social_posts
       ORDER BY COALESCE(published_at, updated_at, created_at) DESC, id DESC
       LIMIT ?`
    );
  }

  private nowIso(): string {
    return this.now().toISOString();
  }

  private requireRecord(id: number): SocialPostRecord {
    const row = this.selectById.get(id);
    if (!row) {
      throw new Error(`Social post ${id} not found`);
    }
    return toRecord(row);
  }

  private updateRecord(
    id: number,
    next: SocialStatus,
    patch: SocialPostPatch
  ): SocialPostRecord {
    const run = this.db.transaction((): SocialPostRecord => {
      const current = this.requireRecord(id);
      const updated = transitionRecord(current, next, patch, this.nowIso());

      this.update.run(
        updated.status,
        updated.caption,
        updated.altText,
        serializeAssets(updated.assetUrls),
        updated.bufferPostId,
        updated.error,
        serializeMetadata(updated.metadata),
        updated.updatedAt,
        updated.publishedAt,
        id
      );

      return updated;
    });

    return run();
  }

  claimSlot(
    dateKey: string,
    slot: SocialSlot,
    meta: SocialSlotMeta = {}
  ): Promise<SocialClaimOutcome> {
    return runAsync(() => {
      const nowMs = this.now().getTime();
      const nowIso = this.nowIso();
      const family = resolveFamily(slot, meta);

      const run = this.db.transaction((): SocialClaimOutcome => {
        const existingRow = this.selectBySlot.get(dateKey, slot);

        if (!existingRow) {
          this.insert.run(
            dateKey,
            slot,
            family,
            meta.caption ?? null,
            meta.altText ?? null,
            serializeMetadata(meta.metadata),
            nowIso,
            nowIso
          );
          const created = this.selectBySlot.get(dateKey, slot);
          if (!created) {
            throw new Error('Failed to create the social post row');
          }
          return { claimed: true, record: toRecord(created), reclaimed: false };
        }

        const existing = toRecord(existingRow);

        if (isSocialRecordStale(existing, nowMs)) {
          if (existing.status === 'publishing') {
            return {
              claimed: false,
              record: existing,
              reason: 'stale_publishing',
            };
          }

          this.reclaim.run(
            family,
            meta.caption ?? null,
            meta.altText ?? null,
            serializeMetadata(meta.metadata),
            nowIso,
            existing.id
          );
          return {
            claimed: true,
            record: this.requireRecord(existing.id),
            reclaimed: true,
          };
        }

        return {
          claimed: false,
          record: existing,
          reason: SOCIAL_ACTIVE_STATUSES.includes(existing.status)
            ? 'in_progress'
            : 'terminal',
        };
      });

      return run();
    });
  }

  markRendering(id: number, patch: SocialPostPatch = {}): Promise<SocialPostRecord> {
    return runAsync(() => this.updateRecord(id, 'rendering', patch));
  }

  markUploading(id: number, patch: SocialPostPatch = {}): Promise<SocialPostRecord> {
    return runAsync(() => this.updateRecord(id, 'uploading', patch));
  }

  markPublishing(id: number, patch: SocialPostPatch = {}): Promise<SocialPostRecord> {
    return runAsync(() => this.updateRecord(id, 'publishing', patch));
  }

  markSent(
    id: number,
    patch: SocialPostPatch & { bufferPostId: string }
  ): Promise<SocialPostRecord> {
    return runAsync(() => {
      assertSentPatch(patch);
      return this.updateRecord(id, 'sent', patch);
    });
  }

  markSkipped(id: number, patch: SocialPostPatch = {}): Promise<SocialPostRecord> {
    return runAsync(() => this.updateRecord(id, 'skipped', patch));
  }

  markError(
    id: number,
    patch: SocialPostPatch & { error: string }
  ): Promise<SocialPostRecord> {
    return runAsync(() => {
      assertErrorPatch(patch);
      return this.updateRecord(id, 'error', patch);
    });
  }

  getBySlot(
    dateKey: string,
    slot: SocialSlot
  ): Promise<SocialPostRecord | null> {
    return runAsync(() => {
      const row = this.selectBySlot.get(dateKey, slot);
      return row ? toRecord(row) : null;
    });
  }

  getRecentFamilies(limit: number): Promise<SocialFamily[]> {
    return runAsync(() => {
      const safeLimit = Math.max(0, Math.trunc(limit));
      if (safeLimit === 0) {
        return [];
      }

      return this.recentFamiliesQuery
        .all(safeLimit)
        .map((row) => String(row.family) as SocialFamily);
    });
  }

  getRecentContent(
    limit: number,
    family?: SocialFamily
  ): Promise<SocialContentMetadata[]> {
    return runAsync(() => {
      const safeLimit = Math.max(0, Math.trunc(limit));
      if (safeLimit === 0) {
        return [];
      }

      const rows = family
        ? this.recentContentByFamilyQuery.all(family)
        : this.recentContentQuery.all();

      // Se filtra antes de recortar: las filas con metadata invalida no deben
      // consumir el limite de la rotacion.
      return rows
        .map((row) => parseMetadata(row.metadata_json))
        .filter(
          (metadata): metadata is SocialContentMetadata => metadata !== undefined
        )
        .slice(0, safeLimit);
    });
  }

  listRecentPosts(limit: number): Promise<SocialPostRecord[]> {
    return runAsync(() => {
      const safeLimit = Math.max(0, Math.trunc(limit));
      if (safeLimit === 0) {
        return [];
      }

      return this.recentPostsQuery.all(safeLimit).map(toRecord);
    });
  }

  close(): Promise<void> {
    return runAsync(() => {
      this.db.close();
    });
  }
}

/**
 * Migracion idempotente para volumenes creados antes de `metadata_json`.
 * `CREATE TABLE IF NOT EXISTS` no toca una tabla existente, asi que la columna
 * se anade solo cuando falta y nunca se reconstruye ni se pierden filas.
 */
function ensureMetadataColumn(db: import('bun:sqlite').Database): void {
  const columns = db
    .query<{ name: string }>('PRAGMA table_info(social_posts)')
    .all();
  if (!columns.some((column) => column.name === 'metadata_json')) {
    db.exec('ALTER TABLE social_posts ADD COLUMN metadata_json TEXT;');
  }
}

/**
 * Abre (o crea) el SQLite local. El import de `bun:sqlite` es dinamico a
 * proposito: el modulo solo se resuelve cuando el job de Bun arranca, nunca
 * durante Vitest ni el build de la web.
 */
export async function createBunSqliteStateStore(
  path: string,
  options: SocialStateStoreOptions = {}
): Promise<StateStore> {
  const directory = dirname(path);
  if (directory && directory !== '.') {
    await mkdir(directory, { recursive: true });
  }

  const { Database } = await import('bun:sqlite');
  const db = new Database(path, { create: true });

  try {
    db.exec('PRAGMA journal_mode = WAL;');
  } catch {
    // WAL es una optimizacion; un volumen que no lo soporte sigue funcionando.
  }

  db.exec('PRAGMA busy_timeout = 5000;');
  db.exec(CREATE_SCHEMA_SQL);
  ensureMetadataColumn(db);

  return new SqliteStateStore(db, options);
}
