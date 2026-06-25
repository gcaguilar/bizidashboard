const args = process.argv.slice(2);
const baseUrlIndex = args.indexOf('--base-url');
const baseUrl = (
  baseUrlIndex >= 0 ? args[baseUrlIndex + 1] : process.env.PLAYWRIGHT_BASE_URL
)?.replace(/\/$/, '');
const mobileOrigin = process.env.SMOKE_MOBILE_ORIGIN?.trim();
const umamiScriptSrc = process.env.UMAMI_SCRIPT_SRC?.trim();
const umamiWebsiteId = process.env.UMAMI_WEBSITE_ID?.trim();
const umamiHostUrl = process.env.UMAMI_HOST_URL?.trim();

if (!baseUrl) {
  throw new Error('Provide --base-url or PLAYWRIGHT_BASE_URL.');
}
if (!mobileOrigin) {
  throw new Error('SMOKE_MOBILE_ORIGIN is required.');
}
if (!umamiScriptSrc || !umamiWebsiteId || !umamiHostUrl) {
  throw new Error('UMAMI_SCRIPT_SRC, UMAMI_WEBSITE_ID and UMAMI_HOST_URL are required.');
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
assert(html.includes(`src="${umamiScriptSrc}"`), 'Umami script src is missing from HTML.');
assert(html.includes(`data-website-id="${umamiWebsiteId}"`), 'Umami website id is missing from HTML.');
assert(html.includes(`data-host-url="${umamiHostUrl}"`), 'Umami host URL is missing from HTML.');
assert(csp.includes(new URL(umamiScriptSrc).origin), 'CSP is missing the Umami script origin.');
assert(csp.includes(new URL(umamiHostUrl).origin), 'CSP is missing the Umami collector origin.');

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

console.log(JSON.stringify({ ok: true, baseUrl, mobileOrigin }, null, 2));
