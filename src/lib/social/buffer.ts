/**
 * Adaptador de publicacion contra la API GraphQL de Buffer.
 *
 * El contrato `BufferClient` mantiene a los runners alejados de GraphQL: el
 * job decide el texto y los assets, y este modulo construye el `createPost`
 * con variables (nunca interpolando texto en la query), valida la respuesta y
 * devuelve el id/estado del post.
 *
 * No hay reintentos aqui: un reintento ciego podria publicar dos veces. La
 * reconciliacion es responsabilidad de la capa que conoce el estado local.
 */

import type { SocialConfig } from '@/lib/social/config';
import type { SocialAsset } from '@/lib/social/types';

export const BUFFER_GRAPHQL_ENDPOINT = 'https://api.buffer.com';
export const DEFAULT_BUFFER_TIMEOUT_MS = 20_000;
export const BUFFER_CAROUSEL_MIN_ASSETS = 2;
export const BUFFER_CAROUSEL_MAX_ASSETS = 20;

const CREATE_POST_MUTATION = `
  mutation CreatePost($input: CreatePostInput!) {
    createPost(input: $input) {
      __typename
      ... on PostActionSuccess {
        post {
          id
          status
        }
      }
      ... on MutationError {
        message
      }
      ... on InvalidInputError {
        message
      }
      ... on UnauthorizedError {
        message
      }
    }
  }
`;

const LIST_ORGANIZATIONS_QUERY = `
  query ListOrganizations {
    account {
      organizations {
        id
        name
      }
    }
  }
`;

const LIST_CHANNELS_QUERY = `
  query ListChannels($organizationId: OrganizationId!) {
    channels(input: { organizationId: $organizationId }) {
      id
      name
      service
    }
  }
`;

export type BufferPostFormat = 'story' | 'carousel';

export type BufferPostInput = {
  text: string;
  assets: readonly SocialAsset[];
  format: BufferPostFormat;
  shouldShareToFeed: boolean;
  altText?: string;
  /** Override puntual; por defecto se usa `BUFFER_CHANNEL_ID`. */
  channelId?: string;
};

export type BufferPostResult = {
  id: string;
  status: string;
};

export type BufferOrganization = {
  id: string;
  name: string;
};

export type BufferChannel = {
  id: string;
  name: string;
  service: string | null;
};

export interface BufferClient {
  createPost(input: BufferPostInput): Promise<BufferPostResult>;
  listOrganizations(): Promise<BufferOrganization[]>;
  listChannels(organizationId: string): Promise<BufferChannel[]>;
}

export type BufferApiErrorCode =
  | 'missing_api_key'
  | 'missing_channel_id'
  | 'invalid_input'
  | 'network_error'
  | 'timeout'
  | 'http_error'
  | 'graphql_error'
  | 'mutation_error'
  | 'malformed_response';

export class BufferApiError extends Error {
  readonly code: BufferApiErrorCode;
  readonly status: number | null;
  readonly graphqlErrors: readonly string[] | null;

  constructor(
    message: string,
    options: {
      code: BufferApiErrorCode;
      status?: number;
      graphqlErrors?: readonly string[];
      cause?: unknown;
    }
  ) {
    super(
      message,
      options.cause !== undefined ? { cause: options.cause } : undefined
    );
    this.name = 'BufferApiError';
    this.code = options.code;
    this.status = options.status ?? null;
    this.graphqlErrors = options.graphqlErrors ?? null;
  }
}

export type FetchLike = (
  input: string | URL | Request,
  init?: RequestInit
) => Promise<Response>;

export type BufferGraphQLClientOptions = {
  apiKey?: string | null;
  channelId?: string | null;
  endpoint?: string;
  fetch?: FetchLike;
  timeoutMs?: number;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isTimeoutError(error: unknown): boolean {
  return (
    error instanceof Error &&
    (error.name === 'TimeoutError' || error.name === 'AbortError')
  );
}

function timeoutSignal(timeoutMs: number): AbortSignal | undefined {
  if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) {
    return undefined;
  }

  return AbortSignal.timeout(timeoutMs);
}

function readString(value: unknown): string | null {
  return typeof value === 'string' && value.trim() !== '' ? value.trim() : null;
}

function readAssetUrl(asset: SocialAsset, index: number): string {
  const url = readString(asset.directUrl);
  if (!url) {
    throw new BufferApiError(
      `Asset ${index + 1} is missing a direct URL`,
      { code: 'invalid_input' }
    );
  }

  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
      throw new Error('unsupported protocol');
    }
  } catch (cause) {
    throw new BufferApiError(
      `Asset ${index + 1} has an invalid direct URL`,
      { code: 'invalid_input', cause }
    );
  }

  return url;
}

