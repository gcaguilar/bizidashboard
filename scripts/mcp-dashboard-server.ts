import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import * as z from 'zod/v4'
import { DashboardApiClient } from '../src/mcp/dashboard-api-client'
import { generateDashboard } from '../src/mcp/dashboard-generator'
import {
  buildDashboardSpec,
  type CustomWidgetDefinition,
  type DashboardPlannerOptions,
  type RankingType
} from '../src/mcp/dashboard-planner'

const DEFAULT_API_BASE_URL =
  process.env.BIZIDASHBOARD_API_BASE_URL ??
  process.env.APP_URL ??
  'http://localhost:3000'

function parseTimeoutMs(rawValue: string | undefined): number {
  if (!rawValue) {
    return 20_000
  }

  const parsed = Number.parseInt(rawValue, 10)

  if (!Number.isInteger(parsed) || parsed < 1_000 || parsed > 120_000) {
    return 20_000
  }

  return parsed
}

const API_TIMEOUT_MS = parseTimeoutMs(process.env.BIZIDASHBOARD_API_TIMEOUT_MS)

const customWidgetSchema = z.object({
  id: z
    .string()
    .min(1)
    .max(40)
    .describe('Custom widget identifier. Prefer lowercase and underscore.'),
  title: z.string().min(1).max(100).describe('Widget title shown on dashboard.'),
  description: z
    .string()
    .max(220)
    .optional()
    .describe('Optional widget description.'),
  sourceEndpoint: z
    .enum(['status', 'stations', 'rankings', 'alerts', 'patterns', 'heatmap', 'mobility'])
    .describe('Endpoint that provides source data for this custom widget.'),
  sourceParams: z
    .record(z.string(), z.union([z.string(), z.number().int()]))
    .optional()
    .describe('Optional query params used when fetching source endpoint data.'),
  mode: z
    .enum(['kpi', 'table', 'timeseries'])
    .describe('Renderer mode for this widget.'),
  valuePath: z
    .string()
    .optional()
    .describe('For kpi mode: JSON path to scalar value (example: pipeline.totalRowsCollected).'),
  collectionPath: z
    .string()
    .optional()
    .describe('For table/timeseries mode: JSON path to rows array.'),
  xKey: z
    .string()
    .optional()
    .describe('For timeseries mode: x-axis field name.'),
  yKey: z
    .string()
    .optional()
    .describe('For timeseries mode: y-axis numeric field name.'),
  limit: z
    .number()
    .int()
    .min(1)
    .max(200)
    .optional()
    .describe('For table mode: maximum number of rows to display.')
})

function createApiClient(apiBaseUrl?: string): DashboardApiClient {
  return new DashboardApiClient({
    baseUrl: apiBaseUrl ?? DEFAULT_API_BASE_URL,
    timeoutMs: API_TIMEOUT_MS
  })
}

function toJsonText(payload: unknown): string {
  return JSON.stringify(payload, null, 2)
}

function toolSuccess(payload: unknown) {
  const structuredContent =
    typeof payload === 'object' && payload !== null && !Array.isArray(payload)
      ? (payload as Record<string, unknown>)
      : { result: payload }

  return {
    content: [{ type: 'text' as const, text: toJsonText(payload) }],
    structuredContent
  }
}

function toolFailure(error: unknown) {
  const message = error instanceof Error ? error.message : String(error)

  return {
    isError: true,
    content: [{ type: 'text' as const, text: message }]
  }
}

async function executeTool(task: () => Promise<unknown>) {
  try {
    const payload = await task()
    return toolSuccess(payload)
  } catch (error) {
    return toolFailure(error)
  }
}

