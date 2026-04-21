const PUBLIC_CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
} as const;

function withPublicCors(headers: HeadersInit = {}): Headers {
  const responseHeaders = new Headers(headers);

  for (const [key, value] of Object.entries(PUBLIC_CORS_HEADERS)) {
    responseHeaders.set(key, value);
  }

  return responseHeaders;
}

export function buildAgentSkillsJsonResponse(payload: unknown): Response {
  return Response.json(payload, {
    headers: withPublicCors({
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    }),
  });
}

export function buildAgentSkillsMarkdownResponse(content: string): Response {
  return new Response(content, {
    headers: withPublicCors({
      'Content-Type': 'text/markdown; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    }),
  });
}

export function buildAgentSkillsHeadResponse(contentType: string): Response {
  return new Response(null, {
    headers: withPublicCors({
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    }),
  });
}
