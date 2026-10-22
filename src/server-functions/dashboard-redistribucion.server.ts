import { fetchDistrictCollection } from '@/lib/districts.server';

export type DashboardRebalancingPageData = {
  districtNames: string[];
};

/**
 * Cabecera de la pagina (barrios). Los parametros de tabla viven en la URL y
 * los lee la ruta, asi que cambiar de pagina u orden no relanza el loader. El
 * informe completo lo pide el cliente al montar, asi que el SSR no carga ni
 * compacta el informe.
 *
 * Vive en un modulo `.server` porque importa `districts.server`: el server
 * function solo lo usa dentro del handler, que el compilador extrae a servidor,
 * de modo que este modulo no entra en el bundle de cliente.
 */
export async function loadDashboardRebalancingPageData(): Promise<DashboardRebalancingPageData> {
  const districtCollection = await fetchDistrictCollection().catch(() => null);

  const districtNames = districtCollection
    ? [...new Set(districtCollection.features
        .map((feature) => feature.properties?.distrito)
        .filter((district): district is string => typeof district === 'string')
      )].sort((left, right) => left.localeCompare(right, 'es'))
    : [];

  return { districtNames };
}
