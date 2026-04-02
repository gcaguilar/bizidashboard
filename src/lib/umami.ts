export type UmamiEventValue = string | number | boolean | null | undefined;

type UmamiEventPayload = Record<string, UmamiEventValue>;

declare global {
  interface Window {
    umami?: {
      track: (eventName: string, payload?: UmamiEventPayload) => void;
    };
  }
}

function sanitizePayload(
  payload: UmamiEventPayload | undefined
): UmamiEventPayload | undefined {
  if (!payload) {
    return undefined;
  }

  const sanitizedEntries = Object.entries(payload).filter(([, value]) => value !== undefined);

  return sanitizedEntries.length > 0
    ? Object.fromEntries(sanitizedEntries)
    : undefined;
}

export function trackUmamiEvent(
  eventName: string,
  payload?: UmamiEventPayload
): void {
  if (typeof window === 'undefined') {
    return;
  }

  window.umami?.track(eventName, sanitizePayload(payload));
}
