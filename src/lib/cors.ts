const DEFAULT_ALLOWED_ORIGINS = [
  'https://datosbizi.com',
  'https://www.datosbizi.com',
];

const MOBILE_ALLOWED_ORIGINS = [
  ...DEFAULT_ALLOWED_ORIGINS,
  'capac://bizidashboard',
  'capacitor://localhost',
  'http://localhost',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'ionic://localhost',
];

export function getCorsHeaders(origin: string | null, mode: 'mobile' | 'public'): Record<string, string> {
  const allowed = mode === 'mobile' ? MOBILE_ALLOWED_ORIGINS : DEFAULT_ALLOWED_ORIGINS;

  if (origin && allowed.includes(origin)) {
    return {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Installation-Id, X-Forwarded-For, X-Real-IP',
      'Access-Control-Allow-Credentials': 'true',
    };
  }

  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

export function getMobileCorsHeaders(origin: string | null): Record<string, string> {
  return getCorsHeaders(origin, 'mobile');
}

export function getPublicCorsHeaders(origin: string | null): Record<string, string> {
  return getCorsHeaders(origin, 'public');
}