function plannerOptionsFromInput(input: {
  stationId?: string
  rankLimit?: number
  alertLimit?: number
  mobilityDays?: number
  demandDays?: number
  customWidgets?: CustomWidgetDefinition[]
}): DashboardPlannerOptions {
  return {
    stationId: input.stationId,
    rankLimit: input.rankLimit,
    alertLimit: input.alertLimit,
    mobilityDays: input.mobilityDays,
    demandDays: input.demandDays,
    customWidgets: input.customWidgets
  }
}

const server = new McpServer(
  {
    name: 'bizidashboard-mcp',
    version: '0.1.0'
  },
  {
    instructions:
      'Use these tools to query BiziDashboard API endpoints and build dashboard specs from natural-language requests.'
  }
)

server.registerTool(
  'get_status',
  {
    description: 'Get ingestion and pipeline health metrics.',
    inputSchema: {
      apiBaseUrl: z
        .string()
        .url()
        .optional()
        .describe('Optional override for the API base URL.')
    }
  },
  async ({ apiBaseUrl }) => executeTool(() => createApiClient(apiBaseUrl).getStatus())
)

server.registerTool(
  'get_stations',
  {
    description: 'Get current station availability and coordinates.',
    inputSchema: {
      apiBaseUrl: z
        .string()
        .url()
        .optional()
        .describe('Optional override for the API base URL.')
    }
  },
  async ({ apiBaseUrl }) =>
    executeTool(() => createApiClient(apiBaseUrl).getStations())
)

server.registerTool(
  'get_rankings',
  {
    description: 'Get station rankings by turnover or availability.',
    inputSchema: {
      type: z
        .enum(['turnover', 'availability'])
        .default('availability')
        .describe('Ranking type.'),
      limit: z
        .number()
        .int()
        .min(1)
        .max(100)
        .default(20)
        .describe('Maximum number of ranking rows.'),
      apiBaseUrl: z
        .string()
        .url()
        .optional()
        .describe('Optional override for the API base URL.')
    }
  },
  async ({ type, limit, apiBaseUrl }) =>
    executeTool(() =>
      createApiClient(apiBaseUrl).getRankings(type as RankingType, limit)
    )
)

server.registerTool(
  'get_alerts',
  {
    description: 'Get active alerts for stations.',
    inputSchema: {
      limit: z
        .number()
        .int()
        .min(1)
        .max(200)
        .default(50)
        .describe('Maximum number of active alerts.'),
      apiBaseUrl: z
        .string()
        .url()
        .optional()
        .describe('Optional override for the API base URL.')
    }
  },
  async ({ limit, apiBaseUrl }) =>
    executeTool(() => createApiClient(apiBaseUrl).getAlerts(limit))
)

server.registerTool(
  'get_patterns',
  {
    description: 'Get hourly weekday/weekend patterns for one station.',
    inputSchema: {
      stationId: z.string().min(1).describe('Station identifier.'),
      apiBaseUrl: z
        .string()
        .url()
        .optional()
        .describe('Optional override for the API base URL.')
    }
  },
  async ({ stationId, apiBaseUrl }) =>
    executeTool(() => createApiClient(apiBaseUrl).getPatterns(stationId))
)

server.registerTool(
  'get_heatmap',
  {
    description: 'Get occupancy heatmap cells for one station.',
    inputSchema: {
      stationId: z.string().min(1).describe('Station identifier.'),
      apiBaseUrl: z
        .string()
        .url()
        .optional()
        .describe('Optional override for the API base URL.')
    }
  },
  async ({ stationId, apiBaseUrl }) =>
    executeTool(() => createApiClient(apiBaseUrl).getHeatmap(stationId))
)

server.registerTool(
  'get_mobility',
  {
    description: 'Get mobility signals and demand curve insights.',
    inputSchema: {
      mobilityDays: z
        .number()
        .int()
        .min(1)
        .max(90)
        .default(14)
        .describe('Lookback window in days for hourly mobility signals.'),
      demandDays: z
        .number()
        .int()
        .min(1)
        .max(120)
        .default(30)
        .describe('Lookback window in days for demand curve.'),
      apiBaseUrl: z
        .string()
        .url()
        .optional()
        .describe('Optional override for the API base URL.')
    }
  },
  async ({ mobilityDays, demandDays, apiBaseUrl }) =>
    executeTool(() =>
      createApiClient(apiBaseUrl).getMobility(mobilityDays, demandDays)
    )
)

