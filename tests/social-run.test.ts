import { describe, expect, it, vi } from 'vitest';

import { captureExceptionWithContext } from '@/lib/sentry-reporting';
import type {
  BufferClient,
  BufferPostInput,
} from '@/lib/social/buffer';
import type { SocialConfig } from '@/lib/social/config';
import type { MediaHost } from '@/lib/social/media';
import { MemoryStateStore, type StateStore } from '@/lib/social/state';
import type {
  SocialAsset,
  SocialCarousel,
  SocialPostPatch,
  SocialPostRecord,
  SocialSlot,
  SocialSlotMeta,
  SocialStory,
} from '@/lib/social/types';

import { runSocialSlot, toSocialErrorMessage } from '@/jobs/social/shared';

vi.mock('@/lib/sentry-reporting', () => ({
  captureExceptionWithContext: vi.fn(),
  captureWarningWithContext: vi.fn(),
  forwardLogToSentry: vi.fn(),
}));

const captureExceptionMock = vi.mocked(captureExceptionWithContext);

const NOW = new Date('2026-10-27T07:30:00.000Z');
const STORY_DATE_KEY = '2026-10-27';
const WEEK_DATE_KEY = '2026-10-26';

const JPEG = new Uint8Array([0xff, 0xd8, 0xff, 0x01]);

function makeConfig(overrides: Partial<SocialConfig> = {}): SocialConfig {
  return {
    enabled: true,
    city: 'zaragoza',
    timezone: 'Europe/Madrid',
    stateDbPath: ':memory:',
    dryRun: false,
    imageHost: 'tmpfiles',
    bufferApiKey: 'test-key',
    bufferChannelId: 'channel-1',
    tmpfilesExpireSeconds: 7200,
    catchupMinutes: 120,
    ...overrides,
  };
}

function makeStory(overrides: Partial<SocialStory> = {}): SocialStory {
  return {
    slot: 'morning',
    family: 'daily-story',
    dateKey: STORY_DATE_KEY,
    headline: '3 estaciones clave agotadas',
    facts: [{ label: 'Red', value: 'Óptima' }],
    footer: 'datosbizi.com · datos abiertos GBFS',
    caption: 'Story de la mañana · 3 estaciones agotadas',
    altText: 'Imagen vertical de la story del martes',
    ...overrides,
  };
}

function makeCarousel(): SocialCarousel {
  return {
    slot: 'weekly',
    family: 'weekly-carousel',
    dateKey: WEEK_DATE_KEY,
    headline: 'Zaragoza en bici · semana del 19 al 25 de octubre',
    facts: [{ label: 'Distritos', value: '10' }],
    footer: 'datosbizi.com · datos abiertos GBFS',
    caption: 'Carrusel semanal con los distritos',
    altText: 'Carrusel de 5 imágenes de la semana',
    slides: Array.from({ length: 5 }, (_, index) => ({
      kicker: `kicker ${index + 1}`,
      headline: `Lamina ${index + 1}`,
      facts: [],
      footer: 'datosbizi.com · datos abiertos GBFS',
      accent: '#0f766e',
    })),
  };
}

/** Envuelve el store real para comprobar el orden de las transiciones. */
class RecordingState implements StateStore {
  constructor(
    private readonly inner: MemoryStateStore,
    readonly events: string[]
  ) {}

  claimSlot(
    dateKey: string,
    slot: SocialSlot,
    meta?: SocialSlotMeta
  ) {
    this.events.push('claim');
    return this.inner.claimSlot(dateKey, slot, meta);
  }

  markRendering(id: number, patch?: SocialPostPatch): Promise<SocialPostRecord> {
    this.events.push('rendering');
    return this.inner.markRendering(id, patch);
  }

  markUploading(id: number, patch?: SocialPostPatch): Promise<SocialPostRecord> {
    this.events.push('uploading');
    return this.inner.markUploading(id, patch);
  }

  markPublishing(id: number, patch?: SocialPostPatch): Promise<SocialPostRecord> {
    this.events.push('publishing');
    return this.inner.markPublishing(id, patch);
  }

  markSent(
    id: number,
    patch: SocialPostPatch & { bufferPostId: string }
  ): Promise<SocialPostRecord> {
    this.events.push('sent');
    return this.inner.markSent(id, patch);
  }

  markSkipped(id: number, patch?: SocialPostPatch): Promise<SocialPostRecord> {
    this.events.push('skipped');
    return this.inner.markSkipped(id, patch);
  }

  markError(
    id: number,
    patch: SocialPostPatch & { error: string }
  ): Promise<SocialPostRecord> {
    this.events.push('error');
    return this.inner.markError(id, patch);
  }

