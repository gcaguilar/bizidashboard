import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const securityHeaders = [
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "base-uri 'self'",
      "object-src 'none'",
      "frame-ancestors 'none'",
      "form-action 'self'",
      // Umami Cloud: script from cloud.umami.is; tracker beacons use api-gateway.umami.dev (not *.umami.is).
      "script-src 'self' 'unsafe-inline' https://cloud.umami.is",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https:",
      "font-src 'self' data: https://basemaps.cartocdn.com https://fonts.gstatic.com",
      "connect-src 'self' https://raw.githubusercontent.com https://basemaps.cartocdn.com https://*.cartocdn.com https://*.sentry.io https://*.umami.is https://cloud.umami.is https://api-gateway.umami.dev",
      "worker-src 'self' blob:",
      "frame-src 'none'",
      "manifest-src 'self'",
      "media-src 'self' blob:",
      'upgrade-insecure-requests',
    ].join('; '),
  },
  {
    key: 'Cross-Origin-Embedder-Policy',
    value: 'require-corp',
  },
  {
    key: 'Cross-Origin-Opener-Policy',
    value: 'same-origin',
  },
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin',
  },
  {
    key: 'Permissions-Policy',
    value: 'geolocation=(self), camera=(), microphone=()'
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=31536000; includeSubDomains; preload',
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  {
    key: 'X-Frame-Options',
    value: 'DENY',
  },
];

const sentryAuthToken = process.env.SENTRY_AUTH_TOKEN?.trim();
const hasSentryAuthToken = Boolean(sentryAuthToken);

const nextConfig: NextConfig = {
  output: 'standalone',
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
      {
        source: '/api/:path*',
        headers: [
          ...securityHeaders,
          {
            key: 'X-Robots-Tag',
            value: 'noindex, nofollow, noarchive, nosnippet',
          },
        ],
      },
    ];
  },
};

// Injected content via Sentry wizard below

export default withSentryConfig(nextConfig, {
  // For all available options, see:
  // https://github.com/getsentry/sentry-webpack-plugin#options

  org: "bizidashboard",
  project: "javascript-nextjs",
  authToken: sentryAuthToken,

  // Only print logs for uploading source maps in CI
  silent: !process.env.CI,
  telemetry: false,

  // For all available options, see:
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

  // Only upload and widen sourcemaps when release management is actually enabled.
  widenClientFileUpload: hasSentryAuthToken,
  sourcemaps: {
    disable: !hasSentryAuthToken,
  },
  release: {
    create: hasSentryAuthToken,
    finalize: hasSentryAuthToken,
    ...(hasSentryAuthToken ? { setCommits: { auto: true as const } } : {}),
  },

  // Route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
  // This can increase your server load as well as your Sentry bill.
  tunnelRoute: "/monitoring",

  webpack: {
    // Automatically annotate React components to show their full name in breadcrumbs and session replay.
    reactComponentAnnotation: {
      enabled: true,
    },
    // Automatically tree-shake Sentry logger statements to reduce bundle size.
    treeshake: {
      removeDebugLogging: true,
    },
    // Enables automatic instrumentation of Vercel Cron Monitors. (Does not yet work with other cron services).
    automaticVercelMonitors: true,
  },
});
