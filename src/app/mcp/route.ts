import { NextResponse } from 'next/server';
import { WEB_MCP_TOOLS } from '@/lib/agent-tools';
import { appRoutes } from '@/lib/routes';
import { getSiteUrl } from '@/lib/site';

export const dynamic = 'force-dynamic';

type JsonRpcRequest = {
  id?: string | number | null;
  method?: string;
  params?: Record<string, unknown>;
};

function jsonRpcResult(id: JsonRpcRequest['id'], result: unknown): Response {
  return NextResponse.json({
    jsonrpc: '2.0',
    id: id ?? null,
    result,
  });
}

function jsonRpcError(
  id: JsonRpcRequest['id'],
  code: number,
  message: string
): Response {
  return NextResponse.json(
    {
      jsonrpc: '2.0',
      id: id ?? null,
      error: {
        code,
        message,
      },
    },
    { status: 400 }
  );
}

async function callTool(name: string, input: Record<string, unknown>) {
  const siteUrl = getSiteUrl();

  switch (name) {
    case 'open_dashboard':
      return {
        content: [{ type: 'text', text: `${siteUrl}${appRoutes.dashboard()}` }],
        structuredContent: {
          url: `${siteUrl}${appRoutes.dashboard()}`,
        },
      };
    case 'search_site': {
      const query = typeof input.query === 'string' ? input.query : '';
      return {
        content: [{ type: 'text', text: `${siteUrl}${appRoutes.explore({ q: query })}` }],
        structuredContent: {
          url: `${siteUrl}${appRoutes.explore({ q: query })}`,
          query,
        },
      };
    }
    case 'open_monthly_report': {
      const month = typeof input.month === 'string' ? input.month : '';
      return {
        content: [{ type: 'text', text: `${siteUrl}${appRoutes.reportMonth(month)}` }],
        structuredContent: {
          url: `${siteUrl}${appRoutes.reportMonth(month)}`,
          month,
        },
      };
    }
    case 'open_station': {
      const stationId = typeof input.stationId === 'string' ? input.stationId : '';
      return {
        content: [{ type: 'text', text: `${siteUrl}${appRoutes.stationDetail(stationId)}` }],
        structuredContent: {
          url: `${siteUrl}${appRoutes.stationDetail(stationId)}`,
          stationId,
        },
      };
    }
    case 'get_system_status': {
      const { fetchStatus } = await import('@/lib/api');
      const status = await fetchStatus();
      return {
        content: [{ type: 'text', text: JSON.stringify(status) }],
        structuredContent: status,
      };
    }
    case 'list_published_reports': {
      const { fetchAvailableDataMonths } = await import('@/lib/api');
      const months = await fetchAvailableDataMonths();
      const reports = months.months.map((month) => ({
        month,
        url: `${siteUrl}${appRoutes.reportMonth(month)}`,
      }));
      return {
        content: [{ type: 'text', text: JSON.stringify(reports) }],
        structuredContent: reports,
      };
    }
    case 'get_station_snapshot': {
      const stationId = typeof input.stationId === 'string' ? input.stationId : '';
      const { fetchStations } = await import('@/lib/api');
      const payload = await fetchStations();
      const station = payload.stations.find((entry) => entry.id === stationId) ?? null;
      return {
        content: [{ type: 'text', text: JSON.stringify(station) }],
        structuredContent: station,
      };
    }
    default:
      return null;
  }
}

const MCP_SERVER_TOOLS = [
  ...WEB_MCP_TOOLS,
  {
    name: 'get_system_status',
    description: 'Read the latest public status payload.',
    inputSchema: {
      type: 'object',
      additionalProperties: false,
      properties: {},
    },
  },
  {
    name: 'list_published_reports',
    description: 'List published monthly report URLs.',
    inputSchema: {
      type: 'object',
      additionalProperties: false,
      properties: {},
    },
  },
  {
    name: 'get_station_snapshot',
    description: 'Read a station entry from the public stations payload.',
    inputSchema: {
      type: 'object',
      additionalProperties: false,
      required: ['stationId'],
      properties: {
        stationId: {
          type: 'string',
          minLength: 1,
        },
      },
    },
  },
];

export async function POST(request: Request): Promise<Response> {
  const body = (await request.json().catch(() => null)) as JsonRpcRequest | null;
  if (!body?.method) {
    return jsonRpcError(body?.id, -32600, 'Invalid JSON-RPC request.');
  }

  switch (body.method) {
    case 'initialize':
      return jsonRpcResult(body.id, {
        protocolVersion: '2025-03-26',
        serverInfo: {
          name: 'BiziDashboard MCP',
          version: '0.1.0',
        },
        capabilities: {
          tools: {},
        },
      });
    case 'tools/list':
      return jsonRpcResult(body.id, {
        tools: MCP_SERVER_TOOLS,
      });
    case 'tools/call': {
      const name = typeof body.params?.name === 'string' ? body.params.name : '';
      const input =
        body.params && typeof body.params.arguments === 'object' && body.params.arguments
          ? (body.params.arguments as Record<string, unknown>)
          : {};
      const result = await callTool(name, input);
      if (!result) {
        return jsonRpcError(body.id, -32601, `Unknown tool: ${name}`);
      }
      return jsonRpcResult(body.id, result);
    }
    default:
      return jsonRpcError(body.id, -32601, `Unsupported method: ${body.method}`);
  }
}
