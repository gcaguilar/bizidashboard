export type UmamiRuntimeConfig = {
  scriptSrc: string
  websiteId: string
  hostUrl: string
}

export function resolveUmamiRuntimeConfig(
  env: Record<string, string | undefined>,
): UmamiRuntimeConfig | null {
  if (env.NODE_ENV !== 'production') {
    return null
  }

  const scriptSrc =
    env.UMAMI_SCRIPT_SRC?.trim() ||
    env.VITE_UMAMI_SCRIPT_SRC?.trim() ||
    env.NEXT_PUBLIC_UMAMI_SCRIPT_SRC?.trim() ||
    ''
  const websiteId =
    env.UMAMI_WEBSITE_ID?.trim() ||
    env.VITE_UMAMI_WEBSITE_ID?.trim() ||
    env.NEXT_PUBLIC_UMAMI_WEBSITE_ID?.trim() ||
    ''
  const hostUrl =
    env.UMAMI_HOST_URL?.trim() ||
    env.VITE_UMAMI_HOST_URL?.trim() ||
    env.NEXT_PUBLIC_UMAMI_HOST_URL?.trim() ||
    ''

  return scriptSrc && websiteId && hostUrl
    ? { scriptSrc, websiteId, hostUrl }
    : null
}
