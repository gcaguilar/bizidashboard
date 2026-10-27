/**
 * Alojamiento de las imagenes del agente social.
 *
 * `MediaHost` es el unico contrato que ven los runners: sube un JPEG y devuelve
 * el par page/direct que se guarda en SQLite y se envia a Buffer. La
 * implementacion de v1 usa tmpfiles.org; una futura implementacion
 * (Cloudinary, S3...) solo tiene que respetar esta interfaz.
 *
 * tmpfiles no devuelve el enlace directo en la API: devuelve la pagina del
 * fichero. Esa pagina contiene un enlace `/dl/{token}/{id}/{name}` que si
 * sirve el JPEG. El adaptador la descarga, extrae el enlace y lo valida antes
 * de entregar el asset. Sin ese paso, Buffer recibiria una URL que devuelve
 * HTML.
 *
 * La subida y el preflight son deliberadamente estrictos: una URL que no
 * devuelva un JPEG real con un tamano minimo no se publica. El adaptador no
 * registra los bytes de la imagen en ningun momento.
 */

import {
  DEFAULT_TMPFILES_EXPIRE_SECONDS,
  type SocialConfig,
} from '@/lib/social/config';
import type { SocialAsset } from '@/lib/social/types';

export const TMPFILES_UPLOAD_URL = 'https://tmpfiles.org/api/v1/upload';
export const TMPFILES_PAGE_BASE_URL = 'https://tmpfiles.org';
export const DEFAULT_TMPFILES_UPLOAD_TIMEOUT_MS = 30_000;
export const DEFAULT_TMPFILES_PREFLIGHT_TIMEOUT_MS = 10_000;
export const DEFAULT_TMPFILES_MIN_BYTES = 10 * 1024;
export const TMPFILES_USER_AGENT =
  'DatosBiziSocial/1.0 (+https://datosbizi.com)';

const JPEG_MAGIC = [0xff, 0xd8, 0xff] as const;
const DIRECT_PATH_SEGMENT = '/dl/';

export type MediaHostErrorCode =
  | 'unsupported_host'
  | 'invalid_image'
  | 'upload_network'
  | 'upload_timeout'
  | 'upload_http'
  | 'upload_response'
  | 'upload_url'
  | 'upload_page_network'
  | 'upload_page_timeout'
  | 'upload_page_http'
  | 'upload_page_response'
  | 'preflight_network'
  | 'preflight_timeout'
  | 'preflight_http'
  | 'preflight_content_type'
  | 'preflight_body'
  | 'preflight_size'
  | 'preflight_signature';

export class MediaHostError extends Error {
  readonly code: MediaHostErrorCode;
  readonly status: number | null;

  constructor(
    message: string,
    options: {
      code: MediaHostErrorCode;
      status?: number;
      cause?: unknown;
    }
  ) {
    super(
      message,
      options.cause !== undefined ? { cause: options.cause } : undefined
    );
    this.name = 'MediaHostError';
    this.code = options.code;
    this.status = options.status ?? null;
  }
}

export type FetchLike = (
  input: string | URL | Request,
  init?: RequestInit
) => Promise<Response>;

export interface MediaHost {
  upload(image: Uint8Array, filename: string): Promise<SocialAsset>;
  uploadMany(
    images: readonly Uint8Array[],
    baseName: string
  ): Promise<SocialAsset[]>;
}

