import { appRoutes } from '@/lib/routes';

export const WEB_MCP_TOOLS = [
  {
    name: 'open_dashboard',
    description: 'Open the live Bizi dashboard.',
    inputSchema: {
      type: 'object',
      additionalProperties: false,
      properties: {},
    },
  },
  {
    name: 'search_site',
    description: 'Open the public search experience with a query.',
    inputSchema: {
      type: 'object',
      additionalProperties: false,
      required: ['query'],
      properties: {
        query: {
          type: 'string',
          minLength: 1,
          description: 'Search query for the public explorer page.',
        },
      },
    },
  },
  {
    name: 'open_monthly_report',
    description: 'Open a published monthly report page.',
    inputSchema: {
      type: 'object',
      additionalProperties: false,
      required: ['month'],
      properties: {
        month: {
          type: 'string',
          pattern: '^\\d{4}-\\d{2}$',
          description: 'Month key in YYYY-MM format.',
        },
      },
    },
  },
  {
    name: 'open_station',
    description: 'Open the public station detail page.',
    inputSchema: {
      type: 'object',
      additionalProperties: false,
      required: ['stationId'],
      properties: {
        stationId: {
          type: 'string',
          minLength: 1,
          description: 'Station identifier.',
        },
      },
    },
  },
] as const;

export function resolveToolNavigationTarget(
  toolName: string,
  input: Record<string, unknown>
): string | null {
  switch (toolName) {
    case 'open_dashboard':
      return appRoutes.dashboard();
    case 'search_site':
      return appRoutes.explore({ q: typeof input.query === 'string' ? input.query : null });
    case 'open_monthly_report':
      return typeof input.month === 'string' ? appRoutes.reportMonth(input.month) : null;
    case 'open_station':
      return typeof input.stationId === 'string'
        ? appRoutes.stationDetail(input.stationId)
        : null;
    default:
      return null;
  }
}