/**
 * Mensajes que vienen de Buffer se redactan por si el servidor ecoase la
 * credencial. La clave nunca aparece en un error ni en un log.
 */
function redactSecret(value: string, secret: string | null): string {
  if (!secret) {
    return value;
  }

  return value.split(secret).join('[redacted]');
}

export class BufferGraphQLClient implements BufferClient {
  private readonly apiKey: string | null;
  private readonly channelId: string | null;
  private readonly endpoint: string;
  private readonly fetchImpl: FetchLike;
  private readonly timeoutMs: number;

  constructor(options: BufferGraphQLClientOptions = {}) {
    this.apiKey = options.apiKey?.trim() || null;
    this.channelId = options.channelId?.trim() || null;
    this.endpoint = options.endpoint ?? BUFFER_GRAPHQL_ENDPOINT;
    this.fetchImpl =
      options.fetch ?? ((input, init) => globalThis.fetch(input, init));
    this.timeoutMs = options.timeoutMs ?? DEFAULT_BUFFER_TIMEOUT_MS;
  }

  private requireApiKey(): string {
    if (!this.apiKey) {
      throw new BufferApiError('BUFFER_API_KEY is not configured', {
        code: 'missing_api_key',
      });
    }

    return this.apiKey;
  }

  private resolveChannelId(override?: string): string {
    const channelId = override?.trim() || this.channelId;
    if (!channelId) {
      throw new BufferApiError(
        'BUFFER_CHANNEL_ID is not configured and no channelId override was provided',
        { code: 'missing_channel_id' }
      );
    }

    return channelId;
  }

  private redact(message: string): string {
    return redactSecret(message, this.apiKey);
  }

  private async request(
    query: string,
    variables: Record<string, unknown>
  ): Promise<Record<string, unknown>> {
    const apiKey = this.requireApiKey();

    let response: Response;
    try {
      response = await this.fetchImpl(this.endpoint, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({ query, variables }),
        signal: timeoutSignal(this.timeoutMs),
      });
    } catch (cause) {
      if (isTimeoutError(cause)) {
        throw new BufferApiError('Buffer request timed out', {
          code: 'timeout',
          cause,
        });
      }

      throw new BufferApiError('Buffer request failed', {
        code: 'network_error',
        cause,
      });
    }

    if (!response.ok) {
      throw new BufferApiError(
        `Buffer API responded with HTTP ${response.status}`,
        { code: 'http_error', status: response.status }
      );
    }

    let payload: unknown;
    try {
      payload = await response.json();
    } catch (cause) {
      throw new BufferApiError('Buffer API returned invalid JSON', {
        code: 'malformed_response',
        cause,
      });
    }

    if (!isRecord(payload)) {
      throw new BufferApiError('Buffer API returned an invalid payload', {
        code: 'malformed_response',
      });
    }

    if (payload.errors !== undefined) {
      if (!Array.isArray(payload.errors)) {
        throw new BufferApiError('Buffer API returned malformed errors', {
          code: 'malformed_response',
        });
      }

      if (payload.errors.length > 0) {
        const messages = payload.errors.map((entry) => {
          const message = isRecord(entry)
            ? (readString(entry.message) ?? 'Unknown GraphQL error')
            : 'Unknown GraphQL error';
          return this.redact(message);
        });

        throw new BufferApiError(
          `Buffer GraphQL error: ${messages.join('; ')}`,
          { code: 'graphql_error', graphqlErrors: messages }
        );
      }
    }

    if (!isRecord(payload.data)) {
      throw new BufferApiError('Buffer API response is missing data', {
        code: 'malformed_response',
      });
    }

