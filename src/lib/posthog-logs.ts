import { PostHog } from 'posthog-node';

type LogAttributes = Record<string, boolean | number | string>;

let posthogLogsClient: PostHog | null | undefined;
let hasWarnedAboutMissingConfiguration = false;

function getPostHogLogsClient(): PostHog | null {
  if (posthogLogsClient !== undefined) {
    return posthogLogsClient;
  }

  const token = process.env.VITE_PUBLIC_POSTHOG_PROJECT_TOKEN;
  const host = process.env.VITE_PUBLIC_POSTHOG_HOST;

  if (!token || !host) {
    if (!hasWarnedAboutMissingConfiguration && process.env.NODE_ENV !== 'production') {
      const variableName = !token
        ? 'VITE_PUBLIC_POSTHOG_PROJECT_TOKEN'
        : 'VITE_PUBLIC_POSTHOG_HOST';
      console.warn(
        `${variableName} variable required by PostHog is missing or un-configured, this causes events to be silently missed. This error stops appearing once ${variableName} is configured`
      );
      hasWarnedAboutMissingConfiguration = true;
    }
    posthogLogsClient = null;
    return posthogLogsClient;
  }

  posthogLogsClient = new PostHog(token, {
    host,
    logs: {
      serviceName: 'bizidashboard-jobs',
    },
  });
  return posthogLogsClient;
}

/**
 * Emits only purpose-built job lifecycle records to PostHog Logs. Existing
 * application logger output remains on its current console and Sentry paths.
 */
export function posthogJobLog(message: string, attributes: LogAttributes): void {
  try {
    getPostHogLogsClient()?.logger.info(message, attributes);
  } catch {
    // Observability must not affect job execution.
  }
}

/** Flushes the dedicated log client during process shutdown with a short bound. */
export async function shutdownPostHogJobLogs(): Promise<void> {
  if (!posthogLogsClient) {
    return;
  }

  await posthogLogsClient.shutdown(3_000).catch(() => {
    // Observability must not delay or prevent shutdown.
  });
}
