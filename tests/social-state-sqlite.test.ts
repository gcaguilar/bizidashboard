import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { afterEach, describe, expect, it } from 'vitest';

const STATE_MODULE = fileURLToPath(
  new URL('../src/lib/social/state.ts', import.meta.url)
);
const REPO_ROOT = fileURLToPath(new URL('..', import.meta.url));

/**
 * Vitest corre en Node y no puede resolver `bun:sqlite`. Estos tests lanzan un
 * proceso Bun real con un SQLite temporal: comprueban la migracion y el
 * round-trip contra SQLite de verdad, no contra un doble en memoria.
 */
function runBun(script: string, dbPath: string): unknown {
  const output = execFileSync('bun', ['-e', script], {
    cwd: REPO_ROOT,
    encoding: 'utf8',
    env: { ...process.env, DB: dbPath, NO_COLOR: '1' },
  }).trim();

  return JSON.parse(output) as unknown;
}

const temporaryDirectories: string[] = [];

function createDatabasePath(): string {
  const directory = mkdtempSync(join(tmpdir(), 'social-state-'));
  temporaryDirectories.push(directory);
  return join(directory, 'social-state.db');
}

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) {
    rmSync(directory, { recursive: true, force: true });
  }
});

const LEGACY_SCHEMA = `
  CREATE TABLE social_posts (
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
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    published_at TEXT,
    UNIQUE(date_key, slot)
  );
`;

const CURRENT_COLUMNS =
  'date_key, slot, family, status, caption, alt_text, asset_urls, buffer_post_id, error, metadata_json, created_at, updated_at, published_at';

describe('SqliteStateStore', () => {
  it('adds metadata_json to a legacy volume exactly once and keeps its rows', () => {
    const dbPath = createDatabasePath();
    const result = runBun(
      `
        import { Database } from 'bun:sqlite';
        import { createBunSqliteStateStore } from ${JSON.stringify(STATE_MODULE)};

        const path = process.env.DB;
        const legacy = new Database(path, { create: true });
        legacy.exec(${JSON.stringify(LEGACY_SCHEMA)});
        legacy.query(
          \`INSERT INTO social_posts
            (date_key, slot, family, status, caption, alt_text, asset_urls,
             buffer_post_id, error, created_at, updated_at, published_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)\`
        ).run(
          '2026-10-20', 'morning', 'daily-story', 'sent', 'legacy caption',
          'legacy alt', '[]', 'buffer-legacy', null,
          '2026-10-20T07:30:00.000Z', '2026-10-20T07:30:00.000Z',
          '2026-10-20T07:30:00.000Z'
        );
        legacy.close();

        const first = await createBunSqliteStateStore(path);
        const legacyRecord = await first.getBySlot('2026-10-20', 'morning');
        await first.close();

        // Abrir una segunda vez no debe intentar el ALTER otra vez.
        const second = await createBunSqliteStateStore(path);
        const again = await second.getBySlot('2026-10-20', 'morning');
        const recent = await second.getRecentContent(5);
        await second.close();

        const inspector = new Database(path);
        const columns = inspector
          .query('PRAGMA table_info(social_posts)')
          .all()
          .map((column) => column.name);
        const rows = inspector
          .query('SELECT COUNT(*) AS count FROM social_posts')
          .get();
        inspector.close();

        console.log(JSON.stringify({ legacyRecord, again, recent, columns, rows }));
      `,
      dbPath
    );

    expect(result).toMatchObject({
      legacyRecord: {
        dateKey: '2026-10-20',
        status: 'sent',
        caption: 'legacy caption',
        bufferPostId: 'buffer-legacy',
      },
      again: {
        dateKey: '2026-10-20',
        status: 'sent',
        caption: 'legacy caption',
        bufferPostId: 'buffer-legacy',
      },
      recent: [],
      rows: { count: 1 },
    });
    expect(
      (result as { legacyRecord: Record<string, unknown> }).legacyRecord
    ).not.toHaveProperty('metadata');
    expect((result as { columns: string[] }).columns).toContain('metadata_json');
    expect(
      (result as { columns: string[] }).columns.filter(
        (column) => column === 'metadata_json'
      )
    ).toHaveLength(1);
  });

  it('round-trips metadata and orders/limits valid recent content', () => {
    const dbPath = createDatabasePath();
    const result = runBun(
      `
        import { Database } from 'bun:sqlite';
        import { createBunSqliteStateStore } from ${JSON.stringify(STATE_MODULE)};

        const path = process.env.DB;
        let clock = new Date('2026-10-26T07:30:00.000Z');
        const store = await createBunSqliteStateStore(path, {
          now: () => clock,
        });

        async function send(dateKey, slot, bufferPostId, metadata) {
          const claim = await store.claimSlot(dateKey, slot);
          if (!claim.claimed) throw new Error('claim failed: ' + claim.reason);
          await store.markRendering(claim.record.id);
          await store.markUploading(claim.record.id);
          await store.markPublishing(claim.record.id);
          return store.markSent(claim.record.id, { bufferPostId, metadata });
        }

        const morning = await send('2026-10-26', 'morning', 'buffer-1', {
          stationIds: ['s1', 's2'],
          districtNames: ['Centro'],
          spotlightDistrict: 'Centro',
        });

        clock = new Date('2026-10-26T17:30:00.000Z');
        await send('2026-10-26', 'afternoon', 'buffer-2', {
          stationIds: ['s3'],
        });

        clock = new Date('2026-10-27T08:00:00.000Z');
        await send('2026-10-26', 'weekly', 'buffer-3', {
          stationIds: ['s4'],
        });

        await store.close();

        // Filas invalidas mas recientes: no deben colarse en la rotacion.
        const raw = new Database(path);
        raw.query(
          \`INSERT INTO social_posts
            (${CURRENT_COLUMNS})
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)\`
        ).run(
          '2026-10-27', 'midday', 'daily-story', 'sent', null, null, '[]',
          'buffer-bad', null, '{broken', '2026-10-27T09:00:00.000Z',
          '2026-10-27T09:00:00.000Z', '2026-10-27T09:00:00.000Z'
        );
        raw.query(
          \`INSERT INTO social_posts
            (${CURRENT_COLUMNS})
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)\`
        ).run(
          '2026-10-27', 'afternoon', 'daily-story', 'sent', null, null, '[]',
          'buffer-bad-shape', null, '{"stationIds":"s9"}',
          '2026-10-27T10:00:00.000Z', '2026-10-27T10:00:00.000Z',
          '2026-10-27T10:00:00.000Z'
        );
        raw.close();

        const reopened = await createBunSqliteStateStore(path);
        const stored = await reopened.getBySlot('2026-10-26', 'morning');
        const top = await reopened.getRecentContent(2);
        const all = await reopened.getRecentContent(10);
        const weekly = await reopened.getRecentContent(10, 'weekly-carousel');
        const none = await reopened.getRecentContent(0);
        await reopened.close();

        console.log(
          JSON.stringify({
            morningMetadata: morning.metadata,
            storedMetadata: stored?.metadata,
            top,
            all,
            weekly,
            none,
          })
        );
      `,
      dbPath
    );

    expect(result).toEqual({
      morningMetadata: { stationIds: ['s1', 's2'], districtNames: ['Centro'], spotlightDistrict: 'Centro' },
      storedMetadata: { stationIds: ['s1', 's2'], districtNames: ['Centro'], spotlightDistrict: 'Centro' },
      top: [{ stationIds: ['s4'] }, { stationIds: ['s3'] }],
      all: [
        { stationIds: ['s4'] },
        { stationIds: ['s3'] },
        { stationIds: ['s1', 's2'], districtNames: ['Centro'], spotlightDistrict: 'Centro' },
      ],
      weekly: [{ stationIds: ['s4'] }],
      none: [],
    });
  });
});