server.registerTool(
  'build_dashboard_spec',
  {
    description:
      'Build a dynamic dashboard specification from natural-language requirements.',
    inputSchema: {
      request: z
        .string()
        .min(1)
        .describe('Natural-language request describing the desired dashboard.'),
      stationId: z
        .string()
        .optional()
        .describe('Optional stationId override for patterns/heatmap widgets.'),
      rankLimit: z
        .number()
        .int()
        .min(1)
        .max(100)
        .optional()
        .describe('Optional ranking size override.'),
      alertLimit: z
        .number()
        .int()
        .min(1)
        .max(200)
        .optional()
        .describe('Optional alert list size override.'),
      mobilityDays: z
        .number()
        .int()
        .min(1)
        .max(90)
        .optional()
        .describe('Optional lookback days override for mobility signals.'),
      demandDays: z
        .number()
        .int()
        .min(1)
        .max(120)
        .optional()
        .describe('Optional lookback days override for demand curve.'),
      customWidgets: z
        .array(customWidgetSchema)
        .max(8)
        .optional()
        .describe('Optional ad-hoc widget definitions built from existing endpoint data.')
    }
  },
  async ({
    request,
    stationId,
    rankLimit,
    alertLimit,
    mobilityDays,
    demandDays,
    customWidgets
  }) =>
    executeTool(async () =>
      buildDashboardSpec(
        request,
        plannerOptionsFromInput({
          stationId,
          rankLimit,
          alertLimit,
          mobilityDays,
          demandDays,
          customWidgets
        })
      )
    )
)

server.registerTool(
  'generate_dashboard',
  {
    description:
      'Build a dashboard specification and fetch live data for each widget.',
    inputSchema: {
      request: z
        .string()
        .min(1)
        .describe('Natural-language request describing the dashboard content.'),
      stationId: z
        .string()
        .optional()
        .describe('Optional stationId override for patterns/heatmap widgets.'),
      rankLimit: z
        .number()
        .int()
        .min(1)
        .max(100)
        .optional()
        .describe('Optional ranking size override.'),
      alertLimit: z
        .number()
        .int()
        .min(1)
        .max(200)
        .optional()
        .describe('Optional alert list size override.'),
      mobilityDays: z
        .number()
        .int()
        .min(1)
        .max(90)
        .optional()
        .describe('Optional lookback days override for mobility signals.'),
      demandDays: z
        .number()
        .int()
        .min(1)
        .max(120)
        .optional()
        .describe('Optional lookback days override for demand curve.'),
      customWidgets: z
        .array(customWidgetSchema)
        .max(8)
        .optional()
        .describe('Optional ad-hoc widget definitions built from existing endpoint data.'),
      apiBaseUrl: z
        .string()
        .url()
        .optional()
        .describe('Optional override for the API base URL.')
    }
  },
  async ({
    request,
    stationId,
    rankLimit,
    alertLimit,
    mobilityDays,
    demandDays,
    customWidgets,
    apiBaseUrl
  }) =>
    executeTool(() =>
      generateDashboard(request, createApiClient(apiBaseUrl), {
        stationId,
        rankLimit,
        alertLimit,
        mobilityDays,
        demandDays,
        customWidgets
      })
    )
)

async function main() {
  const transport = new StdioServerTransport()
  await server.connect(transport)
  console.error(
    `[bizidashboard-mcp] running on stdio with API base URL: ${DEFAULT_API_BASE_URL}`
  )
}

main().catch((error) => {
  console.error('[bizidashboard-mcp] fatal error', error)
  process.exit(1)
})
