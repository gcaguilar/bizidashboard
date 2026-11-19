/**
 * Runtime configuration for PostHog Cloud EU.
 *
 * Resolved on the server so the same Docker image can be promoted across
 * environments. The project token is public (it is not a secret), but it is
 * only exposed to the browser when a key has been configured explicitly.
 */

export type PostHogRuntimeConfig = {
  key: string;
  host: string;
  uiHost: string;
};

export const DEFAULT_POSTHOG_HOST = 'https://eu.i.posthog.com';
export const DEFAULT_POSTHOG_UI_HOST = 'https://eu.posthog.com';

function resolveHttpsOrigin(value: string | undefined, fallback: string): string | null {
  const candidate = value?.trim() || fallback;

  try {
    const url = new URL(candidate);
    return url.protocol === 'https:' ? url.origin : null;
  } catch {
    return null;
  }
}

export function resolvePostHogRuntimeConfig(
  env: Record<string, string | undefined>,
): PostHogRuntimeConfig | null {
  // Development and test runs must never report to a real PostHog project.
  if (env.NODE_ENV !== 'production') {
    return null;
  }

  const key = env.POSTHOG_KEY?.trim();
  if (!key) {
    return null;
  }

  const host = resolveHttpsOrigin(env.POSTHOG_HOST, DEFAULT_POSTHOG_HOST);
  const uiHost = resolveHttpsOrigin(env.POSTHOG_UI_HOST, DEFAULT_POSTHOG_UI_HOST);

  if (!host || !uiHost) {
    return null;
  }

  return { key, host, uiHost };
}