describe('SqliteStateStore recent posts', () => {
  it('lists posts of any status ordered by recency', () => {
    const dbPath = createDatabasePath();
    const result = runBun(
      `
        import { createBunSqliteStateStore } from ${JSON.stringify(STATE_MODULE)};
        const path = process.env.DB;
        const store = await createBunSqliteStateStore(path);

        async function send(dateKey, slot, bufferPostId) {
          const claim = await store.claimSlot(dateKey, slot);
          if (!claim.claimed) throw new Error('claim failed');
          await store.markRendering(claim.record.id);
          await store.markUploading(claim.record.id);
          await store.markPublishing(claim.record.id);
          return store.markSent(claim.record.id, { bufferPostId });
        }

        await send('2026-10-26', 'morning', 'buffer-morning');
        const midday = await store.claimSlot('2026-10-26', 'midday');
        if (!midday.claimed) throw new Error('claim failed');
        await store.markSkipped(midday.record.id, { error: 'no data' });
        await send('2026-10-28', 'feature', 'buffer-feature');

        const recent = await store.listRecentPosts(10);
        const limited = await store.listRecentPosts(1);
        const none = await store.listRecentPosts(0);
        await store.close();

        console.log(JSON.stringify({
          slots: recent.map((record) => record.slot),
          statuses: recent.map((record) => record.status),
          limited: limited.map((record) => record.slot),
          none,
        }));
      `,
      dbPath
    );

    expect(result).toEqual({
      slots: ['feature', 'midday', 'morning'],
      statuses: ['sent', 'skipped', 'sent'],
      limited: ['feature'],
      none: [],
    });
  });
});
