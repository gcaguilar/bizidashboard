/**
 * Configuracion del agente social, leida del entorno.
 *
 * `parseSocialConfig` es puro y no se ejecuta al importar el modulo. El getter
 * memoizado valida cuando alguien lo usa, para que un despliegue con una
 * variable mal escrita falle con un mensaje claro en el arranque del job y no
 * durante la carga de modulos (Vitest, build, rutas publicas).
 */

import { TIMEZONE } from '@/lib/timezone';

export const DEFAULT_SOCIAL_STATE_DB = '/app/data/social.sqlite';
export const DEFAULT_SOCIAL_CATCHUP_MINUTES = 120;
export const DEFAULT_TMPFILES_EXPIRE_SECONDS = 7200;

export type SocialConfig = {
  enabled: boolean;
  city: string;
  timezone: string;
  stateDbPath: string;
  dryRun: boolean;
  imageHost: string;
  bufferApiKey: string | null;
  bufferChannelId: string | null;
  tmpfilesExpireSeconds: number;
  catchupMinutes: number;
};

type SocialEnv = Readonly<Record<string, string | undefined>>;

const TRUE_VALUES = new Set(['1', 'true', 'yes', 'on']);
const FALSE_VALUES = new Set(['0', 'false', 'no', 'off', '']);

function readString(env: SocialEnv, key: string, fallback: string): string {
  const value = env[key]?.trim();
  return value ? value : fallback;
}

function readOptionalString(env: SocialEnv, key: string): string | null {
  const value = env[key]?.trim();
  return value ? value : null;
}

function readBoolean(env: SocialEnv, key: string, fallback: boolean): boolean {
  const raw = env[key];
  if (raw === undefined) {
    return fallback;
  }

  const value = raw.trim().toLowerCase();
  if (value === '') {
    return fallback;
  }

  if (TRUE_VALUES.has(value)) {
    return true;
  }

  if (FALSE_VALUES.has(value)) {
    return false;
  }

  throw new Error(`${key} must be a boolean (1/0, true/false, yes/no, on/off)`);
}

function readInteger(
  env: SocialEnv,
  key: string,
  fallback: number,
  options: { min: number; max: number }
): number {
  const raw = env[key]?.trim();
  if (!raw) {
    return fallback;
  }

  const value = Number(raw);
  if (!Number.isInteger(value) || value < options.min || value > options.max) {
    throw new Error(
      `${key} must be an integer between ${options.min} and ${options.max}`
    );
  }

  return value;
}

function assertTimezone(timezone: string): void {
  try {
    new Intl.DateTimeFormat('en-GB', { timeZone: timezone }).format(new Date());
  } catch {
    throw new Error(`SOCIAL_TIMEZONE is not a valid IANA timezone: ${timezone}`);
  }
}

export function parseSocialConfig(env: SocialEnv = process.env): SocialConfig {
  const timezone = readString(env, 'SOCIAL_TIMEZONE', TIMEZONE);
  assertTimezone(timezone);

  return {
    enabled: readBoolean(env, 'SOCIAL_ENABLED', false),
    city: readString(env, 'SOCIAL_CITY', 'zaragoza'),
    timezone,
    stateDbPath: readString(env, 'SOCIAL_STATE_DB', DEFAULT_SOCIAL_STATE_DB),
    dryRun: readBoolean(env, 'SOCIAL_DRY_RUN', false),
    imageHost: readString(env, 'SOCIAL_IMAGE_HOST', 'tmpfiles'),
    bufferApiKey: readOptionalString(env, 'BUFFER_API_KEY'),
    bufferChannelId: readOptionalString(env, 'BUFFER_CHANNEL_ID'),
    tmpfilesExpireSeconds: readInteger(
      env,
      'TMPFILES_EXPIRE_SECONDS',
      DEFAULT_TMPFILES_EXPIRE_SECONDS,
      // tmpfiles acepta como maximo 48 h (172800 s).
      { min: 60, max: 172_800 }
    ),
    catchupMinutes: readInteger(
      env,
      'SOCIAL_CATCHUP_MINUTES',
      DEFAULT_SOCIAL_CATCHUP_MINUTES,
      { min: 0, max: 1440 }
    ),
  };
}

/**
 * El schema de Prisma lo decide `CITY`, no `SOCIAL_CITY`; y todas las lecturas
 * de analitica estan fijadas a Europe/Madrid. Si el contenedor se configura
 * con otra ciudad u otra zona, podria publicar datos de Madrid en la cuenta de
 * Zaragoza o mover las ventanas de fecha. Falla antes de abrir el estado.
 */
export function validateSocialRuntimeConfig(
  config: Pick<SocialConfig, 'city' | 'timezone'>,
  env: Readonly<Record<string, string | undefined>> = process.env
): void {
  const deploymentCity = (env.CITY?.trim() || 'zaragoza').toLowerCase();
  const socialCity = config.city.trim().toLowerCase();

  if (socialCity !== deploymentCity) {
    throw new Error(
      `SOCIAL_CITY "${config.city}" does not match CITY "${deploymentCity}"; the social service must read and post the same city`
    );
  }

  if (config.timezone !== TIMEZONE) {
    throw new Error(
      `SOCIAL_TIMEZONE "${config.timezone}" must be ${TIMEZONE}; analytics windows are fixed to that timezone`
    );
  }
}

let cachedConfig: SocialConfig | null = null;

/** Configuracion memoizada; se valida en el primer uso real. */
export function getSocialConfig(): SocialConfig {
  if (!cachedConfig) {
    cachedConfig = parseSocialConfig();
  }

  return cachedConfig;
}

/** Solo para tests o para releer el entorno tras un cambio controlado. */
export function resetSocialConfig(): void {
  cachedConfig = null;
}
