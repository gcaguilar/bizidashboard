export type SecurityEnvironment = Record<string, string | undefined>;

export type ExternalServiceConfig = {
  umamiScriptSrc: string;
  umamiWebsiteId: string;
  umamiHostUrl: string;
  sentryDsn: string;
};

export function resolveExternalServiceConfig(
  env?: SecurityEnvironment
): ExternalServiceConfig;

export function buildContentSecurityPolicy(
  env?: SecurityEnvironment
): string;

export function getContentSecurityPolicyHeader(
  env?: SecurityEnvironment
): 'Content-Security-Policy' | 'Content-Security-Policy-Report-Only';
