import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { searchGlobalContent } from '@/lib/global-search';

const GlobalSearchInputSchema = z.object({
  q: z.string().trim().max(200),
});

export type HeaderSearchResult = {
  id: string;
  group: string;
  groupTitle: string;
  title: string;
  description: string;
  href: string;
};

const MAX_RESULTS_PER_GROUP = 4;

/**
 * Búsqueda global compacta para el buscador de la cabecera. Reutiliza
 * `searchGlobalContent` y devuelve solo los campos que pinta el desplegable.
 */
export const searchHeaderContent = createServerFn({ method: 'GET' })
  .validator(GlobalSearchInputSchema)
  .handler(async ({ data: { q } }): Promise<HeaderSearchResult[]> => {
    if (q.length < 2) {
      return [];
    }

    const response = await searchGlobalContent(q, MAX_RESULTS_PER_GROUP).catch(() => null);
    if (!response) {
      return [];
    }

    return response.groups.flatMap((group) =>
      group.results.map((result) => ({
        id: result.id,
        group: group.id,
        groupTitle: group.title,
        title: result.title,
        description: result.description,
        href: result.href,
      })),
    );
  });
