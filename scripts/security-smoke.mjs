const args = process.argv.slice(2);
const baseUrlIndex = args.indexOf('--base-url');
const baseUrl = (
  baseUrlIndex >= 0 ? args[baseUrlIndex + 1] : process.env.PLAYWRIGHT_BASE_URL
)?.replace(/\/$/, '');
const mobileOrigin = process.env.SMOKE_MOBILE_ORIGIN?.trim();
const posthogKey = process.env.POSTHOG_KEY?.trim();
const posthogHost = process.env.POSTHOG_HOST?.trim() || 'https://eu.i.posthog.com';

if (!baseUrl) {
  throw new Error('Provide --base-url or PLAYWRIGHT_BASE_URL.');
}
if (!mobileOrigin) {
  throw new Error('SMOKE_MOBILE_ORIGIN is required.');
}
if (!posthogKey) {
  throw new Error('POSTHOG_KEY is required.');
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const homeResponse = await fetch(`${baseUrl}/`);
const html = await homeResponse.text();
const csp =
  homeResponse.headers.get('content-security-policy') ??
  homeResponse.headers.get('content-security-policy-report-only');

assert(homeResponse.ok, `Home returned ${homeResponse.status}.`);
assert(csp, 'Home response is missing CSP.');
assert(!html.includes('cloud.umami.is'), 'Legacy Umami script is still present.');
assert(html.includes('Tu privacidad importa'), 'Analytics consent banner is missing from HTML.');
assert(
  csp.includes(new URL(posthogHost).origin),
  'CSP is missing the PostHog ingestion origin.'
);
assert(
  csp.includes('https://eu-assets.i.posthog.com'),
  'CSP is missing the PostHog assets origin.'
);

const preflightResponse = await fetch(`${baseUrl}/api/token/refresh`, {
  method: 'OPTIONS',
  headers: {
    Origin: mobileOrigin,
    'Access-Control-Request-Method': 'POST',
    'Access-Control-Request-Headers': 'authorization,content-type,x-installation-id,x-request-id',
  },
});

assert(preflightResponse.status === 204, `Preflight returned ${preflightResponse.status}.`);
assert(
  preflightResponse.headers.get('access-control-allow-origin') === mobileOrigin,
  'Preflight did not return the configured mobile origin.'
);

const statusResponse = await fetch(`${baseUrl}/api/status`, {
  headers: { Origin: mobileOrigin },
});
assert(
  !statusResponse.headers.has('access-control-allow-origin'),
  '/api/status unexpectedly enables external CORS.'
);

console.log(JSON.stringify({ ok: true, baseUrl, mobileOrigin, posthogHost }, null, 2));
