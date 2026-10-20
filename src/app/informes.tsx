import { Outlet, createFileRoute } from '@tanstack/react-router';

/**
 * Layout del archivo de informes. El loader del archivo vive en
 * `informes/index.tsx` para que `/informes/$month` no pague tambien la carga
 * del indice, y viceversa.
 */
export const Route = createFileRoute('/informes')({
  component: InformesLayout,
});

function InformesLayout() {
  return <Outlet />;
}
