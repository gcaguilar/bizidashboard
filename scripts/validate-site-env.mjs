const appUrl = process.env.APP_URL?.trim() ?? '';
const robotsBaseUrl = process.env.ROBOTS_BASE_URL?.trim() ?? '';

function isValidHttpUrl(value) {
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
}

function assertValid(name, value) {
  if (!value) {
    throw new Error(`${name} is required in CI to avoid canonical/robots fallback URLs.`);
  }
  if (!isValidHttpUrl(value)) {
    throw new Error(`${name} must be a valid absolute HTTP(S) URL.`);
  }
  if (value.includes('localhost')) {
    throw new Error(`${name} must not contain localhost in CI.`);
  }
}

try {
  assertValid('APP_URL', appUrl);
  assertValid('ROBOTS_BASE_URL', robotsBaseUrl);
  console.log(
    JSON.stringify(
      {
        ok: true,
        appUrl,
        robotsBaseUrl,
      },
      null,
      2
    )
  );
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}