export type TmpFilesMediaHostOptions = {
  /** Caducidad en segundos que se envia a tmpfiles.org. */
  expireSeconds?: number;
  fetch?: FetchLike;
  uploadUrl?: string;
  pageBaseUrl?: string;
  uploadTimeoutMs?: number;
  preflightTimeoutMs?: number;
  minBytes?: number;
  /** Reloj inyectable; solo se usa para el nombre de respaldo. */
  now?: () => Date;
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

function decodeHtmlEntities(value: string): string {
  return value
    .replace(/&amp;/gu, '&')
    .replace(/&#38;/gu, '&')
    .replace(/&#x26;/giu, '&')
    .replace(/&quot;/gu, '"')
    .replace(/&#39;/gu, "'");
}

/**
 * Extrae el enlace directo `/dl/...` del HTML de la pagina de tmpfiles.
 *
 * La pagina pinta un `<a class="download" href="...">Download</a>` y tambien
 * una imagen con el mismo `src`. Aceptamos cualquier href/src de la misma
 * pagina que apunte a `/dl/`, para no depender de clases o del orden del HTML.
 */
export function extractTmpFilesDirectUrl(
  html: string,
  rawPageUrl: string,
  options: { pageBaseUrl?: string } = {}
): SocialAsset {
  const pageBaseUrl = options.pageBaseUrl ?? TMPFILES_PAGE_BASE_URL;

  let pageUrl: URL;
  try {
    pageUrl = new URL(rawPageUrl.trim(), pageBaseUrl);
  } catch (cause) {
    throw new MediaHostError(
      `tmpfiles returned an invalid page URL: ${rawPageUrl}`,
      { code: 'upload_url', cause }
    );
  }

  if (pageUrl.protocol !== 'https:' && pageUrl.protocol !== 'http:') {
    throw new MediaHostError(
      `tmpfiles returned a non-HTTP page URL: ${rawPageUrl}`,
      { code: 'upload_url' }
    );
  }

  const candidates = new Set<string>();
  const hrefPattern = /(?:href|src)\s*=\s*(?:"([^"]+)"|'([^']+)')/giu;

  for (const match of html.matchAll(hrefPattern)) {
    const candidate = match[1] ?? match[2];
    if (candidate) {
      candidates.add(decodeHtmlEntities(candidate));
    }
  }

  // Fallback por si el HTML cambia a un enlace sin comillas o a un atributo
  // distinto; solo aceptamos URLs absolutas de la misma pagina.
  const absolutePattern = /https?:\/\/[^"'\s<>]+\/dl\/[^"'\s<>]+/giu;
  for (const match of html.matchAll(absolutePattern)) {
    if (match[0]) {
      candidates.add(decodeHtmlEntities(match[0]));
    }
  }

  const pageSegments = pageUrl.pathname.split('/').filter(Boolean);
  const pageId = pageSegments.at(-2);
  const pageName = pageSegments.at(-1);

  for (const candidate of candidates) {
    let url: URL;
    try {
      url = new URL(candidate, pageUrl);
    } catch {
      continue;
    }

    if (url.protocol !== 'https:' && url.protocol !== 'http:') {
      continue;
    }

    if (url.hostname !== pageUrl.hostname) {
      continue;
    }

    if (!url.pathname.startsWith(DIRECT_PATH_SEGMENT)) {
      continue;
    }

    // El enlace directo conserva el id y el nombre del fichero de la pagina
    // (`/dl/{token}/{id}/{name}`). Asi no elegimos un /dl/ ajeno del layout.
    const directSegments = url.pathname.split('/').filter(Boolean);
    if (pageId && directSegments.at(-2) !== pageId) {
      continue;
    }
    if (pageName && directSegments.at(-1) !== pageName) {
      continue;
    }

    return {
      pageUrl: pageUrl.toString(),
      directUrl: url.toString(),
    };
  }

  throw new MediaHostError(
    `tmpfiles page does not contain a direct /dl/ link: ${pageUrl.toString()}`,
    { code: 'upload_url' }
  );
}

function readUploadPageUrl(payload: unknown): string {
  if (!isRecord(payload) || payload.status !== 'success') {
    throw new MediaHostError(
      'tmpfiles upload did not return status "success"',
      { code: 'upload_response' }
    );
  }

  if (!isRecord(payload.data)) {
    throw new MediaHostError('tmpfiles upload response is missing data', {
      code: 'upload_response',
    });
  }

  const url = payload.data.url;
  if (typeof url !== 'string' || url.trim() === '') {
    throw new MediaHostError(
      'tmpfiles upload response is missing data.url',
      { code: 'upload_response' }
    );
  }

  return url.trim();
}

function hasJpegMagic(bytes: Uint8Array): boolean {
  return (
    bytes.length >= JPEG_MAGIC.length &&
    JPEG_MAGIC.every((byte, index) => bytes[index] === byte)
  );
}

export class TmpFilesMediaHost implements MediaHost {
  private readonly expireSeconds: number;
  private readonly fetchImpl: FetchLike;
  private readonly uploadUrl: string;
  private readonly pageBaseUrl: string;
  private readonly uploadTimeoutMs: number;
  private readonly preflightTimeoutMs: number;
  private readonly minBytes: number;
  private readonly now: () => Date;

  constructor(options: TmpFilesMediaHostOptions = {}) {
    this.expireSeconds =
      options.expireSeconds ?? DEFAULT_TMPFILES_EXPIRE_SECONDS;
    this.fetchImpl =
      options.fetch ?? ((input, init) => globalThis.fetch(input, init));
    this.uploadUrl = options.uploadUrl ?? TMPFILES_UPLOAD_URL;
    this.pageBaseUrl = options.pageBaseUrl ?? TMPFILES_PAGE_BASE_URL;
    this.uploadTimeoutMs =
      options.uploadTimeoutMs ?? DEFAULT_TMPFILES_UPLOAD_TIMEOUT_MS;
    this.preflightTimeoutMs =
      options.preflightTimeoutMs ?? DEFAULT_TMPFILES_PREFLIGHT_TIMEOUT_MS;
    this.minBytes = options.minBytes ?? DEFAULT_TMPFILES_MIN_BYTES;
    this.now = options.now ?? (() => new Date());
  }

  private fallbackFilename(): string {
    const stamp = this.now().toISOString().replace(/[:.]/gu, '-');
    return `social-${stamp}.jpg`;
  }

  private resolveFilename(filename: string): string {
    const trimmed = filename.trim();
    return trimmed === '' ? this.fallbackFilename() : trimmed;
  }

  private async postUpload(form: FormData, filename: string): Promise<Response> {
    try {
      return await this.fetchImpl(this.uploadUrl, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'User-Agent': TMPFILES_USER_AGENT,
        },
        body: form,
        signal: timeoutSignal(this.uploadTimeoutMs),
      });
    } catch (cause) {
      if (isTimeoutError(cause)) {
        throw new MediaHostError(
          `tmpfiles upload timed out for ${filename}`,
          { code: 'upload_timeout', cause }
        );
      }

      throw new MediaHostError(`tmpfiles upload failed for ${filename}`, {
        code: 'upload_network',
        cause,
      });
    }
  }

  /**
   * Descarga la pagina del fichero y extrae el enlace directo. Es un paso
   * imprescindible: el `data.url` de la API es la pagina, no el JPEG.
   */
  private async resolvePageAsset(pageUrl: string): Promise<SocialAsset> {
    let response: Response;
    try {
      response = await this.fetchImpl(pageUrl, {
        method: 'GET',
        redirect: 'follow',
        headers: {
          Accept: 'text/html',
          'User-Agent': TMPFILES_USER_AGENT,
        },
        signal: timeoutSignal(this.preflightTimeoutMs),
      });
    } catch (cause) {
      if (isTimeoutError(cause)) {
        throw new MediaHostError(
          `tmpfiles page timed out: ${pageUrl}`,
          { code: 'upload_page_timeout', cause }
        );
      }

      throw new MediaHostError(
        `tmpfiles page request failed: ${pageUrl}`,
        { code: 'upload_page_network', cause }
      );
    }

    if (!response.ok) {
      throw new MediaHostError(
        `tmpfiles page returned HTTP ${response.status}: ${pageUrl}`,
        { code: 'upload_page_http', status: response.status }
      );
    }

    const contentType = (response.headers.get('content-type') ?? '').toLowerCase();

    // Si tmpfiles cambiara y sirviera el fichero directamente en la page URL,
    // lo aceptamos sin intentar parsear HTML.
    if (contentType.startsWith('image/')) {
      return { pageUrl, directUrl: pageUrl };
    }

    if (!contentType.includes('text/html')) {
      throw new MediaHostError(
        `tmpfiles page returned content-type "${contentType || 'unknown'}"`,
        { code: 'upload_page_response', status: response.status }
      );
    }

    let html: string;
    try {
      html = await response.text();
    } catch (cause) {
      throw new MediaHostError(
        `tmpfiles page could not be read: ${pageUrl}`,
        { code: 'upload_page_response', cause }
      );
    }

    return extractTmpFilesDirectUrl(html, pageUrl, {
      pageBaseUrl: this.pageBaseUrl,
    });
  }

  private async preflight(asset: SocialAsset): Promise<SocialAsset> {
    let response: Response;
    try {
      response = await this.fetchImpl(asset.directUrl, {
        method: 'GET',
        redirect: 'follow',
        headers: {
          Accept: 'image/jpeg',
          'User-Agent': TMPFILES_USER_AGENT,
        },
        signal: timeoutSignal(this.preflightTimeoutMs),
      });
    } catch (cause) {
      if (isTimeoutError(cause)) {
        throw new MediaHostError(
          `tmpfiles preflight timed out: ${asset.directUrl}`,
          { code: 'preflight_timeout', cause }
        );
      }

      throw new MediaHostError(
        `tmpfiles preflight request failed: ${asset.directUrl}`,
        { code: 'preflight_network', cause }
      );
    }

    if (!response.ok) {
      throw new MediaHostError(
        `tmpfiles preflight returned HTTP ${response.status}: ${asset.directUrl}`,
        { code: 'preflight_http', status: response.status }
      );
    }

    const contentType = (response.headers.get('content-type') ?? '').toLowerCase();
    if (!contentType.startsWith('image/jpeg')) {
      throw new MediaHostError(
        `tmpfiles preflight returned content-type "${contentType || 'unknown'}" instead of image/jpeg`,
        { code: 'preflight_content_type', status: response.status }
      );
    }

    let bytes: Uint8Array;
    try {
      bytes = new Uint8Array(await response.arrayBuffer());
    } catch (cause) {
      throw new MediaHostError(
        `tmpfiles preflight could not read the image body: ${asset.directUrl}`,
        { code: 'preflight_body', cause }
      );
    }

    if (bytes.length < this.minBytes) {
      throw new MediaHostError(
        `tmpfiles preflight image is too small (${bytes.length} bytes, minimum ${this.minBytes}): ${asset.directUrl}`,
        { code: 'preflight_size', status: response.status }
      );
    }

    if (!hasJpegMagic(bytes)) {
      throw new MediaHostError(
        `tmpfiles preflight image is not a JPEG: ${asset.directUrl}`,
        { code: 'preflight_signature', status: response.status }
      );
    }

    return asset;
  }

  async upload(image: Uint8Array, filename: string): Promise<SocialAsset> {
    if (!(image instanceof Uint8Array) || image.length === 0) {
      throw new MediaHostError('Cannot upload an empty image', {
        code: 'invalid_image',
      });
    }

    const resolvedFilename = this.resolveFilename(filename);
    const form = new FormData();
    form.append(
      'file',
      new Blob([new Uint8Array(image)], { type: 'image/jpeg' }),
      resolvedFilename
    );
    form.append('expire', String(this.expireSeconds));

    const response = await this.postUpload(form, resolvedFilename);
    if (!response.ok) {
      throw new MediaHostError(
        `tmpfiles upload returned HTTP ${response.status} for ${resolvedFilename}`,
        { code: 'upload_http', status: response.status }
      );
    }

    let payload: unknown;
    try {
      payload = await response.json();
    } catch (cause) {
      throw new MediaHostError(
        `tmpfiles upload returned invalid JSON for ${resolvedFilename}`,
        { code: 'upload_response', cause }
      );
    }

    const pageUrl = readUploadPageUrl(payload);
    const asset = await this.resolvePageAsset(pageUrl);

    return this.preflight(asset);
  }

  async uploadMany(
    images: readonly Uint8Array[],
    baseName: string
  ): Promise<SocialAsset[]> {
    if (images.length === 0) {
      return [];
    }

    const base = baseName.trim() || this.fallbackFilename().replace(/\.jpg$/u, '');
    const assets: SocialAsset[] = [];

    // Secuencial: si una lamina falla se aborta el carrusel entero y no se
    // dejan subidas parciales que nadie va a publicar.
    for (let index = 0; index < images.length; index += 1) {
      const image = images[index]!;
      const asset = await this.upload(image, `${base}-${index + 1}.jpg`);
      assets.push(asset);
    }

    return assets;
  }
}

/** Fabrica el host configurado (`SOCIAL_IMAGE_HOST`). */
export function createMediaHost(
  config: Pick<SocialConfig, 'imageHost' | 'tmpfilesExpireSeconds'>,
  options: Omit<TmpFilesMediaHostOptions, 'expireSeconds'> = {}
): MediaHost {
  const host = config.imageHost.trim().toLowerCase();

  if (host === 'tmpfiles') {
    return new TmpFilesMediaHost({
      ...options,
      expireSeconds: config.tmpfilesExpireSeconds,
    });
  }

  throw new MediaHostError(`Unsupported social image host: ${host || '(empty)'}`, {
    code: 'unsupported_host',
  });
}