  getBySlot(dateKey: string, slot: SocialSlot): Promise<SocialPostRecord | null> {
    return this.inner.getBySlot(dateKey, slot);
  }

  getRecentFamilies(limit: number) {
    return this.inner.getRecentFamilies(limit);
  }

  close(): Promise<void> {
    return this.inner.close();
  }
}

function createMedia(
  events: string[],
  options: { fail?: boolean } = {}
): { media: MediaHost; calls: Array<{ images: readonly Uint8Array[]; baseName: string }> } {
  const calls: Array<{ images: readonly Uint8Array[]; baseName: string }> = [];

  const media: MediaHost = {
    upload: async () => {
      throw new Error('upload() is not used by the runner');
    },
    uploadMany: async (images, baseName) => {
      events.push('media:uploadMany');
      calls.push({ images, baseName });

      if (options.fail) {
        throw new Error('tmpfiles upload failed');
      }

      return images.map<SocialAsset>((_, index) => ({
        pageUrl: `https://tmpfiles.org/${index}`,
        directUrl: `https://tmpfiles.org/dl/${index}/image.jpg`,
      }));
    },
  };

  return { media, calls };
}

function createBuffer(
  events: string[],
  options: { fail?: boolean } = {}
): { buffer: BufferClient; posts: BufferPostInput[] } {
  const posts: BufferPostInput[] = [];

  const buffer: BufferClient = {
    createPost: async (input) => {
      events.push('buffer:createPost');
      posts.push(input);

      if (options.fail) {
        throw new Error('Buffer rejected the post');
      }

      return { id: 'buffer-post-1', status: 'sent' };
    },
    listOrganizations: async () => [],
    listChannels: async () => [],
  };

  return { buffer, posts };
}

function createRender(
  events: string[],
  images: Uint8Array[] = [JPEG]
): { render: (content: SocialStory | SocialCarousel) => Uint8Array[] } {
  return {
    render: (content) => {
      events.push('render');
      return content.slot === 'weekly' || content.slot === 'monthly'
        ? images.slice(0, 5)
        : images.slice(0, 1);
    },
  };
}