    return payload.data;
  }

  async createPost(input: BufferPostInput): Promise<BufferPostResult> {
    const text = input.text;
    if (text.trim() === '') {
      throw new BufferApiError('Buffer post text cannot be empty', {
        code: 'invalid_input',
      });
    }

    if (input.format !== 'story' && input.format !== 'carousel') {
      throw new BufferApiError(`Unsupported Buffer post format: ${input.format}`, {
        code: 'invalid_input',
      });
    }

    if (input.format === 'story' && input.assets.length !== 1) {
      throw new BufferApiError(
        `A Buffer story requires exactly one asset (received ${input.assets.length})`,
        { code: 'invalid_input' }
      );
    }

    if (
      input.format === 'carousel' &&
      (input.assets.length < BUFFER_CAROUSEL_MIN_ASSETS ||
        input.assets.length > BUFFER_CAROUSEL_MAX_ASSETS)
    ) {
      throw new BufferApiError(
        `A Buffer carousel requires ${BUFFER_CAROUSEL_MIN_ASSETS}-${BUFFER_CAROUSEL_MAX_ASSETS} assets (received ${input.assets.length})`,
        { code: 'invalid_input' }
      );
    }

    const channelId = this.resolveChannelId(input.channelId);
    const altText = input.altText?.trim() ?? '';
    const assets = input.assets.map((asset, index) => {
      const url = readAssetUrl(asset, index);
      const image: Record<string, unknown> = { url };
      // Instagram documenta alt text para publicaciones de imagen, no para
      // stories. Lo enviamos solo en el carrusel para no arriesgar una
      // validacion de Buffer en el slot diario.
      if (altText && input.format === 'carousel') {
        image.metadata = { altText };
      }
      return { image };
    });

    // El formato manda: story nunca comparte al feed y carousel siempre.
    const shouldShareToFeed = input.format === 'carousel';
    // Instagram no tiene un tipo "carousel": un post con varias imagenes ES el
    // carrusel. El formato interno sigue siendo `carousel` para el render.
    const instagramType = input.format === 'story' ? 'story' : 'post';
    const variables = {
      input: {
        text,
        channelId,
        schedulingType: 'automatic',
        mode: 'shareNow',
        assets,
        metadata: {
          instagram: {
            type: instagramType,
            shouldShareToFeed,
          },
        },
      },
    };

    const data = await this.request(CREATE_POST_MUTATION, variables);
    const result = data.createPost;

    if (!isRecord(result)) {
      throw new BufferApiError(
        'Buffer createPost response is missing a result',
        { code: 'malformed_response' }
      );
    }

    const typename = readString(result.__typename);
    const errorMessage = readString(result.message);

    if (typename === 'MutationError' || errorMessage) {
      throw new BufferApiError(
        this.redact(errorMessage ?? 'Buffer rejected the post'),
        { code: 'mutation_error' }
      );
    }

    if (typename === 'PostActionSuccess' || (!typename && isRecord(result.post))) {
      if (!isRecord(result.post)) {
        throw new BufferApiError(
          'Buffer createPost success is missing the post',
          { code: 'malformed_response' }
        );
      }

      const id = readString(result.post.id);
      const status = readString(result.post.status);
      if (!id || !status) {
        throw new BufferApiError(
          'Buffer createPost success is missing the post id/status',
          { code: 'malformed_response' }
        );
      }

      return { id, status };
    }

    throw new BufferApiError(
      `Buffer createPost returned an unexpected result${typename ? ` (${typename})` : ''}`,
      { code: 'malformed_response' }
    );
  }

  async listOrganizations(): Promise<BufferOrganization[]> {
    const data = await this.request(LIST_ORGANIZATIONS_QUERY, {});
    const account = data.account;
    if (!isRecord(account) || !Array.isArray(account.organizations)) {
      throw new BufferApiError(
        'Buffer account response is missing organizations',
        { code: 'malformed_response' }
      );
    }

    return account.organizations.map((entry, index) => {
      if (!isRecord(entry)) {
        throw new BufferApiError(
          `Buffer organization ${index + 1} is malformed`,
          { code: 'malformed_response' }
        );
      }

      const id = readString(entry.id);
      const name = readString(entry.name);
      if (!id || !name) {
        throw new BufferApiError(
          `Buffer organization ${index + 1} is missing id/name`,
          { code: 'malformed_response' }
        );
      }

      return { id, name };
    });
  }

  async listChannels(organizationId: string): Promise<BufferChannel[]> {
    const id = organizationId.trim();
    if (!id) {
      throw new BufferApiError('organizationId is required', {
        code: 'invalid_input',
      });
    }

    const data = await this.request(LIST_CHANNELS_QUERY, {
      organizationId: id,
    });

    if (!Array.isArray(data.channels)) {
      throw new BufferApiError(
        'Buffer channels response is missing channels',
        { code: 'malformed_response' }
      );
    }

    return data.channels.map((entry, index) => {
      if (!isRecord(entry)) {
        throw new BufferApiError(
          `Buffer channel ${index + 1} is malformed`,
          { code: 'malformed_response' }
        );
      }

      const channelId = readString(entry.id);
      const name = readString(entry.name);
      if (!channelId || !name) {
        throw new BufferApiError(
          `Buffer channel ${index + 1} is missing id/name`,
          { code: 'malformed_response' }
        );
      }

      return {
        id: channelId,
        name,
        service: readString(entry.service),
      };
    });
  }
}

/** Fabrica el cliente con la configuracion de entorno del agente social. */
export function createBufferClient(
  config: Pick<SocialConfig, 'bufferApiKey' | 'bufferChannelId'>,
  options: Omit<BufferGraphQLClientOptions, 'apiKey' | 'channelId'> = {}
): BufferClient {
  return new BufferGraphQLClient({
    ...options,
    apiKey: config.bufferApiKey,
    channelId: config.bufferChannelId,
  });
}
