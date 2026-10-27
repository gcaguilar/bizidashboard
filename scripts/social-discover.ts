/**
 * Lista las organizaciones y canales de Buffer para rellenar
 * `BUFFER_CHANNEL_ID`. Solo lectura: no publica nada.
 *
 * Uso: bun scripts/social-discover.ts
 */

import { createBufferClient } from '@/lib/social/buffer';
import { getSocialConfig } from '@/lib/social/config';

async function main(): Promise<void> {
  const config = getSocialConfig();

  if (!config.bufferApiKey) {
    console.error('BUFFER_API_KEY no esta configurada.');
    process.exitCode = 1;
    return;
  }

  const client = createBufferClient(config);
  const organizations = await client.listOrganizations();

  if (organizations.length === 0) {
    console.log('Buffer no devolvio organizaciones para esta clave.');
    return;
  }

  for (const organization of organizations) {
    console.log(`\nOrganizacion: ${organization.name} (${organization.id})`);
    const channels = await client.listChannels(organization.id);

    if (channels.length === 0) {
      console.log('  (sin canales)');
      continue;
    }

    for (const channel of channels) {
      console.log(
        `  - ${channel.id} · ${channel.name} · ${channel.service ?? 'servicio desconocido'}`
      );
    }
  }

  console.log('\nCopia el id del canal de Instagram en BUFFER_CHANNEL_ID.');
}

void main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
