import { describe, expect, it, vi } from 'vitest';

import {
  extractTmpFilesDirectUrl,
  MediaHostError,
  TmpFilesMediaHost,
  type FetchLike,
} from '@/lib/social/media';

const UPLOAD_URL = 'https://tmpfiles.test/api/v1/upload';
const PAGE_BASE = 'https://tmpfiles.test';
const PAGE_URL = 'https://tmpfiles.test/12345/photo.jpg';
const DIRECT_URL = 'https://tmpfiles.test/dl/token-123/12345/photo.jpg';

function jpegBytes(size = 16 * 1024): Uint8Array {
  const bytes = new Uint8Array(size);
  bytes.set([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46]);
  return bytes;
}

function imageResponse(bytes: Uint8Array = jpegBytes()): Response {
  return new Response(new Uint8Array(bytes), {
    status: 200,
    headers: { 'content-type': 'image/jpeg' },
  });
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

function htmlResponse(html: string): Response {
  return new Response(html, {
    status: 200,
    headers: { 'content-type': 'text/html; charset=utf-8' },
  });
}

function pageHtml(directUrl = DIRECT_URL): string {
  return `<html><body>
    <p><a class="download" href="${directUrl}">Download</a></p>
    <img src="${directUrl}" alt="photo">
  </body></html>`;
}

function uploadResponse(url = PAGE_URL): Response {
  return jsonResponse({ status: 'success', data: { url } });
}

function fakeFetch(): ReturnType<typeof vi.fn<FetchLike>> {
  return vi.fn<FetchLike>(async () => uploadResponse());
}

function host(
  fetch: FetchLike,
  options: Partial<ConstructorParameters<typeof TmpFilesMediaHost>[0]> = {}
): TmpFilesMediaHost {
  return new TmpFilesMediaHost({
    fetch,
    uploadUrl: UPLOAD_URL,
    pageBaseUrl: PAGE_BASE,
    ...options,
  });
}

async function expectMediaError(
  promise: Promise<unknown>,
  code: string
): Promise<MediaHostError> {
  try {
    await promise;
  } catch (error) {
    expect(error).toBeInstanceOf(MediaHostError);
    const mediaError = error as MediaHostError;
    expect(mediaError.code).toBe(code);
    return mediaError;
  }

  throw new Error(`Expected a MediaHostError with code ${code}`);
}

describe('extractTmpFilesDirectUrl', () => {
  it('extracts the tokenized /dl/ link from the page HTML', () => {
    expect(
      extractTmpFilesDirectUrl(pageHtml(), `${PAGE_URL}?download=1`, {
        pageBaseUrl: PAGE_BASE,
      })
    ).toEqual({
      pageUrl: `${PAGE_URL}?download=1`,
      directUrl: DIRECT_URL,
    });
  });

  it('resolves relative links and ignores links from other hosts', () => {
    const html = `
      <a class="download" href="https://evil.test/dl/token/1/x.jpg">bad</a>
      <a class="download" href="/dl/token-123/12345/photo.jpg">good</a>
    `;

    expect(
      extractTmpFilesDirectUrl(html, PAGE_URL, { pageBaseUrl: PAGE_BASE })
    ).toEqual({ pageUrl: PAGE_URL, directUrl: DIRECT_URL });
  });

  it('throws when the page has no /dl/ link', () => {
    expect(() =>
      extractTmpFilesDirectUrl('<html><body>No link</body></html>', PAGE_URL, {
        pageBaseUrl: PAGE_BASE,
      })
    ).toThrow(MediaHostError);
  });
});

describe('TmpFilesMediaHost upload', () => {
  it('uploads a JPEG, reads the page and preflights the direct URL', async () => {
    const fetch = fakeFetch();
    fetch
      .mockResolvedValueOnce(uploadResponse(`${PAGE_URL}?download=1`))
      .mockResolvedValueOnce(htmlResponse(pageHtml()))
      .mockResolvedValueOnce(imageResponse());

    const asset = await host(fetch).upload(jpegBytes(), 'story.jpg');

    expect(asset).toEqual({
      pageUrl: `${PAGE_URL}?download=1`,
      directUrl: DIRECT_URL,
    });

    const uploadCall = fetch.mock.calls[0]!;
    expect(uploadCall[0]).toBe(UPLOAD_URL);
    expect(uploadCall[1]?.method).toBe('POST');

    const form = uploadCall[1]?.body as FormData;
    expect(form).toBeInstanceOf(FormData);
    expect(form.get('expire')).toBe('7200');

    const file = form.get('file') as File;
    expect(file).toBeInstanceOf(Blob);
    expect(file.name).toBe('story.jpg');
    expect(file.type).toBe('image/jpeg');

    const pageCall = fetch.mock.calls[1]!;
    expect(pageCall[0]).toBe(`${PAGE_URL}?download=1`);
    expect(pageCall[1]?.method).toBe('GET');
    expect(pageCall[1]?.redirect).toBe('follow');
    expect(new Headers(pageCall[1]?.headers).get('accept')).toBe('text/html');

    const preflightCall = fetch.mock.calls[2]!;
    expect(preflightCall[0]).toBe(DIRECT_URL);
    expect(preflightCall[1]?.method).toBe('GET');
    expect(preflightCall[1]?.redirect).toBe('follow');
    expect(new Headers(preflightCall[1]?.headers).get('accept')).toBe(
      'image/jpeg'
    );
  });

  it('accepts a trailing slash in the page URL', async () => {
    const fetch = fakeFetch();
    fetch
      .mockResolvedValueOnce(uploadResponse(`${PAGE_URL}/`))
      .mockResolvedValueOnce(htmlResponse(pageHtml()))
      .mockResolvedValueOnce(imageResponse());

    const asset = await host(fetch).upload(jpegBytes(), 'story.jpg');

    expect(asset.directUrl).toBe(DIRECT_URL);
  });

  it('sends the configured expire instead of the default', async () => {
    const fetch = fakeFetch();
    fetch
      .mockResolvedValueOnce(uploadResponse())
      .mockResolvedValueOnce(htmlResponse(pageHtml()))
      .mockResolvedValueOnce(imageResponse());

    await host(fetch, { expireSeconds: 900 }).upload(jpegBytes(), 'story.jpg');

    const form = fetch.mock.calls[0]![1]?.body as FormData;
    expect(form.get('expire')).toBe('900');
  });

  it('uses the injected clock for a missing filename', async () => {
    const fetch = fakeFetch();
    fetch
      .mockResolvedValueOnce(uploadResponse())
      .mockResolvedValueOnce(htmlResponse(pageHtml()))
      .mockResolvedValueOnce(imageResponse());

    await host(fetch, {
      now: () => new Date('2026-10-27T08:30:00.000Z'),
    }).upload(jpegBytes(), '   ');

    const form = fetch.mock.calls[0]![1]?.body as FormData;
    expect((form.get('file') as File).name).toBe(
      'social-2026-10-27T08-30-00-000Z.jpg'
    );
  });

  it.each([
    {
      name: 'invalid JSON',
      response: () => new Response('not-json', { status: 200 }),
      code: 'upload_response',
      calls: 1,
    },
    {
      name: 'non-success status',
      response: () => jsonResponse({ status: 'error', data: { url: PAGE_URL } }),
      code: 'upload_response',
      calls: 1,
    },
    {
      name: 'missing data.url',
      response: () => jsonResponse({ status: 'success', data: {} }),
      code: 'upload_response',
      calls: 1,
    },
    {
      name: 'a page without a direct link',
      response: () =>
        jsonResponse({
          status: 'success',
          data: { url: PAGE_URL },
        }),
      code: 'upload_url',
      calls: 2,
      page: htmlResponse('<html><body>No link</body></html>'),
    },
  ])(
    'rejects a malformed upload response: $name',
    async ({ response, code, calls, page }) => {
      const fetch = fakeFetch();
      fetch.mockResolvedValueOnce(response());
      if (page) {
        fetch.mockResolvedValueOnce(page);
      }

      await expectMediaError(
        host(fetch).upload(jpegBytes(), 'story.jpg'),
        code
      );

      expect(fetch).toHaveBeenCalledTimes(calls);
    }
  );

  it('reports an HTTP upload failure', async () => {
    const fetch = fakeFetch();
    fetch.mockResolvedValueOnce(
      new Response('rate limited', { status: 429 })
    );

    const error = await expectMediaError(
      host(fetch).upload(jpegBytes(), 'story.jpg'),
      'upload_http'
    );

    expect(error.status).toBe(429);
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('reports a network failure without attempting the page', async () => {
    const fetch = fakeFetch();
    fetch.mockRejectedValueOnce(new TypeError('fetch failed'));

    await expectMediaError(
      host(fetch).upload(jpegBytes(), 'story.jpg'),
      'upload_network'
    );
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('reports an upload timeout', async () => {
    const fetch = fakeFetch();
    fetch.mockRejectedValueOnce(
      new DOMException('The operation timed out', 'TimeoutError')
    );

    await expectMediaError(
      host(fetch).upload(jpegBytes(), 'story.jpg'),
      'upload_timeout'
    );
  });
});

describe('TmpFilesMediaHost page resolution', () => {
  it('reports a page network failure', async () => {
    const fetch = fakeFetch();
    fetch
      .mockResolvedValueOnce(uploadResponse())
      .mockRejectedValueOnce(new TypeError('fetch failed'));

    await expectMediaError(
      host(fetch).upload(jpegBytes(), 'story.jpg'),
      'upload_page_network'
    );
  });

  it('reports a page HTTP failure', async () => {
    const fetch = fakeFetch();
    fetch
      .mockResolvedValueOnce(uploadResponse())
      .mockResolvedValueOnce(new Response('missing', { status: 404 }));

    const error = await expectMediaError(
      host(fetch).upload(jpegBytes(), 'story.jpg'),
      'upload_page_http'
    );
    expect(error.status).toBe(404);
  });

  it('reports a page with an unexpected content type', async () => {
    const fetch = fakeFetch();
    fetch
      .mockResolvedValueOnce(uploadResponse())
      .mockResolvedValueOnce(
        new Response('{}', {
          status: 200,
          headers: { 'content-type': 'application/json' },
        })
      );

    await expectMediaError(
      host(fetch).upload(jpegBytes(), 'story.jpg'),
      'upload_page_response'
    );
  });

  it('accepts a page URL that already serves the image', async () => {
    const fetch = fakeFetch();
    fetch
      .mockResolvedValueOnce(uploadResponse())
      .mockResolvedValueOnce(imageResponse())
      .mockResolvedValueOnce(imageResponse());

    const asset = await host(fetch).upload(jpegBytes(), 'story.jpg');

    expect(asset).toEqual({ pageUrl: PAGE_URL, directUrl: PAGE_URL });
  });
});

describe('TmpFilesMediaHost preflight', () => {
  it.each([
    {
      name: 'a 404',
      response: () => new Response('missing', { status: 404 }),
      code: 'preflight_http',
    },
    {
      name: 'an HTML body',
      response: () =>
        new Response('<html></html>', {
          status: 200,
          headers: { 'content-type': 'text/html' },
        }),
      code: 'preflight_content_type',
    },
    {
      name: 'a too-small JPEG',
      response: () =>
        new Response(new Uint8Array(jpegBytes(1024)), {
          status: 200,
          headers: { 'content-type': 'image/jpeg' },
        }),
      code: 'preflight_size',
    },
    {
      name: 'a non-JPEG body with a JPEG content type',
      response: () => {
        const bytes = jpegBytes();
        bytes.set([0x89, 0x50, 0x4e, 0x47]);
        return new Response(new Uint8Array(bytes), {
          status: 200,
          headers: { 'content-type': 'image/jpeg' },
        });
      },
      code: 'preflight_signature',
    },
  ])('rejects $name', async ({ response, code }) => {
    const fetch = fakeFetch();
    fetch
      .mockResolvedValueOnce(uploadResponse())
      .mockResolvedValueOnce(htmlResponse(pageHtml()))
      .mockResolvedValueOnce(response());

    await expectMediaError(
      host(fetch).upload(jpegBytes(), 'story.jpg'),
      code
    );
  });

  it('reports a preflight network failure', async () => {
    const fetch = fakeFetch();
    fetch
      .mockResolvedValueOnce(uploadResponse())
      .mockResolvedValueOnce(htmlResponse(pageHtml()))
      .mockRejectedValueOnce(new TypeError('fetch failed'));

    await expectMediaError(
      host(fetch).upload(jpegBytes(), 'story.jpg'),
      'preflight_network'
    );
  });
});

describe('TmpFilesMediaHost uploadMany', () => {
  it('uploads slides sequentially and preserves their order', async () => {
    const fetch = fakeFetch();
    fetch
      .mockResolvedValueOnce(uploadResponse('https://tmpfiles.test/1/a.jpg'))
      .mockResolvedValueOnce(
        htmlResponse(
          pageHtml('https://tmpfiles.test/dl/token-1/1/a.jpg')
        )
      )
      .mockResolvedValueOnce(imageResponse())
      .mockResolvedValueOnce(uploadResponse('https://tmpfiles.test/2/b.jpg'))
      .mockResolvedValueOnce(
        htmlResponse(
          pageHtml('https://tmpfiles.test/dl/token-2/2/b.jpg')
        )
      )
      .mockResolvedValueOnce(imageResponse());

    const assets = await host(fetch).uploadMany(
      [jpegBytes(), jpegBytes()],
      'weekly'
    );

    expect(assets.map((asset) => asset.directUrl)).toEqual([
      'https://tmpfiles.test/dl/token-1/1/a.jpg',
      'https://tmpfiles.test/dl/token-2/2/b.jpg',
    ]);

    const filenames = fetch.mock.calls
      .filter((call) => call[1]?.method === 'POST')
      .map((call) => ((call[1]?.body as FormData).get('file') as File).name);
    expect(filenames).toEqual(['weekly-1.jpg', 'weekly-2.jpg']);
  });

  it('aborts the whole set on the first failed slide', async () => {
    const fetch = fakeFetch();
    fetch
      .mockResolvedValueOnce(uploadResponse('https://tmpfiles.test/1/a.jpg'))
      .mockResolvedValueOnce(
        htmlResponse(
          pageHtml('https://tmpfiles.test/dl/token-1/1/a.jpg')
        )
      )
      .mockResolvedValueOnce(imageResponse())
      .mockResolvedValueOnce(uploadResponse('https://tmpfiles.test/2/b.jpg'))
      .mockResolvedValueOnce(
        htmlResponse(
          pageHtml('https://tmpfiles.test/dl/token-2/2/b.jpg')
        )
      )
      .mockResolvedValueOnce(
        new Response('<html>not an image</html>', {
          status: 200,
          headers: { 'content-type': 'text/html' },
        })
      )
      // This response must never be consumed because the third slide is aborted.
      .mockResolvedValueOnce(uploadResponse('https://tmpfiles.test/3/c.jpg'))
      .mockResolvedValueOnce(
        htmlResponse(
          pageHtml('https://tmpfiles.test/dl/token-3/3/c.jpg')
        )
      )
      .mockResolvedValueOnce(imageResponse());

    await expectMediaError(
      host(fetch).uploadMany([jpegBytes(), jpegBytes(), jpegBytes()], 'weekly'),
      'preflight_content_type'
    );

    expect(fetch).toHaveBeenCalledTimes(6);
    const uploads = fetch.mock.calls.filter(
      (call) => call[1]?.method === 'POST'
    );
    expect(uploads).toHaveLength(2);
  });
});
