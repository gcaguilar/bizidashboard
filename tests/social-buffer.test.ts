import { describe, expect, it, vi } from 'vitest';

import {
  BufferApiError,
  BufferGraphQLClient,
  type BufferClient,
  type FetchLike,
} from '@/lib/social/buffer';
import type { SocialAsset } from '@/lib/social/types';

const API_KEY = 'buffer-secret-key';
const CHANNEL_ID = 'channel-1';
const ENDPOINT = 'https://buffer.test/graphql';

function asset(index: number): SocialAsset {
  return {
    pageUrl: `https://tmpfiles.test/${index}/photo.jpg`,
    directUrl: `https://tmpfiles.test/dl/${index}/photo.jpg`,
  };
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

function successResponse(id = 'post-1', status = 'sent'): Response {
  return jsonResponse({
    data: {
      createPost: {
        __typename: 'PostActionSuccess',
        post: { id, status },
      },
    },
  });
}

function fakeFetch(): ReturnType<typeof vi.fn<FetchLike>> {
  return vi.fn<FetchLike>(async () => successResponse());
}

function client(fetch: FetchLike, overrides: {
  apiKey?: string | null;
  channelId?: string | null;
} = {}): BufferClient {
  return new BufferGraphQLClient({
    apiKey: overrides.apiKey === undefined ? API_KEY : overrides.apiKey,
    channelId:
      overrides.channelId === undefined ? CHANNEL_ID : overrides.channelId,
    endpoint: ENDPOINT,
    fetch,
    timeoutMs: 5_000,
  });
}

type GraphQLBody = {
  query: string;
  variables: {
    input?: {
      text: string;
      channelId: string;
      schedulingType: string;
      mode: string;
      assets: Array<{ image: Record<string, unknown> }>;
      metadata: {
        instagram: { type: string; shouldShareToFeed: boolean };
      };
    };
    organizationId?: string;
  };
};

function bodyOf(fetch: ReturnType<typeof vi.fn<FetchLike>>): GraphQLBody {
  return JSON.parse(String(fetch.mock.calls[0]![1]?.body)) as GraphQLBody;
}

async function expectBufferError(
  promise: Promise<unknown>,
  code: string
): Promise<BufferApiError> {
  try {
    await promise;
  } catch (error) {
    expect(error).toBeInstanceOf(BufferApiError);
    const apiError = error as BufferApiError;
    expect(apiError.code).toBe(code);
    return apiError;
  }

  throw new Error(`Expected a BufferApiError with code ${code}`);
}

const storyInput = {
  text: 'Story de prueba · datosbizi.com',
  assets: [asset(1)],
  format: 'story' as const,
  shouldShareToFeed: false,
};

const carouselAssets = [1, 2, 3, 4, 5].map((index) => asset(index));

describe('BufferGraphQLClient createPost', () => {
  it('creates a story with one asset, shareNow and no feed sharing', async () => {
    const fetch = fakeFetch();
    fetch.mockResolvedValueOnce(successResponse('story-1', 'queued'));

    const result = await client(fetch).createPost(storyInput);

    expect(result).toEqual({ id: 'story-1', status: 'queued' });
    expect(fetch).toHaveBeenCalledTimes(1);

    const headers = new Headers(fetch.mock.calls[0]![1]?.headers);
    expect(headers.get('authorization')).toBe(`Bearer ${API_KEY}`);
    expect(headers.get('content-type')).toBe('application/json');

    const body = bodyOf(fetch);
    const compactQuery = body.query.replace(/\s+/gu, ' ');
    expect(compactQuery).toContain(
      'mutation CreatePost($input: CreatePostInput!)'
    );
    expect(compactQuery).toContain('... on PostActionSuccess');
    expect(compactQuery).toContain('post { id status }');
    expect(compactQuery).toContain('... on MutationError');
    // El texto viaja como variable, nunca interpolado en la query.
    expect(body.query).not.toContain(storyInput.text);

    expect(body.variables.input).toEqual({
      text: storyInput.text,
      channelId: CHANNEL_ID,
      schedulingType: 'automatic',
      mode: 'shareNow',
      assets: [{ image: { url: asset(1).directUrl } }],
      metadata: {
        instagram: { type: 'story', shouldShareToFeed: false },
      },
    });
    expect(body.variables.input?.assets[0]?.image).not.toHaveProperty(
      'metadata'
    );
  });

  it('creates a five-slide carousel preserving asset order and alt text', async () => {
    const fetch = fakeFetch();

    await client(fetch).createPost({
      text: 'Carrusel semanal',
      assets: carouselAssets,
      format: 'carousel',
      shouldShareToFeed: true,
      altText: '  Carrusel de cinco imágenes de Zaragoza  ',
    });

    const body = bodyOf(fetch);
    const input = body.variables.input!;

    expect(input.assets).toHaveLength(5);
    expect(input.assets.map((entry) => entry.image.url)).toEqual(
      carouselAssets.map((entry) => entry.directUrl)
    );
    expect(input.assets[0]?.image.metadata).toEqual({
      altText: 'Carrusel de cinco imágenes de Zaragoza',
    });
    expect(input.metadata).toEqual({
      instagram: { type: 'post', shouldShareToFeed: true },
    });
    expect(input.mode).toBe('shareNow');
    expect(input.schedulingType).toBe('automatic');
  });

  it('does not send an empty alt text', async () => {
    const fetch = fakeFetch();

    await client(fetch).createPost({
      ...storyInput,
      altText: '   ',
    });

    const images = bodyOf(fetch).variables.input!.assets;
    expect(images[0]?.image).not.toHaveProperty('metadata');
  });

  it('does not send alt text on stories', async () => {
    const fetch = fakeFetch();

    await client(fetch).createPost({
      ...storyInput,
      altText: 'Story sobre estaciones agotadas',
    });

    const images = bodyOf(fetch).variables.input!.assets;
    expect(images[0]?.image).not.toHaveProperty('metadata');
  });

  it('uses an explicit channel override', async () => {
    const fetch = fakeFetch();

    await client(fetch).createPost({
      ...storyInput,
      channelId: 'override-channel',
    });

    expect(bodyOf(fetch).variables.input?.channelId).toBe('override-channel');
  });

  it('rejects a story without exactly one asset', async () => {
    const fetch = fakeFetch();

    await expectBufferError(
      client(fetch).createPost({
        ...storyInput,
        assets: [asset(1), asset(2)],
      }),
      'invalid_input'
    );

    expect(fetch).not.toHaveBeenCalled();
  });

  it('rejects a carousel outside 2-20 assets', async () => {
    const fetch = fakeFetch();

    await expectBufferError(
      client(fetch).createPost({
        text: 'Carrusel',
        assets: [asset(1)],
        format: 'carousel',
        shouldShareToFeed: true,
      }),
      'invalid_input'
    );

    await expectBufferError(
      client(fetch).createPost({
        text: 'Carrusel',
        assets: Array.from({ length: 21 }, (_, index) => asset(index)),
        format: 'carousel',
        shouldShareToFeed: true,
      }),
      'invalid_input'
    );

    expect(fetch).not.toHaveBeenCalled();
  });

  it('parses a PostActionSuccess result', async () => {
    const fetch = fakeFetch();
    fetch.mockResolvedValueOnce(successResponse('post-42', 'shared'));

    await expect(client(fetch).createPost(storyInput)).resolves.toEqual({
      id: 'post-42',
      status: 'shared',
    });
  });

  it('reports a MutationError', async () => {
    const fetch = fakeFetch();
    fetch.mockResolvedValueOnce(
      jsonResponse({
        data: {
          createPost: {
            __typename: 'MutationError',
            message: 'The channel is not connected',
          },
        },
      })
    );

    const error = await expectBufferError(
      client(fetch).createPost(storyInput),
      'mutation_error'
    );

    expect(error.message).toBe('The channel is not connected');
  });

  it('reports an InvalidInputError with its message', async () => {
    const fetch = fakeFetch();
    fetch.mockResolvedValueOnce(
      jsonResponse({
        data: {
          createPost: {
            __typename: 'InvalidInputError',
            message: "Instagram does not support the 'carousel' post type",
          },
        },
      })
    );

    const error = await expectBufferError(
      client(fetch).createPost(storyInput),
      'mutation_error'
    );

    expect(error.message).toBe(
      "Instagram does not support the 'carousel' post type"
    );
  });

  it('reports top-level GraphQL errors', async () => {
    const fetch = fakeFetch();
    fetch.mockResolvedValueOnce(
      jsonResponse({ errors: [{ message: 'Invalid input' }] })
    );

    const error = await expectBufferError(
      client(fetch).createPost(storyInput),
      'graphql_error'
    );

    expect(error.graphqlErrors).toEqual(['Invalid input']);
  });

  it('reports an HTTP error with its status', async () => {
    const fetch = fakeFetch();
    fetch.mockResolvedValueOnce(
      new Response('upstream unavailable', { status: 500 })
    );

    const error = await expectBufferError(
      client(fetch).createPost(storyInput),
      'http_error'
    );

    expect(error.status).toBe(500);
  });

  it('reports malformed GraphQL payloads', async () => {
    const fetch = fakeFetch();
    fetch.mockResolvedValueOnce(
      jsonResponse({
        data: {
          createPost: { __typename: 'PostActionSuccess', post: null },
        },
      })
    );

    await expectBufferError(
      client(fetch).createPost(storyInput),
      'malformed_response'
    );
  });

  it('reports a network failure', async () => {
    const fetch = fakeFetch();
    fetch.mockRejectedValueOnce(new TypeError('fetch failed'));

    await expectBufferError(
      client(fetch).createPost(storyInput),
      'network_error'
    );
  });

  it('reports a timeout', async () => {
    const fetch = fakeFetch();
    fetch.mockRejectedValueOnce(
      new DOMException('The operation timed out', 'TimeoutError')
    );

    await expectBufferError(client(fetch).createPost(storyInput), 'timeout');
  });
});

describe('BufferGraphQLClient configuration', () => {
  it('fails clearly when the API key is missing', async () => {
    const fetch = fakeFetch();

    const error = await expectBufferError(
      client(fetch, { apiKey: null }).createPost(storyInput),
      'missing_api_key'
    );

    expect(error.message).toContain('BUFFER_API_KEY');
    expect(fetch).not.toHaveBeenCalled();
  });

  it('fails clearly when the channel id is missing', async () => {
    const fetch = fakeFetch();

    const error = await expectBufferError(
      client(fetch, { channelId: null }).createPost(storyInput),
      'missing_channel_id'
    );

    expect(error.message).toContain('BUFFER_CHANNEL_ID');
    expect(fetch).not.toHaveBeenCalled();
  });
});

describe('BufferGraphQLClient discovery', () => {
  it('lists organizations', async () => {
    const fetch = fakeFetch();
    fetch.mockResolvedValueOnce(
      jsonResponse({
        data: {
          account: {
            organizations: [
              { id: 'org-1', name: 'DatosBizi' },
              { id: 'org-2', name: 'Otra cuenta' },
            ],
          },
        },
      })
    );

    await expect(client(fetch).listOrganizations()).resolves.toEqual([
      { id: 'org-1', name: 'DatosBizi' },
      { id: 'org-2', name: 'Otra cuenta' },
    ]);

    const body = bodyOf(fetch);
    expect(body.query.replace(/\s+/gu, ' ')).toContain(
      'account { organizations { id name } }'
    );
    expect(body.variables).toEqual({});
    expect(fetch.mock.calls[0]![0]).toBe(ENDPOINT);
  });

  it('lists channels for an organization using a variable', async () => {
    const fetch = fakeFetch();
    fetch.mockResolvedValueOnce(
      jsonResponse({
        data: {
          channels: [
            { id: 'channel-1', name: 'DatosBizi IG', service: 'instagram' },
            { id: 'channel-2', name: 'Sin servicio', service: null },
          ],
        },
      })
    );

    await expect(client(fetch).listChannels('org-1')).resolves.toEqual([
      { id: 'channel-1', name: 'DatosBizi IG', service: 'instagram' },
      { id: 'channel-2', name: 'Sin servicio', service: null },
    ]);

    const body = bodyOf(fetch);
    expect(body.query).toContain(
      'channels(input: { organizationId: $organizationId })'
    );
    expect(body.query).toContain('$organizationId: OrganizationId!');
    expect(body.variables).toEqual({ organizationId: 'org-1' });
  });

  it('rejects an empty organization id without a request', async () => {
    const fetch = fakeFetch();

    await expectBufferError(
      client(fetch).listChannels('  '),
      'invalid_input'
    );
    expect(fetch).not.toHaveBeenCalled();
  });

  it('requires the API key for discovery too', async () => {
    const fetch = fakeFetch();

    await expectBufferError(
      client(fetch, { apiKey: null }).listOrganizations(),
      'missing_api_key'
    );
    expect(fetch).not.toHaveBeenCalled();
  });
});

describe('BufferGraphQLClient secret handling', () => {
  it('sends the bearer token but never includes it in errors', async () => {
    const secret = 'super-secret-token';
    const fetch = vi.fn<FetchLike>(async () =>
      jsonResponse({
        errors: [{ message: `Invalid token ${secret}` }],
      })
    );

    let error: BufferApiError | null = null;
    try {
      await client(fetch, { apiKey: secret }).createPost(storyInput);
    } catch (caught) {
      error = caught as BufferApiError;
    }

    expect(error).toBeInstanceOf(BufferApiError);
    expect(error!.code).toBe('graphql_error');
    expect(error!.message).not.toContain(secret);
    expect(error!.message).toContain('[redacted]');
    expect(error!.graphqlErrors?.join(' ')).not.toContain(secret);
    expect(error!.stack ?? '').not.toContain(secret);

    const headers = new Headers(fetch.mock.calls[0]![1]?.headers);
    expect(headers.get('authorization')).toBe(`Bearer ${secret}`);
  });
});
