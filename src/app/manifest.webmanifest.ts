import { createFileRoute } from '@tanstack/react-router';
import { buildManifestResponse } from './manifest[.]json';

export const Route = createFileRoute('/manifest/webmanifest')({
  server: {
    handlers: {
      GET: buildManifestResponse,
    },
  },
});
