import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import TurndownService from 'turndown';

const turndownService = new TurndownService({
  headingStyle: 'atx',
  codeBlockStyle: 'fenced',
  emDelimiter: '*',
  strongDelimiter: '**',
  linkStyle: 'inlined',
  linkBaseUrl: '',
  bulletListMarker: '-',
  hr: '---',
});

function convertHtmlToMarkdown(html: string): string {
  return turndownService.turndown(html);
}

export async function proxy(request: NextRequest) {
  // Check if client accepts markdown
  const acceptHeader = request.headers.get('accept') || '';
  const wantsMarkdown = acceptHeader.includes('text/markdown');

  if (!wantsMarkdown) {
    return NextResponse.next();
  }

  // Continue with normal request processing
  const response = await NextResponse.next();

  // Only convert HTML responses
  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('text/html')) {
    return response;
  }

  // Clone the response to modify it
  const clonedResponse = response.clone();
  const text = await clonedResponse.text();
  
  // Convert HTML to markdown
  const markdown = convertHtmlToMarkdown(text);

  // Return markdown response
  return new NextResponse(markdown, {
    status: response.status,
    statusText: response.statusText,
    headers: {
      'content-type': 'text/markdown; charset=utf-8',
      // Add x-markdown-tokens header if we want to provide token count estimate
      // 'x-markdown-tokens': String(Math.ceil(markdown.length / 4)), // Rough estimate
      ...Object.fromEntries(response.headers.entries()),
    },
  });
}

// Configure proxy to run on all paths
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
};