describe('runSocialSlot', () => {
  it('claims, renders, uploads and publishes a story in order', async () => {
    const events: string[] = [];
    const store = new RecordingState(
      new MemoryStateStore({ now: () => NOW }),
      events
    );
    const { media, calls: mediaCalls } = createMedia(events);
    const { buffer, posts } = createBuffer(events);
    const { render } = createRender(events);
    const story = makeStory();

    await runSocialSlot({
      slot: 'morning',
      dateKey: STORY_DATE_KEY,
      now: NOW,
      config: makeConfig(),
      state: store,
      media,
      buffer,
      build: async () => story,
      render,
    });

    expect(events).toEqual([
      'claim',
      'rendering',
      'render',
      'uploading',
      'media:uploadMany',
      'publishing',
      'buffer:createPost',
      'sent',
    ]);

    expect(mediaCalls[0]?.baseName).toBe('social-morning-2026-10-27');
    expect(mediaCalls[0]?.images).toHaveLength(1);

    expect(posts[0]).toMatchObject({
      text: story.caption,
      altText: story.altText,
      format: 'story',
      shouldShareToFeed: false,
      channelId: 'channel-1',
    });
    expect(posts[0]?.assets).toHaveLength(1);

    const record = await store.getBySlot(STORY_DATE_KEY, 'morning');
    expect(record).toMatchObject({
      status: 'sent',
      bufferPostId: 'buffer-post-1',
      caption: story.caption,
      altText: story.altText,
    });
    expect(record?.assetUrls).toHaveLength(1);
  });

  it('does not build or publish when the slot is already claimed', async () => {
    const events: string[] = [];
    const store = new RecordingState(
      new MemoryStateStore({ now: () => NOW }),
      events
    );
    const { media, calls: mediaCalls } = createMedia(events);
    const { buffer, posts } = createBuffer(events);
    const build = vi.fn(async () => makeStory());
    const render = vi.fn(() => [JPEG]);

    await store.claimSlot(STORY_DATE_KEY, 'morning');
    events.length = 0;

    await runSocialSlot({
      slot: 'morning',
      dateKey: STORY_DATE_KEY,
      now: NOW,
      config: makeConfig(),
      state: store,
      media,
      buffer,
      build,
      render,
    });

    expect(build).not.toHaveBeenCalled();
    expect(render).not.toHaveBeenCalled();
    expect(mediaCalls).toHaveLength(0);
    expect(posts).toHaveLength(0);
    expect(events).toEqual(['claim']);
  });

  it('does not republish a stale publishing slot and reports it to Sentry', async () => {
    let now = new Date('2026-10-27T07:00:00.000Z');
    const store = new MemoryStateStore({ now: () => now });
    const claimed = await store.claimSlot(STORY_DATE_KEY, 'morning');
    if (!claimed.claimed) {
      throw new Error(`Expected a claim, got ${claimed.reason}`);
    }

    await store.markRendering(claimed.record.id);
    await store.markUploading(claimed.record.id);
    await store.markPublishing(claimed.record.id, {
      assets: [
        {
          pageUrl: 'https://tmpfiles.org/1/image.jpg',
          directUrl: 'https://tmpfiles.org/dl/1/image.jpg',
        },
      ],
    });

    now = new Date('2026-10-27T07:15:01.000Z');

    const events: string[] = [];
    const { media, calls: mediaCalls } = createMedia(events);
    const { buffer, posts } = createBuffer(events);
    const build = vi.fn(async () => makeStory());
    const render = vi.fn(() => [JPEG]);
    captureExceptionMock.mockClear();

    await runSocialSlot({
      slot: 'morning',
      dateKey: STORY_DATE_KEY,
      now,
      config: makeConfig(),
      state: store,
      media,
      buffer,
      build,
      render,
    });

    expect(build).not.toHaveBeenCalled();
    expect(render).not.toHaveBeenCalled();
    expect(mediaCalls).toHaveLength(0);
    expect(posts).toHaveLength(0);

    const record = await store.getBySlot(STORY_DATE_KEY, 'morning');
    expect(record).toMatchObject({
      id: claimed.record.id,
      status: 'publishing',
      bufferPostId: null,
    });
    expect(record?.assetUrls).toHaveLength(1);

    expect(captureExceptionMock).toHaveBeenCalledTimes(1);
    const call = captureExceptionMock.mock.calls[0];
    expect((call?.[0] as Error).message).toContain('requires manual review');
    expect(call?.[1]).toMatchObject({
      area: 'jobs.social',
      operation: 'morning',
      extra: expect.objectContaining({
        dateKey: STORY_DATE_KEY,
        slot: 'morning',
        recordId: claimed.record.id,
      }),
    });
  });

  it('reports a state claim failure to Sentry and rethrows', async () => {
    captureExceptionMock.mockClear();
    const state = {
      claimSlot: vi.fn(async () => {
        throw new Error('sqlite is unavailable');
      }),
    } as unknown as StateStore;
    const { media } = createMedia([]);
    const { buffer } = createBuffer([]);

    await expect(
      runSocialSlot({
        slot: 'morning',
        dateKey: STORY_DATE_KEY,
        now: NOW,
        config: makeConfig(),
        state,
        media,
        buffer,
        build: async () => makeStory(),
        render: () => [JPEG],
      })
    ).rejects.toThrow('sqlite is unavailable');

    expect(captureExceptionMock).toHaveBeenCalledTimes(1);
    expect(captureExceptionMock.mock.calls[0]?.[1]).toMatchObject({
      area: 'jobs.social',
      operation: 'morning',
      extra: { dateKey: STORY_DATE_KEY, slot: 'morning', stage: 'claim' },
    });
  });

  it('marks a slot as skipped when there is not enough data', async () => {
    const events: string[] = [];
    const store = new RecordingState(
      new MemoryStateStore({ now: () => NOW }),
      events
    );
    const { media, calls: mediaCalls } = createMedia(events);
    const { buffer, posts } = createBuffer(events);
    const render = vi.fn(() => [JPEG]);
    captureExceptionMock.mockClear();

    await runSocialSlot({
      slot: 'afternoon',
      dateKey: STORY_DATE_KEY,
      now: NOW,
      config: makeConfig(),
      state: store,
      media,
      buffer,
      build: async () => null,
      render,
    });

    expect(render).not.toHaveBeenCalled();
    expect(mediaCalls).toHaveLength(0);
    expect(posts).toHaveLength(0);

    const record = await store.getBySlot(STORY_DATE_KEY, 'afternoon');
    expect(record).toMatchObject({ status: 'skipped', error: 'insufficient_data' });
    expect(captureExceptionMock).toHaveBeenCalledTimes(1);
    expect((captureExceptionMock.mock.calls[0]?.[0] as Error).message).toContain(
      'insufficient data'
    );
  });

  it('does not render, upload or publish in dry run', async () => {
    const events: string[] = [];
    const store = new RecordingState(
      new MemoryStateStore({ now: () => NOW }),
      events
    );
    const { media, calls: mediaCalls } = createMedia(events);
    const { buffer, posts } = createBuffer(events);
    const render = vi.fn(() => [JPEG]);

    await runSocialSlot({
      slot: 'morning',
      dateKey: STORY_DATE_KEY,
      now: NOW,
      config: makeConfig({ dryRun: true }),
      state: store,
      media,
      buffer,
      build: async () => makeStory(),
      render,
    });

    expect(render).not.toHaveBeenCalled();
    expect(mediaCalls).toHaveLength(0);
    expect(posts).toHaveLength(0);

    const record = await store.getBySlot(STORY_DATE_KEY, 'morning');
    expect(record).toMatchObject({
      status: 'skipped',
      error: 'dry_run',
      caption: 'Story de la mañana · 3 estaciones agotadas',
    });
  });

  it('marks an error and never calls Buffer when the media upload fails', async () => {
    const events: string[] = [];
    const store = new RecordingState(
      new MemoryStateStore({ now: () => NOW }),
      events
    );
    const { media } = createMedia(events, { fail: true });
    const { buffer, posts } = createBuffer(events);

    await expect(
      runSocialSlot({
        slot: 'morning',
        dateKey: STORY_DATE_KEY,
        now: NOW,
        config: makeConfig(),
        state: store,
        media,
        buffer,
        build: async () => makeStory(),
        render: createRender(events).render,
      })
    ).rejects.toThrow('tmpfiles upload failed');

    expect(posts).toHaveLength(0);
    const record = await store.getBySlot(STORY_DATE_KEY, 'morning');
    expect(record).toMatchObject({
      status: 'error',
      error: 'tmpfiles upload failed',
      bufferPostId: null,
    });
  });

  it('marks an error and does not mark sent when Buffer fails', async () => {
    const events: string[] = [];
    const store = new RecordingState(
      new MemoryStateStore({ now: () => NOW }),
      events
    );
    const { media } = createMedia(events);
    const { buffer, posts } = createBuffer(events, { fail: true });

    await expect(
      runSocialSlot({
        slot: 'morning',
        dateKey: STORY_DATE_KEY,
        now: NOW,
        config: makeConfig(),
        state: store,
        media,
        buffer,
        build: async () => makeStory(),
        render: createRender(events).render,
      })
    ).rejects.toThrow('Buffer rejected the post');

    expect(posts).toHaveLength(1);
    expect(events).not.toContain('sent');
    const record = await store.getBySlot(STORY_DATE_KEY, 'morning');
    expect(record).toMatchObject({
      status: 'error',
      error: 'Buffer rejected the post',
      bufferPostId: null,
    });
  });

  it('publishes a carousel with five assets and shares it to the feed', async () => {
    const events: string[] = [];
    const store = new RecordingState(
      new MemoryStateStore({ now: () => NOW }),
      events
    );
    const { media, calls: mediaCalls } = createMedia(events);
    const { buffer, posts } = createBuffer(events);
    const carousel = makeCarousel();

    await runSocialSlot({
      slot: 'weekly',
      dateKey: WEEK_DATE_KEY,
      now: NOW,
      config: makeConfig(),
      state: store,
      media,
      buffer,
      build: async () => carousel,
      render: createRender(events, [JPEG, JPEG, JPEG, JPEG, JPEG]).render,
    });

    expect(mediaCalls[0]?.images).toHaveLength(5);
    expect(posts[0]).toMatchObject({
      text: carousel.caption,
      altText: carousel.altText,
      format: 'carousel',
      shouldShareToFeed: true,
      channelId: 'channel-1',
    });
    expect(posts[0]?.assets).toHaveLength(5);

    const record = await store.getBySlot(WEEK_DATE_KEY, 'weekly');
    expect(record?.status).toBe('sent');
    expect(record?.assetUrls).toHaveLength(5);
  });

  it('rejects a carousel with the wrong number of rendered images', async () => {
    const events: string[] = [];
    const store = new RecordingState(
      new MemoryStateStore({ now: () => NOW }),
      events
    );
    const { media, calls: mediaCalls } = createMedia(events);
    const { buffer, posts } = createBuffer(events);

    await expect(
      runSocialSlot({
        slot: 'weekly',
        dateKey: WEEK_DATE_KEY,
        now: NOW,
        config: makeConfig(),
        state: store,
        media,
        buffer,
        build: async () => makeCarousel(),
        render: () => [JPEG],
      })
    ).rejects.toThrow('expected 5');

    expect(mediaCalls).toHaveLength(0);
    expect(posts).toHaveLength(0);
    const record = await store.getBySlot(WEEK_DATE_KEY, 'weekly');
    expect(record?.status).toBe('error');
  });

  it('truncates long error messages for the state', () => {
    expect(toSocialErrorMessage(new Error('x'.repeat(900))).length).toBe(501);
    expect(toSocialErrorMessage('  boom  ')).toBe('boom');
    expect(toSocialErrorMessage({ weird: true })).toBe('Unknown social slot error');
  });
});
